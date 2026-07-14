import { json, readJson } from '../_lib/http.js';
import { currentSession } from '../_lib/session.js';
import { dbRequest } from '../_lib/supabase.js';

export default async function handler(req: any, res: any) {
  try {
    const session = await currentSession(req);
    if (!session) return json(res, 401, { error: 'Sessão expirada.' });
    const account = session.campaign_accounts;
    if (account.role !== 'gm') return json(res, 403, { error: 'Somente o mestre pode decidir solicitações.' });
    if (req.method === 'GET') {
      const [requests, snapshots] = await Promise.all([
        dbRequest<any[]>(`action_requests?campaign_id=eq.${account.campaign_id}&status=eq.pending&select=id,actor_character_id,action_id,target_ids,status,created_at&order=created_at.asc`),
        dbRequest<any[]>(`campaign_snapshots?campaign_id=eq.${account.campaign_id}&select=data&limit=1`),
      ]);
      const data = snapshots[0]?.data;
      return json(res, 200, { requests: requests.map(request => ({ ...request, actorName: data?.characters?.find((item: any) => item.id === request.actor_character_id)?.name ?? 'Personagem', actionName: data?.grimoire?.find((item: any) => item.id === request.action_id)?.name ?? 'Ação' })) });
    }
    if (req.method !== 'PATCH') return json(res, 405, { error: 'Método não permitido.' });
    const input = await readJson(req);
    if (typeof input?.id !== 'string' || !['approved', 'rejected'].includes(input?.status)) return json(res, 400, { error: 'Decisão inválida.' });
    const rows = await dbRequest<any[]>(`action_requests?id=eq.${encodeURIComponent(input.id)}&campaign_id=eq.${account.campaign_id}&status=eq.pending&select=id,status,decided_at`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status: input.status, decided_by: account.id, decision_note: typeof input.note === 'string' ? input.note.slice(0, 500) : null, decided_at: new Date().toISOString() }) });
    if (!rows[0]) return json(res, 404, { error: 'Solicitação não encontrada ou já decidida.' });
    return json(res, 200, { request: rows[0] });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: 'Não foi possível acessar as solicitações.' });
  }
}
