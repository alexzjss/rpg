# Aba "Cena" — Fase 2C: Renovação Visual (Crimson) + Grid de Tokens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skinar a aba Cena (modo Exploração) para a estética "Crimson Showtime" do handoff (dark + `#E0102B` + cortes angulares + fontes Anton/Barlow/Cinzel) e adicionar um **grid de tokens funcional simples** (mapa com imagem, grade e tokens arrastáveis dos presentes).

**Architecture:** O tema crimson é escopado à seção `cena` via nova atmosfera `noir` + `CENA_VARS` crimson (aplicados por `applySectionTheme('cena')`). As posições de tokens vivem em `CenaState.tokens` (% do mapa), mutadas por helper puro. O `SceneStage` da 2A é decomposto em `SceneTitle` (topo), `MapBoard` (mapa+grid+tokens) e `ActiveBar` (rodapé); os painéis 2A (Log/Selos/Roster/Actions) são re-estilizados mantendo seus contratos de props. O **modo combate (Frame B)** NÃO entra aqui — é a Fase 2D.

**Tech Stack:** React 19 + TS, Vite, Vitest + @testing-library/react (sem jest-dom; `afterEach(cleanup)`). Referência de design: `docs/superpowers/design/vtt-crimson-handoff.html` (Variação A — Equilíbrio/Exploração).

**Paleta do design (Variação A):**
- Fundos: `#0a0a0c` (base), `#101013` (painel), `#15151a` (item), `#1a0d10`/`#141014` (roll card).
- Bordas: `#1e1e24`, `#26262c`, `#22222a`, `#3a1620` (crimson-dim).
- Texto: `#ececef`/`#f1f1f4` (forte), `#e9e9ee`/`#cfcfd4` (médio), `#9a9aa1`/`#7d7d85`/`#6f6f76` (fraco), `#55555c`/`#5a5a62` (faint).
- Acento: `#E0102B` (crimson), `#B00C22`/`#a60c20` (crimson-deep), `#cfcfe6`/`#6f6f9e` (aura/lilás).
- Fontes: `Anton` (display/nomes), `Barlow Semi Condensed` (labels/títulos de painel), `Barlow Condensed` (corpo), `Cinzel` (título da cena).
- Cortes: clip-path canto inferior-direito `polygon(0 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)` (painéis), e chips `polygon(0 0,100% 0,100% 72%,90% 100%,0 100%)`.

**Verificação global:** `npx vitest run` · `npx tsc --noEmit` (baseline = 3 erros pré-existentes: App.tsx 4760/5654, vitest.config.ts — nenhuma task pode adicionar erros) · `npm run build`.

---

## Estrutura de arquivos (Fase 2C)

- **Modificar** `index.html` — carregar fontes Anton + Barlow Condensed + Barlow Semi Condensed.
- **Modificar** `utils/atmosphere.ts` — atmosfera `noir`; `cena` → `noir`. **Modificar** `utils/atmosphere.test.ts`.
- **Modificar** `utils/sectionTheme.ts` — `CENA_VARS` crimson. **Modificar** `utils/sectionTheme.test.ts`.
- **Modificar** `utils/cena.ts` — campo `tokens` em `CenaState`; helpers `setToken`, `setEncounterActive`; `createDefaultCena` inclui `tokens:{}`. **Modificar** `utils/cena.test.ts`.
- **Modificar** `utils/database.ts` — `ensureCena` default `tokens:{}`.
- **Reescrever** `tabs/cena/LogPanel.tsx` (re-skin) + ajustar teste.
- **Reescrever** `tabs/cena/ActivePanels.tsx` (re-skin) + ajustar teste.
- **Reescrever** `tabs/cena/RosterPanel.tsx` (re-skin) + ajustar teste.
- **Criar** `tabs/cena/SceneTitle.tsx` + `tabs/cena/ActiveBar.tsx` + testes.
- **Criar** `tabs/cena/MapBoard.tsx` + teste.
- **Reescrever** `tabs/cena/SceneStage.tsx` → some (substituído por SceneTitle+MapBoard+ActiveBar). Remover o arquivo e seu teste.
- **Reescrever** `tabs/CenaTab.tsx` — novo layout de exploração + wiring de tokens. Ajustar `tabs/CenaTab.test.tsx`.

Convenção de teste: `import { afterEach } from 'vitest'; import { cleanup } from '@testing-library/react'; afterEach(() => cleanup());`

---

## Task 1: Fontes + atmosfera `noir` + tema crimson

**Files:**
- Modify: `index.html`
- Modify: `utils/atmosphere.ts`, `utils/atmosphere.test.ts`
- Modify: `utils/sectionTheme.ts`, `utils/sectionTheme.test.ts`

- [ ] **Step 1: Fontes no index.html**

Em `index.html`, logo após a linha do `<link ... Cinzel...>` (linha ~8), adicionar:
```html
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@400;500;600;700&family=Barlow+Semi+Condensed:wght@500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Atualizar testes (falham primeiro)**

Em `utils/atmosphere.test.ts`, trocar o teste de `atmosphereForTab`:
```ts
describe('atmosphereForTab', () => {
  it('cena é noir; jornada é dusk; o resto é escuro', () => {
    expect(atmosphereForTab('cena')).toBe('noir');
    expect(atmosphereForTab('journey')).toBe('dusk');
    for (const t of ['combat','arsenal','characters','extras'] as const) {
      expect(atmosphereForTab(t)).toBe('dark');
    }
  });
});
```
E o teste de `ATMOSPHERE_VARS` (que compara conjuntos de chaves) deve incluir `noir`:
```ts
  it('os climas definem exatamente o mesmo conjunto de vars', () => {
    const d = Object.keys(ATMOSPHERE_VARS.dark).sort();
    for (const climate of ['parchment','dusk','noir'] as const) {
      expect(Object.keys(ATMOSPHERE_VARS[climate]).sort()).toEqual(d);
    }
  });
