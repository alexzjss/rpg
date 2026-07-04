import { rollDice } from './dice';
import type { CenaState, CenaLogEntry, EncounterEntry, EncounterState } from './cena';
import { appendLog, logEntry, createDefaultEncounter } from './cena';

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
  return appendLog({ ...cena, encounter: {
    isActive: true, round: 1, turnIndex: 0, order,
    turn: { majorUsed: false, minorUsed: false },
    reactionsUsed: {}, activeBuffs: [], activeFormas: [], preparations: [],
  } }, logs);
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
    if (!isDefeated(enc.order[idx])) return { ...enc, turnIndex: idx, round };
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
    if (!isDefeated(enc.order[idx])) return { ...enc, turnIndex: idx, round };
  }
  return enc;
}

/** Encerra o combate: desliga e limpa a ordem. */
export function endEncounter(cena: CenaState): CenaState {
  return { ...cena, encounter: createDefaultEncounter() };
}
