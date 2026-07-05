import { describe, it, expect } from 'vitest';
import { normalizeCard, normalizeSeal, normalizeWeapon, normalizeItem, actorActions, GUARD_ACTION } from './actions';
import type { Card, Seal, Weapon } from '../types';
import type { ResolvedItem } from './items';

const card = (over: Partial<Card> = {}): Card => ({ id: 'c1', name: 'Golpe', image: '', auraCost: 2, type: 'ataque', description: '', ...over });
const seal = (over: Partial<Seal> = {}): Seal => ({ id: 's1', name: 'Selo', code: '', image: '', description: '', ...over });
const weapon = (over: Partial<Weapon> = {}): Weapon => ({ id: 'w1', name: 'Espada', description: '', image: '', ...over });
const item = (over: Partial<ResolvedItem> = {}): ResolvedItem => ({ id: 'i1', name: 'Poção', description: '', image: '', quantity: 1, ...over });

describe('normalizeCard', () => {
  it('ataque → categoria atacar; mapeia dano e custo', () => {
    const a = normalizeCard(card({ type: 'ataque', damage: 7, damageType: 'fogo', auraCost: 3, diceRoll: '1d20+2' }));
    expect(a.category).toBe('atacar');
    expect(a).toMatchObject({ source: 'card', damage: 7, damageType: 'fogo', auraCost: 3, diceRoll: '1d20+2', targeting: 'other' });
  });
  it('forma → categoria forma; outros tipos → habilidade', () => {
    expect(normalizeCard(card({ type: 'forma' })).category).toBe('forma');
    expect(normalizeCard(card({ type: 'reforço' })).category).toBe('habilidade');
  });
  it('diceRoll default 1d20', () => {
    expect(normalizeCard(card({ diceRoll: undefined })).diceRoll).toBe('1d20');
  });
});

describe('normalizeSeal', () => {
  it('cura sem dano → targeting self', () => {
    const a = normalizeSeal(seal({ healHp: 5, cost: { aura: 1 } }));
    expect(a.targeting).toBe('self');
    expect(a).toMatchObject({ source: 'seal', category: 'habilidade', healHp: 5, auraCost: 1 });
  });
  it('com dano → targeting other', () => {
    expect(normalizeSeal(seal({ damage: 4 })).targeting).toBe('other');
  });
});

describe('normalizeWeapon / normalizeItem', () => {
  it('arma usa combat* com fallback', () => {
    const a = normalizeWeapon(weapon({ combatDamage: 6, combatDiceRoll: '1d20+1' }));
    expect(a).toMatchObject({ source: 'weapon', category: 'atacar', damage: 6, diceRoll: '1d20+1', targeting: 'other' });
  });
  it('item de cura → self; categoria item', () => {
    const a = normalizeItem(item({ combatHeal: 8 }));
    expect(a).toMatchObject({ source: 'item', category: 'item', healHp: 8, targeting: 'self' });
  });
});

describe('normalizeCard / normalizeWeapon / normalizeItem — imagem', () => {
  it('normalizeCard propaga card.image', () => {
    expect(normalizeCard(card({ image: 'https://x/card.png' })).image).toBe('https://x/card.png');
  });
  it('normalizeWeapon propaga w.image', () => {
    expect(normalizeWeapon(weapon({ image: 'https://x/weapon.png' })).image).toBe('https://x/weapon.png');
  });
  it('normalizeItem propaga i.image', () => {
    expect(normalizeItem(item({ image: 'https://x/item.png' })).image).toBe('https://x/item.png');
  });
  it('normalizeSeal propaga seal.image', () => {
    expect(normalizeSeal(seal({ image: 'https://x/seal.png' })).image).toBe('https://x/seal.png');
  });
});

describe('actorActions', () => {
  it('agrupa por categoria e sempre inclui GUARDA', () => {
    const groups = actorActions({
      cards: [card({ type: 'ataque' }), card({ id: 'c2', type: 'forma' })],
      seals: [seal()],
      weapons: [weapon()],
      items: [item({ usableInCombat: true })],
    });
    expect(groups.atacar.map(a => a.source).sort()).toEqual(['card', 'weapon']);
    expect(groups.forma).toHaveLength(1);
    expect(groups.habilidade.map(a => a.source)).toEqual(['seal']);
    expect(groups.item).toHaveLength(1);
    expect(groups.guarda).toEqual([GUARD_ACTION]);
  });
  it('ignora itens não usáveis em combate', () => {
    const groups = actorActions({ cards: [], seals: [], weapons: [], items: [item({ usableInCombat: false })] });
    expect(groups.item).toHaveLength(0);
  });
});

import { applyStatDelta, computeResolution, type StatSnapshot, type ResolvedAction as RA } from './actions';

const snap = (over: Partial<StatSnapshot> = {}): StatSnapshot => ({
  currentHp: 20, maxHp: 20, currentAura: 10, maxAura: 10, currentAmmo: 5, maxAmmo: 5, defense: 12, conditions: [], ...over,
});
const atk = (over: Partial<RA> = {}): RA => ({ source: 'card', id: 'a', name: 'Golpe', category: 'atacar', diceRoll: '1d20', targeting: 'other', damage: 6, ...over });

describe('applyStatDelta', () => {
  it('clampa HP/Aura/Ammo em [0,max]', () => {
    expect(applyStatDelta(snap({ currentHp: 5 }), { hp: -9 })).toMatchObject({ currentHp: 0 });
    expect(applyStatDelta(snap({ currentHp: 18 }), { hp: 9 })).toMatchObject({ currentHp: 20 });
    expect(applyStatDelta(snap({ currentAura: 2 }), { aura: -5 })).toMatchObject({ currentAura: 0 });
  });
});

describe('computeResolution', () => {
  it('acerto (total ≥ defesa) aplica dano e desconta custo', () => {
    const r = computeResolution('A', snap({ currentAura: 10 }), 'B', snap({ defense: 12 }), atk({ damage: 6, auraCost: 2 }), 15);
    expect(r.success).toBe(true);
    expect(r.targetDelta.hp).toBe(-6);
    expect(r.actorDelta.aura).toBe(-2);
    expect(r.log.length).toBeGreaterThanOrEqual(2);
  });
  it('erro (total < defesa) não aplica dano, mas desconta custo', () => {
    const r = computeResolution('A', snap(), 'B', snap({ defense: 18 }), atk({ damage: 6, auraCost: 2 }), 10);
    expect(r.success).toBe(false);
    expect(r.targetDelta.hp).toBeUndefined();
    expect(r.actorDelta.aura).toBe(-2);
  });
  it('cura (self) sempre sucede e cura HP/Aura', () => {
    const r = computeResolution('A', snap(), 'A', snap(), atk({ source: 'seal', damage: undefined, healHp: 5, targeting: 'self' }), 1);
    expect(r.success).toBe(true);
    expect(r.targetDelta.hp).toBe(5);
  });
  it('bloqueia se faltar aura', () => {
    const r = computeResolution('A', snap({ currentAura: 1 }), 'B', snap(), atk({ auraCost: 3 }), 20);
    expect(r.blocked).toBeTruthy();
    expect(r.actorDelta).toEqual({});
  });
  it('aplica condição no sucesso', () => {
    const r = computeResolution('A', snap(), 'B', snap({ defense: 5 }), atk({ conditionName: 'Queimando', conditionDuration: 3 }), 20);
    expect(r.conditionApplied).toEqual({ name: 'Queimando', duration: 3 });
  });
});