```

Em `utils/sectionTheme.test.ts`, trocar o teste do `cena`:
```ts
  it('cena usa atmosfera noir e acento crimson', () => {
    expect(SECTION_THEMES.cena.atmosphere).toBe('noir');
    expect(SECTION_THEMES.cena.vars['--sec-accent']).toBe('#E0102B');
    expect(SECTION_THEMES.cena.vars['--ember']).toBe('#E0102B');
  });
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run utils/atmosphere.test.ts utils/sectionTheme.test.ts`
Expected: FAIL (cena ainda é 'dark' e acento brasa).

- [ ] **Step 4: Implementar atmosfera `noir`**

Em `utils/atmosphere.ts`:
- Adicionar `'noir'` ao tipo `Atmosphere`:
```ts
export type Atmosphere = 'dark' | 'parchment' | 'dusk' | 'noir';
```
- Mudar o mapa: `cena: 'noir'`:
```ts
const TAB_ATMOSPHERE: Record<TabId, Atmosphere> = {
  cena: 'noir',
  combat: 'dark', arsenal: 'dark',
  characters: 'dark', extras: 'dark', journey: 'dusk',
};
```
- Adicionar a entrada `noir` em `ATMOSPHERE_VARS` (mesmas chaves dos outros climas):
```ts
  noir: {
    '--bg-base': '#0a0a0c',
    '--bg-surface': '#101013',
    '--bg-raised': '#15151a',
    '--bg-overlay': '#1b1b21',
    '--text-primary': '#ececef',
    '--text-secondary': '#9a9aa1',
    '--text-muted': '#7d7d85',
    '--border-faint': '#1e1e24',
    '--border-mid': '#26262c',
    '--surface-ink': '#ececef',
  },
```

- [ ] **Step 5: Implementar tema crimson `CENA_VARS`**

Em `utils/sectionTheme.ts`, substituir o conteúdo de `CENA_VARS` por:
```ts
const CENA_VARS: Record<string, string> = {
  '--sec-accent':   '#E0102B', // crimson
  '--sec-accent-2': '#cfcfe6', // aura/lilás
  '--sec-accent-3': '#B00C22', // crimson-deep
  '--sec-ink':      '#ececef',
  '--gold-dim':    '#3a1620',
  '--gold-mid':    '#E0102B',
  '--gold-bright': '#ff2a44',
  '--gold-pale':   '#ffd9de',
  '--border-gold': 'rgba(224,16,43,0.32)',
  '--ember':       '#E0102B',
  '--ember-deep':  '#8a0a1c',
};
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run utils/atmosphere.test.ts utils/sectionTheme.test.ts`
Expected: PASS. Depois `npx vitest run` → suíte verde.

- [ ] **Step 7: Commit**
```bash
git add index.html utils/atmosphere.ts utils/atmosphere.test.ts utils/sectionTheme.ts utils/sectionTheme.test.ts
git commit -m "feat(cena): tema crimson + atmosfera noir + fontes Anton/Barlow"
```

---

## Task 2: `tokens` no CenaState + helpers

**Files:**
- Modify: `utils/cena.ts`, `utils/cena.test.ts`
- Modify: `utils/database.ts`

- [ ] **Step 1: Testes (falham primeiro)**

Em `utils/cena.test.ts`, adicionar imports `setToken, setEncounterActive` e:
```ts
describe('tokens', () => {
  it('createDefaultCena começa com tokens vazio', () => {
    expect(createDefaultCena().tokens).toEqual({});
  });
  it('setToken define a posição de um id sem mutar o original', () => {
    const cena = createDefaultCena();
    const next = setToken(cena, 'p1', { x: 40, y: 55 });
    expect(next.tokens.p1).toEqual({ x: 40, y: 55 });
    expect(cena.tokens.p1).toBeUndefined();
    expect(next).not.toBe(cena);
  });
  it('setToken atualiza posição existente', () => {
    let cena = setToken(createDefaultCena(), 'p1', { x: 10, y: 10 });
    cena = setToken(cena, 'p1', { x: 90, y: 20 });
    expect(cena.tokens.p1).toEqual({ x: 90, y: 20 });
  });
});

describe('setEncounterActive', () => {
  it('liga e desliga o encounter sem mutar o original', () => {
    const cena = createDefaultCena();
    const on = setEncounterActive(cena, true);
    expect(on.encounter.isActive).toBe(true);
    expect(cena.encounter.isActive).toBe(false);
    expect(setEncounterActive(on, false).encounter.isActive).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run utils/cena.test.ts`
Expected: FAIL — `tokens`/`setToken`/`setEncounterActive` inexistentes.

- [ ] **Step 3: Implementar**

Em `utils/cena.ts`:
- Adicionar o campo ao `CenaState` (após `log`):
```ts
export interface CenaState {
  scene: SceneState;
  npcRoster: NpcEntry[];
  encounter: EncounterState;
  log: CenaLogEntry[];
  /** Posições dos tokens no mapa, por id de participante (% do mapa, 0–100). */
  tokens: Record<string, { x: number; y: number }>;
}
```
- Em `createDefaultCena`, incluir `tokens: {}`:
```ts
export function createDefaultCena(): CenaState {
  return {
    scene: { ...DEFAULT_SCENE },
    npcRoster: [],
    encounter: { ...DEFAULT_ENCOUNTER, order: [] },
    log: [],
    tokens: {},
  };
}
```
- Adicionar ao final do arquivo:
```ts
/** Define/atualiza a posição de um token (imutável). */
export function setToken(cena: CenaState, id: string, pos: { x: number; y: number }): CenaState {
  return { ...cena, tokens: { ...cena.tokens, [id]: pos } };
}

/** Liga/desliga o encounter (modo combate visual nesta fase). */
export function setEncounterActive(cena: CenaState, active: boolean): CenaState {
  return { ...cena, encounter: { ...cena.encounter, isActive: active } };
}
```

- [ ] **Step 4: ensureCena default**

Em `utils/database.ts`, na função `ensureCena`, adicionar `tokens` ao objeto retornado:
```ts
  return {
    scene: { ...base.scene, ...(raw.scene ?? {}) },
    npcRoster: Array.isArray(raw.npcRoster) ? raw.npcRoster : [],
    encounter: { ...base.encounter, ...(raw.encounter ?? {}),
      order: Array.isArray(raw.encounter?.order) ? raw.encounter.order : [] },
    log: Array.isArray(raw.log) ? raw.log : [],
    tokens: (raw.tokens && typeof raw.tokens === 'object') ? raw.tokens : {},
  };
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run utils/cena.test.ts`
Expected: PASS. Depois `npx vitest run` → suíte verde.

- [ ] **Step 6: Commit**
```bash
git add utils/cena.ts utils/cena.test.ts utils/database.ts
git commit -m "feat(cena): tokens no CenaState + setToken/setEncounterActive"
```

---

## Task 3: Re-skin LogPanel (Crimson)

**Files:**
- Modify: `tabs/cena/LogPanel.tsx`, `tabs/cena/LogPanel.test.tsx`

Mantém o contrato `{ log, notes, onNotesChange }` e os comportamentos (abas LOG/NOTAS, vazio, textarea). Só muda o visual.

- [ ] **Step 1: Atualizar teste (mantém asserts essenciais)**

Substituir `tabs/cena/LogPanel.test.tsx` por:
```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LogPanel from './LogPanel';
import type { CenaLogEntry } from '../../utils/cena';

afterEach(() => cleanup());

const log: CenaLogEntry[] = [{ id: '1', kind: 'system', text: 'A aventura começa', timestamp: 1 }];

describe('LogPanel', () => {
  it('mostra as entradas do log', () => {
    render(<LogPanel log={log} notes="" onNotesChange={() => {}} />);
    expect(screen.getByText('A aventura começa')).toBeTruthy();
  });
  it('mostra vazio quando não há log', () => {
    render(<LogPanel log={[]} notes="" onNotesChange={() => {}} />);
    expect(screen.getByText(/nada aconteceu ainda/i)).toBeTruthy();
  });
  it('troca para Notas e edita', () => {
    const onNotesChange = vi.fn();
    render(<LogPanel log={log} notes="velho" onNotesChange={onNotesChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /notas/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'novo' } });
    expect(onNotesChange).toHaveBeenCalledWith('novo');
  });
});
```

- [ ] **Step 2: Rodar e ver (deve passar com a impl atual; falhará só se quebrarmos algo)** — rode após o Step 3.

- [ ] **Step 3: Implementar (re-skin)**

Substituir `tabs/cena/LogPanel.tsx` por:
```tsx
import React from 'react';
import type { CenaLogEntry } from '../../utils/cena';

export interface LogPanelProps {
  log: CenaLogEntry[];
  notes: string;
  onNotesChange: (next: string) => void;
}

const PANEL: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
  background: '#101013', border: '1px solid #1e1e24', borderRadius: 3,
  clipPath: 'polygon(0 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)',
};
const tab = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '13px 0', textAlign: 'center', cursor: 'pointer',
  fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: active ? 700 : 600,
  fontSize: 13, letterSpacing: '2.5px', background: 'transparent', border: 'none',
  color: active ? '#E0102B' : '#5e5e66',
  borderBottom: active ? '2px solid #E0102B' : '2px solid transparent',
});

