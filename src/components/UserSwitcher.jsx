import { USERS } from '../data/mockData.js';
import { useStore } from '../store.jsx';
import { useT } from '../i18n.jsx';
import { LangSwitch } from './Bits.jsx';

// פס הדמו: מחליפים משתמשת כדי לראות את שני הצדדים של אותו פריט.
// בגרסה עם התחברות אמיתית, הפס הזה נעלם.
export default function UserSwitcher() {
  const { state, dispatch } = useStore();
  const { t, L } = useT();
  // איפוס מחזיר גם את חלון ההסבר על העלאה מרובה, כדי שדמו חדש יתחיל נקי
  const reset = () => {
    try { localStorage.removeItem('miyad:hide-bulk-note'); } catch { /* אחסון חסום */ }
    dispatch({ type: 'reset' });
  };
  return (
    <div className="demo-bar">
      <label className="demo-switch">
        <span>{t('demo.profile')}</span>
        <select value={state.currentUserId} onChange={(e) => dispatch({ type: 'switchUser', userId: e.target.value })}>
          {USERS.map((u) => <option key={u.id} value={u.id}>{L(u.name)}</option>)}
        </select>
      </label>
      <div className="demo-actions">
        <LangSwitch className="demo-reset" />
        <button className="demo-reset" onClick={reset}>{t('demo.reset')}</button>
        <button className="demo-reset" onClick={() => { dispatch({ type: 'exitDemo' }); window.location.hash = '/'; }}>{t('demo.exit')}</button>
      </div>
    </div>
  );
}
