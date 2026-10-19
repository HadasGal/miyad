import Icon from './Icon.jsx';
import { useStore } from '../store.jsx';
import { COMMUNITY } from '../data/mockData.js';

// ניווט עליון לדסקטופ. בטלפון ובטאבלט הוא מוסתר ב-CSS, ובמקומו הניווט התחתון.
export default function TopNav({ current }) {
  const { unread } = useStore();
  const link = (id, label, href) => (
    <a href={href} className={`top-link ${current === id ? 'is-active' : ''}`} aria-current={current === id ? 'page' : undefined}>
      {label}
      {id === 'alerts' && unread > 0 && <span className="badge badge-inline" aria-label={`${unread} חדשות`}>{unread}</span>}
    </a>
  );
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <a href="#/" className="brand">
          <strong className="brand-name">מיד<span className="brand-dot">.</span></strong>
          <span className="muted small">{COMMUNITY.name}</span>
        </a>
        <nav className="top-links" aria-label="ניווט ראשי">
          {link('board', 'לוח', '#/')}
          {link('mine', 'שלי', '#/mine')}
          {link('alerts', 'התראות', '#/alerts')}
        </nav>
        <a href="#/publish" className="btn btn-primary top-publish"><Icon name="plus" size={20} stroke={2.5} /> פרסום</a>
      </div>
    </header>
  );
}
