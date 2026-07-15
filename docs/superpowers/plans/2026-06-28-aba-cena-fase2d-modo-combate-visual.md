# Aba "Cena" — Fase 2D: Modo Combate (visual / "Showtime") — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o **modo combate visual** (Variação B — "Showtime") à aba Cena: um toggle alterna Exploração↔Combate; no combate o centro mostra um **tracker de iniciativa**, o mapa ganha overlays "Showtime" (slash + retículo + camada), o ativo vira **spotlight** ("SEU TURNO"), e a direita troca as Ações por um **menu vertical estilo P5**. Sem lógica real de iniciativa/turnos/resolução (isso é a Fase 3) — tudo aqui é skin dirigido por `encounter.isActive` e pela ordem derivada dos presentes.

**Architecture:** O modo é `cena.encounter.isActive`, alternado por `setEncounterActive` (já existe na 2C) via um botão na CenaTab. A `CenaTab` é reestruturada de grid-areas para **3 colunas flex** (como o handoff), trocando o conteúdo do centro e da direita conforme o modo. Componentes novos: `InitiativeTracker` (centro-topo no combate) e `ActionMenu` (direita-baixo no combate). `MapBoard` e `ActiveBar` ganham uma flag `combat`. A esquerda (Log+Selos) é idêntica nos dois modos.

**Tech Stack:** React 19 + TS, Vite, Vitest + @testing-library/react (sem jest-dom; `afterEach(cleanup)`). Estética crimson já estabelecida (2C). Referência: `docs/superpowers/design/vtt-crimson-handoff.html` (Variação B — Showtime).

**Paleta/fontes:** já no app (2C). Reutilizar: `#E0102B` crimson, `#101013`/`#15151a`/`#0a0a0c` fundos, `#1e1e24`/`#26262c`/`#3a1620` bordas, Anton (display), Barlow Semi Condensed (labels), Cinzel (título). Slash Showtime: `linear-gradient(100deg,#E0102B,#8a0a1c)` rotacionado.

**Verificação global:** `npx vitest run` · `npx tsc --noEmit` (baseline = 3 erros pré-existentes: App.tsx 4760/5654, vitest.config.ts) · `npm run build`.

---

## Escopo

### Entra (Fase 2D)
- Toggle Exploração↔Combate (botão) via `setEncounterActive`.
- `InitiativeTracker` (RODADA + fileira de participantes, ativo destacado, rótulo "SUA VEZ" estático).
- `ActionMenu` vertical (ATACAR/HABILIDADE/FORMA/ITEM/GUARDA + rodapé de recurso) — **display-only**.
- `MapBoard` modo combate: slash "SHOWTIME", rótulo "CAMADA · COMBATE", retículo no primeiro inimigo presente.
- `ActiveBar` modo combate: badge "SEU TURNO".
- `CenaTab` reestruturada em 3 colunas flex, com troca de conteúdo por modo.

### Fora de escopo
- Rolagem real de iniciativa, ordem por valor, avanço de turno/rodada, resolução de ações, dano/condições, log automático. (Fase 3.)
- Editor de NPC (Fase 2B). Limpeza do legado (Fase 4).

---

## Estrutura de arquivos (Fase 2D)

- **Criar** `tabs/cena/InitiativeTracker.tsx` + teste.
- **Criar** `tabs/cena/ActionMenu.tsx` + teste.
- **Modificar** `tabs/cena/MapBoard.tsx` (prop `combat?`, `enemyIds?`) + teste.
- **Modificar** `tabs/cena/ActiveBar.tsx` (prop `combat?`) + teste.
- **Modificar** `tabs/CenaTab.tsx` (3 colunas flex + toggle + troca por modo) + teste.

Convenção de teste: `import { afterEach } from 'vitest'; import { cleanup } from '@testing-library/react'; afterEach(() => cleanup());`

---

## Task 1: InitiativeTracker

**Files:**
- Create: `tabs/cena/InitiativeTracker.tsx`, `tabs/cena/InitiativeTracker.test.tsx`

