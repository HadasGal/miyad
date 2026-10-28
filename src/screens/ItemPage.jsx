import { useState } from 'react';
import { firstInQueue, useStore, userById } from '../store.jsx';
import { Avatar, Photo, StatusPill } from '../components/Bits.jsx';
import Icon from '../components/Icon.jsx';
import { isDone, itemLink, waShare, waToPerson } from '../utils.js';
import { useT } from '../i18n.jsx';

export default function ItemPage({ id }) {
  const { state, me } = useStore();
  const { t, L, ago } = useT();
  const item = state.items.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="screen empty">
        <p>{t('item.gone')}</p>
        <a className="btn btn-primary" href="#/">{t('item.backToBoard')}</a>
      </div>
    );
  }

  const owner = userById(item.ownerId);
  const isOwner = item.ownerId === me.id;

  return (
    <div className="item-page">
      <div className={`item-hero ${isDone(item.status) ? 'is-done' : ''}`}>
        <Photo item={item} className="hero-photo" />
        <a href="#/" className="icon-btn hero-back" aria-label={t('item.backToBoard')}><Icon name="back" size={20} /></a>
        <StatusPill item={item} />
      </div>

      <div className="item-sheet">
        <div className="stack-6">
          <h1 className="item-title">{L(item.title)}</h1>
          <span className="muted">{t('item.posted', { ago: ago(item.createdAt) })}</span>
        </div>

        {!isOwner && (
          <div className="person-row">
            <Avatar userId={owner.id} />
            <div className="stack-2">
              <strong className="fw-500">{L(owner.name)}</strong>
              <span className="muted small">{L(owner.street)}</span>
            </div>
          </div>
        )}

        {L(item.description) && <p className="item-desc">{L(item.description)}</p>}

        <div className="tags">
          {L(item.condition) && <span className="tag">{t('item.condition', { c: L(item.condition) })}</span>}
          <span className="tag">{t(`pickup.${item.pickup}`)}</span>
        </div>

        {item.pickup === 'outside' && L(item.location) && (
          <p className="location"><Icon name="pin" size={18} /> {L(item.location)}</p>
        )}

        {isOwner ? <OwnerPanel item={item} /> : <SeekerPanel item={item} owner={owner} />}
      </div>
    </div>
  );
}

function ShareButton({ item, quiet }) {
  const { t, L } = useT();
  const text = `${L(item.title)}${item.pickup === 'outside' && L(item.location) ? `, ${L(item.location)}` : ''}\n${itemLink(item.id)}`;
  return (
    <a className={`btn ${quiet ? 'btn-ghost' : 'btn-primary'}`} href={waShare(text)} target="_blank" rel="noreferrer">
      <Icon name="chat" size={20} /> {t('item.share')}
    </a>
  );
}

