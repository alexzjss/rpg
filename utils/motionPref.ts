const KEY = 'rpgcodex.reducedMotion';
let userFlag: boolean = typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1';

export function getUserReducedMotion(): boolean {
  return userFlag;
}

export function setUserReducedMotion(v: boolean): void {
  userFlag = v;
  if (typeof localStorage !== 'undefined') {
    if (v) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  }
  if (typeof document !== 'undefined') {
    if (v) document.documentElement.dataset.reducedMotion = 'true';
    else delete document.documentElement.dataset.reducedMotion;
  }
}

function systemReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function shouldReduceMotion(): boolean {
  return userFlag || systemReducedMotion();
}