Mostra "RODADA n", uma fileira de participantes (avatar/inicial + nome curto), com o ativo destacado em crimson e os demais esmaecidos, e um rótulo "SUA VEZ" à direita (estático nesta fase).

- [ ] **Step 1: Teste (falha primeiro)**

Create `tabs/cena/InitiativeTracker.test.tsx`:
```tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import InitiativeTracker from './InitiativeTracker';
import type { Character } from '../../types';

afterEach(() => cleanup());

function ch(id: string, name: string): Character {
  return { id, name, icon: '', maxHp: 10, currentHp: 10, maxAura: 5, currentAura: 5, maxAmmo: 0, currentAmmo: 0,
    baseInitiative: 0, cardIds: [], conditions: [], items: [] };
}

describe('InitiativeTracker', () => {
  it('mostra a rodada e os participantes', () => {
    render(<InitiativeTracker round={3} participants={[ch('p1', 'Shinkai'), ch('p2', 'Mikhail')]} activeId="p1" />);
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText(/rodada/i)).toBeTruthy();
    expect(screen.getByText('SHINKAI')).toBeTruthy();
    expect(screen.getByText('MIKHAIL')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/cena/InitiativeTracker.test.tsx`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

Create `tabs/cena/InitiativeTracker.tsx`:
```tsx
import React from 'react';
import type { Character } from '../../types';

export interface InitiativeTrackerProps {
  round: number;
  participants: Character[];
  activeId: string | null;
}

const InitiativeTracker: React.FC<InitiativeTrackerProps> = ({ round, participants, activeId }) => (
  <div style={{ flex: 'none', background: 'linear-gradient(180deg,#101013,#0c0c0f)', border: '1px solid #1e1e24',
    borderRadius: 3, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 13, letterSpacing: '2px', color: '#E0102B', lineHeight: 1.1 }}>
      RODADA<br /><span style={{ color: '#f1f1f4', fontSize: 22 }}>{round}</span>
    </div>
    <div style={{ width: 1, height: 42, background: '#26262c' }} />
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto' }}>
      {participants.map(p => {
        const isActive = p.id === activeId;
        return (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: isActive ? 1 : 0.62 }}>
            <div style={{ width: isActive ? 50 : 40, height: isActive ? 50 : 40, borderRadius: '50%', overflow: 'hidden',
              border: isActive ? '2px solid #E0102B' : '2px solid #34343c',
              boxShadow: isActive ? '0 0 14px rgba(224,16,43,.6)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: p.icon ? `url(${p.icon}) center/cover` : '#15151a' }}>
              {!p.icon && <span style={{ fontFamily: "'Anton',sans-serif", fontSize: isActive ? 20 : 16, color: isActive ? '#E0102B' : '#9a9aa1' }}>{p.name.charAt(0).toUpperCase()}</span>}
            </div>
            <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: isActive ? 700 : 600, fontSize: 10,
              letterSpacing: '1px', color: isActive ? '#E0102B' : '#7d7d85', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {p.name.split(' ')[0]}
            </span>
          </div>
        );
      })}
    </div>
    <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '1.5px', color: '#8a8a90', textAlign: 'right' }}>
      SUA VEZ<br /><span style={{ color: '#E0102B' }}>0:24</span>
    </div>
  </div>
);

export default InitiativeTracker;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/cena/InitiativeTracker.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add tabs/cena/InitiativeTracker.tsx tabs/cena/InitiativeTracker.test.tsx
git commit -m "feat(cena): InitiativeTracker (skin de combate)"
```

---

## Task 2: ActionMenu (menu vertical P5, display-only)

**Files:**
- Create: `tabs/cena/ActionMenu.tsx`, `tabs/cena/ActionMenu.test.tsx`

Lista vertical de 5 ações fixas (ATACAR primária crimson, HABILIDADE, FORMA, ITEM, GUARDA) com atalho numérico, e um rodapé de recurso. Display-only (sem lógica). `onAction?(id)` opcional para uso futuro.

