import { describe, it, expect, beforeEach } from 'vitest';
import { getUserReducedMotion, setUserReducedMotion, shouldReduceMotion } from './motionPref';

describe('motionPref', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-reduced-motion');
    setUserReducedMotion(false);
  });
  it('default é falso (sem override e matchMedia false no setup)', () => {
    expect(getUserReducedMotion()).toBe(false);
    expect(shouldReduceMotion()).toBe(false);
  });
  it('ligar persiste e marca o <html>', () => {
    setUserReducedMotion(true);
    expect(getUserReducedMotion()).toBe(true);
    expect(shouldReduceMotion()).toBe(true);
    expect(document.documentElement.dataset.reducedMotion).toBe('true');
    expect(localStorage.getItem('rpgcodex.reducedMotion')).toBe('1');
  });
});
