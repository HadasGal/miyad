import { useEffect, useState } from 'react';
import { isValidEmail, isValidPhone, useStore } from '../store.jsx';
import { COMMUNITY } from '../data/mockData.js';
import Icon from '../components/Icon.jsx';

// הרשמה: מייל → בדקי את המייל → פרטים → ממתינה לאישור.
// בלי סיסמה: לינק במייל, ומנהלת הקהילה מאשרת. בדמו הכל מדומה, וכפתור "פתחתי את הלינק" מחליף את המייל.
const STEPS = ['email', 'check', 'details', 'pending'];

export default function Join({ step = 'email' }) {
  const { state } = useStore();
  const s = state.session;

  // לא מדלגים שלבים: מי שהגיעה לשלב בלי מה שקדם לו חוזרת לשלב הנכון
  // לפי התקדמות ההרשמה ולא לפי mode: "להציץ בדמו" משנה את mode ל-demo,
  // ואם השלב נגזר ממנו, ה-effect כאן היה מחזיר לשלב הפרטים במקום להיכנס לדמו
  const allowed = s.name ? 'pending' : s.verified ? 'details' : s.email ? 'check' : 'email';
  const current = STEPS.includes(step) && STEPS.indexOf(step) <= STEPS.indexOf(allowed) ? step : allowed;
  useEffect(() => {
    if (current !== step) window.location.hash = current === 'email' ? '/join' : `/join/${current}`;
  }, [current, step]);

  return (
    <div className="screen join">
      {current === 'email' && <EmailStep />}
      {current === 'check' && <CheckStep />}
      {current === 'details' && <DetailsStep />}
      {current === 'pending' && <PendingStep />}
    </div>
  );
}

function StepHeader({ back, n }) {
  return (
    <header className="row-between">
      <a href={back} className="icon-btn" aria-label="חזרה"><Icon name="back" size={20} /></a>
      {n && <span className="muted small">שלב {n} מתוך 3</span>}
    </header>
  );
}

function EmailStep() {
  const { state, dispatch } = useStore();
  const [email, setEmail] = useState(state.session.email);
  const [tried, setTried] = useState(false);
  const ok = isValidEmail(email);

  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (!ok) return;
    dispatch({ type: 'joinEmail', email });
    window.location.hash = '/join/check';
  };

  return (
    <form className="stack-16" onSubmit={submit} noValidate>
      <StepHeader back="#/" n={1} />
      <h1 className="h1">הצטרפות ל{COMMUNITY.name}</h1>
      <p className="muted">בלי סיסמה. נשלח לך לינק למייל, ולחיצה עליו מכניסה אותך.</p>
      <label className="field">מייל
        <input type="email" inputMode="email" autoComplete="email" dir="ltr" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
          aria-invalid={tried && !ok} aria-describedby="email-err" />
      </label>
      {tried && !ok && <p id="email-err" className="field-err">צריך מייל בצורה name@example.com</p>}
      <button className="btn btn-primary" type="submit">שליחת לינק כניסה</button>
    </form>
  );
}

function CheckStep() {
  const { state, dispatch } = useStore();
  const [resent, setResent] = useState(false);

  const opened = () => {
    dispatch({ type: 'joinVerify' });
    window.location.hash = '/join/details';
  };

  return (
    <div className="stack-16">
      <StepHeader back="#/join" n={1} />
      <div className="join-hero"><Icon name="chat" size={32} /></div>
      <h1 className="h1">הלינק בדרך למייל</h1>
      <p className="muted">
        שלחנו לינק ל-<bdi className="ltr-inline">{state.session.email}</bdi>. הלינק פותח את מיד ישר, גם מהטלפון.
      </p>
      <div className="demo-note">
        <strong>בדמו אין מייל אמיתי.</strong>
        <span>הכפתור הזה מדמה לחיצה על הלינק.</span>
        <button className="btn btn-primary" onClick={opened}>פתחתי את הלינק</button>
      </div>
      <div className="btn-row">
        <button className="btn btn-ghost" onClick={() => setResent(true)} disabled={resent}>
          {resent ? 'נשלח שוב' : 'לא הגיע? לשלוח שוב'}
        </button>
        <a className="btn btn-ghost" href="#/join">לשנות מייל</a>
      </div>
    </div>
  );
}

function DetailsStep() {
  const { state, dispatch } = useStore();
  const [form, setForm] = useState({ name: state.session.name, street: state.session.street, phone: state.session.phone });
  const [tried, setTried] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const errors = {
    name: !form.name.trim() && 'איך קוראים לך?',
    street: !form.street.trim() && 'מה הרחוב?',
    phone: !isValidPhone(form.phone) && 'מספר נייד, למשל 050-1234567',
  };
  const ok = !errors.name && !errors.street && !errors.phone;

  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (!ok) return;
    dispatch({ type: 'joinDetails', ...form });
    window.location.hash = '/join/pending';
  };

  const err = (k) => tried && errors[k] && <p id={`${k}-err`} className="field-err">{errors[k]}</p>;

  return (
    <form className="stack-16" onSubmit={submit} noValidate>
      <StepHeader back="#/join/check" n={2} />
      <h1 className="h1">כמה פרטים</h1>
      <p className="muted">ככה השכנים יכירו, וההצטרפות תאושר מהר יותר.</p>

      <label className="field">שם
        <input autoComplete="name" value={form.name} onChange={set('name')} placeholder="שם פרטי ומשפחה"
          aria-invalid={tried && !!errors.name} aria-describedby="name-err" />
      </label>
      {err('name')}

      <label className="field">רחוב
        <input autoComplete="address-line1" value={form.street} onChange={set('street')} placeholder="רחוב הזית"
          aria-invalid={tried && !!errors.street} aria-describedby="street-err" />
      </label>
      {err('street')}

      <label className="field">טלפון נייד
        <input type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={form.phone} onChange={set('phone')}
          placeholder="050-1234567" aria-invalid={tried && !!errors.phone} aria-describedby="phone-err phone-note" />
      </label>
      {err('phone')}
      <p id="phone-note" className="info-row"><Icon name="lock" size={20} /> הטלפון לא מופיע בלוח. הוא נחשף רק בתיאום איסוף, ורק לצד השני.</p>

      <button className="btn btn-primary" type="submit">שליחה לאישור</button>
    </form>
  );
}

function PendingStep() {
  const { state, dispatch } = useStore();
  const toDemo = () => {
    dispatch({ type: 'enterDemo' });
    window.location.hash = '/';
  };
  return (
    <div className="stack-16">
      <div className="join-hero"><Icon name="check" size={32} /></div>
      <h1 className="h1">{state.session.name.split(' ')[0]}, ההצטרפות ממתינה לאישור</h1>
      <p className="muted">
        כל הצטרפות ל{COMMUNITY.name} מאושרת ידנית, כדי שהלוח יישאר של שכנים. נשלח לך מייל ל-<bdi className="ltr-inline">{state.session.email}</bdi> כשזה יקרה.
      </p>
      <button className="btn btn-primary" onClick={toDemo}>בינתיים, להציץ בדמו</button>
    </div>
  );
}
