# Formas ativáveis + auras dos tokens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o token do personagem do turno acender um anel de chamas quando alguma forma é ativável, abrir um popover para ativar/trocar/reverter passando pelo pipeline canônico (custo de Aura, cooldown, gatilhos, bônus de PV/Aura), trocar ícone + aura na cor da forma, e redesenhar as auras dos tokens em camadas.

**Architecture:** Um helper puro novo (`activatableForms`) reusa a validação do pipeline (`resolveArsenalAction`) para decidir a disponibilidade — a fonte de verdade do anel e do popover. `CenaTab` deriva o estado visual por token e um handler de ativação/reversão que aplica bônus e mantém `ActiveFormaState`. `MapBoard` ganha o anel, a troca de ícone e o popover. O CSS das auras (em `SceneBackdrop`) passa a compor camadas por raio.

**Tech Stack:** React + TypeScript, Vitest + @testing-library/react, Vite. CSS inline em `<style>` dentro de `SceneBackdrop.tsx`.

---

## File Structure

- `utils/arsenal.ts` — adiciona `durationRounds?` a `FormModule` (tipo).
- `utils/cena.ts` — estende `ActiveFormaState` com `hpBonusApplied` / `auraBonusApplied`.
- `utils/arsenalState.ts` — novo helper puro `activatableForms` + tipo `FormAvailability`. **Responsabilidade:** decidir quais formas o ator pode ativar e por quê.
- `utils/arsenalState.test.ts` — testes do helper (arquivo novo).
- `tabs/cena/FormaPopover.tsx` — componente novo do popover de seleção de forma. **Responsabilidade:** listar formas (ok/bloqueadas), ativar/reverter.
- `tabs/cena/FormaPopover.test.tsx` — testes do popover (arquivo novo).
- `tabs/cena/MapBoard.tsx` — recebe `formaState` por token; renderiza anel de chamas, ícone trocado, aura colorida e ancora o popover.
- `tabs/cena/MapBoard.test.tsx` — testes do anel/aura/ícone.
- `tabs/CenaTab.tsx` — helper `activateFormaForTurnActor` / `revertForma`; deriva `formaStates`; expiração no `goNextTurn`; passa props ao `MapBoard`.
- `tabs/cena/SceneBackdrop.tsx` — CSS: redesign das auras em camadas + estilos do anel/popover.
- `components/arsenal/ArsenalCardEditor.tsx` — campos de forma (cor, ícone, bônus, removidas, duração).

---

## Task 1: Estender o modelo (`FormModule` + `ActiveFormaState`)

**Files:**
- Modify: `utils/arsenal.ts` (interface `FormModule`, ~linha 193)
- Modify: `utils/cena.ts` (interface `ActiveFormaState`, linha 46)

- [ ] **Step 1: Adicionar `durationRounds` a `FormModule`**

Em `utils/arsenal.ts`, na interface `FormModule`, adicione o campo opcional após `iconOverride`:

```ts
export interface FormModule {
  grantedAbilityIds: string[];
  removedAbilityIds: string[];
  hpBonus: number;
  auraBonus: number;
  color?: string;
  iconOverride?: string;
  /** Duração em rodadas. null/ausente = permanente até reverter ou o combate acabar. */
  durationRounds?: number | null;
}
```

- [ ] **Step 2: Estender `ActiveFormaState` com os bônus aplicados**

Em `utils/cena.ts`, substitua a interface na linha 46:

```ts
/** Forma (transformação) ativa. roundsRemaining 0 = permanente até o fim do combate. */
export interface ActiveFormaState {
  ownerId: string;
  entryId: string;
  roundsRemaining: number;
  /** Quanto de maxHp a forma somou, para desfazer ao reverter. */
  hpBonusApplied: number;
  /** Quanto de maxAura a forma somou, para desfazer ao reverter. */
  auraBonusApplied: number;
}
```

- [ ] **Step 3: Verificar a compilação de tipos**

Run: `npx tsc --noEmit`
Expected: PASS (os campos são opcionais/novos; nenhum consumidor existente escreve `ActiveFormaState` com literal fechado — se `tsc` apontar algum literal de `ActiveFormaState` sem os novos campos, corrija adicionando `hpBonusApplied: 0, auraBonusApplied: 0`).

- [ ] **Step 4: Commit**

```bash
git add utils/arsenal.ts utils/cena.ts
git commit -m "feat(arsenal): duração de forma e bônus aplicados no estado ativo"
```

---

## Task 2: Helper puro `activatableForms`

**Files:**
- Modify: `utils/arsenalState.ts`
- Test: `utils/arsenalState.test.ts` (criar)

O helper reaproveita a validação canônica chamando `resolveArsenalAction` em modo dry-run (alvo = próprio ator) e lendo `status`/`reason`. Uma forma já ativa é marcada `isActive` e considerada `ok:false` para ativação (reverter/trocar é tratado na UI).

- [ ] **Step 1: Escrever o teste que falha**