const LogPanel: React.FC<LogPanelProps> = ({ log, notes, onNotesChange }) => {
  const [view, setView] = React.useState<'log' | 'notes'>('log');
  return (
    <div style={PANEL}>
      <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid #1e1e24' }}>
        <button role="tab" aria-selected={view === 'log'} style={tab(view === 'log')} onClick={() => setView('log')}>LOG</button>
        <button role="tab" aria-selected={view === 'notes'} style={tab(view === 'notes')} onClick={() => setView('notes')}>NOTAS</button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
        {view === 'log' ? (
          log.length === 0 ? (
            <div style={{ fontSize: 13, color: '#5a5a62', fontStyle: 'italic', letterSpacing: '.5px' }}>— Nada aconteceu ainda —</div>
          ) : (
            log.map(e => (
              <div key={e.id} style={{ background: '#15151a', borderLeft: '2px solid #6b6b74', padding: '10px 12px', borderRadius: '0 3px 3px 0' }}>
                <div style={{ fontSize: 14, color: '#cfcfd4', lineHeight: 1.35 }}>{e.text}</div>
              </div>
            ))
          )
        ) : (
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Anotações do mestre…"
            style={{ width: '100%', height: '100%', minHeight: 200, resize: 'none', background: '#0a0a0c',
              color: '#ececef', border: '1px solid #1e1e24', borderRadius: 3, padding: 12, fontSize: 14,
              fontFamily: "'Barlow Condensed',sans-serif", outline: 'none' }}
          />
        )}
      </div>
    </div>
  );
};

export default LogPanel;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/cena/LogPanel.test.tsx`
Expected: PASS. Depois `npx vitest run`.

- [ ] **Step 5: Commit**
```bash
git add tabs/cena/LogPanel.tsx tabs/cena/LogPanel.test.tsx
git commit -m "feat(cena): re-skin crimson do LogPanel"
```

---

## Task 4: Re-skin ActivePanels (Selos + Ações)

**Files:**
- Modify: `tabs/cena/ActivePanels.tsx`, `tabs/cena/ActivePanels.test.tsx`

Mantém contratos `SealsPanel {seals}` e `ActionsPanel {cards, items, weapons}`.

- [ ] **Step 1: Teste (mantém o existente)**

Manter `tabs/cena/ActivePanels.test.tsx` como está (os asserts continuam válidos: nomes renderizados + vazio "nenhum selo"). Apenas confirme que ele existe; não precisa reescrever.

- [ ] **Step 2: Implementar (re-skin)**

Substituir `tabs/cena/ActivePanels.tsx` por:
```tsx
import React from 'react';
import type { Card, Seal, Weapon } from '../../types';
import type { ResolvedItem } from '../../utils/items';

const shell: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
  background: '#101013', border: '1px solid #1e1e24', borderRadius: 3, padding: 14,
};
const header: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 };
const headerLabel: React.CSSProperties = {
  fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12,
  letterSpacing: '2px', color: '#6f6f76',
};
const rule: React.CSSProperties = { flex: 1, height: 1, background: 'linear-gradient(90deg,#E0102B,transparent)' };
const body: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 9, alignContent: 'flex-start', overflow: 'auto' };
const empty: React.CSSProperties = { color: '#7d7d85', fontSize: 13, fontStyle: 'italic' };

interface ChipProps { name: string; dot?: string; badge?: string; badgeColor?: string }
const Chip: React.FC<ChipProps> = ({ name, dot = '#E0102B', badge, badgeColor = '#9a9aa1' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#15151a', border: '1px solid #2a2a30',
    padding: '8px 12px', clipPath: 'polygon(0 0,100% 0,100% 72%,90% 100%,0 100%)' }}>
    <span style={{ width: 7, height: 7, background: dot, borderRadius: '50%' }} />
    <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 14, color: '#e3e3e8' }}>{name}</span>
    {badge && <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor }}>{badge}</span>}
  </div>
);

