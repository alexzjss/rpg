import { rollDice } from './dice';
import type { ActiveBuff, CenaState, CenaLogEntry, EncounterEntry, EncounterState } from './cena';
import { appendLog, logEntry, createDefaultEncounter } from './cena';
import type { ActionType, BuffStat } from './grimoire';

export interface InitiativeParticipant {
  id: string;
  side: 'party' | 'npc';
  name: string;
  baseInitiative: number;
}

/** Rola 1d20 + baseInitiative. */
export function rollInitiative(baseInitiative: number): number {
  return rollDice('1d20').total + baseInitiative;
}

/** Ordena por total desc; empate por baseInitiative desc. Puro. */
export function sortInitiative(
  rolled: { id: string; side: 'party' | 'npc'; baseInitiative: number; total: number }[],
): EncounterEntry[] {
  return [...rolled]
    .sort((a, b) => b.total - a.total || b.baseInitiative - a.baseInitiative)
    .map(r => ({ refId: r.id, side: r.side, initiative: r.total }));
}

/** Inicia o combate: rola iniciativa de todos, monta a ordem, loga. */
export function startEncounter(cena: CenaState, participants: InitiativeParticipant[]): CenaState {
  const rolled = participants.map(p => ({ ...p, total: rollInitiative(p.baseInitiative) }));
  const order = sortInitiative(rolled);
  const logs: CenaLogEntry[] = [
    logEntry('system', `Combate iniciado — ${order.length} combatente(s).`),
    ...rolled
      .slice()
      .sort((a, b) => b.total - a.total || b.baseInitiative - a.baseInitiative)
      .map(r => logEntry('roll', `${r.name} rolou iniciativa ${r.total}.`)),
  ];
  return appendLog({ ...cena, encounter: { ...createDefaultEncounter(), isActive: true, order } }, logs);
}

/** Próximo turno: pula caídos; ao dar a volta, round++. Se todos caídos, não move. */
export function advanceTurn(enc: EncounterState, isDefeated: (e: EncounterEntry) => boolean): EncounterState {
  const n = enc.order.length;
  if (n === 0) return enc;
  let idx = enc.turnIndex;
  let round = enc.round;
  for (let step = 0; step < n; step++) {
    idx += 1;
    if (idx >= n) { idx = 0; round += 1; }
    if (!isDefeated(enc.order[idx])) {
      const wrapped = round > enc.round;
      return {
        ...enc, turnIndex: idx, round,
        turn: { majorUsed: false, minorUsed: false },
        reactionsUsed: wrapped ? {} : enc.reactionsUsed,
      };
    }
  }
  return enc;
}

/** Turno anterior: pula caídos; ao dar a volta, round-- (mín 1). */
export function prevTurn(enc: EncounterState, isDefeated: (e: EncounterEntry) => boolean): EncounterState {
  const n = enc.order.length;
  if (n === 0) return enc;
  let idx = enc.turnIndex;
  let round = enc.round;
  for (let step = 0; step < n; step++) {
    idx -= 1;
    if (idx < 0) { idx = n - 1; round = Math.max(1, round - 1); }
    if (!isDefeated(enc.order[idx])) {
      return { ...enc, turnIndex: idx, round, turn: { majorUsed: false, minorUsed: false } };
    }
  }
  return enc;
}

/** Encerra o combate: desliga e limpa a ordem. */
export function endEncounter(cena: CenaState): CenaState {
  return { ...cena, encounter: createDefaultEncounter() };
}

// ─────────────────────────────────────────────────────────────────
// Economia de ações, reações e buffs (combate v2)
// ─────────────────────────────────────────────────────────────────

/** O slot do tipo de ação ainda está livre neste turno? (reação não usa slot) */
export function slotAvailable(enc: EncounterState, actionType: ActionType): boolean {
  if (actionType === 'principal') return !enc.turn.majorUsed;
  if (actionType === 'menor') return !enc.turn.minorUsed;
  return true;
}

/** Consome o slot do tipo de ação (imutável). */
export function markSlot(enc: EncounterState, actionType: ActionType): EncounterState {
  if (actionType === 'principal') return { ...enc, turn: { ...enc.turn, majorUsed: true } };
  if (actionType === 'menor') return { ...enc, turn: { ...enc.turn, minorUsed: true } };
  return enc;
}

/** O participante ainda pode reagir nesta rodada? */
export function canReact(enc: EncounterState, id: string): boolean {
  return !enc.reactionsUsed[id];
}

/** Marca a reação da rodada como usada. */
export function markReaction(enc: EncounterState, id: string): EncounterState {
  return { ...enc, reactionsUsed: { ...enc.reactionsUsed, [id]: true } };
}

/** Registra um buff temporário. */
export function addBuff(enc: EncounterState, buff: ActiveBuff): EncounterState {
  return { ...enc, activeBuffs: [...enc.activeBuffs, buff] };
}

/** Soma dos buffs ativos de um stat para um alvo. */
export function buffTotal(enc: EncounterState, targetId: string, stat: BuffStat): number {
  return enc.activeBuffs
    .filter(b => b.targetId === targetId && b.stat === stat)
    .reduce((acc, b) => acc + b.value, 0);
}

/**
 * Início do turno do dono: decrementa os buffs dele; expira em 0 com log.
 * (Chamar junto do tickConditions.)
 */
export function tickBuffs(
  enc: EncounterState,
  ownerId: string,
  ownerName: string,
): { enc: EncounterState; log: CenaLogEntry[] } {
  const log: CenaLogEntry[] = [];
  const next: ActiveBuff[] = [];
  for (const b of enc.activeBuffs) {
    if (b.targetId !== ownerId) { next.push(b); continue; }
    const remaining = b.roundsRemaining - 1;
    if (remaining > 0) next.push({ ...b, roundsRemaining: remaining });
    else log.push(logEntry('condition', `${b.source} (${b.value >= 0 ? '+' : ''}${b.value} ${b.stat}) expirou em ${ownerName}.`));
  }
  return { enc: { ...enc, activeBuffs: next }, log };
}