- [ ] **Step 1: Teste (falha primeiro)**

Create `tabs/cena/ActionMenu.test.tsx`:
```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ActionMenu from './ActionMenu';

afterEach(() => cleanup());

describe('ActionMenu', () => {
  it('lista as ações de combate', () => {
    render(<ActionMenu />);
    for (const label of ['ATACAR', 'HABILIDADE', 'FORMA', 'ITEM', 'GUARDA']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
  it('chama onAction ao clicar (quando fornecido)', () => {
    const onAction = vi.fn();
    render(<ActionMenu onAction={onAction} />);
    fireEvent.click(screen.getByText('ATACAR'));
    expect(onAction).toHaveBeenCalledWith('atacar');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/cena/ActionMenu.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `tabs/cena/ActionMenu.tsx`:
```tsx
import React from 'react';

export interface ActionMenuProps {
  onAction?: (id: string) => void;
}

interface ActionDef { id: string; label: string; key: string; primary?: boolean; badge?: string }
const ACTIONS: ActionDef[] = [
  { id: 'atacar', label: 'ATACAR', key: '1', primary: true },
  { id: 'habilidade', label: 'HABILIDADE', key: '2' },
  { id: 'forma', label: 'FORMA', key: '3', badge: '1◆' },
  { id: 'item', label: 'ITEM', key: '4' },
  { id: 'guarda', label: 'GUARDA', key: '5' },
];

const PANEL: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
  background: '#101013', border: '1px solid #1e1e24', borderRadius: 3, padding: 14,
  clipPath: 'polygon(0 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)',
};

const ActionMenu: React.FC<ActionMenuProps> = ({ onAction }) => (
  <div style={PANEL}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 }}>
      <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '2px', color: '#6f6f76' }}>AÇÕES · CARTAS · ITENS</span>
      <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#E0102B,transparent)' }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      {ACTIONS.map(a => (
        <button key={a.id} onClick={() => onAction?.(a.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: a.primary ? '12px 14px' : '11px 14px', cursor: 'pointer',
            background: a.primary ? 'linear-gradient(100deg,#E0102B,#a60c20)' : '#15151a',
            border: a.primary ? 'none' : '1px solid #2a2a30',
            boxShadow: a.primary ? '0 4px 18px rgba(224,16,43,.35)' : 'none',
            clipPath: 'polygon(0 0,100% 0,100% 72%,96% 100%,0 100%)' }}>
          <span style={{ flex: 1, textAlign: 'left', fontFamily: "'Anton',sans-serif", fontSize: 18, letterSpacing: '2px', color: a.primary ? '#fff' : '#e9e9ee' }}>{a.label}</span>
          {a.badge && <span style={{ fontSize: 11, fontWeight: 700, color: '#9a9aa1' }}>{a.badge}</span>}
          <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: a.primary ? 'rgba(255,255,255,.7)' : '#6f6f76' }}>{a.key}</span>
        </button>
      ))}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 11, borderTop: '1px solid #1e1e24' }}>
      <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '1px', color: '#6f6f76' }}>
        RECURSO <span style={{ color: '#E0102B', fontWeight: 700 }}>3◆</span> disponível
      </span>
    </div>
  </div>
);

