# Efeitos Visuais de Condição — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar destaque visual (overlay de partícula animada + fileira de selos) a cada condição ativa (`Condition[]`) no banner da lista de turnos (`TurnOrderRow`) e no token do tabuleiro (`CombatToken`).

**Architecture:** Um novo módulo `components/combat/ConditionEffects.tsx` expõe um motor paramétrico de 5 padrões de animação (rise/fall/orbit/vignette/jitter) mapeados por nome de condição para emoji+cor (reaproveitando `PRESET_CONDITIONS`), mais dois componentes de apresentação (`ConditionEffectOverlay`, `ConditionBadgeRow`) e um `<style>` compartilhado (`ConditionEffectStyles`). `TurnOrderRow`/`CombatToken` passam a renderizar esses componentes usando `combatant.conditions` (já existente); `TurnOrderPanel`/`CombatArena` montam o `<style>` uma vez cada.

**Tech Stack:** React + TypeScript, Vitest + @testing-library/react para testes, CSS puro (keyframes) sem libs de animação novas.

---

## Task 1: Motor de efeito e utilitários puros (`CONDITION_FX`, `getConditionFx`, `dedupeConditions`)

**Files:**
- Create: `components/combat/ConditionEffects.tsx`
- Test: `components/combat/ConditionEffects.test.tsx`

- [ ] **Step 1: Escrever o teste falho para `getConditionFx` e `dedupeConditions`**

```tsx
import { describe, it, expect } from 'vitest';
import { getConditionFx, dedupeConditions, CONDITION_FX, DEFAULT_FX } from './ConditionEffects';

describe('getConditionFx', () => {
  it('retorna a definição mapeada para uma condição conhecida', () => {
    expect(getConditionFx('Queimando')).toEqual(CONDITION_FX['Queimando']);
  });

  it('retorna DEFAULT_FX para uma condição desconhecida sem lançar erro', () => {
    expect(() => getConditionFx('Condição Inventada XYZ')).not.toThrow();
    expect(getConditionFx('Condição Inventada XYZ')).toEqual(DEFAULT_FX);
  });
});

describe('dedupeConditions', () => {
  it('mantém uma única entrada por nome, com a maior duração', () => {
    const result = dedupeConditions([
      { name: 'Queimando', duration: 1 },
      { name: 'Queimando', duration: 3 },
      { name: 'Molhado', duration: 2 },
    ]);
    expect(result).toHaveLength(2);
    const burning = result.find(c => c.name === 'Queimando');
    expect(burning?.duration).toBe(3);
  });

  it('lista vazia retorna lista vazia', () => {
    expect(dedupeConditions([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run components/combat/ConditionEffects.test.tsx`
Expected: FAIL — `Cannot find module './ConditionEffects'` (arquivo ainda não existe).

- [ ] **Step 3: Criar `ConditionEffects.tsx` com o motor de efeito e os utilitários**

```tsx
import React from 'react';
import { Condition } from '../../types';

export type FxPattern = 'rise' | 'fall' | 'orbit' | 'vignette' | 'jitter';

export interface ConditionFxDef {
  pattern: FxPattern;
  emoji: string;
  color: string;
}

export const CONDITION_FX: Record<string, ConditionFxDef> = {
  'Queimando':    { pattern: 'rise',     emoji: '🔥', color: '#ef4444' },
  'Eletrocutado': { pattern: 'jitter',   emoji: '⚡', color: '#facc15' },
  'Molhado':      { pattern: 'fall',     emoji: '💧', color: '#38bdf8' },
  'Envenenado':   { pattern: 'rise',     emoji: '🧪', color: '#a3e635' },
  'Paralisado':   { pattern: 'jitter',   emoji: '🔒', color: '#94a3b8' },
  'Desnorteado':  { pattern: 'orbit',    emoji: '😵', color: '#f97316' },
  'Dormindo':     { pattern: 'rise',     emoji: '💤', color: '#818cf8' },
  'Sangrando':    { pattern: 'fall',     emoji: '🩸', color: '#dc2626' },
  'Amaldiçoado':  { pattern: 'vignette', emoji: '💀', color: '#7c3aed' },
  'Amedrontado':  { pattern: 'vignette', emoji: '😱', color: '#c084fc' },
  'Confuso':      { pattern: 'orbit',    emoji: '🌀', color: '#fb7185' },
  'Cego':         { pattern: 'vignette', emoji: '🌑', color: '#334155' },
  'Imobilizado':  { pattern: 'jitter',   emoji: '🧲', color: '#b45309' },
  'Regenerando':  { pattern: 'rise',     emoji: '💚', color: '#22c55e' },
  'Protegido':    { pattern: 'orbit',    emoji: '🛡', color: '#64748b' },
};

export const DEFAULT_FX: ConditionFxDef = { pattern: 'rise', emoji: '✨', color: '#94a3b8' };

export function getConditionFx(name: string): ConditionFxDef {
  return CONDITION_FX[name] ?? DEFAULT_FX;
}

/** Dedupe by name, keeping the instance with the highest remaining duration. */
export function dedupeConditions(conditions: Condition[]): Condition[] {
  const map = new Map<string, Condition>();
  for (const c of conditions) {
    const existing = map.get(c.name);
    if (!existing || c.duration > existing.duration) map.set(c.name, c);
  }
  return Array.from(map.values());
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run components/combat/ConditionEffects.test.tsx`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add components/combat/ConditionEffects.tsx components/combat/ConditionEffects.test.tsx
git commit -m "feat(combat): motor de efeito e dedupe de condições"
```

---

## Task 2: `ConditionEffectOverlay` (partículas animadas)

**Files:**
- Modify: `components/combat/ConditionEffects.tsx`
- Modify: `components/combat/ConditionEffects.test.tsx`

- [ ] **Step 1: Escrever o teste falho**

```tsx
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { ConditionEffectOverlay } from './ConditionEffects';

