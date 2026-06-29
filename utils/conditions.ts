import { PRESET_CONDITIONS } from '../types';
import type { CenaLogEntry } from './cena';
import { logEntry } from './cena';

export interface TickResult {
  delta: { hp?: number; aura?: number; ammo?: number };
  conditions: { name: string; duration: number }[];
  log: CenaLogEntry[];
}

/**
 * Processa as condições no início do turno do portador:
 * aplica dano/cura por turno (via PRESET_CONDITIONS.perTurn), decrementa a
 * duração e remove as expiradas. Puro.
 */
export function tickConditions(holderName: string, conditions: { name: string; duration: number }[]): TickResult {
  const log: CenaLogEntry[] = [];
  let hp = 0;
  const next: { name: string; duration: number }[] = [];

  for (const cond of conditions) {
    const preset = PRESET_CONDITIONS.find(p => p.name === cond.name);
    const value = preset?.defaultValue ?? 0;
    if (preset?.perTurn === 'damage' && value) {
      hp -= value;
      log.push(logEntry('condition', `${holderName} sofre ${value} de ${cond.name}.`));
    } else if (preset?.perTurn === 'heal' && value) {
      hp += value;
      log.push(logEntry('condition', `${holderName} recupera ${value} de HP (${cond.name}).`));
    }
    const dur = cond.duration - 1;
    if (dur > 0) {
      next.push({ name: cond.name, duration: dur });
    } else {
      log.push(logEntry('condition', `${cond.name} expirou em ${holderName}.`));
    }
  }

  return { delta: hp !== 0 ? { hp } : {}, conditions: next, log };
}
