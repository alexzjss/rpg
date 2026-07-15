# Aba "Cena" — Fase 1: Fundação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o esqueleto da aba unificada **Cena** (modelo de dados próprio, persistência, navegação 5→4, tema brasa) e plugá-la no App no lugar das abas Combate/Jornada, sem ainda construir a UI rica nem o combate.

**Architecture:** A aba Cena tem estado próprio (`CenaState`: cena + roster de NPCs + encounter + log) em `utils/cena.ts`, isolado dos tipos legados. A party continua sendo `Character` da aba Personagens (fonte única). O `database.ts` ganha persistência de `cena` (meta `__cena`, snapshot v4). Navegação e tema passam a conhecer o destino `cena`; as abas `combat`/`journey` saem da navegação (mas seu código só será removido na Fase 4).

**Tech Stack:** React 19 + TypeScript, Vite, Vitest + Testing Library, IndexedDB (via `utils/database.ts`).

**Verificação global usada nos passos:**
- Testes: `npx vitest run`
- Type-check: `npx tsc --noEmit`
- Build: `npm run build`

---

## Roadmap das 4 fases (contexto)

1. **Fase 1 — Fundação (ESTE PLANO):** modelo de dados `CenaState`, persistência, nav 5→4, tema brasa, scaffold da `CenaTab` plugada no App. Resultado: app compila, aba **Cena** aparece (placeholder), Combate/Jornada saem da navegação.
2. **Fase 2 — UI de exploração:** centro (arte do local + clima + personagem ativo), painel direito Party | NPCs (com Ocultos e botão +), painel esquerdo de Log + Notas, painéis inferiores Selos/Magias (esq.) e Cartas/Ações (dir.) do ativo. Sem combate.
3. **Fase 3 — Combate-lite:** lógica de encounter (rolar iniciativa de party + NPCs presentes, ordem de turnos, avançar turno/round), resolução de ações (cartas/selos/dados) escrevendo HP/Aura/condições e gerando entradas de log; faixa de turnos sobre a cena; botões Iniciar/Encerrar.
4. **Fase 4 — Limpeza/remoção:** apagar `tabs/CombatTab.tsx`, `tabs/JourneyTab.tsx`, `components/combat/*`, Cozinhar/Forjar/Loja (UI + tipos), `utils/combatMigration.ts`, campos de grid em `CombatState`, e a persistência/tipos legados de combat/journey.

> As Fases 2–4 serão expandidas em planos próprios e detalhados depois que a Fase 1 aterrissar e for revisada. Este documento só contém tarefas executáveis da Fase 1.

---

## Estrutura de arquivos (Fase 1)

- **Criar** `utils/cena.ts` — tipos `SceneState`, `NpcEntry`, `EncounterEntry`, `EncounterState`, `CenaLogEntry`, `CenaState`; defaults e `createDefaultCena()`.
- **Criar** `utils/cena.test.ts` — testes do factory/defaults.
- **Criar** `tabs/CenaTab.tsx` — componente scaffold (placeholder) com a assinatura de props da Fase 1.
- **Criar** `tabs/CenaTab.test.tsx` — smoke test de render.
- **Modificar** `utils/atmosphere.ts` — adicionar `'cena'` a `TabId` e ao mapa de atmosfera (`dark`).
- **Modificar** `utils/atmosphere.test.ts` — cobrir `cena`.
- **Modificar** `utils/sectionTheme.ts` — adicionar `CENA_VARS` (brasa) e entrada em `SECTION_THEMES`.
- **Modificar** `utils/sectionTheme.test.ts` — cobrir `cena`.
- **Modificar** `components/nav/navModel.ts` — `cena` como único modo; `NAV_ORDER` com 4 destinos; manter `combat`/`journey` em `NAV_DESTS` (ainda são `TabId`).
- **Modificar** `components/nav/navModel.test.ts` — refletir 1 modo / 4 destinos.
- **Modificar** `components/nav/useKeyboardNav.ts` — faixa de teclas `'1'..'4'`.
- **Modificar** `components/nav/useKeyboardNav.test.ts` — refletir nova ordem.
- **Modificar** `utils/database.ts` — persistir `CenaState` (default, ensure, snapshot v4, load, sync, update, restore).
- **Modificar** `App.tsx` — `AppTab`/`activeTab` ganham `'cena'` e default `'cena'`; `TAB_META` ganha `cena`; estado `cena`/`setCena`; boot+sync de cena; `updateCena`; render da `CenaTab`.

