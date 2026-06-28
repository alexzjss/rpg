import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CenaTab from './CenaTab';
import { createDefaultCena } from '../utils/cena';

describe('CenaTab (scaffold)', () => {
  it('renderiza o nome do local da cena', () => {
    const cena = createDefaultCena();
    cena.scene.locationName = 'A Propriedade do Barão';
    render(
      <CenaTab
        cena={cena}
        characters={[]}
        cards={[]}
        seals={[]}
        items={[]}
        weapons={[]}
        updateCena={() => {}}
        updateCharacterStats={() => {}}
      />,
    );
    expect(screen.getByText('A Propriedade do Barão')).toBeTruthy();
  });
});
