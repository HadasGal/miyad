import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { AI_SUGGESTIONS, CATEGORIES, COMMUNITY } from '../data/mockData.js';
import Icon from '../components/Icon.jsx';
import { Photo } from '../components/Bits.jsx';
import { itemLink, resizeImage, waShare } from '../utils.js';

let suggestionIdx = 0;

// AI מדומה. בגרסה האמיתית: שליחת התמונה ל-Cloud Function, שמחזירה { title, category, condition }
function mockRecognize() {
  const s = AI_SUGGESTIONS[suggestionIdx % AI_SUGGESTIONS.length];
  suggestionIdx += 1;
  return new Promise((resolve) => setTimeout(() => resolve(s), 1400));
}

export default function Publish() {
  const { dispatch } = useStore();
  const [stage, setStage] = useState('empty'); // empty | thinking | form | published
  const [form, setForm] = useState({
    photo: null, title: '', category: 'other', condition: '', description: '',
    pickup: 'outside', location: '',
  });
  const [publishedId, setPublishedId] = useState(null);
  const fileRef = useRef(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStage('thinking');
    let photo = null;
    try { photo = await resizeImage(file); } catch { photo = null; }
    const s = await mockRecognize();
    if (!alive.current) return;
    setForm((f) => ({ ...f, photo, ...s }));
    setStage('form');
  };

  const publish = () => {
    const id = Math.random().toString(36).slice(2, 10);
    dispatch({ type: 'publish', item: { id, ...form, title: form.title.trim() } });
    setPublishedId(id);
    setStage('published');
  };

  const canPublish = form.title.trim().length > 1 && (form.pickup !== 'outside' || form.location.trim());

  return (
    <div className="screen publish">
      <header className="row-between">
        <h1 className="h1">{stage === 'published' ? 'על הלוח' : 'מה מוסרים היום?'}</h1>
        <a href="#/" className="icon-btn" aria-label="סגירה"><Icon name="close" size={18} /></a>
      </header>

      {stage === 'empty' && (
        <div className="publish-empty">
          <button className="drop" onClick={() => fileRef.current?.click()}>
            <span className="drop-icon"><Icon name="camera" size={32} /></span>
            <strong className="drop-title">צלמי את מה שמוסרים</strong>
            <span className="muted">את השאר נמלא בשבילך</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
          <button className="btn-link" onClick={() => setStage('form')}>להמשיך בלי תמונה</button>
        </div>
      )}

      {stage === 'thinking' && (
        <div className="stack-16" aria-live="polite">
          <div className="thinking-photo" />
          <div className="ai-note"><Icon name="sparkle" size={22} /> מזהה מה בתמונה...</div>
          <div className="skeleton" style={{ height: 52 }} />
          <div className="skeleton" style={{ height: 88 }} />
        </div>
      )}

      {stage === 'form' && (
        <div className="stack-16">
          {form.photo && (
            <div className="row-12">
              <Photo item={form} className="thumb" />
              <p className="ai-note grow">מילאנו בשבילך לפי התמונה. אפשר לשנות הכל.</p>
            </div>
          )}

          <label className="field">כותרת
            <input value={form.title} onChange={set('title')} placeholder="מה זה?" />
          </label>

          <div className="field">קטגוריה
            <div className="chips wrap">
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" className={`chip ${form.category === c.id ? 'is-on' : ''}`}
                  aria-pressed={form.category === c.id}
                  onClick={() => setForm((f) => ({ ...f, category: c.id }))}>{c.label}</button>
              ))}
            </div>
          </div>

          <label className="field">מצב
            <input value={form.condition} onChange={set('condition')} placeholder="כמו חדש, טוב, צריך תיקון קטן" />
          </label>

          <label className="field">עוד משהו שכדאי לדעת?
            <textarea rows="2" value={form.description} onChange={set('description')} placeholder="לא חובה" />
          </label>

          <fieldset className="field">
            <legend>איך אוספים?</legend>
            <div className="pickup-grid">
              <button type="button" className={`pickup ${form.pickup === 'outside' ? 'is-on' : ''}`}
                aria-pressed={form.pickup === 'outside'} onClick={() => setForm((f) => ({ ...f, pickup: 'outside' }))}>
                <strong>מחכה בחוץ</strong>
                <span className="muted small">מי שמגיעה ראשונה לוקחת</span>
              </button>
              <button type="button" className={`pickup ${form.pickup === 'coordinate' ? 'is-on' : ''}`}
                aria-pressed={form.pickup === 'coordinate'} onClick={() => setForm((f) => ({ ...f, pickup: 'coordinate' }))}>
                <strong>תיאום איסוף</strong>
                <span className="muted small">נכנסים לתור ואת בוחרת</span>
              </button>
            </div>
          </fieldset>

          {form.pickup === 'outside' && (
            <label className="field">איפה בדיוק?
              <input value={form.location} onChange={set('location')} placeholder="על החומה ליד השער" />
            </label>
          )}

          <div className="sticky-cta">
            <button className="btn btn-primary" disabled={!canPublish} onClick={publish}>פרסום ללוח</button>
          </div>
        </div>
      )}

      {stage === 'published' && <Published form={form} id={publishedId} />}
    </div>
  );
}

function Published({ form, id }) {
  const text = `${form.title}${form.pickup === 'outside' && form.location ? `, ${form.location}` : ''}\n${itemLink(id)}`;
  return (
    <div className="stack-16">
      <p className="muted">עכשיו שהשכנים יידעו.</p>

      <div className="wa-preview">
        <span className="muted small">ככה זה ייראה בקבוצה</span>
        <div className="wa-bubble">
          <div className="wa-card">
            <Photo item={form} className="wa-photo" />
            <div className="wa-meta">
              <strong>{form.title}</strong>
              <span className="muted small">{form.pickup === 'outside' ? `מחכה בחוץ, ${form.location}` : 'תיאום איסוף'}</span>
              <span className="muted xsmall">מיד · {COMMUNITY.name}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="info-row"><Icon name="refresh" size={20} /> הלינק תמיד מראה את הסטטוס העדכני. מי שלוחצת אחרי שהכל נלקח תראה את זה מיד.</p>

      <a className="btn btn-primary" href={waShare(text)} target="_blank" rel="noreferrer">
        <Icon name="chat" size={20} /> שיתוף בקבוצה
      </a>
      <a className="btn btn-ghost" href={`#/item/${id}`}>לעמוד הפריט</a>
    </div>
  );
}
