import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNav } from './useKeyboardNav';

function setup(activeTab = 'combat') {
  const onSelect = vi.fn();
  const view = renderHook(
    ({ tab }) => useKeyboardNav({ activeTab: tab as any, onSelect }),
    { initialProps: { tab: activeTab } },
  );
  return { onSelect, ...view };
}

describe('useKeyboardNav', () => {
  it('"3" seleciona o 3º destino (characters)', () => {
    const { result, onSelect } = setup('combat');
    act(() => result.current.handleKey({ key: '3', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('characters');
  });

  it('"1" e "2" vão direto a combat e journey', () => {
    const { result, onSelect } = setup('arsenal');
    act(() => result.current.handleKey({ key: '1', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('combat');
    act(() => result.current.handleKey({ key: '2', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('journey');
  });

  it('ArrowRight cicla para a próxima aba', () => {
    const { result, onSelect } = setup('combat'); // índice 0
    act(() => result.current.handleKey({ key: 'ArrowRight', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('journey'); // índice 1
  });

  it('ArrowLeft de combat dá a volta para o último (extras)', () => {
    const { result, onSelect } = setup('combat');
    act(() => result.current.handleKey({ key: 'ArrowLeft', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('extras');
  });
});
