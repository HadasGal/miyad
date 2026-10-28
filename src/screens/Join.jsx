import { useEffect, useState } from 'react';
import { isValidEmail, isValidPhone, useStore } from '../store.jsx';
import { COMMUNITY } from '../data/mockData.js';
import Icon from '../components/Icon.jsx';
import { useT } from '../i18n.jsx';

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
  const { t } = useT();
  return (
    <header className="row-between">
      <a href={back} className="icon-btn" aria-label={t('join.back')}><Icon name="back" size={20} /></a>
      {n && <span className="muted small">{t('join.step', { n })}</span>}
    </header>
  );
}

function EmailStep() {
  const { state, dispatch } = useStore();
  const { t, L } = useT();
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
      <h1 className="h1">{t('join.title', { community: L(COMMUNITY.name) })}</h1>
      <p className="muted">{t('join.intro')}</p>
      <label className="field">{t('join.email')}
        <input type="email" inputMode="email" autoComplete="email" dir="ltr" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
          aria-invalid={tried && !ok} aria-describedby="email-err" />
      </label>
      {tried && !ok && <p id="email-err" className="field-err">{t('join.emailErr')}</p>}
      <button className="btn btn-primary" type="submit">{t('join.send')}</button>
    </form>
  );
}

function CheckStep() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const [resent, setResent] = useState(false);

  const opened = () => {
    dispatch({ type: 'joinVerify' });
    window.location.hash = '/join/details';
  };

  return (
    <div className="stack-16">
      <StepHeader back="#/join" n={1} />
      <div className="join-hero"><Icon name="chat" size={32} /></div>
      <h1 className="h1">{t('join.checkTitle')}</h1>
      <p className="muted">
        {t('join.checkSent')}<bdi className="ltr-inline">{state.session.email}</bdi>{t('join.checkAfter')}
      </p>
      <div className="demo-note">
        <strong>{t('join.demoNoMail')}</strong>
        <span>{t('join.demoNoMailSub')}</span>
        <button className="btn btn-primary" onClick={opened}>{t('join.opened')}</button>
      </div>
      <div className="btn-row">
        <button className="btn btn-ghost" onClick={() => setResent(true)} disabled={resent}>
          {resent ? t('join.resent') : t('join.resend')}
        </button>
        <a className="btn btn-ghost" href="#/join">{t('join.changeEmail')}</a>
      </div>
    </div>
  );
}

function DetailsStep() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const [form, setForm] = useState({ name: state.session.name, street: state.session.street, phone: state.session.phone });
  const [tried, setTried] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const errors = {
    name: !form.name.trim() && t('join.nameErr'),
    street: !form.street.trim() && t('join.streetErr'),
    phone: !isValidPhone(form.phone) && t('join.phoneErr'),
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
      <h1 className="h1">{t('join.detailsTitle')}</h1>
      <p className="muted">{t('join.detailsIntro')}</p>

      <label className="field">{t('join.name')}
        <input autoComplete="name" value={form.name} onChange={set('name')} placeholder={t('join.namePh')}
          aria-invalid={tried && !!errors.name} aria-describedby="name-err" />
      </label>
      {err('name')}

      <label className="field">{t('join.street')}
        <input autoComplete="address-line1" value={form.street} onChange={set('street')} placeholder={t('join.streetPh')}
          aria-invalid={tried && !!errors.street} aria-describedby="street-err" />
      </label>
      {err('street')}

      <label className="field">{t('join.phone')}
        <input type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={form.phone} onChange={set('phone')}
          placeholder="050-1234567" aria-invalid={tried && !!errors.phone} aria-describedby="phone-err phone-note" />
      </label>
      {err('phone')}
      <p id="phone-note" className="info-row"><Icon name="lock" size={20} /> {t('join.phoneNote')}</p>

      <button className="btn btn-primary" type="submit">{t('join.submit')}</button>
    </form>
  );
}

function PendingStep() {
  const { state, dispatch } = useStore();
  const { t, L } = useT();
  const toDemo = () => {
    dispatch({ type: 'enterDemo' });
    window.location.hash = '/';
  };
  return (
    <div className="stack-16">
      <div className="join-hero"><Icon name="check" size={32} /></div>
      <h1 className="h1">{t('join.pendingTitle', { name: state.session.name.split(' ')[0] })}</h1>
      <p className="muted">
        {t('join.pendingText', { community: L(COMMUNITY.name) })}<bdi className="ltr-inline">{state.session.email}</bdi>{t('join.pendingAfter')}
      </p>
      <button className="btn btn-primary" onClick={toDemo}>{t('join.peek')}</button>
    </div>
  );
}
