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
