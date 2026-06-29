import type { Character } from '../types';

/** Clima da cena (mesma união usada na jornada legada, mantida por familiaridade). */
export type SceneWeather = 'sunny' | 'rain' | 'storm' | 'fog' | 'snow' | 'night';

/** Estado narrativo/ambiental do local atual. */
export interface SceneState {
  locationName: string;
  subtitle: string;
  image: string;
  weather: SceneWeather;
  isNight: boolean;
  notes: string;
}

/**
 * NPC/inimigo: mesma ficha de um Character, em roster próprio da aba.
 * `hidden` = oculto dos jogadores; `present` = está na cena atual (entra no combate).
 */
export interface NpcEntry extends Character {
  isNpc: true;
  hidden: boolean;
  present: boolean;
}

/** Uma entrada na ordem de iniciativa do encounter. */
export interface EncounterEntry {
  /** id do Character (party) ou do NpcEntry. */
  refId: string;
  side: 'party' | 'npc';
  initiative: number;
}

/** Estado de combate-lite (sem grid). */
export interface EncounterState {
  isActive: boolean;
  round: number;
  turnIndex: number;
  order: EncounterEntry[];
}

/** Uma linha do log automático (rolagens, dano, condições, sistema). */
export interface CenaLogEntry {
  id: string;
  kind: 'roll' | 'damage' | 'condition' | 'system';
  text: string;
  timestamp: number;
}

/** Estado completo e próprio da aba Cena. */
export interface CenaState {
  scene: SceneState;
  npcRoster: NpcEntry[];
  encounter: EncounterState;
  log: CenaLogEntry[];
  /** Posições dos tokens no mapa, por id de participante (% do mapa, 0–100). */
  tokens: Record<string, { x: number; y: number }>;
}

export const DEFAULT_SCENE: SceneState = {
  locationName: 'Local Desconhecido',
  subtitle: '',
  image: '',
  weather: 'sunny',
  isNight: false,
  notes: '',
};

export const DEFAULT_ENCOUNTER: EncounterState = {
  isActive: false,
  round: 1,
  turnIndex: 0,
  order: [],
};

/** Cria um CenaState novo com cópias independentes de scene e encounter. */
export function createDefaultCena(): CenaState {
  return {
    scene: { ...DEFAULT_SCENE },
    npcRoster: [],
    encounter: { ...DEFAULT_ENCOUNTER, order: [] },
    log: [],
    tokens: {},
  };
}

/** Merge parcial imutável em scene. */
export function setScene(cena: CenaState, partial: Partial<SceneState>): CenaState {
  return { ...cena, scene: { ...cena.scene, ...partial } };
}

/** Cria um NpcEntry (presente, revelado) a partir de um Character e o adiciona ao roster.
 *  No-op (retorna a mesma referência) se já houver NPC com o mesmo id. */
export function addNpcFromCharacter(cena: CenaState, char: Character): CenaState {
  if (cena.npcRoster.some(n => n.id === char.id)) return cena;
  const npc: NpcEntry = { ...char, isNpc: true, hidden: false, present: true };
  return { ...cena, npcRoster: [...cena.npcRoster, npc] };
}

/** Remove um NPC do roster pelo id. */
export function removeNpc(cena: CenaState, npcId: string): CenaState {
  return { ...cena, npcRoster: cena.npcRoster.filter(n => n.id !== npcId) };
}

/** Inverte o estado oculto/revelado de um NPC. */
export function toggleNpcHidden(cena: CenaState, npcId: string): CenaState {
  return { ...cena, npcRoster: cena.npcRoster.map(n => n.id === npcId ? { ...n, hidden: !n.hidden } : n) };
}

/** Inverte se o NPC está presente na cena. */
export function toggleNpcPresent(cena: CenaState, npcId: string): CenaState {
  return { ...cena, npcRoster: cena.npcRoster.map(n => n.id === npcId ? { ...n, present: !n.present } : n) };
}

/** Define/atualiza a posição de um token (imutável). */
export function setToken(cena: CenaState, id: string, pos: { x: number; y: number }): CenaState {
  return { ...cena, tokens: { ...cena.tokens, [id]: pos } };
}

/** Liga/desliga o encounter (modo combate visual nesta fase). */
export function setEncounterActive(cena: CenaState, active: boolean): CenaState {
  return { ...cena, encounter: { ...cena.encounter, isActive: active } };
}

let _logSeq = 0;
/** Cria uma entrada de log com id único e timestamp atual. */
export function logEntry(kind: CenaLogEntry['kind'], text: string): CenaLogEntry {
  _logSeq += 1;
  return { id: `log-${Date.now()}-${_logSeq}`, kind, text, timestamp: Date.now() };
}
/** Anexa entradas ao log (imutável). */
export function appendLog(cena: CenaState, entries: CenaLogEntry[]): CenaState {
  return { ...cena, log: [...cena.log, ...entries] };
}

/** Mescla updates de stats/condições num NPC do roster (imutável). */
export function updateNpcStats(cena: CenaState, npcId: string, updates: Partial<Character>): CenaState {
  return { ...cena, npcRoster: cena.npcRoster.map(n => n.id === npcId ? { ...n, ...updates } : n) };
}
