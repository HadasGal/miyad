import { categoryById, userById } from '../store.jsx';
import { isDone, statusLabel } from '../utils.js';

export function Avatar({ userId, size = 44 }) {
  const u = userById(userId);
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {u?.short?.[0] ?? '?'}
    </span>
  );
}

export function StatusPill({ item }) {
  const kind = isDone(item.status) ? 'done' : item.status;
  return <span className={`pill pill-${kind}`}>{statusLabel(item, (id) => userById(id)?.short ?? '')}</span>;
}

export function Photo({ item, className = '' }) {
  const cat = categoryById(item.category);
  if (item.photo) {
    return <img className={`photo ${className}`} src={item.photo} alt={item.title} />;
  }
  return (
    <div className={`photo photo-empty ${className}`} style={{ background: cat.tint }} role="img" aria-label={item.title}>
      <span>{cat.label}</span>
    </div>
  );
}
