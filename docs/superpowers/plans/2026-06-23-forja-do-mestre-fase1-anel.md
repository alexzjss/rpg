# A Forja do Mestre — Fase 1: Fundação + Anel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a navbar horizontal de 7 abas pelo "Anel do Mestre" — um medalhão-toggle central (Combate↔Jornada) com 5 satélites em latão, dock-joia persistente + roda de comando invocável por teclado — e estabelecer a fundação de "brasa disciplinada".

**Architecture:** Lógica pura e testável (modelo de navegação, geometria do anel, hook `useRadialNav`) separada dos componentes visuais (`MasterRing` dock, `CommandWheel` portal). A integração reaproveita o estado `activeTab`/`setActiveTab` já existente em `App.tsx` e o `useEffect` que aplica o clima via `applyAtmosphere`. CSS de fundação e do anel é anexado ao bloco `<style>` de `index.html` (mesmo padrão atual do projeto).

**Tech Stack:** React 19, TypeScript, Vite, lucide-react, Vitest + @testing-library/react.

**Referência de spec:** `docs/superpowers/specs/2026-06-23-forja-do-mestre-redesign-design.md` (seções 2, 3, 4, 6).

---

## File Structure

- Create: `components/nav/navModel.ts` — dados dos 7 destinos (id, label, ícone, tipo, ordem).
- Create: `components/nav/navModel.test.ts`
- Create: `components/nav/ringGeometry.ts` — funções puras de posicionamento polar.
- Create: `components/nav/ringGeometry.test.ts`
- Create: `components/nav/useRadialNav.ts` — hook de estado/teclado da navegação.
- Create: `components/nav/useRadialNav.test.ts`
- Create: `components/nav/MasterRing.tsx` — dock-joia persistente (hub + satélites).
- Create: `components/nav/MasterRing.test.tsx`
- Create: `components/nav/CommandWheel.tsx` — roda de comando em portal.
- Create: `components/nav/CommandWheel.test.tsx`
- Create: `components/nav/index.ts` — barrel.
- Modify: `index.html` — anexar tokens de fundação + CSS do anel ao `<style>`.
- Modify: `App.tsx` — substituir o bloco de `TabButton`s (linhas ~5709-5718) pelo `MasterRing`, fiar o hook, amansar a marca d'água gigante (~5688-5691).

> Convenção de commit do projeto: mensagens em português, estilo conventional commits (`feat(nav): …`). Encerrar com a linha `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Modelo de navegação (`navModel.ts`)

**Files:**
- Create: `components/nav/navModel.ts`
- Test: `components/nav/navModel.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// components/nav/navModel.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/nav/navModel.test.ts`
Expected: FAIL — "Cannot find module './navModel'".

- [ ] **Step 3: Write minimal implementation**

```ts
// components/nav/navModel.ts
import type { LucideIcon } from 'lucide-react';
import { Swords, Compass, Users, Layers, Backpack, Sparkles, LayoutGrid } from 'lucide-react';
import type { TabId } from '../../utils/atmosphere';

export type NavKind = 'mode' | 'satellite';
export interface NavDest {
  id: TabId;
  label: string;
  kind: NavKind;
  icon: LucideIcon;
}

export const MODES: TabId[] = ['combat', 'journey'];
export const SATELLITES: TabId[] = ['characters', 'cards', 'items', 'seals', 'extras'];
// Ordem das teclas 1..7
export const NAV_ORDER: TabId[] = ['combat', 'journey', 'characters', 'cards', 'items', 'seals', 'extras'];

export const NAV_DESTS: Record<TabId, NavDest> = {
  combat:     { id: 'combat',     label: 'Combate',     kind: 'mode',      icon: Swords },
  journey:    { id: 'journey',    label: 'Jornada',     kind: 'mode',      icon: Compass },
  characters: { id: 'characters', label: 'Personagens', kind: 'satellite', icon: Users },
  cards:      { id: 'cards',      label: 'Habilidades', kind: 'satellite', icon: Layers },
  items:      { id: 'items',      label: 'Itens',       kind: 'satellite', icon: Backpack },
  seals:      { id: 'seals',      label: 'Selos',       kind: 'satellite', icon: Sparkles },
  extras:     { id: 'extras',     label: 'Extras',      kind: 'satellite', icon: LayoutGrid },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/nav/navModel.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/nav/navModel.ts components/nav/navModel.test.ts
git commit -m "feat(nav): modelo de navegação do Anel do Mestre (7 destinos, modos vs satélites)"
```