Crie `utils/arsenalState.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { activatableForms } from './arsenalState';
import { createArsenalCard, type ArsenalCard } from './arsenal';
import type { ArsenalActorState } from './arsenalPipeline';

function forma(id: string, over: Partial<ArsenalCard> = {}): ArsenalCard {
  return {
    ...createArsenalCard(),
    id, name: id, category: 'habilidade', abilityType: 'forma',
    form: { grantedAbilityIds: [], removedAbilityIds: [], hpBonus: 0, auraBonus: 0 },
    ...over,
  };
}

function actor(over: Partial<ArsenalActorState> = {}): ArsenalActorState {
  return {
    id: 'a1', teamId: 'party', name: 'Herói', currentHp: 20, maxHp: 20,
    currentAura: 10, maxAura: 10, defense: 10, speed: 0, tags: [],
    equippedWeaponIds: [], activeFormIds: [], effects: [], holdings: [],
    isCurrentTurn: true, inCombat: true, ...over,
  };
}

describe('activatableForms', () => {
  it('marca ok quando o ator possui a forma e cumpre os requisitos', () => {
    const ignea = forma('ignea', { auraConsumed: { flat: 4, dice: null } });
    const result = activatableForms(
      actor({ holdings: [{ cardId: 'ignea', quantity: 1, equipped: false, active: false }] }),
      [ignea],
      { holdings: [{ cardId: 'ignea', quantity: 1, equipped: false, active: false }], equippedWeaponIds: [], activeFormIds: [] },
    );
    expect(result).toHaveLength(1);
    expect(result[0].card.id).toBe('ignea');
    expect(result[0].ok).toBe(true);
    expect(result[0].isActive).toBe(false);
  });

  it('bloqueia por aura insuficiente com motivo', () => {
    const cara = forma('cara', { auraConsumed: { flat: 99, dice: null } });
    const holdings = [{ cardId: 'cara', quantity: 1, equipped: false, active: false }];
    const result = activatableForms(actor({ holdings }), [cara], { holdings, equippedWeaponIds: [], activeFormIds: [] });
    expect(result[0].ok).toBe(false);
    expect(result[0].reason).toMatch(/aura/i);
  });

  it('marca isActive e ok:false para a forma já ativa', () => {
    const ativa = forma('ativa');
    const holdings = [{ cardId: 'ativa', quantity: 1, equipped: false, active: true }];
    const result = activatableForms(
      actor({ holdings, activeFormIds: ['ativa'] }),
      [ativa],
      { holdings, equippedWeaponIds: [], activeFormIds: ['ativa'] },
    );
    expect(result[0].isActive).toBe(true);
    expect(result[0].ok).toBe(false);
  });

  it('ignora formas que o ator não possui', () => {
    const naoPossui = forma('x');
    const result = activatableForms(actor(), [naoPossui], { holdings: [], equippedWeaponIds: [], activeFormIds: [] });
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run utils/arsenalState.test.ts`
Expected: FAIL com "activatableForms is not a function" (ou de exportação).

- [ ] **Step 3: Implementar o helper**

No topo de `utils/arsenalState.ts`, ajuste os imports e acrescente o helper. Atualize a linha de import existente para incluir os tipos usados:

```ts
import type { ArsenalCard, ArsenalHolding, TriggerEvent } from './arsenal';
import { resolveArsenalAction, type ArsenalActorState } from './arsenalPipeline';
```

No fim do arquivo:

```ts
export interface FormAvailability {
  card: ArsenalCard;
  ok: boolean;
  reason: string | null;
  isActive: boolean;
}

/** Decide quais formas do catálogo o ator pode ativar agora, reusando a validação
 *  canônica do pipeline. A forma já ativa aparece com isActive=true e ok=false. */
export function activatableForms(
  actor: ArsenalActorState,
  catalog: readonly ArsenalCard[],
  loadout: ArsenalLoadout,
): FormAvailability[] {
  const owned = new Set(loadout.holdings.filter(h => h.quantity > 0).map(h => h.cardId));
  const forms = catalog.filter(card => card.abilityType === 'forma' && owned.has(card.id));
  return forms.map(card => {
    const isActive = loadout.activeFormIds.includes(card.id);
    if (isActive) return { card, ok: false, reason: null, isActive };
    const dryRun = resolveArsenalAction({ card, actor, targets: [actor] });
    const ok = dryRun.status !== 'bloqueada';
    return { card, ok, reason: ok ? null : dryRun.reason ?? 'Indisponível', isActive };
  });
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run utils/arsenalState.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add utils/arsenalState.ts utils/arsenalState.test.ts
git commit -m "feat(arsenal): helper activatableForms reusa validação do pipeline"
```

---

## Task 3: Handlers de ativação/reversão no CenaTab

**Files:**
- Modify: `tabs/CenaTab.tsx` (imports linha 22-23; região dos handlers ~370-408; `goNextTurn` ~410-495)

Cria os handlers que ativam/revertem forma passando pelo pipeline, aplicam/desfazem bônus de PV/Aura, mantêm `ActiveFormaState` e o clique atual da carta de forma no rail. Esta task não tem teste unitário próprio (a lógica pura já é coberta pelo pipeline e por `activatableForms`); a verificação é por `tsc` + smoke manual. Os testes de componente vêm nas Tasks 5-6.

- [ ] **Step 1: Ajustar imports**

Em `tabs/CenaTab.tsx` linha 22, adicione `activatableForms` e `type FormAvailability`:

```ts
import { activatableForms, activateForm, availableCardIds, comboStackCandidates, equipWeapon, resolveComboCards, type FormAvailability } from '../utils/arsenalState';
```

- [ ] **Step 2: Escrever o handler de ativação/reversão**

Logo após a definição de `applyArsenalActor` (termina na linha 167), adicione:

