import { describe, it, expect, beforeEach } from 'vitest';
import { atmosphereForTab, ATMOSPHERE_VARS, applyAtmosphere } from './atmosphere';

describe('atmosphereForTab', () => {
  it('jornada é dusk; o resto (incl. cena) é escuro', () => {
    expect(atmosphereForTab('journey')).toBe('dusk');
    for (const t of ['cena','combat','arsenal','characters','extras'] as const) {
      expect(atmosphereForTab(t)).toBe('dark');
    }
  });
});

describe('ATMOSPHERE_VARS', () => {
  it('os três climas definem exatamente o mesmo conjunto de vars', () => {
    const d = Object.keys(ATMOSPHERE_VARS.dark).sort();
    for (const climate of ['parchment','dusk'] as const) {
      expect(Object.keys(ATMOSPHERE_VARS[climate]).sort()).toEqual(d);
    }
  });
});

describe('applyAtmosphere', () => {
  beforeEach(() => { document.documentElement.removeAttribute('data-atmosphere'); });
  it('marca o <html> e troca as vars', () => {
    applyAtmosphere('parchment');
    expect(document.documentElement.dataset.atmosphere).toBe('parchment');
    expect(document.documentElement.style.getPropertyValue('--bg-base'))
      .toBe(ATMOSPHERE_VARS.parchment['--bg-base']);
    applyAtmosphere('dark');
    expect(document.documentElement.dataset.atmosphere).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--bg-base'))
      .toBe(ATMOSPHERE_VARS.dark['--bg-base']);
  });
});
