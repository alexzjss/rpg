# Reformulação das animações de ação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reformular o fluxo visual das ações no turno (carta → reação → rolagem → comparação → resultado → resolução) com look unificado e mais impacto, corrigindo o bug do resultado repetido nas reações.

**Architecture:** Mantemos `CardRevealAnimation` e `DiceAnimation` como componentes separados, mas extraímos a lógica compartilhada (tier/pacing, juíce, helper de motion, keyframes CSS e um hook de sequência) para um novo módulo `components/combat/animFx.ts(x)`. O bug do resultado repetido é corrigido na raiz por um hook `useAnimSequence` que dispara pela identidade do payload (`runKey`) e guarda o `onComplete` num `ref`, em vez de depender da identidade da função.

**Tech Stack:** React 19 + TypeScript + Vite. Testes com Vitest + @testing-library/react (jsdom) — adicionados neste plano (o projeto ainda não tem test runner). Estética/juíce via CSS-in-JS (`<style>`), como o código atual já faz.

> **Nota sobre git:** este diretório **não** é um repositório git. Os passos de "Commit" abaixo seguem o padrão do skill; se o repo não estiver inicializado, **pule os commits** (ou rode `git init` antes). A verificação real de cada tarefa é `npx tsc --noEmit` + `npm run build` + `npm test`.

> **Baseline:** `npx tsc --noEmit` tem **29 erros pré-existentes** (conforme specs anteriores). "Sem novos erros" = continuar em 29.

---

## File Structure

**Novo:**
- `components/combat/animFx.tsx` — núcleo compartilhado:
  - `prefersReducedMotion()` (helper único)
  - `deriveTier(ctx)` → `'trivial' | 'dramatic'`
  - `getPacing(tier, reduced)` → durações por beat
  - `RESULT_TONES` (tokens de cor por desfecho) e `getJuice(kind, reduced)` (shake/flash)
  - `useAnimSequence(...)` (hook orquestrador + correção do bug + skip)
  - `AnimFxStyles` (componente `<style>` com keyframes compartilhados: shake, flash)

**Modificados:**
- `components/CardRevealAnimation.tsx` — consumir `animFx`, trocar o `useEffect` pelo hook, juíce, clique-para-pular, prop `dramatic`.
- `components/DiceAnimation.tsx` — reescrito: painéis estilizados (sem dado 3D), `animFx`, hook, clique-para-pular.
- `App.tsx` — `onComplete` estável via `useCallback`; passar `dramatic` nos 4 call sites de `setCardAnim`.

**Testes:**
- `components/combat/animFx.test.ts` — unit (puro) + hook (RTL/fake timers).
- `vitest.config.ts`, `vitest.setup.ts` — config + stub de `matchMedia`.

**Intocados (de propósito):** animação de Forma (`formaAnimCard` em `App.tsx`), `components/FusionOverlay.tsx`.

---

## Task 1: Configurar Vitest + Testing Library

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `components/combat/__smoke__.test.ts` (smoke test temporário)

- [ ] **Step 1: Instalar dependências de teste**

Run:
```bash
npm install -D vitest@^2 jsdom@^25 @testing-library/react@^16 @testing-library/dom@^10
```
Expected: instala sem erros; `package.json` ganha as devDependencies.

- [ ] **Step 2: Adicionar script de teste no `package.json`**

No bloco `"scripts"`, adicionar a linha `"test"`:
```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
```

- [ ] **Step 3: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

- [ ] **Step 4: Criar `vitest.setup.ts` (stub de matchMedia)**

```ts
// jsdom não implementa matchMedia; stub para prefersReducedMotion().
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}
```

- [ ] **Step 5: Criar smoke test temporário**

`components/combat/__smoke__.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Rodar os testes**

Run: `npm test`
Expected: PASS (1 teste passa). Confirma que o runner está configurado.

- [ ] **Step 7: Remover o smoke test**

Run: `rm components/combat/__smoke__.test.ts`

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "chore: setup vitest + testing-library"
```

---

## Task 2: `animFx` — derivação de tier (TDD)

**Files:**
- Create: `components/combat/animFx.tsx`
- Test: `components/combat/animFx.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

`components/combat/animFx.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { deriveTier } from './animFx';

describe('deriveTier', () => {
  it('é trivial quando não há gatilhos', () => {
    expect(deriveTier({})).toBe('trivial');
  });
  it('é dramatic quando há reação', () => {
    expect(deriveTier({ hasReaction: true })).toBe('dramatic');
  });
  it('é dramatic com flag dramatic (ex: CD)', () => {
    expect(deriveTier({ dramatic: true })).toBe('dramatic');
  });
  it('é dramatic em crítico ou falha', () => {
    expect(deriveTier({ isCrit: true })).toBe('dramatic');
    expect(deriveTier({ isFumble: true })).toBe('dramatic');
  });
});
```

- [ ] **Step 2: Rodar para confirmar a falha**

Run: `npm test`
Expected: FAIL — "Failed to resolve import './animFx'" / `deriveTier is not a function`.

- [ ] **Step 3: Implementação mínima**

`components/combat/animFx.tsx`:
```tsx
export type AnimTier = 'trivial' | 'dramatic';