```ts
  const persistCharacter = (cur: CenaState, id: string, updates: Partial<Character>): CenaState => {
    if (party.some(p => p.id === id)) { updateCharacterStats(id, updates); return cur; }
    return updateNpcStats(cur, id, updates);
  };

  const revertForma = (cur: CenaState, character: Character): CenaState => {
    const state = cur.encounter.activeFormas.find(f => f.ownerId === character.id);
    const loadout = loadoutOf(character);
    const activeId = loadout.activeFormIds[0];
    const next = activateForm(loadout, null);
    const nextMaxHp = Math.max(1, character.maxHp - (state?.hpBonusApplied ?? 0));
    const nextMaxAura = Math.max(0, character.maxAura - (state?.auraBonusApplied ?? 0));
    let result: CenaState = persistCharacter(cur, character.id, {
      arsenal: next.holdings,
      maxHp: nextMaxHp,
      currentHp: Math.min(character.currentHp, nextMaxHp),
      maxAura: nextMaxAura,
      currentAura: Math.min(character.currentAura, nextMaxAura),
    });
    result = { ...result, encounter: { ...result.encounter, activeFormas: result.encounter.activeFormas.filter(f => f.ownerId !== character.id) } };
    const formaCard = leveledArsenal.find(c => c.id === activeId);
    if (formaCard) result = appendLog(result, [logEntry('system', `${character.name} deixa a forma ${formaCard.name}.`)]);
    return result;
  };

  const activateFormaFor = (character: Character, formId: string) => {
    // Se já há forma ativa, reverte antes (troca paga o custo da nova).
    let cur = cena;
    const already = loadoutOf(character).activeFormIds[0];
    if (already && already !== formId) cur = revertForma(cur, character);
    else if (already === formId) { updateCena(revertForma(cur, character)); return; }
    const fresh = byIdIn(cur, character.id) ?? character;
    const formaCard = leveledArsenal.find(c => c.id === formId);
    if (!formaCard) return;
    const result = resolveArsenalAction({ card: formaCard, actor: actorStateIn(cur, fresh), targets: [actorStateIn(cur, fresh)] });
    if (result.status === 'bloqueada') { updateCena(appendLog(cur, [logEntry('system', `${fresh.name}: ${result.reason}.`)])); return; }
    const loadout = activateForm(loadoutOf(fresh), formId);
    const hpBonus = formaCard.form?.hpBonus ?? 0;
    const auraBonus = formaCard.form?.auraBonus ?? 0;
    // result.actor já pagou a aura do custo; somamos o bônus por cima.
    const newMaxHp = fresh.maxHp + hpBonus;
    const newMaxAura = fresh.maxAura + auraBonus;
    let next = persistCharacter(cur, fresh.id, {
      arsenal: loadout.holdings,
      maxHp: newMaxHp,
      currentHp: Math.min(newMaxHp, result.actor.currentHp + hpBonus),
      maxAura: newMaxAura,
      currentAura: Math.min(newMaxAura, result.actor.currentAura + auraBonus),
    });
    const rounds = formaCard.form?.durationRounds ?? 0;
    next = { ...next, encounter: { ...next.encounter, activeFormas: [
      ...next.encounter.activeFormas.filter(f => f.ownerId !== fresh.id),
      { ownerId: fresh.id, entryId: formId, roundsRemaining: rounds && rounds > 0 ? rounds : 0, hpBonusApplied: hpBonus, auraBonusApplied: auraBonus },
    ] } };
    next = appendLog(next, [logEntry('system', `${fresh.name} assume a forma ${formaCard.name}.`)]);
    updateCena(next);
  };
```

- [ ] **Step 3: Adicionar os utilitários `byIdIn` / `actorStateIn`**

`actorState`/`byId` leem do `cena` do closure. Para encadear (reverter → ativar) num estado intermediário, precisamos de versões que aceitam o `CenaState` corrente. Logo após `actorState` (linha 155), adicione:

```ts
  const byIdIn = (cur: CenaState, id: string): Character | null =>
    party.find(c => c.id === id) ?? cur.npcRoster.find(n => n.id === id) ?? null;

  const actorStateIn = (cur: CenaState, character: Character): ArsenalActorState => ({
    ...actorState(character),
    effects: [...(character.activeEffects ?? []), ...cur.encounter.fieldEffects.map(fe => ({ effect: fe.effect, stacks: 1, remaining: fe.roundsRemaining ?? undefined }))],
  });
```

Nota: para party, `byIdIn` cai no `party` do closure (as edições de party vão por `updateCharacterStats`, refletidas no próximo render). A troca de forma num mesmo tick lê os bônus via `state` de `activeFormas`, então não depende do `maxHp` recém-escrito do party.

- [ ] **Step 4: Trocar o toggle da carta de forma no rail**

Em `onSelectAction`, substitua o bloco `if(action.arsenalCard?.abilityType==='forma'&&turnActor){...}` (linhas 377-382) por:

```ts
    if(action.arsenalCard?.abilityType==='forma'&&turnActor){
      activateFormaFor(turnActor, action.id);
      return;
    }
```

- [ ] **Step 5: Expirar formas na virada de rodada (`goNextTurn`)**

Dentro de `goNextTurn`, imediatamente antes de `updateCena(next);` (linha 494), insira o decremento e a reversão automática:

```ts
    if (encNext.round !== cena.encounter.round && next.encounter.activeFormas.length) {
      const expiring: string[] = [];
      const survivors = next.encounter.activeFormas.map(f => {
        if (f.roundsRemaining <= 0) return f;
        const remaining = f.roundsRemaining - 1;
        if (remaining <= 0) { expiring.push(f.ownerId); return f; }
        return { ...f, roundsRemaining: remaining };
      });
      next = { ...next, encounter: { ...next.encounter, activeFormas: survivors } };
      for (const ownerId of expiring) {
        const owner = currentCharacter(ownerId);
        if (owner) next = revertForma(next, owner);
      }
    }
```

