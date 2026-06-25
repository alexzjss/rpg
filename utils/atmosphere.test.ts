import { describe, it, expect, beforeEach } from 'vitest';
import { atmosphereForTab, ATMOSPHERE_VARS, applyAtmosphere } from './atmosphere';

describe('atmosphereForTab', () => {
  it('jornada é pergaminho; o resto é escuro', () => {
    expect(atmosphereForTab('journey')).toBe('parchment');
    for (const t of ['combat','arsenal','characters','extras'] as const) {
      expect(atmosphereForTab(t)).toBe('dark');
    }
  });
});

describe('ATMOSPHERE_VARS', () => {
  it('os dois climas definem exatamente o mesmo conjunto de vars', () => {
    const d = Object.keys(ATMOSPHERE_VARS.dark).sort();
    const p = Object.keys(ATMOSPHERE_VARS.parchment).sort();
    expect(p).toEqual(d);
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
