import { useState } from 'react';
import { myLists, useStore, userById } from '../store.jsx';
import { Photo, StatusPill } from '../components/Bits.jsx';
import { isDone, statusKey } from '../utils.js';
import { useT } from '../i18n.jsx';

const TABS = ['given', 'reserved', 'requested'];

const EMPTY = {
  given: { text: 'mine.emptyGiven', cta: 'board.publishSomething', href: '#/publish' },
  reserved: { text: 'mine.emptyReserved', cta: 'mine.browse', href: '#/' },
  requested: { text: 'mine.emptyRequested', cta: 'mine.browse', href: '#/' },
};

// #/mine/reserved פותח ישר את "שמור לי"
export default function Mine({ initialTab }) {
  const { state, dispatch, me } = useStore();
  const { t, L, ago } = useT();
  const [tab, setTab] = useState(TABS.includes(initialTab) ? initialTab : 'given');

  const lists = myLists(state, me.id);
  const list = lists[tab];
  const empty = EMPTY[tab];

  return (
    <div className="screen">
      <h1 className="h1">{t('mine.title')}</h1>

      <div className="tabs" role="tablist">
        {TABS.map((id) => (
          <button key={id} role="tab" aria-selected={tab === id} className={`tab ${tab === id ? 'is-on' : ''}`} onClick={() => setTab(id)}>
            {t(`mine.${id}`)} ({lists[id].length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <p>{t(empty.text)}</p>
          <a className="btn btn-primary" href={empty.href}>{t(empty.cta)}</a>
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
                      <strong className="fw-500">{L(it.title)}</strong>
                      <span className="muted small">{t(statusKey(it))} {ago(it.closedAt ?? it.createdAt)}</span>
                    </div>
                  </div>
                  <button className="btn-small" onClick={() => dispatch({ type: 'reopen', itemId: it.id })}>{t('mine.reopen')}</button>
                </div>
              ) : (
              <a href={`#/item/${it.id}`} className={`list-row ${isDone(it.status) ? 'is-done' : ''}`}>
                <Photo item={it} className="list-thumb" />
                <div className="stack-2 grow">
                  <strong className="fw-500">{L(it.title)}</strong>
                  <span className="muted small">
                    {tab === 'reserved' ? t('mine.reservedAt', { name: L(userById(it.ownerId).short) })
                      : tab === 'given' && it.pickup === 'coordinate' && !isDone(it.status) ? t('mine.inQueue', { n: it.queue.length })
                      : ago(it.createdAt)}
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
