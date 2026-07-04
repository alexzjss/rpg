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

// ─────────────────────────────────────────────────────────────────
// Etapa 2 — acerto (crítico, fumble, reação)
// ─────────────────────────────────────────────────────────────────
export interface AttackOptions {
  /** Buffs de acerto do atacante (soma no total). */
  attackBonus?: number;
  /** Buffs de defesa do alvo (soma na defesa fixa). */
  defenseBonus?: number;
  /** Se o alvo reage: notation da reação; substitui a defesa fixa. */
  reactionDice?: string;
  roll?: Roller;
}

export interface AttackOutcome {
  /** false = ação sem teste (self/sem attackDice): hit é true direto. */
  attempted: boolean;
  roll?: RollResult;
  natural?: number;
  attackTotal?: number;
  defenseValue?: number;
  reactionRoll?: RollResult;
  crit: boolean;
  fumble: boolean;
  hit: boolean;
  log: CenaLogEntry[];
}

function conditionAttackPenalty(conditions: Condition[]): number {
  if (!conditions.some(c => c.name === 'Amaldiçoado')) return 0;
  return PRESET_CONDITIONS.find(p => p.name === 'Amaldiçoado')?.defaultValue ?? 0;
}

/** Rola o teste de acerto contra a defesa efetiva (ou a reação do alvo). */
export function rollAttack(
  actor: CombatantSnapshot,
  target: CombatantSnapshot,
  action: ActionInput,
  opts: AttackOptions = {},
): AttackOutcome {
  const roll = opts.roll ?? rollDice;
  const needsTest = !!action.profile.attackDice && actor.id !== target.id;

  if (!needsTest) {
    return {
      attempted: false, crit: false, fumble: false, hit: true,
      log: [logEntry('roll', `${actor.name} usa ${action.name}.`)],
    };
  }

  const r = roll(action.profile.attackDice!);
  const natural = r.numDice === 1 ? r.individualRolls[0] : undefined;
  const crit = natural !== undefined && natural === r.numSides;
  const fumble = natural === 1;

  const penalty = conditionAttackPenalty(actor.conditions);
  const attackTotal = r.total + (opts.attackBonus ?? 0) - penalty;

  let defenseValue: number;
  let reactionRoll: RollResult | undefined;
  if (opts.reactionDice) {
    reactionRoll = roll(opts.reactionDice);
    defenseValue = reactionRoll.total;
  } else {
    defenseValue = (target.defense ?? DEFAULT_DEFENSE) + (opts.defenseBonus ?? 0);
  }

  const hit = !fumble && (crit || attackTotal >= defenseValue);

  const mods = [
    opts.attackBonus ? `+${opts.attackBonus} bônus` : '',
    penalty ? `−${penalty} Amaldiçoado` : '',
  ].filter(Boolean).join(', ');
  const verdict = fumble ? 'ERRO CRÍTICO (nat 1)' : crit ? 'CRÍTICO!' : hit ? 'ACERTO' : 'ERRO';
  const defLabel = reactionRoll ? `reação ${defenseValue}` : `defesa ${defenseValue}`;
  const log = [logEntry('roll',
    `${actor.name} usa ${action.name}: rola ${attackTotal}${mods ? ` (${mods})` : ''} vs ${defLabel} — ${verdict}.`)];

  return { attempted: true, roll: r, natural, attackTotal, defenseValue, reactionRoll, crit, fumble, hit, log };
}