function OwnerPanel({ item }) {
  const { dispatch } = useStore();
  const { t, L, ago } = useT();
  const [picking, setPicking] = useState(false);
  const act = (type, extra = {}) => dispatch({ type, itemId: item.id, ...extra });

  // נמסר. בלי chosenId: המוסרת סגרה בעצמה, למשל אחרי תיאום בקבוצה
  if (item.status === 'given') {
    const to = userById(item.chosenId);
    const waited = item.queue.some((q) => q.userId !== item.chosenId);
    return (
      <div className="done-card">
        <Icon name="check" size={36} />
        <strong className="done-title">{t('item.newHome')}</strong>
        <span className="muted">
          {to ? t('item.givenTo', { name: L(to.short) }) : t('item.markedGiven')}
          {waited && t('item.queueNotified')}
        </span>
        <a className="btn btn-ghost" href="#/mine">{t('item.toMine')}</a>
      </div>
    );
  }

  // מחכה בחוץ: אין תור, רק מעקב ורשת ביטחון
  if (item.pickup === 'outside') {
    if (item.status === 'taken' || item.status === 'gone') {
      const who = userById(item.takenBy ?? item.reportedBy);
      return (
        <div className="done-card">
          <Icon name="check" size={36} />
          <strong className="done-title">
            {!who ? t('item.markedTaken')
              : item.status === 'taken' ? t('item.takenBy', { name: L(who.short) }) : t('item.goneBy', { name: L(who.short) })}
          </strong>
          <span className="muted">{t('item.statusUpdated')}</span>
          {who
            ? <button className="btn btn-ghost" onClick={() => act('stillThere')}>{t('item.stillThere')}</button>
            : <a className="btn btn-ghost" href="#/mine">{t('item.toMine')}</a>}
        </div>
      );
    }
    return (
      <div className="panel">
        <p className="muted">{t('item.outsideOwner')}</p>
        <ShareButton item={item} />
        <button className="btn btn-ghost" onClick={() => act('ownerClose')}>{t('item.markTaken')}</button>
      </div>
    );
  }

  // תיאום איסוף: התור. ברירת המחדל היא הראשונה בתור, בלחיצה אחת.
  // לבחור מישהי אחרת אפשר, אבל זה צעד נוסף ומודע (החלטה 3).
  const chosenIdx = item.queue.findIndex((q) => q.userId === item.chosenId);
  const first = item.chosenId ? null : firstInQueue(item);
  const firstUser = first && userById(first);
  const others = first ? item.queue.filter((q) => q.userId !== first && !item.skipped.includes(q.userId)) : [];
  return (
    <section className="panel" aria-labelledby="queue-h">
      <div className="row-between">
        <h2 id="queue-h" className="h2">{t('item.queue')}</h2>
        <span className="muted small">{t('item.queueOrder')}</span>
      </div>

      {item.queue.length === 0 && (
        <>
          <p className="muted">{t('item.noRequests')}</p>
          <ShareButton item={item} />
        </>
      )}

      {firstUser && (
        <div className="first-card">
          <span className="muted small">{t('item.headOfQueue', { name: L(firstUser.short) })}</span>
          <button className="btn btn-primary" onClick={() => act('choose', { userId: first })}>{t('item.giveTo', { name: L(firstUser.short) })}</button>
          {others.length > 0 && !picking && (
            <button className="btn-link" onClick={() => setPicking(true)}>{t('item.chooseOther')}</button>
          )}
          {picking && <p className="muted small center">{t('item.chooseHint')}</p>}
        </div>
      )}

      <ol className="queue">
        {item.queue.map((q, i) => {
          const u = userById(q.userId);
          const chosen = q.userId === item.chosenId;
          const skipped = item.skipped.includes(q.userId);
          return (
            <li key={q.userId} className={`queue-row ${chosen ? 'is-chosen' : ''} ${skipped ? 'is-skipped' : ''}`}>
              <div className="queue-main">
                <span className="queue-pos">{i + 1}</span>
                <Avatar userId={u.id} />
                <div className="stack-2 grow">
                  <strong className="fw-500">{L(u.short)}</strong>
                  <span className="muted small">{skipped ? t('item.notCollected') : t('item.requested', { ago: ago(q.at) })}</span>
                </div>
                {picking && !item.chosenId && !skipped && q.userId !== first && (
                  <button className="btn-small" onClick={() => { act('choose', { userId: u.id }); setPicking(false); }}>{t('item.choose')}</button>
                )}
                {item.chosenId && !chosen && !skipped && i > chosenIdx && <span className="muted small">{t('item.waiting')}</span>}
              </div>
              {chosen && (
                <div className="stack-8">
                  <a className="btn btn-primary" target="_blank" rel="noreferrer"
                    href={waToPerson(u.phone, t('item.waMsgOwner', { name: L(u.short), title: L(item.title) }))}>
                    <Icon name="chat" size={20} /> {t('item.talkTo', { name: L(u.short) })}
                  </a>
                  <div className="btn-row">
                    <button className="btn btn-soft" onClick={() => act('deliver')}>{t('item.delivered')}</button>
                    <button className="btn btn-ghost" onClick={() => act('noShow')}>{t('item.noShow')}</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!item.chosenId && (
        <div className="stack-8">
          <p className="muted small">{item.queue.length > 0 ? t('item.outsideQueueQ') : t('item.viaGroupQ')}</p>
          <button className="btn btn-ghost" onClick={() => act('ownerClose')}>{t('item.delivered')}</button>
        </div>
      )}
    </section>
  );
}

function SeekerPanel({ item, owner }) {
  const { dispatch, me } = useStore();
  const { t, L } = useT();
  const act = (type) => dispatch({ type, itemId: item.id });

  if (isDone(item.status)) {
    return <div className="action-bar"><p className="muted center">{t('item.alreadyTaken')}</p></div>;
  }

  if (item.pickup === 'outside') {
    return (
      <div className="action-bar">
        <p className="muted center">{t('item.noQueue')}</p>
        <button className="btn btn-primary" onClick={() => act('take')}>{t('item.take')}</button>
        <button className="btn btn-ghost" onClick={() => act('reportGone')}>{t('item.reportGone')}</button>
      </div>
    );
  }

  if (item.chosenId === me.id) {
    return (
      <div className="action-bar">
        <p className="center"><strong>{t('item.reservedForYou', { name: L(owner.short) })}</strong></p>
        <a className="btn btn-primary" target="_blank" rel="noreferrer"
          href={waToPerson(owner.phone, t('item.waMsgSeeker', { name: L(owner.short), title: L(item.title) }))}>
          <Icon name="chat" size={20} /> {t('item.coordinateWa')}
        </a>
      </div>
    );
  }

  const active = item.queue.filter((q) => !item.skipped.includes(q.userId));
  // המקום שלי מחושב בלי מי ששמור לה כרגע: אם דנה שמרה למישהי אחרת, אני "הבאה", לא "הראשונה"
  const waiting = active.filter((q) => q.userId !== item.chosenId);
  const myPos = waiting.findIndex((q) => q.userId === me.id);
  const held = item.status === 'reserved';

  if (myPos >= 0) {
    return (
      <div className="action-bar">
        <div className="pos-row">
          <span className="pos-num">{myPos + 1}</span>
          <div className="stack-2">
            <strong className="fw-500">
              {myPos > 0 ? t('item.place', { n: myPos + 1 }) : held ? t('item.nextIsYours') : t('item.firstIsYours')}
            </strong>
            <span className="muted small">
              {held ? t('item.heldHint') : t('item.orderHint')}
            </span>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => act('cancelRequest')}>{t('item.leaveQueue')}</button>
      </div>
    );
  }

  // דילגו עליה: היא עדיין ב-queue, אז "אני רוצה" לא היה עושה כלום
  if (item.skipped.includes(me.id)) {
    return (
      <div className="action-bar">
        <p className="muted center">{t('item.skippedHint')}</p>
      </div>
    );
  }

  return (
    <div className="action-bar">
      <p className="muted center">
        {item.status === 'reserved'
          ? t('item.heldJoin')
          : active.length > 0 ? t('item.requestsInQueue', { n: active.length }) : t('item.noRequestsYet')}
      </p>
      <button className="btn btn-primary" onClick={() => act('request')}>{t('item.iWant')}</button>
    </div>
  );
}