afterEach(() => cleanup());

describe('ConditionEffectOverlay', () => {
  it('não renderiza nada quando não há condições', () => {
    const { container } = render(<ConditionEffectOverlay conditions={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza uma camada por condição única, respeitando dedupe', () => {
    render(<ConditionEffectOverlay conditions={[
      { name: 'Queimando', duration: 1 },
      { name: 'Queimando', duration: 2 },
      { name: 'Molhado', duration: 3 },
    ]} />);
    expect(screen.getByTestId('condition-fx-Queimando')).toBeTruthy();
    expect(screen.getByTestId('condition-fx-Molhado')).toBeTruthy();
  });

  it('limita a maxLayers camadas simultâneas mesmo com mais condições ativas', () => {
    render(<ConditionEffectOverlay maxLayers={2} conditions={[
      { name: 'Queimando', duration: 1 },
      { name: 'Molhado', duration: 1 },
      { name: 'Confuso', duration: 1 },
    ]} />);
    const overlay = screen.getByTestId('condition-overlay');
    expect(overlay.querySelectorAll('.mp-cond-fx')).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run components/combat/ConditionEffects.test.tsx`
Expected: FAIL — `ConditionEffectOverlay` não exportado.

- [ ] **Step 3: Implementar `ConditionEffectOverlay` em `ConditionEffects.tsx`**

```tsx
const PARTICLE_COUNTS: Record<FxPattern, number> = {
  rise: 6, fall: 6, orbit: 5, vignette: 0, jitter: 4,
};

export const ConditionEffectOverlay: React.FC<{ conditions: Condition[]; maxLayers?: number }> = ({
  conditions, maxLayers = 3,
}) => {
  const unique = dedupeConditions(conditions).slice(0, maxLayers);
  if (unique.length === 0) return null;
  return (
    <div className="mp-cond-overlay" data-testid="condition-overlay">
      {unique.map(cond => {
        const fx = getConditionFx(cond.name);
        const count = PARTICLE_COUNTS[fx.pattern];
        return (
          <div
            key={cond.name}
            className={`mp-cond-fx mp-cond-fx--${fx.pattern}`}
            style={{ ['--cond-color' as string]: fx.color } as React.CSSProperties}
            data-testid={`condition-fx-${cond.name}`}
          >
            {Array.from({ length: count }).map((_, i) => (
              <span
                key={i}
                className="mp-cond-particle"
                style={{
                  ['--i' as string]: i,
                  left: `${8 + i * (84 / Math.max(1, count - 1 || 1))}%`,
                  animationDelay: `${i * 0.22}s`,
                } as React.CSSProperties}
              >
                {fx.emoji}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run components/combat/ConditionEffects.test.tsx`
Expected: PASS (7 testes no total)

- [ ] **Step 5: Commit**

```bash
git add components/combat/ConditionEffects.tsx components/combat/ConditionEffects.test.tsx
git commit -m "feat(combat): ConditionEffectOverlay com camadas de partícula por condição"
```

---

## Task 3: `ConditionBadgeRow` (selos com overflow)

**Files:**
- Modify: `components/combat/ConditionEffects.tsx`
- Modify: `components/combat/ConditionEffects.test.tsx`

- [ ] **Step 1: Escrever o teste falho**

```tsx
import { fireEvent } from '@testing-library/react';
import { ConditionBadgeRow } from './ConditionEffects';

describe('ConditionBadgeRow', () => {
  it('não renderiza nada quando não há condições', () => {
    const { container } = render(<ConditionBadgeRow conditions={[]} maxVisible={5} />);
    expect(container.firstChild).toBeNull();
  });

  it('mostra um selo por condição única até maxVisible', () => {
    render(<ConditionBadgeRow maxVisible={5} conditions={[
      { name: 'Queimando', duration: 2 },
      { name: 'Molhado', duration: 2 },
    ]} />);
    const row = screen.getByTestId('condition-badges');
    expect(row.querySelectorAll('.mp-cond-badge')).toHaveLength(2);
  });

  it('agrupa o excedente além de maxVisible num selo +N', () => {
    render(<ConditionBadgeRow maxVisible={2} conditions={[
      { name: 'Queimando', duration: 1 },
      { name: 'Molhado', duration: 1 },
      { name: 'Confuso', duration: 1 },
      { name: 'Cego', duration: 1 },
    ]} />);
    const row = screen.getByTestId('condition-badges');
    expect(row.querySelectorAll('.mp-cond-badge--overflow')).toHaveLength(1);
    expect(screen.getByText('+2')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run components/combat/ConditionEffects.test.tsx`
Expected: FAIL — `ConditionBadgeRow` não exportado.

- [ ] **Step 3: Implementar `ConditionBadgeRow` em `ConditionEffects.tsx`**

```tsx
export const ConditionBadgeRow: React.FC<{
  conditions: Condition[];
  maxVisible: number;
  className?: string;
}> = ({ conditions, maxVisible, className }) => {
  const unique = dedupeConditions(conditions);
  if (unique.length === 0) return null;
  const visible = unique.slice(0, maxVisible);
  const overflow = unique.slice(maxVisible);
  return (
    <div className={`mp-cond-badges ${className ?? ''}`.trim()} data-testid="condition-badges">
      {visible.map(cond => {
        const fx = getConditionFx(cond.name);
        return (
          <span
            key={cond.name}
            className="mp-cond-badge"
            style={{ ['--cond-color' as string]: fx.color } as React.CSSProperties}
            title={`${cond.name} (${cond.duration} rodada${cond.duration === 1 ? '' : 's'})`}
          >
            {fx.emoji}
          </span>
        );
      })}
      {overflow.length > 0 && (
        <span
          className="mp-cond-badge mp-cond-badge--overflow"
          title={overflow.map(c => c.name).join(', ')}
        >
          +{overflow.length}
        </span>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run components/combat/ConditionEffects.test.tsx`
Expected: PASS (10 testes no total)

- [ ] **Step 5: Commit**

```bash
git add components/combat/ConditionEffects.tsx components/combat/ConditionEffects.test.tsx
git commit -m "feat(combat): ConditionBadgeRow com agrupamento de excedente"
```

---

## Task 4: `ConditionEffectStyles` (keyframes compartilhados)

**Files:**
- Modify: `components/combat/ConditionEffects.tsx`

- [ ] **Step 1: Adicionar o componente de estilo (sem teste de snapshot — CSS puro, verificado visualmente na Task 6)**

```tsx
export const ConditionEffectStyles: React.FC = () => (
  <style>{`
    .mp-cond-overlay {
      position: absolute; inset: 0; overflow: hidden;
      pointer-events: none; border-radius: inherit; z-index: 2;
    }
    .mp-cond-fx { position: absolute; inset: 0; }
    .mp-cond-particle {
      position: absolute; bottom: -10%; font-size: 14px;
      color: var(--cond-color); text-shadow: 0 0 6px var(--cond-color);
      opacity: 0;
    }
    .mp-cond-fx--rise .mp-cond-particle { animation: mp-cond-rise 2.2s ease-in infinite; }
    @keyframes mp-cond-rise {
      0% { transform: translateY(0) scale(0.8); opacity: 0; }
      15% { opacity: 0.9; }
      100% { transform: translateY(-140%) scale(1.1); opacity: 0; }
    }
    .mp-cond-fx--fall .mp-cond-particle { top: -10%; bottom: auto; animation: mp-cond-fall 1.8s ease-in infinite; }
    @keyframes mp-cond-fall {
      0% { transform: translateY(0) scale(0.9); opacity: 0; }
      15% { opacity: 0.9; }
      100% { transform: translateY(220%) scale(1); opacity: 0; }
    }
    .mp-cond-fx--orbit .mp-cond-particle {
      top: 50%; bottom: auto;
      animation: mp-cond-orbit 3.5s linear infinite;
      opacity: 0.85;
    }
    @keyframes mp-cond-orbit {
      0% { transform: rotate(calc(var(--i) * 72deg)) translateX(46%) rotate(0deg); }
      100% { transform: rotate(calc(var(--i) * 72deg + 360deg)) translateX(46%) rotate(-360deg); }
    }
    .mp-cond-fx--jitter {
      animation: mp-cond-jitter 0.3s steps(2) infinite;
      background: radial-gradient(circle, var(--cond-color, #fff) 0%, transparent 70%);
      opacity: 0.18;
    }
    @keyframes mp-cond-jitter {
      0% { transform: translate(0,0); }
      50% { transform: translate(1px,-1px); }
      100% { transform: translate(-1px,1px); }
    }
    .mp-cond-fx--vignette {
      background: radial-gradient(circle at 50% 50%, transparent 40%, var(--cond-color, #000) 130%);
      opacity: 0.35;
      animation: mp-cond-pulse 2.6s ease-in-out infinite;
    }
    @keyframes mp-cond-pulse {
      0%, 100% { opacity: 0.25; }
      50% { opacity: 0.5; }
    }

    .mp-cond-badges {
      display: flex; align-items: center; gap: 3px; flex-wrap: wrap;
    }
    .mp-cond-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 50%;
      font-size: 11px; line-height: 1;
      background: rgba(8,10,16,0.75);
      border: 1.5px solid var(--cond-color, rgba(255,255,255,0.3));
      box-shadow: 0 0 6px var(--cond-color, transparent);
    }
    .mp-cond-badge--overflow {
      color: rgba(255,255,255,0.8); font-size: 9px; font-weight: 700;
      border-color: rgba(255,255,255,0.3);
    }
  `}</style>
);
```

- [ ] **Step 2: Rodar toda a suíte do arquivo para garantir que nada quebrou**

Run: `npx vitest run components/combat/ConditionEffects.test.tsx`
Expected: PASS (10 testes)

- [ ] **Step 3: Commit**

```bash
git add components/combat/ConditionEffects.tsx
git commit -m "feat(combat): keyframes compartilhados para efeitos de condição"
```

---

## Task 5: Integrar no banner da lista de turnos (`TurnOrderRow` + `TurnOrderPanel`)

**Files:**
- Modify: `components/combat/TurnOrderRow.tsx:1-30`, `:96-124`
- Modify: `components/combat/TurnOrderPanel.tsx:1-27`

- [ ] **Step 1: Importar os componentes em `TurnOrderRow.tsx`**

Em `components/combat/TurnOrderRow.tsx:1-4`, trocar:

```tsx
import React from 'react';
import { Combatant, ActiveForma, Card, Item } from '../../types';
import { PALETTE } from '../../utils/theme';
import ActionIconRail, { ActionCategory } from './ActionIconRail';
```

por:

```tsx
import React from 'react';
import { Combatant, ActiveForma, Card, Item } from '../../types';
import { PALETTE } from '../../utils/theme';
import ActionIconRail, { ActionCategory } from './ActionIconRail';
import { ConditionEffectOverlay, ConditionBadgeRow } from './ConditionEffects';
```

- [ ] **Step 2: Renderizar o overlay logo após o véu (`components/combat/TurnOrderRow.tsx:96-98`)**

Trocar:

```tsx
      <div className="mp-turn-banner__veil" />
      {isActive && <div className="mp-turn-banner__active-stroke" />}
      {isDefeated && <div className="mp-turn-banner__slash" />}
```

por:

```tsx
      <div className="mp-turn-banner__veil" />
      <ConditionEffectOverlay conditions={combatant.conditions} />
      {isActive && <div className="mp-turn-banner__active-stroke" />}
      {isDefeated && <div className="mp-turn-banner__slash" />}
```

- [ ] **Step 3: Renderizar a fileira de selos na topline (`components/combat/TurnOrderRow.tsx:116-124`)**

`.mp-turn-banner__conditions` já existe no CSS (`index.html:1352-1370`) mas nunca foi usado no componente — reaproveitar essa classe. Trocar:

```tsx
        <div className="mp-turn-banner__topline">
          <div className="mp-turn-banner__name-block">
            <span className="mp-turn-banner__role">
              PERSONAGEM
            </span>
            <strong className="mp-turn-banner__name">{combatant.name}</strong>
          </div>

        </div>
```

por:

```tsx
        <div className="mp-turn-banner__topline">
          <div className="mp-turn-banner__name-block">
            <span className="mp-turn-banner__role">
              PERSONAGEM
            </span>
            <strong className="mp-turn-banner__name">{combatant.name}</strong>
          </div>
          <ConditionBadgeRow
            conditions={combatant.conditions}
            maxVisible={5}
            className="mp-turn-banner__conditions"
          />
        </div>
```

- [ ] **Step 4: Montar `ConditionEffectStyles` uma vez em `TurnOrderPanel.tsx`**

Em `components/combat/TurnOrderPanel.tsx:1-3`, trocar:

```tsx
import React from 'react';
import { CombatState, Card, Item } from '../../types';
import TurnOrderRow from './TurnOrderRow';
```

por:

```tsx
import React from 'react';
import { CombatState, Card, Item } from '../../types';
import TurnOrderRow from './TurnOrderRow';
import { ConditionEffectStyles } from './ConditionEffects';
```

E logo na abertura do `return` (`components/combat/TurnOrderPanel.tsx:26-27`), adicionar `<ConditionEffectStyles />` como primeiro filho da `<div>` raiz (antes do `.map` que renderiza as `TurnOrderRow`).

- [ ] **Step 5: Escrever teste de integração em `tabs/cena/InitiativeTracker.test.tsx` (ou arquivo de teste existente que já renderiza `TurnOrderRow`/`TurnOrderPanel`) garantindo que o selo aparece quando o combatente tem condição ativa**

Localizar o teste existente que monta um `Combatant` de exemplo (buscar por `combatId` no arquivo) e adicionar:

```tsx
it('mostra selo de condição quando o combatente tem condição ativa', () => {
  const combatant = makeCombatant({ conditions: [{ name: 'Queimando', duration: 2 }] });
  // renderizar o componente do teste existente com esse combatant
  // (usar o helper de render já presente no arquivo)
  expect(screen.getByTitle('Queimando (2 rodadas)')).toBeTruthy();
});
```

(Adaptar `makeCombatant`/helper de render ao padrão já existente no arquivo — não criar um helper novo se um equivalente já existir.)

- [ ] **Step 6: Rodar os testes do arquivo tocado**

Run: `npx vitest run tabs/cena/InitiativeTracker.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add components/combat/TurnOrderRow.tsx components/combat/TurnOrderPanel.tsx tabs/cena/InitiativeTracker.test.tsx
git commit -m "feat(combat): mostrar condições ativas no banner de turnos"
```

---

## Task 6: Integrar no token do tabuleiro (`CombatToken` + `CombatArena`)

**Files:**
- Modify: `components/combat/grid/CombatToken.tsx:1-9`, `:95-101`, `:158-181`
- Modify: `components/combat/grid/CombatArena.tsx:1-13`, `:321-331`

- [ ] **Step 1: Importar os componentes em `CombatToken.tsx`**

Em `components/combat/grid/CombatToken.tsx:1-9`, trocar:

```tsx
import React from 'react';
import { Skull } from 'lucide-react';
import {
  Combatant, ActiveForma, CombatantUnion,
  StatPopup, GridInteractionMode,
} from '../../../types';
import TokenBase from './TokenBase';
import TokenRing from './TokenRing';
import StatPopups from './StatPopups';
```

por:

```tsx
import React from 'react';
import { Skull } from 'lucide-react';
import {
  Combatant, ActiveForma, CombatantUnion,
  StatPopup, GridInteractionMode,
} from '../../../types';
import TokenBase from './TokenBase';
import TokenRing from './TokenRing';
import StatPopups from './StatPopups';
import { ConditionEffectOverlay, ConditionBadgeRow } from '../ConditionEffects';
```

- [ ] **Step 2: Renderizar o overlay dentro do wrapper com `position: relative` (o `<div>` com `transform: scale(...)`, `components/combat/grid/CombatToken.tsx:96-101`)**

Trocar:

```tsx
      <div style={{
        position: 'relative',
        transform: `scale(${scale})`,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <TokenBase teamColor={teamColor} />
        <TokenRing
```

por:

```tsx
      <div style={{
        position: 'relative',
        transform: `scale(${scale})`,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <TokenBase teamColor={teamColor} />
        <ConditionEffectOverlay conditions={c.conditions} maxLayers={3} />
        <TokenRing
```

- [ ] **Step 3: Renderizar a fileira de selos acima do nameplate (`components/combat/grid/CombatToken.tsx:158-181`)**

Trocar:

```tsx
        {/* Nome — fita-banner iluminada */}
        <div
          className={`mp-token-nameplate${isCurrent ? ' mp-token-nameplate--current' : ''}`}
```

por:

```tsx
        <ConditionBadgeRow conditions={c.conditions} maxVisible={3} className="mp-token-conditions" />

        {/* Nome — fita-banner iluminada */}
        <div
          className={`mp-token-nameplate${isCurrent ? ' mp-token-nameplate--current' : ''}`}
```

- [ ] **Step 4: Adicionar CSS de posicionamento para `.mp-token-conditions` (o `ConditionEffectStyles` cobre o resto, mas o token precisa ancorar a fileira acima do retrato)**

Em `components/combat/ConditionEffects.tsx`, dentro do template do `ConditionEffectStyles` (Task 4), adicionar ao final do bloco de `.mp-cond-badge--overflow { ... }`:

```css
    .mp-token-conditions {
      position: absolute; top: -14px; left: 50%;
      transform: translateX(-50%);
      z-index: 25;
    }
```

- [ ] **Step 5: Montar `ConditionEffectStyles` uma vez em `CombatArena.tsx`**

Em `components/combat/grid/CombatArena.tsx:8-13`, trocar:

```tsx
import CombatToken from './CombatToken';
import GridSVGLayer, { svgPoint } from './GridSVGLayer';
import FogRevealOverlay from './FogRevealOverlay';
import ArenaToolbar from './ArenaToolbar';
import EmberField from './EmberField';
import { correctedDist } from './aoeHelpers';
```

por:

```tsx
import CombatToken from './CombatToken';
import GridSVGLayer, { svgPoint } from './GridSVGLayer';
import FogRevealOverlay from './FogRevealOverlay';
import ArenaToolbar from './ArenaToolbar';
import EmberField from './EmberField';
import { correctedDist } from './aoeHelpers';
import { ConditionEffectStyles } from '../ConditionEffects';
```

E em `components/combat/grid/CombatArena.tsx:322-323`, trocar:

```tsx
      {/* Atmospheric overlays — registro ardente */}
      <div className="mp-battle-forge-glow" />
```

por:

```tsx
      <ConditionEffectStyles />
      {/* Atmospheric overlays — registro ardente */}
      <div className="mp-battle-forge-glow" />
```

- [ ] **Step 6: Rodar os testes que já existem para o grid de combate (se houver arquivo `.test.tsx` cobrindo `CombatArena`/`CombatToken`; caso não exista, pular para o Step 7 sem criar teste novo — cobertura de integração já ficou em `ConditionEffects.test.tsx`)**

Run: `npx vitest run components/combat`
Expected: PASS (sem regressões)

- [ ] **Step 7: Commit**

```bash
git add components/combat/grid/CombatToken.tsx components/combat/grid/CombatArena.tsx components/combat/ConditionEffects.tsx
git commit -m "feat(combat): mostrar condições ativas no token do tabuleiro"
```

---

## Task 7: Verificação manual no preview

**Files:** nenhum (apenas verificação, sem edição de código)

- [ ] **Step 1: Rodar a suíte completa**

Run: `npx vitest run`
Expected: PASS em todos os arquivos, sem regressão em `TurnOrderRow`, `CombatToken`, `InitiativeTracker`, `CenaTab`.

- [ ] **Step 2: Subir o dev server e abrir a aba Cena com um combate ativo**

Usar `preview_start`, `preview_navigate`/`preview_click` até a aba Cena com um encontro em andamento. Adicionar manualmente (via UI existente de condições, se houver, ou editando o estado de um combatente de teste) uma condição como `Queimando` a um personagem.

- [ ] **Step 3: Conferir visualmente**

- O banner desse personagem na lista de turnos mostra o overlay de partícula (chamas subindo) e o selo 🔥 na topline.
- O token desse personagem no tabuleiro mostra o mesmo overlay e o selo acima do nome.
- Adicionar uma segunda e terceira condição ao mesmo personagem e confirmar que os selos aparecem lado a lado e que, com uma quarta, o token (limite 3) some com `+1`.
- Usar `preview_console_logs` para confirmar que não há erros no console.

- [ ] **Step 4: Reportar ao usuário com screenshot (`preview_screenshot`) do banner e do token com condição ativa.**
