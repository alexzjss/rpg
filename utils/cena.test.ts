import { describe, it, expect } from 'vitest';
import { createDefaultCena, DEFAULT_SCENE, DEFAULT_ENCOUNTER, setScene, addNpcFromCharacter, removeNpc, toggleNpcHidden, toggleNpcPresent } from './cena';
import type { Character } from '../types';

function fakeChar(id: string, over: Partial<Character> = {}): Character {
  return {
    id, name: `Char ${id}`, icon: '', maxHp: 10, currentHp: 10, maxAura: 5, currentAura: 5,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [],
    role: 'npc', ...over,
  };
}

describe('createDefaultCena', () => {
  it('cria um estado de cena vazio e coerente', () => {
    const cena = createDefaultCena();
    expect(cena.scene).toEqual(DEFAULT_SCENE);
    expect(cena.npcRoster).toEqual([]);
    expect(cena.encounter).toEqual(DEFAULT_ENCOUNTER);
    expect(cena.log).toEqual([]);
  });

  it('retorna cópias independentes (não compartilha referência de scene/encounter)', () => {
    const a = createDefaultCena();
    const b = createDefaultCena();
    a.scene.locationName = 'Mudou';
    a.encounter.round = 99;
    expect(b.scene.locationName).toBe(DEFAULT_SCENE.locationName);
    expect(b.encounter.round).toBe(1);
  });

  it('encounter começa inativo no round 1, turno 0, sem ordem', () => {
    const { encounter } = createDefaultCena();
    expect(encounter.isActive).toBe(false);
    expect(encounter.round).toBe(1);
    expect(encounter.turnIndex).toBe(0);
    expect(encounter.order).toEqual([]);
  });
});

describe('setScene', () => {
  it('faz merge parcial em scene sem mutar o original', () => {
    const cena = createDefaultCena();
    const next = setScene(cena, { locationName: 'Mina', weather: 'storm' });
    expect(next.scene.locationName).toBe('Mina');
    expect(next.scene.weather).toBe('storm');
    expect(next.scene.notes).toBe(cena.scene.notes);
    expect(cena.scene.locationName).toBe('Local Desconhecido');
    expect(next).not.toBe(cena);
  });
});

describe('addNpcFromCharacter', () => {
  it('cria um NpcEntry presente e revelado a partir de um Character', () => {
    const cena = createDefaultCena();
    const next = addNpcFromCharacter(cena, fakeChar('a'));
    expect(next.npcRoster).toHaveLength(1);
    expect(next.npcRoster[0]).toMatchObject({ id: 'a', isNpc: true, hidden: false, present: true });
  });
  it('não duplica NPC com o mesmo id (no-op)', () => {
    const cena = addNpcFromCharacter(createDefaultCena(), fakeChar('a'));
    const again = addNpcFromCharacter(cena, fakeChar('a'));
    expect(again.npcRoster).toHaveLength(1);
    expect(again).toBe(cena);
  });
});

describe('removeNpc / toggleNpcHidden / toggleNpcPresent', () => {
  it('removeNpc tira pelo id', () => {
    const cena = addNpcFromCharacter(createDefaultCena(), fakeChar('a'));
    expect(removeNpc(cena, 'a').npcRoster).toHaveLength(0);
  });
  it('toggleNpcHidden inverte hidden só do alvo', () => {
    let cena = addNpcFromCharacter(createDefaultCena(), fakeChar('a'));
    cena = addNpcFromCharacter(cena, fakeChar('b'));
    const next = toggleNpcHidden(cena, 'a');
    expect(next.npcRoster.find(n => n.id === 'a')!.hidden).toBe(true);
    expect(next.npcRoster.find(n => n.id === 'b')!.hidden).toBe(false);
  });
  it('toggleNpcPresent inverte present do alvo', () => {
    const cena = addNpcFromCharacter(createDefaultCena(), fakeChar('a'));
    expect(toggleNpcPresent(cena, 'a').npcRoster[0].present).toBe(false);
  });
});
