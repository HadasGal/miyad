import Icon from './Icon.jsx';
import { useStore } from '../store.jsx';
import { useT } from '../i18n.jsx';

export default function BottomNav({ current }) {
  const { unread } = useStore();
  const { t } = useT();
  const tab = (id, icon, href) => (
    <a href={href} className={`nav-tab ${current === id ? 'is-active' : ''}`} aria-current={current === id ? 'page' : undefined}>
      <span className="nav-icon">
        <Icon name={icon} size={24} />
        {id === 'alerts' && unread > 0 && <span className="badge" aria-label={t('nav.unread', { n: unread })}>{unread}</span>}
      </span>
      {t(`nav.${id}`)}
    </a>
  );
  return (
    <nav className="bottom-nav" aria-label={t('nav.main')}>
      {tab('board', 'grid', '#/')}
      {/* פרסום הוא טאב כמו האחרים, באותו גובה ועם תווית, ורק הרקע שלו בטרקוטה */}
      <a href="#/publish" className="nav-tab nav-publish">
        <span className="nav-icon nav-plus"><Icon name="plus" size={22} stroke={2.5} /></span>
        {t('nav.publish')}
      </a>
      {tab('mine', 'user', '#/mine')}
      {tab('alerts', 'bell', '#/alerts')}
    </nav>
  );
}
