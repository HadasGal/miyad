import { USERS } from '../data/mockData.js';
import { useStore } from '../store.jsx';

// פס הדמו: מחליפים משתמשת כדי לראות את שני הצדדים של אותו פריט.
// בגרסה עם התחברות אמיתית, הפס הזה נעלם.
export default function UserSwitcher() {
  const { state, dispatch } = useStore();
  // איפוס מחזיר גם את חלון ההסבר על העלאה מרובה, כדי שדמו חדש יתחיל נקי
  const reset = () => {
    try { localStorage.removeItem('miyad:hide-bulk-note'); } catch { /* אחסון חסום */ }
    dispatch({ type: 'reset' });
  };
  return (
    <div className="demo-bar">
      <label className="demo-switch">
        <span>מצב דמו · את:</span>
        <select value={state.currentUserId} onChange={(e) => dispatch({ type: 'switchUser', userId: e.target.value })}>
          {USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </label>
      <div className="demo-actions">
        <button className="demo-reset" onClick={reset}>איפוס</button>
        <button className="demo-reset" onClick={() => { dispatch({ type: 'exitDemo' }); window.location.hash = '/'; }}>יציאה</button>
      </div>
    </div>
  );
}
