import type { LucideIcon } from 'lucide-react';
import { Swords, Compass, Users, Shield, LayoutGrid } from 'lucide-react';
import type { TabId } from '../../utils/atmosphere';

export type NavKind = 'mode' | 'satellite';
export interface NavDest {
  id: TabId;
  label: string;
  kind: NavKind;
  icon: LucideIcon;
}

export const MODES: TabId[] = ['combat', 'journey'];
export const SATELLITES: TabId[] = ['characters', 'arsenal', 'extras'];
// Ordem das teclas 1..5
export const NAV_ORDER: TabId[] = ['combat', 'journey', 'characters', 'arsenal', 'extras'];

export const NAV_DESTS: Record<TabId, NavDest> = {
  combat:     { id: 'combat',     label: 'Combate',     kind: 'mode',      icon: Swords },
  journey:    { id: 'journey',    label: 'Jornada',     kind: 'mode',      icon: Compass },
  characters: { id: 'characters', label: 'Personagens', kind: 'satellite', icon: Users },
  arsenal:    { id: 'arsenal',    label: 'Arsenal',     kind: 'satellite', icon: Shield },
  extras:     { id: 'extras',     label: 'Extras',      kind: 'satellite', icon: LayoutGrid },
};