---

## Task 1: Modelo de dados da Cena (`utils/cena.ts`)

**Files:**
- Create: `utils/cena.ts`
- Test: `utils/cena.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `utils/cena.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createDefaultCena, DEFAULT_SCENE, DEFAULT_ENCOUNTER } from './cena';

describe('createDefaultCena', () => {
  it('cria um estado de cena vazio e coerente', () => {
    const cena = createDefaultCena();
    expect(cena.scene).toEqual(DEFAULT_SCENE);
    expect(cena.npcRoster).toEqual([]);
    expect(cena.encounter).toEqual(DEFAULT_ENCOUNTER);
    expect(cena.log).toEqual([]);
  });

  it('retorna cópias independentes (não compartilha referência de scene/encounter)', () => {
    const a = createDefaultCena();
    const b = createDefaultCena();
    a.scene.locationName = 'Mudou';
    a.encounter.round = 99;
    expect(b.scene.locationName).toBe(DEFAULT_SCENE.locationName);
    expect(b.encounter.round).toBe(1);
  });

  it('encounter começa inativo no round 1, turno 0, sem ordem', () => {
    const { encounter } = createDefaultCena();
    expect(encounter.isActive).toBe(false);
    expect(encounter.round).toBe(1);
    expect(encounter.turnIndex).toBe(0);
    expect(encounter.order).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run utils/cena.test.ts`
Expected: FAIL — `Cannot find module './cena'`.

- [ ] **Step 3: Implementar `utils/cena.ts`**

Create `utils/cena.ts`:

```ts
import type { Character } from '../types';

/** Clima da cena (mesma união usada na jornada legada, mantida por familiaridade). */
export type SceneWeather = 'sunny' | 'rain' | 'storm' | 'fog' | 'snow' | 'night';

/** Estado narrativo/ambiental do local atual. */
export interface SceneState {
  locationName: string;
  subtitle: string;
  image: string;
  weather: SceneWeather;
  isNight: boolean;
  notes: string;
}

/**
 * NPC/inimigo: mesma ficha de um Character, em roster próprio da aba.
 * `hidden` = oculto dos jogadores; `present` = está na cena atual (entra no combate).
 */
export interface NpcEntry extends Character {
  isNpc: true;
  hidden: boolean;
  present: boolean;
}

/** Uma entrada na ordem de iniciativa do encounter. */
export interface EncounterEntry {
  /** id do Character (party) ou do NpcEntry. */
  refId: string;
  side: 'party' | 'npc';
  initiative: number;
}

/** Estado de combate-lite (sem grid). */
export interface EncounterState {
  isActive: boolean;
  round: number;
  turnIndex: number;
  order: EncounterEntry[];
}

/** Uma linha do log automático (rolagens, dano, condições, sistema). */
export interface CenaLogEntry {
  id: string;
  kind: 'roll' | 'damage' | 'condition' | 'system';
  text: string;
  timestamp: number;
}

/** Estado completo e próprio da aba Cena. */
export interface CenaState {
  scene: SceneState;
  npcRoster: NpcEntry[];
  encounter: EncounterState;
  log: CenaLogEntry[];
}

export const DEFAULT_SCENE: SceneState = {
  locationName: 'Local Desconhecido',
  subtitle: '',
  image: '',
  weather: 'sunny',
  isNight: false,
  notes: '',
};

export const DEFAULT_ENCOUNTER: EncounterState = {
  isActive: false,
  round: 1,
  turnIndex: 0,
  order: [],
};

/** Cria um CenaState novo com cópias independentes de scene e encounter. */
export function createDefaultCena(): CenaState {
  return {
    scene: { ...DEFAULT_SCENE },
    npcRoster: [],
    encounter: { ...DEFAULT_ENCOUNTER, order: [] },
    log: [],
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run utils/cena.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add utils/cena.ts utils/cena.test.ts
git commit -m "feat(cena): modelo de dados CenaState (fundação)"
```

---

## Task 2: Persistência de CenaState (`utils/database.ts`)

**Files:**
- Modify: `utils/database.ts`

Não há harness de IndexedDB nos testes; a verificação é type-check + suíte existente + build. As edições são mecânicas e devem espelhar o que já existe para `journey`.

- [ ] **Step 1: Importar o tipo e o factory**

Em `utils/database.ts`, na linha de import dos tipos (linha 13):

```ts
import { Card, Character, CombatState, Item, JourneyState, Seal, Weapon } from '../types';
import { CenaState, createDefaultCena } from './cena';
```

- [ ] **Step 2: Default + sanitizer + campo no snapshot**

Após o bloco `DEFAULT_JOURNEY` (logo após a linha 88), adicionar:

```ts
export const DEFAULT_CENA: CenaState = createDefaultCena();
```

No `AppSnapshot` (interface por volta da linha 43), adicionar o campo após `journey`:

```ts
  journey: JourneyState;
  cena: CenaState;
  extras: AppExtras;
```

Bump da versão (linha 57):

```ts
export const SNAPSHOT_VERSION = 4;
```

Adicionar o sanitizer junto aos outros (após `ensureJourney`, por volta da linha 206):

```ts
function ensureCena(raw: any): CenaState {
  if (!raw || typeof raw !== 'object') return createDefaultCena();
  const base = createDefaultCena();
  return {
    scene: { ...base.scene, ...(raw.scene ?? {}) },
    npcRoster: Array.isArray(raw.npcRoster) ? raw.npcRoster : [],
    encounter: { ...base.encounter, ...(raw.encounter ?? {}),
      order: Array.isArray(raw.encounter?.order) ? raw.encounter.order : [] },
    log: Array.isArray(raw.log) ? raw.log : [],
  };
}
```

- [ ] **Step 3: Listener key, load, sync, update**

Em `ListenerKey` (linha 223) e `_listeners` (linha 224), adicionar `'cena'`:

```ts
type ListenerKey = 'characters' | 'cards' | 'items' | 'seals' | 'weapons' | 'combat' | 'journey' | 'cena' | 'extras';
const _listeners: Record<ListenerKey, Function[]> = {
  characters: [], cards: [], items: [], seals: [], weapons: [], combat: [], journey: [], cena: [], extras: [],
};
```

Em `loadAll` (linha 292): adicionar `_get('meta','__cena')` ao `Promise.all` e ao retorno:

```ts
async function loadAll() {
  const [chars, cards, items, seals, weapons, combatRec, journeyRec, cenaRec, extrasRec] = await Promise.all([
    _getAll<any>('characters'),
    _getAll<any>('cards'),
    _getAll<any>('items'),
    _getAll<any>('seals'),
    _getAll<any>('weapons'),
    _get<any>('meta', '__combat'),
    _get<any>('meta', '__journey'),
    _get<any>('meta', '__cena'),
    _get<any>('meta', '__extras'),
  ]);
  return {
    characters: chars.map(ensureChar),
    cards: cards as Card[],
    items: items as Item[],
    seals: seals.map(ensureSeal) as Seal[],
    weapons: weapons as Weapon[],
    combat: ensureCombat(combatRec?.value),
    journey: ensureJourney(journeyRec?.value),
    cena: ensureCena(cenaRec?.value),
    extras: ensureExtras(extrasRec?.value),
  };
}
```

No tipo de retorno de `initialize` (por volta da linha 321), adicionar `cena: CenaState;` após `journey`.

Adicionar a subscription junto a `syncJourneyState` (após linha 363):

```ts
  syncCenaState: (cb: (d: CenaState) => void) => {
    _get<any>('meta', '__cena').then(r => cb(ensureCena(r?.value))).catch(() => cb(createDefaultCena()));
    return _subscribe<CenaState>('cena', cb);
  },
```

Adicionar o update junto a `updateJourney` (após linha 450):

```ts
  updateCena: async (state: CenaState) => {
    await _put('meta', { id: '__cena', value: state });
    _notify('cena', state);
  },
```

- [ ] **Step 4: Snapshot save + restore**

Em `saveFullSnapshot` (linha 457), adicionar no `Promise.all` e nas notificações:

```ts
      _put('meta', { id: '__journey', value: snapshot.journey }),
      _put('meta', { id: '__cena', value: snapshot.cena }),
      _put('meta', { id: '__extras', value: snapshot.extras }),
```

e após `_notify('journey', snapshot.journey);`:

```ts
    _notify('cena', snapshot.cena);
```

Em `restoreSnapshot` (linha 496), adicionar o campo no objeto `snapshot`:

```ts
        journey: ensureJourney(raw.journey),
        cena: ensureCena(raw.cena),
```

- [ ] **Step 5: Verificar tipos, testes e build**

Run: `npx tsc --noEmit`
Expected: sem erros novos em `utils/database.ts` (App.tsx ainda não consome `cena` — isso é Task 8; se `tsc` reclamar de `cena` faltando no destructuring do App, isso é resolvido na Task 8, então rode tsc novamente ao fim da Task 8).

Run: `npx vitest run`
Expected: PASS (suíte existente intacta).

> Nota: rode `npx tsc --noEmit` definitivo só ao final da Task 8, pois App.tsx é alterado lá.

- [ ] **Step 6: Commit**

```bash
git add utils/database.ts
git commit -m "feat(cena): persistência de CenaState (snapshot v4)"
```

---

## Task 3: Atmosfera conhece `cena`

**Files:**
- Modify: `utils/atmosphere.ts`
- Modify: `utils/atmosphere.test.ts`

- [ ] **Step 1: Atualizar o teste (falha primeiro)**

Em `utils/atmosphere.test.ts`, trocar o teste de `atmosphereForTab`:

```ts
describe('atmosphereForTab', () => {
  it('jornada é dusk; o resto (incl. cena) é escuro', () => {
    expect(atmosphereForTab('journey')).toBe('dusk');
    for (const t of ['cena','combat','arsenal','characters','extras'] as const) {
      expect(atmosphereForTab(t)).toBe('dark');
    }
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run utils/atmosphere.test.ts`
Expected: FAIL — `'cena'` não é um `TabId` (erro de tipo/compilação no teste).

- [ ] **Step 3: Implementar**

Em `utils/atmosphere.ts`, linha 1, adicionar `'cena'` à união e ao mapa:

```ts
export type TabId = 'cena' | 'combat' | 'arsenal' | 'characters' | 'extras' | 'journey';
```

```ts
const TAB_ATMOSPHERE: Record<TabId, Atmosphere> = {
  cena: 'dark',
  combat: 'dark', arsenal: 'dark',
  characters: 'dark', extras: 'dark', journey: 'dusk',
};
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run utils/atmosphere.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/atmosphere.ts utils/atmosphere.test.ts
git commit -m "feat(cena): atmosfera dark para a aba cena"
```

---

## Task 4: Tema de seção `cena` (brasa)

**Files:**
- Modify: `utils/sectionTheme.ts`
- Modify: `utils/sectionTheme.test.ts`

- [ ] **Step 1: Atualizar o teste (falha primeiro)**

Em `utils/sectionTheme.test.ts`, atualizar `ALL_TABS` (linha 6) e adicionar um teste:

```ts
const ALL_TABS: TabId[] = ['cena', 'combat', 'journey', 'characters', 'arsenal', 'extras'];
```

Adicionar, dentro de `describe('SECTION_THEMES'...)`:

```ts
  it('cena usa acento brasa (âmbar/dourado)', () => {
    expect(SECTION_THEMES.cena.atmosphere).toBe('dark');
    expect(SECTION_THEMES.cena.vars['--sec-accent']).toBe('#e0772e');
    expect(SECTION_THEMES.cena.vars['--ember']).toBe('#e0772e');
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run utils/sectionTheme.test.ts`
Expected: FAIL — `SECTION_THEMES.cena` indefinido / `'cena'` não é chave.

- [ ] **Step 3: Implementar**

Em `utils/sectionTheme.ts`, adicionar a paleta antes de `SECTION_THEMES` (após `EXTRAS_VARS`, linha 73):

```ts
const CENA_VARS: Record<string, string> = {
  '--sec-accent':   '#e0772e', // brasa-laranja
  '--sec-accent-2': '#c9962f', // ouro
  '--sec-accent-3': '#f0d9a8', // pergaminho claro
  '--sec-ink':      '#f3ecdd',
  '--gold-dim':    '#5a2310',
  '--gold-mid':    '#c9962f',
  '--gold-bright': '#e0a766',
  '--gold-pale':   '#f0d9a8',
  '--border-gold': 'rgba(224,119,46,0.30)',
  '--ember':       '#e0772e',
  '--ember-deep':  '#a3380f',
};
```

Adicionar a entrada em `SECTION_THEMES` (linha 75), como primeira chave:

```ts
export const SECTION_THEMES: Record<TabId, SectionThemeDef> = {
  cena:       { atmosphere: atmosphereForTab('cena'),       vars: CENA_VARS },
  combat:     { atmosphere: atmosphereForTab('combat'),     vars: COMBAT_VARS },
  journey:    { atmosphere: atmosphereForTab('journey'),    vars: JOURNEY_VARS },
  characters: { atmosphere: atmosphereForTab('characters'), vars: CHARACTERS_VARS },
  arsenal:    { atmosphere: atmosphereForTab('arsenal'),    vars: ARSENAL_VARS },
  extras:     { atmosphere: atmosphereForTab('extras'),     vars: EXTRAS_VARS },
};
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run utils/sectionTheme.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/sectionTheme.ts utils/sectionTheme.test.ts
git commit -m "feat(cena): tema de seção brasa para a aba cena"
```

---

## Task 5: navModel — `cena` como único modo, 4 destinos

**Files:**
- Modify: `components/nav/navModel.ts`
- Modify: `components/nav/navModel.test.ts`

- [ ] **Step 1: Atualizar o teste (falha primeiro)**

Substituir `components/nav/navModel.test.ts` por:

```ts
import { describe, it, expect } from 'vitest';
import { NAV_DESTS, MODES, SATELLITES, NAV_ORDER } from './navModel';

describe('navModel', () => {
  it('tem exatamente 1 modo (cena) e 3 satélites', () => {
    expect(MODES).toEqual(['cena']);
    expect(SATELLITES).toEqual(['characters', 'arsenal', 'extras']);
    expect(SATELLITES).not.toContain('cena');
  });

  it('NAV_ORDER cobre os 4 destinos sem repetição, começando por cena', () => {
    expect(NAV_ORDER).toEqual(['cena', 'characters', 'arsenal', 'extras']);
    expect(new Set(NAV_ORDER).size).toBe(4);
  });

  it('cada destino navegável tem label, ícone e tipo coerente', () => {
    for (const id of NAV_ORDER) {
      const d = NAV_DESTS[id];
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.icon).toBeTruthy();
      expect(d.kind).toBe(MODES.includes(id) ? 'mode' : 'satellite');
    }
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run components/nav/navModel.test.ts`
Expected: FAIL — `MODES` ainda é `['combat','journey']`; `NAV_ORDER` tem 5.

- [ ] **Step 3: Implementar**

Substituir `components/nav/navModel.ts` por:

```ts
import type { LucideIcon } from 'lucide-react';
import { Compass, Users, Shield, LayoutGrid, Swords } from 'lucide-react';
import type { TabId } from '../../utils/atmosphere';

export type NavKind = 'mode' | 'satellite';
export interface NavDest {
  id: TabId;
  label: string;
  kind: NavKind;
  icon: LucideIcon;
}

export const MODES: TabId[] = ['cena'];
export const SATELLITES: TabId[] = ['characters', 'arsenal', 'extras'];
// Ordem das teclas 1..4
export const NAV_ORDER: TabId[] = ['cena', 'characters', 'arsenal', 'extras'];

// NAV_DESTS mantém combat/journey (ainda são TabId até a Fase 4), mas eles
// não aparecem em NAV_ORDER/MODES, portanto ficam inacessíveis pela navegação.
export const NAV_DESTS: Record<TabId, NavDest> = {
  cena:       { id: 'cena',       label: 'Cena',        kind: 'mode',      icon: Compass },
  combat:     { id: 'combat',     label: 'Combate',     kind: 'mode',      icon: Swords },
  journey:    { id: 'journey',    label: 'Jornada',     kind: 'mode',      icon: Compass },
  characters: { id: 'characters', label: 'Personagens', kind: 'satellite', icon: Users },
  arsenal:    { id: 'arsenal',    label: 'Arsenal',     kind: 'satellite', icon: Shield },
  extras:     { id: 'extras',     label: 'Extras',      kind: 'satellite', icon: LayoutGrid },
};
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run components/nav/navModel.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/nav/navModel.ts components/nav/navModel.test.ts
git commit -m "feat(cena): navModel com cena como único modo (4 destinos)"
```

---

## Task 6: useKeyboardNav — teclas 1..4

**Files:**
- Modify: `components/nav/useKeyboardNav.ts`
- Modify: `components/nav/useKeyboardNav.test.ts`

- [ ] **Step 1: Atualizar o teste (falha primeiro)**

Substituir `components/nav/useKeyboardNav.test.ts` por:

```ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNav } from './useKeyboardNav';

function setup(activeTab = 'cena') {
  const onSelect = vi.fn();
  const view = renderHook(
    ({ tab }) => useKeyboardNav({ activeTab: tab as any, onSelect }),
    { initialProps: { tab: activeTab } },
  );
  return { onSelect, ...view };
}

describe('useKeyboardNav', () => {
  it('"1" vai direto para cena', () => {
    const { result, onSelect } = setup('arsenal');
    act(() => result.current.handleKey({ key: '1', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('cena');
  });

  it('"2" seleciona o 2º destino (characters)', () => {
    const { result, onSelect } = setup('cena');
    act(() => result.current.handleKey({ key: '2', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('characters');
  });

  it('ArrowRight cicla para a próxima aba', () => {
    const { result, onSelect } = setup('cena'); // índice 0
    act(() => result.current.handleKey({ key: 'ArrowRight', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('characters'); // índice 1
  });

  it('ArrowLeft de cena dá a volta para o último (extras)', () => {
    const { result, onSelect } = setup('cena');
    act(() => result.current.handleKey({ key: 'ArrowLeft', preventDefault() {} } as any));
    expect(onSelect).toHaveBeenCalledWith('extras');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run components/nav/useKeyboardNav.test.ts`
Expected: FAIL — `"1"` ainda mapeia para `combat`.

- [ ] **Step 3: Implementar**

Em `components/nav/useKeyboardNav.ts`, ajustar a faixa de teclas (linha 19) e o comentário (linha 10):

```ts
    if (e.key >= '1' && e.key <= '4') {
      const id = NAV_ORDER[Number(e.key) - 1];
      if (id) { e.preventDefault(); onSelect(id); }
      return;
    }
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run components/nav/useKeyboardNav.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/nav/useKeyboardNav.ts components/nav/useKeyboardNav.test.ts
git commit -m "feat(cena): atalhos de teclado 1..4"
```

---

## Task 7: Scaffold da CenaTab

**Files:**
- Create: `tabs/CenaTab.tsx`
- Test: `tabs/CenaTab.test.tsx`

O scaffold já declara a forma das props que a Fase 2 vai consumir (cena + dados referenciados + setters), mas renderiza apenas um placeholder. Isso isola a fiação do App (Task 8) das fases seguintes.

- [ ] **Step 1: Escrever o smoke test (falha primeiro)**

Create `tabs/CenaTab.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CenaTab from './CenaTab';
import { createDefaultCena } from '../utils/cena';

describe('CenaTab (scaffold)', () => {
  it('renderiza o nome do local da cena', () => {
    const cena = createDefaultCena();
    cena.scene.locationName = 'A Propriedade do Barão';
    render(
      <CenaTab
        cena={cena}
        characters={[]}
        cards={[]}
        seals={[]}
        items={[]}
        weapons={[]}
        updateCena={() => {}}
        updateCharacterStats={() => {}}
      />,
    );
    expect(screen.getByText('A Propriedade do Barão')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/CenaTab.test.tsx`
Expected: FAIL — `Cannot find module './CenaTab'`.

- [ ] **Step 3: Implementar o scaffold**

Create `tabs/CenaTab.tsx`:

```tsx
import React from 'react';
import type { Card, Character, Item, Seal, Weapon } from '../types';
import type { CenaState } from '../utils/cena';

export interface CenaTabProps {
  cena: CenaState;
  // Dados referenciados das abas existentes (fonte única)
  characters: Character[];
  cards: Card[];
  seals: Seal[];
  items: Item[];
  weapons: Weapon[];
  // Mutadores
  updateCena: (next: CenaState) => void;
  updateCharacterStats: (charId: string, updates: Partial<Character>) => void;
}

/**
 * Aba Cena — unifica exploração de jornada e combate (sem grid).
 * Fase 1: scaffold/placeholder. UI rica e combate chegam nas Fases 2 e 3.
 */
const CenaTab: React.FC<CenaTabProps> = ({ cena }) => {
  return (
    <section
      aria-label="Cena"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 8,
        color: 'var(--text-primary)',
      }}
    >
      <h2
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 28,
          letterSpacing: '0.1em',
          color: 'var(--text-primary)',
        }}
      >
        {cena.scene.locationName}
      </h2>
      {cena.scene.subtitle && (
        <p style={{ letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sec-accent)' }}>
          {cena.scene.subtitle}
        </p>
      )}
      <p style={{ color: 'var(--text-muted)' }}>Aba Cena — em construção (Fase 1).</p>
    </section>
  );
};

export default CenaTab;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/CenaTab.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tabs/CenaTab.tsx tabs/CenaTab.test.tsx
git commit -m "feat(cena): scaffold da CenaTab com contrato de props"
```

---

## Task 8: Plugar a CenaTab no App e remover Combate/Jornada da navegação

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Imports e tipo da aba**

Adicionar o import do componente junto aos outros de tabs (perto da linha 113-114):

```tsx
import JourneyTab from './tabs/JourneyTab';
import CombatTab from './tabs/CombatTab';
import CenaTab from './tabs/CenaTab';
```

Adicionar o import do tipo/estado de cena junto aos imports de `utils` (perto de onde `database`/`atmosphere` são importados):

```tsx
import type { CenaState } from './utils/cena';
import { createDefaultCena } from './utils/cena';
```

Atualizar `AppTab` (linha 361) e `TAB_META` (linha 362-368):

```ts
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

- [ ] **Step 2: Estado, default da aba, boot e sync**

Trocar o default do `activeTab` (linha 3290) para `'cena'` e incluir `'cena'` na união:

```tsx
  const [activeTab, setActiveTab] = useState<'cena' | 'combat' | 'arsenal' | 'characters' | 'extras' | 'journey'>('cena');
```

Adicionar o estado da cena junto a `journey`/`combat` (perto da linha 3324):

```tsx
  const [cena, setCena] = useState<CenaState>(createDefaultCena());
```

No boot (`DatabaseService.initialize().then(...)`, linha 3506), incluir `cena` no destructuring e setar:

```tsx
    DatabaseService.initialize().then(({ characters: chars, cards: cds, items: its, seals: sls, weapons: wps, combat: cbt, journey: jny, cena: cn, extras }) => {
      if (cancelled) return;
      setCharacters(chars);
      setCards(cds);
      setItems(its);
      setSeals(sls);
      setWeapons(wps);
      setCombat(migrateCombatState(cbt));
      setJourney(jny);
      setCena(cn);
```

Adicionar a subscription junto às outras (após linha 3537):

```tsx
    const unsubCena = DatabaseService.syncCenaState((data) => { if (!cancelled) setCena(data); });
```

E incluir `unsubCena()` no cleanup (no `return () => { ... }` por volta da linha 3544, junto dos demais `unsub*()`).

- [ ] **Step 3: updateCena**

Adicionar junto a `updateJourney` (após a linha 4026):

```tsx
  const updateCena = (next: CenaState) => {
    setCena(next);
    DatabaseService.updateCena(next);
  };
```

- [ ] **Step 4: Render da CenaTab**

No bloco de render principal (`<main>`, por volta da linha 5922), adicionar antes do bloco `{activeTab === 'journey' ...}` (linha 5925):

```tsx
        {/* Aba Cena */}
        {activeTab === 'cena' && (
          <CenaTab
            cena={cena}
            characters={characters}
            cards={cards}
            seals={seals}
            items={items}
            weapons={weapons}
            updateCena={updateCena}
            updateCharacterStats={updateCharacterStats}
          />
        )}
```

Os blocos `activeTab === 'journey'` e `activeTab === 'combat'` permanecem no código (são inacessíveis pela navegação agora), e serão removidos na Fase 4.

- [ ] **Step 5: Type-check, testes e build**

Run: `npx tsc --noEmit`
Expected: sem erros. (Se `updateCharacterStats` tiver outra assinatura, ajuste o prop da CenaTab/scaffold para casar — confira a definição em App.tsx.)

Run: `npx vitest run`
Expected: PASS (toda a suíte).

Run: `npm run build`
Expected: build conclui sem erros.

- [ ] **Step 6: Verificação manual no app**

Run: `npm run dev` e abrir o app.
Expected:
- A aba inicial é **Cena**, mostrando o nome do local (placeholder).
- Teclas `1..4` e setas navegam entre Cena/Personagens/Arsenal/Extras.
- Combate e Jornada não são mais alcançáveis pela navegação.
- Recarregar a página mantém o estado (cena persistida).

- [ ] **Step 7: Commit**

```bash
git add App.tsx
git commit -m "feat(cena): plugar CenaTab no App; cena vira a aba inicial"
```

---

## Self-Review (cobertura da Fase 1 vs. spec)

- **Aba única substitui Combate+Jornada:** Tasks 5, 6, 8 (cena é o único modo; combat/journey saem da navegação). A remoção física do código é Fase 4 (por design, para manter cada fase compilando).
- **Modelos novos só para o que é da aba; party referencia Personagens:** Task 1 (`CenaState`/`NpcEntry` novos; `characters` chega por prop como fonte única). ✔
- **Persistência:** Task 2 (snapshot v4, meta `__cena`, sync/update/restore). ✔
- **Tema brasa via applySectionTheme:** Tasks 3, 4 (`cena` → atmosfera dark + `CENA_VARS`; `applySectionTheme('cena')` já é chamado pelo efeito existente do App). ✔
- **Escopo de combate / UI / fluxo:** Fases 2 e 3 (fora deste plano). Anotado no roadmap. ✔
- **Placeholder scan:** nenhum passo usa "TBD/TODO"; todo passo de código mostra o código. ✔
- **Consistência de tipos:** `CenaState`, `createDefaultCena`, `syncCenaState`, `updateCena`, `ensureCena`, `CenaTabProps` usados com os mesmos nomes em todas as tasks. ✔
