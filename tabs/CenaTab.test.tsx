import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CenaTab from './CenaTab';
import { createDefaultCena, createDefaultEncounter } from '../utils/cena';
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

describe('CenaTab — iniciar/encerrar + resolução (3A/3B intactos)', () => {
  it('Iniciar Combate monta a ordem', () => {
    const updateCena = vi.fn();
    render(<CenaTab {...props(createDefaultCena(), [cast('p1', 'Shinkai')], { updateCena })} />);
    fireEvent.click(screen.getByRole('button', { name: /iniciar combate/i }));
    expect(updateCena.mock.calls[0][0].encounter.order).toHaveLength(1);
  });

  it('cura self resolve imediatamente (party)', () => {
    const heal: Seal = { id: 'sh', name: 'Cura', code: '', image: '', description: '', healHp: 5 };
    let cena = createDefaultCena();
    cena = startEncounter(cena, [{ id: 'p1', side: 'party', name: 'Shinkai', baseInitiative: 0 }]);
    const updateCharacterStats = vi.fn();
    render(<CenaTab {...props(cena, [cast('p1', 'Shinkai', { currentHp: 10, sealIds: ['sh'] })], { seals: [heal], updateCharacterStats })} />);
    fireEvent.click(screen.getByText('HABILIDADE'));
    fireEvent.click(screen.getByRole('button', { name: /cura/i }));
    expect(updateCharacterStats).toHaveBeenCalled();
    expect(updateCharacterStats.mock.calls[0][1].currentHp).toBe(15);
  });
});

describe('CenaTab — condições automáticas (3C)', () => {
  it('avançar para o turno aplica o dano de condição ao ator do novo turno', () => {
    const cena = { ...createDefaultCena(), encounter: { ...createDefaultEncounter(), isActive: true, round: 1, turnIndex: 0, order: [
      { refId: 'p1', side: 'party' as const, initiative: 20 },
      { refId: 'p2', side: 'party' as const, initiative: 10 },
    ] } };
    const updateCharacterStats = vi.fn();
    const p1 = cast('p1', 'Shinkai');
    const p2 = cast('p2', 'Mikhail', { currentHp: 20, conditions: [{ name: 'Queimando', duration: 2 }] });
    render(<CenaTab {...props(cena, [p1, p2], { updateCharacterStats })} />);
    fireEvent.click(screen.getByRole('button', { name: /próximo turno/i }));
    const call = updateCharacterStats.mock.calls.find(c => c[0] === 'p2');
    expect(call).toBeTruthy();
    expect(call![1].currentHp).toBe(17);
    expect(call![1].conditions).toEqual([{ name: 'Queimando', duration: 1 }]);
  });
});
