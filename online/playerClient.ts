import type { PlayerCampaignView } from './playerView';

async function body(response: Response) {
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(value.error || 'Falha na comunicação online.');
  return value;
}

export const PlayerOnline = {
  async state(): Promise<PlayerCampaignView> {
    const response = await fetch('/api/player/state', { credentials: 'same-origin', cache: 'no-store' });
    return (await body(response)).view;
  },
  async move(x: number, y: number, expectedRevision: number): Promise<{ position: { x: number; y: number }; revision: number }> {
    const response = await fetch('/api/player/move', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ x, y, expectedRevision }) });
    return body(response);
  },
  async requestAction(actionId: string, targetIds: string[] = []) {
    const response = await fetch('/api/player/actions', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ actionId, targetIds }) });
    return body(response);
  },
};
