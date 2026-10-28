import { useState } from 'react';
import { isNew, matchesQuery, useStore, variants } from '../store.jsx';
import { COMMUNITY, CATEGORIES } from '../data/mockData.js';
import { Photo, StatusPill } from '../components/Bits.jsx';
import Icon from '../components/Icon.jsx';
import { isDone } from '../utils.js';
import { useT } from '../i18n.jsx';

export default function Board() {
  const { state, dispatch, me } = useStore();
  const { t, L, ago } = useT();
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

  const alreadyAlert = state.alerts.some((a) => a.userId === me.id && variants(a.query).includes(q));

  const saveAlert = () => {
    dispatch({ type: 'addAlert', query: q });
    setSaved(true);
  };

  return (
    <div className="screen screen-wide">
      <header className="board-head">
        <div className="board-titles">
          <span className="muted small">{L(COMMUNITY.name)}</span>
          <h1>{t('board.title1')}<span className="mark">{t('board.titleMark')}</span>{t('board.title2')}</h1>
        </div>
        <span className="avatar avatar-accent" aria-hidden="true">{L(me.short)[0]}</span>
      </header>

      <label className="search">
        <Icon name="search" size={20} />
        <input type="search" value={query} placeholder={t('board.search')}
          aria-label={t('board.searchLabel')} onChange={(e) => { setQuery(e.target.value); setSaved(false); }} />
      </label>

      {q && !alreadyAlert && !saved && (
        <button className="alert-offer" onClick={saveAlert}>
          <Icon name="bell" size={18} />
          {t('board.alertOffer', { q })}
        </button>
      )}
      {q && (saved || alreadyAlert) && (
        <p className="alert-saved"><Icon name="check" size={18} /> {t('board.alertSaved', { q })}</p>
      )}

      <div className="chips" role="group" aria-label={t('board.categories')}>
        <button className={`chip ${cat === 'all' ? 'is-on' : ''}`} onClick={() => setCat('all')}>{t('board.all')}</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={`chip ${cat === c.id ? 'is-on' : ''}`} onClick={() => setCat(c.id)}>{L(c.label)}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <p>{q ? t('board.emptyQuery', { q }) : t('board.emptyCat')}</p>
          <a className="btn btn-primary" href="#/publish">{t('board.publishSomething')}</a>
        </div>
      ) : (
        <ul className="grid">
          {items.map((it) => (
            <li key={it.id}>
              <a href={`#/item/${it.id}`} className={`card ${isDone(it.status) ? 'is-done' : ''}`}>
                <div className="card-photo">
                  <Photo item={it} />
                  <StatusPill item={it} />
                  {isNew(it) && <span className="tag-new">{t('tag.new')}</span>}
                </div>
                <div className="card-body">
                  <span className="card-title">{L(it.title)}</span>
                  <span className="muted small">
                    {ago(it.createdAt)}
                    {it.pickup === 'outside' && !isDone(it.status) ? t('board.metaOutside') : ''}
                    {it.pickup === 'coordinate' && it.queue.length > 0 && !isDone(it.status) ? t('board.metaQueue', { n: it.queue.length }) : ''}
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
