import { describe, it, expect } from 'vitest';
import { sortInitiative, startEncounter, advanceTurn, prevTurn, endEncounter, type InitiativeParticipant } from './encounter';
import { createDefaultCena, createDefaultEncounter, type EncounterEntry, type EncounterState } from './cena';

const P = (id: string, side: 'party' | 'npc', baseInitiative: number): InitiativeParticipant =>
  ({ id, side, name: id, baseInitiative });

describe('sortInitiative', () => {
  it('ordena por total desc, empate por baseInitiative desc', () => {
    const order = sortInitiative([
      { id: 'a', side: 'party', baseInitiative: 1, total: 15 },
      { id: 'b', side: 'npc', baseInitiative: 5, total: 20 },
      { id: 'c', side: 'party', baseInitiative: 9, total: 15 },
    ]);
    expect(order.map(e => e.refId)).toEqual(['b', 'c', 'a']);
    expect(order[0]).toEqual({ refId: 'b', side: 'npc', initiative: 20 });
  });
});

describe('startEncounter', () => {
  it('ativa o encounter, monta a ordem e loga', () => {
    const next = startEncounter(createDefaultCena(), [P('a', 'party', 2), P('b', 'npc', 0)]);
    expect(next.encounter.isActive).toBe(true);
    expect(next.encounter.round).toBe(1);
    expect(next.encounter.turnIndex).toBe(0);
    expect(next.encounter.order).toHaveLength(2);
    for (const e of next.encounter.order) {
      const base = e.refId === 'a' ? 2 : 0;
      expect(e.initiative).toBeGreaterThanOrEqual(1 + base);
      expect(e.initiative).toBeLessThanOrEqual(20 + base);
    }
    expect(next.log.length).toBeGreaterThanOrEqual(3);
  });
});

describe('advanceTurn / prevTurn', () => {
  const enc = (turnIndex: number, round = 1): EncounterState => ({
    ...createDefaultEncounter(),
    isActive: true, round, turnIndex,
    order: [
      { refId: 'a', side: 'party', initiative: 30 },
      { refId: 'b', side: 'npc', initiative: 20 },
      { refId: 'c', side: 'party', initiative: 10 },
    ] as EncounterEntry[],
  });
  const none = () => false;

  it('avança o turno', () => {
    expect(advanceTurn(enc(0), none).turnIndex).toBe(1);
  });
  it('dá a volta e incrementa a rodada', () => {
    const r = advanceTurn(enc(2, 1), none);
    expect(r.turnIndex).toBe(0);
    expect(r.round).toBe(2);
  });
  it('pula caídos', () => {
    const defeatedB = (e: EncounterEntry) => e.refId === 'b';
    expect(advanceTurn(enc(0), defeatedB).turnIndex).toBe(2);
  });
  it('todos caídos: não move', () => {
    expect(advanceTurn(enc(0), () => true).turnIndex).toBe(0);
  });
  it('prevTurn retrocede e decrementa rodada na volta (min 1)', () => {
    expect(prevTurn(enc(1), none).turnIndex).toBe(0);
    const r = prevTurn(enc(0, 2), none);
    expect(r.turnIndex).toBe(2);
    expect(r.round).toBe(1);
  });
});

describe('endEncounter', () => {
  it('desliga e limpa a ordem', () => {
    const started = startEncounter(createDefaultCena(), [P('a', 'party', 0)]);
    const ended = endEncounter(started);
    expect(ended.encounter.isActive).toBe(false);
    expect(ended.encounter.order).toEqual([]);
    expect(ended.encounter.round).toBe(1);
  });
});