export interface TierContext {
  dramatic?: boolean;
  hasReaction?: boolean;
  isCrit?: boolean;
  isFumble?: boolean;
}

export function deriveTier(ctx: TierContext): AnimTier {
  if (ctx.dramatic || ctx.hasReaction || ctx.isCrit || ctx.isFumble) return 'dramatic';
  return 'trivial';
}
```

- [ ] **Step 4: Rodar para confirmar PASS**

Run: `npm test`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add components/combat/animFx.tsx components/combat/animFx.test.ts
git commit -m "feat(animFx): deriveTier"
```

---

## Task 3: `animFx` — motor de pacing (TDD)

**Files:**
- Modify: `components/combat/animFx.tsx`
- Test: `components/combat/animFx.test.ts`

- [ ] **Step 1: Escrever o teste que falha (adicionar ao arquivo)**

Adicionar ao `components/combat/animFx.test.ts`:
```ts
import { getPacing } from './animFx';

describe('getPacing', () => {
  it('reduced encurta tudo e zera o suspense', () => {
    const p = getPacing('dramatic', true);
    expect(p.rollsShown).toBeLessThanOrEqual(200);
    expect(p.cardShown).toBeLessThanOrEqual(120);
  });
  it('trivial é mais curto que dramatic', () => {
    const t = getPacing('trivial', false);
    const d = getPacing('dramatic', false);
    expect(t.rollsShown).toBeLessThan(d.rollsShown);
    expect(t.reactionShown).toBe(0); // sem reação no fluxo trivial
  });
  it('todas as durações são finitas e >= 0', () => {
    for (const tier of ['trivial', 'dramatic'] as const) {
      for (const reduced of [false, true]) {
        const p = getPacing(tier, reduced);
        for (const v of Object.values(p)) {
          expect(Number.isFinite(v)).toBe(true);
          expect(v).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});
```

- [ ] **Step 2: Rodar para confirmar a falha**

Run: `npm test`
Expected: FAIL — `getPacing is not a function`.

- [ ] **Step 3: Implementação**

Adicionar ao `components/combat/animFx.tsx`:
```tsx
export interface Pacing {
  cardShown: number;     // tempo que a carta-comando fica antes do próximo beat
  reactionShown: number; // tempo da carta de reação (0 quando não há reação)
  rollsShown: number;    // tempo dos painéis de rolagem (inclui suspense no dramatic)
  resultShown: number;   // tempo do resultado antes da resolução
  resolveShown: number;  // tempo da resolução antes de completar
}

export function getPacing(tier: AnimTier, reduced: boolean): Pacing {
  if (reduced) {
    return { cardShown: 60, reactionShown: 60, rollsShown: 120, resultShown: 1000, resolveShown: 400 };
  }
  if (tier === 'dramatic') {
    return { cardShown: 460, reactionShown: 520, rollsShown: 1100, resultShown: 1400, resolveShown: 900 };
  }
  return { cardShown: 220, reactionShown: 0, rollsShown: 380, resultShown: 720, resolveShown: 560 };
}
```

- [ ] **Step 4: Rodar para confirmar PASS**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/combat/animFx.tsx components/combat/animFx.test.ts
git commit -m "feat(animFx): getPacing engine"
```

---

## Task 4: `animFx` — tones + juíce + helper de motion (TDD)

**Files:**
- Modify: `components/combat/animFx.tsx`
- Test: `components/combat/animFx.test.ts`

- [ ] **Step 1: Escrever o teste que falha (adicionar ao arquivo)**

Adicionar ao `components/combat/animFx.test.ts`:
```ts
import { getJuice, RESULT_TONES, prefersReducedMotion } from './animFx';

describe('getJuice', () => {
  it('reduced zera o juíce', () => {
    const j = getJuice('crit', true);
    expect(j.shakePx).toBe(0);
    expect(j.flash).toBe(false);
  });
  it('crit e fumble têm flash e shake forte', () => {
    expect(getJuice('crit', false).flash).toBe(true);
    expect(getJuice('crit', false).shakePx).toBeGreaterThanOrEqual(6);
    expect(getJuice('fumble', false).flash).toBe(true);
  });
  it('miss tem juíce mínimo', () => {
    const j = getJuice('miss', false);
    expect(j.flash).toBe(false);
    expect(j.shakePx).toBeLessThanOrEqual(3);
  });
});

