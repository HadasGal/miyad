import { useStore, userById } from '../store.jsx';
import { Avatar, Photo, StatusPill } from '../components/Bits.jsx';
import Icon from '../components/Icon.jsx';
import { isDone, itemLink, timeAgo, waShare, waToPerson } from '../utils.js';

export default function ItemPage({ id }) {
  const { state, me } = useStore();
  const item = state.items.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="screen empty">
        <p>הפריט הזה כבר לא בלוח.</p>
        <a className="btn btn-primary" href="#/">חזרה ללוח</a>
      </div>
    );
  }

  const owner = userById(item.ownerId);
  const isOwner = item.ownerId === me.id;

  return (
    <div className="item-page">
      <div className={`item-hero ${isDone(item.status) ? 'is-done' : ''}`}>
        <Photo item={item} className="hero-photo" />
        <a href="#/" className="icon-btn hero-back" aria-label="חזרה ללוח"><Icon name="back" size={20} /></a>
        <StatusPill item={item} />
      </div>

      <div className="item-sheet">
        <div className="stack-6">
          <h1 className="item-title">{item.title}</h1>
          <span className="muted">פורסם {timeAgo(item.createdAt)}</span>
        </div>

        {!isOwner && (
          <div className="person-row">
            <Avatar userId={owner.id} />
            <div className="stack-2">
              <strong className="fw-500">{owner.name}</strong>
              <span className="muted small">{owner.street}</span>
            </div>
          </div>
        )}

        {item.description && <p className="item-desc">{item.description}</p>}

        <div className="tags">
          {item.condition && <span className="tag">מצב: {item.condition}</span>}
          <span className="tag">{item.pickup === 'outside' ? 'מחכה בחוץ' : 'תיאום איסוף'}</span>
        </div>

        {item.pickup === 'outside' && item.location && (
          <p className="location"><Icon name="pin" size={18} /> {item.location}</p>
        )}

        {isOwner ? <OwnerPanel item={item} /> : <SeekerPanel item={item} owner={owner} />}
      </div>
    </div>
  );
}

function ShareButton({ item, quiet }) {
  const text = `${item.title}${item.pickup === 'outside' && item.location ? `, ${item.location}` : ''}\n${itemLink(item.id)}`;
  return (
    <a className={`btn ${quiet ? 'btn-ghost' : 'btn-primary'}`} href={waShare(text)} target="_blank" rel="noreferrer">
      <Icon name="chat" size={20} /> שיתוף בקבוצה
    </a>
  );
}

