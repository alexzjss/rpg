import { describe, it, expect } from 'vitest';
import { NAV_DESTS, MODES, SATELLITES, NAV_ORDER } from './navModel';

describe('navModel', () => {
  it('tem exatamente 1 modo (cena) e 3 satélites', () => {
    expect(MODES).toEqual(['cena']);
    expect(SATELLITES).toEqual(['characters', 'arsenal', 'extras']);
    expect(SATELLITES).not.toContain('cena');
  });

  it('NAV_ORDER cobre os 4 destinos sem repetição, começando por cena', () => {
    expect(NAV_ORDER).toEqual(['cena', 'characters', 'arsenal', 'extras']);
    expect(new Set(NAV_ORDER).size).toBe(4);
  });

  it('cada destino navegável tem label, ícone e tipo coerente', () => {
    for (const id of NAV_ORDER) {
      const d = NAV_DESTS[id];
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.icon).toBeTruthy();
      expect(d.kind).toBe(MODES.includes(id) ? 'mode' : 'satellite');
    }
  });
});
