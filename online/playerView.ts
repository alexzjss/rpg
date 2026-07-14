import type { Character, Condition } from '../types';
import type { ArsenalCard } from '../utils/arsenal';
import type { AppSnapshot } from '../utils/database';

export interface PublicParticipant {
  id: string;
  name: string;
  icon: string;
  iconPosition?: string;
  conditions: Condition[];
  position?: { x: number; y: number };
}

export interface PublicAlly extends PublicParticipant {
  currentHp: number;
  maxHp: number;
  currentAura: number;
  maxAura: number;
  currentAmmo: number;
  maxAmmo: number;
}

export interface PlayerCampaignView {
  revision: number;
  updatedAt: string;
  character: Omit<Character, 'code'>;
  position: { x: number; y: number };
  actions: ArsenalCard[];
  allies: PublicAlly[];
  enemies: PublicParticipant[];
  scene: {
    locationName: string;
    subtitle: string;
    image: string;
    imagePosition?: string;
    isNight: boolean;
  };
  encounter: {
    isActive: boolean;
    isPaused: boolean;
    round: number;
    currentTurnId: string | null;
    order: Array<{ refId: string; side: 'party' | 'npc'; initiative: number }>;
  };
  permissions: { isOwnTurn: boolean; canMove: boolean; canAct: boolean; canReact: boolean };
}

function publicParticipant(character: Character, position?: { x: number; y: number }): PublicParticipant {
  return { id: character.id, name: character.name, icon: character.icon, iconPosition: character.iconPosition, conditions: character.conditions ?? [], position };
}

function publicAlly(character: Character, position?: { x: number; y: number }): PublicAlly {
  return { ...publicParticipant(character, position), currentHp: character.currentHp, maxHp: character.maxHp, currentAura: character.currentAura, maxAura: character.maxAura, currentAmmo: character.currentAmmo, maxAmmo: character.maxAmmo };
}

/** Cria o único formato de campanha que pode atravessar a fronteira do jogador. */
export function buildPlayerCampaignView(snapshot: AppSnapshot, characterId: string, revision: number, updatedAt: string): PlayerCampaignView {
  const owner = snapshot.characters.find(character => character.id === characterId);
  if (!owner) throw new Error('character_not_found');

  const visibleNpcs = snapshot.cena.npcRoster.filter(npc => npc.present && !npc.hidden && !npc.isHidden);
  const visibleIds = new Set([...snapshot.characters.filter(character => !character.isHidden).map(character => character.id), ...visibleNpcs.map(npc => npc.id)]);
  const order = snapshot.cena.encounter.order.filter(entry => visibleIds.has(entry.refId));
  const currentTurnId = snapshot.cena.encounter.order[snapshot.cena.encounter.turnIndex]?.refId ?? null;
  const isOwnTurn = snapshot.cena.encounter.isActive && currentTurnId === characterId;
  const ownedActionIds = new Set<string>([
    ...(owner.cardIds ?? []), ...(owner.weaponIds ?? []), ...(owner.sealIds ?? []),
    ...(owner.grimoire ?? []).map(item => item.entryId), ...(owner.arsenal ?? []).filter(item => item.active).map(item => item.cardId),
  ]);
  const actions = snapshot.grimoire.filter(action => ownedActionIds.has(action.id));
  const { code: _secretCode, ...safeOwner } = owner;

  return {
    revision, updatedAt, character: safeOwner, position: snapshot.cena.tokens[characterId] ?? { x: 50, y: 50 }, actions,
    allies: snapshot.characters.filter(character => character.id !== characterId && !character.isHidden).map(character => publicAlly(character, snapshot.cena.tokens[character.id])),
    enemies: visibleNpcs.map(npc => publicParticipant(npc, snapshot.cena.tokens[npc.id])),
    scene: {
      locationName: snapshot.cena.scene.locationName,
      subtitle: snapshot.cena.scene.subtitle,
      image: snapshot.cena.scene.image,
      imagePosition: snapshot.cena.scene.imagePosition,
      isNight: snapshot.cena.scene.isNight,
    },
    encounter: { isActive: snapshot.cena.encounter.isActive, isPaused: snapshot.cena.encounter.isPaused, round: snapshot.cena.encounter.round, currentTurnId, order },
    permissions: { isOwnTurn, canMove: !snapshot.cena.encounter.isActive || (isOwnTurn && !snapshot.cena.encounter.isPaused), canAct: isOwnTurn && !snapshot.cena.encounter.isPaused, canReact: snapshot.cena.encounter.isActive && !snapshot.cena.encounter.reactionsUsed[characterId] },
  };
}
