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

const ARSENAL_VARS: Record<string, string> = {
  '--sec-accent':   '#d4142a', // carmesim
  '--sec-accent-2': '#f01030', // vermelho vivo
  '--sec-accent-3': '#ff3a5e', // rosa-vermelho
  '--sec-ink':      '#f4f0e8', // branco-osso
  '--gold-dim':    '#5a0a14',
  '--gold-mid':    '#d4142a',
  '--gold-bright': '#f01030',
  '--gold-pale':   '#ffd9de',
  '--border-gold': 'rgba(212,20,42,0.34)',
  '--ember':       '#d4142a',
  '--ember-deep':  '#8a0a18',
};

const JOURNEY_VARS: Record<string, string> = {
  '--sec-accent':   '#b9a3e8', // lavanda
  '--sec-accent-2': '#3a48b8', // azul-roxo da janela SNES
  '--sec-accent-3': '#c9568f', // magenta (alertas)
  '--sec-ink':      '#ece3ff',
};

const CHARACTERS_VARS: Record<string, string> = {
  '--sec-accent':   '#5a9ae8',
  '--sec-accent-2': '#7fe0ff',
  '--sec-accent-3': '#a8c8ff',
  '--sec-ink':      '#eaf2ff',
  '--gold-dim':    '#1a3866',
  '--gold-mid':    '#5a9ae8',
  '--gold-bright': '#7fe0ff',
  '--gold-pale':   '#dceaff',
  '--border-gold': 'rgba(120,170,255,0.34)',
  '--ember':       '#5a9ae8',
  '--ember-deep':  '#1e4e9a',
};

const EXTRAS_VARS: Record<string, string> = {
  '--sec-accent':   '#9aa3b0',
  '--sec-accent-2': '#cdd3dc',
  '--sec-accent-3': '#6b7280',
  '--sec-ink':      '#e8ebf0',
  '--gold-dim':    '#3a3f47',
  '--gold-mid':    '#8a93a0',
  '--gold-bright': '#cdd3dc',
  '--gold-pale':   '#eef1f5',
  '--border-gold': 'rgba(160,170,185,0.28)',
  '--ember':       '#8a93a0',
  '--ember-deep':  '#4a4f57',
};

export const SECTION_THEMES: Record<TabId, SectionThemeDef> = {
  combat:     { atmosphere: atmosphereForTab('combat'),     vars: COMBAT_VARS },
  journey:    { atmosphere: atmosphereForTab('journey'),    vars: JOURNEY_VARS },
  characters: { atmosphere: atmosphereForTab('characters'), vars: CHARACTERS_VARS },
  arsenal:    { atmosphere: atmosphereForTab('arsenal'),    vars: ARSENAL_VARS },
  extras:     { atmosphere: atmosphereForTab('extras'),     vars: EXTRAS_VARS },
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
