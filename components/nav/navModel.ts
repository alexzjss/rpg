import type { LucideIcon } from 'lucide-react';
import { Compass, Users, Shield, Swords } from 'lucide-react';
import type { TabId } from '../../utils/atmosphere';

export type NavKind = 'mode' | 'satellite';
export interface NavDest {
  id: TabId;
  label: string;
  kind: NavKind;
  icon: LucideIcon;
}

export const MODES: TabId[] = ['cena'];
export const SATELLITES: TabId[] = ['characters', 'arsenal'];
// Ordem das teclas 1..3
export const NAV_ORDER: TabId[] = ['cena', 'characters', 'arsenal'];

// NAV_DESTS mantém combat/journey (ainda são TabId até a Fase 4), mas eles
// não aparecem em NAV_ORDER/MODES, portanto ficam inacessíveis pela navegação.
export const NAV_DESTS: Record<TabId, NavDest> = {
  cena:       { id: 'cena',       label: 'Cena',        kind: 'mode',      icon: Compass },
  combat:     { id: 'combat',     label: 'Combate',     kind: 'mode',      icon: Swords },
  journey:    { id: 'journey',    label: 'Jornada',     kind: 'mode',      icon: Compass },
  characters: { id: 'characters', label: 'Personagens', kind: 'satellite', icon: Users },
  arsenal:    { id: 'arsenal',    label: 'Arsenal',     kind: 'satellite', icon: Shield },
};
