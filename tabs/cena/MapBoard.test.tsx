import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import MapBoard from './MapBoard';
import type { Character } from '../../types';

afterEach(() => cleanup());

function ch(id: string, name: string): Character {
  return { id, name, icon: '', maxHp: 10, currentHp: 10, maxAura: 5, currentAura: 5, maxAmmo: 0, currentAmmo: 0,
    baseInitiative: 0, cardIds: [], conditions: [], items: [] };
}

describe('MapBoard', () => {
  it('renderiza um token por participante presente, com a inicial do nome', () => {
    render(<MapBoard image="" participants={[ch('p1', 'Shinkai'), ch('p2', 'Mikhail')]} tokens={{}} activeId={null} onMoveToken={() => {}} onSelect={() => {}} />);
    expect(screen.getByText(/solte o mapa/i)).toBeTruthy();
    expect(screen.getAllByText('S').length).toBeGreaterThan(0);
    expect(screen.getAllByText('M').length).toBeGreaterThan(0);
  });

  it('aplica a posição salva do token', () => {
    render(<MapBoard image="x.png" participants={[ch('p1', 'Shinkai')]} tokens={{ p1: { x: 40, y: 60 } }} activeId="p1" onMoveToken={() => {}} onSelect={() => {}} />);
    const token = screen.getByText('S').closest('[data-token-id]') as HTMLElement;
    expect(token.getAttribute('data-token-id')).toBe('p1');
    expect(token.style.left).toBe('40%');
    expect(token.style.top).toBe('60%');
  });
});
