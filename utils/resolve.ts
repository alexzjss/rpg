import { rollDice, type RollResult } from './dice';
import { DEFAULT_DEFENSE, PRESET_CONDITIONS } from '../types';
import type { Affinity, Condition, Element } from '../types';
import type { BuffStat, CombatProfile } from './grimoire';
import { affinityMultiplier, elementInteraction, type InteractionResult } from './elements';
import { logEntry, type CenaLogEntry } from './cena';

export type Roller = (notation: string) => RollResult;

export interface StatDelta { hp?: number; aura?: number; ammo?: number }

/** Snapshot mínimo de um combatente para o motor (party ou NPC). */
export interface CombatantSnapshot {
  id: string; name: string;
  currentHp: number; maxHp: number;
  currentAura: number; maxAura: number;
  currentAmmo: number; maxAmmo: number;
  defense?: number;
  conditions: Condition[];
  affinities?: Partial<Record<Element, Affinity>>;
}

/** Ação pronta para resolver (nome da entrada + perfil de combate efetivo). */
export interface ActionInput {
  name: string;
  profile: CombatProfile;
}

// ─────────────────────────────────────────────────────────────────
// Etapa 1 — custos
// ─────────────────────────────────────────────────────────────────
export interface CostResult {
  blocked?: string;
  actorDelta: StatDelta;
  log: CenaLogEntry[];
}

/** Verifica e paga os custos da ação (delta negativo no ator). */
export function payCosts(actor: CombatantSnapshot, action: ActionInput): CostResult {
  const c = action.profile.costs ?? {};
  const fail = (reason: string): CostResult =>
    ({ blocked: reason, actorDelta: {}, log: [logEntry('system', `${actor.name}: ${reason} para ${action.name}.`)] });

  if ((c.aura ?? 0) > actor.currentAura) return fail('Aura insuficiente');
  if ((c.ammo ?? 0) > actor.currentAmmo) return fail('Munição insuficiente');
  if ((c.hp ?? 0) >= actor.currentHp && (c.hp ?? 0) > 0) return fail('HP insuficiente');

  const delta: StatDelta = {};
  if (c.aura) delta.aura = -c.aura;
  if (c.ammo) delta.ammo = -c.ammo;
  if (c.hp) delta.hp = -c.hp;
  return { actorDelta: delta, log: [] };
}