---

### Task 2: Geometria do anel (`ringGeometry.ts`)

Distribui os satélites num arco superior para não colidir com o dock. Funções puras → testáveis.

**Files:**
- Create: `components/nav/ringGeometry.ts`
- Test: `components/nav/ringGeometry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// components/nav/ringGeometry.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/nav/ringGeometry.test.ts`
Expected: FAIL — "Cannot find module './ringGeometry'".

- [ ] **Step 3: Write minimal implementation**

```ts
// components/nav/ringGeometry.ts
export interface Point { x: number; y: number; }

/** Ângulo em graus, 0° = topo, sentido horário. Retorna ponto cartesiano. */
export function polar(angleDeg: number, radius: number): Point {
  const rad = (angleDeg - 90) * (Math.PI / 180); // -90 para 0°=topo
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

/** Distribui `count` itens simetricamente num arco de `arcDeg` centrado no topo (0°). */
export function satelliteAngles(count: number, arcDeg: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];
  const step = arcDeg / (count - 1);
  const start = -arcDeg / 2;
  return Array.from({ length: count }, (_, i) => start + i * step);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/nav/ringGeometry.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/nav/ringGeometry.ts components/nav/ringGeometry.test.ts
git commit -m "feat(nav): geometria polar do anel (posicionamento simétrico dos satélites)"
```

---

### Task 3: Hook de navegação (`useRadialNav.ts`)

Controla seleção por teclado (1-7), toggle de modo (lembra o último modo), ciclagem por setas entre satélites e abertura/fechamento da roda de comando. Recebe `activeTab` e `onSelect` para integrar com o estado existente do `App`.

**Files:**
- Create: `components/nav/useRadialNav.ts`
- Test: `components/nav/useRadialNav.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// components/nav/useRadialNav.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRadialNav } from './useRadialNav';

function setup(activeTab = 'combat') {
  const onSelect = vi.fn();
  const view = renderHook(
    ({ tab }) => useRadialNav({ activeTab: tab as any, onSelect }),
    { initialProps: { tab: activeTab } },
  );
  return { onSelect, ...view };
}

describe('useRadialNav', () => {
  it('toggleMode alterna combat→journey e seleciona', () => {
    const { result, onSelect } = setup('combat');
    act(() => result.current.toggleMode());
    expect(onSelect).toHaveBeenCalledWith('journey');
  });

  it('toggleMode a partir de um satélite volta ao último modo (journey)', () => {
    const { result, onSelect, rerender } = setup('combat');
    act(() => result.current.toggleMode());        // -> journey (lastMode=journey)
    rerender({ tab: 'characters' });               // agora num satélite
    act(() => result.current.toggleMode());         // deve re-selecionar o último modo
    expect(onSelect).toHaveBeenLastCalledWith('journey');
  });

  it('handleKey "3" seleciona o 3º destino (characters)', () => {
    const { result, onSelect } = setup('combat');
    act(() => result.current.handleKey({ key: '3', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('characters');
  });

  it('setas ciclam entre satélites', () => {
    const { result, onSelect } = setup('characters');
    act(() => result.current.handleKey({ key: 'ArrowRight', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('cards');
  });

  it('openWheel/closeWheel alternam o estado wheelOpen', () => {
    const { result } = setup();
    expect(result.current.wheelOpen).toBe(false);
    act(() => result.current.openWheel());
    expect(result.current.wheelOpen).toBe(true);
    act(() => result.current.closeWheel());
    expect(result.current.wheelOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/nav/useRadialNav.test.ts`
