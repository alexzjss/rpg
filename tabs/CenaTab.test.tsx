import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CenaTab from './CenaTab';
import { createDefaultCena } from '../utils/cena';
import { startEncounter } from '../utils/encounter';
import type { Character, Seal } from '../types';

afterEach(() => cleanup());

function cast(id: string, name: string, over: Partial<Character> = {}): Character {
  return { id, name, icon: '', maxHp: 20, currentHp: 20, maxAura: 10, currentAura: 10,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], role: 'cast', ...over };
}
const props = (cena: any, characters: Character[], over: any = {}) => ({
  cena, characters, cards: [], seals: [], items: [], weapons: [], updateCena: () => {}, updateCharacterStats: () => {}, ...over,
});

describe('CenaTab — iniciar/encerrar (3A intacto)', () => {
  it('Iniciar Combate monta a ordem', () => {
    const updateCena = vi.fn();
    render(<CenaTab {...props(createDefaultCena(), [cast('p1', 'Shinkai')], { updateCena })} />);
    fireEvent.click(screen.getByRole('button', { name: /iniciar combate/i }));
    expect(updateCena.mock.calls[0][0].encounter.order).toHaveLength(1);
  });
});

describe('CenaTab — resolução (3B)', () => {
  it('cura self resolve imediatamente e grava no ator (party)', () => {
    const heal: Seal = { id: 'sh', name: 'Cura', code: '', image: '', description: '', healHp: 5 };
    let cena = createDefaultCena();
    cena = startEncounter(cena, [{ id: 'p1', side: 'party', name: 'Shinkai', baseInitiative: 0 }]);
    const updateCharacterStats = vi.fn();
    const p1 = cast('p1', 'Shinkai', { currentHp: 10, sealIds: ['sh'] });
    render(<CenaTab {...props(cena, [p1], { seals: [heal], updateCharacterStats })} />);
    fireEvent.click(screen.getByText('HABILIDADE'));
    fireEvent.click(screen.getByRole('button', { name: /cura/i }));
    expect(updateCharacterStats).toHaveBeenCalled();
    const [, updates] = updateCharacterStats.mock.calls[0];
    expect(updates.currentHp).toBe(15);
  });
});
