import { describe, it, expect, beforeEach } from 'vitest';
import { SECTION_THEMES, ALL_SEC_VAR_KEYS, applySectionTheme } from './sectionTheme';
import { atmosphereForTab } from './atmosphere';
import type { TabId } from './atmosphere';

const ALL_TABS: TabId[] = ['combat', 'journey', 'characters', 'arsenal', 'extras'];

describe('SECTION_THEMES', () => {
  it('tem entrada para toda TabId', () => {
    for (const t of ALL_TABS) expect(SECTION_THEMES[t]).toBeDefined();
  });
  it('combat usa a tríade Metaphor', () => {
    expect(SECTION_THEMES.combat.vars['--sec-accent']).toBe('#d11f3f');
    expect(SECTION_THEMES.combat.vars['--sec-accent-2']).toBe('#2fd4c4');
    expect(SECTION_THEMES.combat.vars['--sec-accent-3']).toBe('#e6336e');
  });
  it('ALL_SEC_VAR_KEYS cobre todas as chaves usadas por qualquer seção', () => {
    for (const t of ALL_TABS) {
      for (const k of Object.keys(SECTION_THEMES[t].vars)) {
        expect(ALL_SEC_VAR_KEYS).toContain(k);
      }
    }
  });
});

describe('applySectionTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-section');
    document.documentElement.removeAttribute('data-atmosphere');
    for (const k of ALL_SEC_VAR_KEYS) document.documentElement.style.removeProperty(k);
  });
  it('marca data-section e aplica a atmosfera correta da aba', () => {
    applySectionTheme('combat');
    expect(document.documentElement.dataset.section).toBe('combat');
    expect(document.documentElement.dataset.atmosphere).toBe(atmosphereForTab('combat'));
  });
  it('remove as vars de combat ao trocar para uma seção sem overrides', () => {
    applySectionTheme('combat');
    expect(document.documentElement.style.getPropertyValue('--sec-accent')).toBe('#d11f3f');
    expect(document.documentElement.style.getPropertyValue('--gold-mid')).toBe('#2fd4c4');
    applySectionTheme('extras');
    expect(document.documentElement.dataset.section).toBe('extras');
    expect(document.documentElement.style.getPropertyValue('--sec-accent')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--gold-mid')).toBe('');
  });
});
