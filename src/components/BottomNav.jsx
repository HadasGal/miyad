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
      {/* פרסום הוא טאב כמו האחרים, באותו גובה ועם תווית, ורק הרקע שלו בטרקוטה */}
      <a href="#/publish" className="nav-tab nav-publish">
        <span className="nav-icon nav-plus"><Icon name="plus" size={22} stroke={2.5} /></span>
        פרסום
      </a>
      {tab('mine', 'שלי', 'user', '#/mine')}
      {tab('alerts', 'התראות', 'bell', '#/alerts')}
    </nav>
  );
}
