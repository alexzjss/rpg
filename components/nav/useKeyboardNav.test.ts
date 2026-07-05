import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNav } from './useKeyboardNav';

function setup(activeTab = 'cena') {
  const onSelect = vi.fn();
  const view = renderHook(
    ({ tab }) => useKeyboardNav({ activeTab: tab as any, onSelect }),
    { initialProps: { tab: activeTab } },
  );
  return { onSelect, ...view };
}

describe('useKeyboardNav', () => {
  it('"1" vai direto para cena', () => {
    const { result, onSelect } = setup('arsenal');
    act(() => result.current.handleKey({ key: '1', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('cena');
  });

  it('"2" seleciona o 2º destino (characters)', () => {
    const { result, onSelect } = setup('cena');
    act(() => result.current.handleKey({ key: '2', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('characters');
  });

  it('ArrowRight cicla para a próxima aba', () => {
    const { result, onSelect } = setup('cena'); // índice 0
    act(() => result.current.handleKey({ key: 'ArrowRight', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('characters'); // índice 1
  });

  it('ArrowLeft de cena dá a volta para o último (arsenal)', () => {
    const { result, onSelect } = setup('cena');
    act(() => result.current.handleKey({ key: 'ArrowLeft', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('arsenal');
  });
});
