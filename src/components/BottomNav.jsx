import Icon from './Icon.jsx';
import { useStore } from '../store.jsx';

export default function BottomNav({ current }) {
  const { unread } = useStore();
  const tab = (id, label, icon, href) => (
    <a href={href} className={`nav-tab ${current === id ? 'is-active' : ''}`} aria-current={current === id ? 'page' : undefined}>
      <span className="nav-icon">
        <Icon name={icon} size={24} />
        {id === 'alerts' && unread > 0 && <span className="badge" aria-label={`${unread} חדשות`}>{unread}</span>}
      </span>
      {label}
    </a>
  );
  return (
    <nav className="bottom-nav" aria-label="ניווט ראשי">
      {tab('board', 'לוח', 'grid', '#/')}
      <a href="#/publish" className="nav-plus" aria-label="פרסום פריט"><Icon name="plus" size={26} stroke={2.5} /></a>
      {tab('mine', 'שלי', 'user', '#/mine')}
      {tab('alerts', 'התראות', 'bell', '#/alerts')}
    </nav>
  );
}
