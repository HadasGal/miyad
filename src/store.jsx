// כל הלוגיקה של האפליקציה במקום אחד.
// המסכים רק קוראים מצב ושולחים פעולות. הם לא יודעים מאיפה הנתונים מגיעים.
// כשעוברים ל-Firebase, מחליפים את הקובץ הזה בלבד.

import { createContext, useContext, useEffect, useReducer } from 'react';
import { USERS, INITIAL_ALERTS, buildInitialItems, CATEGORIES } from './data/mockData.js';
import { isDone } from './utils.js';

const STORAGE_KEY = 'miyad:v1';

// כניסה: mode הוא null (עוד לא נכנסה), 'demo' (צופה בדמו), או 'pending' (נרשמה ומחכה לאישור).
// בדמו ההרשמה מדומה. ב-Firebase: לינק למייל (Auth), והאישור של מנהלת הקהילה ב-Firestore.
const NO_SESSION = { mode: null, email: '', verified: false, name: '', street: '', phone: '' };

function initialState(session = NO_SESSION) {
  return {
    session,
    currentUserId: 'dana',
    items: buildInitialItems(),
    alerts: INITIAL_ALERTS,
    notifications: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { session: NO_SESSION, ...JSON.parse(raw) };
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

// התאמה סלחנית לעברית: מורידים סיומת אחת (רבים, סמיכות, נקבה) מכל מילה,
// כך ש"אופניים" ימצא "אופני ילדים", ו"ספרים" ימצא "ספר". עדיין לא סמנטי:
// "ספה" לא תמצא "כורסה". מחליפים את הפונקציה הזו כשיהיה AI (החלטה 8).
const SUFFIXES = ['יים', 'ים', 'ות', 'י', 'ה', 'ת'];
function stem(word) {
  for (const s of SUFFIXES) {
    if (word.endsWith(s) && word.length - s.length >= 2) return word.slice(0, -s.length);
  }
  return word;
}
// אותיות סופיות: "עציץ" ו"עציצי" צריכים להגיע לאותו שורש
const FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const unfinal = (w) => w.replace(/[ךםןףץ]/g, (c) => FINALS[c]);
const stems = (text) => text.split(/[\s,.\-–־׳"'״]+/).filter(Boolean).map((w) => unfinal(stem(w)));

export function matchesQuery(item, query) {
  const q = query.trim();
  if (!q) return false;
  const cat = CATEGORIES.find((c) => c.id === item.category)?.label ?? '';
  const text = `${item.title} ${cat}`;
  if (text.includes(q)) return true;
  const have = new Set(stems(text));
  return stems(q).every((s) => have.has(s));
}

// מה שכבר עכשיו בלוח ומתאים לחיפוש: זמין או שמור, ולא של מי שמחפשת
export function matchingItems(state, query, userId) {
  return state.items
    .filter((it) => !isDone(it.status) && it.ownerId !== userId && matchesQuery(it, query))
    .sort((a, b) => b.createdAt - a.createdAt);
}

// פריט שנסגר נשאר ב"שלי" שבוע, ורק בזמן הזה אפשר להחזיר אותו ללוח.
// בלי closedAt (נתונים ישנים מ-localStorage): מתייחסים כאילו נסגר עכשיו.
export const REOPEN_WINDOW = 7 * 24 * 60 * 60 * 1000;
export function canReopen(item, now = Date.now()) {
  return isDone(item.status) && now - (item.closedAt ?? now) < REOPEN_WINDOW;
}

// בדיקות הרשמה. כאן ולא במסך, כדי שהשרת יוכל לאכוף את אותם כללים.
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const normalizePhone = (phone) => phone.replace(/\D/g, '');
export const isValidPhone = (phone) => /^05\d{8}$/.test(normalizePhone(phone));

// הרשימות של "שלי". כאן ולא במסך, כדי שהכללים יישארו במקום אחד.
export function myLists(state, userId) {
  const mine = (it) => it.ownerId === userId;
  return {
    // מה שמסרתי: פתוח, או נסגר בשבוע האחרון
    given: state.items.filter((it) => mine(it) && (!isDone(it.status) || canReopen(it))),
    // מה ששמור לי: מוסרת בחרה בי ועוד לא נמסר
    reserved: state.items.filter((it) => !mine(it) && it.status === 'reserved' && it.chosenId === userId),
    // מה שביקשתי ועוד מחכה, או לקחתי מבחוץ
    requested: state.items.filter((it) => !mine(it)
      && !(it.status === 'reserved' && it.chosenId === userId)
      && (it.queue.some((q) => q.userId === userId) || it.takenBy === userId)),
  };
}

// "חדש" בלוח: פורסם בשעתיים האחרונות ועוד פתוח. מה שמביא לפתוח את הלוח שוב.
const NEW_WINDOW = 2 * 60 * 60 * 1000;
export const isNew = (item, now = Date.now()) => !isDone(item.status) && now - item.createdAt < NEW_WINDOW;

// מכסת פרסום: עד 5 פריטים לשעה לכל משתמשת, גם אחד אחד וגם בהעלאה מרובה.
// שומר על הלוח ועל הקבוצה מהצפה. resetsAt: מתי מתפנה המקום הבא.
export const PUBLISH_LIMIT = 5;
const PUBLISH_WINDOW = 60 * 60 * 1000;
export function publishQuota(state, userId, now = Date.now()) {
  const recent = state.items
    .filter((it) => it.ownerId === userId && now - it.createdAt < PUBLISH_WINDOW)
    .map((it) => it.createdAt)
    .sort((a, b) => a - b);
  return {
    left: Math.max(0, PUBLISH_LIMIT - recent.length),
    resetsAt: recent.length >= PUBLISH_LIMIT ? recent[recent.length - PUBLISH_LIMIT] + PUBLISH_WINDOW : now,
  };
}

function publishOne(state, me, item) {
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
    ...item,
  };
  let next = { ...state, items: [newItem, ...state.items] };
  // התראות: כל מי ששמרה חיפוש שמתאים לפריט, חוץ מהמוסרת עצמה
  for (const a of state.alerts) {
    if (a.userId !== me && matchesQuery(newItem, a.query)) {
      next = notify(next, a.userId, `מה שחיפשת הגיע: ${newItem.title}`, newItem.id);
    }
  }
  return next;
}

// התור: הבאה בתור היא הראשונה לפי הסדר שלא דילגו עליה
function nextInQueue(item, skipped) {
  return item.queue.find((q) => !skipped.includes(q.userId))?.userId ?? null;
}

// הראשונה בתור שעוד לא דילגו עליה. ברירת המחדל של המוסרת (החלטה 3).
export const firstInQueue = (item) => nextInQueue(item, item.skipped);

function reducer(state, action) {
  const me = state.currentUserId;
  const item = action.itemId ? state.items.find((i) => i.id === action.itemId) : null;

  switch (action.type) {
    case 'switchUser':
      return { ...state, currentUserId: action.userId };

    case 'publish':
      if (publishQuota(state, me).left < 1) return state;
      return publishOne(state, me, action.item);

    // העלאה מרובה: כל תמונה פריט נפרד, ולא יותר ממה שנשאר במכסה
    case 'publishMany': {
      const room = publishQuota(state, me).left;
      return action.items.slice(0, room).reduce((next, it) => publishOne(next, me, it), state);
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
      let next = updateItem(state, action.itemId, (it) => ({
        ...it,
        status: 'reserved',
        chosenId: action.userId,
      }));
      next = notify(next, action.userId, `${nameOf(me)} שמרה לך את ${item.title}`, action.itemId);
      // חריגה מהסדר: מי שהייתה לפני הנבחרת יודעת, בלי שם ובלי סיבה.
      // היא נשארת בתור, ואם הנבחרת לא תאסוף, "לא נאסף" יחזיר אליה.
      const active = item.queue.filter((q) => !item.skipped.includes(q.userId));
      const ahead = active.slice(0, active.findIndex((q) => q.userId === action.userId));
      for (const q of ahead) {
        next = notify(next, q.userId, `${item.title} נשמר כרגע למישהי אחרת. את נשארת בתור, ואם זה ישתחרר תקבלי עדכון.`, item.id);
      }
      return next;
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
      let next = updateItem(state, item.id, (it) => ({ ...it, status: 'given', closedAt: Date.now() }));
      for (const q of item.queue) {
        if (q.userId !== item.chosenId) next = notify(next, q.userId, `${item.title} כבר נמסר`, item.id);
      }
      return next;
    }

    // "מחכה בחוץ": מי שלקחה מסמנת בעצמה
    case 'take': {
      const next = updateItem(state, item.id, (it) => ({ ...it, status: 'taken', takenBy: me, closedAt: Date.now() }));
      return notify(next, item.ownerId, `${nameOf(me)} לקחה את ${item.title}`, item.id);
    }

    case 'reportGone': {
      const next = updateItem(state, item.id, (it) => ({ ...it, status: 'gone', reportedBy: me, closedAt: Date.now() }));
      return notify(next, item.ownerId, `${nameOf(me)} הגיעה ו${item.title} כבר לא שם`, item.id);
    }

    // רשת ביטחון: המוסרת מחזירה לזמין אם מישהי טעתה
    case 'stillThere':
      return updateItem(state, action.itemId, (it) => ({
        ...it, status: 'available', takenBy: null, reportedBy: null, closedAt: null,
      }));

    // המוסרת סוגרת בעצמה: נמסר או נלקח מחוץ ללוח (למשל תואם בקבוצה)
    case 'ownerClose': {
      let next = updateItem(state, item.id, (it) => ({
        ...it,
        status: it.pickup === 'outside' ? 'taken' : 'given',
        chosenId: null,
        takenBy: null,
        reportedBy: null,
        closedAt: Date.now(),
      }));
      for (const q of item.queue) {
        if (!item.skipped.includes(q.userId)) next = notify(next, q.userId, `${item.title} כבר נמסר`, item.id);
      }
      return next;
    }

    // "להחזיר ללוח" מתוך "שלי": רק המוסרת, ורק בשבוע אחרי הסגירה.
    // מי שנבחרה חוזרת להיות שמורה, אחרת זמין.
    case 'reopen': {
      if (!item || item.ownerId !== me || !canReopen(item)) return state;
      let next = updateItem(state, item.id, (it) => ({
        ...it,
        status: it.chosenId ? 'reserved' : 'available',
        takenBy: null,
        reportedBy: null,
        closedAt: null,
      }));
      for (const q of item.queue) {
        if (!item.skipped.includes(q.userId) && q.userId !== item.chosenId) {
          next = notify(next, q.userId, `${item.title} חזר ללוח`, item.id);
        }
      }
      return next;
    }

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

    // איפוס מחזיר את נתוני הדמו להתחלה, אבל לא מוציא מהדמו
    case 'reset':
      return initialState(state.session);

    case 'enterDemo':
      return { ...state, session: { ...state.session, mode: 'demo' } };

    case 'exitDemo':
      return { ...state, session: { ...state.session, mode: state.session.name ? 'pending' : null } };

    // הרשמה: מייל → לינק במייל → פרטים → ממתינה לאישור
    case 'joinEmail':
      if (!isValidEmail(action.email)) return state;
      return { ...state, session: { ...NO_SESSION, email: action.email.trim() } };

    case 'joinVerify':
      if (!state.session.email) return state;
      return { ...state, session: { ...state.session, verified: true } };

    case 'joinDetails': {
      const { name, street, phone } = action;
      if (!state.session.verified || !name.trim() || !street.trim() || !isValidPhone(phone)) return state;
      return {
        ...state,
        session: { ...state.session, name: name.trim(), street: street.trim(), phone: normalizePhone(phone), mode: 'pending' },
      };
    }

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
