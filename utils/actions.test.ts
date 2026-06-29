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
