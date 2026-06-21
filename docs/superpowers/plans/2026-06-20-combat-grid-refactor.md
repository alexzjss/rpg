# Combat Grid Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar completamente a grid de combate — posicionamento livre por %, tokens visuais "aterrados", drag com alcance, AoE, régua, névoa de guerra, badges de condição e paridade total no PlayerMirror — extraindo tudo do App.tsx em componentes isolados.

**Architecture:** Híbrido DOM + SVG. Tokens em `div` absolutos posicionados por `left/top` em %. Geometria (grade, alcance, AoE, régua, névoa) em camada SVG `viewBox="0 0 100 100" preserveAspectRatio="none"` sobreposta. `CombatArena` é o componente raiz; `App.tsx` só passa `combat` + callbacks. `PlayerMirror` reutiliza `CombatArena` em modo `readOnly`.

**Tech Stack:** React 19, TypeScript 5.8, Lucide React, inline CSS (padrão existente), SVG nativo, HTML5 Pointer Events API

**Baseline tsc:** 29 erros pré-existentes. Cada checkpoint verifica que não aumentamos além disso.

---

## File Map

### Criar
- `components/combat/grid/CombatArena.tsx` — raiz da grid; orquestra layout, drag, fog reveal
- `components/combat/grid/GridSVGLayer.tsx` — SVG: grade, alcance, AoE, régua, fog mask
- `components/combat/grid/CombatToken.tsx` — token individual (DOM)
- `components/combat/grid/TokenBase.tsx` — sombra elíptica de chão
- `components/combat/grid/TokenRing.tsx` — anéis de estado
- `components/combat/grid/ConditionBadges.tsx` — ícones de condição
- `components/combat/grid/StatPopups.tsx` — números flutuantes
- `components/combat/grid/ArenaToolbar.tsx` — toolbar do mestre
- `components/combat/grid/FogRevealOverlay.tsx` — pincel de névoa
- `components/combat/grid/conditionIconMap.ts` — lookup condition → ícone Lucide
- `components/combat/grid/aoeHelpers.ts` — geometria de AoE (SVG path)
- `utils/combatMigration.ts` — migração gridPos → pos

### Modificar
- `types.ts` — novos tipos, campos alterados em Combatant/CombatState/Character
- `App.tsx` — substituir bloco de grid por `<CombatArena>`, adicionar migration, remover state/handlers
- `components/PlayerMirror.tsx` — rebuild usando CombatArena readOnly

---

## Task 1: Tipos e interfaces

**Files:**
- Modify: `types.ts`

- [ ] **Step 1: Adicionar StatPopup e GridInteractionMode a types.ts**

Encontre o final do bloco de exports em `types.ts` (depois de `ActiveForma`) e adicione:

```ts
// ─────────────────────────────────────────────────────────────────
//  Grid de Combate — Tipos Novos
// ─────────────────────────────────────────────────────────────────

export interface StatPopup {
  id: string;
  combatId: string;
  type: 'hp' | 'aura' | 'ammo';
  delta: number;
}

export type GridInteractionMode =
  | { type: 'select' }
  | { type: 'target-single' }
  | { type: 'target-area' }
  | { type: 'item-target' }
  | { type: 'union' };

export type ToolbarMode =
  | 'none'
  | 'ruler'
  | 'aoe-circle'
  | 'aoe-cone'
  | 'aoe-line'
  | 'fog-reveal'
  | 'fog-hide';

export interface FogState {
  density: number;        // grade interna ex: 20 → 20×20
  revealed: boolean[][];  // [row][col]
}

export type AoEShape = 'circle' | 'cone' | 'line';

export interface AoETemplate {
  id: string;
  shape: AoEShape;
  color: string;          // ex: '#ef444466'
  label?: string;
  x: number; y: number;   // origem (% arena)
  radius?: number;         // circle: raio em % width
  angle?: number;          // cone/line: direção em graus (0 = direita)
  arc?: number;            // cone: abertura em graus
  length?: number;         // cone/line: comprimento em % width
  width?: number;          // line: largura em % width
  visibleToPlayers: boolean;
}
```

- [ ] **Step 2: Adicionar deslocamento ao Character**

Localize `interface Character` em `types.ts`. Adicione o campo após `baseInitiative`:

```ts
  baseInitiative: number;
  deslocamento?: number;   // unidades de movimento (padrão: 6)
```

- [ ] **Step 3: Adicionar pos ao Combatant e manter gridPos opcional**

Localize `interface Combatant extends Character`. Altere:

```ts
export interface Combatant extends Character {
  combatId: string;
  initiativeResult: number;
  gridPos: { x: number; y: number }; // legado — mantido para migration
  pos: { x: number; y: number };     // novo: % da arena (0–100)
}
```

> Mantemos `gridPos` como campo (não opcional) por ora para não quebrar código existente durante a migração. Será removido na Task 14.

- [ ] **Step 4: Alterar CombatState — remover campos antigos, adicionar novos**

Localize `interface CombatState`. Aplique as mudanças abaixo. Os campos `gridWidth`, `gridHeight`, `visualWidthPct`, `visualHeightPx`, `maintainAspectRatio` e `customPins` continuam existindo na interface por ora (remoção na Task 14 junto com a limpeza final):

```ts
export interface CombatState {
  isActive: boolean;
  round: number;
  turnIndex: number;
  combatants: Combatant[];
  history: CombatHistoryItem[];
  fieldConditions: FieldCondition[];
  backgroundImage: string;
  globalBonus: number;
  gridWidth: number;          // legado
  gridHeight: number;         // legado
  visualWidthPct: number;     // legado
  visualHeightPx: number;     // legado
  maintainAspectRatio: boolean; // legado
  savedState?: CombatState | null;
  customPins?: CustomPin[];   // legado
  unions?: CombatantUnion[];
  activeForms?: ActiveForma[];
  // Novos
  gridVisible: boolean;
  gridDensity: number;        // ex: 10 → grade 10×10 visual
  escala: number;             // % arena por unidade de deslocamento (ex: 10)
  fog?: FogState;
  aoeTemplates?: AoETemplate[];
}
```

- [ ] **Step 5: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | tail -10
```

Esperado: erros podem aumentar temporariamente (novos campos sem defaults). Prosseguir se os erros novos forem apenas sobre `pos` não existir nos combatants existentes — isso será corrigido na migration.

---

## Task 2: Migration utility

**Files:**
- Create: `utils/combatMigration.ts`

- [ ] **Step 1: Criar utils/combatMigration.ts**

```ts
import { CombatState } from '../types';

function migrateOneCombatState(data: Record<string, unknown>): CombatState {
  const gw = (data.gridWidth as number) || 10;
  const gh = (data.gridHeight as number) || 10;

  const combatants = ((data.combatants as any[]) || []).map((c: any) => ({
    ...c,
    pos: c.pos ?? {
      x: ((c.gridPos?.x ?? 0) / gw) * 100,
      y: ((c.gridPos?.y ?? 0) / gh) * 100,
    },
  }));

  const savedState = data.savedState
    ? migrateOneCombatState(data.savedState as Record<string, unknown>)
    : null;

  return {
    ...data,
    combatants,
    savedState,
    gridVisible: (data.gridVisible as boolean) ?? true,
    gridDensity: (data.gridDensity as number) ?? gw,
    escala: (data.escala as number) ?? 10,
  } as CombatState;
}

