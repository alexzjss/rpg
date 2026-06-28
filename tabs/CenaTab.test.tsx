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

describe('CenaTab (exploração)', () => {
  it('mostra o nome do local e a party', () => {
    const cena = createDefaultCena();
    cena.scene.locationName = 'A Propriedade do Barão';
    render(
      <CenaTab cena={cena} characters={[cast('p1', 'Doravar')]} cards={[]} seals={[]} items={[]} weapons={[]}
        updateCena={() => {}} updateCharacterStats={() => {}} />,
    );
    expect(screen.getAllByDisplayValue('A Propriedade do Barão').length).toBeGreaterThan(0);
    expect(screen.getByText('Doravar')).toBeTruthy();
  });

  it('selecionar um membro da party o coloca em destaque no centro', () => {
    const cena = createDefaultCena();
    render(
      <CenaTab cena={cena} characters={[cast('p1', 'Doravar')]} cards={[]} seals={[]} items={[]} weapons={[]}
        updateCena={() => {}} updateCharacterStats={() => {}} />,
    );
    fireEvent.click(screen.getByText('Doravar'));
    expect(screen.getByText('12/20')).toBeTruthy();
  });
});
