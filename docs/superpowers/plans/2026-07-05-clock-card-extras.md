# Round Clock Rewrite, Card Art, and Extras Removal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the combat round clock as a segmented progress ring, add card art to the chosen-action dialog in the scene action menu, and completely remove the Extras tab and its persistence wiring.

**Architecture:** Three independent slices. (1) A new pure function `buildClockGradient` in a new `utils/roundClock.ts`, consumed by a small local `RoundClock` component inside `tabs/cena/RosterPanel.tsx`, replacing the old spinning-border CSS clock. (2) A new optional `image` field on `ResolvedAction` (`utils/actions.ts`), populated by each `normalize*` function, rendered as an art header in `tabs/cena/ActionMenu.tsx`. (3) Mechanical deletion of the `extras` tab across `App.tsx`, `components/nav/navModel.ts`, `utils/database.ts`, `utils/atmosphere.ts`, `utils/sectionTheme.ts`, and their tests — except `characterCurrencies`, which is read by an unrelated upgrade-purchase modal and must be kept (its balance display is simplified instead, since nothing ever wrote to it besides the now-removed Extras persistence).

**Tech Stack:** React + TypeScript, Vitest + @testing-library/react, plain CSS-in-JS (template literal in `SceneBackdrop.tsx`), IndexedDB via `utils/database.ts`.

---

## Task 1: Round clock — pure gradient helper

**Files:**
- Create: `utils/roundClock.ts`
- Test: `utils/roundClock.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// utils/roundClock.test.ts
import { describe, it, expect } from 'vitest';
import { buildClockGradient } from './roundClock';

describe('buildClockGradient', () => {
  it('sem combatentes retorna um gradiente cinza fixo', () => {
    expect(buildClockGradient(0, 0)).toBe('conic-gradient(#3a3f47 0deg 360deg)');
  });

  it('acende exatamente os gomos completados', () => {
    const g = buildClockGradient(4, 2);
    expect((g.match(/#d9b56f/g) ?? []).length).toBe(2);
    expect((g.match(/#3a3f47/g) ?? []).length).toBe(2);
  });

  it('volta completa acende todos os gomos', () => {
    const g = buildClockGradient(3, 3);
    expect((g.match(/#d9b56f/g) ?? []).length).toBe(3);
    expect((g.match(/#3a3f47/g) ?? []).length).toBe(0);
  });

  it('sempre retorna uma string conic-gradient válida', () => {
    const g = buildClockGradient(5, 1);
    expect(g.startsWith('conic-gradient(')).toBe(true);
    expect(g.endsWith(')')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run utils/roundClock.test.ts`
