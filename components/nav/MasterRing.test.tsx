import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { MasterRing } from './MasterRing';

afterEach(cleanup);

// MasterRing renderiza via portal no document.body — consultar via document.
describe('MasterRing', () => {
  it('renderiza os 5 satélites e o hub com role tab', () => {
    render(<MasterRing activeTab="combat" mode="combat" onSelect={() => {}} onToggleMode={() => {}} />);
    expect(document.querySelectorAll('.mp-ring__sat')).toHaveLength(5);
    expect(document.querySelector('.mp-ring__hub')).toBeTruthy();
    expect(document.querySelectorAll('[role="tab"]').length).toBeGreaterThanOrEqual(6);
  });

  it('marca a aba ativa com aria-selected', () => {
    render(<MasterRing activeTab="seals" mode="combat" onSelect={() => {}} onToggleMode={() => {}} />);
    const sel = document.querySelector('.mp-ring [aria-selected="true"]');
    expect(sel?.getAttribute('aria-label')).toContain('Selos');
  });

  it('satélites escondidos por padrão; hover no hub revela (data-open)', () => {
    render(<MasterRing activeTab="combat" mode="combat" onSelect={() => {}} onToggleMode={() => {}} />);
    const ring = document.querySelector('.mp-ring')!;
    expect(ring.getAttribute('data-open')).toBe('false');
    fireEvent.mouseEnter(document.querySelector('.mp-ring__hub')!);
    expect(ring.getAttribute('data-open')).toBe('true');
  });

  it('clicar num satélite chama onSelect; clicar no hub chama onToggleMode', () => {
    const onSelect = vi.fn(); const onToggleMode = vi.fn();
    render(<MasterRing activeTab="combat" mode="combat" onSelect={onSelect} onToggleMode={onToggleMode} />);
    fireEvent.click(document.querySelector('.mp-ring__sat')!);
    expect(onSelect).toHaveBeenCalled();
    fireEvent.click(document.querySelector('.mp-ring__hub')!);
    expect(onToggleMode).toHaveBeenCalled();
  });
});
