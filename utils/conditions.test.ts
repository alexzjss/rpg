import { describe, it, expect } from 'vitest';
import { tickConditions } from './conditions';

describe('tickConditions', () => {
  it('aplica dano por turno e decrementa a duração', () => {
    const r = tickConditions('Shinkai', [{ name: 'Queimando', duration: 2 }]);
    expect(r.delta.hp).toBe(-3);
    expect(r.conditions).toEqual([{ name: 'Queimando', duration: 1 }]);
    expect(r.log.length).toBeGreaterThanOrEqual(1);
  });
  it('aplica cura por turno (Regenerando)', () => {
    const r = tickConditions('Shinkai', [{ name: 'Regenerando', duration: 3 }]);
    expect(r.delta.hp).toBe(3);
    expect(r.conditions[0].duration).toBe(2);
  });
  it('remove condição expirada (duração chega a 0) e loga', () => {
    const r = tickConditions('Shinkai', [{ name: 'Envenenado', duration: 1 }]);
    expect(r.delta.hp).toBe(-2);
    expect(r.conditions).toEqual([]);
    expect(r.log.some(l => /expirou/i.test(l.text))).toBe(true);
  });
  it('condição comportamental (sem perTurn) só conta duração, sem delta', () => {
    const r = tickConditions('Shinkai', [{ name: 'Paralisado', duration: 2 }]);
    expect(r.delta).toEqual({});
    expect(r.conditions).toEqual([{ name: 'Paralisado', duration: 1 }]);
  });
  it('condição desconhecida só decrementa', () => {
    const r = tickConditions('Shinkai', [{ name: 'Inexistente', duration: 2 }]);
    expect(r.delta).toEqual({});
    expect(r.conditions).toEqual([{ name: 'Inexistente', duration: 1 }]);
  });
  it('soma múltiplas condições de dano', () => {
    const r = tickConditions('Shinkai', [{ name: 'Queimando', duration: 2 }, { name: 'Envenenado', duration: 2 }]);
    expect(r.delta.hp).toBe(-5);
  });
});
