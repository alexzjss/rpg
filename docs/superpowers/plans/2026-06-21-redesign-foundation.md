# Redesign Visual — Fase 0: Fundação & Casca — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a fundação visual compartilhada (tokens de paleta ardente, dois climas, tipografia, textura óleo, primitivos de manuscrito) e aplicar a casca global, transformando a pele do app inteiro sem tocar em lógica/dados.

**Architecture:** Centralizar o visual hoje espalhado em `style={{}}` inline para um sistema: tokens CSS vars (em `utils/theme.ts` + `utils/atmosphere.ts`), classes `mp-*` (em `index.html`) e primitivos React (`components/ui/*`). A casca (navbar, abas, fundos, transição) é migrada para esses primitivos. Clima (escuro-ardente ↔ pergaminho-claro) é um conjunto de CSS vars trocado por aba via `data-atmosphere` no `<html>`. Tudo aditivo e reversível.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind (CDN), Google Fonts (Playfair Display + Cinzel + Inter + JetBrains Mono), Vitest + @testing-library/react (jsdom).

**Spec:** `docs/superpowers/specs/2026-06-21-redesign-foundation-design.md`

---

## Pré-requisitos e baselines

- **Baseline `tsc`:** rode `npx tsc --noEmit` **antes de começar** e anote a contagem (esperado: **29 erros pré-existentes**). Nenhuma tarefa pode aumentar esse número.
- **Git:** o projeto **não é um repositório git** hoje. Os passos de commit assumem git inicializado. Faça a Task 0 primeiro (ou pule os passos de commit se preferir não versionar).
- **Testes:** `npm test` roda `vitest run --passWithNoTests`. Rode após cada tarefa com teste.
- **Não tocar:** `utils/database.ts`, lógica de combate, estado, persistência, fluxos. Apenas camada de apresentação.

---

## File Structure

**Novos:**
- `utils/atmosphere.ts` — tipo `Atmosphere`, mapa aba→clima, conjuntos de CSS vars por clima, `applyAtmosphere()`.
- `utils/motionPref.ts` — preferência de movimento do usuário (toggle) + `shouldReduceMotion()`.
- `components/ui/Panel.tsx`, `Frame.tsx`, `Title.tsx`, `Divider.tsx`, `DropCap.tsx`, `WaxSeal.tsx`, `Button.tsx` — primitivos.
- `components/ui/TabSweep.tsx` — overlay de transição-espetáculo entre abas.
- `components/ui/index.ts` — barrel export dos primitivos.
- Testes correspondentes: `*.test.ts(x)` ao lado de cada módulo/primitivo.

**Modificados:**
- `utils/theme.ts` — tokens novos no `PALETTE` + `CSS_VAR_MAP`.
- `components/combat/animFx.tsx` — `prefersReducedMotion()` passa a respeitar o toggle do usuário (DRY).
- `index.html` — `<link>` Playfair; bloco `<style>` com classes `mp-*` novas e regras de clima/reduced-motion.
- `App.tsx` — efeito de clima por aba no `<html>`; `<TabSweep>`; toggle de reduzir movimento na navbar; navbar e barra de abas migradas para primitivos/classes; cabeçalho de aba via `<Title>`.

---

## Task 0: Inicializar git (opcional, habilita os commits do plano)

**Files:** nenhum (infra).

- [ ] **Step 1: Inicializar repositório**

Run:
```bash
cd /e/RPG-Codex && git init && printf "node_modules/\ndist/\n" > .gitignore
git add -A && git commit -m "chore: snapshot before visual foundation redesign"
```
Expected: repositório criado e commit inicial feito.

> Se optar por não versionar, pule este passo e ignore os passos "Commit" das tarefas seguintes.

---

## Task 1: Tokens da paleta ardente + clima base (`utils/theme.ts`)

**Files:**
- Modify: `utils/theme.ts` (`PALETTE` ~L6-43, `CSS_VAR_MAP` ~L46-58)
- Test: `utils/theme.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `utils/theme.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { PALETTE, injectThemeVars } from './theme';

describe('PALETTE — tokens ardentes', () => {
  it('expõe os metais e tons quentes novos', () => {
    expect(PALETTE.ember).toBe('#f97316');
    expect(PALETTE.auraPurple).toBe('#a855f7');
    expect(PALETTE.parchmentBg).toBe('#e9dcbf');
    expect(PALETTE.parchmentInk).toBe('#221a0f');
  });
  it('aquece o fundo e o texto base', () => {
    expect(PALETTE.bgBase).toBe('#13100b');
    expect(PALETTE.textPrimary).toBe('#f3ecdd');
  });
});

