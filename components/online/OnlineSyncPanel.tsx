import React from 'react';
import { DatabaseService, SNAPSHOT_VERSION, type AppSnapshot } from '../../utils/database';
import { OnlineCampaign } from '../../online/campaignClient';

export default function OnlineSyncPanel() {
  const [revision, setRevision] = React.useState(0);
  const [onlineDate, setOnlineDate] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState('Consultando armazenamento online…');
  const [busy, setBusy] = React.useState(false);
  const refresh = React.useCallback(async () => {
    try { const stored = await OnlineCampaign.load(); setRevision(stored?.revision ?? 0); setOnlineDate(stored?.updated_at ?? null); setStatus(stored ? 'Campanha online encontrada.' : 'Ainda não há dados online. Envie o estado local para iniciar.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Falha ao consultar dados online.'); }
  }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);
  const uploadLocal = async () => {
    if (!window.confirm('Enviar o estado local atual para o Supabase? O cache local será preservado.')) return;
    setBusy(true); setStatus('Preparando dados locais…');
    try {
      const data = await DatabaseService.initialize();
      const snapshot: AppSnapshot = { version: SNAPSHOT_VERSION, savedAt: new Date().toISOString(), ...data };
      const result = await OnlineCampaign.save(snapshot, revision);
      setRevision(result.revision); setOnlineDate(result.updatedAt); setStatus('Dados locais enviados com sucesso.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Falha ao enviar dados.'); }
    finally { setBusy(false); }
  };
  return <div style={{ maxWidth: 720, padding: 24, border: '1px solid rgba(217,183,110,.22)', borderRadius: 18, background: 'rgba(12,15,22,.88)' }}>
    <h2 style={{ margin: 0, color: '#e8d19b' }}>Persistência online</h2>
    <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>O Supabase recebe uma cópia versionada da campanha e o armazenamento local continua intacto.</p>
    <p><strong>Revisão:</strong> {revision || 'Nenhuma'} · <strong>Atualização:</strong> {onlineDate ? new Date(onlineDate).toLocaleString('pt-BR') : '—'}</p>
    <p role="status" style={{ color: '#cbd5e1', minHeight: 20 }}>{status}</p>
    <button onClick={uploadLocal} disabled={busy} style={{ padding: '12px 18px', borderRadius: 10, border: '1px solid #d9b76e', background: busy ? '#4b5563' : '#b68a3b', color: '#fff', fontWeight: 900 }}>{busy ? 'ENVIANDO…' : revision ? 'ATUALIZAR CÓPIA ONLINE' : 'ENVIAR DADOS LOCAIS'}</button>
  </div>;
}
