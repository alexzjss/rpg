import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CenaTab from './CenaTab';
import { createDefaultCena } from '../utils/cena';
import { startEncounter } from '../utils/encounter';
import type { Character } from '../types';

afterEach(() => cleanup());

function cast(id: string, name: string): Character {
  return { id, name, icon: '', maxHp: 20, currentHp: 12, maxAura: 6, currentAura: 6,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], role: 'cast' };
}
const props = (cena: any, characters: Character[], updateCena: any) => ({
  cena, characters, cards: [], seals: [], items: [], weapons: [], updateCena, updateCharacterStats: () => {},
});

describe('CenaTab — iniciar/encerrar combate', () => {
  it('Iniciar Combate monta a ordem de iniciativa (party + NPCs presentes)', () => {
    const cena = createDefaultCena();
    const updateCena = vi.fn();
    render(<CenaTab {...props(cena, [cast('p1', 'Shinkai')], updateCena)} />);
    fireEvent.click(screen.getByRole('button', { name: /iniciar combate/i }));
    const next = updateCena.mock.calls[0][0];
    expect(next.encounter.isActive).toBe(true);
    expect(next.encounter.order).toHaveLength(1);
    expect(next.encounter.order[0].refId).toBe('p1');
  });

  it('com encounter ativo destaca o ator do turno no ActiveBar', () => {
    let cena = createDefaultCena();
    cena = startEncounter(cena, [{ id: 'p1', side: 'party', name: 'Shinkai', baseInitiative: 0 }]);
    render(<CenaTab {...props(cena, [cast('p1', 'Shinkai')], () => {})} />);
    expect(screen.getByText(/seu turno/i)).toBeTruthy();
    expect(screen.getByText(/rodada/i)).toBeTruthy();
  });

  it('Encerrar Combate limpa a ordem', () => {
    let cena = createDefaultCena();
    cena = startEncounter(cena, [{ id: 'p1', side: 'party', name: 'Shinkai', baseInitiative: 0 }]);
    const updateCena = vi.fn();
    render(<CenaTab {...props(cena, [cast('p1', 'Shinkai')], updateCena)} />);
    fireEvent.click(screen.getByRole('button', { name: /encerrar combate/i }));
    const next = updateCena.mock.calls[0][0];
    expect(next.encounter.isActive).toBe(false);
    expect(next.encounter.order).toEqual([]);
  });
});
