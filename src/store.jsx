// כל הלוגיקה של האפליקציה במקום אחד.
// המסכים רק קוראים מצב ושולחים פעולות. הם לא יודעים מאיפה הנתונים מגיעים.
// כשעוברים ל-Firebase, מחליפים את הקובץ הזה בלבד.

import { createContext, useContext, useEffect, useReducer } from 'react';
import { USERS, INITIAL_ALERTS, buildInitialItems, CATEGORIES } from './data/mockData.js';

const STORAGE_KEY = 'miyad:v1';

function initialState() {
  return {
    currentUserId: 'dana',
    items: buildInitialItems(),
    alerts: INITIAL_ALERTS,
    notifications: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // אחסון חסום או פגום: מתחילים מחדש
  }
  return initialState();
}

const uid = () => Math.random().toString(36).slice(2, 10);
const nameOf = (id) => USERS.find((u) => u.id === id)?.short ?? '';

function notify(state, userId, text, itemId) {
  if (!userId) return state;
  return {
    ...state,
    notifications: [
      { id: uid(), userId, text, itemId, at: Date.now(), read: false },
      ...state.notifications,
    ],
  };
}

function updateItem(state, id, fn) {
  return { ...state, items: state.items.map((it) => (it.id === id ? fn(it) : it)) };
}

function matchesAlert(item, query) {
  const q = query.trim();
  if (!q) return false;
  const cat = CATEGORIES.find((c) => c.id === item.category)?.label ?? '';
  return item.title.includes(q) || cat.includes(q);
}

// התור: הבאה בתור היא הראשונה לפי הסדר שלא דילגו עליה
function nextInQueue(item, skipped) {
  return item.queue.find((q) => !skipped.includes(q.userId))?.userId ?? null;
}

function reducer(state, action) {
  const me = state.currentUserId;
  const item = action.itemId ? state.items.find((i) => i.id === action.itemId) : null;

  switch (action.type) {
    case 'switchUser':
      return { ...state, currentUserId: action.userId };

    case 'publish': {
      const newItem = {
        id: uid(),
        ownerId: me,
        createdAt: Date.now(),
        status: 'available',
        chosenId: null,
        skipped: [],
        takenBy: null,
        reportedBy: null,
        queue: [],
        ...action.item,
      };
      let next = { ...state, items: [newItem, ...state.items] };
      // התראות: כל מי ששמרה חיפוש שמתאים לפריט, חוץ מהמוסרת עצמה
      for (const a of state.alerts) {
        if (a.userId !== me && matchesAlert(newItem, a.query)) {
          next = notify(next, a.userId, `מה שחיפשת הגיע: ${newItem.title}`, newItem.id);
        }
      }
      return next;
    }

    case 'request': {
      if (!item || item.queue.some((q) => q.userId === me)) return state;
      const next = updateItem(state, item.id, (it) => ({
        ...it,
        queue: [...it.queue, { userId: me, at: Date.now() }],
      }));
      return notify(next, item.ownerId, `${nameOf(me)} רוצה את ${item.title}`, item.id);
    }

    case 'cancelRequest':
      return updateItem(state, action.itemId, (it) => ({
        ...it,
        queue: it.queue.filter((q) => q.userId !== me),
      }));

    case 'choose': {
      const next = updateItem(state, action.itemId, (it) => ({
        ...it,
        status: 'reserved',
        chosenId: action.userId,
      }));
      return notify(next, action.userId, `${nameOf(me)} בחרה בך. ${item.title} שמור לך`, action.itemId);
    }

    case 'noShow': {
      const skipped = [...item.skipped, item.chosenId];
      const nextId = nextInQueue(item, skipped);
      let next = updateItem(state, item.id, (it) => ({
        ...it,
        skipped,
        chosenId: nextId,
        status: nextId ? 'reserved' : 'available',
      }));
      if (nextId) next = notify(next, nextId, `הגיע תורך: ${item.title} שמור לך`, item.id);
      return next;
    }

    case 'deliver': {
      let next = updateItem(state, item.id, (it) => ({ ...it, status: 'given' }));
      for (const q of item.queue) {
        if (q.userId !== item.chosenId) next = notify(next, q.userId, `${item.title} כבר נמסר`, item.id);
      }
      return next;
    }

    // "מחכה בחוץ": מי שלקחה מסמנת בעצמה
    case 'take': {
      const next = updateItem(state, item.id, (it) => ({ ...it, status: 'taken', takenBy: me }));
      return notify(next, item.ownerId, `${nameOf(me)} לקחה את ${item.title}`, item.id);
    }

    case 'reportGone': {
      const next = updateItem(state, item.id, (it) => ({ ...it, status: 'gone', reportedBy: me }));
      return notify(next, item.ownerId, `${nameOf(me)} הגיעה ו${item.title} כבר לא שם`, item.id);
    }

    // רשת ביטחון: המוסרת מחזירה לזמין אם מישהי טעתה
    case 'stillThere':
      return updateItem(state, action.itemId, (it) => ({
        ...it, status: 'available', takenBy: null, reportedBy: null,
      }));

    case 'addAlert':
      if (!action.query.trim()) return state;
      return { ...state, alerts: [...state.alerts, { id: uid(), userId: me, query: action.query.trim() }] };

    case 'removeAlert':
      return { ...state, alerts: state.alerts.filter((a) => a.id !== action.id) };

    case 'markRead': {
      const who = action.userId ?? me;
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.userId === who ? { ...n, read: true } : n)),
      };
    }

    case 'reset':
      return initialState();

    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // תמונות גדולות עלולות למלא את האחסון. הדמו ממשיך לעבוד גם בלי לשמור.
    }
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  const { state, dispatch } = ctx;
  const me = USERS.find((u) => u.id === state.currentUserId);
  const unread = state.notifications.filter((n) => n.userId === me.id && !n.read).length;
  return { state, dispatch, me, unread };
}

export const userById = (id) => USERS.find((u) => u.id === id);
export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES.at(-1);
