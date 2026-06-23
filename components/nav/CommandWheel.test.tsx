import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { CommandWheel } from './CommandWheel';

afterEach(cleanup);

describe('CommandWheel', () => {
  it('não renderiza nada quando fechada', () => {
    render(<CommandWheel open={false} activeTab="combat" onSelect={() => {}} onClose={() => {}} />);
    expect(document.querySelector('.mp-cmdwheel')).toBeNull();
  });

  it('aberta, renderiza os 7 destinos e seleção fecha', () => {
    const onSelect = vi.fn(); const onClose = vi.fn();
    render(<CommandWheel open activeTab="combat" onSelect={onSelect} onClose={onClose} />);
    const items = document.querySelectorAll('.mp-cmdwheel__item');
    expect(items).toHaveLength(7);
    fireEvent.click(items[2]);
    expect(onSelect).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