Expected: FAIL — "Cannot find module './useRadialNav'".

- [ ] **Step 3: Write minimal implementation**

```ts
// components/nav/useRadialNav.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TabId } from '../../utils/atmosphere';
import { MODES, SATELLITES, NAV_ORDER } from './navModel';

export interface UseRadialNav {
  activeTab: TabId;
  mode: TabId;            // último modo "armado" (combat|journey)
  wheelOpen: boolean;
  toggleMode: () => void;
  select: (id: TabId) => void;
  openWheel: () => void;
  closeWheel: () => void;
  handleKey: (e: KeyboardEvent) => void;
}

export function useRadialNav({ activeTab, onSelect }: {
  activeTab: TabId;
  onSelect: (id: TabId) => void;
}): UseRadialNav {
  const [wheelOpen, setWheelOpen] = useState(false);
  const lastMode = useRef<TabId>(MODES.includes(activeTab) ? activeTab : 'combat');
  useEffect(() => {
    if (MODES.includes(activeTab)) lastMode.current = activeTab;
  }, [activeTab]);

  const select = useCallback((id: TabId) => onSelect(id), [onSelect]);

  const toggleMode = useCallback(() => {
    const next: TabId = lastMode.current === 'combat' ? 'journey' : 'combat';
    lastMode.current = next;
    onSelect(next);
  }, [onSelect]);

  const openWheel = useCallback(() => setWheelOpen(true), []);
  const closeWheel = useCallback(() => setWheelOpen(false), []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    // 1-7 → destino direto
    if (e.key >= '1' && e.key <= '7') {
      const id = NAV_ORDER[Number(e.key) - 1];
      if (id) { e.preventDefault(); onSelect(id); }
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const list = SATELLITES;
      const cur = list.indexOf(activeTab);
      const base = cur === -1 ? 0 : cur;
      const delta = e.key === 'ArrowRight' ? 1 : -1;
      onSelect(list[(base + delta + list.length) % list.length]);
      return;
    }
    if (e.key === 'Escape') { setWheelOpen(false); }
  }, [activeTab, onSelect]);

  return {
    activeTab, mode: lastMode.current, wheelOpen,
    toggleMode, select, openWheel, closeWheel, handleKey,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/nav/useRadialNav.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/nav/useRadialNav.ts components/nav/useRadialNav.test.ts
git commit -m "feat(nav): hook useRadialNav (teclado 1-7, toggle de modo, setas, roda)"
```

---

### Task 4: Fundação visual + CSS do anel (`index.html`)

Adiciona tokens de "brasa disciplinada" (escala tipográfica, espaçamento de 4px, acento único) e as classes base do anel/roda. Anexar ao final do bloco `<style>` existente em `index.html` (antes de `</style>`), mantendo o padrão atual do projeto.

**Files:**
- Modify: `index.html` (bloco `<style>`)

- [ ] **Step 1: Localizar o fim do `<style>`**

Run: `npx vitest run` (garante baseline verde antes de mexer) e abrir `index.html`, achar o último `}` antes de `</style>`.
Expected: 35+ testes passando.

- [ ] **Step 2: Anexar os tokens e classes** (inserir antes de `</style>`)