- [ ] **Step 6: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Rodar os testes existentes do CenaTab**

Run: `npx vitest run tabs/CenaTab.test.tsx`
Expected: PASS (nenhuma regressão).

- [ ] **Step 8: Commit**

```bash
git add tabs/CenaTab.tsx
git commit -m "feat(cena): ativar/reverter forma pelo pipeline com bônus e expiração"
```

---

## Task 4: Componente `FormaPopover`

**Files:**
- Create: `tabs/cena/FormaPopover.tsx`
- Test: `tabs/cena/FormaPopover.test.tsx` (criar)

- [ ] **Step 1: Escrever o teste que falha**

Crie `tabs/cena/FormaPopover.test.tsx`:

```ts
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import FormaPopover from './FormaPopover';
import { createArsenalCard, type ArsenalCard } from '../../utils/arsenal';
import type { FormAvailability } from '../../utils/arsenalState';

afterEach(() => cleanup());

function forma(id: string, name: string): ArsenalCard {
  return { ...createArsenalCard(), id, name, category: 'habilidade', abilityType: 'forma',
    form: { grantedAbilityIds: [], removedAbilityIds: [], hpBonus: 0, auraBonus: 0 } };
}

const items: FormAvailability[] = [
  { card: forma('ignea', 'Forma Ígnea'), ok: true, reason: null, isActive: false },
  { card: forma('lunar', 'Forma Lunar'), ok: false, reason: 'Vida acima do limite', isActive: false },
];

describe('FormaPopover', () => {
  it('lista formas disponíveis e bloqueadas com o motivo', () => {
    render(<FormaPopover forms={items} onActivate={() => {}} onRevert={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Forma Ígnea')).toBeTruthy();
    expect(screen.getByText('Forma Lunar')).toBeTruthy();
    expect(screen.getByText(/vida acima do limite/i)).toBeTruthy();
  });

  it('ativa a forma ao clicar num item disponível', () => {
    const onActivate = vi.fn();
    render(<FormaPopover forms={items} onActivate={onActivate} onRevert={() => {}} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Forma Ígnea'));
    expect(onActivate).toHaveBeenCalledWith('ignea');
  });

  it('não ativa ao clicar num item bloqueado', () => {
    const onActivate = vi.fn();
    render(<FormaPopover forms={items} onActivate={onActivate} onRevert={() => {}} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Forma Lunar'));
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('oferece reverter quando há forma ativa', () => {
    const onRevert = vi.fn();
    const active: FormAvailability[] = [{ card: forma('ignea', 'Forma Ígnea'), ok: false, reason: null, isActive: true }];
    render(<FormaPopover forms={active} onActivate={() => {}} onRevert={onRevert} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /reverter/i }));
    expect(onRevert).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npx vitest run tabs/cena/FormaPopover.test.tsx`
Expected: FAIL com "Cannot find module './FormaPopover'".

- [ ] **Step 3: Implementar o componente**

Crie `tabs/cena/FormaPopover.tsx`:

