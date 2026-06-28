import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ActionMenu from './ActionMenu';

afterEach(() => cleanup());

describe('ActionMenu', () => {
  it('lista as ações de combate', () => {
    render(<ActionMenu />);
    for (const label of ['ATACAR', 'HABILIDADE', 'FORMA', 'ITEM', 'GUARDA']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
  it('chama onAction ao clicar (quando fornecido)', () => {
    const onAction = vi.fn();
    render(<ActionMenu onAction={onAction} />);
    fireEvent.click(screen.getByText('ATACAR'));
    expect(onAction).toHaveBeenCalledWith('atacar');
  });
});
