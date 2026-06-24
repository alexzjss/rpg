import { describe, it, expect } from 'vitest';
import { NAV_DESTS, MODES, SATELLITES, NAV_ORDER } from './navModel';

describe('navModel', () => {
  it('tem exatamente 2 modos e 3 satélites', () => {
    expect(MODES).toEqual(['combat', 'journey']);
    expect(SATELLITES).toHaveLength(3);
    expect(SATELLITES).toEqual(['characters', 'arsenal', 'extras']);
    expect(SATELLITES).not.toContain('combat');
    expect(SATELLITES).not.toContain('journey');
  });

  it('NAV_ORDER cobre os 5 destinos sem repetição', () => {
    expect(NAV_ORDER).toHaveLength(5);
    expect(new Set(NAV_ORDER).size).toBe(5);
  });

  it('cada destino tem label, ícone e tipo coerente', () => {
    for (const id of NAV_ORDER) {
      const d = NAV_DESTS[id];
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.icon).toBeTruthy();
      expect(d.kind).toBe(MODES.includes(id) ? 'mode' : 'satellite');
    }
  });
});
