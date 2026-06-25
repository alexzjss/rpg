import type { TabId, Atmosphere } from './atmosphere';
import { applyAtmosphere, atmosphereForTab } from './atmosphere';

export interface SectionThemeDef {
  atmosphere: Atmosphere;
  vars: Record<string, string>;
}

const COMBAT_VARS: Record<string, string> = {
  '--sec-accent':   '#d11f3f', // carmesim
  '--sec-accent-2': '#2fd4c4', // teal
  '--sec-accent-3': '#e6336e', // magenta
  '--sec-ink':      '#f4f0e8', // branco-creme
  '--sec-mp':       '#5a8ad8', // azul MP
  '--sec-gold':     '#e6b84e', // ouro (acento menor)
  '--gold-dim':    '#155055',
  '--gold-mid':    '#2fd4c4',
  '--gold-bright': '#7fe9dd',
  '--gold-pale':   '#eafff9',
  '--border-gold': 'rgba(47,212,196,0.30)',
  '--team-cast':   '#2fd4c4',
  '--ember':       '#d11f3f',
  '--ember-deep':  '#a3122e',
};

export const SECTION_THEMES: Record<TabId, SectionThemeDef> = {
  combat:     { atmosphere: atmosphereForTab('combat'),     vars: COMBAT_VARS },
  journey:    { atmosphere: atmosphereForTab('journey'),    vars: {} },
  characters: { atmosphere: atmosphereForTab('characters'), vars: {} },
  arsenal:    { atmosphere: atmosphereForTab('arsenal'),    vars: {} },
  extras:     { atmosphere: atmosphereForTab('extras'),     vars: {} },
};

// União de todas as chaves --sec-* declaradas por qualquer seção (para limpeza ao trocar).
export const ALL_SEC_VAR_KEYS: readonly string[] = Array.from(
  new Set(Object.values(SECTION_THEMES).flatMap(def => Object.keys(def.vars)))
);

export function applySectionTheme(tab: TabId, root: HTMLElement = document.documentElement): void {
  const def = SECTION_THEMES[tab];
  applyAtmosphere(def.atmosphere, root);
  root.dataset.section = tab;
  for (const k of ALL_SEC_VAR_KEYS) root.style.removeProperty(k);
  for (const [k, v] of Object.entries(def.vars)) root.style.setProperty(k, v);
}
