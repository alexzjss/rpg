import { useCallback, useEffect, useRef, useState } from 'react';
import type { TabId } from '../../utils/atmosphere';
import { MODES, SATELLITES, NAV_ORDER } from './navModel';

export interface UseRadialNav {
  activeTab: TabId;
  mode: TabId;            // último modo "armado" (combat|journey)
  wheelOpen: boolean;
  toggleMode: () => void;
  select: (id: TabId) => void;
  openWheel: () => void;
  closeWheel: () => void;
  handleKey: (e: KeyboardEvent) => void;
}

export function useRadialNav({ activeTab, onSelect }: {
  activeTab: TabId;
  onSelect: (id: TabId) => void;
}): UseRadialNav {
  const [wheelOpen, setWheelOpen] = useState(false);
  const lastMode = useRef<TabId>(MODES.includes(activeTab) ? activeTab : 'combat');
  useEffect(() => {
    if (MODES.includes(activeTab)) lastMode.current = activeTab;
  }, [activeTab]);

  const select = useCallback((id: TabId) => onSelect(id), [onSelect]);

  const toggleMode = useCallback(() => {
    // Em um modo: vira para o outro. Em um satélite: volta ao último modo exibido.
    const next: TabId = MODES.includes(activeTab)
      ? (activeTab === 'combat' ? 'journey' : 'combat')
      : lastMode.current;
    lastMode.current = next;
    onSelect(next);
  }, [activeTab, onSelect]);

  const openWheel = useCallback(() => setWheelOpen(true), []);
  const closeWheel = useCallback(() => setWheelOpen(false), []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    // 1-7 → destino direto
    if (e.key >= '1' && e.key <= '7') {
      const id = NAV_ORDER[Number(e.key) - 1];
      if (id) { e.preventDefault(); onSelect(id); }
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const list = SATELLITES;
      const cur = list.indexOf(activeTab);
      const base = cur === -1 ? 0 : cur;
      const delta = e.key === 'ArrowRight' ? 1 : -1;
      onSelect(list[(base + delta + list.length) % list.length]);
      return;
    }
    if (e.key === 'Escape') { setWheelOpen(false); }
  }, [activeTab, onSelect]);

  return {
    activeTab, mode: lastMode.current, wheelOpen,
    toggleMode, select, openWheel, closeWheel, handleKey,
  };
}
