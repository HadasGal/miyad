import { useState } from 'react';
import { myLists, useStore, userById } from '../store.jsx';
import { Photo, StatusPill } from '../components/Bits.jsx';
import { isDone, statusLabel, timeAgo } from '../utils.js';

const TABS = [
  { id: 'given', label: 'מסרתי' },
  { id: 'reserved', label: 'שמור לי' },
  { id: 'requested', label: 'ביקשתי' },
];

const EMPTY = {
  given: { text: 'עוד לא מסרת כלום.', cta: 'לפרסם משהו', href: '#/publish' },
  reserved: { text: 'עוד אין דברים ששמורים לך. כשישמרו לך משהו, זה יופיע כאן.', cta: 'לעבור על הלוח', href: '#/' },
  requested: { text: 'אין בקשות פתוחות.', cta: 'לעבור על הלוח', href: '#/' },
};

// #/mine/reserved פותח ישר את "שמור לי"
export default function Mine({ initialTab }) {
  const { state, dispatch, me } = useStore();
  const [tab, setTab] = useState(TABS.some((t) => t.id === initialTab) ? initialTab : 'given');

  const lists = myLists(state, me.id);
  const list = lists[tab];
  const empty = EMPTY[tab];

  return (
    <div className="screen">
      <h1 className="h1">שלי</h1>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'is-on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label} ({lists[t.id].length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <p>{empty.text}</p>
          <a className="btn btn-primary" href={empty.href}>{empty.cta}</a>
        </div>
      ) : (
        <ul className="list">
          {list.map((it) => (
            <li key={it.id}>
              {tab === 'given' && isDone(it.status) ? (
                <div className="list-row is-closed">
                  <div className="list-row-main" aria-disabled="true">
                    <Photo item={it} className="list-thumb" />
                    <div className="stack-2 grow">
                      <strong className="fw-500">{it.title}</strong>
                      <span className="muted small">{statusLabel(it)} {timeAgo(it.closedAt ?? it.createdAt)}</span>
                    </div>
                  </div>
                  <button className="btn-small" onClick={() => dispatch({ type: 'reopen', itemId: it.id })}>להחזיר ללוח</button>
                </div>
              ) : (
              <a href={`#/item/${it.id}`} className={`list-row ${isDone(it.status) ? 'is-done' : ''}`}>
                <Photo item={it} className="list-thumb" />
                <div className="stack-2 grow">
                  <strong className="fw-500">{it.title}</strong>
                  <span className="muted small">
                    {tab === 'reserved' ? `שמור לך אצל ${userById(it.ownerId).short}. אפשר לתאם איסוף.`
                      : tab === 'given' && it.pickup === 'coordinate' && !isDone(it.status) ? `${it.queue.length} בתור`
                      : timeAgo(it.createdAt)}
                  </span>
                </div>
                <StatusPill item={it} />
              </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
