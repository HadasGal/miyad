import { useEffect, useRef, useState } from 'react';
import { PUBLISH_LIMIT, publishQuota, useStore } from '../store.jsx';
import { AI_SUGGESTIONS, CATEGORIES, COMMUNITY } from '../data/mockData.js';
import Icon from '../components/Icon.jsx';
import { Photo } from '../components/Bits.jsx';
import { itemLink, resizeImage, waShare } from '../utils.js';
import { useT } from '../i18n.jsx';

let suggestionIdx = 0;

// AI מדומה. בגרסה האמיתית: שליחת התמונה ל-Cloud Function, שמחזירה { title, category, condition }
function mockRecognize() {
  const s = AI_SUGGESTIONS[suggestionIdx % AI_SUGGESTIONS.length];
  suggestionIdx += 1;
  return new Promise((resolve) => setTimeout(() => resolve(s), 1400));
}

const HIDE_BULK_NOTE = 'miyad:hide-bulk-note';
const newId = () => Math.random().toString(36).slice(2, 10);

export default function Publish() {
  const { state, dispatch, me } = useStore();
  const { t, L } = useT();
  const quota = publishQuota(state, me.id);
  const [stage, setStage] = useState('empty'); // empty | thinking | form | bulk | published
  const [form, setForm] = useState({
    photo: null, title: '', category: 'other', condition: '', description: '',
    pickup: 'outside', location: '',
  });
  // העלאה מרובה: פריט לכל תמונה. איסוף ומיקום משותפים לכולם, ב-form.
  const [drafts, setDrafts] = useState([]);
  const [trimmed, setTrimmed] = useState(0);
  const [published, setPublished] = useState([]);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  // לפני העלאה מרובה: חלון שמסביר את המגבלה, עם "לא להציג שוב".
  // ההעדפה נשמרת בדפדפן בלבד, כי היא נוחות אישית ולא חלק מכללי המוצר.
  const dialogRef = useRef(null);
  const [dontShow, setDontShow] = useState(false);
  const openBulk = () => {
    let hidden = false;
    try { hidden = localStorage.getItem(HIDE_BULK_NOTE) === '1'; } catch { hidden = false; }
    if (hidden) galleryRef.current?.click();
    else dialogRef.current?.showModal();
  };
  const confirmBulk = () => {
    if (dontShow) {
      try { localStorage.setItem(HIDE_BULK_NOTE, '1'); } catch { /* אחסון חסום: פשוט נציג שוב */ }
    }
    dialogRef.current?.close();
    galleryRef.current?.click();
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setDraft = (key, k, v) => setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, [k]: v } : d)));

  const onFiles = async (e) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (!files.length) return;
    const take = files.slice(0, quota.left);
    setTrimmed(files.length - take.length);
    setStage('thinking');
    const results = await Promise.all(take.map(async (file) => {
      let photo = null;
      try { photo = await resizeImage(file); } catch { photo = null; }
      const s = await mockRecognize();
      return { photo, title: L(s.title), category: s.category, condition: L(s.condition) };
    }));
    if (!alive.current) return;
    if (results.length === 1) {
      setForm((f) => ({ ...f, ...results[0] }));
      setStage('form');
    } else {
      setDrafts(results.map((r) => ({ key: newId(), description: '', ...r })));
      setStage('bulk');
    }
  };

  const shared = { pickup: form.pickup, location: form.pickup === 'outside' ? form.location.trim() : '' };

  const publish = () => {
    const item = { id: newId(), ...form, title: form.title.trim() };
    dispatch({ type: 'publish', item });
    setPublished([item]);
    setStage('published');
  };

  const publishAll = () => {
    const items = drafts.map(({ key, ...d }) => ({ id: newId(), ...d, ...shared, title: d.title.trim() }));
    dispatch({ type: 'publishMany', items });
    setPublished(items);
    setStage('published');
  };

  const pickupOk = form.pickup !== 'outside' || form.location.trim();
  const canPublish = form.title.trim().length > 1 && pickupOk;
  const canPublishAll = drafts.length > 0 && drafts.every((d) => d.title.trim().length > 1) && pickupOk;

  // הזיהוי מהתמונה מדומה (AI_SUGGESTIONS). אומרים את זה במפורש, כדי שהצעה שלא קשורה לתמונה לא תיראה כמו באג
  const aiDemoNote = (
    <div className="demo-note">
      <strong>{t('pub.aiDemo')}</strong>
      <span>{t('pub.aiDemoSub')}</span>
    </div>
  );

  // הכפתור הדביק מסתיר לפעמים את שדה המיקום, אז אומרים למה הוא כבוי
  const missingLocation = <p className="muted small center cta-hint">{t('pub.missingLocation')}</p>;

  const pickupFields = (
    <>
      <fieldset className="field">
        <legend>{stage === 'bulk' ? t('pub.pickupAll') : t('pub.pickup')}</legend>
        <div className="pickup-grid">
          <button type="button" className={`pickup ${form.pickup === 'outside' ? 'is-on' : ''}`}
            aria-pressed={form.pickup === 'outside'} onClick={() => setForm((f) => ({ ...f, pickup: 'outside' }))}>
            <strong>{t('pickup.outside')}</strong>
            <span className="muted small">{t('pub.outsideSub')}</span>
          </button>
          <button type="button" className={`pickup ${form.pickup === 'coordinate' ? 'is-on' : ''}`}
            aria-pressed={form.pickup === 'coordinate'} onClick={() => setForm((f) => ({ ...f, pickup: 'coordinate' }))}>
            <strong>{t('pickup.coordinate')}</strong>
            <span className="muted small">{t('pub.coordinateSub')}</span>
          </button>
        </div>
      </fieldset>

      {form.pickup === 'outside' && (
        <label className="field">{t('pub.where')}
          <input value={form.location} onChange={set('location')} placeholder={t('pub.wherePh')} />
        </label>
      )}
    </>
  );

  return (
    <div className="screen publish">
      <header className="row-between">
        <h1 className="h1">{stage === 'published' ? t('pub.titleDone') : t('pub.titleEmpty')}</h1>
        <a href="#/" className="icon-btn" aria-label={t('pub.close')}><Icon name="close" size={18} /></a>
      </header>

      {stage === 'empty' && quota.left === 0 && (
        <div className="done-card">
          <Icon name="refresh" size={32} />
          <strong className="done-title">{t('pub.limitReached', { n: PUBLISH_LIMIT })}</strong>
          <span className="muted">
            {t('pub.limitText', { m: Math.max(1, Math.ceil((quota.resetsAt - Date.now()) / 60000)) })}
          </span>
          <a className="btn btn-ghost" href="#/mine">{t('item.toMine')}</a>
        </div>
      )}

      {stage === 'empty' && quota.left > 0 && (
        <div className="publish-empty">
          <button className="drop" onClick={() => cameraRef.current?.click()}>
            <span className="drop-icon"><Icon name="camera" size={32} /></span>
            <strong className="drop-title">{t('pub.shoot')}</strong>
            <span className="muted">{t('pub.shootSub')}</span>
          </button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={onFiles} />
          {aiDemoNote}
          <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
          {quota.left > 1 ? (
            <>
              <button className="btn btn-ghost" onClick={openBulk}>
                <Icon name="grid" size={20} /> {t('pub.multi')}
              </button>
              <p className="muted small center">{t('pub.multiHint', { n: quota.left })}</p>
            </>
          ) : (
            <p className="muted small center">{t('pub.oneLeft')}</p>
          )}
          <button className="btn-link" onClick={() => setStage('form')}>{t('pub.noPhoto')}</button>
        </div>
      )}

      {stage === 'thinking' && (
        <div className="stack-16" aria-live="polite">
          <div className="thinking-photo" />
          <div className="ai-note"><Icon name="sparkle" size={22} /> {t('pub.thinking')}</div>
          <div className="skeleton" style={{ height: 52 }} />
          <div className="skeleton" style={{ height: 88 }} />
        </div>
      )}

      {stage === 'form' && (
        <div className="stack-16">
          {form.photo && (
            <div className="row-12">
              <Photo item={form} className="thumb" />
              <p className="ai-note grow">{t('pub.filledOne')}</p>
            </div>
          )}

          <label className="field">{t('pub.fTitle')}
            <input value={form.title} onChange={set('title')} placeholder={t('pub.fTitlePh')} />
          </label>

          <div className="field">{t('pub.fCategory')}
            <div className="chips wrap">
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" className={`chip ${form.category === c.id ? 'is-on' : ''}`}
                  aria-pressed={form.category === c.id}
                  onClick={() => setForm((f) => ({ ...f, category: c.id }))}>{L(c.label)}</button>
              ))}
            </div>
          </div>

          <label className="field">{t('pub.fCondition')}
            <input value={form.condition} onChange={set('condition')} placeholder={t('pub.fConditionPh')} />
          </label>

          <label className="field">{t('pub.fMore')}
            <textarea rows="2" value={form.description} onChange={set('description')} placeholder={t('pub.fMorePh')} />
          </label>

          {pickupFields}

          <div className="sticky-cta">
            <button className="btn btn-primary" disabled={!canPublish} onClick={publish}>{t('pub.publish')}</button>
            {!pickupOk && missingLocation}
          </div>
        </div>
      )}

      {stage === 'bulk' && (
        <div className="stack-16">
          {trimmed > 0 && (
            <div className="notice-warn" role="alert">
              <strong className="notice-title">{t('pub.trimmed', { n: trimmed })}</strong>
              <span>{t('pub.trimmedText', { limit: PUBLISH_LIMIT, n: drafts.length })}</span>
            </div>
          )}
          <p className="ai-note"><Icon name="sparkle" size={22} /> {t('pub.filledMany')}</p>

          <ul className="drafts">
            {drafts.map((d, i) => (
              <li key={d.key} className="draft">
                <Photo item={d} className="draft-thumb" />
                <div className="stack-8 grow">
                  <label className="field">{t('pub.fTitle')}
                    <input value={d.title} onChange={(e) => setDraft(d.key, 'title', e.target.value)} placeholder={t('pub.fTitlePh')} />
                  </label>
                  <div className="draft-row">
                    <label className="field grow">{t('pub.fCategory')}
                      <select value={d.category} onChange={(e) => setDraft(d.key, 'category', e.target.value)}>
                        {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{L(c.label)}</option>)}
                      </select>
                    </label>
                    <label className="field grow">{t('pub.fCondition')}
                      <input value={d.condition} onChange={(e) => setDraft(d.key, 'condition', e.target.value)} />
                    </label>
                  </div>
                </div>
                {drafts.length > 1 && (
                  <button className="draft-x" aria-label={t('pub.removeDraft', { n: i + 1 })}
                    onClick={() => setDrafts((ds) => ds.filter((x) => x.key !== d.key))}>
                    <Icon name="close" size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {pickupFields}

          <div className="sticky-cta">
            <button className="btn btn-primary" disabled={!canPublishAll} onClick={publishAll}>
              {t('pub.publishMany', { n: drafts.length })}
            </button>
            {!pickupOk && missingLocation}
          </div>
        </div>
      )}

      {stage === 'published' && <Published items={published} />}

      <dialog ref={dialogRef} className="sheet-dialog" aria-labelledby="bulk-h">
        <div className="stack-16">
          <span className="drop-icon"><Icon name="grid" size={28} /></span>
          <h2 id="bulk-h" className="h2">{t('pub.dialogTitle', { n: PUBLISH_LIMIT })}</h2>
          <p className="muted">
            {t('pub.dialogText', { limit: PUBLISH_LIMIT })}<strong className="dialog-count">{quota.left}</strong>{t('pub.dialogAfter')}
          </p>
          <label className="check-row">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
            {t('pub.dontShow')}
          </label>
          <div className="stack-8">
            <button className="btn btn-primary" onClick={confirmBulk}>{t('pub.pickPhotos')}</button>
            <button className="btn btn-ghost" onClick={() => dialogRef.current?.close()}>{t('pub.cancel')}</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

// כרטיס שיתוף. בהעלאה מרובה: הודעה אחת לקבוצה עם כל הפריטים, לא חמש הודעות.
function Published({ items }) {
  const { t, L } = useT();
  const [first] = items;
  const where = first.pickup === 'outside' ? t('pub.whereOutside', { loc: first.location }) : t('pickup.coordinate');
  const text = items.length === 1
    ? `${first.title}${first.pickup === 'outside' && first.location ? `, ${first.location}` : ''}\n${itemLink(first.id)}`
    : `${t('pub.shareMany', { n: items.length, where })}\n${items.map((it) => `• ${it.title}\n${itemLink(it.id)}`).join('\n')}`;

  return (
    <div className="stack-16">
      <p className="muted">{t('pub.letKnow')}</p>

      <div className="wa-preview">
        <span className="muted small">{t('pub.waPreview')}</span>
        <div className="wa-bubble">
          <div className="wa-card">
            {items.length === 1 ? (
              <Photo item={first} className="wa-photo" />
            ) : (
              <div className="wa-photos">
                {items.slice(0, 4).map((it) => <Photo key={it.id} item={it} />)}
              </div>
            )}
            <div className="wa-meta">
              {items.length === 1
                ? <strong>{first.title}</strong>
                : <strong>{items.map((it) => it.title).join(' · ')}</strong>}
              <span className="muted small">{where}</span>
              <span className="muted xsmall">{t('brand')} · {L(COMMUNITY.name)}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="info-row"><Icon name="refresh" size={20} /> {t('pub.linkLive')}</p>

      <a className="btn btn-primary" href={waShare(text)} target="_blank" rel="noreferrer">
        <Icon name="chat" size={20} /> {t('item.share')}
      </a>
      {items.length === 1
        ? <a className="btn btn-ghost" href={`#/item/${first.id}`}>{t('pub.toItem')}</a>
        : <a className="btn btn-ghost" href="#/mine">{t('item.toMine')}</a>}
    </div>
  );
}
