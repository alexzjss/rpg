export type TabId = 'combat' | 'arsenal' | 'characters' | 'extras' | 'journey';
export type Atmosphere = 'dark' | 'parchment';

const TAB_ATMOSPHERE: Record<TabId, Atmosphere> = {
  combat: 'dark', arsenal: 'dark',
  characters: 'dark', extras: 'dark', journey: 'parchment',
};

export function atmosphereForTab(tab: TabId): Atmosphere {
  return TAB_ATMOSPHERE[tab];
}

export const ATMOSPHERE_VARS: Record<Atmosphere, Record<string, string>> = {
  dark: {
    '--bg-base': '#13100b',
    '--bg-surface': '#1b1710',
    '--bg-raised': '#241e14',
    '--bg-overlay': '#2c2417',
    '--text-primary': '#f3ecdd',
    '--text-secondary': '#c9b896',
    '--text-muted': '#8a7a5c',
    '--border-faint': 'rgba(240,224,180,0.08)',
    '--border-mid': 'rgba(240,224,180,0.16)',
    '--surface-ink': '#f3ecdd',
  },
  parchment: {
    '--bg-base': '#e0d2b0',
    '--bg-surface': '#e9dcbf',
    '--bg-raised': '#f1e7cf',
    '--bg-overlay': '#f6eed9',
    '--text-primary': '#221a0f',
    '--text-secondary': '#5a4a30',
    '--text-muted': '#897459',
    '--border-faint': 'rgba(34,26,15,0.12)',
    '--border-mid': 'rgba(34,26,15,0.24)',
    '--surface-ink': '#221a0f',
  },
};

export function applyAtmosphere(atmo: Atmosphere, root: HTMLElement = document.documentElement): void {
  root.dataset.atmosphere = atmo;
  const vars = ATMOSPHERE_VARS[atmo];
  for (const k of Object.keys(vars)) root.style.setProperty(k, vars[k]);
}
