import type { LucideIcon } from 'lucide-react';
import { Swords, Compass, Users, Layers, Backpack, Sparkles, LayoutGrid } from 'lucide-react';
import type { TabId } from '../../utils/atmosphere';

export type NavKind = 'mode' | 'satellite';
export interface NavDest {
  id: TabId;
  label: string;
  kind: NavKind;
  icon: LucideIcon;
}

export const MODES: TabId[] = ['combat', 'journey'];
export const SATELLITES: TabId[] = ['characters', 'cards', 'items', 'seals', 'extras'];
// Ordem das teclas 1..7
export const NAV_ORDER: TabId[] = ['combat', 'journey', 'characters', 'cards', 'items', 'seals', 'extras'];

export const NAV_DESTS: Record<TabId, NavDest> = {
  combat:     { id: 'combat',     label: 'Combate',     kind: 'mode',      icon: Swords },
  journey:    { id: 'journey',    label: 'Jornada',     kind: 'mode',      icon: Compass },
  characters: { id: 'characters', label: 'Personagens', kind: 'satellite', icon: Users },
  cards:      { id: 'cards',      label: 'Habilidades', kind: 'satellite', icon: Layers },
  items:      { id: 'items',      label: 'Itens',       kind: 'satellite', icon: Backpack },
  seals:      { id: 'seals',      label: 'Selos',       kind: 'satellite', icon: Sparkles },
  extras:     { id: 'extras',     label: 'Extras',      kind: 'satellite', icon: LayoutGrid },
};