```css
/* ===== A Forja do Mestre — Fundação "brasa disciplinada" ===== */
:root {
  /* acento único de ação */
  --accent: var(--ember, #f97316);
  --brass: #c9983a;
  --brass-dark: #8a6520;
  /* escala tipográfica disciplinada */
  --fs-1: 12px; --fs-2: 14px; --fs-3: 16px; --fs-4: 20px; --fs-5: 28px; --fs-6: 40px;
  /* espaçamento base 4px */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px; --sp-6: 32px;
}

/* ----- Anel: dock-joia persistente ----- */
.mp-ring { position: relative; width: 320px; height: 168px; pointer-events: none; }
.mp-ring__hub, .mp-ring__sat { pointer-events: auto; }
.mp-ring__hub {
  position: absolute; left: 50%; bottom: 0; transform: translateX(-50%);
  width: 96px; height: 96px; border-radius: 50%;
  display: grid; place-items: center; cursor: pointer;
  background: radial-gradient(circle at 50% 35%, #2a2113, #15110a);
  border: 2px solid var(--brass); color: var(--text-primary);
  box-shadow: 0 0 28px rgba(249,115,22,0.45), inset 0 1px 0 rgba(255,255,255,0.12);
  transition: transform .18s ease, box-shadow .25s ease;
}
.mp-ring__hub:hover { transform: translateX(-50%) scale(1.05); }
.mp-ring__hub[data-mode="journey"] {
  background: radial-gradient(circle at 50% 35%, #f1e7cf, #d9c79c);
  color: #221a0f; box-shadow: 0 0 24px rgba(201,152,58,0.5);
}
.mp-ring__sat {
  position: absolute; left: 50%; bottom: 16px;
  width: 52px; height: 52px; margin: -26px; border-radius: 50%;
  display: grid; place-items: center; cursor: pointer;
  background: linear-gradient(135deg, #2a2417, #1b1710);
  border: 1px solid var(--border-mid); color: var(--text-secondary);
  transition: transform .18s ease, border-color .2s ease, color .2s ease;
}
.mp-ring__sat:hover { transform: scale(1.12); color: var(--text-primary); }
.mp-ring__sat[aria-selected="true"] {
  border-color: var(--accent); color: var(--text-primary);
  box-shadow: 0 0 16px rgba(249,115,22,0.4);
}

/* ----- Roda de comando (invocada) ----- */
.mp-cmdwheel {
  position: fixed; inset: 0; z-index: 200; display: grid; place-items: center;
  background: rgba(8,8,6,0.55); backdrop-filter: blur(6px);
}
.mp-cmdwheel__disc { position: relative; width: 360px; height: 360px; }
.mp-cmdwheel__item {
  position: absolute; left: 50%; top: 50%; width: 76px; height: 76px; margin: -38px;
  border-radius: 50%; display: grid; place-items: center; cursor: pointer;
  background: linear-gradient(135deg, #2a2417, #15110a);
  border: 1px solid var(--brass); color: var(--text-primary);
  animation: mp-wheel-in .16s ease both;
}
@keyframes mp-wheel-in { from { opacity: 0; transform: scale(.7); } to { opacity: 1; } }
[data-reduced-motion="true"] .mp-cmdwheel__item { animation: none; }
@media (prefers-reduced-motion: reduce) { .mp-cmdwheel__item { animation: none; } }
```

- [ ] **Step 3: Verificar build**

Run: `npx tsc --noEmit` (não deve aumentar a contagem de erros de baseline; mudanças foram só em CSS) e `npx vitest run`.
Expected: testes verdes; baseline de erros tsc inalterado.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(nav): fundação visual (escala/espaço/acento) + CSS do anel e da roda"
```

---

### Task 5: Componente `MasterRing` (dock-joia)

**Files:**
- Create: `components/nav/MasterRing.tsx`
- Test: `components/nav/MasterRing.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/nav/MasterRing.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MasterRing } from './MasterRing';