describe('RESULT_TONES', () => {
  it('cobre todos os desfechos', () => {
    for (const k of ['crit', 'fumble', 'hit', 'miss', 'action-win', 'reaction-win']) {
      expect(typeof RESULT_TONES[k]).toBe('string');
    }
  });
});

describe('prefersReducedMotion', () => {
  it('retorna false com o stub de matchMedia', () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar para confirmar a falha**

Run: `npm test`
Expected: FAIL — `getJuice is not a function`.

- [ ] **Step 3: Implementação**

Adicionar ao `components/combat/animFx.tsx`:
```tsx
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const RESULT_TONES: Record<string, string> = {
  crit: '#f7c948',
  fumble: '#ef4444',
  hit: '#22c55e',
  miss: '#f59e0b',
  'action-win': '#55efc4',
  'reaction-win': '#38bdf8',
};

export interface Juice {
  shakePx: number;
  flash: boolean;
}

export function getJuice(kind: string, reduced: boolean): Juice {
  if (reduced) return { shakePx: 0, flash: false };
  switch (kind) {
    case 'crit':         return { shakePx: 8, flash: true };
    case 'fumble':       return { shakePx: 7, flash: true };
    case 'reaction-win': return { shakePx: 4, flash: true };
    case 'action-win':   return { shakePx: 4, flash: false };
    case 'hit':          return { shakePx: 3, flash: false };
    default:             return { shakePx: 2, flash: false };
  }
}
```

- [ ] **Step 4: Rodar para confirmar PASS**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/combat/animFx.tsx components/combat/animFx.test.ts
git commit -m "feat(animFx): tones, juice, prefersReducedMotion"
```

---

## Task 5: `animFx` — hook `useAnimSequence` (TDD, corrige o bug)

**Files:**
- Modify: `components/combat/animFx.tsx`
- Test: `components/combat/animFx.test.ts`

Este é o coração da correção do bug: o efeito re-roda **só** quando `runKey`/`active` muda, nunca quando `onComplete` muda de identidade.

- [ ] **Step 1: Escrever os testes que falham (adicionar ao arquivo)**

Adicionar ao `components/combat/animFx.test.ts`:
```ts
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import { useAnimSequence } from './animFx';

describe('useAnimSequence', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const steps = [
    { phase: 'a', delay: 0 },
    { phase: 'b', delay: 100 },
    { phase: 'c', delay: 100 },
  ];

  it('progride pelas fases e completa uma única vez', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useAnimSequence({ steps, tailMs: 50, runKey: 1, onComplete, active: true }));
    expect(result.current.phase).toBe('a');
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current.phase).toBe('b');
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current.phase).toBe('c');
    act(() => { vi.advanceTimersByTime(50); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('NÃO reinicia quando onComplete muda de identidade mas runKey é o mesmo', () => {
    const { result, rerender } = renderHook(
      ({ oc }: { oc: () => void }) =>
        useAnimSequence({ steps, tailMs: 50, runKey: 'k', onComplete: oc, active: true }),
      { initialProps: { oc: vi.fn() } },
    );
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current.phase).toBe('b');
    // re-render com uma função onComplete totalmente nova, mesmo runKey:
    rerender({ oc: vi.fn() });
    expect(result.current.phase).toBe('b'); // NÃO voltou para 'a'
  });

  it('reinicia quando runKey muda', () => {
    const { result, rerender } = renderHook(
      ({ k }: { k: number }) =>
        useAnimSequence({ steps, tailMs: 50, runKey: k, onComplete: vi.fn(), active: true }),
      { initialProps: { k: 1 } },
    );
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current.phase).toBe('b');
    rerender({ k: 2 });
    expect(result.current.phase).toBe('a'); // reiniciou
  });

  it('skip pula para a última fase e completa no segundo skip', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useAnimSequence({ steps, tailMs: 1000, runKey: 1, onComplete, active: true }));
    act(() => { result.current.skip(); });
    expect(result.current.phase).toBe('c');
    act(() => { result.current.skip(); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Rodar para confirmar a falha**

Run: `npm test`
Expected: FAIL — `useAnimSequence is not a function`.

- [ ] **Step 3: Implementação**

Adicionar ao topo do `components/combat/animFx.tsx` (imports do React) e o hook:
```tsx
import { useCallback, useEffect, useRef, useState } from 'react';

export interface SeqStep<P extends string> {
  phase: P;
  delay: number; // ms que a fase ANTERIOR permanece antes desta começar (delay da primeira é ignorado)
}

export interface UseAnimSequenceOpts<P extends string> {
  steps: SeqStep<P>[];
  tailMs: number;      // tempo que a última fase fica antes de completar
  runKey: unknown;     // identidade que (re)dispara a sequência — use o payload/estado de dados
  onComplete: () => void;
  active: boolean;
}

export function useAnimSequence<P extends string>(
  opts: UseAnimSequenceOpts<P>,
): { phase: P; skip: () => void } {
  const { steps, tailMs, runKey, active } = opts;

  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const onCompleteRef = useRef(opts.onComplete);
  onCompleteRef.current = opts.onComplete;
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const tailRef = useRef(tailMs);
  tailRef.current = tailMs;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completedRef = useRef(false);

  const setPhaseIndex = (i: number) => { indexRef.current = i; setIndex(i); };
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimers();
    onCompleteRef.current();
  };

  const skip = useCallback(() => {
    if (completedRef.current) return;
    const last = stepsRef.current.length - 1;
    clearTimers();
    if (last <= 0 || indexRef.current >= last) { finish(); return; }
    setPhaseIndex(last);
    timersRef.current.push(setTimeout(finish, Math.max(0, tailRef.current)));
  }, []);

  // Dispara APENAS quando runKey/active muda — NÃO quando onComplete muda de identidade.
  useEffect(() => {
    if (!active) { clearTimers(); return; }
    clearTimers();
    completedRef.current = false;
    setPhaseIndex(0);
    let acc = 0;
    for (let i = 1; i < stepsRef.current.length; i++) {
      acc += stepsRef.current[i].delay;
      const target = i;
      timersRef.current.push(setTimeout(() => setPhaseIndex(target), acc));
    }
    acc += tailRef.current;
    timersRef.current.push(setTimeout(finish, acc));
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, active]);

  const list = stepsRef.current;
  const phase = (list.length > 0 ? list[Math.min(index, list.length - 1)].phase : '') as P;
  return { phase, skip };
}
```

- [ ] **Step 4: Rodar para confirmar PASS**

Run: `npm test`
Expected: PASS (incluindo o teste de regressão do bug).

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: 29 erros (baseline) — nenhum novo vindo de `animFx.tsx`.

- [ ] **Step 6: Commit**

```bash
git add components/combat/animFx.tsx components/combat/animFx.test.ts
git commit -m "feat(animFx): useAnimSequence hook (fixes duplicated result bug)"
```

---

## Task 6: `animFx` — `AnimFxStyles` (keyframes compartilhados)

**Files:**
- Modify: `components/combat/animFx.tsx`

Sem teste unitário (é CSS); validado no build e nas verificações visuais.

- [ ] **Step 1: Adicionar o componente de estilos**

Adicionar ao `components/combat/animFx.tsx`:
```tsx
import React from 'react';

export const AnimFxStyles: React.FC = () => (
  <style>{`
    @keyframes mp-fx-shake {
      0%, 100% { transform: translate(0, 0); }
      20% { transform: translate(calc(var(--fx-shake, 0px) * -1), var(--fx-shake, 0px)); }
      40% { transform: translate(var(--fx-shake, 0px), calc(var(--fx-shake, 0px) * -1)); }
      60% { transform: translate(calc(var(--fx-shake, 0px) * -0.6), calc(var(--fx-shake, 0px) * 0.6)); }
      80% { transform: translate(calc(var(--fx-shake, 0px) * 0.6), calc(var(--fx-shake, 0px) * -0.6)); }
    }
    .mp-fx-shake { animation: mp-fx-shake 360ms ease-in-out 1; }

    .mp-fx-flash {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99995;
      background: radial-gradient(circle at 50% 46%, var(--fx-flash-color, #fff), transparent 60%);
      opacity: 0;
      animation: mp-fx-flash 460ms ease-out 1;
    }
    @keyframes mp-fx-flash {
      0% { opacity: 0; }
      18% { opacity: 0.7; }
      100% { opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .mp-fx-shake { animation: none; }
      .mp-fx-flash { animation-duration: 1ms; opacity: 0; }
    }
  `}</style>
);
```

- [ ] **Step 2: Verificar tipos e build**

Run: `npx tsc --noEmit && npm run build`
Expected: 29 erros baseline (nenhum novo); build conclui.

- [ ] **Step 3: Commit**

```bash
git add components/combat/animFx.tsx
git commit -m "feat(animFx): AnimFxStyles shared keyframes"
```

---

## Task 7: Reescrever `DiceAnimation` (painéis + animFx + skip + fix)

**Files:**
- Modify (rewrite): `components/DiceAnimation.tsx`

`DiceAnimation` vira a versão "lite" (só Rolagem → Resultado), com painel estilizado, hook compartilhado e clique-para-pular. A API (props) é mantida para não quebrar os call sites.

- [ ] **Step 1: Substituir todo o conteúdo de `components/DiceAnimation.tsx`**

```tsx
import React, { useMemo } from 'react';
import {
  AnimFxStyles,
  deriveTier,
  getJuice,
  getPacing,
  prefersReducedMotion,
  useAnimSequence,
} from './combat/animFx';

interface DiceAnimationProps {
  isVisible: boolean;
  result: number;
  defenderResult?: number;
  isSuccess: boolean;
  customLabel?: string;
  notation?: string;
  individualRolls?: number[];
  numSides?: number;
  bonus?: number;
  dramatic?: boolean;
  onComplete: () => void;
}

type DicePhase = 'rolls' | 'result';

function rollBreakdown(individualRolls: number[], bonus: number): string {
  const body = individualRolls.join(' + ');
  if (bonus > 0) return `${body} + ${bonus}`;
  if (bonus < 0) return `${body} - ${Math.abs(bonus)}`;
  return body;
}

const DiceAnimation: React.FC<DiceAnimationProps> = ({
  isVisible,
  result,
  defenderResult,
  isSuccess,
  customLabel,
  notation = '1d20',
  individualRolls = [result],
  numSides = 20,
  bonus = 0,
  dramatic = false,
  onComplete,
}) => {
  const reduced = prefersReducedMotion();
  const safeResult = Number.isFinite(result) ? result : 0;
  const safeSides = Math.max(1, numSides || 20);

  const isCrit = individualRolls.length === 1 && safeSides >= 4 && individualRolls[0] >= safeSides;
  const isFumble = individualRolls.length === 1 && safeSides >= 4 && individualRolls[0] === 1;
  const hasDefender = defenderResult !== undefined;

  const tier = deriveTier({ dramatic, hasReaction: hasDefender, isCrit, isFumble });
  const pacing = getPacing(tier, reduced);

  const kind = isCrit ? 'crit' : isFumble ? 'fumble' : isSuccess ? 'hit' : 'miss';
  const juice = getJuice(kind, reduced);
  const tone = isCrit ? '#f7c948' : isSuccess ? '#55efc4' : '#ff4d6d';

  const label = customLabel || (isCrit ? 'CRITICO' : isFumble ? 'FALHA' : isSuccess ? 'SUCESSO' : 'FALHOU');

  const steps = useMemo(() => ([
    { phase: 'rolls' as DicePhase, delay: 0 },
    { phase: 'result' as DicePhase, delay: pacing.rollsShown },
  ]), [pacing.rollsShown]);

  const { phase, skip } = useAnimSequence<DicePhase>({
    steps,
    tailMs: pacing.resultShown,
    runKey: isVisible ? `${safeResult}|${defenderResult ?? ''}|${notation}` : null,
    onComplete,
    active: isVisible,
  });

  if (!isVisible) return null;

  const showResult = phase === 'result';
  const flash = showResult && juice.flash;

  return (
    <div
      className={`mp-dicelite ${showResult && juice.shakePx > 0 ? 'mp-fx-shake' : ''}`}
      style={{
        ['--fx-shake' as any]: `${juice.shakePx}px`,
        ['--dl-tone' as any]: tone,
      } as React.CSSProperties}
      onClick={skip}
    >
      <AnimFxStyles />
      {flash && <div className="mp-fx-flash" style={{ ['--fx-flash-color' as any]: tone } as React.CSSProperties} />}
      <style>{`
        .mp-dicelite {
          position: fixed;
          inset: 0;
          z-index: 99990;
          display: grid;
          place-items: center;
          gap: 18px;
          cursor: pointer;
          color: #fff7d6;
          font-family: "Inter", "Rajdhani", system-ui, sans-serif;
          background:
            radial-gradient(circle at 50% 44%, color-mix(in srgb, var(--dl-tone) 22%, transparent), transparent 36%),
            linear-gradient(110deg, rgba(4,7,14,0.4), rgba(5,8,12,0.62));
          animation: mp-dicelite-in 160ms ease-out both;
        }
        @keyframes mp-dicelite-in { from { opacity: 0; } to { opacity: 1; } }

        .mp-dicelite__panel {
          position: relative;
          min-width: min(300px, 80vw);
          padding: 26px 34px 22px;
          display: grid;
          justify-items: center;
          gap: 8px;
          clip-path: polygon(8% 0, 100% 0, 92% 100%, 0 100%);
          border: 2px solid color-mix(in srgb, var(--dl-tone) 72%, rgba(255,255,255,0.12));
          background:
            linear-gradient(160deg, color-mix(in srgb, var(--dl-tone) 26%, transparent), transparent 42%),
            rgba(8,10,16,0.92);
          box-shadow: 0 22px 70px rgba(0,0,0,0.6), inset 0 0 36px rgba(255,255,255,0.04);
          animation: mp-dicelite-pop 360ms cubic-bezier(0.2, 1, 0.24, 1) both;
        }
        @keyframes mp-dicelite-pop {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }

        .mp-dicelite__label {
          font-size: 11px; font-weight: 1000; letter-spacing: 0.2em;
          text-transform: uppercase; color: color-mix(in srgb, var(--dl-tone) 80%, #fff);
        }
        .mp-dicelite__notation {
          font-size: 12px; font-weight: 900; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(255,255,255,0.6);
        }
        .mp-dicelite__number {
          font-size: clamp(64px, 11vw, 120px); line-height: 0.86; font-weight: 1000;
          color: #fff; text-shadow: 0 0 30px var(--dl-tone);
          animation: mp-dicelite-num 520ms cubic-bezier(0.2, 1.7, 0.25, 1) both;
        }
        @keyframes mp-dicelite-num {
          0% { transform: scale(0.3) rotate(-8deg); opacity: 0; }
          65% { transform: scale(1.16) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .mp-dicelite__breakdown {
          font-size: 12px; font-weight: 800; letter-spacing: 0.08em;
          color: rgba(255,255,255,0.6); text-transform: uppercase;
          display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
        }
        .mp-dicelite__vs {
          margin-top: 6px; font-size: 13px; font-weight: 1000;
          letter-spacing: 0.12em; text-transform: uppercase;
        }
        @media (prefers-reduced-motion: reduce) {
          .mp-dicelite, .mp-dicelite *, .mp-dicelite__panel, .mp-dicelite__number {
            animation-duration: 1ms !important;
          }
        }
      `}</style>

      <div className="mp-dicelite__panel">
        <span className="mp-dicelite__label">{showResult ? label : 'Rolando'}</span>
        <span className="mp-dicelite__notation">{notation}</span>
        <span className="mp-dicelite__number">{safeResult}</span>
        <div className="mp-dicelite__breakdown">
          <span>{rollBreakdown(individualRolls, bonus)}</span>
          {hasDefender && <span>DEF {defenderResult}</span>}
        </div>
        {hasDefender && (
          <div className="mp-dicelite__vs" style={{ color: tone }}>
            {safeResult > (defenderResult as number) ? 'AÇÃO VENCE' : 'DEFESA SEGURA'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceAnimation;
```

- [ ] **Step 2: Verificar tipos e build**

Run: `npx tsc --noEmit && npm run build`
Expected: 29 erros baseline (nenhum novo); build conclui. (Os call sites em `App.tsx` não mudam: a interface de props é a mesma.)

- [ ] **Step 3: Commit**

```bash
git add components/DiceAnimation.tsx
git commit -m "refactor(DiceAnimation): stylized panels via animFx + skip + bug fix"
```

---

## Task 8: Refatorar `CardRevealAnimation` (hook + juíce + skip + prop dramatic)

**Files:**
- Modify: `components/CardRevealAnimation.tsx`

Mantém todo o CSS/visual atual; só troca a orquestração pelo hook, adiciona juíce, clique-para-pular e a prop `dramatic`.

- [ ] **Step 1: Adicionar `dramatic?` ao tipo `CardAnimPayload`**

Em `components/CardRevealAnimation.tsx`, no `interface CardAnimPayload` (logo após `isFumble?: boolean;`, ~linha 44):
```tsx
  isSuccess: boolean;
  isCrit?: boolean;
  isFumble?: boolean;
  dramatic?: boolean;
}
```

- [ ] **Step 2: Substituir os imports do topo e o helper `prefersReducedMotion`**

Trocar a linha 1:
```tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
```
por:
```tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  AnimFxStyles,
  deriveTier,
  getJuice,
  getPacing,
  prefersReducedMotion,
  useAnimSequence,
} from './combat/animFx';
```
E **remover** a função local `prefersReducedMotion` (linhas ~87-89) — agora vem do módulo:
```tsx
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

- [ ] **Step 3: Substituir a orquestração (o `useEffect` grande) pelo hook**

Localizar o bloco que declara `phase`, `targetPoints`, `timersRef`, `completeRef`, `variantRef` e o `useEffect` que agenda as fases (linhas ~277-345). Substituir desde a declaração de estado até o final daquele `useEffect` por:

```tsx
  const [targetPoints, setTargetPoints] = useState<TargetPoint[]>([]);
  const variantRef = useRef(REACTION_VARIANTS[0]);

  const reduced = prefersReducedMotion();
  const info = useMemo(() => payload ? resultInfo(payload) : null, [payload]);
  const hasReaction = !!payload?.reactionCard && !!payload?.reactionRoll;
  const attackAccent = payload ? cardAccent(payload.attackCard) : '#d4a853';
  const reactionAccent = payload?.reactionCard ? cardAccent(payload.reactionCard) : '#38bdf8';
  const actionWins = !!payload && payload.isSuccess;
  const reactionWins = !!payload && hasReaction && !payload.isSuccess;
  const targets = useMemo(() => payload ? getTargets(payload) : [], [payload]);
  const actionElementClass = payload ? elementClass(payload.attackCard.element, payload.attackCard.type) : 'neutral';

  const tier = payload
    ? deriveTier({ dramatic: payload.dramatic, hasReaction, isCrit: payload.isCrit, isFumble: payload.isFumble })
    : 'trivial';
  const pacing = getPacing(tier, reduced);
  const juice = info ? getJuice(info.kind, reduced) : { shakePx: 0, flash: false };

  // Escolhe uma variante de "clash" estável por payload (sem useEffect).
  useMemo(() => {
    variantRef.current = REACTION_VARIANTS[Math.floor(Math.random() * REACTION_VARIANTS.length)];
    return null;
  }, [payload]);

  const steps = useMemo(() => {
    const s: { phase: Phase; delay: number }[] = [{ phase: 'card', delay: 0 }];
    if (hasReaction) s.push({ phase: 'reaction', delay: pacing.cardShown });
    s.push({ phase: 'rolls', delay: hasReaction ? pacing.reactionShown : pacing.cardShown });
    s.push({ phase: 'result', delay: pacing.rollsShown });
    s.push({ phase: 'resolve', delay: pacing.resultShown });
    return s;
  }, [hasReaction, pacing.cardShown, pacing.reactionShown, pacing.rollsShown, pacing.resultShown]);

  const { phase, skip } = useAnimSequence<Phase>({
    steps,
    tailMs: pacing.resolveShown,
    runKey: payload,
    onComplete,
    active: !!payload,
  });

  // Calcula os pontos de destino ao entrar na fase de resolução.
  useEffect(() => {
    if (phase === 'resolve' && payload) {
      setTargetPoints(targets.map((target, index) => findTargetPoint(target, index, targets.length)));
    }
  }, [phase, payload, targets]);
```

> Observação: as referências antigas a `timersRef`/`completeRef` deixam de existir — elas eram usadas só no `useEffect` removido. Se houver qualquer outra referência, removê-la.

- [ ] **Step 4: Adicionar juíce + clique no container raiz**

Localizar o `<div>` raiz com `className={\`mp-card-seq ...\`}` (~linha 356) e seus atributos. Substituir a abertura desse elemento por:

```tsx
    <div
      className={`mp-card-seq mp-card-seq--${phase} mp-card-seq--${info.kind} mp-card-seq-element--${actionElementClass} ${(phase === 'result' || phase === 'resolve') && juice.shakePx > 0 ? 'mp-fx-shake' : ''}`}
      style={{
        ['--seq-accent' as any]: info.accent,
        ['--seq-secondary' as any]: info.secondary,
        ['--seq-attack-accent' as any]: attackAccent,
        ['--seq-reaction-accent' as any]: reactionAccent,
        ['--fx-shake' as any]: `${juice.shakePx}px`,
      } as React.CSSProperties}
      onClick={skip}
      aria-hidden="true"
    >
      <AnimFxStyles />
      {(phase === 'result' || phase === 'resolve') && juice.flash && (
        <div className="mp-fx-flash" style={{ ['--fx-flash-color' as any]: info.accent } as React.CSSProperties} />
      )}
```

- [ ] **Step 5: Tornar o overlay clicável**

No `<style>` interno, na regra `.mp-card-seq { ... }`, trocar:
```css
          pointer-events: none;
```
por:
```css
          pointer-events: auto;
          cursor: pointer;
```

- [ ] **Step 6: Verificar tipos e build**

Run: `npx tsc --noEmit && npm run build`
Expected: 29 erros baseline (nenhum novo); build conclui.

- [ ] **Step 7: Commit**

```bash
git add components/CardRevealAnimation.tsx
git commit -m "refactor(CardRevealAnimation): useAnimSequence + juice + skip + dramatic"
```

---

## Task 9: `App.tsx` — `onComplete` estável + flag `dramatic`

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Garantir `useCallback` importado**

Conferir o import do React no topo de `App.tsx`. Se `useCallback` não estiver na lista, adicioná-lo (ex.: `import React, { useState, useEffect, useCallback, ... } from 'react';`).

Run (para conferir): `npx tsc --noEmit` (após o passo 2) acusará `useCallback is not defined` se faltar.

- [ ] **Step 2: Criar handlers estáveis**

Logo após a definição de `showDiceAnimation` (termina em `App.tsx:3430`), adicionar:
```tsx
  const handleCardAnimComplete = useCallback(() => setCardAnim(null), []);
  const handleDiceAnimComplete = useCallback(() => setDiceAnim(null), []);
```

- [ ] **Step 3: Usar o handler no `CardRevealAnimation`**

Em `App.tsx:9286`, trocar:
```tsx
        onComplete={() => setCardAnim(null)}
```
por:
```tsx
        onComplete={handleCardAnimComplete}
```

- [ ] **Step 4: Usar o handler no `DiceAnimation`**

Em `App.tsx:9501`, trocar:
```tsx
        onComplete={() => setDiceAnim(null)}
```
por:
```tsx
        onComplete={handleDiceAnimComplete}
```

- [ ] **Step 5: Adicionar `dramatic` aos 4 call sites de `setCardAnim`**

Em cada um dos 4 objetos passados a `setCardAnim`, adicionar o campo `dramatic: card.dc !== undefined` junto aos `isCrit/isFumble`:

(a) área — `App.tsx:4777` (após `isFumble: ...`):
```tsx
        isFumble: roll.individualRolls.length === 1 && roll.numSides >= 4 && roll.individualRolls[0] === 1,
        dramatic: card.dc !== undefined,
```

(b) `finalizeAction` — `App.tsx:4903` (no objeto `animPayload`, após `isSuccess, isCrit, isFumble,`):
```tsx
      isSuccess, isCrit, isFumble,
      dramatic: card.dc !== undefined,
```

(c) combo — `App.tsx:5041` (após `isFumble: false,`):
```tsx
      isFumble: false,
      dramatic: card.dc !== undefined,
```

(d) burn — `App.tsx:5129` (após `isFumble: false,`):
```tsx
      isFumble: false,
      dramatic: card.dc !== undefined,
```

> Nota: o `CardAnimPayload` em `finalizeAction` é tipado; os outros usam `as any` ou literais — todos aceitam o campo extra opcional `dramatic`.

- [ ] **Step 6: Verificar tipos e build**

Run: `npx tsc --noEmit && npm run build`
Expected: 29 erros baseline (nenhum novo); build conclui.

- [ ] **Step 7: Rodar os testes (regressão geral)**

Run: `npm test`
Expected: PASS (todos os testes de `animFx`).

- [ ] **Step 8: Commit**

```bash
git add App.tsx
git commit -m "fix(combat): stable anim onComplete + dramatic flag (fixes duplicated result)"
```

---

## Task 10: Verificação visual manual (checklist da spec)

**Files:** nenhum (verificação).

- [ ] **Step 1: Subir o dev server**

Run: `npm run dev`
Abrir a aba de combate.

- [ ] **Step 2: Conferir cada cenário da spec**

- [ ] Ataque simples (sem reação, sem CD): sequência ágil (~1–2 s); resultado aparece **uma única vez**.
- [ ] Ataque **com reação**: painéis Ação × Reação, comparação, resolução; **sem repetição/piscar** do resultado (era o bug principal).
- [ ] Crítico e falha: payoff extra (flash + shake), sem telegrafar no build-up.
- [ ] Item / selo / iniciativa (via `DiceAnimation`): painel estilizado coerente com o fluxo de carta.
- [ ] Clicar durante a animação: pula para o resultado; clicar de novo dispensa.
- [ ] `prefers-reduced-motion` ativo (DevTools → Rendering → Emulate CSS prefers-reduced-motion): sem shake/flash, transições suaves, mais curto.
- [ ] Forma e Fusão continuam com suas animações próprias, sem regressão.

- [ ] **Step 3: Verificação final (build + tipos + testes)**

Run: `npx tsc --noEmit && npm run build && npm test`
Expected: 29 erros baseline (nenhum novo); build conclui; testes PASS.

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura da spec:**
- Dois componentes separados + look unificado → Tasks 6–8 (módulo `animFx` + restyle do `DiceAnimation` + consumo no `CardRevealAnimation`). ✅
- Dados = painéis estilizados → Task 7 (DiceAnimation reescrito sem dado 3D). ✅
- Escopo combate (ataque/ação/reação/item/selo/iniciativa/combo/burn/área) → Tasks 7–9. ✅
- Pacing ágil/dramático por gatilho (reação/CD/crit/falha) → Tasks 2–3 + 9 (flag `dramatic`). ✅
- Juíce (shake/flash) → Tasks 4, 6, 7, 8. ✅
- Clique para pular + reduced-motion → Tasks 5–8. ✅
- Correção do bug do resultado repetido → Task 5 (hook + teste de regressão) + Task 9 (`onComplete` estável). ✅
- Forma e Fusão intocadas → confirmado (nenhuma task as toca). ✅

**Placeholders:** nenhum TBD/TODO; todo passo de código tem o código completo.

**Consistência de tipos:** `deriveTier`, `getPacing` (`Pacing` com `cardShown/reactionShown/rollsShown/resultShown/resolveShown`), `getJuice` (`Juice {shakePx, flash}`), `useAnimSequence` (`SeqStep<P>`, `{phase, skip}`) — usados de forma idêntica nas Tasks 7 e 8.
