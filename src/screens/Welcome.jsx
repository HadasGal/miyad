import { useStore } from '../store.jsx';
import { COMMUNITY } from '../data/mockData.js';
import { Photo, StatusPill } from '../components/Bits.jsx';
import Icon from '../components/Icon.jsx';

// מסך הפתיחה. צריך להסביר את המוצר תוך 10 שניות, ולתת להיכנס לדמו בלי הרשמה.
export default function Welcome() {
  const { state, dispatch } = useStore();
  const preview = state.items.filter((it) => it.status !== 'given').slice(0, 3);

  const demo = () => {
    dispatch({ type: 'enterDemo' });
    window.location.hash = '/';
  };

  return (
    <div className="welcome">
      <div className="welcome-text">
        <div className="brand-lockup">
          <strong className="brand-big">מיד</strong>
          <span className="muted">{COMMUNITY.name}</span>
        </div>

        <h1 className="welcome-h">מה שמוסרים בשכונה, במקום אחד</h1>
        <p className="welcome-sub">
          מפרסמים בשנייה, רואים מה עוד זמין, ומקבלים התראה כשמה שחיפשת מופיע. הקבוצה בווצאפ נשארת, ופה הסטטוס תמיד אמיתי.
        </p>

        <ul className="welcome-points">
          <li><span className="point-icon"><Icon name="camera" size={20} /></span> מצלמים, וה-AI ממלא את השאר</li>
          <li><span className="point-icon"><Icon name="check" size={20} /></span> זמין, שמור או נמסר. בלי לשאול "עוד רלוונטי?"</li>
          <li><span className="point-icon"><Icon name="bell" size={20} /></span> התראה כשמה שחיפשת מגיע</li>
        </ul>

        <div className="welcome-cta">
          <button className="btn btn-primary" onClick={demo}>צפייה בדמו</button>
          <a className="btn btn-ghost" href="#/join">הצטרפות ל{COMMUNITY.name}</a>
          <p className="muted small">הדמו בלי הרשמה, עם קהילה מדומה. אפשר להחליף משתמשת ולראות את שני הצדדים.</p>
        </div>
      </div>

      <div className="welcome-visual" aria-hidden="true">
        {preview.map((it) => (
          <div key={it.id} className="welcome-card">
            <div className="card-photo">
              <Photo item={it} />
              <StatusPill item={it} />
            </div>
            <div className="card-body">
              <span className="card-title">{it.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