export const SealsPanel: React.FC<{ seals: Seal[] }> = ({ seals }) => (
  <div style={shell}>
    <div style={header}><span style={{ ...headerLabel, letterSpacing: '2.5px' }}>SELOS</span><span style={rule} /><span style={{ fontSize: 11, color: '#55555c', letterSpacing: '1px' }}>{seals.length}</span></div>
    <div style={{ ...body, flexDirection: 'column', flexWrap: 'nowrap' }}>
      {seals.length === 0
        ? <p style={empty}>Nenhum selo.</p>
        : seals.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#15151a', border: '1px solid #26262c', padding: '9px 11px', borderRadius: 3 }}>
              <span style={{ width: 30, height: 30, flex: 'none', background: '#E0102B', clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)' }} />
              <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '.5px', color: '#e9e9ee' }}>{s.name}</div>
            </div>
          ))}
    </div>
  </div>
);

export const ActionsPanel: React.FC<{ cards: Card[]; items: ResolvedItem[]; weapons: Weapon[] }> = ({ cards, items, weapons }) => {
  const isEmpty = cards.length === 0 && items.length === 0 && weapons.length === 0;
  return (
    <div style={shell}>
      <div style={header}><span style={headerLabel}>AÇÕES · CARTAS · ITENS</span><span style={rule} /></div>
      <div style={body}>
        {isEmpty
          ? <p style={empty}>Sem ações disponíveis.</p>
          : (
            <>
              {cards.map(c => <Chip key={`c-${c.id}`} name={c.name} badge={c.auraCost ? `${c.auraCost}◆` : undefined} badgeColor="#E0102B" />)}
              {weapons.map(w => <Chip key={`w-${w.id}`} name={w.name} dot="#7a7a82" badge="×1" />)}
              {items.map(i => <Chip key={`i-${i.id}`} name={i.name} dot="#cfcfe6" badge={`×${i.quantity}`} />)}
            </>
          )}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Rodar e ver passar**

Run: `npx vitest run tabs/cena/ActivePanels.test.tsx`
Expected: PASS. Depois `npx vitest run`.

- [ ] **Step 4: Commit**
```bash
git add tabs/cena/ActivePanels.tsx
git commit -m "feat(cena): re-skin crimson de Selos/Ações"
```

---

## Task 5: Re-skin RosterPanel (Crimson)

**Files:**
- Modify: `tabs/cena/RosterPanel.tsx`, `tabs/cena/RosterPanel.test.tsx`

Mantém contrato e `ActiveRef`. Visual: abas PARTY/NPCS crimson, membro ativo com badge ATIVO + barra HP crimson.

- [ ] **Step 1: Teste (mantém os existentes)** — manter `tabs/cena/RosterPanel.test.tsx` como está (asserts continuam válidos). Confirme que segue passando após o Step 2.

- [ ] **Step 2: Implementar (re-skin)**

Substituir `tabs/cena/RosterPanel.tsx` por:
```tsx
import React from 'react';
import { Plus, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { Character } from '../../types';
import type { NpcEntry } from '../../utils/cena';

export type ActiveRef = { id: string; side: 'party' | 'npc' };

export interface RosterPanelProps {
  party: Character[];
  npcRoster: NpcEntry[];
  importable: Character[];
  active: ActiveRef | null;
  onSelectActive: (ref: ActiveRef) => void;
  onImportNpc: (characterId: string) => void;
  onToggleHidden: (npcId: string) => void;
  onTogglePresent: (npcId: string) => void;
  onRemoveNpc: (npcId: string) => void;
}

const PANEL: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
  background: '#101013', border: '1px solid #1e1e24', borderRadius: 3,
  clipPath: 'polygon(0 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)',
};
const tab = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '13px 0', textAlign: 'center', cursor: 'pointer',
  fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: active ? 700 : 600, fontSize: 13,
  letterSpacing: '2.5px', background: 'transparent', border: 'none',
  color: active ? '#E0102B' : '#5e5e66', borderBottom: active ? '2px solid #E0102B' : '2px solid transparent',
});
const hpFill = (pct: number, color: string): React.CSSProperties => ({ display: 'block', width: `${pct}%`, height: '100%', background: color });
const iconBtn: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', color: '#7d7d85', padding: 3, display: 'flex' };

interface RowProps { char: Character; selected: boolean; onClick: () => void; children?: React.ReactNode }
const Row: React.FC<RowProps> = ({ char, selected, onClick, children }) => {
  const pct = char.maxHp > 0 ? Math.max(0, Math.min(100, (char.currentHp / char.maxHp) * 100)) : 0;
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', cursor: 'pointer', borderRadius: 3,
      background: selected ? 'linear-gradient(90deg,#1d0e12,#15151a)' : '#15151a',
      border: selected ? '1px solid #3a1620' : '1px solid #22222a',
      borderLeft: selected ? '3px solid #E0102B' : '1px solid #22222a' }}>
      {char.icon
        ? <img src={char.icon} alt="" style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', objectFit: 'cover', border: selected ? '2px solid #E0102B' : '2px solid #34343c' }} />
        : <div style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', background: '#0a0a0c', border: selected ? '2px solid #E0102B' : '2px solid #34343c' }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '.5px', color: selected ? '#E0102B' : '#e9e9ee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{char.name}</span>
          {selected && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#fff', background: '#E0102B', padding: '1px 5px', borderRadius: 2 }}>ATIVO</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
          <span style={{ flex: 1, height: 6, background: '#26262c', borderRadius: 2, overflow: 'hidden' }}>
            <span style={hpFill(pct, selected ? '#E0102B' : '#7a7a82')} />
          </span>
          <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 12, color: '#9a9aa1' }}>{char.currentHp}/{char.maxHp}</span>
        </div>
      </div>
      {children}
    </div>
  );
};

const RosterPanel: React.FC<RosterPanelProps> = ({
  party, npcRoster, importable, active, onSelectActive, onImportNpc, onToggleHidden, onTogglePresent, onRemoveNpc,
}) => {
  const [view, setView] = React.useState<'party' | 'npcs'>('party');
  const [importing, setImporting] = React.useState(false);
  const visibleNpcs = npcRoster.filter(n => !n.hidden);
  const hiddenNpcs = npcRoster.filter(n => n.hidden);

  return (
    <div style={PANEL}>
      <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid #1e1e24' }}>
        <button role="tab" aria-selected={view === 'party'} style={tab(view === 'party')} onClick={() => setView('party')}>PARTY <span style={{ color: '#6f6f76' }}>{party.length}</span></button>
        <button role="tab" aria-selected={view === 'npcs'} style={tab(view === 'npcs')} onClick={() => setView('npcs')}>NPCS{npcRoster.length > 0 ? <span style={{ color: '#E0102B' }}> {npcRoster.length}</span> : null}</button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {view === 'party' ? (
          party.length === 0
            ? <p style={{ color: '#7d7d85', fontSize: 13, fontStyle: 'italic', padding: 8 }}>Sem personagens no elenco.</p>
            : party.map(c => (
                <Row key={c.id} char={c} selected={active?.side === 'party' && active.id === c.id} onClick={() => onSelectActive({ id: c.id, side: 'party' })} />
              ))
        ) : (
          <>
            {visibleNpcs.map(n => (
              <Row key={n.id} char={n} selected={active?.side === 'npc' && active.id === n.id} onClick={() => onSelectActive({ id: n.id, side: 'npc' })}>
                <button style={iconBtn} title={n.present ? 'Presente' : 'Ausente'} onClick={e => { e.stopPropagation(); onTogglePresent(n.id); }}>
                  <span style={{ fontSize: 14, color: n.present ? '#E0102B' : '#7d7d85' }}>●</span>
                </button>
                <button style={iconBtn} title="Ocultar" onClick={e => { e.stopPropagation(); onToggleHidden(n.id); }}><Eye size={14} /></button>
                <button style={iconBtn} title="Remover" onClick={e => { e.stopPropagation(); onRemoveNpc(n.id); }}><Trash2 size={14} /></button>
              </Row>
            ))}

            {hiddenNpcs.length > 0 && (
              <>
                <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#6f6f76', padding: '6px 4px 2px' }}>OCULTOS ({hiddenNpcs.length})</div>
                {hiddenNpcs.map(n => (
                  <Row key={n.id} char={n} selected={active?.side === 'npc' && active.id === n.id} onClick={() => onSelectActive({ id: n.id, side: 'npc' })}>
                    <button style={iconBtn} title="Revelar" onClick={e => { e.stopPropagation(); onToggleHidden(n.id); }}><EyeOff size={14} /></button>
                    <button style={iconBtn} title="Remover" onClick={e => { e.stopPropagation(); onRemoveNpc(n.id); }}><Trash2 size={14} /></button>
                  </Row>
                ))}
              </>
            )}

            <button onClick={() => setImporting(v => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, padding: 9,
                background: '#15151a', border: '1px dashed #3a1620', color: '#E0102B',
                fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
                clipPath: 'polygon(0 0,100% 0,100% 72%,90% 100%,0 100%)' }}>
              <Plus size={14} /> Adicionar NPC
            </button>

            {importing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2, padding: 6, background: '#0a0a0c', border: '1px solid #1e1e24', borderRadius: 3 }}>
                {importable.length === 0
                  ? <p style={{ color: '#7d7d85', fontSize: 12, fontStyle: 'italic', padding: 4 }}>Nenhum NPC disponível para importar.</p>
                  : importable.map(c => (
                      <button key={c.id} onClick={() => { onImportNpc(c.id); setImporting(false); }}
                        style={{ textAlign: 'left', padding: '7px 9px', background: 'transparent', border: 'none', cursor: 'pointer',
                          color: '#cfcfd4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14 }}>
                        {c.name}
                      </button>
                    ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RosterPanel;
```

- [ ] **Step 3: Rodar e ver passar**

Run: `npx vitest run tabs/cena/RosterPanel.test.tsx`
Expected: PASS. Depois `npx vitest run`.

- [ ] **Step 4: Commit**
```bash
git add tabs/cena/RosterPanel.tsx
git commit -m "feat(cena): re-skin crimson do RosterPanel"
```

---

## Task 6: SceneTitle + ActiveBar (centro: topo e rodapé)

**Files:**
- Create: `tabs/cena/SceneTitle.tsx`, `tabs/cena/SceneTitle.test.tsx`
- Create: `tabs/cena/ActiveBar.tsx`, `tabs/cena/ActiveBar.test.tsx`

- [ ] **Step 1: Testes (falham primeiro)**

Create `tabs/cena/SceneTitle.test.tsx`:
```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SceneTitle from './SceneTitle';
import { createDefaultCena } from '../../utils/cena';

afterEach(() => cleanup());

describe('SceneTitle', () => {
  it('mostra nome e subtítulo editáveis', () => {
    const scene = { ...createDefaultCena().scene, locationName: 'A FORTALEZA', subtitle: 'Soterrada' };
    render(<SceneTitle scene={scene} onSceneChange={() => {}} />);
    expect(screen.getByDisplayValue('A FORTALEZA')).toBeTruthy();
    expect(screen.getByDisplayValue('Soterrada')).toBeTruthy();
  });
  it('edita o clima', () => {
    const onSceneChange = vi.fn();
    render(<SceneTitle scene={createDefaultCena().scene} onSceneChange={onSceneChange} />);
    fireEvent.click(screen.getByTitle('storm'));
    expect(onSceneChange).toHaveBeenCalledWith({ weather: 'storm' });
  });
});
```

Create `tabs/cena/ActiveBar.test.tsx`:
```tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ActiveBar from './ActiveBar';
import type { Character } from '../../types';

afterEach(() => cleanup());

const char: Character = { id: 'a', name: 'Shinkai Black', icon: '', maxHp: 60, currentHp: 45, maxAura: 20, currentAura: 19,
  maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [] };

describe('ActiveBar', () => {
  it('mostra nome e HP/Aura do ativo', () => {
    render(<ActiveBar active={char} />);
    expect(screen.getByText('Shinkai Black')).toBeTruthy();
    expect(screen.getByText('45/60')).toBeTruthy();
    expect(screen.getByText('19/20')).toBeTruthy();
  });
  it('não renderiza nada sem ativo', () => {
    const { container } = render(<ActiveBar active={null} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/cena/SceneTitle.test.tsx tabs/cena/ActiveBar.test.tsx`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: Implementar SceneTitle**

Create `tabs/cena/SceneTitle.tsx`:
```tsx
import React from 'react';
import type { SceneState, SceneWeather } from '../../utils/cena';

export interface SceneTitleProps {
  scene: SceneState;
  onSceneChange: (partial: Partial<SceneState>) => void;
}

const WEATHERS: { id: SceneWeather; label: string }[] = [
  { id: 'sunny', label: '☀' }, { id: 'rain', label: '🌧' }, { id: 'storm', label: '⚡' },
  { id: 'fog', label: '🌫' }, { id: 'snow', label: '❄' }, { id: 'night', label: '🌙' },
];

const SceneTitle: React.FC<SceneTitleProps> = ({ scene, onSceneChange }) => (
  <div style={{ flex: 'none', background: 'linear-gradient(180deg,#101013,#0c0c0f)', border: '1px solid #1e1e24',
    borderRadius: 3, padding: '16px 22px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: '#E0102B' }} />
    <div style={{ textAlign: 'center' }}>
      <input value={scene.locationName} onChange={e => onSceneChange({ locationName: e.target.value })}
        style={{ background: 'transparent', border: 'none', textAlign: 'center', outline: 'none', width: '100%',
          fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 30, letterSpacing: '4px', color: '#f1f1f4', textTransform: 'uppercase' }} />
      <input value={scene.subtitle} onChange={e => onSceneChange({ subtitle: e.target.value })} placeholder="subtítulo…"
        style={{ background: 'transparent', border: 'none', textAlign: 'center', outline: 'none', width: '100%', marginTop: 3,
          fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '5px', color: '#E0102B', textTransform: 'uppercase' }} />
    </div>
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
      {WEATHERS.map(w => (
        <button key={w.id} title={w.id} onClick={() => onSceneChange({ weather: w.id })}
          style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16,
            background: scene.weather === w.id ? '#E0102B' : '#15151a',
            border: scene.weather === w.id ? 'none' : '1px solid #26262c', color: scene.weather === w.id ? '#fff' : '#7d7d85',
            clipPath: 'polygon(0 0,100% 0,100% 78%,78% 100%,0 100%)' }}>
          {w.label}
        </button>
      ))}
    </div>
  </div>
);

export default SceneTitle;
```

- [ ] **Step 4: Implementar ActiveBar**

Create `tabs/cena/ActiveBar.tsx`:
```tsx
import React from 'react';
import type { Character } from '../../types';

export interface ActiveBarProps {
  active: Character | null;
}

function Bar({ label, current, max, gradient }: { label: string; current: number; max: number; gradient: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: 34, fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '1px', color: '#8a8a90' }}>{label}</span>
      <span style={{ flex: 1, height: 9, background: '#26262c', borderRadius: 2, overflow: 'hidden' }}>
        <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: gradient }} />
      </span>
      <span style={{ width: 42, textAlign: 'right', fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#e9e9ee' }}>{current}/{max}</span>
    </div>
  );
}

const ActiveBar: React.FC<ActiveBarProps> = ({ active }) => {
  if (!active) return null;
  return (
    <div style={{ flex: 'none', alignSelf: 'center', width: 460, background: 'linear-gradient(180deg,#141417,#0e0e11)',
      border: '1px solid #2a2a30', borderRadius: 3, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, position: 'relative',
      clipPath: 'polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#E0102B' }} />
      {active.icon
        ? <img src={active.icon} alt="" style={{ width: 58, height: 58, flex: 'none', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E0102B' }} />
        : <div style={{ width: 58, height: 58, flex: 'none', borderRadius: '50%', background: '#15151a', border: '2px solid #E0102B' }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 22, letterSpacing: '2px', color: '#f1f1f4', lineHeight: 1, textTransform: 'uppercase' }}>{active.name}</div>
        <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Bar label="HP" current={active.currentHp} max={active.maxHp} gradient="linear-gradient(90deg,#B00C22,#E0102B)" />
          <Bar label="AURA" current={active.currentAura} max={active.maxAura} gradient="linear-gradient(90deg,#6f6f9e,#cfcfe6)" />
        </div>
      </div>
    </div>
  );
};

export default ActiveBar;
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tabs/cena/SceneTitle.test.tsx tabs/cena/ActiveBar.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add tabs/cena/SceneTitle.tsx tabs/cena/SceneTitle.test.tsx tabs/cena/ActiveBar.tsx tabs/cena/ActiveBar.test.tsx
git commit -m "feat(cena): SceneTitle + ActiveBar (crimson)"
```

---

## Task 7: MapBoard (mapa + grid + tokens arrastáveis)

**Files:**
- Create: `tabs/cena/MapBoard.tsx`, `tabs/cena/MapBoard.test.tsx`

Recebe a imagem do mapa, os participantes presentes (party presentes + NPCs `present`) e o mapa de posições; renderiza grade + token por participante. Arrastar chama `onMoveToken(id, {x,y})` (% do mapa). O cálculo de % usa `getBoundingClientRect`; em jsdom o rect é 0 → o handler é protegido (não chama com NaN), por isso o teste cobre **renderização** e o drag é verificado manualmente.

- [ ] **Step 1: Teste (falha primeiro)**

Create `tabs/cena/MapBoard.test.tsx`:
```tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import MapBoard from './MapBoard';
import type { Character } from '../../types';

afterEach(() => cleanup());

function ch(id: string, name: string): Character {
  return { id, name, icon: '', maxHp: 10, currentHp: 10, maxAura: 5, currentAura: 5, maxAmmo: 0, currentAmmo: 0,
    baseInitiative: 0, cardIds: [], conditions: [], items: [] };
}

describe('MapBoard', () => {
  it('renderiza um token por participante presente, com a inicial do nome', () => {
    render(<MapBoard image="" participants={[ch('p1', 'Shinkai'), ch('p2', 'Mikhail')]} tokens={{}} activeId={null} onMoveToken={() => {}} onSelect={() => {}} />);
    // sem imagem mostra o placeholder
    expect(screen.getByText(/solte o mapa/i)).toBeTruthy();
    // tokens mostram a inicial
    expect(screen.getAllByText('S').length).toBeGreaterThan(0);
    expect(screen.getAllByText('M').length).toBeGreaterThan(0);
  });

  it('aplica a posição salva do token', () => {
    render(<MapBoard image="x.png" participants={[ch('p1', 'Shinkai')]} tokens={{ p1: { x: 40, y: 60 } }} activeId="p1" onMoveToken={() => {}} onSelect={() => {}} />);
    const token = screen.getByText('S').closest('[data-token-id]') as HTMLElement;
    expect(token.getAttribute('data-token-id')).toBe('p1');
    expect(token.style.left).toBe('40%');
    expect(token.style.top).toBe('60%');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/cena/MapBoard.test.tsx`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

Create `tabs/cena/MapBoard.tsx`:
```tsx
import React from 'react';
import type { Character } from '../../types';

export interface MapBoardProps {
  image: string;
  participants: Character[];
  tokens: Record<string, { x: number; y: number }>;
  activeId: string | null;
  onMoveToken: (id: string, pos: { x: number; y: number }) => void;
  onSelect: (id: string) => void;
}

const DEFAULT_POS = { x: 50, y: 50 };

const MapBoard: React.FC<MapBoardProps> = ({ image, participants, tokens, activeId, onMoveToken, onSelect }) => {
  const boardRef = React.useRef<HTMLDivElement>(null);
  const dragId = React.useRef<string | null>(null);

  const posOf = (id: string, idx: number) => tokens[id] ?? { x: 20 + (idx * 12) % 60, y: DEFAULT_POS.y };

  const clientToPct = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragId.current) return;
      const pct = clientToPct(e.clientX, e.clientY);
      if (pct) onMoveToken(dragId.current, pct);
    };
    const onUp = () => { dragId.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [onMoveToken]);

  return (
    <div ref={boardRef} style={{ flex: 1, minHeight: 0, position: 'relative', border: '1px solid #1e1e24', borderRadius: 3, overflow: 'hidden', background: '#08080a' }}>
      {image
        ? <div style={{ position: 'absolute', inset: 0, background: `url(${image}) center/cover` }} />
        : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#55555c', fontFamily: "'Barlow Semi Condensed',sans-serif", letterSpacing: '2px', fontSize: 13 }}>SOLTE O MAPA DA CENA AQUI</div>}
      {/* vinheta */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(120% 90% at 50% 40%, transparent 40%, rgba(0,0,0,.7) 100%)' }} />
      {/* grade */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.12,
        background: 'linear-gradient(#fff 1px, transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '54px 54px' }} />
      {/* tokens */}
      {participants.map((p, idx) => {
        const pos = posOf(p.id, idx);
        const isActive = p.id === activeId;
        return (
          <div key={p.id} data-token-id={p.id}
            onMouseDown={() => { dragId.current = p.id; onSelect(p.id); }}
            title={p.name}
            style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)',
              width: 54, height: 54, borderRadius: '50%', cursor: 'grab', overflow: 'hidden',
              border: isActive ? '2px solid #E0102B' : '2px solid #34343c',
              boxShadow: isActive ? '0 0 18px rgba(224,16,43,.6)' : '0 2px 8px rgba(0,0,0,.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: p.icon ? `url(${p.icon}) center/cover` : '#15151a' }}>
            {!p.icon && <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 20, color: isActive ? '#E0102B' : '#9a9aa1' }}>{p.name.charAt(0).toUpperCase()}</span>}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 12, bottom: 12, fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: '2px', color: '#8a8a90', background: 'rgba(8,8,10,.6)', padding: '5px 9px', borderRadius: 2 }}>CAMADA · MESTRE</div>
    </div>
  );
};

export default MapBoard;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/cena/MapBoard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add tabs/cena/MapBoard.tsx tabs/cena/MapBoard.test.tsx
git commit -m "feat(cena): MapBoard (mapa + grade + tokens arrastáveis)"
```

---

## Task 8: Montar o layout de exploração na CenaTab

**Files:**
- Modify: `tabs/CenaTab.tsx`, `tabs/CenaTab.test.tsx`
- Delete: `tabs/cena/SceneStage.tsx`, `tabs/cena/SceneStage.test.tsx`

- [ ] **Step 1: Remover o SceneStage antigo**
```bash
git rm tabs/cena/SceneStage.tsx tabs/cena/SceneStage.test.tsx
```

- [ ] **Step 2: Atualizar o teste**

Substituir `tabs/CenaTab.test.tsx` por:
```tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CenaTab from './CenaTab';
import { createDefaultCena } from '../utils/cena';
import type { Character } from '../types';

afterEach(() => cleanup());

function cast(id: string, name: string): Character {
  return { id, name, icon: '', maxHp: 20, currentHp: 12, maxAura: 6, currentAura: 6,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], role: 'cast' };
}

describe('CenaTab (exploração crimson)', () => {
  it('mostra o nome do local e a party', () => {
    const cena = createDefaultCena();
    cena.scene.locationName = 'A FORTALEZA';
    render(<CenaTab cena={cena} characters={[cast('p1', 'Shinkai')]} cards={[]} seals={[]} items={[]} weapons={[]} updateCena={() => {}} updateCharacterStats={() => {}} />);
    expect(screen.getByDisplayValue('A FORTALEZA')).toBeTruthy();
    expect(screen.getByText('Shinkai')).toBeTruthy();
  });

  it('selecionar um membro da party o coloca em destaque (ActiveBar)', () => {
    const cena = createDefaultCena();
    render(<CenaTab cena={cena} characters={[cast('p1', 'Shinkai')]} cards={[]} seals={[]} items={[]} weapons={[]} updateCena={() => {}} updateCharacterStats={() => {}} />);
    fireEvent.click(screen.getByText('Shinkai'));
    expect(screen.getByText('12/20')).toBeTruthy();
  });
});
```

- [ ] **Step 3: Implementar**

Substituir `tabs/CenaTab.tsx` por:
```tsx
import React from 'react';
import type { Card, Character, Item, Seal, Weapon } from '../types';
import type { CenaState, SceneState } from '../utils/cena';
import { setScene, addNpcFromCharacter, removeNpc, toggleNpcHidden, toggleNpcPresent, setToken } from '../utils/cena';
import { resolveCards, resolveSeals, resolveOwnedItems, resolveWeapons } from '../utils/items';
import LogPanel from './cena/LogPanel';
import SceneTitle from './cena/SceneTitle';
import MapBoard from './cena/MapBoard';
import ActiveBar from './cena/ActiveBar';
import RosterPanel, { type ActiveRef } from './cena/RosterPanel';
import { SealsPanel, ActionsPanel } from './cena/ActivePanels';

export interface CenaTabProps {
  cena: CenaState;
  characters: Character[];
  cards: Card[];
  seals: Seal[];
  items: Item[];
  weapons: Weapon[];
  updateCena: (next: CenaState) => void;
  updateCharacterStats: (charId: string, updates: Partial<Character>) => void;
}

/**
 * Aba Cena — Exploração (Fase 2C, estética Crimson). Layout em 3 colunas:
 *   [log]   [ SceneTitle / MapBoard / ActiveBar ]   [roster]
 *   [selos] [             (centro)             ]   [actions]
 */
const CenaTab: React.FC<CenaTabProps> = ({ cena, characters, cards, seals, items, weapons, updateCena }) => {
  const [active, setActive] = React.useState<ActiveRef | null>(null);

  const party = characters.filter(c => (c.role ?? 'npc') === 'cast');
  const npcChars = characters.filter(c => (c.role ?? 'npc') === 'npc');
  const importable = npcChars.filter(c => !cena.npcRoster.some(n => n.id === c.id));
  const presentNpcs = cena.npcRoster.filter(n => n.present && !n.hidden);
  const participants: Character[] = [...party, ...presentNpcs];

  const activeChar: Character | null = !active
    ? null
    : active.side === 'party'
      ? party.find(c => c.id === active.id) ?? null
      : cena.npcRoster.find(n => n.id === active.id) ?? null;

  const activeCards = activeChar ? resolveCards(activeChar, cards) : [];
  const activeSeals = activeChar ? resolveSeals(activeChar, seals) : [];
  const activeItems = activeChar ? resolveOwnedItems(activeChar, items) : [];
  const activeWeapons = activeChar ? resolveWeapons(activeChar, weapons) : [];

  const onSceneChange = (partial: Partial<SceneState>) => updateCena(setScene(cena, partial));

  // Selecionar um token do mapa marca o ativo (party ou npc).
  const selectById = (id: string) => {
    if (party.some(c => c.id === id)) setActive({ id, side: 'party' });
    else if (cena.npcRoster.some(n => n.id === id)) setActive({ id, side: 'npc' });
  };

  return (
    <div style={{ display: 'grid', gap: 14, height: '100%', minHeight: 0, color: '#ececef',
      gridTemplateColumns: '318px 1fr 364px', gridTemplateRows: '1fr 212px',
      gridTemplateAreas: `"log stage roster" "selos stage actions"` }}>

      <div style={{ gridArea: 'log', minHeight: 0 }}>
        <LogPanel log={cena.log} notes={cena.scene.notes} onNotesChange={notes => onSceneChange({ notes })} />
      </div>

      <div style={{ gridArea: 'stage', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SceneTitle scene={cena.scene} onSceneChange={onSceneChange} />
        <MapBoard image={cena.scene.image} participants={participants} tokens={cena.tokens}
          activeId={active?.id ?? null}
          onMoveToken={(id, pos) => updateCena(setToken(cena, id, pos))}
          onSelect={selectById} />
        <ActiveBar active={activeChar} />
      </div>

      <div style={{ gridArea: 'roster', minHeight: 0 }}>
        <RosterPanel
          party={party} npcRoster={cena.npcRoster} importable={importable} active={active}
          onSelectActive={setActive}
          onImportNpc={id => { const c = npcChars.find(x => x.id === id); if (c) updateCena(addNpcFromCharacter(cena, c)); }}
          onToggleHidden={id => updateCena(toggleNpcHidden(cena, id))}
          onTogglePresent={id => updateCena(toggleNpcPresent(cena, id))}
          onRemoveNpc={id => { updateCena(removeNpc(cena, id)); setActive(prev => (prev?.side === 'npc' && prev.id === id ? null : prev)); }}
        />
      </div>

      <div style={{ gridArea: 'selos', minHeight: 0 }}>
        <SealsPanel seals={activeSeals} />
      </div>

      <div style={{ gridArea: 'actions', minHeight: 0 }}>
        <ActionsPanel cards={activeCards} items={activeItems} weapons={activeWeapons} />
      </div>
    </div>
  );
};

export default CenaTab;
```

- [ ] **Step 4: Verificar tudo**

Run: `npx vitest run tabs/CenaTab.test.tsx` → PASS.
Run: `npx vitest run` → suíte verde.
Run: `npx tsc --noEmit 2>&1 | grep "error TS"` → só os 3 pré-existentes (App.tsx 4760/5654, vitest.config.ts); nenhum em tabs/* ou utils/*.
Run: `npm run build` → sucesso.

- [ ] **Step 5: Verificação manual**

Run: `npm run dev`. Aba Cena (inicial) deve mostrar:
- Estética crimson/dark, fontes Anton/Barlow/Cinzel.
- Esquerda: LOG/NOTAS + SELOS. Centro: título da cena + mapa (grade) + barra do ativo. Direita: PARTY|NPCS + AÇÕES.
- Clicar num membro da party → destaque no ActiveBar + selos/ações dele.
- Mapa mostra um token por presente (party + NPCs presentes); arrastar um token reposiciona e persiste ao recarregar.
- Editar nome/subtítulo/clima e Notas persiste.

- [ ] **Step 6: Commit**
```bash
git add tabs/CenaTab.tsx tabs/CenaTab.test.tsx
git commit -m "feat(cena): layout de exploração crimson + grid de tokens"
```

---

## Self-Review (cobertura vs. decisões)

- **Tema crimson só na Cena:** Task 1 (atmosfera noir + CENA_VARS, via applySectionTheme). ✔
- **Fontes Anton/Barlow:** Task 1 (index.html). ✔
- **Log sem input:** Task 3 (re-skin sem campo de mensagem). ✔
- **Grid de tokens funcional simples (do zero):** Tasks 2 (tokens/setToken) + 7 (MapBoard) + 8 (wiring; participantes = party + NPCs presentes; arrastar persiste). ✔
- **Re-skin de todos os painéis (Frame A):** Tasks 3–8. ✔
- **Ativo = party OU npc:** Task 8 (`activeChar`, `selectById`). ✔
- **Sem modo combate (Frame B):** fora de escopo → Fase 2D. ✔
- **Placeholder scan / tipos:** sem TBD; `setToken`/`setEncounterActive`/`tokens`/`MapBoardProps`/`ActiveRef` consistentes entre tasks. ✔
- **`setEncounterActive`** é adicionado na Task 2 mas só será usado na Fase 2D (toggle de modo) — exportado agora para evitar churn; não é dead-wire (helper público testado).

## Fora de escopo (próximo plano)
- **Fase 2D — Modo Combate (visual):** toggle Exploração↔Combate (via `setEncounterActive`), `InitiativeTracker` (topo centro), overlays "Showtime"/retículo no MapBoard, `ActionMenu` vertical (P5) e `ActiveSpotlight` maior. Sem lógica real de iniciativa/turnos (Fase 3).
- **Fase 3 — Combate-lite real**, **Fase 2B — editor de NPC**, **Fase 4 — limpeza** (inalteradas).
