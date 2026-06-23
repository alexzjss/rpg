import { describe, it, expect } from 'vitest';
import { NAV_DESTS, MODES, SATELLITES, NAV_ORDER } from './navModel';

describe('navModel', () => {
  it('tem exatamente 2 modos e 5 satélites', () => {
    expect(MODES).toEqual(['combat', 'journey']);
    expect(SATELLITES).toHaveLength(5);
    expect(SATELLITES).not.toContain('combat');
    expect(SATELLITES).not.toContain('journey');
  });

  it('NAV_ORDER cobre os 7 destinos sem repetição', () => {
    expect(NAV_ORDER).toHaveLength(7);
    expect(new Set(NAV_ORDER).size).toBe(7);
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
