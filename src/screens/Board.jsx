import { useState } from 'react';
import { matchesQuery, useStore } from '../store.jsx';
import { COMMUNITY, CATEGORIES } from '../data/mockData.js';
import { Photo, StatusPill } from '../components/Bits.jsx';
import Icon from '../components/Icon.jsx';
import { isDone, timeAgo } from '../utils.js';

export default function Board() {
  const { state, dispatch, me } = useStore();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [saved, setSaved] = useState(false);

  const q = query.trim();
  const items = state.items
    .filter((it) => cat === 'all' || it.category === cat)
    // אותה התאמה כמו בהתראות, כדי שחיפוש והתראה לא יחשבו אחרת
    .filter((it) => !q || matchesQuery(it, q))
    // זמינים קודם, ומה שנמסר יורד לסוף
    .sort((a, b) => (isDone(a.status) - isDone(b.status)) || b.createdAt - a.createdAt);

  const alreadyAlert = state.alerts.some((a) => a.userId === me.id && a.query === q);

  const saveAlert = () => {
    dispatch({ type: 'addAlert', query: q });
    setSaved(true);
  };

  return (
    <div className="screen">
      <header className="board-head">
        <div className="board-titles">
          <span className="muted small">{COMMUNITY.name}</span>
          <h1>מה נמסר היום?</h1>
        </div>
        <span className="avatar avatar-accent" aria-hidden="true">{me.short[0]}</span>
      </header>

      <label className="search">
        <Icon name="search" size={20} />
        <input type="search" value={query} placeholder="מה את מחפשת? ספה, אופניים..."
          aria-label="חיפוש" onChange={(e) => { setQuery(e.target.value); setSaved(false); }} />
      </label>

      {q && !alreadyAlert && !saved && (
        <button className="alert-offer" onClick={saveAlert}>
          <Icon name="bell" size={18} />
          לקבל התראה כשמפרסמים „{q}“
        </button>
      )}
      {q && (saved || alreadyAlert) && (
        <p className="alert-saved"><Icon name="check" size={18} /> נעדכן אותך כשיופיע „{q}“</p>
      )}

      <div className="chips" role="group" aria-label="קטגוריות">
        <button className={`chip ${cat === 'all' ? 'is-on' : ''}`} onClick={() => setCat('all')}>הכל</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={`chip ${cat === c.id ? 'is-on' : ''}`} onClick={() => setCat(c.id)}>{c.label}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <p>עוד אין פה {q ? `„${q}“` : 'כלום בקטגוריה הזו'}.</p>
          <a className="btn btn-primary" href="#/publish">לפרסם משהו</a>
        </div>
      ) : (
        <ul className="grid">
          {items.map((it) => (
            <li key={it.id}>
              <a href={`#/item/${it.id}`} className={`card ${isDone(it.status) ? 'is-done' : ''}`}>
                <div className="card-photo">
                  <Photo item={it} />
                  <StatusPill item={it} />
                </div>
                <div className="card-body">
                  <span className="card-title">{it.title}</span>
                  <span className="muted small">
                    {timeAgo(it.createdAt)}
                    {it.pickup === 'outside' && !isDone(it.status) ? ', מחכה בחוץ' : ''}
                    {it.pickup === 'coordinate' && it.queue.length > 0 && !isDone(it.status) ? `, ${it.queue.length} בתור` : ''}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
