import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CenaTab from './CenaTab';
import { createDefaultCena } from '../utils/cena';
import type { Character } from '../types';

afterEach(() => cleanup());

function cast(id: string, name: string): Character {
  return { id, name, icon: '', maxHp: 20, currentHp: 12, maxAura: 6, currentAura: 6,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], role: 'cast' };
}

describe('CenaTab (exploração crimson)', () => {
  it('mostra o nome do local e a party', () => {
    const cena = createDefaultCena();
    cena.scene.locationName = 'A FORTALEZA';
    render(<CenaTab cena={cena} characters={[cast('p1', 'Shinkai')]} cards={[]} seals={[]} items={[]} weapons={[]} updateCena={() => {}} updateCharacterStats={() => {}} />);
    expect(screen.getByDisplayValue('A FORTALEZA')).toBeTruthy();
    expect(screen.getByText('Shinkai')).toBeTruthy();
  });

  it('selecionar um membro da party mostra a ActiveBar (label AURA)', () => {
    const cena = createDefaultCena();
    render(<CenaTab cena={cena} characters={[cast('p1', 'Shinkai')]} cards={[]} seals={[]} items={[]} weapons={[]} updateCena={() => {}} updateCharacterStats={() => {}} />);
    expect(screen.queryByText('AURA')).toBeNull();
    fireEvent.click(screen.getByText('Shinkai'));
    expect(screen.getByText('AURA')).toBeTruthy();
  });
});