export function migrateCombatState(raw: unknown): CombatState {
  return migrateOneCombatState(raw as Record<string, unknown>);
}
```

- [ ] **Step 2: Verificar**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

---

## Task 3: conditionIconMap e aoeHelpers

**Files:**
- Create: `components/combat/grid/conditionIconMap.ts`
- Create: `components/combat/grid/aoeHelpers.ts`

- [ ] **Step 1: Criar components/combat/grid/conditionIconMap.ts**

```ts
import {
  Zap, Droplets, Skull, Flame, Snowflake, AlertOctagon,
  EyeOff, VolumeX, Timer, Ghost, Shield, BatteryLow,
  AlertCircle, Wind, Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const conditionIconMap: Record<string, LucideIcon> = {
  'atordoado': Zap,    'atordoada': Zap,
  'sangrando': Droplets, 'sangranda': Droplets,
  'envenenado': Skull,  'envenenada': Skull,
  'queimando': Flame,   'queimanda': Flame,
  'congelado': Snowflake, 'congelada': Snowflake,
  'paralisado': AlertOctagon, 'paralisada': AlertOctagon,
  'cego': EyeOff,       'cega': EyeOff,
  'mudo': VolumeX,      'muda': VolumeX,
  'lento': Timer,       'lenta': Timer,
  'amedrontado': Ghost, 'amedrontada': Ghost,
  'invisível': Ghost,   'invisivel': Ghost,
  'protegido': Shield,  'protegida': Shield,
  'exausto': BatteryLow, 'exausta': BatteryLow,
  'abençoado': Star,    'abençoada': Star,
  'fraco': Wind,        'fraca': Wind,
};

export function getConditionIcon(name: string): LucideIcon {
  return conditionIconMap[name.toLowerCase().trim()] ?? AlertCircle;
}
```

- [ ] **Step 2: Criar components/combat/grid/aoeHelpers.ts**

Todas as coordenadas em unidades SVG (0–100, onde 100 = largura/altura da arena).

```ts
export function conePathD(
  cx: number, cy: number,
  angleDeg: number, arcDeg: number, length: number,
): string {
  const half = arcDeg / 2;
  const a1 = (angleDeg - half) * (Math.PI / 180);
  const a2 = (angleDeg + half) * (Math.PI / 180);
  const x1 = cx + length * Math.cos(a1);
  const y1 = cy + length * Math.sin(a1);
  const x2 = cx + length * Math.cos(a2);
  const y2 = cy + length * Math.sin(a2);
  const large = arcDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${length} ${length} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function linePathD(
  cx: number, cy: number,
  angleDeg: number, length: number, width: number,
): string {
  const a = angleDeg * (Math.PI / 180);
  const perp = a + Math.PI / 2;
  const hw = width / 2;
  const ex = cx + length * Math.cos(a);
  const ey = cy + length * Math.sin(a);
  const p1x = cx + hw * Math.cos(perp); const p1y = cy + hw * Math.sin(perp);
  const p2x = cx - hw * Math.cos(perp); const p2y = cy - hw * Math.sin(perp);
  const p3x = ex - hw * Math.cos(perp); const p3y = ey - hw * Math.sin(perp);
  const p4x = ex + hw * Math.cos(perp); const p4y = ey + hw * Math.sin(perp);
  return `M ${p1x} ${p1y} L ${p4x} ${p4y} L ${p3x} ${p3y} L ${p2x} ${p2y} Z`;
}

/** Distância entre dois pontos em % de largura de arena, corrigida pelo aspect ratio. */
export function correctedDist(
  a: { x: number; y: number },
  b: { x: number; y: number },
  aspectRatio: number, // w / h
): number {
  const dx = b.x - a.x;
  const dy = (b.y - a.y) / aspectRatio;
  return Math.sqrt(dx * dx + dy * dy);
}
```

- [ ] **Step 3: Verificar**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

---

## Task 4: Sub-componentes do token (TokenBase, TokenRing, StatPopups)

**Files:**
- Create: `components/combat/grid/TokenBase.tsx`
- Create: `components/combat/grid/TokenRing.tsx`
- Create: `components/combat/grid/StatPopups.tsx`

- [ ] **Step 1: Criar components/combat/grid/TokenBase.tsx**

```tsx
import React from 'react';

interface TokenBaseProps {
  teamColor: string;
}

const TokenBase: React.FC<TokenBaseProps> = ({ teamColor }) => (
  <div style={{
    position: 'absolute',
    bottom: -6,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    height: 10,
    borderRadius: '50%',
    background: teamColor,
    filter: 'blur(5px)',
    opacity: 0.38,
    pointerEvents: 'none',
  }} />
);

export default TokenBase;
```

- [ ] **Step 2: Criar components/combat/grid/TokenRing.tsx**

```tsx
import React from 'react';

interface TokenRingProps {
  isCurrent: boolean;
  isSelected: boolean;
  teamColor: string;
  formaColor?: string | null;
  unionColor?: string | null;
  isUnionSelected: boolean;
  isAreaSelected: boolean;
  unionMode: boolean;
}

const TokenRing: React.FC<TokenRingProps> = ({
  isCurrent, isSelected, teamColor, formaColor,
  unionColor, isUnionSelected, isAreaSelected, unionMode,
}) => (
  <>
    {isCurrent && (
      <div style={{
        position: 'absolute', inset: -10, borderRadius: '50%',
        border: `2px solid ${teamColor}`,
        boxShadow: `0 0 18px ${teamColor}88`,
        animation: 'turn-pulse 2.2s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    )}
    {isSelected && !isCurrent && (
      <div style={{
        position: 'absolute', inset: -6, borderRadius: '50%',
        border: '2px solid rgba(52,211,153,0.8)',
        boxShadow: '0 0 14px rgba(52,211,153,0.45)',
        animation: 'turn-pulse 1.8s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    )}
    {formaColor && (
      <div style={{
        position: 'absolute', inset: -12, borderRadius: '50%',
        border: `2px solid ${formaColor}`,
        boxShadow: `0 0 20px ${formaColor}88, 0 0 40px ${formaColor}22`,
        animation: 'forma-combatant-pulse 2s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    )}
    {unionColor && (
      <div style={{
        position: 'absolute',
        inset: isUnionSelected ? -12 : -8,
        borderRadius: '50%',
        border: `2px solid ${unionColor}`,
        boxShadow: `0 0 10px ${unionColor}88`,
        animation: 'turn-pulse 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    )}
    {unionMode && (
      <div style={{
        position: 'absolute', inset: -9, borderRadius: '50%',
        border: `2px dashed ${isUnionSelected ? '#a855f7' : 'rgba(168,85,247,0.3)'}`,
        boxShadow: isUnionSelected ? '0 0 16px rgba(168,85,247,0.6)' : 'none',
        pointerEvents: 'none',
      }} />
    )}
    {isAreaSelected && (
      <div style={{
        position: 'absolute', inset: -10, borderRadius: '50%',
        border: '2.5px solid #fb923c',
        boxShadow: '0 0 20px rgba(234,88,12,0.8)',
        animation: 'turn-pulse 1.4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    )}
  </>
);

export default TokenRing;
```

- [ ] **Step 3: Criar components/combat/grid/StatPopups.tsx**

```tsx
import React from 'react';
import { StatPopup } from '../../types';

interface StatPopupsProps {
  popups: StatPopup[];
}

const StatPopups: React.FC<StatPopupsProps> = ({ popups }) => (
  <>
    {popups.map((popup, pi) => {
      const isDmg = popup.type === 'hp' && popup.delta < 0;
      const isHeal = popup.type === 'hp' && popup.delta > 0;
      const color = popup.type === 'hp'
        ? (popup.delta < 0 ? '#f87171' : '#4ade80')
        : popup.type === 'aura'
        ? (popup.delta < 0 ? '#fbbf24' : '#a78bfa')
        : (popup.delta < 0 ? '#fb923c' : '#67e8f9');
      const anim = isDmg ? 'statPopup-dmg 1.9s ease forwards'
        : isHeal ? 'statPopup-heal 1.9s ease forwards'
        : 'statPopup 1.8s ease forwards';
      const fsize = isDmg ? 17 : isHeal ? 15 : 13;
      const glow = isDmg
        ? '0 0 12px rgba(239,68,68,0.8),0 2px 8px rgba(0,0,0,1)'
        : isHeal
        ? '0 0 10px rgba(74,222,128,0.7),0 2px 8px rgba(0,0,0,1)'
        : '0 2px 8px rgba(0,0,0,1)';
      return (
        <div key={popup.id} style={{
          position: 'absolute',
          top: -28 - pi * 8,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'JetBrains Mono',monospace",
          fontWeight: isDmg ? 900 : 700,
          fontStyle: isDmg ? 'italic' : 'normal',
          fontSize: fsize,
          color,
          textShadow: glow,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          animation: anim,
          zIndex: 99 + pi,
          letterSpacing: isDmg ? '-0.02em' : '0',
        }}>
          {popup.delta > 0 ? '+' : ''}{popup.delta}
          {popup.type === 'hp' ? '♥' : popup.type === 'aura' ? '⚡' : '🎯'}
        </div>
      );
    })}
  </>
);

export default StatPopups;
```

- [ ] **Step 4: Verificar**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

---

## Task 5: ConditionBadges

**Files:**
- Create: `components/combat/grid/ConditionBadges.tsx`

- [ ] **Step 1: Criar components/combat/grid/ConditionBadges.tsx**

```tsx
import React, { useState } from 'react';
import { Condition } from '../../types';
import { getConditionIcon } from './conditionIconMap';

interface ConditionBadgesProps {
  conditions: Condition[];
}

const ConditionBadges: React.FC<ConditionBadgesProps> = ({ conditions }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (!conditions.length) return null;
  const visible = conditions.slice(0, 4);
  const overflow = conditions.length - 4;

  return (
    <div style={{
      position: 'absolute',
      bottom: -24,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 2,
      alignItems: 'center',
      pointerEvents: 'auto',
      zIndex: 5,
    }}>
      {visible.map((cond, i) => {
        const Icon = getConditionIcon(cond.name);
        return (
          <div
            key={i}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: 'rgba(12,16,32,0.94)',
              border: '1px solid rgba(212,168,83,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'default',
            }}>
              <Icon size={8} color="rgba(212,168,83,0.85)" />
            </div>
            {hoveredIdx === i && (
              <div style={{
                position: 'absolute', bottom: 18, left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(8,10,24,0.97)',
                border: '1px solid rgba(212,168,83,0.3)',
                borderRadius: 4,
                padding: '3px 7px',
                whiteSpace: 'nowrap',
                fontSize: 9, fontWeight: 700,
                color: '#e8c878',
                zIndex: 300,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                pointerEvents: 'none',
              }}>
                {cond.name}{cond.duration > 0 ? ` (${cond.duration})` : ''}
              </div>
            )}
          </div>
        );
      })}
      {overflow > 0 && (
        <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(212,168,83,0.6)' }}>
          +{overflow}
        </div>
      )}
    </div>
  );
};

export default ConditionBadges;
```

- [ ] **Step 2: Verificar**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

---

## Task 6: CombatToken

**Files:**
- Create: `components/combat/grid/CombatToken.tsx`

- [ ] **Step 1: Criar components/combat/grid/CombatToken.tsx**

```tsx
import React from 'react';
import { Skull } from 'lucide-react';
import {
  Combatant, ActiveForma, CombatantUnion,
  StatPopup, GridInteractionMode,
} from '../../types';
import TokenBase from './TokenBase';
import TokenRing from './TokenRing';
import ConditionBadges from './ConditionBadges';
import StatPopups from './StatPopups';

interface CombatTokenProps {
  combatant: Combatant;
  isCurrent: boolean;
  isSelected: boolean;
  isDragSource: boolean;
  isImpacted: boolean;
  activeForma?: ActiveForma;
  union?: CombatantUnion;
  isUnionSelected: boolean;
  isAreaSelected: boolean;
  statPopups: StatPopup[];
  mode: 'master' | 'readOnly';
  interactionMode: GridInteractionMode;
  unionMode: boolean;
  displayPos: { x: number; y: number };
  onPointerDown?: (e: React.PointerEvent, combatId: string) => void;
  onClick?: (combatId: string) => void;
}

const CombatToken: React.FC<CombatTokenProps> = ({
  combatant: c,
  isCurrent, isSelected, isDragSource, isImpacted,
  activeForma, union, isUnionSelected, isAreaSelected,
  statPopups, mode, interactionMode, unionMode,
  displayPos, onPointerDown, onClick,
}) => {
  const isDefeated = c.currentHp <= 0;
  const teamColor = c.role === 'npc' ? '#dc2626' : '#c9983a';
  const formaColor = activeForma?.color ?? null;
  const hpPct = c.maxHp > 0 ? (c.currentHp / c.maxHp) * 100 : 0;

  const borderColor = isCurrent
    ? teamColor
    : formaColor
    ? formaColor
    : isAreaSelected
    ? '#fb923c'
    : isSelected
    ? 'rgba(52,211,153,0.8)'
    : 'rgba(255,255,255,0.12)';

  const boxShadow = isCurrent
    ? `0 0 24px ${teamColor}cc, 0 0 8px ${teamColor}66`
    : formaColor
    ? `0 0 20px ${formaColor}88`
    : isAreaSelected
    ? '0 0 20px rgba(234,88,12,0.7)'
    : isSelected
    ? '0 0 16px rgba(52,211,153,0.5)'
    : '0 4px 16px rgba(0,0,0,0.9)';

  const cursor = mode === 'readOnly'
    ? 'default'
    : interactionMode.type !== 'select'
    ? 'crosshair'
    : 'grab';

  const scale = isCurrent ? 1.22 : isSelected ? 1.1 : 1;
  const displayIcon = activeForma?.iconOverride || c.icon;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${displayPos.x}%`,
        top: `${displayPos.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isCurrent ? 22 : isSelected ? 21 : 20,
        opacity: isDragSource ? 0.2 : 1,
        cursor,
        userSelect: 'none',
        touchAction: 'none',
        transition: isDragSource
          ? 'none'
          : 'left 0.38s cubic-bezier(0.22,1,0.36,1), top 0.38s cubic-bezier(0.22,1,0.36,1)',
      }}
      className={isImpacted ? 'animate-impact' : ''}
      data-combat-token={c.combatId}
      onPointerDown={
        mode === 'master' && interactionMode.type === 'select'
          ? (e) => onPointerDown?.(e, c.combatId)
          : undefined
      }
      onClick={() => onClick?.(c.combatId)}
    >
      <div style={{
        position: 'relative',
        transform: `scale(${scale})`,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <TokenBase teamColor={teamColor} />
        <TokenRing
          isCurrent={isCurrent}
          isSelected={isSelected}
          teamColor={teamColor}
          formaColor={formaColor}
          unionColor={union?.color ?? null}
          isUnionSelected={isUnionSelected}
          isAreaSelected={isAreaSelected}
          unionMode={unionMode}
        />

        {/* Retrato */}
        <div style={{
          width: 'min(8vw,52px)', height: 'min(8vw,52px)',
          borderRadius: '50%', overflow: 'hidden',
          border: `${isCurrent ? 3 : 2}px solid ${borderColor}`,
          boxShadow,
          background: 'var(--bg-base)',
          filter: isDefeated
            ? 'grayscale(1) brightness(0.35)'
            : isDragSource
            ? 'brightness(0.4)'
            : 'none',
          transition: 'border 0.3s, box-shadow 0.3s, filter 0.2s',
          position: 'relative',
        }}>
          <img
            src={displayIcon || undefined}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            draggable={false}
          />
          {isDefeated && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.65)',
            }}>
              <Skull style={{ width: '32%', height: '32%', color: 'rgba(248,113,113,0.85)' }} />
            </div>
          )}
        </div>

        {/* Barra HP */}
        <div style={{
          position: 'absolute', bottom: -5, left: '8%', right: '8%',
          height: 3, background: 'rgba(0,0,0,0.8)',
          borderRadius: 99, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${Math.max(0, hpPct)}%`,
            background: hpPct <= 30 ? '#ef4444' : hpPct <= 60 ? '#eab308' : '#22c55e',
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Nome */}
        <div style={{
          position: 'absolute', bottom: -18, left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap', fontSize: 8, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: isDefeated
            ? '#f87171'
            : isCurrent
            ? '#e8c878'
            : isSelected
            ? '#34d399'
            : 'rgba(255,255,255,0.4)',
          textShadow: '0 1px 5px rgba(0,0,0,1)',
          pointerEvents: 'none',
          animation: isDefeated ? 'defeated-pulse 1.4s ease-in-out infinite' : 'none',
        }}>
          {isDefeated ? 'DERROTADO' : c.name.split(' ')[0]}
        </div>

        <ConditionBadges conditions={c.conditions} />
        <StatPopups popups={statPopups} />

        {isImpacted && <div className="impact-shockwave" />}
      </div>
    </div>
  );
};

export default CombatToken;
```

- [ ] **Step 2: Verificar**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

---

## Task 7: GridSVGLayer

**Files:**
- Create: `components/combat/grid/GridSVGLayer.tsx`

O SVG usa `viewBox="0 0 100 100" preserveAspectRatio="none"` — 1 unidade SVG = 1% de arena. Para círculos visualmente redondos, usa `<ellipse>` com `ry` corrigido pelo aspect ratio.

- [ ] **Step 1: Criar components/combat/grid/GridSVGLayer.tsx**

```tsx
import React from 'react';
import { CombatState, AoETemplate } from '../../types';
import { conePathD, linePathD, correctedDist } from './aoeHelpers';

interface DragState {
  combatId: string;
  startPos: { x: number; y: number };
  currentDelta: { x: number; y: number };
  deslocamento: number;
}

interface RulerLine {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

interface AoEPreview {
  shape: AoETemplate['shape'];
  color: string;
  x: number; y: number;
  radius?: number;
  angle?: number; arc?: number; length?: number; width?: number;
}

interface GridSVGLayerProps {
  combat: CombatState;
  arenaDims: { w: number; h: number };
  // Drag (movement range)
  dragState: DragState | null;
  // Rulers
  rulers: RulerLine[];
  rulerDraft: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
  // AoE
  aoePreview: AoEPreview | null;
  // Fog (master sees grey overlay; players see opaque mask)
  showFog: boolean;         // false = master sees all (no mask, only overlay)
  fogMaskOpaque: boolean;   // true = player mode, full mask
  // Pointer events for interactive tools
  onSvgPointerDown?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onSvgPointerMove?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onSvgPointerUp?: (e: React.PointerEvent<SVGSVGElement>) => void;
  // AoE drag handles
  onAoEDrag?: (id: string, newX: number, newY: number) => void;
}

function svgPoint(e: React.PointerEvent<SVGSVGElement>, svg: SVGSVGElement) {
  const rect = svg.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100,
  };
}

const GridSVGLayer: React.FC<GridSVGLayerProps> = ({
  combat, arenaDims,
  dragState, rulers, rulerDraft,
  aoePreview, showFog, fogMaskOpaque,
  onSvgPointerDown, onSvgPointerMove, onSvgPointerUp,
}) => {
  const ar = arenaDims.h > 0 ? arenaDims.w / arenaDims.h : 1; // aspect ratio w/h

  // ── Movement range ──────────────────────────────────────────
  const rangeEl = (() => {
    if (!dragState) return null;
    const rangeR = dragState.deslocamento * (combat.escala ?? 10);
    const dist = correctedDist(
      { x: 0, y: 0 },
      dragState.currentDelta,
      ar,
    );
    const frac = rangeR > 0 ? dist / rangeR : 0;
    const stroke = frac > 1 ? '#ef4444' : frac > 0.8 ? '#f59e0b' : '#22c55e';
    const origin = dragState.startPos;
    return (
      <g>
        {/* Range ellipse (visually circular on non-square arenas) */}
        <ellipse
          cx={origin.x} cy={origin.y}
          rx={rangeR} ry={rangeR * ar}
          fill={`${stroke}11`}
          stroke={stroke}
          strokeWidth={0.5}
          strokeDasharray="2 1"
          opacity={0.9}
        />
        {/* Line from origin to current drag position */}
        <line
          x1={origin.x} y1={origin.y}
          x2={origin.x + dragState.currentDelta.x}
          y2={origin.y + dragState.currentDelta.y}
          stroke={stroke} strokeWidth={0.4}
          strokeDasharray="1.5 1"
          opacity={0.8}
        />
        {/* Distance badge */}
        <text
          x={origin.x + dragState.currentDelta.x / 2}
          y={origin.y + dragState.currentDelta.y / 2 - 2}
          textAnchor="middle"
          fontSize={2.5}
          fill={stroke}
          fontWeight="bold"
          style={{ fontFamily: 'monospace', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }}
        >
          {dist.toFixed(1)}u
        </text>
      </g>
    );
  })();

  // ── Grid lines ───────────────────────────────────────────────
  const gridEl = (() => {
    if (!combat.gridVisible) return null;
    const n = combat.gridDensity || 10;
    const lines: React.ReactNode[] = [];
    for (let i = 1; i < n; i++) {
      const v = (i / n) * 100;
      lines.push(
        <line key={`v${i}`} x1={v} y1={0} x2={v} y2={100}
          stroke="rgba(212,168,83,0.07)" strokeWidth={0.15} />,
        <line key={`h${i}`} x1={0} y1={v} x2={100} y2={v}
          stroke="rgba(212,168,83,0.07)" strokeWidth={0.15} />,
      );
    }
    return <g>{lines}</g>;
  })();

  // ── AoE templates (persisted) ────────────────────────────────
  const aoeEl = (
    <g>
      {(combat.aoeTemplates || []).map(t => {
        const fill = t.color;
        const stroke = t.color.replace(/[0-9a-f]{2}$/i, 'cc');
        if (t.shape === 'circle' && t.radius != null) {
          return (
            <ellipse key={t.id} cx={t.x} cy={t.y}
              rx={t.radius} ry={t.radius * ar}
              fill={fill} stroke={stroke} strokeWidth={0.4} />
          );
        }
        if (t.shape === 'cone' && t.angle != null && t.arc != null && t.length != null) {
          return (
            <path key={t.id}
              d={conePathD(t.x, t.y, t.angle, t.arc, t.length)}
              fill={fill} stroke={stroke} strokeWidth={0.4} />
          );
        }
        if (t.shape === 'line' && t.angle != null && t.length != null && t.width != null) {
          return (
            <path key={t.id}
              d={linePathD(t.x, t.y, t.angle, t.length, t.width)}
              fill={fill} stroke={stroke} strokeWidth={0.4} />
          );
        }
        return null;
      })}
      {/* AoE preview while placing */}
      {aoePreview && (() => {
        const t = aoePreview;
        const fill = t.color;
        if (t.shape === 'circle' && t.radius != null) {
          return <ellipse cx={t.x} cy={t.y} rx={t.radius} ry={t.radius * ar}
            fill={fill} stroke="white" strokeWidth={0.3} strokeDasharray="1.5 1" />;
        }
        if (t.shape === 'cone' && t.angle != null && t.arc != null && t.length != null) {
          return <path d={conePathD(t.x, t.y, t.angle, t.arc, t.length)}
            fill={fill} stroke="white" strokeWidth={0.3} strokeDasharray="1.5 1" />;
        }
        if (t.shape === 'line' && t.angle != null && t.length != null && t.width != null) {
          return <path d={linePathD(t.x, t.y, t.angle, t.length, t.width)}
            fill={fill} stroke="white" strokeWidth={0.3} strokeDasharray="1.5 1" />;
        }
        return null;
      })()}
    </g>
  );

  // ── Rulers ───────────────────────────────────────────────────
  const rulersEl = (
    <g>
      {rulers.map(r => {
        const dist = correctedDist(r.start, r.end, ar);
        const mx = (r.start.x + r.end.x) / 2;
        const my = (r.start.y + r.end.y) / 2;
        return (
          <g key={r.id}>
            <line x1={r.start.x} y1={r.start.y} x2={r.end.x} y2={r.end.y}
              stroke="#67e8f9" strokeWidth={0.5} strokeDasharray="1.5 0.8" />
            <circle cx={r.start.x} cy={r.start.y} r={0.8} fill="#67e8f9" />
            <circle cx={r.end.x} cy={r.end.y} r={0.8} fill="#67e8f9" />
            <text x={mx} y={my - 2} textAnchor="middle" fontSize={2.5}
              fill="#67e8f9" fontWeight="bold"
              style={{ fontFamily: 'monospace', filter: 'drop-shadow(0 0 2px rgba(0,0,0,1))' }}>
              {dist.toFixed(1)}u
            </text>
          </g>
        );
      })}
      {rulerDraft && (() => {
        const dist = correctedDist(rulerDraft.start, rulerDraft.end, ar);
        const mx = (rulerDraft.start.x + rulerDraft.end.x) / 2;
        const my = (rulerDraft.start.y + rulerDraft.end.y) / 2;
        return (
          <g>
            <line x1={rulerDraft.start.x} y1={rulerDraft.start.y}
              x2={rulerDraft.end.x} y2={rulerDraft.end.y}
              stroke="#67e8f9" strokeWidth={0.5} strokeDasharray="1 0.5" opacity={0.7} />
            <circle cx={rulerDraft.start.x} cy={rulerDraft.start.y} r={0.8} fill="#67e8f9" />
            <text x={mx} y={my - 2} textAnchor="middle" fontSize={2.5}
              fill="#67e8f9" fontWeight="bold"
              style={{ fontFamily: 'monospace', filter: 'drop-shadow(0 0 2px rgba(0,0,0,1))' }}>
              {dist.toFixed(1)}u
            </text>
          </g>
        );
      })()}
    </g>
  );

  // ── Fog mask ─────────────────────────────────────────────────
  const fogEl = (() => {
    const fog = combat.fog;
    if (!fog || !showFog) return null;
    const n = fog.density;
    const cw = 100 / n;
    const ch = 100 / n;

    if (fogMaskOpaque) {
      // Player mode: SVG mask blocks unrevealed areas
      return (
        <g>
          <defs>
            <mask id="fog-mask">
              <rect width="100" height="100" fill="white" />
              {fog.revealed.map((row, r) =>
                row.map((rev, c) =>
                  rev ? (
                    <rect key={`${r}-${c}`}
                      x={c * cw} y={r * ch} width={cw} height={ch}
                      fill="black" />
                  ) : null,
                ),
              )}
            </mask>
          </defs>
          <rect width="100" height="100" fill="rgba(0,0,0,0.92)" mask="url(#fog-mask)" />
        </g>
      );
    }

    // Master mode: semi-transparent overlay on unrevealed cells
    return (
      <g opacity={0.55}>
        {fog.revealed.map((row, r) =>
          row.map((rev, c) =>
            !rev ? (
              <rect key={`${r}-${c}`}
                x={c * cw} y={r * ch} width={cw} height={ch}
                fill="rgba(0,0,20,0.7)" />
            ) : null,
          ),
        )}
      </g>
    );
  })();

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: onSvgPointerDown ? 'auto' : 'none',
        zIndex: 10,
        overflow: 'visible',
      }}
      onPointerDown={onSvgPointerDown}
      onPointerMove={onSvgPointerMove}
      onPointerUp={onSvgPointerUp}
    >
      {gridEl}
      {aoeEl}
      {fogEl}
      {rangeEl}
      {rulersEl}
    </svg>
  );
};

export { svgPoint };
export default GridSVGLayer;
```

- [ ] **Step 2: Verificar**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

---

## Task 8: FogRevealOverlay e ArenaToolbar

**Files:**
- Create: `components/combat/grid/FogRevealOverlay.tsx`
- Create: `components/combat/grid/ArenaToolbar.tsx`

- [ ] **Step 1: Criar components/combat/grid/FogRevealOverlay.tsx**

```tsx
import React, { useCallback } from 'react';
import { FogState, ToolbarMode } from '../../types';

interface FogRevealOverlayProps {
  fog: FogState;
  toolbarMode: ToolbarMode;
  onFogChange: (fog: FogState) => void;
}

function toggleCell(fog: FogState, row: number, col: number, reveal: boolean): FogState {
  const next = fog.revealed.map(r => [...r]);
  if (next[row]?.[col] !== undefined) next[row][col] = reveal;
  return { ...fog, revealed: next };
}

const FogRevealOverlay: React.FC<FogRevealOverlayProps> = ({
  fog, toolbarMode, onFogChange,
}) => {
  const isActive = toolbarMode === 'fog-reveal' || toolbarMode === 'fog-hide';
  if (!isActive) return null;

  const reveal = toolbarMode === 'fog-reveal';
  const n = fog.density;

  const handleCell = useCallback((r: number, c: number) => {
    onFogChange(toggleCell(fog, r, c, reveal));
  }, [fog, reveal, onFogChange]);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'grid',
      gridTemplateColumns: `repeat(${n}, 1fr)`,
      gridTemplateRows: `repeat(${n}, 1fr)`,
      cursor: reveal ? 'cell' : 'not-allowed',
    }}>
      {Array.from({ length: n * n }).map((_, i) => {
        const row = Math.floor(i / n);
        const col = i % n;
        return (
          <div
            key={i}
            onPointerEnter={(e) => { if (e.buttons === 1) handleCell(row, col); }}
            onPointerDown={() => handleCell(row, col)}
            style={{
              border: '0.5px solid rgba(255,255,255,0.04)',
              background: fog.revealed[row]?.[col]
                ? (reveal ? 'rgba(52,211,153,0.08)' : 'rgba(52,211,153,0.04)')
                : (reveal ? 'transparent' : 'rgba(239,68,68,0.06)'),
            }}
          />
        );
      })}
    </div>
  );
};

export default FogRevealOverlay;
```

- [ ] **Step 2: Criar components/combat/grid/ArenaToolbar.tsx**

```tsx
import React from 'react';
import {
  Maximize2, Minimize2, Image, Grid3X3, Ruler, Circle,
  Triangle, Minus, Eye, EyeOff, RefreshCcw,
} from 'lucide-react';
import { ToolbarMode } from '../../types';

interface ArenaToolbarProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  toolbarMode: ToolbarMode;
  onSetMode: (mode: ToolbarMode) => void;
  backgroundImage: string;
  onSetBackground: (url: string) => void;
  fogEnabled: boolean;
  onToggleFog: () => void;
  onRevealAll: () => void;
  onHideAll: () => void;
  onOpenPlayerWindow: () => void;
}

const btn = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '5px 9px', borderRadius: 6, cursor: 'pointer',
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase',
  background: active ? 'rgba(201,152,58,0.2)' : 'rgba(8,10,20,0.85)',
  border: `1px solid ${active ? 'rgba(201,152,58,0.6)' : 'rgba(255,255,255,0.08)'}`,
  color: active ? '#e8c878' : 'rgba(255,255,255,0.55)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.7)',
  transition: 'all 0.15s',
});

const ArenaToolbar: React.FC<ArenaToolbarProps> = ({
  isFullscreen, onToggleFullscreen,
  gridVisible, onToggleGrid,
  toolbarMode, onSetMode,
  backgroundImage, onSetBackground,
  fogEnabled, onToggleFog, onRevealAll, onHideAll,
  onOpenPlayerWindow,
}) => {
  const toggle = (mode: ToolbarMode) =>
    onSetMode(toolbarMode === mode ? 'none' : mode);

  return (
    <>
      {/* Top-left */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 80, display: 'flex', gap: 6 }}>
        <button style={btn(false)} onClick={onOpenPlayerWindow}>
          <Eye size={11} /> Jogadores
        </button>
        <button style={btn(isFullscreen)} onClick={onToggleFullscreen}>
          {isFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          {isFullscreen ? 'Sair' : 'Full'}
        </button>
      </div>

      {/* Top-right */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 80, display: 'flex', gap: 6 }}>
        <button style={btn(gridVisible)} onClick={onToggleGrid}>
          <Grid3X3 size={11} />
        </button>
        <button
          style={btn(false)}
          title="Cenário (URL)"
          onClick={() => {
            const url = prompt('URL da imagem de cenário:', backgroundImage);
            if (url !== null) onSetBackground(url);
          }}
        >
          <Image size={11} />
        </button>
        <button style={btn(toolbarMode === 'ruler')} onClick={() => toggle('ruler')}>
          <Ruler size={11} /> Régua
        </button>
        <button style={btn(toolbarMode === 'aoe-circle')} onClick={() => toggle('aoe-circle')}>
          <Circle size={11} />
        </button>
        <button style={btn(toolbarMode === 'aoe-cone')} onClick={() => toggle('aoe-cone')}>
          <Triangle size={11} />
        </button>
        <button style={btn(toolbarMode === 'aoe-line')} onClick={() => toggle('aoe-line')}>
          <Minus size={11} />
        </button>
      </div>

      {/* Fog controls — bottom-right */}
      <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 80, display: 'flex', gap: 6, alignItems: 'center' }}>
        <button style={btn(fogEnabled)} onClick={onToggleFog}>
          {fogEnabled ? <EyeOff size={11} /> : <Eye size={11} />} Névoa
        </button>
        {fogEnabled && (
          <>
            <button style={btn(toolbarMode === 'fog-reveal')} onClick={() => toggle('fog-reveal')}>
              Revelar
            </button>
            <button style={btn(toolbarMode === 'fog-hide')} onClick={() => toggle('fog-hide')}>
              Ocultar
            </button>
            <button style={btn(false)} onClick={onRevealAll} title="Revelar tudo">
              <RefreshCcw size={11} />+
            </button>
            <button style={btn(false)} onClick={onHideAll} title="Ocultar tudo">
              <RefreshCcw size={11} />−
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default ArenaToolbar;
```

- [ ] **Step 3: Verificar**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

---

## Task 9: CombatArena

**Files:**
- Create: `components/combat/grid/CombatArena.tsx`

Este é o componente raiz da grid. Gerencia todo o state de UI local (drag, toolbar, réguas, AoE preview) e recebe lógica de domínio via props/callbacks do `App.tsx`.

- [ ] **Step 1: Criar components/combat/grid/CombatArena.tsx**

```tsx
import React, {
  useRef, useState, useCallback, useEffect,
} from 'react';
import {
  CombatState, Combatant, ActiveForma, CombatantUnion,
  StatPopup, GridInteractionMode, ToolbarMode, AoETemplate, FogState,
} from '../../types';
import CombatToken from './CombatToken';
import GridSVGLayer, { svgPoint } from './GridSVGLayer';
import FogRevealOverlay from './FogRevealOverlay';
import ArenaToolbar from './ArenaToolbar';
import { correctedDist } from './aoeHelpers';

// ── Helper ───────────────────────────────────────────────────
function clampPos(p: { x: number; y: number }): { x: number; y: number } {
  return { x: Math.max(0, Math.min(100, p.x)), y: Math.max(0, Math.min(100, p.y)) };
}

function makeFog(density: number): FogState {
  return {
    density,
    revealed: Array.from({ length: density }, () => Array(density).fill(false) as boolean[]),
  };
}

// ── Props ────────────────────────────────────────────────────
interface CombatArenaProps {
  combat: CombatState;
  activeForms: ActiveForma[];
  mode: 'master' | 'readOnly';

  // Selection / targeting state (from App.tsx)
  selectedCombatantId?: string | null;
  interactionMode?: GridInteractionMode;
  areaSelectedTargets?: string[];
  statPopups?: StatPopup[];
  impactTargetId?: string | null;
  unionMode?: boolean;
  unionSelecting?: string[];

  // Callbacks (master only)
  onUpdateCombat?: (combat: CombatState) => void;
  onSelectCombatant?: (id: string | null) => void;
  onTargetCombatant?: (combatId: string) => void;
  onToggleAreaTarget?: (combatId: string) => void;
  onItemTargetCombatant?: (combatId: string) => void;
  onToggleUnionSelect?: (combatId: string) => void;
}

// ── Component ────────────────────────────────────────────────
const CombatArena: React.FC<CombatArenaProps> = ({
  combat, activeForms, mode,
  selectedCombatantId, interactionMode = { type: 'select' },
  areaSelectedTargets = [], statPopups = [], impactTargetId,
  unionMode = false, unionSelecting = [],
  onUpdateCombat, onSelectCombatant,
  onTargetCombatant, onToggleAreaTarget,
  onItemTargetCombatant, onToggleUnionSelect,
}) => {
  const arenaRef = useRef<HTMLDivElement>(null);
  const [arenaDims, setArenaDims] = useState({ w: 1000, h: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Drag state ───────────────────────────────────────────────
  const [dragState, setDragState] = useState<{
    combatId: string;
    startPos: { x: number; y: number };
    currentDelta: { x: number; y: number };
    deslocamento: number;
  } | null>(null);

  // ── Toolbar & tools ──────────────────────────────────────────
  const [toolbarMode, setToolbarMode] = useState<ToolbarMode>('none');
  const [fogEnabled, setFogEnabled] = useState(false);

  // ── Rulers ───────────────────────────────────────────────────
  const [rulers, setRulers] = useState<{ id: string; start: { x: number; y: number }; end: { x: number; y: number } }[]>([]);
  const [rulerDraft, setRulerDraft] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);

  // ── AoE preview ──────────────────────────────────────────────
  const [aoeAnchor, setAoeAnchor] = useState<{ x: number; y: number } | null>(null);
  const [aoeCursor, setAoeCursor] = useState<{ x: number; y: number } | null>(null);

  // ── ResizeObserver to track arena dimensions ─────────────────
  useEffect(() => {
    if (!arenaRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setArenaDims({ w: width, h: height });
    });
    ro.observe(arenaRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Fullscreen escape ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Fog helpers ──────────────────────────────────────────────
  const fog = combat.fog;
  const ensureFog = useCallback((): FogState =>
    fog ?? makeFog(20), [fog]);

  const revealAll = useCallback(() => {
    const f = ensureFog();
    onUpdateCombat?.({ ...combat, fog: { ...f, revealed: f.revealed.map(r => r.map(() => true)) } });
  }, [combat, ensureFog, onUpdateCombat]);

  const hideAll = useCallback(() => {
    const f = ensureFog();
    onUpdateCombat?.({ ...combat, fog: { ...f, revealed: f.revealed.map(r => r.map(() => false)) } });
  }, [combat, ensureFog, onUpdateCombat]);

  const toggleFog = useCallback(() => {
    if (!fogEnabled) {
      // Enable fog: ensure fog state exists
      if (!combat.fog) {
        onUpdateCombat?.({ ...combat, fog: makeFog(20) });
      }
    }
    setFogEnabled(v => !v);
    if (toolbarMode === 'fog-reveal' || toolbarMode === 'fog-hide') setToolbarMode('none');
  }, [fogEnabled, combat, onUpdateCombat, toolbarMode]);

  // ── Token click handler ──────────────────────────────────────
  const handleTokenClick = useCallback((combatId: string) => {
    if (mode === 'readOnly') return;
    if (interactionMode.type === 'target-single') {
      onTargetCombatant?.(combatId);
    } else if (interactionMode.type === 'target-area') {
      onToggleAreaTarget?.(combatId);
    } else if (interactionMode.type === 'item-target') {
      onItemTargetCombatant?.(combatId);
    } else if (interactionMode.type === 'union') {
      onToggleUnionSelect?.(combatId);
    } else {
      onSelectCombatant?.(selectedCombatantId === combatId ? null : combatId);
    }
  }, [mode, interactionMode, selectedCombatantId,
    onTargetCombatant, onToggleAreaTarget, onItemTargetCombatant,
    onToggleUnionSelect, onSelectCombatant]);

  // ── Drag handlers ────────────────────────────────────────────
  const handleTokenPointerDown = useCallback((e: React.PointerEvent, combatId: string) => {
    if (mode === 'readOnly' || interactionMode.type !== 'select') return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const combatant = combat.combatants.find(c => c.combatId === combatId);
    if (!combatant) return;
    setDragState({
      combatId,
      startPos: { ...combatant.pos },
      currentDelta: { x: 0, y: 0 },
      deslocamento: combatant.deslocamento ?? 6,
    });
  }, [mode, interactionMode, combat.combatants]);

  const handleArenaPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const dx = (e.movementX / rect.width) * 100;
    const dy = (e.movementY / rect.height) * 100;

    if (dragState) {
      setDragState(prev => prev ? {
        ...prev,
        currentDelta: { x: prev.currentDelta.x + dx, y: prev.currentDelta.y + dy },
      } : null);
    }
  }, [dragState]);

  const handleArenaPointerUp = useCallback(() => {
    if (!dragState) return;
    const newPos = clampPos({
      x: dragState.startPos.x + dragState.currentDelta.x,
      y: dragState.startPos.y + dragState.currentDelta.y,
    });

    const unions = combat.unions || [];
    const memberUnion = unions.find(u => u.combatantIds[0] === dragState.combatId);

    const newCombatants = combat.combatants.map(c => {
      if (c.combatId === dragState.combatId) return { ...c, pos: newPos };
      if (memberUnion?.combatantIds.includes(c.combatId)) {
        return { ...c, pos: clampPos({
          x: c.pos.x + dragState.currentDelta.x,
          y: c.pos.y + dragState.currentDelta.y,
        }) };
      }
      return c;
    });

    onUpdateCombat?.({ ...combat, combatants: newCombatants });
    setDragState(null);
  }, [dragState, combat, onUpdateCombat]);

  // ── SVG tool pointer handlers ────────────────────────────────
  const handleSvgPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const pt = svgPoint(e, e.currentTarget);

    if (toolbarMode === 'ruler') {
      setRulerDraft({ start: pt, end: pt });
    } else if (toolbarMode === 'aoe-circle' || toolbarMode === 'aoe-cone' || toolbarMode === 'aoe-line') {
      setAoeAnchor(pt);
      setAoeCursor(pt);
    }
  }, [toolbarMode]);

  const handleSvgPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const pt = svgPoint(e, e.currentTarget);

    if (toolbarMode === 'ruler' && rulerDraft) {
      setRulerDraft(prev => prev ? { ...prev, end: pt } : null);
    } else if (aoeAnchor) {
      setAoeCursor(pt);
    }
  }, [toolbarMode, rulerDraft, aoeAnchor]);

  const handleSvgPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const pt = svgPoint(e, e.currentTarget);

    if (toolbarMode === 'ruler' && rulerDraft) {
      setRulers(prev => [...prev, { id: Math.random().toString(36).slice(2), ...rulerDraft, end: pt }]);
      setRulerDraft(null);
    } else if (toolbarMode === 'aoe-circle' && aoeAnchor) {
      const ar = arenaDims.h > 0 ? arenaDims.w / arenaDims.h : 1;
      const r = correctedDist(aoeAnchor, pt, ar);
      const newT: AoETemplate = {
        id: Math.random().toString(36).slice(2),
        shape: 'circle', color: '#ef444466',
        x: aoeAnchor.x, y: aoeAnchor.y,
        radius: r, visibleToPlayers: true,
      };
      onUpdateCombat?.({ ...combat, aoeTemplates: [...(combat.aoeTemplates || []), newT] });
      setAoeAnchor(null); setAoeCursor(null);
    } else if (toolbarMode === 'aoe-cone' && aoeAnchor) {
      const dx = pt.x - aoeAnchor.x;
      const dy = pt.y - aoeAnchor.y;
      const ar = arenaDims.h > 0 ? arenaDims.w / arenaDims.h : 1;
      const len = correctedDist(aoeAnchor, pt, ar);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const newT: AoETemplate = {
        id: Math.random().toString(36).slice(2),
        shape: 'cone', color: '#f9730066',
        x: aoeAnchor.x, y: aoeAnchor.y,
        angle, arc: 60, length: len, visibleToPlayers: true,
      };
      onUpdateCombat?.({ ...combat, aoeTemplates: [...(combat.aoeTemplates || []), newT] });
      setAoeAnchor(null); setAoeCursor(null);
    } else if (toolbarMode === 'aoe-line' && aoeAnchor) {
      const dx = pt.x - aoeAnchor.x;
      const dy = pt.y - aoeAnchor.y;
      const ar = arenaDims.h > 0 ? arenaDims.w / arenaDims.h : 1;
      const len = correctedDist(aoeAnchor, pt, ar);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const newT: AoETemplate = {
        id: Math.random().toString(36).slice(2),
        shape: 'line', color: '#a855f766',
        x: aoeAnchor.x, y: aoeAnchor.y,
        angle, length: len, width: 5, visibleToPlayers: true,
      };
      onUpdateCombat?.({ ...combat, aoeTemplates: [...(combat.aoeTemplates || []), newT] });
      setAoeAnchor(null); setAoeCursor(null);
    }
  }, [toolbarMode, rulerDraft, aoeAnchor, aoeCursor, arenaDims, combat, onUpdateCombat]);

  // ── AoE preview object ───────────────────────────────────────
  const aoePreview = (() => {
    if (!aoeAnchor || !aoeCursor) return null;
    const ar = arenaDims.h > 0 ? arenaDims.w / arenaDims.h : 1;
    const dx = aoeCursor.x - aoeAnchor.x;
    const dy = aoeCursor.y - aoeAnchor.y;
    const len = correctedDist(aoeAnchor, aoeCursor, ar);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (toolbarMode === 'aoe-circle')
      return { shape: 'circle' as const, color: '#ef444440', x: aoeAnchor.x, y: aoeAnchor.y, radius: len };
    if (toolbarMode === 'aoe-cone')
      return { shape: 'cone' as const, color: '#f9730040', x: aoeAnchor.x, y: aoeAnchor.y, angle, arc: 60, length: len };
    if (toolbarMode === 'aoe-line')
      return { shape: 'line' as const, color: '#a855f740', x: aoeAnchor.x, y: aoeAnchor.y, angle, length: len, width: 5 };
    return null;
  })();

  // ── Derived display positions during drag ────────────────────
  const getDisplayPos = (c: Combatant): { x: number; y: number } => {
    if (!dragState) return c.pos;
    if (dragState.combatId === c.combatId) {
      return clampPos({ x: c.pos.x + dragState.currentDelta.x, y: c.pos.y + dragState.currentDelta.y });
    }
    // Union members follow leader
    const unions = combat.unions || [];
    const memberUnion = unions.find(u => u.combatantIds[0] === dragState.combatId);
    if (memberUnion?.combatantIds.includes(c.combatId)) {
      return clampPos({ x: c.pos.x + dragState.currentDelta.x, y: c.pos.y + dragState.currentDelta.y });
    }
    return c.pos;
  };

  const svgToolActive = ['ruler', 'aoe-circle', 'aoe-cone', 'aoe-line'].includes(toolbarMode);

  return (
    <div
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 9999 : undefined,
        flex: isFullscreen ? undefined : 1,
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '100%',
        background: 'radial-gradient(ellipse at 42% 22%, rgba(38,26,8,0.95) 0%, rgba(4,6,14,0.98) 55%, rgba(2,4,10,1) 100%)',
        overflow: 'hidden',
      }}
      onPointerMove={handleArenaPointerMove}
      onPointerUp={handleArenaPointerUp}
    >
      {/* Atmospheric overlays */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.045, backgroundImage: 'radial-gradient(rgba(201,152,58,1) 1px, transparent 1px)', backgroundSize: '24px 24px', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 0%, rgba(201,152,58,0.09) 0%, transparent 50%)', zIndex: 1 }} />
      <div className="mp-battle-ghost mp-battle-ghost--arena" style={{ zIndex: 1 }}>COMBATE</div>
      <div className="mp-battle-stripes" />
      <div className="mp-battle-vignette" />
      <div className="mp-battle-top-slash" />
      <div className="mp-battle-bottom-fade" />

      {/* Toolbar (master only) */}
      {mode === 'master' && (
        <ArenaToolbar
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(v => !v)}
          gridVisible={combat.gridVisible ?? true}
          onToggleGrid={() => onUpdateCombat?.({ ...combat, gridVisible: !combat.gridVisible })}
          toolbarMode={toolbarMode}
          onSetMode={setToolbarMode}
          backgroundImage={combat.backgroundImage || ''}
          onSetBackground={url => onUpdateCombat?.({ ...combat, backgroundImage: url })}
          fogEnabled={fogEnabled}
          onToggleFog={toggleFog}
          onRevealAll={revealAll}
          onHideAll={hideAll}
          onOpenPlayerWindow={() => window.open('?view=player', 'vat-player', 'popup,width=1280,height=800')}
        />
      )}

      {/* Inner arena */}
      <div
        className="w-full h-full flex items-center justify-center overflow-auto no-scrollbar"
        style={{ padding: 16 }}
      >
        <div
          ref={arenaRef}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundImage: combat.backgroundImage
              ? `url(${combat.backgroundImage})`
              : 'none',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            borderRadius: 16,
            boxShadow: '0 0 0 2px rgba(212,168,83,0.18), 0 0 60px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.03)',
            overflow: 'hidden',
          }}
        >
          {/* Default bg when no image */}
          {!combat.backgroundImage && (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #1e180e 0%, #100e08 100%)', borderRadius: 16 }} />
          )}

          {/* SVG layer (grid, AoE, range, rulers, fog) */}
          <GridSVGLayer
            combat={combat}
            arenaDims={arenaDims}
            dragState={dragState}
            rulers={rulers}
            rulerDraft={rulerDraft}
            aoePreview={aoePreview}
            showFog={fogEnabled && !!fog}
            fogMaskOpaque={mode === 'readOnly'}
            onSvgPointerDown={mode === 'master' && svgToolActive ? handleSvgPointerDown : undefined}
            onSvgPointerMove={mode === 'master' && svgToolActive ? handleSvgPointerMove : undefined}
            onSvgPointerUp={mode === 'master' && svgToolActive ? handleSvgPointerUp : undefined}
          />

          {/* Fog reveal overlay (master pincel) */}
          {mode === 'master' && fogEnabled && fog && (
            <FogRevealOverlay
              fog={fog}
              toolbarMode={toolbarMode}
              onFogChange={newFog => onUpdateCombat?.({ ...combat, fog: newFog })}
            />
          )}

          {/* Tokens */}
          {combat.combatants.map((c, i) => {
            const isCurrent = i === combat.turnIndex && combat.isActive;
            const isSelected = selectedCombatantId === c.combatId;
            const isImpacted = impactTargetId === c.combatId;
            const isDragSource = dragState?.combatId === c.combatId;
            const activeForma = activeForms.find(f => f.combatantId === c.combatId);
            const unions = combat.unions || [];
            const union = unions.find(u => u.combatantIds.includes(c.combatId));
            const isUnionSelected = unionSelecting.includes(c.combatId);
            const isAreaSelected = areaSelectedTargets.includes(c.combatId);
            const myPopups = statPopups.filter(p => p.combatId === c.combatId);

            return (
              <CombatToken
                key={c.combatId}
                combatant={c}
                isCurrent={isCurrent}
                isSelected={isSelected}
                isDragSource={!!isDragSource}
                isImpacted={!!isImpacted}
                activeForma={activeForma}
                union={union}
                isUnionSelected={isUnionSelected}
                isAreaSelected={isAreaSelected}
                statPopups={myPopups}
                mode={mode}
                interactionMode={interactionMode}
                unionMode={unionMode}
                displayPos={getDisplayPos(c)}
                onPointerDown={handleTokenPointerDown}
                onClick={handleTokenClick}
              />
            );
          })}

          {/* Grid size badge */}
          <div style={{
            position: 'absolute', bottom: 6, right: 8, zIndex: 35,
            background: 'rgba(8,10,16,0.7)',
            border: '1px solid rgba(212,168,83,0.12)',
            borderRadius: 6, padding: '2px 7px',
            fontSize: 8, fontWeight: 600,
            color: 'rgba(212,168,83,0.4)',
            fontFamily: "'JetBrains Mono',monospace",
            pointerEvents: 'none',
          }}>
            {(combat.gridDensity ?? 10)}×{(combat.gridDensity ?? 10)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombatArena;
```

- [ ] **Step 2: Verificar**

```bash
npx tsc --noEmit 2>&1 | tail -10
```

---

## Task 10: Integrar CombatArena no App.tsx

**Files:**
- Modify: `App.tsx`
- Modify: `utils/database.ts` (adicionar migration no load)

- [ ] **Step 1: Importar componentes e migration no App.tsx**

Localize o bloco de imports no topo de `App.tsx` e adicione:

```ts
import CombatArena from './components/combat/grid/CombatArena';
import { migrateCombatState } from './utils/combatMigration';
import { StatPopup, GridInteractionMode } from './types';
```

- [ ] **Step 2: Trocar o tipo do state statPopups em App.tsx**

Procure no App.tsx por onde `statPopups` é declarado com `useState`. Deve estar como um array inline. Altere para usar o tipo importado:

```ts
// Encontre algo como:
// const [statPopups, setStatPopups] = useState<{id:string; combatId:string; ...}[]>([]);
// Substitua por:
const [statPopups, setStatPopups] = useState<StatPopup[]>([]);
```

- [ ] **Step 3: Adicionar migration ao carregar combat do banco**

Procure em App.tsx onde `updateCombat` ou o DatabaseService carrega/seta o `combat`. Adicione a chamada de migration ao receber o estado do banco. Procure por `subscribeRemoteCombat` ou o equivalente local em App.tsx:

```ts
// Onde o combat é carregado do database (provavelmente próximo a useEffect + DatabaseService),
// envolva o setter com migration:
DatabaseService.subscribeCombat((raw) => {
  setCombat(migrateCombatState(raw));
});
```

> Se o combat é carregado via uma função diferente (ex: `loadCombat`, `initialState`), aplique `migrateCombatState` nela também.

- [ ] **Step 4: Derivar interactionMode a partir dos states existentes**

No App.tsx, próximo ao bloco de render do combate, adicione esta derivação:

```ts
const gridInteractionMode: GridInteractionMode = itemTargetPickerItem
  ? { type: 'item-target' }
  : selectingTargetFor?.isAreaEffect
  ? { type: 'target-area' }
  : selectingTargetFor
  ? { type: 'target-single' }
  : unionMode
  ? { type: 'union' }
  : { type: 'select' };
```

- [ ] **Step 5: Substituir o bloco de render da grid**

No App.tsx, localize o grande bloco que começa em `{/* ── ÁREA CENTRAL DA GRID ── */}` (aproximadamente L7065). Substitua **todo o conteúdo** do contêiner `flex-1 relative overflow-hidden` (incluindo o `<div>` atmosférico, tokens, pins, toolbar interna) por:

```tsx
<div className="flex-1 relative overflow-hidden">
  <CombatArena
    combat={combat}
    activeForms={combat.activeForms || []}
    mode="master"
    selectedCombatantId={selectedCombatantId}
    interactionMode={gridInteractionMode}
    areaSelectedTargets={areaSelectedTargets}
    statPopups={statPopups}
    impactTargetId={impactTargetId}
    unionMode={unionMode}
    unionSelecting={unionSelecting}
    onUpdateCombat={updateCombat}
    onSelectCombatant={setSelectedCombatantId}
    onTargetCombatant={(combatId) => {
      executeCardOnTarget(selectingTargetFor!, 'other', combatId);
      setSelectingTargetFor(null);
    }}
    onToggleAreaTarget={(combatId) => {
      setAreaSelectedTargets(prev =>
        prev.includes(combatId)
          ? prev.filter(id => id !== combatId)
          : [...prev, combatId],
      );
    }}
    onItemTargetCombatant={(combatId) => {
      const pending = itemTargetPickerItem;
      if (!pending || combatId === pending.actor.combatId) return;
      setItemTargetPickerItem(null);
      handleUseItem(pending.actor, pending.item, combatId);
    }}
    onToggleUnionSelect={(combatId) => {
      setUnionSelecting(prev =>
        prev.includes(combatId)
          ? prev.filter(id => id !== combatId)
          : [...prev, combatId],
      );
    }}
  />
</div>
```

- [ ] **Step 6: Verificar**

```bash
npx tsc --noEmit 2>&1 | tail -10
```

Esperado: erros podem existir nas referências a `gridPos`, `gridDragCombatId` etc. que ainda estão no App.tsx mas não são mais usadas. Não pânico — serão removidos na Task 12.

- [ ] **Step 7: Verificar no browser**

```bash
npm run dev
```

Abrir `http://localhost:5173`, navegar para a aba Combate, verificar:
- Grid renderiza com tokens
- Tokens mostram retratos, barras HP, nomes
- Arrastar tokens funciona (movimento suave)
- Toolbar aparece com botões de fullscreen, grade, régua, AoE, névoa

---

## Task 11: Adicionar deslocamento à ficha do personagem

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Encontrar o form de edição de personagem**

No App.tsx, pesquise por onde `baseInitiative` tem um input (`<input` próximo de `baseInitiative`). Adicione um campo `deslocamento` logo abaixo:

```tsx
{/* Após o campo de baseInitiative: */}
<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
    Deslocamento
  </label>
  <input
    type="number"
    min={0}
    value={editingChar.deslocamento ?? 6}
    onChange={e => setEditingChar(prev => prev
      ? { ...prev, deslocamento: Number(e.target.value) }
      : prev
    )}
    style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)',
      fontSize: 13, width: 80,
    }}
  />
</div>
```

- [ ] **Step 2: Verificar**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

---

## Task 12: Rebuild do PlayerMirror

**Files:**
- Modify: `components/PlayerMirror.tsx`

- [ ] **Step 1: Substituir components/PlayerMirror.tsx**

```tsx
import React, { useEffect, useState } from 'react';
import { DatabaseService } from '../utils/database';
import { CombatState, Combatant } from '../types';
import { migrateCombatState } from '../utils/combatMigration';
import CombatArena from './combat/grid/CombatArena';

function visibleCombatState(combat: CombatState): CombatState {
  const fog = combat.fog;

  const combatants = combat.combatants.filter(c => {
    if (c.isHidden) return false;
    // Hide tokens in unrevealed fog cells
    if (fog) {
      const n = fog.density;
      const col = Math.floor((c.pos.x / 100) * n);
      const row = Math.floor((c.pos.y / 100) * n);
      const safeRow = Math.max(0, Math.min(n - 1, row));
      const safeCol = Math.max(0, Math.min(n - 1, col));
      if (!fog.revealed[safeRow]?.[safeCol]) return false;
    }
    return true;
  });

  const aoeTemplates = (combat.aoeTemplates || []).filter(t => t.visibleToPlayers);

  return { ...combat, combatants, aoeTemplates };
}

const PlayerMirror: React.FC = () => {
  const [combat, setCombat] = useState<CombatState | null>(null);

  useEffect(() => {
    const unsub = DatabaseService.subscribeRemoteCombat((raw) => {
      setCombat(migrateCombatState(raw));
    });
    DatabaseService.requestCombat();
    return unsub;
  }, []);

  if (!combat?.isActive) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)',
        color: 'var(--text-secondary)',
        fontWeight: 700, letterSpacing: '0.2em',
        textTransform: 'uppercase', fontSize: 14,
      }}>
        Aguardando o início do combate…
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <CombatArena
        combat={visibleCombatState(combat)}
        activeForms={combat.activeForms || []}
        mode="readOnly"
        selectedCombatantId={null}
        statPopups={[]}
      />
    </div>
  );
};

export default PlayerMirror;
```

- [ ] **Step 2: Verificar**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

---

## Task 13: Limpeza do App.tsx (state e handlers de grid antigos)

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Remover state vars de grid que não são mais usadas**

Pesquise e remova as seguintes declarações `useState` do App.tsx (cada uma com sua linha `const [x, setX] = useState...`):

- `gridDragCombatId`
- `gridDragOverCell`
- `gridHoverCell`
- `gridSnapPreview`
- `gridMoveHistory`
- `gridFullscreen`
- `showGridCoords`
- `placingPin`
- `bgAspectRatio` (se só usada pela grid)

- [ ] **Step 2: Remover handlers de grid antigos**

Pesquise e remova as funções:

- `handleGridDragStart`
- `handleGridDragOverCell`
- `handleGridDrop`
- `handleGridDragEnd`
- `handleGridClick`

Use `Ctrl+F` / grep para localizar cada uma. Remova os blocos `const handleGrid... = ...` completos.

- [ ] **Step 3: Remover o bloco de render antigo**

O bloco substituído na Task 10 Step 5 deve ter sido removido. Confirme que não há código restante com `gridWidth`, `gridHeight`, `gridPos.x`, `gridPos.y`, `customPins` no bloco de render do combate.

- [ ] **Step 4: Remover CustomPin do types.ts**

Em `types.ts`, localize e remova a interface `CustomPin`. Também remova `gridPos` do `Combatant` (agora só `pos` é usado):

```ts
export interface Combatant extends Character {
  combatId: string;
  initiativeResult: number;
  pos: { x: number; y: number }; // % da arena (0–100)
  // gridPos removido
}
```

Remova também de `CombatState` os campos legado confirmados não mais usados: `gridWidth`, `gridHeight`, `visualWidthPct`, `visualHeightPx`, `maintainAspectRatio`, `customPins`.

- [ ] **Step 5: Verificação final**

```bash
npx tsc --noEmit 2>&1 | tail -10
```

Esperado: ≤ 29 erros (baseline pré-existente). Se houver erros novos sobre `gridPos` ou campos removidos, corrija as referências remanescentes.

- [ ] **Step 6: Teste visual final no browser**

```bash
npm run dev
```

Verificar:
- [ ] Tokens se movem livremente ao arrastar
- [ ] Círculo de alcance aparece ao arrastar (verde → âmbar → vermelho)
- [ ] Toggle de grade funciona
- [ ] Régua mede distância ao desenhar
- [ ] AoE circle/cone/line colocam template no mapa
- [ ] Névoa: ligar névoa → usar pincel Revelar/Ocultar → células revelam/ocultam
- [ ] Condições de personagens aparecem como ícones nos tokens
- [ ] Janela de jogadores (`?view=player`) mostra o novo visual com névoa aplicada
- [ ] Uniões: arrastar líder move todos os membros
- [ ] `tsc --noEmit` não introduziu novos erros além do baseline

---

## Notas de implementação

- **Pointer capture:** `setPointerCapture` no token garante que o `pointermove` continua chegando mesmo se o cursor sair do token rapidamente.
- **SVG aspect ratio fix:** o `<ellipse>` com `ry = rangeR * (w/h)` garante um círculo visualmente redondo em arenas não-quadradas.
- **Migration idempotente:** `migrateCombatState` verifica `c.pos ?? ...` — se já migrado, não toca.
- **Fog density vs grid density:** `fog.density` (padrão 20) é a resolução do pincel; `gridDensity` (padrão 10) é só visual. São independentes.
- **AoE right-click para remover:** não implementado nesta versão. Para remover, o mestre pode re-ligar a toolbar; adição futura é um clique no template com confirmação.
