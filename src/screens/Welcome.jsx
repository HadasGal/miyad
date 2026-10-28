import { useStore } from '../store.jsx';
import { COMMUNITY } from '../data/mockData.js';
import { LangSwitch, Photo, StatusPill } from '../components/Bits.jsx';
import Icon from '../components/Icon.jsx';
import { useT } from '../i18n.jsx';

// מסך הפתיחה. צריך להסביר את המוצר תוך 10 שניות, ולתת להיכנס לדמו בלי הרשמה.
export default function Welcome() {
  const { state, dispatch } = useStore();
  const { t, L } = useT();
  const preview = state.items.filter((it) => it.status !== 'given').slice(0, 3);

  const demo = () => {
    dispatch({ type: 'enterDemo' });
    window.location.hash = '/';
  };

  return (
    <div className="welcome">
      <div className="welcome-text">
        <div className="brand-lockup">
          <strong className="brand-big">{t('brand')}<span className="brand-dot">.</span></strong>
          <span className="muted">{L(COMMUNITY.name)}</span>
          <LangSwitch className="welcome-lang" />
        </div>

        <h1 className="welcome-h">{t('welcome.title')}<span className="mark">{t('welcome.titleMark')}</span></h1>
        <p className="welcome-sub">{t('welcome.sub')}</p>

        <ul className="welcome-points">
          <li><span className="point-icon"><Icon name="camera" size={20} /></span> {t('welcome.point1')}</li>
          <li><span className="point-icon"><Icon name="check" size={20} /></span> {t('welcome.point2')}</li>
          <li><span className="point-icon"><Icon name="bell" size={20} /></span> {t('welcome.point3')}</li>
        </ul>

        <div className="welcome-cta">
          <button className="btn btn-primary" onClick={demo}>{t('welcome.demo')}</button>
          <a className="btn btn-ghost" href="#/join">{t('welcome.join', { community: L(COMMUNITY.name) })}</a>
          <p className="muted small">{t('welcome.note')}</p>
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
              <span className="card-title">{L(it.title)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
