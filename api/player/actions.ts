import { json, readJson } from '../_lib/http.js';
import { currentSession } from '../_lib/session.js';
import { dbRequest } from '../_lib/supabase.js';

export default async function handler(req: any, res: any) {
  try {
    const session = await currentSession(req);
    if (!session) return json(res, 401, { error: 'Sessão expirada.' });
    const account = session.campaign_accounts;
    if (account.role !== 'player' || !account.character_id) return json(res, 403, { error: 'Acesso sem personagem.' });
    if (req.method === 'GET') {
      const rows = await dbRequest<any[]>(`action_requests?campaign_id=eq.${account.campaign_id}&account_id=eq.${account.id}&select=id,action_id,target_ids,status,created_at,decided_at,decision_note&order=created_at.desc&limit=20`);
      return json(res, 200, { requests: rows });
    }
    if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
    const input = await readJson(req);
    if (typeof input?.actionId !== 'string' || !Array.isArray(input?.targetIds)) return json(res, 400, { error: 'Solicitação inválida.' });
    const snapshots = await dbRequest<any[]>(`campaign_snapshots?campaign_id=eq.${account.campaign_id}&select=data,revision&limit=1`);
    const data = snapshots[0]?.data;
    if (!data) return json(res, 404, { error: 'Campanha sem dados online.' });
    const actor = data.characters.find((character: any) => character.id === account.character_id);
    if (!actor) return json(res, 409, { error: 'Personagem não encontrado.' });
    const owned = new Set([...(actor.cardIds ?? []), ...(actor.weaponIds ?? []), ...(actor.sealIds ?? []), ...(actor.grimoire ?? []).map((item: any) => item.entryId), ...(actor.arsenal ?? []).filter((item: any) => item.active).map((item: any) => item.cardId)]);
    if (!owned.has(input.actionId)) return json(res, 403, { error: 'Esta ação não pertence ao seu personagem.' });
    const action = data.grimoire.find((item: any) => item.id === input.actionId);
    if (!action) return json(res, 404, { error: 'Ação não encontrada.' });
    const encounter = data.cena.encounter;
    const isOwnTurn = encounter.isActive && encounter.order[encounter.turnIndex]?.refId === account.character_id && !encounter.isPaused;
    const isReaction = (action.tags ?? []).some((tag: string) => tag.toLocaleLowerCase('pt-BR').includes('reação') || tag.toLowerCase().includes('reacao'));
    if (!isOwnTurn && !(isReaction && encounter.isActive && !encounter.reactionsUsed[account.character_id])) return json(res, 403, { error: 'Esta ação não está disponível agora.' });
    const rows = await dbRequest<any[]>('action_requests?select=id,action_id,target_ids,status,created_at', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ campaign_id: account.campaign_id, encounter_id: `round:${encounter.round}`, account_id: account.id, actor_character_id: account.character_id, action_id: input.actionId, target_ids: input.targetIds.slice(0, 20), payload: { revision: Number(snapshots[0].revision), reaction: isReaction } }) });
    return json(res, 201, { request: rows[0] });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: 'Não foi possível registrar a solicitação.' });
  }
}
