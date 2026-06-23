import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRadialNav } from './useRadialNav';

function setup(activeTab = 'combat') {
  const onSelect = vi.fn();
  const view = renderHook(
    ({ tab }) => useRadialNav({ activeTab: tab as any, onSelect }),
    { initialProps: { tab: activeTab } },
  );
  return { onSelect, ...view };
}

describe('useRadialNav', () => {
  it('toggleMode alterna combat→journey e seleciona', () => {
    const { result, onSelect } = setup('combat');
    act(() => result.current.toggleMode());
    expect(onSelect).toHaveBeenCalledWith('journey');
  });

  it('toggleMode a partir de um satélite volta ao último modo (journey)', () => {
    const { result, onSelect, rerender } = setup('combat');
    act(() => result.current.toggleMode());        // -> journey (lastMode=journey)
    rerender({ tab: 'characters' });               // agora num satélite
    act(() => result.current.toggleMode());         // deve re-selecionar o último modo
    expect(onSelect).toHaveBeenLastCalledWith('journey');
  });

  it('handleKey "3" seleciona o 3º destino (characters)', () => {
    const { result, onSelect } = setup('combat');
    act(() => result.current.handleKey({ key: '3', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('characters');
  });

  it('setas ciclam entre satélites', () => {
    const { result, onSelect } = setup('characters');
    act(() => result.current.handleKey({ key: 'ArrowRight', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('cards');
  });

  it('openWheel/closeWheel alternam o estado wheelOpen', () => {
    const { result } = setup();
    expect(result.current.wheelOpen).toBe(false);
    act(() => result.current.openWheel());
    expect(result.current.wheelOpen).toBe(true);
    act(() => result.current.closeWheel());
    expect(result.current.wheelOpen).toBe(false);
  });
});
