import React from 'react';
import GmDashboardWindow from '../gmDashboard/GmDashboardWindow';
import { OnlineAuth } from '../../online/authClient';
import { OnlineCampaign } from '../../online/campaignClient';
import { DatabaseService } from '../../utils/database';

export default function GmProtectedDashboard() {
  const [allowed, setAllowed] = React.useState<boolean | null>(null);
  const [message, setMessage] = React.useState('Verificando acesso do mestre…');
  React.useEffect(() => {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') { setAllowed(true); return; }
    OnlineAuth.session().then(async ({ session }) => {
      if (session?.role !== 'gm') return location.assign('/?view=login');
      setMessage('Sincronizando a campanha…');
      const stored = await OnlineCampaign.load();
      if (stored?.data) await DatabaseService.saveFullSnapshot(stored.data);
      setAllowed(true);
    }).catch(error => {
      console.error(error);
      setMessage('Não foi possível sincronizar a campanha. Recarregue a página.');
    });
  }, []);
  if (allowed !== true) return <div role="status" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#090b10', color: '#aab2c0' }}>{message}</div>;
  return <GmDashboardWindow />;
}
