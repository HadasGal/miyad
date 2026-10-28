import { useEffect, useState } from 'react';
import { matchingItems, useStore, userById } from '../store.jsx';
import { Photo, StatusPill } from '../components/Bits.jsx';
import Icon from '../components/Icon.jsx';
import { useT } from '../i18n.jsx';

export default function Alerts() {
  const { state, dispatch, me } = useStore();
  const { t, L, ago } = useT();
  const [query, setQuery] = useState('');
  // התראה נשמרת כמפתח + ערכים, ומתורגמת לשפה הנוכחית כאן
  const noteText = (n) => (n.key ? t(n.key, { title: L(n.vars?.title), name: L(userById(n.vars?.by)?.short) }) : n.text);

  const mine = state.notifications.filter((n) => n.userId === me.id);
  // החדש למעלה, כדי שמה ששמרת עכשיו יופיע מיד עם התוצאות שלו
  const searches = state.alerts.filter((a) => a.userId === me.id).reverse();

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
      <h1 className="h1">{t('alerts.title')}</h1>

      <section className="stack-8" aria-labelledby="searches-h">
        <h2 id="searches-h" className="h2">{t('alerts.saved')}</h2>
        <p className="muted small">{t('alerts.savedHint')}</p>
        <form className="search" onSubmit={add}>
          <Icon name="bell" size={20} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('alerts.placeholder')} aria-label={t('alerts.newSearch')} />
          <button className="btn-small" type="submit" disabled={!query.trim()}>{t('alerts.save')}</button>
        </form>
        {searches.length > 0 && (
          <ul className="saved-list">
            {searches.map((a) => {
              const found = matchingItems(state, a.query, me.id);
              return (
                <li key={a.id} className="saved-block">
                  <div className="saved-head">
                    <Icon name="bell" size={18} />
                    <strong className="grow">{L(a.query)}</strong>
                    <span className="muted small">{found.length > 0 ? t('alerts.onBoard', { n: found.length }) : t('alerts.none')}</span>
                    <button className="saved-x" aria-label={t('alerts.delete', { q: L(a.query) })} onClick={() => dispatch({ type: 'removeAlert', id: a.id })}>
                      <Icon name="close" size={14} stroke={2.5} />
                    </button>
                  </div>
                  {found.length > 0 ? (
                    <ul className="saved-matches">
                      {found.map((it) => (
                        <li key={it.id}>
                          <a href={`#/item/${it.id}`} className="saved-match">
                            <Photo item={it} className="saved-thumb" />
                            <span className="grow">{L(it.title)}</span>
                            <StatusPill item={it} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted small">{t('alerts.willNotify')}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="stack-8" aria-labelledby="feed-h">
        <h2 id="feed-h" className="h2">{t('alerts.updates')}</h2>
        {mine.length === 0 ? (
          <p className="muted">{t('alerts.noUpdates')}</p>
        ) : (
          <ul className="list">
            {mine.map((n) => (
              <li key={n.id}>
                <a href={`#/item/${n.itemId}`} className={`note-row ${fresh.ids.has(n.id) ? 'is-new' : ''}`}>
                  <span className="note-dot" aria-hidden="true" />
                  <div className="stack-2 grow">
                    <span>{noteText(n)}</span>
                    <span className="muted small">{ago(n.at)}</span>
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
