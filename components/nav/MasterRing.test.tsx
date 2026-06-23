import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MasterRing } from './MasterRing';

describe('MasterRing', () => {
  it('renderiza os 5 satélites e o hub com role tab', () => {
    const { container } = render(
      <MasterRing activeTab="combat" mode="combat" onSelect={() => {}} onToggleMode={() => {}} />
    );
    expect(container.querySelectorAll('.mp-ring__sat')).toHaveLength(5);
    expect(container.querySelector('.mp-ring__hub')).toBeTruthy();
    expect(container.querySelectorAll('[role="tab"]').length).toBeGreaterThanOrEqual(6);
  });

  it('marca a aba ativa com aria-selected', () => {
    const { container } = render(
      <MasterRing activeTab="seals" mode="combat" onSelect={() => {}} onToggleMode={() => {}} />
    );
    const sel = container.querySelector('[aria-selected="true"]');
    expect(sel?.getAttribute('aria-label')).toContain('Selos');
  });

  it('satélites escondidos por padrão; hover no hub revela (data-open)', () => {
    const { container } = render(
      <MasterRing activeTab="combat" mode="combat" onSelect={() => {}} onToggleMode={() => {}} />
    );
    const ring = container.querySelector('.mp-ring')!;
    expect(ring.getAttribute('data-open')).toBe('false');
    fireEvent.mouseEnter(container.querySelector('.mp-ring__hub')!);
    expect(ring.getAttribute('data-open')).toBe('true');
  });

  it('clicar num satélite chama onSelect; clicar no hub chama onToggleMode', () => {
    const onSelect = vi.fn(); const onToggleMode = vi.fn();
    const { container } = render(
      <MasterRing activeTab="combat" mode="combat" onSelect={onSelect} onToggleMode={onToggleMode} />
    );
    fireEvent.click(container.querySelector('.mp-ring__sat')!);
    expect(onSelect).toHaveBeenCalled();
    fireEvent.click(container.querySelector('.mp-ring__hub')!);
    expect(onToggleMode).toHaveBeenCalled();
  });
});