export default ActionMenu;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/cena/ActionMenu.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add tabs/cena/ActionMenu.tsx tabs/cena/ActionMenu.test.tsx
git commit -m "feat(cena): ActionMenu vertical (skin de combate)"
```

---

## Task 3: MapBoard — overlays de combate

**Files:**
- Modify: `tabs/cena/MapBoard.tsx`, `tabs/cena/MapBoard.test.tsx`

Adiciona props opcionais `combat?: boolean` e `enemyIds?: string[]`. Em combate: rótulo "CAMADA · COMBATE" (em vez de "MESTRE"), slash diagonal "SHOWTIME", e um retículo no primeiro inimigo presente que tiver token.

- [ ] **Step 1: Estender o teste**

Adicionar ao `tabs/cena/MapBoard.test.tsx` (mantendo o que existe):
```tsx
describe('MapBoard combate', () => {
  it('mostra a camada de combate e o slash Showtime', () => {
    render(<MapBoard image="x.png" participants={[]} tokens={{}} activeId={null} onMoveToken={() => {}} onSelect={() => {}} combat />);
    expect(screen.getByText(/camada · combate/i)).toBeTruthy();
    expect(screen.getByText(/showtime/i)).toBeTruthy();
  });
  it('fora de combate mostra a camada do mestre', () => {
    render(<MapBoard image="x.png" participants={[]} tokens={{}} activeId={null} onMoveToken={() => {}} onSelect={() => {}} />);
    expect(screen.getByText(/camada · mestre/i)).toBeTruthy();
  });
});
```
(O `import` e `afterEach` já existem no arquivo.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/cena/MapBoard.test.tsx`
Expected: FAIL (combate não suportado).

- [ ] **Step 3: Implementar**

Em `tabs/cena/MapBoard.tsx`:
- Estender a interface:
```tsx
export interface MapBoardProps {
  image: string;
  participants: Character[];
  tokens: Record<string, { x: number; y: number }>;
  activeId: string | null;
  onMoveToken: (id: string, pos: { x: number; y: number }) => void;
  onSelect: (id: string) => void;
  combat?: boolean;
  enemyIds?: string[];
}
```
- Na assinatura do componente, desestruturar `combat = false, enemyIds = []`.
- Trocar o label fixo "CAMADA · MESTRE" por dinâmico:
```tsx
      <div style={{ position: 'absolute', left: 12, bottom: 12, fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: '2px', color: '#8a8a90', background: 'rgba(8,8,10,.6)', padding: '5px 9px', borderRadius: 2 }}>
        {combat ? 'CAMADA · COMBATE' : 'CAMADA · MESTRE'}
      </div>
```
- Antes desse label (ainda dentro do board), adicionar os overlays de combate (depois dos tokens):
```tsx
      {combat && (
        <>
          <div style={{ position: 'absolute', left: -40, bottom: -20, width: 560, height: 120,
            background: 'linear-gradient(100deg,#E0102B,#8a0a1c)', transform: 'rotate(-7deg)', opacity: 0.96,
            boxShadow: '0 8px 40px rgba(224,16,43,.5)', display: 'flex', alignItems: 'center', paddingLeft: 60, pointerEvents: 'none' }}>
            <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 46, letterSpacing: '3px', color: '#fff', textShadow: '3px 3px 0 #6a0816' }}>
              SHOW<span style={{ color: '#0a0a0c' }}>TIME</span>
            </span>
          </div>
          {(() => {
            const enemyId = enemyIds.find(id => tokens[id]);
            const pos = enemyId ? tokens[enemyId] : null;
            if (!pos) return null;
            return (
              <div style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)', width: 78, height: 78, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', inset: 0, border: '2px solid #E0102B', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', inset: -9, border: '2px dashed rgba(224,16,43,.5)', borderRadius: '50%' }} />
              </div>
            );
          })()}
        </>
      )}
```
(Posicione o bloco `{combat && (...)}` imediatamente antes do `<div>` do label de camada, para que o slash fique sob o rótulo mas sobre o mapa.)

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/cena/MapBoard.test.tsx`
Expected: PASS (rendering antigo + novos).

- [ ] **Step 5: Commit**
```bash
git add tabs/cena/MapBoard.tsx tabs/cena/MapBoard.test.tsx
git commit -m "feat(cena): MapBoard overlays de combate (Showtime + retículo)"
```

---

## Task 4: ActiveBar — variante de combate

**Files:**
- Modify: `tabs/cena/ActiveBar.tsx`, `tabs/cena/ActiveBar.test.tsx`

Adiciona `combat?: boolean`. Em combate: badge "SEU TURNO" ao lado do nome + borda crimson mais forte.

- [ ] **Step 1: Estender o teste**

Adicionar ao `tabs/cena/ActiveBar.test.tsx`:
```tsx
describe('ActiveBar combate', () => {
  it('mostra o badge SEU TURNO em combate', () => {
    render(<ActiveBar active={char} combat />);
    expect(screen.getByText(/seu turno/i)).toBeTruthy();
  });
  it('não mostra o badge fora de combate', () => {
    render(<ActiveBar active={char} />);
    expect(screen.queryByText(/seu turno/i)).toBeNull();
  });
});
```
(`char` já está definido no arquivo.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/cena/ActiveBar.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Em `tabs/cena/ActiveBar.tsx`:
- Estender props: `export interface ActiveBarProps { active: Character | null; combat?: boolean; }` e desestruturar `({ active, combat = false })`.
- Envolver o nome num flex com o badge:
```tsx
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontFamily: "'Anton',sans-serif", fontSize: combat ? 26 : 22, letterSpacing: '2px', color: '#f1f1f4', lineHeight: 1, textTransform: 'uppercase' }}>{active.name}</span>
          {combat && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#fff', background: '#E0102B', padding: '2px 6px' }}>SEU TURNO</span>}
        </div>
```
  (substitui o `<div ...>{active.name}</div>` atual).
- Opcional: quando `combat`, reforçar a borda do contêiner para `1px solid #3a1620` e adicionar `boxShadow: '0 0 16px rgba(224,16,43,.4)'`. Aplique condicionalmente no style do contêiner externo.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/cena/ActiveBar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add tabs/cena/ActiveBar.tsx tabs/cena/ActiveBar.test.tsx
git commit -m "feat(cena): ActiveBar variante de combate (SEU TURNO)"
```

---

## Task 5: CenaTab — 3 colunas flex + toggle + troca por modo

**Files:**
- Modify: `tabs/CenaTab.tsx`, `tabs/CenaTab.test.tsx`

Reestrutura o layout de grid-areas para **3 colunas flex** (idêntico visual na exploração) e adiciona o toggle + a troca de conteúdo por `cena.encounter.isActive`.

- [ ] **Step 1: Atualizar o teste**

Substituir `tabs/CenaTab.test.tsx` por:
```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CenaTab from './CenaTab';
import { createDefaultCena } from '../utils/cena';
import type { Character } from '../types';

afterEach(() => cleanup());

function cast(id: string, name: string): Character {
  return { id, name, icon: '', maxHp: 20, currentHp: 12, maxAura: 6, currentAura: 6,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], role: 'cast' };
}

