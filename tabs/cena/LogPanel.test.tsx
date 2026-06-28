import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LogPanel from './LogPanel';
import type { CenaLogEntry } from '../../utils/cena';

afterEach(() => cleanup());

const log: CenaLogEntry[] = [{ id: '1', kind: 'system', text: 'A aventura começa', timestamp: 1 }];

describe('LogPanel', () => {
  it('mostra as entradas do log', () => {
    render(<LogPanel log={log} notes="" onNotesChange={() => {}} />);
    expect(screen.getByText('A aventura começa')).toBeTruthy();
  });
  it('mostra vazio quando não há log', () => {
    render(<LogPanel log={[]} notes="" onNotesChange={() => {}} />);
    expect(screen.getByText(/nada aconteceu ainda/i)).toBeTruthy();
  });
  it('troca para Notas e edita', () => {
    const onNotesChange = vi.fn();
    render(<LogPanel log={log} notes="velho" onNotesChange={onNotesChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /notas/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'novo' } });
    expect(onNotesChange).toHaveBeenCalledWith('novo');
  });
});