describe('MasterRing', () => {
  it('renderiza os 5 satélites e o hub com role tab', () => {
    const { container } = render(
      <MasterRing activeTab="combat" mode="combat" onSelect={() => {}} onToggleMode={() => {}} />
    );
    expect(container.querySelectorAll('.mp-ring__sat')).toHaveLength(5);
    expect(container.querySelector('.mp-ring__hub')).toBeTruthy();
    expect(container.querySelectorAll('[role="tab"]').length).toBeGreaterThanOrEqual(6);
  });

  it('marca a aba ativa com aria-selected', () => {
    const { container } = render(
      <MasterRing activeTab="seals" mode="combat" onSelect={() => {}} onToggleMode={() => {}} />
    );
    const sel = container.querySelector('[aria-selected="true"]');
    expect(sel?.getAttribute('aria-label')).toContain('Selos');
  });

  it('clicar num satélite chama onSelect; clicar no hub chama onToggleMode', () => {
    const onSelect = vi.fn(); const onToggleMode = vi.fn();
    const { container } = render(
      <MasterRing activeTab="combat" mode="combat" onSelect={onSelect} onToggleMode={onToggleMode} />
    );
    fireEvent.click(container.querySelector('.mp-ring__sat')!);
    expect(onSelect).toHaveBeenCalled();
    fireEvent.click(container.querySelector('.mp-ring__hub')!);
    expect(onToggleMode).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/nav/MasterRing.test.tsx`
Expected: FAIL — "Cannot find module './MasterRing'".

- [ ] **Step 3: Write minimal implementation**

```tsx
// components/nav/MasterRing.tsx
import React from 'react';
import type { TabId } from '../../utils/atmosphere';
import { NAV_DESTS, SATELLITES } from './navModel';
import { polar, satelliteAngles } from './ringGeometry';

const RADIUS = 132;
const ARC = 200;

export function MasterRing({ activeTab, mode, onSelect, onToggleMode }: {
  activeTab: TabId; mode: TabId;
  onSelect: (id: TabId) => void; onToggleMode: () => void;
}) {
  const angles = satelliteAngles(SATELLITES.length, ARC);
  const HubIcon = NAV_DESTS[mode].icon;
  return (
    <div className="mp-ring" role="tablist" aria-label="Navegação do Mestre">
      {SATELLITES.map((id, i) => {
        const d = NAV_DESTS[id];
        const Icon = d.icon;
        const p = polar(angles[i], RADIUS);
        return (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-label={d.label}
            title={d.label}
            className="mp-ring__sat"
            style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
            onClick={() => onSelect(id)}
          >
            <Icon className="w-5 h-5" aria-hidden />
          </button>
        );
      })}
      <button
        role="tab"
        aria-selected={activeTab === mode}
        aria-label={NAV_DESTS[mode].label}
        title={`${NAV_DESTS[mode].label} — clique para alternar`}
        className="mp-ring__hub"
        data-mode={mode}
        onClick={onToggleMode}
      >
        <HubIcon className="w-7 h-7" aria-hidden />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/nav/MasterRing.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/nav/MasterRing.tsx components/nav/MasterRing.test.tsx
git commit -m "feat(nav): MasterRing — dock-joia com hub-medalhão e 5 satélites"
```

---

### Task 6: Componente `CommandWheel` (roda em portal)

**Files:**
- Create: `components/nav/CommandWheel.tsx`
- Test: `components/nav/CommandWheel.test.tsx`
- Create: `components/nav/index.ts`

- [ ] **Step 1: Write the failing test**

```tsx
// components/nav/CommandWheel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CommandWheel } from './CommandWheel';

describe('CommandWheel', () => {
  it('não renderiza nada quando fechada', () => {
    const { container } = render(
      <CommandWheel open={false} activeTab="combat" onSelect={() => {}} onClose={() => {}} />
    );
    expect(document.querySelector('.mp-cmdwheel')).toBeNull();
    expect(container).toBeTruthy();
  });

  it('aberta, renderiza os 7 destinos e seleção fecha', () => {
    const onSelect = vi.fn(); const onClose = vi.fn();
    render(<CommandWheel open activeTab="combat" onSelect={onSelect} onClose={onClose} />);
    const items = document.querySelectorAll('.mp-cmdwheel__item');
    expect(items).toHaveLength(7);
    fireEvent.click(items[2]);
    expect(onSelect).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/nav/CommandWheel.test.tsx`
Expected: FAIL — "Cannot find module './CommandWheel'".

- [ ] **Step 3: Write minimal implementation**

```tsx
// components/nav/CommandWheel.tsx
import React from 'react';
import { createPortal } from 'react-dom';
import type { TabId } from '../../utils/atmosphere';
import { NAV_DESTS, NAV_ORDER } from './navModel';
import { polar } from './ringGeometry';

const RADIUS = 130;

export function CommandWheel({ open, activeTab, onSelect, onClose }: {
  open: boolean; activeTab: TabId;
  onSelect: (id: TabId) => void; onClose: () => void;
}) {
  if (!open) return null;
  const step = 360 / NAV_ORDER.length;
  return createPortal(
    <div className="mp-cmdwheel" onClick={onClose} role="dialog" aria-label="Roda de comando">
      <div className="mp-cmdwheel__disc" onClick={(e) => e.stopPropagation()}>
        {NAV_ORDER.map((id, i) => {
          const d = NAV_DESTS[id];
          const Icon = d.icon;
          const p = polar(i * step, RADIUS);
          return (
            <button
              key={id}
              className="mp-cmdwheel__item"
              aria-current={activeTab === id}
              aria-label={d.label}
              title={d.label}
              style={{ transform: `translate(${p.x}px, ${p.y}px)`, animationDelay: `${i * 18}ms` }}
              onClick={() => { onSelect(id); onClose(); }}
            >
              <Icon className="w-6 h-6" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/nav/CommandWheel.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Criar o barrel e commit**

```ts
// components/nav/index.ts
export { MasterRing } from './MasterRing';
export { CommandWheel } from './CommandWheel';
export { useRadialNav } from './useRadialNav';
export { NAV_DESTS, NAV_ORDER, MODES, SATELLITES } from './navModel';
```

```bash
git add components/nav/CommandWheel.tsx components/nav/CommandWheel.test.tsx components/nav/index.ts
git commit -m "feat(nav): CommandWheel em portal + barrel do módulo nav"
```

---

### Task 7: Integrar no `App.tsx` (substituir a navbar)

Substitui os 7 `TabButton`s pelo `MasterRing`, fia o hook, liga a roda de comando (abre segurando `Backquote` `` ` ``, fecha ao soltar/Esc), e amansa a marca d'água gigante. Mantém a toolbar de salvar/exportar/importar.

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Importar o módulo nav** (junto aos outros imports no topo, após a linha de imports de `components/ui`)

```tsx
import { MasterRing, CommandWheel, useRadialNav } from './components/nav';
```

- [ ] **Step 2: Instanciar o hook** (logo após o `useEffect` de atmosfera, ~linha 3088)

```tsx
const radial = useRadialNav({ activeTab: activeTab as any, onSelect: (id) => setActiveTab(id as any) });
useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === '`' && !radial.wheelOpen) { e.preventDefault(); radial.openWheel(); }
    else radial.handleKey(e);
  };
  const up = (e: KeyboardEvent) => { if (e.key === '`') radial.closeWheel(); };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
}, [radial]);
```

- [ ] **Step 3: Substituir o bloco dos `TabButton`s** (linhas ~5709-5718, todo o `<div className="flex items-center gap-2 ...">` que contém os 7 `TabButton`) por:

```tsx
<div className="flex items-center gap-2">
  <MasterRing
    activeTab={activeTab as any}
    mode={radial.mode as any}
    onSelect={(id) => setActiveTab(id as any)}
    onToggleMode={radial.toggleMode}
  />
</div>
```

> Manter intacta a `<div>` irmã de toolbar (salvar/exportar/importar/toggle de movimento) que vem logo depois (linhas ~5720-5766).

- [ ] **Step 4: Amansar a marca d'água gigante** (linhas ~5688-5691): reduzir `opacity` de `0.05` para `0.025` e `fontSize` de `104` para `64` (a hierarquia agora vive no anel, não no título gigante).

```tsx
<div aria-hidden className="mp-page-title" style={{ position: 'absolute', left: -18, top: '50%', transform: 'translateY(-50%)', fontSize: 64, lineHeight: 1, whiteSpace: 'nowrap', color: '#fff', opacity: 0.025, pointerEvents: 'none' }}>
  {TAB_META[activeTab].label}
</div>
```

- [ ] **Step 5: Renderizar a roda de comando** (logo antes do fechamento `</nav>` na linha ~5769, ou perto do `<main>`):

```tsx
<CommandWheel
  open={radial.wheelOpen}
  activeTab={activeTab as any}
  onSelect={(id) => setActiveTab(id as any)}
  onClose={radial.closeWheel}
/>
```

- [ ] **Step 6: Verificar tipos e testes**

Run: `npx tsc --noEmit` (não pode aumentar o baseline de 31 erros) e `npx vitest run`.
Expected: testes verdes; tsc sem novos erros.

- [ ] **Step 7: Verificar ao vivo no preview**

Iniciar o dev server (launch "dev", porta de dev do projeto) e confirmar:
- O dock-joia aparece no lugar da antiga fileira de abas.
- Clicar no medalhão alterna Combate↔Jornada e troca o clima (fundo claro↔escuro).
- Clicar/teclar 1-7 troca de aba; setas ciclam satélites.
- Segurar `` ` `` abre a roda de comando; soltar fecha; `Esc` fecha.
- Toggle de movimento (⚡) ainda congela animações.

- [ ] **Step 8: Commit**

```bash
git add App.tsx
git commit -m "feat(nav): integra o Anel do Mestre no App (substitui navbar, roda no backquote)"
```

---

## Self-Review

**Spec coverage (seção 3 da spec):**
- 3.1 medalhão-toggle + troca de clima → Tasks 3 (toggleMode), 5 (hub), 7 (integração reaproveita o `useEffect` de atmosfera). ✓
- 3.2 5 satélites em latão → Tasks 1, 5. ✓
- 3.3 dock-joia + roda de comando → Tasks 5, 6, 7. ✓
- 3.4 teclado/a11y (1-7, setas, Espaço/Q, Esc, roles) → Tasks 3, 5, 6, 7. ✓ (`Espaço`/`Q` para toggle podem ser ligados no `handleKey` numa iteração; o backquote cobre a roda.)
- 3.5 geometria → Task 2. ✓
- Fundação visual (seção 4) → Task 4 (escala/espaço/acento). Tipografia/respiro completos das abas internas ficam para a Fase 2/3 (correto: aqui é só a casca). ✓
- Movimento/performance (seção 6) → Task 4 (animações gated por reduced-motion). ✓

**Placeholder scan:** nenhum "TBD/TODO"; todo passo tem código real e comando com resultado esperado. As linhas de `App.tsx` são aproximadas (`~`) por ser arquivo de 9.865 linhas — o executor confirma por contexto (bloco dos `TabButton`/marca d'água), o que é guiado.

**Type consistency:** `TabId` (de `utils/atmosphere`) usado em todos os módulos; `useRadialNav` expõe `mode`, `wheelOpen`, `toggleMode`, `select`, `openWheel`, `closeWheel`, `handleKey` — consumidos consistentemente em Task 7. `MasterRing` props (`activeTab`, `mode`, `onSelect`, `onToggleMode`) e `CommandWheel` props (`open`, `activeTab`, `onSelect`, `onClose`) batem entre definição e uso.

**Nota de escopo:** Esta é a Fase 1 (casca/navegação). O redesenho do conteúdo das abas (Combate/Jornada) é a Fase 2; os 5 satélites internos são a Fase 3 — cada uma com seu próprio plano.