describe('CenaTab — exploração', () => {
  it('mostra o nome do local e a party', () => {
    const cena = createDefaultCena();
    cena.scene.locationName = 'A FORTALEZA';
    render(<CenaTab cena={cena} characters={[cast('p1', 'Shinkai')]} cards={[]} seals={[]} items={[]} weapons={[]} updateCena={() => {}} updateCharacterStats={() => {}} />);
    expect(screen.getByDisplayValue('A FORTALEZA')).toBeTruthy();
    expect(screen.getByText('Shinkai')).toBeTruthy();
  });

  it('o botão Iniciar Combate liga o encounter', () => {
    const cena = createDefaultCena();
    const updateCena = vi.fn();
    render(<CenaTab cena={cena} characters={[]} cards={[]} seals={[]} items={[]} weapons={[]} updateCena={updateCena} updateCharacterStats={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /iniciar combate/i }));
    expect(updateCena).toHaveBeenCalled();
    expect(updateCena.mock.calls[0][0].encounter.isActive).toBe(true);
  });
});

describe('CenaTab — combate', () => {
  it('com encounter ativo mostra tracker de iniciativa e menu de ações', () => {
    const cena = { ...createDefaultCena(), encounter: { isActive: true, round: 3, turnIndex: 0, order: [] } };
    render(<CenaTab cena={cena} characters={[cast('p1', 'Shinkai')]} cards={[]} seals={[]} items={[]} weapons={[]} updateCena={() => {}} updateCharacterStats={() => {}} />);
    expect(screen.getByText(/rodada/i)).toBeTruthy();
    expect(screen.getByText('ATACAR')).toBeTruthy();
    expect(screen.getByRole('button', { name: /encerrar combate/i })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/CenaTab.test.tsx`
Expected: FAIL (sem toggle/combate).

- [ ] **Step 3: Implementar**

Substituir `tabs/CenaTab.tsx` por:
```tsx
import React from 'react';
import { Swords, X } from 'lucide-react';
import type { Card, Character, Item, Seal, Weapon } from '../types';
import type { CenaState, SceneState } from '../utils/cena';
import { setScene, addNpcFromCharacter, removeNpc, toggleNpcHidden, toggleNpcPresent, setToken, setEncounterActive } from '../utils/cena';
import { resolveCards, resolveSeals, resolveOwnedItems, resolveWeapons } from '../utils/items';
import LogPanel from './cena/LogPanel';
import SceneTitle from './cena/SceneTitle';
import MapBoard from './cena/MapBoard';
import ActiveBar from './cena/ActiveBar';
import RosterPanel, { type ActiveRef } from './cena/RosterPanel';
import { SealsPanel, ActionsPanel } from './cena/ActivePanels';
import InitiativeTracker from './cena/InitiativeTracker';
import ActionMenu from './cena/ActionMenu';

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

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 };

const CenaTab: React.FC<CenaTabProps> = ({ cena, characters, cards, seals, items, weapons, updateCena }) => {
  const [active, setActive] = React.useState<ActiveRef | null>(null);
  const combat = cena.encounter.isActive;

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
  const selectById = (id: string) => {
    if (party.some(c => c.id === id)) setActive({ id, side: 'party' });
    else if (cena.npcRoster.some(n => n.id === id)) setActive({ id, side: 'npc' });
  };

  const toggleBtn = (
    <button onClick={() => updateCena(setEncounterActive(cena, !combat))}
      style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', cursor: 'pointer',
        fontFamily: "'Anton',sans-serif", fontSize: 16, letterSpacing: '2px',
        background: combat ? '#15151a' : 'linear-gradient(100deg,#E0102B,#a60c20)',
        border: combat ? '1px solid #3a1620' : 'none', color: combat ? '#9a9aa1' : '#fff',
        boxShadow: combat ? 'none' : '0 4px 18px rgba(224,16,43,.35)',
        clipPath: 'polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%)' }}>
      {combat ? <X size={16} /> : <Swords size={16} />}
      {combat ? 'ENCERRAR COMBATE' : 'INICIAR COMBATE'}
    </button>
  );

  return (
    <div style={{ display: 'grid', gap: 14, height: '100%', minHeight: 0, color: '#ececef', gridTemplateColumns: '318px 1fr 364px' }}>

      {/* ESQUERDA */}
      <div style={col}>
        <div style={{ flex: 1, minHeight: 0 }}><LogPanel log={cena.log} notes={cena.scene.notes} onNotesChange={notes => onSceneChange({ notes })} /></div>
        <div style={{ height: 212, flex: 'none' }}><SealsPanel seals={activeSeals} /></div>
      </div>

      {/* CENTRO */}
      <div style={col}>
        {toggleBtn}
        {combat
          ? <InitiativeTracker round={cena.encounter.round} participants={participants} activeId={active?.id ?? null} />
          : <SceneTitle scene={cena.scene} onSceneChange={onSceneChange} />}
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <MapBoard image={cena.scene.image} participants={participants} tokens={cena.tokens}
            activeId={active?.id ?? null}
            onMoveToken={(id, pos) => updateCena(setToken(cena, id, pos))}
            onSelect={selectById}
            combat={combat} enemyIds={presentNpcs.map(n => n.id)} />
        </div>
        <ActiveBar active={activeChar} combat={combat} />
      </div>

      {/* DIREITA */}
      <div style={col}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <RosterPanel
            party={party} npcRoster={cena.npcRoster} importable={importable} active={active}
            onSelectActive={setActive}
            onImportNpc={id => { const c = npcChars.find(x => x.id === id); if (c) updateCena(addNpcFromCharacter(cena, c)); }}
            onToggleHidden={id => updateCena(toggleNpcHidden(cena, id))}
            onTogglePresent={id => updateCena(toggleNpcPresent(cena, id))}
            onRemoveNpc={id => { updateCena(removeNpc(cena, id)); setActive(prev => (prev?.side === 'npc' && prev.id === id ? null : prev)); }}
          />
        </div>
        <div style={combat ? { flex: 1, minHeight: 0 } : { height: 212, flex: 'none' }}>
          {combat ? <ActionMenu /> : <ActionsPanel cards={activeCards} items={activeItems} weapons={activeWeapons} />}
        </div>
      </div>
    </div>
  );
};

export default CenaTab;
```

> Nota: na exploração o resultado visual é o mesmo da 2C (Log 1fr + Selos 212; Roster 1fr + Ações 212; centro = título/mapa/ativo). No combate, o centro troca título→tracker, o mapa entra em modo combate, o ativo vira spotlight, e a direita troca Ações→ActionMenu (com mais altura). O `MapBoard` é envolvido num wrapper `flex:1` para preencher a coluna.

- [ ] **Step 4: Verificar tudo**

Run: `npx vitest run tabs/CenaTab.test.tsx` → PASS.
Run: `npx vitest run` → suíte verde.
Run: `npx tsc --noEmit 2>&1 | grep "error TS"` → só os 3 pré-existentes; nada em tabs/* ou utils/*.
Run: `npm run build` → sucesso.

- [ ] **Step 5: Verificação manual**

Run: `npm run dev`. Na aba Cena:
- Botão **INICIAR COMBATE** no topo do centro. Clicar → vira **modo combate**: tracker de iniciativa (RODADA + participantes), mapa com slash **SHOWTIME** + **CAMADA · COMBATE** + retículo num NPC presente posicionado, spotlight do ativo com **SEU TURNO**, e à direita o **menu de ações** vertical (ATACAR…). Botão vira **ENCERRAR COMBATE**.
- Clicar Encerrar → volta à exploração (idêntica à 2C). O modo persiste ao recarregar (encounter.isActive salvo).

- [ ] **Step 6: Commit**
```bash
git add tabs/CenaTab.tsx tabs/CenaTab.test.tsx
git commit -m "feat(cena): modo combate visual (toggle + tracker + action menu)"
```

---

## Self-Review (cobertura vs. decisões)

- **Toggle Exploração↔Combate (visual, via setEncounterActive):** Task 5 (`toggleBtn`, `combat = cena.encounter.isActive`). ✔
- **InitiativeTracker (centro-topo no combate):** Tasks 1 + 5. ✔
- **MapBoard overlays Showtime + camada + retículo:** Tasks 3 + 5 (`combat`, `enemyIds`). ✔
- **ActiveSpotlight (SEU TURNO):** Tasks 4 + 5 (`ActiveBar combat`). ✔
- **ActionMenu vertical P5 (display-only):** Tasks 2 + 5. ✔
- **Exploração inalterada visualmente:** Task 5 (mesma composição da 2C nas 3 colunas flex). ✔
- **Sem lógica real de combate:** ordem do tracker derivada dos presentes; ações sem efeito; round = `encounter.round` (default 1). Fase 3 fará o real. ✔
- **Placeholder scan / tipos:** sem TBD; props `combat`/`enemyIds`/`onAction`, `InitiativeTrackerProps`, `ActionMenuProps` consistentes entre tasks. ✔

## Fora de escopo (próximos planos)
- **Fase 3 — combate-lite real** (rolar iniciativa, ordem por valor, avançar turno/rodada, resolver ações via `updateCharacterStats`, log automático, timer real). TODO carry-over da 2A: limpar `active` ao remover membro da party.
- **Fase 2B — editor de NPC.** **Fase 4 — limpeza do legado.**
