import { USERS } from '../data/mockData.js';
import { useStore } from '../store.jsx';

// פס הדמו: מחליפים משתמשת כדי לראות את שני הצדדים של אותו פריט.
// בגרסה עם התחברות אמיתית, הפס הזה נעלם.
export default function UserSwitcher() {
  const { state, dispatch } = useStore();
  return (
    <div className="demo-bar">
      <label className="demo-switch">
        <span>מצב דמו · את:</span>
        <select value={state.currentUserId} onChange={(e) => dispatch({ type: 'switchUser', userId: e.target.value })}>
          {USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </label>
      <button className="demo-reset" onClick={() => dispatch({ type: 'reset' })}>איפוס</button>
    </div>
  );
}