Expected: FAIL with "Failed to resolve import './roundClock'" (module doesn't exist yet)

- [ ] **Step 3: Write minimal implementation**

```typescript
// utils/roundClock.ts

/** Cor de um gomo aceso (turno já passado ou atual) e de um gomo apagado (turno futuro na rodada). */
const LIT_COLOR = '#d9b56f';
const UNLIT_COLOR = '#3a3f47';

/**
 * Monta um conic-gradient com `total` gomos fixos (1 por combatente vivo na ordem de turno).
 * Os primeiros `litSegments` gomos ficam acesos; o resto fica apagado. Um pequeno gap separa os gomos.
 */
export function buildClockGradient(total: number, litSegments: number): string {
  if (total <= 0) return `conic-gradient(${UNLIT_COLOR} 0deg 360deg)`;
  const segDeg = 360 / total;
  const gapDeg = Math.min(6, segDeg / 4);
  const stops: string[] = [];
  for (let i = 0; i < total; i++) {
    const start = i * segDeg;
    const end = start + segDeg - gapDeg;
    const color = i < litSegments ? LIT_COLOR : UNLIT_COLOR;
    stops.push(`${color} ${start}deg ${end}deg`, `transparent ${end}deg ${start + segDeg}deg`);
  }
  return `conic-gradient(${stops.join(',')})`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run utils/roundClock.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add utils/roundClock.ts utils/roundClock.test.ts
git commit -m "feat(cena): buildClockGradient — gomos fixos por combatente para o relógio de rodadas"
```

---

## Task 2: Round clock — wire into RosterPanel

**Files:**
- Modify: `tabs/cena/RosterPanel.tsx:1-3,95`
- Modify: `tabs/cena/RosterPanel.test.tsx:55-69`
- Modify: `tabs/cena/SceneBackdrop.tsx:179`

- [ ] **Step 1: Write the failing test (extends the existing round-clock test)**

In `tabs/cena/RosterPanel.test.tsx`, replace the last test (`'integra iniciativa e edição rápida na lista de combatentes'`) with:

```typescript
  it('integra iniciativa e edição rápida na lista de combatentes', () => {
    const onEditCharacter = vi.fn();
    const party = [fakeChar('p1', { role: 'cast', name: 'Doravar' }), fakeChar('p2', { role: 'cast', name: 'Elira' })];
    render(
      <RosterPanel party={party} npcRoster={[]} importable={[]} active={null} round={2}
        orderIds={['p1', 'p2']} currentTurnId="p1" onEditCharacter={onEditCharacter}
        onSelectActive={() => {}} onImportNpc={() => {}} onToggleHidden={() => {}}
        onTogglePresent={() => {}} onRemoveNpc={() => {}} />,
    );
    expect(screen.getByText('RODADA')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('AGORA')).toBeTruthy();
    const ring = document.querySelector('.cena-round-clock__ring') as HTMLElement;
    expect(ring.style.background).toContain('#d9b56f');
    // 2 combatentes na ordem, turno atual é o primeiro (índice 0) → 1 gomo aceso, 1 apagado
    expect((ring.style.background.match(/#d9b56f/g) ?? []).length).toBe(1);
    expect((ring.style.background.match(/#3a3f47/g) ?? []).length).toBe(1);
    fireEvent.doubleClick(screen.getByTitle(/doravar.*duplo clique/i));
    expect(onEditCharacter).toHaveBeenCalledWith('p1');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tabs/cena/RosterPanel.test.tsx`
Expected: FAIL — `ring` is `null` (`.cena-round-clock__ring` doesn't exist yet), or `ring.style.background` is empty (old markup has no such element)

- [ ] **Step 3: Implement the RoundClock component and wire it in**

In `tabs/cena/RosterPanel.tsx`, add the import and component, then swap the header markup.

Replace the import block:
```typescript
import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Plus, Shield, Swords, Trash2 } from 'lucide-react';
import type { Character } from '../../types';
import type { NpcEntry } from '../../utils/cena';
```
with:
```typescript
import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Plus, Shield, Swords, Trash2 } from 'lucide-react';
import type { Character } from '../../types';
import type { NpcEntry } from '../../utils/cena';
import { buildClockGradient } from '../../utils/roundClock';
```

Add this component right after the `Vital` function (after the line `function Vital(...) { ... }`):

```typescript
function RoundClock({ round, currentIndex, total }: { round: number; currentIndex: number; total: number }) {
  const lit = currentIndex < 0 ? 0 : currentIndex + 1;
  return (
    <div className="cena-round-clock">
      <div className="cena-round-clock__ring" style={{ background: buildClockGradient(total, lit) }} />
      <div className="cena-round-clock__face">
        <span>RODADA</span>
        <strong>{round}</strong>
      </div>
    </div>
  );
}
```

Replace the header line (currently):
```typescript
      {round ? <div className="cena-round-clock"><i/><span>RODADA</span><strong>{round}</strong></div> : <div><span>COMPANHIA</span><strong>COMBATENTES</strong></div>}
```
with:
```typescript
      {round ? <RoundClock round={round} currentIndex={orderIds.indexOf(currentTurnId ?? '')} total={orderIds.length} /> : <div><span>COMPANHIA</span><strong>COMBATENTES</strong></div>}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tabs/cena/RosterPanel.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Replace the old clock CSS in SceneBackdrop.tsx**

In `tabs/cena/SceneBackdrop.tsx`, find this exact substring on the line that starts with `.cena-combatants-head{min-height:96px...` (line 179) and replace only the `.cena-round-clock` portion:

Old substring to find:
```
.cena-round-clock{position:relative;width:78px;height:78px;display:grid;place-items:center;align-content:center;border-radius:50%;border:2px solid #c49a58;background:radial-gradient(circle,#292d35 0 48%,#101319 50%);box-shadow:0 0 0 5px #181b21,0 0 0 6px #665437,0 0 24px #c49a5838}.cena-round-clock:before,.cena-round-clock:after{content:'';position:absolute;inset:7px;border:1px dashed #8f784e;border-radius:50%}.cena-round-clock:after{inset:-7px;border-style:solid;border-color:#806a45 transparent;animation:cena-clock-spin 12s linear infinite}.cena-round-clock i{position:absolute;left:50%;top:7px;width:2px;height:12px;transform-origin:50% 31px;transform:rotate(42deg);background:#d9b56f}.cena-round-clock span{z-index:1;font-size:7px!important;letter-spacing:2px!important;color:#bca77f!important}.cena-round-clock strong{z-index:1;font:700 28px Georgia,serif!important;line-height:.95;color:#fff2d9!important}
```

New substring:
```
.cena-round-clock{position:relative;width:78px;height:78px;flex:none}.cena-round-clock__ring{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 5px #181b21,0 0 0 6px #40382b,0 0 18px #c49a5830;transition:background .25s ease}.cena-round-clock__face{position:absolute;inset:9px;display:grid;place-items:center;align-content:center;border-radius:50%;background:radial-gradient(circle,#292d35 0 60%,#101319 100%)}.cena-round-clock__face span{font-size:7px;letter-spacing:2px;color:#bca77f}.cena-round-clock__face strong{font:700 26px Georgia,serif;line-height:.95;color:#fff2d9}
```

Note: do NOT touch `@keyframes cena-clock-spin` (defined later on the same line, near the end) — it's still used by `.cena-cinematic-event.is-round .cena-cinematic-event__icon`.

- [ ] **Step 6: Run the full cena test suite and verify nothing else broke**

Run: `npx vitest run tabs/cena`
Expected: PASS (all cena test files)

- [ ] **Step 7: Commit**

```bash
git add tabs/cena/RosterPanel.tsx tabs/cena/RosterPanel.test.tsx tabs/cena/SceneBackdrop.tsx
git commit -m "feat(cena): relógio de rodadas reescrito como anel segmentado por combatente"
```

---

## Task 3: Chosen-action card art — data field

**Files:**
- Modify: `utils/actions.ts:7-95`
- Modify: `utils/actions.test.ts`

- [ ] **Step 1: Write the failing tests**

In `utils/actions.test.ts`, add (after the existing `describe('normalizeCard', ...)` block, before `describe('normalizeSeal', ...)`):

```typescript
describe('normalizeCard / normalizeWeapon / normalizeItem — imagem', () => {
  it('normalizeCard propaga card.image', () => {
    expect(normalizeCard(card({ image: 'https://x/card.png' })).image).toBe('https://x/card.png');
  });
  it('normalizeWeapon propaga w.image', () => {
    expect(normalizeWeapon(weapon({ image: 'https://x/weapon.png' })).image).toBe('https://x/weapon.png');
  });
  it('normalizeItem propaga i.image', () => {
    expect(normalizeItem(item({ image: 'https://x/item.png' })).image).toBe('https://x/item.png');
  });
  it('normalizeSeal propaga seal.image', () => {
    expect(normalizeSeal(seal({ image: 'https://x/seal.png' })).image).toBe('https://x/seal.png');
  });
});
```

And add, inside the existing `import` list at the top of the file, `normalizeWeapon` is already imported — no import changes needed there. Then add a new arsenal-image test near the bottom, after the existing `import` for `applyStatDelta` etc. (find a natural spot, e.g. right after `describe('applyStatDelta', ...)` block):

```typescript
import { normalizeArsenalCard } from './actions';
import { createArsenalCard } from './arsenal';

describe('normalizeArsenalCard — imagem', () => {
  it('propaga card.icon como image', () => {
    const a = normalizeArsenalCard(createArsenalCard({ id: 'a1', name: 'Lâmina', category: 'habilidade', icon: 'https://x/icon.png' }));
    expect(a.image).toBe('https://x/icon.png');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run utils/actions.test.ts`
Expected: FAIL — `image` is `undefined` on all five assertions (field doesn't exist yet)

- [ ] **Step 3: Add the field and populate it in each normalize function**

In `utils/actions.ts`, add `image?: string;` to the `ResolvedAction` interface:

```typescript
export interface ResolvedAction {
  source: 'card' | 'seal' | 'weapon' | 'item' | 'guard' | 'arsenal';
  id: string;
  name: string;
  category: ActionCategory;
  diceRoll: string;
  damage?: number;
  damageType?: DamageType;
  healHp?: number;
  healAura?: number;
  conditionName?: string;
  conditionDuration?: number;
  auraCost?: number;
  ammoCost?: number;
  targeting: 'self' | 'other';
  arsenalCard?: ArsenalCard;
  /** Retoma uma carta cujo tempo obrigatório de preparação terminou. */
  resumePreparation?: boolean;
  /** Texto descritivo da fonte original, para exibição no card de detalhes. */
  description?: string;
  /** Arte da carta/arma/item, exibida no cabeçalho do card de detalhes. */
  image?: string;
}
```

Update `normalizeCard`:
```typescript
export function normalizeCard(card: Card): ResolvedAction {
  const category: ActionCategory = card.type === 'ataque' ? 'atacar' : card.type === 'forma' ? 'forma' : 'habilidade';
  return {
    source: 'card', id: card.id, name: card.name, category,
    diceRoll: card.diceRoll ?? '1d20',
    damage: card.damage, damageType: card.damageType,
    conditionName: card.conditionEffect, conditionDuration: card.conditionDuration,
    auraCost: card.auraCost, ammoCost: card.ammoCost,
    targeting: 'other', description: card.description,
    image: card.image,
  };
}
```

Update `normalizeSeal`:
```typescript
export function normalizeSeal(seal: Seal): ResolvedAction {
  const isHeal = !!(seal.healHp || seal.healAura) && !seal.damage;
  return {
    source: 'seal', id: seal.id, name: seal.name, category: 'habilidade',
    diceRoll: seal.diceRoll ?? '1d20',
    damage: seal.damage, damageType: seal.damageType,
    healHp: seal.healHp, healAura: seal.healAura,
    conditionName: seal.conditionEffect, conditionDuration: seal.conditionDuration,
    auraCost: seal.cost?.aura, ammoCost: seal.cost?.ammo,
    targeting: isHeal ? 'self' : 'other', description: seal.description,
    image: seal.image,
  };
}
```

Update `normalizeWeapon`:
```typescript
export function normalizeWeapon(w: Weapon): ResolvedAction {
  const isHeal = !!w.combatHeal && !w.combatDamage;
  return {
    source: 'weapon', id: w.id, name: w.name, category: 'atacar',
    diceRoll: w.combatDiceRoll ?? '1d20',
    damage: w.combatDamage ?? w.damage, damageType: w.combatDamageType ?? w.damageType,
    healHp: w.combatHeal,
    conditionName: w.combatConditionEffect, conditionDuration: w.combatConditionDuration,
    ammoCost: w.combatAmmoCost,
    targeting: w.combatTargeting === 'self' || isHeal ? 'self' : 'other', description: w.description,
    image: w.image,
  };
}
```

Update `normalizeItem`:
```typescript
export function normalizeItem(i: ResolvedItem): ResolvedAction {
  const isHeal = !!(i.combatHeal || i.combatAuraRecover) && !i.combatDamage;
  return {
    source: 'item', id: i.id, name: i.name, category: 'item',
    diceRoll: i.combatDiceRoll ?? '1d20',
    damage: i.combatDamage, damageType: i.combatDamageType,
    healHp: i.combatHeal, healAura: i.combatAuraRecover,
    conditionName: i.combatConditionEffect, conditionDuration: i.combatConditionDuration,
    ammoCost: i.combatAmmoCost,
    targeting: i.combatTargeting === 'self' || isHeal ? 'self' : 'other', description: i.description,
    image: i.image,
  };
}
```

Update `normalizeArsenalCard`:
```typescript
export function normalizeArsenalCard(card: ArsenalCard): ResolvedAction {
  const category: ActionCategory = card.category === 'item' ? 'item'
    : card.category === 'arma' ? 'atacar'
    : card.abilityType === 'forma' ? 'forma'
    : card.damage ? 'atacar' : 'habilidade';
  return {
    source:'arsenal', id:card.id, name:card.name, category,
    diceRoll:card.testDice??'1d20', damage:card.damage?.flat,
    damageType:card.element??undefined, healHp:card.healing?.flat,
    healAura:card.auraRestored?.flat, auraCost:card.auraConsumed?.flat,
    conditionName:card.effects[0]?.name,
    conditionDuration:card.effects[0]?.duration.amount,
    targeting:card.target.type==='proprio_usuario'?'self':'other', arsenalCard:card,
    description:card.description, image: card.icon || undefined,
  };
}
```

(`card.icon` is typed as `string`, defaulting to `''` per `createArsenalCard` — `|| undefined` normalizes the empty-string case to `undefined` so `ActionMenu` can treat "no image" as one condition instead of two.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run utils/actions.test.ts`
Expected: PASS (all tests, including the 5 new ones)

- [ ] **Step 5: Commit**

```bash
git add utils/actions.ts utils/actions.test.ts
git commit -m "feat(cena): ResolvedAction ganha campo image, populado por card/selo/arma/item/arsenal"
```

---

## Task 4: Chosen-action card art — UI

**Files:**
- Modify: `tabs/cena/ActionMenu.tsx:70-94`
- Modify: `tabs/cena/ActionMenu.test.tsx`
- Modify: `tabs/cena/SceneBackdrop.tsx:165`

- [ ] **Step 1: Write the failing test**

In `tabs/cena/ActionMenu.test.tsx`, add a new test inside the first `describe('ActionMenu', ...)` block:

```typescript
  it('mostra a arte da carta selecionada quando existe imagem', () => {
    render(<ActionMenu actions={groups({ atacar: [ra({ name: 'Bola de Fogo', image: 'https://x/fogo.png' })] })} />);
    fireEvent.click(screen.getByText('ATACAR'));
    fireEvent.click(screen.getByText('Bola de Fogo'));
    const art = document.querySelector('.cena-ability-card__art') as HTMLElement;
    expect(art).toBeTruthy();
    expect(art.style.backgroundImage).toContain('https://x/fogo.png');
  });

  it('sem imagem, cai no cabeçalho neutro', () => {
    render(<ActionMenu actions={groups({ atacar: [ra({ name: 'Golpe Simples' })] })} />);
    fireEvent.click(screen.getByText('ATACAR'));
    fireEvent.click(screen.getByText('Golpe Simples'));
    expect(document.querySelector('.cena-ability-card__art')).toBeNull();
    expect(document.querySelector('.cena-floating-card__heading')).toBeTruthy();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tabs/cena/ActionMenu.test.tsx`
Expected: FAIL — `.cena-ability-card__art` is `null` (markup doesn't exist yet)

- [ ] **Step 3: Implement the art header**

In `tabs/cena/ActionMenu.tsx`, replace the dialog block:

```typescript
      {selected && createPortal(
        <div className="cena-floating-card cena-ability-card" role="dialog" aria-label={`Detalhes de ${selected.name}`}>
          <button className="cena-ability-card__close" aria-label="Fechar detalhes" onClick={() => setSelected(null)}><X size={14}/></button>
          <div className="cena-floating-card__heading"><span>{CAT_LABEL[selected.category]}</span><strong>{selected.name}</strong></div>
          {selected.description && <p className="cena-ability-card__desc">{selected.description}</p>}
```

with:

```typescript
      {selected && createPortal(
        <div className={`cena-floating-card cena-ability-card ${selected.image ? 'has-art' : ''}`} role="dialog" aria-label={`Detalhes de ${selected.name}`}>
          <button className="cena-ability-card__close" aria-label="Fechar detalhes" onClick={() => setSelected(null)}><X size={14}/></button>
          {selected.image ? (
            <div className="cena-ability-card__art" style={{ backgroundImage: `url(${selected.image})` }}>
              <div className="cena-ability-card__art-fade" />
              <div className="cena-ability-card__art-heading"><span>{CAT_LABEL[selected.category]}</span><strong>{selected.name}</strong></div>
            </div>
          ) : (
            <div className="cena-floating-card__heading"><span>{CAT_LABEL[selected.category]}</span><strong>{selected.name}</strong></div>
          )}
          {selected.description && <p className="cena-ability-card__desc">{selected.description}</p>}
```

(The rest of the dialog — stats, effects, actions — stays unchanged.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tabs/cena/ActionMenu.test.tsx`
Expected: PASS (all tests, including the 2 new ones)

- [ ] **Step 5: Add the art-header CSS**

In `tabs/cena/SceneBackdrop.tsx`, on the line starting `.cena-ability-card{top:96px;pointer-events:auto;}...` (line 165), append (before the closing of that line, i.e. as additional rules on the same line or a new line right after it — either is fine since it's one big template string):

```
.cena-ability-card.has-art{padding-top:0}.cena-ability-card__art{position:relative;margin:0 -18px 12px;height:120px;background-position:center;background-size:cover;border-bottom:1px solid #4c4659}.cena-ability-card__art-fade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(10,10,18,.85) 100%)}.cena-ability-card__art-heading{position:absolute;left:14px;right:14px;bottom:10px}.cena-ability-card__art-heading span{display:block;color:#f0d9a0;font:800 9px 'Barlow Semi Condensed',sans-serif;letter-spacing:1.6px}.cena-ability-card__art-heading strong{display:block;color:#fff;font:600 18px Georgia,serif;text-shadow:0 2px 6px #000}.cena-ability-card.has-art .cena-ability-card__close{background:rgba(10,10,18,.55);border-radius:50%;padding:4px}
```

- [ ] **Step 6: Run the full cena test suite**

Run: `npx vitest run tabs/cena`
Expected: PASS (all cena test files)

- [ ] **Step 7: Commit**

```bash
git add tabs/cena/ActionMenu.tsx tabs/cena/ActionMenu.test.tsx tabs/cena/SceneBackdrop.tsx
git commit -m "feat(cena): carta escolhida exibe arte no cabeçalho do card de detalhes"
```

---

## Task 5: Remove the Extras tab — navigation and theme layer

**Files:**
- Modify: `components/nav/navModel.ts`
- Modify: `components/nav/navModel.test.ts`
- Modify: `components/nav/useKeyboardNav.test.ts`
- Modify: `utils/atmosphere.ts`
- Modify: `utils/atmosphere.test.ts`
- Modify: `utils/sectionTheme.ts`
- Modify: `utils/sectionTheme.test.ts`

- [ ] **Step 1: Update the failing-first tests**

In `components/nav/navModel.test.ts`, replace:
```typescript
  it('tem exatamente 1 modo (cena) e 3 satélites', () => {
    expect(MODES).toEqual(['cena']);
    expect(SATELLITES).toEqual(['characters', 'arsenal', 'extras']);
    expect(SATELLITES).not.toContain('cena');
  });

  it('NAV_ORDER cobre os 4 destinos sem repetição, começando por cena', () => {
    expect(NAV_ORDER).toEqual(['cena', 'characters', 'arsenal', 'extras']);
    expect(new Set(NAV_ORDER).size).toBe(4);
  });
```
with:
```typescript
  it('tem exatamente 1 modo (cena) e 2 satélites', () => {
    expect(MODES).toEqual(['cena']);
    expect(SATELLITES).toEqual(['characters', 'arsenal']);
    expect(SATELLITES).not.toContain('cena');
  });

  it('NAV_ORDER cobre os 3 destinos sem repetição, começando por cena', () => {
    expect(NAV_ORDER).toEqual(['cena', 'characters', 'arsenal']);
    expect(new Set(NAV_ORDER).size).toBe(3);
  });
```

In `components/nav/useKeyboardNav.test.ts`, replace:
```typescript
  it('ArrowLeft de cena dá a volta para o último (extras)', () => {
    const { result, onSelect } = setup('cena');
    act(() => result.current.handleKey({ key: 'ArrowLeft', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('extras');
  });
```
with:
```typescript
  it('ArrowLeft de cena dá a volta para o último (arsenal)', () => {
    const { result, onSelect } = setup('cena');
    act(() => result.current.handleKey({ key: 'ArrowLeft', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('arsenal');
  });
```

In `utils/atmosphere.test.ts`, replace:
```typescript
    for (const t of ['combat','arsenal','characters','extras'] as const) {
```
with:
```typescript
    for (const t of ['combat','arsenal','characters'] as const) {
```

In `utils/sectionTheme.test.ts`, replace:
```typescript
const ALL_TABS: TabId[] = ['cena', 'combat', 'journey', 'characters', 'arsenal', 'extras'];
```
with:
```typescript
const ALL_TABS: TabId[] = ['cena', 'combat', 'journey', 'characters', 'arsenal'];
```
and remove this whole test block:
```typescript
  it('extras usa acento cinza e override de ember', () => {
    expect(SECTION_THEMES.extras.vars['--sec-accent']).toBe('#9aa3b0');
    expect(SECTION_THEMES.extras.vars['--ember']).toBe('#8a93a0');
  });
```
and replace:
```typescript
  it('remove as vars de combat ao trocar para extras e aplica overrides de extras', () => {
    applySectionTheme('combat');
    expect(document.documentElement.style.getPropertyValue('--sec-accent')).toBe('#d11f3f');
    expect(document.documentElement.style.getPropertyValue('--gold-mid')).toBe('#2fd4c4');
    applySectionTheme('extras');
    expect(document.documentElement.dataset.section).toBe('extras');
    expect(document.documentElement.style.getPropertyValue('--sec-accent')).toBe('#9aa3b0');
    expect(document.documentElement.style.getPropertyValue('--gold-mid')).toBe('#8a93a0');
  });
```
with:
```typescript
  it('remove as vars de combat ao trocar para arsenal e aplica overrides de arsenal', () => {
    applySectionTheme('combat');
    expect(document.documentElement.style.getPropertyValue('--sec-accent')).toBe('#d11f3f');
    expect(document.documentElement.style.getPropertyValue('--gold-mid')).toBe('#2fd4c4');
    applySectionTheme('arsenal');
    expect(document.documentElement.dataset.section).toBe('arsenal');
    expect(document.documentElement.style.getPropertyValue('--sec-accent')).toBe('#d4142a');
    expect(document.documentElement.style.getPropertyValue('--gold-mid')).toBe('#d4142a');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/nav utils/atmosphere.test.ts utils/sectionTheme.test.ts`
Expected: FAIL — `navModel.ts`, `atmosphere.ts`, and `sectionTheme.ts` still define/return `'extras'`, so `SATELLITES`/`NAV_ORDER` and the ArrowLeft wraparound still include it, and `SECTION_THEMES` still has an `extras` key with the old values (mismatched against the now-`arsenal`-based assertions)

- [ ] **Step 3: Update `utils/atmosphere.ts`**

Replace:
```typescript
export type TabId = 'cena' | 'combat' | 'arsenal' | 'characters' | 'extras' | 'journey';
```
with:
```typescript
export type TabId = 'cena' | 'combat' | 'arsenal' | 'characters' | 'journey';
```
Find the `TAB_ATMOSPHERE` record line containing `characters: 'dark', extras: 'dark', journey: 'dusk',` and replace with:
```typescript
  characters: 'dark', journey: 'dusk',
```

- [ ] **Step 4: Update `utils/sectionTheme.ts`**

Delete the `EXTRAS_VARS` constant block:
```typescript
const EXTRAS_VARS: Record<string, string> = {
  '--sec-accent':   '#9aa3b0',
  '--sec-accent-2': '#cdd3dc',
  '--sec-accent-3': '#6b7280',
  '--sec-ink':      '#e8ebf0',
  '--gold-dim':    '#3a3f47',
  '--gold-mid':    '#8a93a0',
  '--gold-bright': '#cdd3dc',
  '--gold-pale':   '#eef1f5',
  '--border-gold': 'rgba(160,170,185,0.28)',
  '--ember':       '#8a93a0',
  '--ember-deep':  '#4a4f57',
};

```
Remove the `extras:` entry from `SECTION_THEMES`:
```typescript
  extras:     { atmosphere: atmosphereForTab('extras'),     vars: EXTRAS_VARS },
```

- [ ] **Step 5: Update `components/nav/navModel.ts`**

Replace the whole file with:
```typescript
import type { LucideIcon } from 'lucide-react';
import { Compass, Users, Shield, Swords } from 'lucide-react';
import type { TabId } from '../../utils/atmosphere';

export type NavKind = 'mode' | 'satellite';
export interface NavDest {
  id: TabId;
  label: string;
  kind: NavKind;
  icon: LucideIcon;
}

export const MODES: TabId[] = ['cena'];
export const SATELLITES: TabId[] = ['characters', 'arsenal'];
// Ordem das teclas 1..3
export const NAV_ORDER: TabId[] = ['cena', 'characters', 'arsenal'];

// NAV_DESTS mantém combat/journey (ainda são TabId até a Fase 4), mas eles
// não aparecem em NAV_ORDER/MODES, portanto ficam inacessíveis pela navegação.
export const NAV_DESTS: Record<TabId, NavDest> = {
  cena:       { id: 'cena',       label: 'Cena',        kind: 'mode',      icon: Compass },
  combat:     { id: 'combat',     label: 'Combate',     kind: 'mode',      icon: Swords },
  journey:    { id: 'journey',    label: 'Jornada',     kind: 'mode',      icon: Compass },
  characters: { id: 'characters', label: 'Personagens', kind: 'satellite', icon: Users },
  arsenal:    { id: 'arsenal',    label: 'Arsenal',     kind: 'satellite', icon: Shield },
};
```

(`LayoutGrid` was only used for the Extras icon — dropped from the import.)

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run components/nav utils/atmosphere.test.ts utils/sectionTheme.test.ts`
Expected: PASS (all tests)

- [ ] **Step 7: Commit**

```bash
git add components/nav/navModel.ts components/nav/navModel.test.ts components/nav/useKeyboardNav.test.ts utils/atmosphere.ts utils/atmosphere.test.ts utils/sectionTheme.ts utils/sectionTheme.test.ts
git commit -m "refactor(nav): remove a aba Extras da navegação e das camadas de tema"
```

---

## Task 6: Remove the Extras tab — database layer

**Files:**
- Modify: `utils/database.ts`
- Modify: `hooks/useUnifiedAutosave.test.tsx`

- [ ] **Step 1: Update the autosave test fixture**

In `hooks/useUnifiedAutosave.test.tsx`, replace:
```typescript
  combat: { marker }, journey: { marker }, cena: { marker }, extras: { marker },
```
with:
```typescript
  combat: { marker }, journey: { marker }, cena: { marker },
```

Run: `npx vitest run hooks/useUnifiedAutosave.test.tsx`
Expected: PASS unchanged (this test only checks `characters`/`items`/`weapons`/`grimoire`/`combat`/`cena` in its `toMatchObject`, so removing the unused `extras` key from the fixture doesn't change behavior — this step just keeps the fixture honest with the new `AppSnapshot` shape from Step 2 below)

- [ ] **Step 2: Remove `AppExtras` and all its wiring from `utils/database.ts`**

Delete the `AppExtras` interface and `DEFAULT_EXTRAS` constant:
```typescript
// ─────────────────────────────────────────────────────────────────
// AppExtras — dados do GM / ferramentas que antes ficavam de fora
// ─────────────────────────────────────────────────────────────────
export interface AppExtras {
  gmNotes: string;
  combatNotes: string;
  shopCurrency: number;
  characterCurrencies: Record<string, number>;
  progressBars: Array<{ id: string; label: string; current: number; max: number; color: string }>;
  rollHistory: Array<{ id: string; result: number; type: string; timestamp: number }>;
  lootList: Array<{ id: string; name: string; rarity: string }>;
  nameStyle: string;
}

export const DEFAULT_EXTRAS: AppExtras = {
  gmNotes: '',
  combatNotes: '',
  shopCurrency: 0,
  characterCurrencies: {},
  progressBars: [{ id: '1', label: 'Progresso Customizado', current: 0, max: 100, color: '#d97706' }],
  rollHistory: [],
  lootList: [],
  nameStyle: 'fantasy',
};

```

Remove `extras: AppExtras;` from the `AppSnapshot` interface.

In `_writeSnapshotAtomic`, delete this line:
```typescript
    meta.put({ id: '__extras', value: snapshot.extras });
```

Delete the `ensureExtras` function:
```typescript
function ensureExtras(raw: any): AppExtras {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_EXTRAS };
  return {
    ...DEFAULT_EXTRAS,
    ...raw,
    characterCurrencies: raw.characterCurrencies ?? {},
    progressBars: Array.isArray(raw.progressBars) ? raw.progressBars : DEFAULT_EXTRAS.progressBars,
    rollHistory: Array.isArray(raw.rollHistory) ? raw.rollHistory : [],
    lootList: Array.isArray(raw.lootList) ? raw.lootList : [],
  };
}

```

Update the `ListenerKey` type and `_listeners` record:
```typescript
type ListenerKey = 'characters' | 'cards' | 'items' | 'seals' | 'weapons' | 'grimoire' | 'combat' | 'journey' | 'cena';
const _listeners: Record<ListenerKey, Function[]> = {
  characters: [], cards: [], items: [], seals: [], weapons: [], grimoire: [], combat: [], journey: [], cena: [],
};
```

In `loadAll`, remove `extrasRec` from the destructured `Promise.all` result and its corresponding `_get` call, and remove `extras: ensureExtras(extrasRec?.value),` from the returned object:
```typescript
async function loadAll() {
  const [chars, cards, items, seals, weapons, grimoire, combatRec, journeyRec, cenaRec] = await Promise.all([
    _getAll<any>('characters'),
    _getAll<any>('cards'),
    _getAll<any>('items'),
    _getAll<any>('seals'),
    _getAll<any>('weapons'),
    _getAll<any>('grimoire'),
    _get<any>('meta', '__combat'),
    _get<any>('meta', '__journey'),
    _get<any>('meta', '__cena'),
  ]);
  return {
    characters: chars.map(ensureChar),
    cards: cards as Card[],
    items: items as Item[],
    seals: seals.map(ensureSeal) as Seal[],
    weapons: weapons as Weapon[],
    grimoire: (grimoire as ArsenalCard[]).map(normalizeArsenalCard),
    combat: ensureCombat(combatRec?.value),
    journey: ensureJourney(journeyRec?.value),
    cena: ensureCena(cenaRec?.value),
  };
}
```

Remove `extras: AppExtras;` from `DatabaseService.initialize`'s return type annotation.

Remove the `syncExtras` method:
```typescript
  syncExtras: (cb: (d: AppExtras) => void) => {
    _get<any>('meta', '__extras').then(r => cb(ensureExtras(r?.value))).catch(() => cb({ ...DEFAULT_EXTRAS }));
    return _subscribe<AppExtras>('extras', cb);
  },
```

Remove the `updateExtras` method:
```typescript
  updateExtras: async (extras: AppExtras) => {
    await _put('meta', { id: '__extras', value: extras });
    _notify('extras', extras);
  },
```

In `saveFullSnapshot`, remove this line:
```typescript
    _notify('extras', snapshot.extras);
```

In `restoreSnapshot`, remove the `extras:` field entirely (the whole `// Suporte a formato antigo...` comment plus the `extras: ensureExtras(...)` call):
```typescript
        // Suporte a formato antigo (sem extras encapsulado)
        extras: ensureExtras(
          raw.extras ?? {
            gmNotes: raw.gmNotes,
            combatNotes: raw.combatNotes,
            shopCurrency: raw.shopCurrency,
            characterCurrencies: raw.characterCurrencies,
            progressBars: raw.progressBars,
            rollHistory: raw.rollHistory,
            lootList: raw.lootList,
            nameStyle: raw.nameStyle,
          }
        ),
```
(remove that whole block; the `cena: ensureCena(raw.cena),` line right above it stays, and the closing of the `snapshot` object literal now ends right after it)

- [ ] **Step 3: Run the full test suite touching database.ts**

Run: `npx vitest run utils/database.test.ts hooks/useUnifiedAutosave.test.tsx`
Expected: PASS. (If `utils/database.test.ts` doesn't exist, run `npx vitest run hooks/useUnifiedAutosave.test.tsx` only.)

- [ ] **Step 4: Commit**

```bash
git add utils/database.ts hooks/useUnifiedAutosave.test.tsx
git commit -m "refactor(db): remove AppExtras e toda a persistência da aba Extras"
```

---

## Task 7: Remove the Extras tab — App.tsx wiring and UI

**Files:**
- Modify: `App.tsx` (multiple sections, listed below)

This task has no new automated tests — it's a mechanical deletion of dead state/UI plus one small simplification (`characterCurrencies` balance display, since nothing writes to that map anymore once Extras persistence is gone). Verification is via full build + full test suite (Step 8) plus a manual smoke check (Step 9).

- [ ] **Step 1: Remove the `extras` tab from the two `AppTab`-shaped type unions and `TAB_META`**

Replace:
```typescript
type AppTab = 'cena' | 'combat' | 'arsenal' | 'characters' | 'extras' | 'journey';
const TAB_META: Record<AppTab, { label: string; kicker: string }> = {
  cena:       { label: 'Cena',        kicker: 'Exploração & Combate' },
  combat:     { label: 'Combate',     kicker: 'Arena & Iniciativa' },
  journey:    { label: 'Jornada',     kicker: 'Exploração & Aventura' },
  characters: { label: 'Personagens', kicker: 'Receptáculos & Vínculos' },
  arsenal:    { label: 'Arsenal',     kicker: 'Habilidades, Itens & Selos' },
  extras:     { label: 'Extras',      kicker: 'Ferramentas do Mestre' },
};
```
with:
```typescript
type AppTab = 'cena' | 'combat' | 'arsenal' | 'characters' | 'journey';
const TAB_META: Record<AppTab, { label: string; kicker: string }> = {
  cena:       { label: 'Cena',        kicker: 'Exploração & Combate' },
  combat:     { label: 'Combate',     kicker: 'Arena & Iniciativa' },
  journey:    { label: 'Jornada',     kicker: 'Exploração & Aventura' },
  characters: { label: 'Personagens', kicker: 'Receptáculos & Vínculos' },
  arsenal:    { label: 'Arsenal',     kicker: 'Habilidades, Itens & Selos' },
};
```

Replace:
```typescript
  const [activeTab, setActiveTab] = useState<'cena' | 'combat' | 'arsenal' | 'characters' | 'extras' | 'journey'>('cena');
```
with:
```typescript
  const [activeTab, setActiveTab] = useState<'cena' | 'combat' | 'arsenal' | 'characters' | 'journey'>('cena');
```

- [ ] **Step 2: Remove Extras-only state declarations**

Delete this line (unused sub-tab selector for the Extras UI):
```typescript
  const [extrasTab, setExtrasTab] = useState<'dice' | 'timer' | 'progress' | 'names' | 'loot' | 'notes'>('dice');
```

Delete these lines (all confirmed used only by the Extras tab and its persistence — verified via full-file grep; `characterCurrencies` is the one exception and is handled separately in Step 6):
```typescript
  // Histórico de Dados Manuais
  const [rollHistory, setRollHistory] = useState<{ id: string, result: number, type: string, timestamp: number }[]>([]);

  // State Timer
  const [timerTime, setTimerTime] = useState(0); // em segundos
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInput, setTimerInput] = useState({ h: 0, m: 0, s: 0 });

  // State Progress
  const [progressData, setProgressData] = useState({ label: 'Progresso Customizado', current: 0, max: 100 });
  // Extras: Dice enhancements
  const [diceQty, setDiceQty] = useState(1);
  const [diceBonus, setDiceBonus] = useState(0);
  const [customDiceSides, setCustomDiceSides] = useState(6);
  const [multiRollResults, setMultiRollResults] = useState<number[]>([]);
  // Extras: Name generator
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [nameStyle, setNameStyle] = useState<'fantasy' | 'nordic' | 'arabic' | 'japanese' | 'latin'>('fantasy');
  // Extras: Loot generator
  const [lootList, setLootList] = useState<{id:string;name:string;rarity:string}[]>([]);
  // Extras: GM notes
  const [gmNotes, setGmNotes] = useState('');
  // Multiple progress bars
  const [progressBars, setProgressBars] = useState([{ id:'1', label:'Progresso Customizado', current: 0, max: 100, color:'#d97706' }]);
```

Also delete (near where `combatNotes`/`shopCurrency` are declared, further down — locate via grep since they're not adjacent to the block above):
```typescript
  const [combatNotes, setCombatNotes] = useState('');
```
and
```typescript
  const [shopCurrency, setShopCurrency] = useState(0);
```

Do **not** delete `characterCurrencies` — it's still read at the upgrade-purchase modal (handled in Step 6).

Also delete the timer's `useEffect` (the interval that ticks `timerTime` down while `isTimerRunning`), located right before the "Boot: inicializa DB" comment:
```typescript
    return () => clearInterval(interval);
  }, [isTimerRunning, timerTime]);
```
— delete this and the full `useEffect` it closes (search upward from this closing line for the matching `useEffect(() => {` that references `isTimerRunning`/`timerTime`/`setInterval`, and delete the whole block).

- [ ] **Step 3: Simplify the boot/init effect**

Replace:
```typescript
    DatabaseService.initialize().then(({ characters: chars, cards: cds, items: its, seals: sls, weapons: wps, grimoire: grim, combat: cbt, journey: jny, cena: cn, extras }) => {
      if (cancelled) return;
      setCharacters(chars);
      setCards(cds);
      setItems(its);
      setSeals(sls);
      setWeapons(wps);
      setGrimoire(grim);
      setCombat(migrateCombatState(cbt));
      setJourney(jny);
      setCena(cn);
      // Restore extras state
      setGmNotes(extras.gmNotes ?? '');
      setCombatNotes(extras.combatNotes ?? '');
      setShopCurrency(extras.shopCurrency ?? 0);
      setCharacterCurrencies(extras.characterCurrencies ?? {});
      if (extras.progressBars?.length) setProgressBars(extras.progressBars);
      if (extras.rollHistory?.length) setRollHistory(extras.rollHistory);
      if (extras.lootList?.length) setLootList(extras.lootList);
      if (extras.nameStyle) setNameStyle(extras.nameStyle as any);
      setIsLoading(false);
    }).catch(err => {
```
with:
```typescript
    DatabaseService.initialize().then(({ characters: chars, cards: cds, items: its, seals: sls, weapons: wps, grimoire: grim, combat: cbt, journey: jny, cena: cn }) => {
      if (cancelled) return;
      setCharacters(chars);
      setCards(cds);
      setItems(its);
      setSeals(sls);
      setWeapons(wps);
      setGrimoire(grim);
      setCombat(migrateCombatState(cbt));
      setJourney(jny);
      setCena(cn);
      setIsLoading(false);
    }).catch(err => {
```

- [ ] **Step 4: Simplify the autosave snapshot and the extras-autosave effect**

Replace:
```typescript
  const autosaveSnapshot = useMemo(() => combat && journey ? ({
    version: SNAPSHOT_VERSION,
    savedAt: new Date().toISOString(),
    characters, cards, items, seals, weapons, grimoire, combat, journey, cena,
    extras: { gmNotes, combatNotes, shopCurrency, characterCurrencies, progressBars, rollHistory, lootList, nameStyle },
  }) : null, [characters, cards, items, seals, weapons, grimoire, combat, journey, cena, gmNotes, combatNotes, shopCurrency, characterCurrencies, progressBars, rollHistory, lootList, nameStyle]);
```
with:
```typescript
  const autosaveSnapshot = useMemo(() => combat && journey ? ({
    version: SNAPSHOT_VERSION,
    savedAt: new Date().toISOString(),
    characters, cards, items, seals, weapons, grimoire, combat, journey, cena,
  }) : null, [characters, cards, items, seals, weapons, grimoire, combat, journey, cena]);
```

Delete the whole extras-autosave effect:
```typescript
  // ── Salva extras no IDB em tempo real quando mudam ─────────────
  // (debounce 2s para não sobrecarregar o IDB a cada keystroke)
  useEffect(() => {
    if (isLoading) return;
    const t = setTimeout(() => {
      DatabaseService.updateExtras({ gmNotes, combatNotes, shopCurrency, characterCurrencies, progressBars, rollHistory, lootList, nameStyle });
    }, 2000);
    return () => clearTimeout(t);
  }, [isLoading, gmNotes, combatNotes, shopCurrency, characterCurrencies, progressBars, rollHistory, lootList, nameStyle]);

```

- [ ] **Step 5: Simplify the backup export and import-restore handlers**

Replace:
```typescript
  // ── Export completo (inclui TODOS os dados + extras) ─────────────
  const handleDownloadBackup = async () => {
    try {
      setAutoSaveStatus('saving');
      // Constrói snapshot direto do IDB (fonte da verdade)
      // mas sobrescreve extras com o estado React atual (pode ser mais novo que o IDB)
      const snapshot = await DatabaseService.buildSnapshot();
      // Sobrescreve extras com o estado atual do React (pode não ter sido salvo ainda)
      snapshot.extras = {
        gmNotes,
        combatNotes,
        shopCurrency,
        characterCurrencies,
        progressBars,
        rollHistory,
        lootList,
        nameStyle,
      };
      // Garante que os dados do React (mais recentes) são usados para as entidades principais também
```
with:
```typescript
  // ── Export completo (inclui TODOS os dados) ─────────────
  const handleDownloadBackup = async () => {
    try {
      setAutoSaveStatus('saving');
      // Constrói snapshot direto do IDB (fonte da verdade)
      const snapshot = await DatabaseService.buildSnapshot();
      // Garante que os dados do React (mais recentes) são usados para as entidades principais também
```

Replace:
```typescript
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
      // Recarrega os extras no estado React após import
      const extras = importConfirmData.extras ?? {};
      if (extras.gmNotes !== undefined) setGmNotes(extras.gmNotes);
      if (extras.combatNotes !== undefined) setCombatNotes(extras.combatNotes);
      if (extras.shopCurrency !== undefined) setShopCurrency(extras.shopCurrency);
      if (extras.characterCurrencies) setCharacterCurrencies(extras.characterCurrencies);
      if (extras.progressBars?.length) setProgressBars(extras.progressBars);
      if (extras.rollHistory?.length) setRollHistory(extras.rollHistory);
      if (extras.lootList?.length) setLootList(extras.lootList);
      if (extras.nameStyle) setNameStyle(extras.nameStyle);
    } else {
```
with:
```typescript
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
      if (importConfirmData.characterCurrencies) setCharacterCurrencies(importConfirmData.characterCurrencies);
    } else {
```

(`characterCurrencies` restore is kept, sourced directly from the raw imported JSON instead of the now-removed `extras` wrapper — old backup files still have `characterCurrencies` either at the top level or nested under a legacy `extras` key; since this is a best-effort restore of a value that's already effectively dead weight per Task 7 Step 6, only the flat top-level shape is handled here, matching what `DatabaseService.restoreSnapshot`'s legacy-format branch expects going forward.)

Replace:
```typescript
              {importConfirmData.extras && (
                <div style={{ fontSize:11, color:'rgba(52,211,153,0.8)', marginTop:4 }}>✓ Contém extras: notas, moedas, histórico</div>
              )}
```
with nothing (delete these 3 lines).

- [ ] **Step 6: Simplify the `characterCurrencies` balance display**

`characterCurrencies` is never written to by any purchase flow — it was only ever populated by the Extras import/restore path being deleted in this task, so its balance is always stale/zero going forward. Replace:
```typescript
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>Custo: {offer.finalPrice}🪙 · Saldo restante: {characterCurrencies[targetChar.id] ?? 0}🪙</div>
```
with:
```typescript
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>Custo: {offer.finalPrice}🪙</div>
```

- [ ] **Step 7: Delete the entire Extras tab JSX block**

Delete the whole block from the opening `{activeTab === 'extras' && (` through its matching closing `)}` — this spans from the line:
```typescript
        {activeTab === 'extras' && (
```
through the line:
```typescript
        )}
```
that appears immediately before `</main>`. (In the pre-edit file this is lines 3963–3306 — re-locate by searching for `activeTab === 'extras'` after Steps 1–6, since earlier deletions shift line numbers.)

- [ ] **Step 8: Build and run the full test suite**

Run: `npx tsc --noEmit`
Expected: no errors referencing `extras`, `AppExtras`, `gmNotes`, `combatNotes`, `shopCurrency`, `progressBars`, `rollHistory`, `lootList`, `nameStyle`, `diceQty`, `diceBonus`, `customDiceSides`, `multiRollResults`, `isTimerRunning`, `timerTime`, `timerInput`, `generatedNames`, `progressData`, or `extrasTab`

Run: `npx vitest run`
Expected: PASS (full suite)

Run: `grep -rn "extras\|Extras" App.tsx utils/database.ts utils/atmosphere.ts utils/sectionTheme.ts components/nav/navModel.ts`
Expected: no output (zero remaining references)

- [ ] **Step 9: Manual smoke check**

Run: `npm run dev` (or the project's existing dev-server command), open the app, and confirm:
- The nav no longer shows an "Extras" destination, and pressing `4` (previously Extras) does nothing harmful (falls through, since `NAV_ORDER` now has only 3 entries)
- Switching between Cena / Personagens / Arsenal still works
- Opening the upgrade-purchase modal (Personagens tab → buy an upgrade) still shows the cost line without a JS error

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor(app): remove completamente a aba Extras e todo o estado associado"
```

---

## Plan self-review notes

- **Spec coverage:** Round clock (Task 1–2), card art (Task 3–4), Extras removal (Task 5–7) — all three spec sections have corresponding tasks.
- **Deviation from spec:** the spec assumed `characterCurrencies` was purely an Extras concern; investigation during planning (grep across `App.tsx`) found it's also read in the upgrade-purchase modal (`App.tsx` line ~4605) with no code path that ever writes to it besides the Extras restore flow being deleted. Task 7 keeps the state and simplifies the dead balance display instead of deleting it outright — flagged explicitly in Step 6 so this isn't a silent surprise.
- **Type consistency:** `buildClockGradient(total, litSegments)` signature is used identically in its test (Task 1) and in `RoundClock`'s call site (Task 2). `ResolvedAction.image` is read the same way (`selected.image`) in both `utils/actions.test.ts` assertions and `ActionMenu.tsx`.
