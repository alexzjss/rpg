import { describe, it, expect } from 'vitest';
import { polar, satelliteAngles } from './ringGeometry';

describe('ringGeometry', () => {
  it('polar: 0° aponta para cima (y negativo), raio respeitado', () => {
    const p = polar(0, 100);
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.y).toBeCloseTo(-100, 5);
  });

  it('polar: 90° aponta para a direita', () => {
    const p = polar(90, 50);
    expect(p.x).toBeCloseTo(50, 5);
    expect(p.y).toBeCloseTo(0, 5);
  });

  it('satelliteAngles: N ângulos simétricos dentro do arco', () => {
    const a = satelliteAngles(5, 200); // arco total de 200°, centrado no topo
    expect(a).toHaveLength(5);
    // simétrico em torno de 0
    expect(a[0]).toBeCloseTo(-a[a.length - 1], 5);
    // dentro do arco
    expect(Math.min(...a)).toBeGreaterThanOrEqual(-100);
    expect(Math.max(...a)).toBeLessThanOrEqual(100);
  });

  it('satelliteAngles: 1 item fica no topo (0°)', () => {
    expect(satelliteAngles(1, 200)).toEqual([0]);
  });
});
