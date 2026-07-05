import type { Card, DamageType, Seal, Weapon } from '../types';
import type { ResolvedItem } from './items';

export type ActionCategory = 'atacar' | 'habilidade' | 'forma' | 'item' | 'guarda';

export interface ResolvedAction {
  source: 'card' | 'seal' | 'weapon' | 'item' | 'guard';
  id: string;
  name: string;
  category: ActionCategory;
  diceRoll: string;
  damage?: number;
  damageType?: DamageType;
  healHp?: number;
  healAura?: number;
  conditionName?: string;
  conditionDuration?: number;
  auraCost?: number;
  ammoCost?: number;
  targeting: 'self' | 'other';
  /** Arte da carta/arma/item, exibida no cabeçalho do card de detalhes. */
  image?: string;
}

export function normalizeCard(card: Card): ResolvedAction {
  const category: ActionCategory = card.type === 'ataque' ? 'atacar' : card.type === 'forma' ? 'forma' : 'habilidade';
  return {
    source: 'card', id: card.id, name: card.name, category,
    diceRoll: card.diceRoll ?? '1d20',
    damage: card.damage, damageType: card.damageType,
    conditionName: card.conditionEffect, conditionDuration: card.conditionDuration,
    auraCost: card.auraCost, ammoCost: card.ammoCost,
    targeting: 'other',
    image: card.image,
  };
}

export function normalizeSeal(seal: Seal): ResolvedAction {
  const isHeal = !!(seal.healHp || seal.healAura) && !seal.damage;
  return {
    source: 'seal', id: seal.id, name: seal.name, category: 'habilidade',
    diceRoll: seal.diceRoll ?? '1d20',
    damage: seal.damage, damageType: seal.damageType,
    healHp: seal.healHp, healAura: seal.healAura,
    conditionName: seal.conditionEffect, conditionDuration: seal.conditionDuration,
    auraCost: seal.cost?.aura, ammoCost: seal.cost?.ammo,
    targeting: isHeal ? 'self' : 'other',
    image: seal.image,
  };
}

export function normalizeWeapon(w: Weapon): ResolvedAction {
  const isHeal = !!w.combatHeal && !w.combatDamage;
  return {
    source: 'weapon', id: w.id, name: w.name, category: 'atacar',
    diceRoll: w.combatDiceRoll ?? '1d20',
    damage: w.combatDamage ?? w.damage, damageType: w.combatDamageType ?? w.damageType,
    healHp: w.combatHeal,
    conditionName: w.combatConditionEffect, conditionDuration: w.combatConditionDuration,
    ammoCost: w.combatAmmoCost,
    targeting: w.combatTargeting === 'self' || isHeal ? 'self' : 'other',
    image: w.image,
  };
}

export function normalizeItem(i: ResolvedItem): ResolvedAction {
  const isHeal = !!(i.combatHeal || i.combatAuraRecover) && !i.combatDamage;
  return {
    source: 'item', id: i.id, name: i.name, category: 'item',
    diceRoll: i.combatDiceRoll ?? '1d20',
    damage: i.combatDamage, damageType: i.combatDamageType,
    healHp: i.combatHeal, healAura: i.combatAuraRecover,
    conditionName: i.combatConditionEffect, conditionDuration: i.combatConditionDuration,
    ammoCost: i.combatAmmoCost,
    targeting: i.combatTargeting === 'self' || isHeal ? 'self' : 'other',
    image: i.image,
  };
}

/** Ação genérica "Guarda" (sempre disponível, alvo si mesmo, sem efeito além do log). */
export const GUARD_ACTION: ResolvedAction = {
  source: 'guard', id: 'guard', name: 'Guarda', category: 'guarda', diceRoll: '1d20', targeting: 'self',
};

/** Agrupa as ações reais do ator por categoria do menu (GUARDA sempre presente). */
export function actorActions(args: { cards: Card[]; seals: Seal[]; weapons: Weapon[]; items: ResolvedItem[] }): Record<ActionCategory, ResolvedAction[]> {
  const out: Record<ActionCategory, ResolvedAction[]> = { atacar: [], habilidade: [], forma: [], item: [], guarda: [GUARD_ACTION] };
  for (const w of args.weapons) out.atacar.push(normalizeWeapon(w));
  for (const c of args.cards) { const a = normalizeCard(c); out[a.category].push(a); }
  for (const s of args.seals) out.habilidade.push(normalizeSeal(s));
  for (const i of args.items) if (i.usableInCombat) out.item.push(normalizeItem(i));
  return out;
}

