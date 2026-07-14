import React from 'react';
import GmDashboardWindow from '../gmDashboard/GmDashboardWindow';
import { OnlineAuth } from '../../online/authClient';

export default function GmProtectedDashboard() {
  const [allowed, setAllowed] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') { setAllowed(true); return; }
    OnlineAuth.session().then(({ session }) => session?.role === 'gm' ? setAllowed(true) : location.assign('/?view=login')).catch(() => location.assign('/?view=login'));
  }, []);
  if (allowed !== true) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#090b10', color: '#aab2c0' }}>Verificando acesso do mestre…</div>;
  return <GmDashboardWindow />;
}
