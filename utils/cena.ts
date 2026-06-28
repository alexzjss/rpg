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
  };
}