import { rollDice } from './dice';
import { DEFAULT_DEFENSE } from '../types';
import type { CenaLogEntry } from './cena';
import { logEntry } from './cena';

export interface StatSnapshot {
  currentHp: number; maxHp: number;
  currentAura: number; maxAura: number;
  currentAmmo: number; maxAmmo: number;
  defense?: number;
  conditions: { name: string; duration: number }[];
}

export interface StatDelta { hp?: number; aura?: number; ammo?: number }

export interface Resolution {
  blocked?: string;
  success: boolean;
  attackTotal: number;
  actorDelta: StatDelta;
  targetDelta: StatDelta;
  conditionApplied?: { name: string; duration: number };
  log: CenaLogEntry[];
}

/** Aplica um delta a stats, clampando cada um em [0, max]. */
export function applyStatDelta(
  s: { currentHp: number; maxHp: number; currentAura: number; maxAura: number; currentAmmo: number; maxAmmo: number },
  d: StatDelta,
): { currentHp: number; currentAura: number; currentAmmo: number } {
  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v));
  return {
    currentHp: clamp(s.currentHp + (d.hp ?? 0), s.maxHp),
    currentAura: clamp(s.currentAura + (d.aura ?? 0), s.maxAura),
    currentAmmo: clamp(s.currentAmmo + (d.ammo ?? 0), s.maxAmmo),
  };
}

/** Resolução pura dado o total já rolado (determinística). */
export function computeResolution(
  actorName: string, actor: StatSnapshot,
  targetName: string, target: StatSnapshot,
  action: ResolvedAction, attackTotal: number,
): Resolution {
  const auraCost = action.auraCost ?? 0;
  const ammoCost = action.ammoCost ?? 0;
  if (actor.currentAura < auraCost) {
    return { blocked: 'Aura insuficiente', success: false, attackTotal: 0, actorDelta: {}, targetDelta: {}, log: [logEntry('system', `${actorName}: Aura insuficiente para ${action.name}.`)] };
  }
  if (actor.currentAmmo < ammoCost) {
    return { blocked: 'Munição insuficiente', success: false, attackTotal: 0, actorDelta: {}, targetDelta: {}, log: [logEntry('system', `${actorName}: Munição insuficiente para ${action.name}.`)] };
  }

  const actorDelta: StatDelta = {};
  if (auraCost) actorDelta.aura = -auraCost;
  if (ammoCost) actorDelta.ammo = -ammoCost;

  const log: CenaLogEntry[] = [];
  const isSelf = action.targeting === 'self';
  const hasDamage = (action.damage ?? 0) > 0;

  let success = true;
  if (!isSelf && hasDamage) {
    const def = target.defense ?? DEFAULT_DEFENSE;
    success = attackTotal >= def;
    log.push(logEntry('roll', `${actorName} usa ${action.name}: rola ${attackTotal} vs defesa ${def} — ${success ? 'ACERTO' : 'ERRO'}.`));
  } else {
    log.push(logEntry('roll', `${actorName} usa ${action.name}.`));
  }

  const targetDelta: StatDelta = {};
  let conditionApplied: { name: string; duration: number } | undefined;
  if (success) {
    if (hasDamage) {
      targetDelta.hp = -(action.damage ?? 0);
      log.push(logEntry('damage', `${targetName} sofre ${action.damage} de dano${action.damageType ? ` (${action.damageType})` : ''}.`));
    }
    if (action.healHp) {
      targetDelta.hp = (targetDelta.hp ?? 0) + action.healHp;
      log.push(logEntry('damage', `${targetName} recupera ${action.healHp} de HP.`));
    }
    if (action.healAura) {
      targetDelta.aura = (targetDelta.aura ?? 0) + action.healAura;
      log.push(logEntry('damage', `${targetName} recupera ${action.healAura} de Aura.`));
    }
    if (action.conditionName) {
      conditionApplied = { name: action.conditionName, duration: action.conditionDuration ?? 1 };
      log.push(logEntry('condition', `${targetName} recebe ${action.conditionName}.`));
    }
  }
  return { success, attackTotal, actorDelta, targetDelta, conditionApplied, log };
}

/** Resolve a ação rolando o dado de ataque (default 1d20). */
export function resolveAction(
  actorName: string, actor: StatSnapshot,
  targetName: string, target: StatSnapshot,
  action: ResolvedAction,
): Resolution {
  const attackTotal = rollDice(action.diceRoll || '1d20').total;
  return computeResolution(actorName, actor, targetName, target, action, attackTotal);
}
