import { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import Icon from '../components/Icon.jsx';
import { timeAgo } from '../utils.js';

export default function Alerts() {
  const { state, dispatch, me } = useStore();
  const [query, setQuery] = useState('');

  const mine = state.notifications.filter((n) => n.userId === me.id);
  const searches = state.alerts.filter((a) => a.userId === me.id);

  // צילום של מה שהיה חדש כשנכנסנו, כדי שההדגשה תישאר בזמן הקריאה.
  // מתעדכן אם מחליפים משתמשת בזמן שהמסך פתוח.
  const unreadIds = () => new Set(mine.filter((n) => !n.read).map((n) => n.id));
  const [fresh, setFresh] = useState(() => ({ userId: me.id, ids: unreadIds() }));
  if (fresh.userId !== me.id) setFresh({ userId: me.id, ids: unreadIds() });

  // מסמנים כנקרא בכניסה. פעולה שאפשר להריץ פעמיים בלי נזק, אז StrictMode לא שובר אותה.
  useEffect(() => {
    dispatch({ type: 'markRead', userId: me.id });
  }, [dispatch, me.id]);

  const add = (e) => {
    e.preventDefault();
    dispatch({ type: 'addAlert', query });
    setQuery('');
  };

  return (
    <div className="screen">
      <h1 className="h1">התראות</h1>

      <section className="stack-8" aria-labelledby="searches-h">
        <h2 id="searches-h" className="h2">מה את מחפשת</h2>
        <p className="muted small">כשמישהי תפרסם משהו שמתאים, תקבלי התראה. בגרסה המלאה גם במייל.</p>
        <form className="search" onSubmit={add}>
          <Icon name="bell" size={20} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ספה, אופניים, מיטת תינוק" aria-label="חיפוש חדש" />
          <button className="btn-small" type="submit" disabled={!query.trim()}>שמירה</button>
        </form>
        {searches.length > 0 && (
          <ul className="saved">
            {searches.map((a) => (
              <li key={a.id} className="saved-chip">
                {a.query}
                <button aria-label={`מחיקת ${a.query}`} onClick={() => dispatch({ type: 'removeAlert', id: a.id })}>
                  <Icon name="close" size={14} stroke={2.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stack-8" aria-labelledby="feed-h">
        <h2 id="feed-h" className="h2">עדכונים</h2>
        {mine.length === 0 ? (
          <p className="muted">אין עדכונים עדיין. כשמישהי תבקש משהו שלך או תפרסם מה שחיפשת, זה יופיע כאן.</p>
        ) : (
          <ul className="list">
            {mine.map((n) => (
              <li key={n.id}>
                <a href={`#/item/${n.itemId}`} className={`note-row ${fresh.ids.has(n.id) ? 'is-new' : ''}`}>
                  <span className="note-dot" aria-hidden="true" />
                  <div className="stack-2 grow">
                    <span>{n.text}</span>
                    <span className="muted small">{timeAgo(n.at)}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
