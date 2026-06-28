import { describe, it, expect } from 'vitest';
import { createDefaultCena, DEFAULT_SCENE, DEFAULT_ENCOUNTER } from './cena';

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
