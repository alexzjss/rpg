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

/** Roller determinístico: devolve a fila de resultados na ordem chamada.
 *  Atenção: passe individualRolls/dieRoll explícitos quando total incluir bônus,
 *  senão o default [total] pode disparar crítico/fumble acidental. */
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

  it('custo igual à aura/munição atual é permitido (zera o recurso)', () => {
    const r = payCosts(snap({ currentAura: 3, currentAmmo: 1 }), strike);
    expect(r.blocked).toBeUndefined();
    expect(r.actorDelta).toEqual({ aura: -3, ammo: -1 });
  });
});

import { rollAttack } from './resolve';

describe('rollAttack', () => {
  const atk: ActionInput = {
    name: 'Golpe',
    profile: { actionType: 'principal', targeting: 'inimigo', attackDice: '1d20', effects: [] },
  };

  it('acerta quando total >= defesa (com bônus e penalidade nomeados)', () => {
    const roll = seqRoller([{ total: 12, individualRolls: [12] }]);
    const out = rollAttack(snap({ id: 'a', name: 'Atacante' }), snap({ id: 'b', defense: 12 }), atk, { roll });
    expect(out.attempted).toBe(true);
    expect(out.hit).toBe(true);
    expect(out.attackTotal).toBe(12);
    expect(out.defenseValue).toBe(12);
  });

  it('erra quando total < defesa', () => {
    const roll = seqRoller([{ total: 9, individualRolls: [9] }]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b', defense: 10 }), atk, { roll });
    expect(out.hit).toBe(false);
  });

  it('usa DEFAULT_DEFENSE (10) quando o alvo não tem defesa', () => {
    const roll = seqRoller([{ total: 10, individualRolls: [10] }]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b' }), atk, { roll });
    expect(out.defenseValue).toBe(10);
    expect(out.hit).toBe(true);
  });

  it('buff de defesa entra na defesa efetiva', () => {
    const roll = seqRoller([{ total: 11, individualRolls: [11] }]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b', defense: 10 }), atk, { roll, defenseBonus: 2 });
    expect(out.defenseValue).toBe(12);
    expect(out.hit).toBe(false);
  });

  it('buff de acerto soma no total', () => {
    const roll = seqRoller([{ total: 9, individualRolls: [9] }]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b', defense: 10 }), atk, { roll, attackBonus: 1 });
    expect(out.attackTotal).toBe(10);
    expect(out.hit).toBe(true);
  });

  it('Amaldiçoado penaliza a rolagem (valor do preset = 2)', () => {
    const roll = seqRoller([{ total: 11, individualRolls: [11] }]);
    const actor = snap({ id: 'a', conditions: [{ name: 'Amaldiçoado', duration: 2 }] });
    const out = rollAttack(actor, snap({ id: 'b', defense: 10 }), atk, { roll });
    expect(out.attackTotal).toBe(9);
    expect(out.hit).toBe(false);
  });

  it('nat 20 é crítico e acerta mesmo abaixo da defesa', () => {
    const roll = seqRoller([{ total: 20, individualRolls: [20], numSides: 20 }]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b', defense: 30 }), atk, { roll });
    expect(out.crit).toBe(true);
    expect(out.hit).toBe(true);
  });

  it('nat 1 é erro automático mesmo acima da defesa', () => {
    const roll = seqRoller([{ total: 21, dieRoll: 1, bonus: 20, individualRolls: [1], numSides: 20 }]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b', defense: 5 }), atk, { roll });
    expect(out.fumble).toBe(true);
    expect(out.hit).toBe(false);
  });

  it('reação substitui a defesa fixa pela rolagem do alvo', () => {
    const roll = seqRoller([
      { total: 15, individualRolls: [15] }, // acerto do atacante
      { total: 16, individualRolls: [16] }, // reação do alvo
    ]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b', defense: 5 }), atk, { roll, reactionDice: '1d20+3' });
    expect(out.reactionRoll?.total).toBe(16);
    expect(out.defenseValue).toBe(16);
    expect(out.hit).toBe(false);
  });

  it('sem attackDice ou em si mesmo não há teste (auto-acerto)', () => {
    const heal: ActionInput = { name: 'Cura', profile: { actionType: 'principal', targeting: 'self', effects: [] } };
    const self = snap({ id: 'a' });
    const out = rollAttack(self, self, heal);
    expect(out.attempted).toBe(false);
    expect(out.hit).toBe(true);
  });
});