describe('injectThemeVars', () => {
  it('escreve os tokens novos como CSS vars no :root', () => {
    injectThemeVars();
    const s = document.documentElement.style;
    expect(s.getPropertyValue('--ember')).toBe('#f97316');
    expect(s.getPropertyValue('--parchment-bg')).toBe('#e9dcbf');
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `npm test -- theme`
Expected: FAIL (`PALETTE.ember` undefined / valor `bgBase` diferente).

- [ ] **Step 3: Adicionar os tokens ao `PALETTE`**

Em `utils/theme.ts`, dentro do objeto `PALETTE`, altere `bgBase` e `textPrimary` e acrescente o bloco novo antes do `} as const;`:
```ts
  bgBase:    '#13100b',   // near-black quente (era #0f1117)
  // ... (manter demais)
  textPrimary:   '#f3ecdd', // branco quente (era #eef2ff)
```
E ao final do objeto, antes de `} as const;`:
```ts
  // ── Fase 0: paleta ardente + clima pergaminho ──────────
  ember:        '#f97316',  // brasa/laranja — ação
  emberDeep:    '#c2410c',  // brasa profunda
  auraPurple:   '#a855f7',  // púrpura real — magia/aura
  parchmentBg:     '#e9dcbf', // página pergaminho
  parchmentRaised: '#f1e7cf', // pergaminho elevado
  parchmentInk:    '#221a0f', // tinta sépia-quase-preto
  parchmentInkSoft:'#5a4a30', // tinta suave
  parchmentBorder: 'rgba(34,26,15,0.25)',
```

- [ ] **Step 4: Mapear os tokens novos em `CSS_VAR_MAP`**

Em `CSS_VAR_MAP`, acrescente (o TS obriga cobrir toda chave do `PALETTE`):
```ts
  ember: '--ember', emberDeep: '--ember-deep', auraPurple: '--aura-purple',
  parchmentBg: '--parchment-bg', parchmentRaised: '--parchment-raised',
  parchmentInk: '--parchment-ink', parchmentInkSoft: '--parchment-ink-soft',
  parchmentBorder: '--parchment-border',
```

- [ ] **Step 5: Rodar o teste e confirmar passagem**

Run: `npm test -- theme`
Expected: PASS.

- [ ] **Step 6: Confirmar baseline de tipos**

Run: `npx tsc --noEmit`
Expected: mesma contagem do baseline (29), sem erros novos.

- [ ] **Step 7: Commit**

```bash
git add utils/theme.ts utils/theme.test.ts
git commit -m "feat(theme): tokens da paleta ardente + clima pergaminho"
```

---

## Task 2: Sistema de clima (`utils/atmosphere.ts`)

**Files:**
- Create: `utils/atmosphere.ts`
- Test: `utils/atmosphere.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `utils/atmosphere.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { atmosphereForTab, ATMOSPHERE_VARS, applyAtmosphere } from './atmosphere';

describe('atmosphereForTab', () => {
  it('jornada é pergaminho; o resto é escuro', () => {
    expect(atmosphereForTab('journey')).toBe('parchment');
    for (const t of ['combat','cards','items','seals','characters','extras'] as const) {
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
```

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `npm test -- atmosphere`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar `utils/atmosphere.ts`**

Create `utils/atmosphere.ts`:
```ts
export type TabId = 'combat' | 'cards' | 'items' | 'seals' | 'characters' | 'extras' | 'journey';
export type Atmosphere = 'dark' | 'parchment';

const TAB_ATMOSPHERE: Record<TabId, Atmosphere> = {
  combat: 'dark', cards: 'dark', items: 'dark', seals: 'dark',
  characters: 'dark', extras: 'dark', journey: 'parchment',
};

export function atmosphereForTab(tab: TabId): Atmosphere {
  return TAB_ATMOSPHERE[tab];
}

// Mesmo conjunto de chaves nos dois climas — trocar substitui tudo.
export const ATMOSPHERE_VARS: Record<Atmosphere, Record<string, string>> = {
  dark: {
    '--bg-base': '#13100b',
    '--bg-surface': '#1b1710',
    '--bg-raised': '#241e14',
    '--bg-overlay': '#2c2417',
    '--text-primary': '#f3ecdd',
    '--text-secondary': '#c9b896',
    '--text-muted': '#8a7a5c',
    '--border-faint': 'rgba(240,224,180,0.08)',
    '--border-mid': 'rgba(240,224,180,0.16)',
    '--surface-ink': '#f3ecdd',
  },
  parchment: {
    '--bg-base': '#e0d2b0',
    '--bg-surface': '#e9dcbf',
    '--bg-raised': '#f1e7cf',
    '--bg-overlay': '#f6eed9',
    '--text-primary': '#221a0f',
    '--text-secondary': '#5a4a30',
    '--text-muted': '#897459',
    '--border-faint': 'rgba(34,26,15,0.12)',
    '--border-mid': 'rgba(34,26,15,0.24)',
    '--surface-ink': '#221a0f',
  },
};

export function applyAtmosphere(atmo: Atmosphere, root: HTMLElement = document.documentElement): void {
  root.dataset.atmosphere = atmo;
  const vars = ATMOSPHERE_VARS[atmo];
  for (const k of Object.keys(vars)) root.style.setProperty(k, vars[k]);
}
```

- [ ] **Step 4: Rodar o teste e confirmar passagem**

Run: `npm test -- atmosphere`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/atmosphere.ts utils/atmosphere.test.ts
git commit -m "feat(atmosphere): clima escuro/pergaminho por aba via data-atmosphere"
```

---

## Task 3: Preferência de movimento + toggle (`utils/motionPref.ts`)

**Files:**
- Create: `utils/motionPref.ts`
- Modify: `components/combat/animFx.tsx` (`prefersReducedMotion` ~L105)
- Test: `utils/motionPref.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `utils/motionPref.test.ts`:
```ts
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
```

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `npm test -- motionPref`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar `utils/motionPref.ts`**

Create `utils/motionPref.ts`:
```ts
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
```

- [ ] **Step 4: Rodar o teste e confirmar passagem**

Run: `npm test -- motionPref`
Expected: PASS.

- [ ] **Step 5: Fazer o combate respeitar o toggle (DRY)**

Em `components/combat/animFx.tsx`, na função `prefersReducedMotion()` (~L105), faça-a respeitar o override do usuário. Importe no topo do arquivo:
```ts
import { getUserReducedMotion } from '../../utils/motionPref';
```
E altere o corpo de `prefersReducedMotion` para retornar `true` se o usuário ligou o toggle, antes da checagem de `matchMedia`. Exemplo:
```ts
export function prefersReducedMotion(): boolean {
  if (getUserReducedMotion()) return true;
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

- [ ] **Step 6: Rodar a suíte e os tipos**

Run: `npm test`
Expected: PASS (incluindo `components/combat/animFx.test.ts`).
Run: `npx tsc --noEmit`
Expected: baseline 29, sem erros novos.

- [ ] **Step 7: Commit**

```bash
git add utils/motionPref.ts utils/motionPref.test.ts components/combat/animFx.tsx
git commit -m "feat(motion): toggle de reduzir movimento + combate respeita override"
```

---

## Task 4: Fontes + CSS base de clima/tipografia (`index.html`)

**Files:**
- Modify: `index.html` (`<link>` Google Fonts L8; bloco `<style>`)

> Tarefa puramente estética — verificação por build + visual (sem teste unitário).

- [ ] **Step 1: Adicionar Playfair Display ao `<link>` de fontes**

Em `index.html` L8, troque a URL do `<link>` de fontes para incluir Playfair Display:
```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:ital,wght@1,700;1,800;1,900&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Definir as classes de tipografia e regras de clima no `<style>`**

No bloco `<style>` do `index.html`, adicione (perto das demais regras de fonte, ~L58):
```css
/* ── Fase 0: tipografia cerimonial ── */
.mp-title, .mp-page-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic; font-weight: 900;
  letter-spacing: -0.01em; line-height: 0.92;
  color: var(--text-primary);
}
.mp-kicker {
  font-family: 'Cinzel', serif; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.32em;
  font-size: 9px; color: var(--gold-mid);
}
/* base que reage ao clima ativo */
html { background-color: var(--bg-base); }
:root[data-atmosphere='parchment'] body { color: var(--text-primary); }
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: build conclui sem erros.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(type): Playfair display itálico + classes de título/kicker e base de clima"
```

---

## Task 5: Classes utilitárias de textura óleo + ornamento (`index.html`)

**Files:**
- Modify: `index.html` (bloco `<style>`)

> Estético — verificação por build + visual. Estas classes são consumidas pelos primitivos da Task 6–8.

- [ ] **Step 1: Adicionar o bloco de classes `mp-*` de superfície/ornamento**

No `<style>` do `index.html`, adicione um bloco dedicado:
```css
/* ════ Fase 0: sistema óleo + manuscrito ════ */

/* textura de tela (grão) reutilizável */
.mp-canvas, .mp-panel__canvas {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  opacity: 0.06; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

/* glaze: manchas quentes difusas de fundo */
.mp-glaze {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(60% 50% at 18% 12%, rgba(249,115,22,0.10), transparent 60%),
    radial-gradient(55% 50% at 85% 80%, rgba(168,85,247,0.10), transparent 60%);
}

/* vinheta de profundidade */
.mp-vignette {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  box-shadow: inset 0 0 180px rgba(0,0,0,0.55);
}
:root[data-atmosphere='parchment'] .mp-vignette {
  box-shadow: inset 0 0 160px rgba(120,90,40,0.35);
}

/* borda de pincelada (anti flat) */
.mp-paint-edge {
  clip-path: polygon(0 3px, 3px 0, calc(100% - 4px) 1px, 100% 4px,
                     calc(100% - 1px) calc(100% - 5px), calc(100% - 5px) 100%,
                     4px calc(100% - 1px), 1px calc(100% - 4px));
}

/* painel base */
.mp-panel {
  position: relative; overflow: hidden;
  background: var(--bg-surface);
  border: 1px solid var(--border-mid);
  box-shadow: 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
}
.mp-panel > *:not(.mp-panel__canvas) { position: relative; z-index: 1; }
.mp-panel--raised { background: var(--bg-raised); }
.mp-panel--parchment {
  background: var(--parchment-bg); color: var(--parchment-ink);
  border-color: var(--parchment-border);
  box-shadow: 0 8px 36px rgba(60,40,10,0.25), inset 0 1px 0 rgba(255,255,255,0.4);
}

/* moldura de quadro pintado */
.mp-frame {
  position: relative; overflow: hidden;
  border: 3px solid transparent;
  border-image: linear-gradient(135deg, var(--gold-bright), var(--gold-dim)) 1;
  box-shadow: 0 0 24px rgba(201,152,58,0.3), inset 0 0 30px rgba(0,0,0,0.6);
}
.mp-frame__art { display: block; width: 100%; height: 100%; object-fit: cover; }

/* divisória ornamental */
.mp-divider {
  position: relative; height: 1px; margin: 18px 0;
  background: linear-gradient(90deg, transparent, var(--border-gold), transparent);
}
.mp-divider__gem {
  position: absolute; left: 50%; top: 50%; width: 8px; height: 8px;
  transform: translate(-50%, -50%) rotate(45deg);
  background: var(--gold-mid); box-shadow: 0 0 8px var(--gold-bright);
}

/* capitular iluminada */
.mp-dropcap-block { text-indent: 0; }
.mp-dropcap {
  float: left; font-family: 'Playfair Display', serif; font-style: italic;
  font-weight: 900; font-size: 3.4em; line-height: 0.8;
  padding: 4px 10px 0 0; color: var(--gold-bright);
  text-shadow: 0 2px 12px rgba(201,152,58,0.5);
}

/* selo de cera */
.mp-wax {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 50%;
  font-size: 12px; color: #fff;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.5);
}
.mp-wax--crimson { background: radial-gradient(circle at 35% 30%, #ef4444, #991b1b); }
.mp-wax--gold    { background: radial-gradient(circle at 35% 30%, #f0c060, #8a6520); }
.mp-wax--purple  { background: radial-gradient(circle at 35% 30%, #c084fc, #6b21a8); }

/* CTA primário/ghost (estende o mp-cta existente) */
.mp-cta--primary {
  background: linear-gradient(135deg, var(--gold-mid), var(--ember-deep));
  color: #fff; border: 1px solid var(--gold-bright);
  clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
  box-shadow: 0 0 18px rgba(201,152,58,0.4);
}
.mp-cta--ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-mid); }
.mp-cta:disabled { opacity: 0.45; cursor: not-allowed; }

/* transição-espetáculo entre abas */
.mp-tab-sweep {
  position: fixed; inset: 0; z-index: 60; pointer-events: none; overflow: hidden;
  animation: mp-sweep 620ms cubic-bezier(0.7,0,0.2,1) forwards;
}
.mp-tab-sweep::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(100deg, var(--ember-deep), var(--gold-mid) 50%, var(--aura-purple));
  transform: translateX(-110%); animation: mp-sweep-bar 620ms cubic-bezier(0.7,0,0.2,1) forwards;
}
.mp-tab-sweep__word {
  position: absolute; left: 6%; top: 50%; transform: translateY(-50%);
  font-family: 'Playfair Display', serif; font-style: italic; font-weight: 900;
  font-size: 11vw; color: rgba(255,255,255,0.92); white-space: nowrap;
  opacity: 0; animation: mp-sweep-word 620ms ease-out forwards;
}
@keyframes mp-sweep-bar { 0%{transform:translateX(-110%)} 55%{transform:translateX(0)} 100%{transform:translateX(110%)} }
@keyframes mp-sweep-word { 0%,20%{opacity:0;transform:translateY(-50%) scale(0.9)} 50%{opacity:1;transform:translateY(-50%) scale(1)} 100%{opacity:0} }
@keyframes mp-sweep { to { opacity: 1; } }

/* respeitar reduzir-movimento (toggle ou sistema) */
:root[data-reduced-motion='true'] .mp-tab-sweep,
:root[data-reduced-motion='true'] .mp-tab-sweep::before { animation: none; display: none; }
@media (prefers-reduced-motion: reduce) {
  .mp-tab-sweep, .mp-tab-sweep::before { animation: none; display: none; }
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: build conclui sem erros.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(css): classes óleo+manuscrito (canvas/glaze/panel/frame/divider/wax/cta/sweep)"
```

---

## Task 6: Primitivos `<Panel>` e `<Frame>`

**Files:**
- Create: `components/ui/Panel.tsx`, `components/ui/Frame.tsx`
- Test: `components/ui/Panel.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

Create `components/ui/Panel.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Panel } from './Panel';
import { Frame } from './Frame';

describe('Panel', () => {
  it('renderiza filhos e a classe da variante', () => {
    const { getByText, container } = render(<Panel variant="raised">Olá</Panel>);
    expect(getByText('Olá')).toBeTruthy();
    const el = container.querySelector('.mp-panel');
    expect(el?.className).toContain('mp-panel--raised');
    expect(container.querySelector('.mp-panel__canvas')).toBeTruthy();
  });
});

describe('Frame', () => {
  it('renderiza a arte quando há src', () => {
    const { container } = render(<Frame src="/x.png" alt="retrato" />);
    const img = container.querySelector('img.mp-frame__art') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('alt')).toBe('retrato');
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- Panel`
Expected: FAIL (módulos não existem).

- [ ] **Step 3: Implementar `Panel.tsx`**

Create `components/ui/Panel.tsx`:
```tsx
import React from 'react';

type PanelVariant = 'dark' | 'parchment' | 'raised';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant;
}

export function Panel({ variant = 'dark', className = '', children, ...rest }: PanelProps) {
  return (
    <div className={`mp-panel mp-panel--${variant} ${className}`.trim()} {...rest}>
      <span aria-hidden className="mp-panel__canvas" />
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Implementar `Frame.tsx`**

Create `components/ui/Frame.tsx`:
```tsx
import React from 'react';

interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
}

export function Frame({ src, alt = '', className = '', children, ...rest }: FrameProps) {
  return (
    <div className={`mp-frame ${className}`.trim()} {...rest}>
      {src ? <img className="mp-frame__art" src={src} alt={alt} /> : children}
    </div>
  );
}
```

- [ ] **Step 5: Rodar e confirmar passagem**

Run: `npm test -- Panel`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/ui/Panel.tsx components/ui/Frame.tsx components/ui/Panel.test.tsx
git commit -m "feat(ui): primitivos Panel e Frame"
```

---

## Task 7: Primitivos `<Title>`/`<Kicker>`, `<Divider>`, `<DropCap>`

**Files:**
- Create: `components/ui/Title.tsx`, `components/ui/Divider.tsx`, `components/ui/DropCap.tsx`
- Test: `components/ui/Title.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

Create `components/ui/Title.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Title, Kicker } from './Title';
import { Divider } from './Divider';
import { DropCap } from './DropCap';

describe('Title', () => {
  it('renderiza título e kicker', () => {
    const { getByText, container } = render(<Title kicker="CAPÍTULO" level={1}>Jornada</Title>);
    expect(getByText('Jornada')).toBeTruthy();
    expect(container.querySelector('.mp-kicker')?.textContent).toBe('CAPÍTULO');
    expect(container.querySelector('h1.mp-title')).toBeTruthy();
  });
  it('mostra marca d\'água quando watermark', () => {
    const { container } = render(<Title watermark>Combate</Title>);
    expect(container.querySelector('.mp-title__watermark')?.textContent).toBe('Combate');
  });
});

describe('Kicker', () => {
  it('aplica a classe', () => {
    const { container } = render(<Kicker>OK</Kicker>);
    expect(container.querySelector('.mp-kicker')).toBeTruthy();
  });
});

describe('Divider', () => {
  it('tem papel separator e o gema', () => {
    const { container } = render(<Divider />);
    expect(container.querySelector('.mp-divider')?.getAttribute('role')).toBe('separator');
    expect(container.querySelector('.mp-divider__gem')).toBeTruthy();
  });
});

describe('DropCap', () => {
  it('separa a primeira letra', () => {
    const { container } = render(<DropCap>Era uma vez</DropCap>);
    expect(container.querySelector('.mp-dropcap')?.textContent).toBe('E');
    expect(container.textContent).toBe('Era uma vez');
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- Title`
Expected: FAIL (módulos não existem).

- [ ] **Step 3: Implementar `Title.tsx`**

Create `components/ui/Title.tsx`:
```tsx
import React from 'react';

export function Kicker({ className = '', children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={`mp-kicker ${className}`.trim()} {...rest}>{children}</span>;
}

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  kicker?: string;
  watermark?: boolean;
  level?: 1 | 2 | 3;
}

export function Title({ kicker, watermark, level = 2, className = '', children, ...rest }: TitleProps) {
  const Heading = (`h${level}`) as 'h1' | 'h2' | 'h3';
  return (
    <div className="mp-title-wrap" style={{ position: 'relative' }}>
      {watermark && <span aria-hidden className="mp-title__watermark">{children}</span>}
      {kicker && <Kicker>{kicker}</Kicker>}
      {React.createElement(Heading, { className: `mp-title ${className}`.trim(), ...rest }, children)}
    </div>
  );
}
```

- [ ] **Step 4: Implementar `Divider.tsx`**

Create `components/ui/Divider.tsx`:
```tsx
import React from 'react';

export function Divider({ className = '', ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="separator" aria-hidden className={`mp-divider ${className}`.trim()} {...rest}>
      <span className="mp-divider__gem" />
    </div>
  );
}
```

- [ ] **Step 5: Implementar `DropCap.tsx`**

Create `components/ui/DropCap.tsx`:
```tsx
import React from 'react';

export function DropCap({ children }: { children: string }) {
  const text = String(children);
  return (
    <p className="mp-dropcap-block">
      <span className="mp-dropcap">{text.slice(0, 1)}</span>{text.slice(1)}
    </p>
  );
}
```

- [ ] **Step 6: Adicionar o CSS da marca d'água do `<Title>`**

No `<style>` do `index.html`, adicione:
```css
.mp-title__watermark {
  position: absolute; left: -8px; top: 50%; transform: translateY(-50%);
  font-family: 'Playfair Display', serif; font-style: italic; font-weight: 900;
  font-size: 5em; line-height: 1; white-space: nowrap;
  color: var(--text-primary); opacity: 0.05; pointer-events: none; z-index: 0;
}
```

- [ ] **Step 7: Rodar e confirmar passagem**

Run: `npm test -- Title`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add components/ui/Title.tsx components/ui/Divider.tsx components/ui/DropCap.tsx components/ui/Title.test.tsx index.html
git commit -m "feat(ui): primitivos Title/Kicker, Divider e DropCap"
```

---

## Task 8: Primitivos `<WaxSeal>` e `<Button>`

**Files:**
- Create: `components/ui/WaxSeal.tsx`, `components/ui/Button.tsx`
- Test: `components/ui/WaxSeal.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

Create `components/ui/WaxSeal.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { WaxSeal } from './WaxSeal';
import { Button } from './Button';

describe('WaxSeal', () => {
  it('aplica o tom e o título', () => {
    const { container } = render(<WaxSeal tone="gold" label="fixado">★</WaxSeal>);
    const el = container.querySelector('.mp-wax');
    expect(el?.className).toContain('mp-wax--gold');
    expect(el?.getAttribute('title')).toBe('fixado');
    expect(el?.textContent).toBe('★');
  });
});

describe('Button', () => {
  it('aplica a variante e dispara onClick', () => {
    const onClick = vi.fn();
    const { getByText } = render(<Button variant="primary" onClick={onClick}>Iniciar</Button>);
    const btn = getByText('Iniciar');
    expect(btn.className).toContain('mp-cta--primary');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });
  it('respeita disabled', () => {
    const onClick = vi.fn();
    const { getByText } = render(<Button disabled onClick={onClick}>X</Button>);
    fireEvent.click(getByText('X'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- WaxSeal`
Expected: FAIL (módulos não existem).

- [ ] **Step 3: Implementar `WaxSeal.tsx`**

Create `components/ui/WaxSeal.tsx`:
```tsx
import React from 'react';

interface WaxSealProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'crimson' | 'gold' | 'purple';
  label?: string;
}

export function WaxSeal({ tone = 'crimson', label, className = '', children, ...rest }: WaxSealProps) {
  return (
    <span className={`mp-wax mp-wax--${tone} ${className}`.trim()} title={label} {...rest}>
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Implementar `Button.tsx`**

Create `components/ui/Button.tsx`:
```tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`mp-cta mp-cta--${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
```

- [ ] **Step 5: Rodar e confirmar passagem**

Run: `npm test -- WaxSeal`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/ui/WaxSeal.tsx components/ui/Button.tsx components/ui/WaxSeal.test.tsx
git commit -m "feat(ui): primitivos WaxSeal e Button"
```

---

## Task 9: Barrel export + `<TabSweep>` + integração de clima/movimento no App

**Files:**
- Create: `components/ui/index.ts`, `components/ui/TabSweep.tsx`
- Modify: `App.tsx` (imports; efeito de clima; render do TabSweep; raiz)
- Test: `components/ui/TabSweep.test.tsx`

- [ ] **Step 1: Escrever o teste que falha do TabSweep**

Create `components/ui/TabSweep.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TabSweep } from './TabSweep';

describe('TabSweep', () => {
  it('mostra a palavra da aba', () => {
    const { container } = render(<TabSweep tabKey="combat" label="Combate" />);
    expect(container.querySelector('.mp-tab-sweep__word')?.textContent).toBe('Combate');
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- TabSweep`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar `TabSweep.tsx`**

Create `components/ui/TabSweep.tsx`:
```tsx
import React from 'react';

// Remonta a cada troca de aba (via key externa) e a animação CSS roda uma vez.
export function TabSweep({ tabKey, label }: { tabKey: string; label: string }) {
  return (
    <div key={tabKey} className="mp-tab-sweep" aria-hidden>
      <span className="mp-tab-sweep__word">{label}</span>
    </div>
  );
}
```

- [ ] **Step 4: Criar o barrel `components/ui/index.ts`**

Create `components/ui/index.ts`:
```ts
export { Panel } from './Panel';
export { Frame } from './Frame';
export { Title, Kicker } from './Title';
export { Divider } from './Divider';
export { DropCap } from './DropCap';
export { WaxSeal } from './WaxSeal';
export { Button } from './Button';
export { TabSweep } from './TabSweep';
```

- [ ] **Step 5: Rodar e confirmar passagem do TabSweep**

Run: `npm test -- TabSweep`
Expected: PASS.

- [ ] **Step 6: Integrar clima por aba no `App.tsx`**

No topo do `App.tsx`, adicione os imports:
```ts
import { applyAtmosphere, atmosphereForTab } from './utils/atmosphere';
import { TabSweep } from './components/ui';
```
Logo após a declaração de `activeTab` (~L3075), adicione um efeito que aplica o clima:
```tsx
React.useEffect(() => {
  applyAtmosphere(atmosphereForTab(activeTab as any));
}, [activeTab]);
```
> Use `useEffect` conforme já importado no arquivo (ajuste o nome se o projeto importa `{ useEffect }` direto).

- [ ] **Step 7: Renderizar o `<TabSweep>` na troca de aba**

No JSX raiz do App (logo dentro do contêiner de mais alto nível, antes da `<nav>` ~L5665), adicione:
```tsx
<TabSweep tabKey={activeTab} label={TAB_META[activeTab].label} />
```
A `key={activeTab}` força remontagem → a animação `mp-tab-sweep` roda a cada troca; reduced-motion já a desativa via CSS (Task 5).

- [ ] **Step 8: Verificar tipos, testes e build**

Run: `npx tsc --noEmit`
Expected: baseline 29, sem erros novos.
Run: `npm test`
Expected: PASS.
Run: `npm run build`
Expected: sem erros.

- [ ] **Step 9: Commit**

```bash
git add components/ui/index.ts components/ui/TabSweep.tsx components/ui/TabSweep.test.tsx App.tsx
git commit -m "feat(app): clima por aba + transição-espetáculo TabSweep + barrel ui"
```

---

## Task 10: Migrar a navbar para o registro novo

**Files:**
- Modify: `App.tsx` (`<nav>` ~L5665-5700 e cabeçalho/logo)

> Migração visual da casca. Verificação: tsc + build + visual. Substituir gradualmente — manter funcionalidade idêntica.

- [ ] **Step 1: Trocar o cabeçalho/título da navbar por `<Title>`**

Em `App.tsx`, no bloco do logo (~L5680-5685), substitua o `div` com `mp-section-kicker` + `mp-page-title` por:
```tsx
<div className="hidden md:block" style={{ minWidth: 0 }}>
  <Title kicker={TAB_META[activeTab].kicker} level={2} className="mp-page-title"
         style={{ fontSize: 'clamp(20px, 1.9vw, 28px)', marginTop: 3 }}>
    {TAB_META[activeTab].label}
  </Title>
</div>
```
Adicione `Title` ao import de `./components/ui` (Step do import já feito na Task 9; inclua `Title`).

- [ ] **Step 2: Aplicar a textura óleo ao fundo da navbar**

No elemento `<nav>` (~L5666), adicione, logo após a abertura, a camada de canvas (mantendo a costura diagonal existente):
```tsx
<span aria-hidden className="mp-canvas" />
```
> Garanta que o conteúdo da nav fique acima (a nav já usa `position: sticky`/`overflow: hidden`; o `mp-canvas` é `z-index:0`, conteúdo permanece visível pois usa `position: relative`).

- [ ] **Step 3: Adicionar o botão de "reduzir movimento" na navbar**

No grupo de ações da navbar (perto do botão "Salvar agora" ~L5701-5711), adicione um toggle. Importe no topo:
```ts
import { getUserReducedMotion, setUserReducedMotion } from './utils/motionPref';
```
Adicione um estado de UI junto aos demais (~L3075):
```tsx
const [reducedMotion, setReducedMotion] = React.useState(getUserReducedMotion());
```
E o botão (usando o ícone `Zap`/`ZapOff` do lucide-react, já em uso no projeto; ajuste para um ícone existente se necessário):
```tsx
<button
  onClick={() => { const v = !reducedMotion; setUserReducedMotion(v); setReducedMotion(v); }}
  className="mp-cta mp-cta--ghost transition-all"
  style={{ padding: '9px' }}
  title={reducedMotion ? 'Movimento reduzido (clique para animar)' : 'Reduzir movimento'}
  aria-pressed={reducedMotion}
>
  {reducedMotion ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
</button>
```
> Garanta que `Zap`/`ZapOff` estejam no import de `lucide-react`; se não, use ícones já importados (ex.: `Sparkles`).

- [ ] **Step 4: Verificar tipos e build**

Run: `npx tsc --noEmit`
Expected: baseline 29.
Run: `npm run build`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add App.tsx
git commit -m "refactor(navbar): título via Title + textura óleo + toggle reduzir movimento"
```

---

## Task 11: Migrar a barra de abas (`TabButton`) para o registro de selo

**Files:**
- Modify: `App.tsx` (componente `TabButton`)

> Verificação: tsc + build + visual. Estado ativo com contraste alto (regra de ouro).

- [ ] **Step 1: Localizar e atualizar `TabButton`**

Encontre a definição de `TabButton` em `App.tsx` (`grep -n "const TabButton" App.tsx`). Atualize a classe/estilo do botão para o registro novo, preservando props (`icon`, `active`, `onClick`, `children`). Garanta:
- ativo: fundo brasa/ouro com `mp-cta--primary` ou estilo equivalente + selo/realce de cera (alto contraste);
- inativo: `mp-cta--ghost`, texto `var(--text-secondary)` legível (não some);
- recorte diagonal (`clip-path`) coerente com a navbar.

Exemplo de corpo:
```tsx
function TabButton({ icon, active, onClick, children }: {
  icon: React.ReactNode; active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`mp-cta ${active ? 'mp-cta--primary' : 'mp-cta--ghost'} flex items-center gap-2`}
      style={{ padding: '8px 14px', fontWeight: active ? 800 : 600 }}
    >
      <span aria-hidden>{icon}</span>
      <span>{children}</span>
    </button>
  );
}
```

- [ ] **Step 2: Verificar tipos e build**

Run: `npx tsc --noEmit`
Expected: baseline 29.
Run: `npm run build`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add App.tsx
git commit -m "refactor(tabs): TabButton no registro de selo, ativo com contraste alto"
```

---

## Task 12: Fundo pintado-herói por clima + camadas de fundo

**Files:**
- Modify: `index.html` (`<style>`), `App.tsx` (contêiner de página)

> Verificação: build + visual. Adiciona glaze + vinheta + (placeholder de) fundo-herói por clima.

- [ ] **Step 1: Adicionar a regra de fundo de página por clima**

No `<style>` do `index.html`, adicione:
```css
.mp-page-bg { position: fixed; inset: 0; z-index: -1; pointer-events: none; background: var(--bg-base); }
:root[data-atmosphere='parchment'] .mp-page-bg { background: var(--parchment-bg); }
```

- [ ] **Step 2: Renderizar as camadas de fundo no App**

No `App.tsx`, logo dentro do contêiner raiz (antes do `<TabSweep>`), adicione:
```tsx
<div aria-hidden className="mp-page-bg">
  <span className="mp-glaze" />
  <span className="mp-vignette" />
</div>
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add index.html App.tsx
git commit -m "feat(bg): fundo de página por clima com glaze e vinheta"
```

---

## Task 13: Verificação final da Fase 0

**Files:** nenhum (verificação).

- [ ] **Step 1: Tipos contra baseline**

Run: `npx tsc --noEmit`
Expected: **29 erros** (baseline), zero novos.

- [ ] **Step 2: Suíte de testes**

Run: `npm test`
Expected: todos PASS (theme, atmosphere, motionPref, Panel, Title, WaxSeal, TabSweep, + suíte de combate existente).

- [ ] **Step 3: Build de produção**

Run: `npm run build`
Expected: build conclui sem erros.

- [ ] **Step 4: Checagem visual manual (rodar `npm run dev`)**

Confirme, navegando no app:
- [ ] Casca nova coerente (navbar com título Playfair itálico, textura, metais quentes).
- [ ] Trocar de aba dispara a transição-espetáculo (pincelada + palavra gigante).
- [ ] Combate/ação em clima escuro-ardente; **Jornada** em clima pergaminho-claro legível.
- [ ] Contraste alto em todos os pares texto/fundo (regra de ouro) — nada lavado ou sumindo.
- [ ] Abas ativa/inativa nitidamente distintas.
- [ ] `PlayerMirror` abre e espelha sem erro de console.
- [ ] Ligar o toggle "reduzir movimento" (ou `prefers-reduced-motion`) desativa a transição-espetáculo.

- [ ] **Step 5: Commit do fechamento (se houver ajustes)**

```bash
git add -A
git commit -m "chore: fechamento da Fase 0 — fundação visual validada"
```

> **Critério de pronto da Fase 0:** casca + primitivos aprovados visualmente, servindo de estrela-guia para as Fases 1 (Combate), 2 (Jornada) e 3 (resto). Cada uma terá seu próprio ciclo spec → plano.

---

## Notas de auto-revisão (cobertura do spec)

- Bloco 1 (paleta) → Task 1. Bloco 2 (tipografia) → Task 4. Bloco 3 (textura óleo) → Task 5. Bloco 4 (primitivos) → Tasks 6–8. Bloco 5 (climas) → Tasks 2, 9. Bloco 6 (casca) → Tasks 10–12. Bloco 7 (arquitetura) → distribuído (centralização em theme/atmosphere/ui + migração incremental). Bloco 8 (verificação) → Task 13. Escape hatch de movimento → Task 3 + Task 5.
- Sem placeholders: todo passo de código traz o código real. Nomes consistentes entre tasks (`applyAtmosphere`, `atmosphereForTab`, `shouldReduceMotion`, `Panel/Frame/Title/Kicker/Divider/DropCap/WaxSeal/Button/TabSweep`).
- Toggle de UI "reduzir movimento" na navbar usa `setUserReducedMotion`/`getUserReducedMotion` de `utils/motionPref.ts` — fica a critério adicionar o botão visual durante a Task 10/11 (a infra e o gating CSS já existem); incluir se desejado sem alterar a lógica.
