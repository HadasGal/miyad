import Icon from './Icon.jsx';
import { useStore } from '../store.jsx';
import { COMMUNITY } from '../data/mockData.js';
import { useT } from '../i18n.jsx';

// ניווט עליון לדסקטופ. בטלפון ובטאבלט הוא מוסתר ב-CSS, ובמקומו הניווט התחתון.
export default function TopNav({ current }) {
  const { unread } = useStore();
  const { t, L } = useT();
  const link = (id, href) => (
    <a href={href} className={`top-link ${current === id ? 'is-active' : ''}`} aria-current={current === id ? 'page' : undefined}>
      {t(`nav.${id}`)}
      {id === 'alerts' && unread > 0 && <span className="badge badge-inline" aria-label={t('nav.unread', { n: unread })}>{unread}</span>}
    </a>
  );
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <a href="#/" className="brand">
          <strong className="brand-name">{t('brand')}<span className="brand-dot">.</span></strong>
          <span className="muted small">{L(COMMUNITY.name)}</span>
        </a>
        <nav className="top-links" aria-label={t('nav.main')}>
          {link('board', '#/')}
          {link('mine', '#/mine')}
          {link('alerts', '#/alerts')}
        </nav>
        <a href="#/publish" className="btn btn-primary top-publish"><Icon name="plus" size={20} stroke={2.5} /> {t('nav.publish')}</a>
      </div>
    </header>
  );
}
