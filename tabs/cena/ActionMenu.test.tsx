import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ActionMenu from './ActionMenu';
import type { ResolvedAction, ActionCategory } from '../../utils/actions';
import { GUARD_ACTION } from '../../utils/actions';

afterEach(() => cleanup());

const ra = (over: Partial<ResolvedAction>): ResolvedAction => ({
  source: 'card', id: 'a', name: 'Golpe', category: 'atacar', diceRoll: '1d20', targeting: 'other', ...over,
});
const groups = (over: Partial<Record<ActionCategory, ResolvedAction[]>> = {}): Record<ActionCategory, ResolvedAction[]> => ({
  atacar: [], habilidade: [], forma: [], item: [], guarda: [GUARD_ACTION], ...over,
});

describe('ActionMenu', () => {
  it('mostra as categorias', () => {
    render(<ActionMenu actions={groups()} />);
    for (const label of ['ATACAR', 'HABILIDADE', 'FORMA', 'ITEM', 'GUARDA']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
  it('abre a categoria e seleciona uma ação real', () => {
    const onSelectAction = vi.fn();
    render(<ActionMenu actions={groups({ atacar: [ra({ name: 'Bola de Fogo' })] })} onSelectAction={onSelectAction} />);
    fireEvent.click(screen.getByText('ATACAR'));
    fireEvent.click(screen.getByText('Bola de Fogo'));
    expect(onSelectAction).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bola de Fogo' }));
  });
});
