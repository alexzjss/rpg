import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CenaTab from './CenaTab';
import { createDefaultCena } from '../utils/cena';
import type { Character } from '../types';

afterEach(() => cleanup());

function cast(id: string, name: string): Character {
  return { id, name, icon: '', maxHp: 20, currentHp: 12, maxAura: 6, currentAura: 6,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], role: 'cast' };
}

describe('CenaTab — exploração', () => {
  it('mostra o nome do local e a party', () => {
    const cena = createDefaultCena();
    cena.scene.locationName = 'A FORTALEZA';
    render(<CenaTab cena={cena} characters={[cast('p1', 'Shinkai')]} cards={[]} seals={[]} items={[]} weapons={[]} updateCena={() => {}} updateCharacterStats={() => {}} />);
    expect(screen.getByDisplayValue('A FORTALEZA')).toBeTruthy();
    expect(screen.getByText('Shinkai')).toBeTruthy();
  });

  it('o botão Iniciar Combate liga o encounter', () => {
    const cena = createDefaultCena();
    const updateCena = vi.fn();
    render(<CenaTab cena={cena} characters={[]} cards={[]} seals={[]} items={[]} weapons={[]} updateCena={updateCena} updateCharacterStats={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /iniciar combate/i }));
    expect(updateCena).toHaveBeenCalled();
    expect(updateCena.mock.calls[0][0].encounter.isActive).toBe(true);
  });
});

describe('CenaTab — combate', () => {
  it('com encounter ativo mostra tracker de iniciativa e menu de ações', () => {
    const cena = { ...createDefaultCena(), encounter: { isActive: true, round: 3, turnIndex: 0, order: [] } };
    render(<CenaTab cena={cena} characters={[cast('p1', 'Shinkai')]} cards={[]} seals={[]} items={[]} weapons={[]} updateCena={() => {}} updateCharacterStats={() => {}} />);
    expect(screen.getByText(/rodada/i)).toBeTruthy();
    expect(screen.getByText('ATACAR')).toBeTruthy();
    expect(screen.getByRole('button', { name: /encerrar combate/i })).toBeTruthy();
  });
});
