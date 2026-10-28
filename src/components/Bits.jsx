import { useState } from 'react';
import { categoryById, userById } from '../store.jsx';
import { isDone, statusKey } from '../utils.js';
import { useT } from '../i18n.jsx';

export function Avatar({ userId, size = 44 }) {
  const { L } = useT();
  const u = userById(userId);
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {L(u?.short)?.[0] ?? '?'}
    </span>
  );
}

export function StatusPill({ item }) {
  const { t } = useT();
  const kind = isDone(item.status) ? 'done' : item.status;
  return <span className={`pill pill-${kind}`}>{t(statusKey(item))}</span>;
}

export function Photo({ item, className = '' }) {
  const { L } = useT();
  const cat = categoryById(item.category);
  // תמונה שלא נטענה (בלי רשת, קישור שבור) חוזרת לרקע של הקטגוריה
  const [failed, setFailed] = useState(null);
  if (item.photo && failed !== item.photo) {
    return <img className={`photo ${className}`} src={item.photo} alt={L(item.title)} loading="lazy" onError={() => setFailed(item.photo)} />;
  }
  return (
    <div className={`photo photo-empty ${className}`} style={{ background: cat.tint }} role="img" aria-label={L(item.title)}>
      <span>{L(cat.label)}</span>
    </div>
  );
}

// מעבר שפה. בעברית כתוב "English", ובאנגלית "עברית", כדי שמי שלא קוראת את השפה הנוכחית תמצא אותו
export function LangSwitch({ className = '' }) {
  const { lang, setLang, t } = useT();
  const other = lang === 'he' ? 'en' : 'he';
  return (
    <button type="button" className={`lang-switch ${className}`} lang={other} aria-label={t('lang.switchLabel')} onClick={() => setLang(other)}>
      {t('lang.switch')}
    </button>
  );
}