```tsx
import React from 'react';
import type { FormAvailability } from '../../utils/arsenalState';

interface FormaPopoverProps {
  forms: FormAvailability[];
  onActivate: (formId: string) => void;
  onRevert: () => void;
  onClose: () => void;
}

const auraCost = (card: FormAvailability['card']): number =>
  (card.auraConsumed?.flat ?? 0);

const FormaPopover: React.FC<FormaPopoverProps> = ({ forms, onActivate, onRevert, onClose }) => {
  const hasActive = forms.some(f => f.isActive);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="cena-forma-popover" role="menu" aria-label="Selecionar forma" onPointerDown={e => e.stopPropagation()}>
      <div className="cena-forma-popover__head">FORMAS</div>
      {forms.map(({ card, ok, reason, isActive }) => (
        <button
          key={card.id}
          role="menuitem"
          className={`cena-forma-popover__item${ok ? '' : ' is-blocked'}${isActive ? ' is-active' : ''}`}
          disabled={!ok && !isActive}
          onClick={() => { if (isActive) onRevert(); else if (ok) onActivate(card.id); }}
        >
          <span className="cena-forma-popover__icon" style={{ ['--forma-color' as string]: card.form?.color ?? '#f59e0b', backgroundImage: card.form?.iconOverride ? `url(${card.form.iconOverride})` : undefined }} />
          <span className="cena-forma-popover__body">
            <strong>{card.name}</strong>
            <small>{isActive ? 'Ativa · toque para reverter' : ok ? `${auraCost(card)} aura${card.form?.durationRounds ? ` · ${card.form.durationRounds} rodadas` : ''}` : reason}</small>
          </span>
        </button>
      ))}
      {hasActive && <button className="cena-forma-popover__revert" onClick={onRevert}>Reverter forma</button>}
    </div>
  );
};

export default FormaPopover;
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tabs/cena/FormaPopover.test.tsx`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add tabs/cena/FormaPopover.tsx tabs/cena/FormaPopover.test.tsx
git commit -m "feat(cena): popover de seleção de forma"
```

---

## Task 5: MapBoard — anel de chamas, ícone trocado e ancoragem do popover

**Files:**
- Modify: `tabs/cena/MapBoard.tsx`
- Test: `tabs/cena/MapBoard.test.tsx`

`MapBoard` recebe um mapa `formaStates` por id de token e um callback `onFormaClick`. Renderiza o anel (`available`/`active`), troca o ícone quando ativo e ancora o `FormaPopover` no token aberto (controlado pelo pai via `openFormaId`).

- [ ] **Step 1: Escrever o teste que falha**

Adicione ao final de `tabs/cena/MapBoard.test.tsx` (antes do fechamento do arquivo), e ajuste o import do topo para trazer o tipo:

```ts
describe('MapBoard formas', () => {
  it('acende o anel de chamas quando a forma está disponível', () => {
    const { container } = render(<MapBoard image="x.png" participants={[ch('p1', 'Shinkai')]} tokens={{}} activeId="p1" onMoveToken={() => {}} onSelect={() => {}} combat
      formaStates={{ p1: { ring: 'available' } }} onFormaClick={() => {}} />);
    expect(container.querySelector('.cena-token__forma-ring.is-available')).toBeTruthy();
  });

  it('usa o ícone e a cor da forma quando ativa', () => {
    const { container } = render(<MapBoard image="x.png" participants={[ch('p1', 'Shinkai')]} tokens={{}} activeId="p1" onMoveToken={() => {}} onSelect={() => {}} combat
      formaStates={{ p1: { ring: 'active', color: '#a855f7', iconOverride: 'lua.png' } }} onFormaClick={() => {}} />);
    const ring = container.querySelector('.cena-token__forma-ring.is-active') as HTMLElement;
    expect(ring).toBeTruthy();
    expect(ring.style.getPropertyValue('--forma-color')).toBe('#a855f7');
  });

  it('dispara onFormaClick ao clicar no anel disponível', () => {
    const onFormaClick = vi.fn();
    const { container } = render(<MapBoard image="x.png" participants={[ch('p1', 'Shinkai')]} tokens={{}} activeId="p1" onMoveToken={() => {}} onSelect={() => {}} combat
      formaStates={{ p1: { ring: 'available' } }} onFormaClick={onFormaClick} />);
    fireEvent.click(container.querySelector('.cena-token__forma-ring') as HTMLElement);
    expect(onFormaClick).toHaveBeenCalledWith('p1');
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npx vitest run tabs/cena/MapBoard.test.tsx`
Expected: FAIL (prop `formaStates` inexistente; sem `.cena-token__forma-ring`).

- [ ] **Step 3: Estender a interface e a assinatura**

Em `tabs/cena/MapBoard.tsx`, adicione o tipo e amplie `MapBoardProps` (após a linha 26) e a desestruturação (linha 38):

```ts
export interface TokenFormaState {
  ring: 'none' | 'available' | 'active';
  color?: string;
  iconOverride?: string;
}
```

Dentro de `MapBoardProps`:

```ts
  formaStates?: Record<string, TokenFormaState>;
  onFormaClick?: (id: string) => void;
```

Na assinatura do componente:

```ts
const MapBoard: React.FC<MapBoardProps> = ({ image, participants, tokens, activeId, onMoveToken, onSelect, combat = false, enemyIds = [], targetEffect, formaStates = {}, onFormaClick }) => {
```

- [ ] **Step 4: Renderizar o anel e trocar o ícone**

Dentro do `.map` de participantes, calcule o estado e injete o anel. Substitua o cálculo de `hp` e o bloco `return <div ...>` (linhas 111-134) de forma que:

1. Após `const hp = ...` adicione:

```ts
      const forma = formaStates[participant.id] ?? { ring: 'none' as const };
      const tokenImage = forma.ring === 'active' && forma.iconOverride ? forma.iconOverride : participant.icon;
```

2. No `style` do token, troque `participant.icon ? url(${participant.icon})` por `tokenImage`:

```ts
        style={{ left: `${position.x}%`, top: `${position.y}%`, '--token-hp': `${hp * 3.6}deg`, '--token-image': tokenImage ? `url(${tokenImage})` : 'none' } as React.CSSProperties}>
```

3. Logo após `<div className="cena-token__runes">✦</div>` (linha 116), adicione o anel:

```tsx
        {forma.ring !== 'none' && <button
          type="button"
          className={`cena-token__forma-ring is-${forma.ring}`}
          style={{ ['--forma-color' as string]: forma.color ?? '#f59e0b' }}
          aria-label={forma.ring === 'available' ? `Ativar forma de ${participant.name}` : `Forma de ${participant.name}`}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onFormaClick?.(participant.id); }}
        >
          {forma.ring === 'available' && Array.from({ length: 6 }, (_, i) => <i key={i} style={{ ['--flame-i' as string]: i } as React.CSSProperties} />)}
        </button>}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx vitest run tabs/cena/MapBoard.test.tsx`
Expected: PASS (todos, incluindo os novos).

- [ ] **Step 6: Commit**

```bash
git add tabs/cena/MapBoard.tsx tabs/cena/MapBoard.test.tsx
git commit -m "feat(cena): anel de forma e troca de ícone no MapBoard"
```

---

## Task 6: Ligar CenaTab → MapBoard → FormaPopover

**Files:**
- Modify: `tabs/CenaTab.tsx` (estado do popover; derivação de `formaStates`; render do `MapBoard`; render do popover)

- [ ] **Step 1: Estado do popover e derivação dos estados por token**

Após os `useState` existentes (por volta da linha 66), adicione:

```ts
  const [openFormaId, setOpenFormaId] = React.useState<string | null>(null);
```

Após `activeArsenalWeapons` (linha 129), derive as formas disponíveis do ator do turno e o mapa de estados por token:

```ts
  const turnFormAvailability: FormAvailability[] = React.useMemo(() => {
    if (!turnActor) return [];
    return activatableForms(actorState(turnActor), leveledArsenal, loadoutOf(turnActor));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnActor?.id, turnActor?.currentAura, turnActor?.arsenal, leveledArsenal]);

  const formaStates: Record<string, import('./cena/MapBoard').TokenFormaState> = {};
  for (const p of participants) {
    const activeForma = cena.encounter.activeFormas.find(f => f.ownerId === p.id);
    if (activeForma) {
      const card = leveledArsenal.find(c => c.id === activeForma.entryId);
      formaStates[p.id] = { ring: 'active', color: card?.form?.color, iconOverride: card?.form?.iconOverride };
    } else if (p.id === turnActor?.id && turnFormAvailability.some(f => f.ok)) {
      formaStates[p.id] = { ring: 'available' };
    }
  }
```

- [ ] **Step 2: Passar as props ao `MapBoard`**

Substitua o elemento `<MapBoard .../>` (linhas 546-550) por:

```tsx
          <MapBoard image={cena.scene.image} participants={participants} tokens={cena.tokens}
            activeId={combat ? (turnEntry?.refId ?? null) : (active?.id ?? null)}
            onMoveToken={(id, pos) => updateCena(setToken(cena, id, pos))}
            onSelect={onParticipantClick}
            combat={combat} enemyIds={presentNpcs.map(n => n.id)} targetEffect={targetEffect}
            formaStates={formaStates}
            onFormaClick={id => setOpenFormaId(cur => (cur === id ? null : id))} />
```

- [ ] **Step 3: Renderizar o popover ancorado**

Importe o componente no topo (após a linha 16):

```ts
import FormaPopover from './cena/FormaPopover';
```

O popover é posicionado sobre o token. Renderize-o dentro de `.cena-arena-stage`, logo após o `MapBoard` (após a linha do `</MapBoard>` fechado, dentro da mesma `<div className="cena-arena-stage">`):

```tsx
          {openFormaId && (() => {
            const pos = cena.tokens[openFormaId] ?? { x: 50, y: 50 };
            const openChar = byId(openFormaId);
            const forms = openChar
              ? (openChar.id === turnActor?.id
                  ? turnFormAvailability
                  : activatableForms(actorState(openChar), leveledArsenal, loadoutOf(openChar)))
              : [];
            return (
              <div className="cena-forma-anchor" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                <FormaPopover
                  forms={forms}
                  onActivate={id => { if (openChar) { activateFormaFor(openChar, id); } setOpenFormaId(null); }}
                  onRevert={() => { if (openChar) { updateCena(revertForma(cena, openChar)); } setOpenFormaId(null); }}
                  onClose={() => setOpenFormaId(null)}
                />
              </div>
            );
          })()}
```

- [ ] **Step 4: Fechar o popover ao clicar fora**

No handler `onParticipantClick` (linha 398), feche o popover quando um clique de seleção acontecer sem ser no anel. Adicione como primeira linha do corpo:

```ts
    setOpenFormaId(null);
```

- [ ] **Step 5: Verificar tipos e testes**

Run: `npx tsc --noEmit && npx vitest run tabs/CenaTab.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tabs/CenaTab.tsx
git commit -m "feat(cena): liga anel de forma e popover ao estado do turno"
```

---

## Task 7: CSS — anel de chamas, popover e redesign das auras em camadas

**Files:**
- Modify: `tabs/cena/SceneBackdrop.tsx` (bloco de CSS dos tokens, linhas 55-65; keyframes)

Substitui o pisca-pisca (`is-active` com `cena-token-aura`, `is-low` só trocando `--ring`) pela linguagem em camadas: vida baixa = batimento no aro interno; turno atual = runas girando + halo; forma = anel externo colorido. Cada estado num raio próprio. Respeita `prefers-reduced-motion`.

- [ ] **Step 1: Reescrever os estados de token**

Em `tabs/cena/SceneBackdrop.tsx`, substitua as regras `.cena-token.is-active` (linha 57) e `.cena-token.is-low` (linha 59) por:

```css
      .cena-token.is-active { width:80px;height:80px; z-index:8; animation:cena-token-in .38s cubic-bezier(.2,.9,.25,1) both; }
      .cena-token.is-active::after { content:'';position:absolute;inset:-9px;border-radius:50%;border:1.5px dashed #c4a66b;box-shadow:0 0 16px #c4a66b66;animation:cena-forma-spin 9s linear infinite;pointer-events:none;z-index:-1; }
      .cena-token.is-active::before { content:'';position:absolute;inset:-14px;border-radius:50%;box-shadow:0 0 22px 6px #c4a66b44;animation:cena-token-breathe 2.6s ease-in-out infinite;pointer-events:none;z-index:-2; }
      .cena-token.is-low .cena-token__portrait { box-shadow:inset 0 0 0 2px #d02a31,0 0 0 2px #d02a31; animation:cena-token-hpbeat 1.1s ease-in-out infinite; }
```

- [ ] **Step 2: Estilizar o anel de forma e o popover**

Logo após a regra `.cena-token__gem` (linha 63), acrescente:

```css
      .cena-token__forma-ring { position:absolute;inset:-11px;border-radius:50%;border:2px solid var(--forma-color,#f59e0b);background:transparent;cursor:pointer;padding:0;z-index:9;pointer-events:auto; }
      .cena-token__forma-ring.is-available { box-shadow:0 0 14px var(--forma-color,#f59e0b),inset 0 0 8px color-mix(in srgb,var(--forma-color,#f59e0b) 40%,transparent);animation:cena-token-breathe 1.6s ease-in-out infinite; }
      .cena-token__forma-ring.is-active { border-width:2px;box-shadow:0 0 20px 6px color-mix(in srgb,var(--forma-color,#a855f7) 55%,transparent),inset 0 0 12px color-mix(in srgb,var(--forma-color,#a855f7) 45%,transparent);animation:cena-token-breathe 3.2s ease-in-out infinite;cursor:pointer; }
      .cena-token__forma-ring i { position:absolute;left:50%;top:-7px;width:7px;height:13px;border-radius:50% 50% 50% 50%/70% 70% 30% 30%;background:var(--forma-color,#fb923c);box-shadow:0 0 6px var(--forma-color,#f97316);transform-origin:center 40px;transform:rotate(calc(var(--flame-i) * 60deg));animation:cena-flame-flicker 1.1s ease-in-out infinite alternate;animation-delay:calc(var(--flame-i) * 90ms); }
      .cena-forma-anchor { position:absolute;z-index:30;transform:translate(-50%,-50%);pointer-events:none; }
      .cena-forma-popover { position:absolute;left:44px;top:-40px;min-width:196px;background:#1d1610f2;border:1px solid #b4590066;border-radius:10px;padding:8px;box-shadow:0 8px 24px #000a;pointer-events:auto;backdrop-filter:blur(10px); }
      .cena-forma-popover__head { font:700 10px 'Barlow Semi Condensed',sans-serif;letter-spacing:.14em;color:#c9a86a;padding:2px 6px 6px; }
      .cena-forma-popover__item { display:flex;align-items:center;gap:9px;width:100%;padding:7px 8px;border:none;background:transparent;border-radius:8px;cursor:pointer;text-align:left; }
      .cena-forma-popover__item:hover:not(:disabled) { background:#2a2016; }
      .cena-forma-popover__item.is-blocked { opacity:.45;cursor:default; }
      .cena-forma-popover__item.is-active { background:#2a2016; }
      .cena-forma-popover__icon { width:30px;height:30px;flex:none;border-radius:50%;border:2px solid var(--forma-color,#f59e0b);background:#241c14 center/cover; }
      .cena-forma-popover__body { display:flex;flex-direction:column;min-width:0; }
      .cena-forma-popover__body strong { color:#f5e9d4;font:600 12.5px 'Barlow Semi Condensed',sans-serif; }
      .cena-forma-popover__body small { color:#8a7a63;font:500 11px 'Barlow Semi Condensed',sans-serif; }
      .cena-forma-popover__revert { width:100%;margin-top:6px;padding:7px;border:1px solid #7a3b3b;background:#241414;color:#f0a5a5;border-radius:8px;cursor:pointer;font:700 11px 'Barlow Semi Condensed',sans-serif; }
```

- [ ] **Step 3: Adicionar as keyframes**

Localize as keyframes existentes (`@keyframes cena-token-aura` está numa linha longa ~203). Adicione, junto às outras keyframes de token (pode ser logo após a regra `@keyframes cena-token-aura`), as novas:

```css
      @keyframes cena-forma-spin { to { transform:rotate(360deg); } }
      @keyframes cena-token-breathe { 0%,100% { opacity:.55;transform:scale(.97); } 50% { opacity:1;transform:scale(1.04); } }
      @keyframes cena-token-hpbeat { 0%,100% { box-shadow:inset 0 0 0 2px #d02a3155,0 0 4px #d02a3155; } 45% { box-shadow:inset 0 0 0 2px #d02a31,0 0 14px #d02a31aa; } }
      @keyframes cena-flame-flicker { 0% { opacity:1;transform:rotate(calc(var(--flame-i) * 60deg)) scaleY(1); } 100% { opacity:.6;transform:rotate(calc(var(--flame-i) * 60deg)) scaleY(1.25); } }
```

- [ ] **Step 4: Respeitar `prefers-reduced-motion`**

No fim do bloco de `<style>` (antes do fechamento `</style>` do bloco principal de tokens), adicione:

```css
      @media (prefers-reduced-motion: reduce) {
        .cena-token.is-active::after,.cena-token.is-active::before,.cena-token.is-low .cena-token__portrait,.cena-token__forma-ring,.cena-token__forma-ring i { animation:none !important; }
      }
```

- [ ] **Step 5: Verificar no build e visualmente**

Run: `npx tsc --noEmit`
Expected: PASS.

Verificação visual manual (o usuário roda `npm run dev` localmente): no turno de um personagem com forma ativável, o anel âmbar de chamas aparece; clicar abre o popover; ativar troca o ícone e a aura fica na cor da forma; vida ≤25% mostra batimento; turno mostra runas girando.

- [ ] **Step 6: Commit**

```bash
git add tabs/cena/SceneBackdrop.tsx
git commit -m "style(cena): auras em camadas, anel de chamas e popover de forma"
```

---

## Task 8: Editor de cartas — campos de forma

**Files:**
- Modify: `components/arsenal/ArsenalCardEditor.tsx` (linha 276, ramo `card.abilityType==='forma'`; linha 170, criação do `form`)

- [ ] **Step 1: Incluir os novos campos no `form` default**

Na linha 170, ao trocar para `abilityType==='forma'`, o `form` já é criado com `grantedAbilityIds/removedAbilityIds/hpBonus/auraBonus`. Mantenha, mas garanta que `color`, `iconOverride` e `durationRounds` fiquem opcionais (nada a mudar aqui além de confirmar). Sem alteração de código nesta etapa se o default já contempla — prossiga.

- [ ] **Step 2: Ampliar a UI da seção "categoria" para forma**

Na linha 276, substitua o trecho `{card.abilityType==='forma'&&<CardPicker labelText="Habilidades liberadas pela forma" .../>}` por um bloco completo:

```tsx
{card.abilityType==='forma'&&<div style={{...grid,padding:16,border:'1px solid rgba(245,158,11,.25)',background:'rgba(120,53,15,.08)'}}>
  <CardPicker labelText="Habilidades liberadas pela forma" items={abilities} value={card.form?.grantedAbilityIds??[]} onChange={grantedAbilityIds=>patch({form:{...formDefaults(card),grantedAbilityIds}})}/>
  <CardPicker labelText="Habilidades removidas pela forma" items={abilities} value={card.form?.removedAbilityIds??[]} onChange={removedAbilityIds=>patch({form:{...formDefaults(card),removedAbilityIds}})}/>
  <NumberField labelText="Bônus de PV" value={card.form?.hpBonus??0} onChange={hpBonus=>patch({form:{...formDefaults(card),hpBonus}})}/>
  <NumberField labelText="Bônus de Aura" value={card.form?.auraBonus??0} onChange={auraBonus=>patch({form:{...formDefaults(card),auraBonus}})}/>
  <NumberField labelText="Duração (rodadas, 0 = permanente)" min={0} value={card.form?.durationRounds??0} onChange={durationRounds=>patch({form:{...formDefaults(card),durationRounds:durationRounds>0?durationRounds:null}})}/>
  <label><span style={label}>Cor da aura</span><input type="color" style={{...field,padding:4,height:40}} value={card.form?.color??'#f59e0b'} onChange={e=>patch({form:{...formDefaults(card),color:e.target.value}})}/></label>
  <div style={{gridColumn:'1/-1'}}><span style={label}>Ícone de transformação</span><ImagePickerButton value={card.form?.iconOverride??''} onChange={iconOverride=>patch({form:{...formDefaults(card),iconOverride}})} /></div>
</div>}
```

- [ ] **Step 3: Adicionar o helper `formDefaults` e o import do `ImagePickerButton`**

No topo de `components/arsenal/ArsenalCardEditor.tsx`, adicione o import (ajuste o caminho relativo conforme os outros imports do arquivo):

```ts
import ImagePickerButton from '../ui/ImagePickerButton';
```

Antes do `return` do componente (junto às outras funções auxiliares internas como `patch`), adicione:

```ts
  const formDefaults = (c: ArsenalCard): NonNullable<ArsenalCard['form']> => ({
    grantedAbilityIds: c.form?.grantedAbilityIds ?? [],
    removedAbilityIds: c.form?.removedAbilityIds ?? [],
    hpBonus: c.form?.hpBonus ?? 0,
    auraBonus: c.form?.auraBonus ?? 0,
    color: c.form?.color,
    iconOverride: c.form?.iconOverride,
    durationRounds: c.form?.durationRounds,
  });
```

- [ ] **Step 4: Confirmar a assinatura de `ImagePickerButton`**

Run: `npx tsc --noEmit`
Expected: PASS. Se `ImagePickerButton` usar props diferentes de `value`/`onChange`, ajuste a chamada conforme a interface real (leia `components/ui/ImagePickerButton.tsx` e adapte — passe o texto do label esperado e o handler que recebe a string base64/URL).

- [ ] **Step 5: Rodar a suíte completa**

Run: `npx vitest run`
Expected: PASS (sem regressões).

- [ ] **Step 6: Commit**

```bash
git add components/arsenal/ArsenalCardEditor.tsx
git commit -m "feat(arsenal): editor de forma com cor, ícone, bônus e duração"
```

---

## Self-Review (feito na escrita)

- **Cobertura do spec:** modelo (Task 1), disponibilidade/anel (Task 2, 5, 6), popover (Task 4, 6), ativação via pipeline + bônus + expiração (Task 3), troca de ícone + aura colorida (Task 5, 7), redesign das auras (Task 7), editor (Task 8). Escopo "só tela do Mestre" respeitado (anel só no `turnActor`). ✔
- **Type consistency:** `FormAvailability` (Task 2) usado em Tasks 4/6; `TokenFormaState` (Task 5) importado em Task 6; `ActiveFormaState` com `hpBonusApplied`/`auraBonusApplied` (Task 1) escrito em Task 3 e lido em Task 3/6; `formDefaults` (Task 8) referenciado só na Task 8. ✔
- **Riscos conhecidos a validar na execução:**
  - Assinatura real de `ImagePickerButton` (Task 8, Step 4 cobre o ajuste).
  - `createArsenalCard` / `arsenalCardAtLevel` — confirmar o nome exportado do factory usado nos testes (Task 2 usa `createArsenalCard`; se o export for outro, ajuste o import). Ler `utils/arsenal.ts` para o nome exato antes de escrever o teste.
  - Posição exata das linhas em `CenaTab.tsx`/`SceneBackdrop.tsx` pode variar após commits anteriores — usar âncoras por conteúdo, não por número de linha.
