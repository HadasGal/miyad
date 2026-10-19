import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Photo, StatusPill } from '../components/Bits.jsx';
import { isDone, timeAgo } from '../utils.js';

export default function Mine() {
  const { state, me } = useStore();
  const [tab, setTab] = useState('given');

  const given = state.items.filter((i) => i.ownerId === me.id);
  const requested = state.items.filter(
    (i) => i.ownerId !== me.id && (i.queue.some((q) => q.userId === me.id) || i.takenBy === me.id)
  );
  const list = tab === 'given' ? given : requested;

  return (
    <div className="screen">
      <h1 className="h1">שלי</h1>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'given'} className={`tab ${tab === 'given' ? 'is-on' : ''}`} onClick={() => setTab('given')}>
          מסרתי ({given.length})
        </button>
        <button role="tab" aria-selected={tab === 'requested'} className={`tab ${tab === 'requested' ? 'is-on' : ''}`} onClick={() => setTab('requested')}>
          ביקשתי ({requested.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          {tab === 'given' ? (
            <>
              <p>עוד לא מסרת כלום.</p>
              <a className="btn btn-primary" href="#/publish">לפרסם משהו</a>
            </>
          ) : (
            <>
              <p>עוד לא ביקשת כלום.</p>
              <a className="btn btn-primary" href="#/">לעבור על הלוח</a>
            </>
          )}
        </div>
      ) : (
        <ul className="list">
          {list.map((it) => (
            <li key={it.id}>
              <a href={`#/item/${it.id}`} className={`list-row ${isDone(it.status) ? 'is-done' : ''}`}>
                <Photo item={it} className="list-thumb" />
                <div className="stack-2 grow">
                  <strong className="fw-500">{it.title}</strong>
                  <span className="muted small">
                    {tab === 'given' && it.pickup === 'coordinate' && !isDone(it.status)
                      ? `${it.queue.length} בתור`
                      : timeAgo(it.createdAt)}
                  </span>
                </div>
                <StatusPill item={it} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