function OwnerPanel({ item }) {
  const { dispatch } = useStore();
  const act = (type, extra = {}) => dispatch({ type, itemId: item.id, ...extra });

  // נמסר. בלי chosenId: המוסרת סגרה בעצמה, למשל אחרי תיאום בקבוצה
  if (item.status === 'given') {
    const to = userById(item.chosenId);
    const waited = item.queue.some((q) => q.userId !== item.chosenId);
    return (
      <div className="done-card">
        <Icon name="check" size={36} />
        <strong className="done-title">בבית חדש</strong>
        <span className="muted">
          {to ? `נמסר ל${to.short}.` : 'סימנת שנמסר.'}
          {waited && ' מי שחיכתה בתור קיבלה עדכון.'}
        </span>
        <button className="btn btn-ghost" onClick={() => act('reopen')}>טעיתי, להחזיר ללוח</button>
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
            {!who ? 'סימנת שזה נלקח'
              : item.status === 'taken' ? `${who.short} לקחה את זה` : `${who.short} הגיעה וזה כבר לא היה שם`}
          </strong>
          <span className="muted">הסטטוס התעדכן לכולם, אף אחת לא תטרח לחינם.</span>
          <button className="btn btn-ghost" onClick={() => act('stillThere')}>
            {who ? 'זה עדיין שם, להחזיר לזמין' : 'טעיתי, להחזיר ללוח'}
          </button>
        </div>
      );
    }
    return (
      <div className="panel">
        <p className="muted">מחכה בחוץ. מי שלוקחת מסמנת בעצמה, ותקבלי עדכון.</p>
        <ShareButton item={item} />
        <button className="btn btn-ghost" onClick={() => act('ownerClose')}>נלקח</button>
      </div>
    );
  }

  // תיאום איסוף: התור
  const chosenIdx = item.queue.findIndex((q) => q.userId === item.chosenId);
  return (
    <section className="panel" aria-labelledby="queue-h">
      <div className="row-between">
        <h2 id="queue-h" className="h2">התור</h2>
        <span className="muted small">לפי סדר הבקשה</span>
      </div>

      {item.queue.length === 0 && (
        <>
          <p className="muted">עוד אף אחת לא ביקשה. שיתוף בקבוצה יעזור.</p>
          <ShareButton item={item} />
        </>
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
                  <strong className="fw-500">{u.short}</strong>
                  <span className="muted small">{skipped ? 'לא אספה' : `ביקשה ${timeAgo(q.at)}`}</span>
                </div>
                {!item.chosenId && !skipped && (
                  <button className="btn-small" onClick={() => act('choose', { userId: u.id })}>בחירה</button>
                )}
                {item.chosenId && !chosen && !skipped && i > chosenIdx && <span className="muted small">ממתינה</span>}
              </div>
              {chosen && (
                <div className="stack-8">
                  <a className="btn btn-primary" target="_blank" rel="noreferrer"
                    href={waToPerson(u.phone, `היי ${u.short}, לגבי ${item.title} ממיד`)}>
                    <Icon name="chat" size={20} /> דברי עם {u.short} בווצאפ
                  </a>
                  <div className="btn-row">
                    <button className="btn btn-soft" onClick={() => act('deliver')}>נמסר</button>
                    <button className="btn btn-ghost" onClick={() => act('noShow')}>לא נאסף, לבאה בתור</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!item.chosenId && (
        <div className="stack-8">
          <p className="muted small">{item.queue.length > 0 ? 'מסרת למישהי מחוץ לתור, למשל מהקבוצה?' : 'מסרת למישהי מהקבוצה?'}</p>
          <button className="btn btn-ghost" onClick={() => act('ownerClose')}>נמסר</button>
        </div>
      )}
    </section>
  );
}

function SeekerPanel({ item, owner }) {
  const { dispatch, me } = useStore();
  const act = (type) => dispatch({ type, itemId: item.id });

  if (isDone(item.status)) {
    return <div className="action-bar"><p className="muted center">כבר נלקח. אפשר לשמור התראה מהלוח, ונעדכן כשיופיע משהו דומה.</p></div>;
  }

  if (item.pickup === 'outside') {
    return (
      <div className="action-bar">
        <p className="muted center">אין תור. מי שמגיעה ראשונה לוקחת.</p>
        <button className="btn btn-primary" onClick={() => act('take')}>לקחתי</button>
        <button className="btn btn-ghost" onClick={() => act('reportGone')}>הגעתי וזה כבר לא שם</button>
      </div>
    );
  }

  if (item.chosenId === me.id) {
    return (
      <div className="action-bar">
        <p className="center"><strong>{owner.short} בחרה בך. זה שמור לך.</strong></p>
        <a className="btn btn-primary" target="_blank" rel="noreferrer"
          href={waToPerson(owner.phone, `היי ${owner.short}, לגבי ${item.title}. מתי נוח לאסוף?`)}>
          <Icon name="chat" size={20} /> תיאום איסוף בווצאפ
        </a>
      </div>
    );
  }

  const active = item.queue.filter((q) => !item.skipped.includes(q.userId));
  const myPos = active.findIndex((q) => q.userId === me.id);

  if (myPos >= 0) {
    return (
      <div className="action-bar">
        <div className="pos-row">
          <span className="pos-num">{myPos + 1}</span>
          <div className="stack-2">
            <strong className="fw-500">את במקום {myPos + 1} בתור</strong>
            <span className="muted small">נעדכן אם {owner.short} תבחר בך</span>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => act('cancelRequest')}>יציאה מהתור</button>
      </div>
    );
  }

  // דילגו עליה: היא עדיין ב-queue, אז "אני רוצה" לא היה עושה כלום
  if (item.skipped.includes(me.id)) {
    return (
      <div className="action-bar">
        <p className="muted center">האיסוף לא הסתדר, אז התור עבר לבאה. אפשר לשמור התראה ונעדכן כשיופיע משהו דומה.</p>
      </div>
    );
  }

  return (
    <div className="action-bar">
      <p className="muted center">
        {item.status === 'reserved'
          ? `כרגע שמור ל${userById(item.chosenId).short}. אפשר להיכנס לתור למקרה שלא תאסוף.`
          : active.length > 0 ? `${active.length} כבר ביקשו. אפשר להצטרף לתור.` : 'עוד אף אחת לא ביקשה.'}
      </p>
      <button className="btn btn-primary" onClick={() => act('request')}>אני רוצה</button>
    </div>
  );
}
