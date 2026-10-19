import { useEffect, useState } from 'react';
import Board from './screens/Board.jsx';
import ItemPage from './screens/ItemPage.jsx';
import Publish from './screens/Publish.jsx';
import Mine from './screens/Mine.jsx';
import Alerts from './screens/Alerts.jsx';
import BottomNav from './components/BottomNav.jsx';
import TopNav from './components/TopNav.jsx';
import UserSwitcher from './components/UserSwitcher.jsx';
import Welcome from './screens/Welcome.jsx';
import Join from './screens/Join.jsx';
import { useStore } from './store.jsx';

// ניתוב פשוט על בסיס hash, כדי שלינק לפריט ששותף בווצאפ יעבוד גם בלי שרת
function parseHash() {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/');
  return { screen: parts[0] || 'board', id: parts[1] };
}

export function go(path) {
  window.location.hash = '/' + path;
}

export default function App() {
  const { state } = useStore();
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  // מי שעוד לא נכנסה לדמו רואה מסך פתיחה (או "ממתינה לאישור" אם נרשמה).
  // חריג: לינק לפריט ששותף בווצאפ נפתח ישר על הפריט, בלי מסך שיווקי בדרך.
  const mode = state.session.mode;
  if (route.screen === 'join' || (mode !== 'demo' && route.screen !== 'item')) {
    const join = route.screen === 'join' || mode === 'pending';
    return (
      <div className="app app-bare">
        <main>{join ? <Join step={route.screen === 'join' ? route.id : 'pending'} /> : <Welcome />}</main>
      </div>
    );
  }

  const withNav = ['board', 'mine', 'alerts'].includes(route.screen);

  let screen;
  switch (route.screen) {
    case 'item': screen = <ItemPage id={route.id} />; break;
    case 'publish': screen = <Publish />; break;
    case 'mine': screen = <Mine key={route.id} initialTab={route.id} />; break;
    case 'alerts': screen = <Alerts />; break;
    default: screen = <Board />;
  }

  return (
    <div className="app">
      <UserSwitcher />
      <TopNav current={route.screen} />
      <main className={withNav ? 'with-nav' : ''}>{screen}</main>
      {withNav && <BottomNav current={route.screen} />}
    </div>
  );
}
