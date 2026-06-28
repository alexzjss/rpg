import { describe, it, expect } from 'vitest';
import { resolveCards, resolveSeals } from './items';
import type { Card, Character, Seal } from '../types';

function fakeChar(over: Partial<Character> = {}): Character {
  return {
    id: 'c', name: 'C', icon: '', maxHp: 10, currentHp: 10, maxAura: 5, currentAura: 5,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], ...over,
  };
}
const card = (id: string): Card => ({ id, name: id, image: '', auraCost: 0, type: 'ação', description: '' });
const seal = (id: string): Seal => ({ id, name: id, code: '', image: '', description: '' });

describe('resolveCards', () => {
  it('resolve cardIds para cartas do catálogo, ignorando órfãs e preservando ordem', () => {
    const char = fakeChar({ cardIds: ['x', 'missing', 'y'] });
    const out = resolveCards(char, [card('y'), card('x'), card('z')]);
    expect(out.map(c => c.id)).toEqual(['x', 'y']);
  });
  it('lista vazia quando não há cardIds', () => {
    expect(resolveCards(fakeChar({ cardIds: [] }), [card('x')])).toEqual([]);
  });
});

describe('resolveSeals', () => {
  it('resolve sealIds para selos do catálogo, ignorando órfãos', () => {
    const char = fakeChar({ sealIds: ['s1', 'nope'] });
    const out = resolveSeals(char, [seal('s1'), seal('s2')]);
    expect(out.map(s => s.id)).toEqual(['s1']);
  });
});
