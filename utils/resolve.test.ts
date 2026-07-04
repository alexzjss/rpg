import { describe, expect, it } from 'vitest';
import type { RollResult } from './dice';
import { payCosts, type ActionInput, type CombatantSnapshot, type Roller } from './resolve';

/** Snapshot de combatente com defaults convenientes. */
export function snap(partial: Partial<CombatantSnapshot> = {}): CombatantSnapshot {
  return {
    id: 'x', name: 'X',
    currentHp: 20, maxHp: 20, currentAura: 10, maxAura: 10, currentAmmo: 5, maxAmmo: 5,
    conditions: [],
    ...partial,
  };
}

/** Roller determinístico: devolve a fila de resultados na ordem chamada. */
export function seqRoller(seq: Array<Partial<RollResult> & { total: number }>): Roller {
  let i = 0;
  return (notation: string): RollResult => {
    const s = seq[Math.min(i++, seq.length - 1)];
    const dieRoll = s.dieRoll ?? s.total;
    return {
      total: s.total, dieRoll, bonus: s.bonus ?? s.total - dieRoll,
      notation, individualRolls: s.individualRolls ?? [dieRoll],
      numSides: s.numSides ?? 20, numDice: s.numDice ?? 1,
    };
  };
}

const strike: ActionInput = {
  name: 'Golpe',
  profile: {
    actionType: 'principal', targeting: 'inimigo', attackDice: '1d20',
    costs: { aura: 3, ammo: 1 },
    effects: [{ kind: 'damage', dice: '2d6', element: 'normal' }],
  },
};

describe('payCosts', () => {
  it('paga aura/munição como delta negativo', () => {
    const r = payCosts(snap({ name: 'A' }), strike);
    expect(r.blocked).toBeUndefined();
    expect(r.actorDelta).toEqual({ aura: -3, ammo: -1 });
  });

  it('bloqueia sem aura', () => {
    const r = payCosts(snap({ currentAura: 2 }), strike);
    expect(r.blocked).toBe('Aura insuficiente');
    expect(r.actorDelta).toEqual({});
    expect(r.log[0].text).toContain('Aura insuficiente');
  });

  it('bloqueia sem munição', () => {
    const r = payCosts(snap({ currentAmmo: 0 }), strike);
    expect(r.blocked).toBe('Munição insuficiente');
  });

  it('custo de HP não pode derrubar o ator', () => {
    const blood: ActionInput = { name: 'Rito', profile: { actionType: 'principal', targeting: 'inimigo', costs: { hp: 5 }, effects: [] } };
    expect(payCosts(snap({ currentHp: 5 }), blood).blocked).toBe('HP insuficiente');
    expect(payCosts(snap({ currentHp: 6 }), blood).actorDelta).toEqual({ hp: -5 });
  });

  it('sem custos, delta vazio', () => {
    const free: ActionInput = { name: 'Livre', profile: { actionType: 'menor', targeting: 'self', effects: [] } };
    expect(payCosts(snap(), free)).toEqual({ actorDelta: {}, log: [] });
  });
});
