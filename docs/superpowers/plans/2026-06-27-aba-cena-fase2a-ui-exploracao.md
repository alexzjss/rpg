# Aba "Cena" — Fase 2A: UI de Exploração — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a UI de exploração da aba Cena (layout cockpit estilo Alchemy): cena central com personagem ativo em destaque, painel Party | NPCs à direita, Log | Notas à esquerda, e os painéis de Selos (inferior-esq.) e Ações (inferior-dir.) do personagem ativo. Sem combate (Fase 3) e sem editor completo de NPC (Fase 2B).

**Architecture:** A `CenaTab` vira o orquestrador de layout (CSS grid) e dona da seleção do personagem ativo (estado local, não persistido). Componentes filhos isolados em `tabs/cena/*`, cada um com uma responsabilidade. Toda mutação de estado da cena passa por funções puras em `utils/cena.ts` aplicadas via `updateCena`. A resolução de cartas/selos/itens/armas de um personagem usa helpers puros em `utils/items.ts`. NPCs nesta fase são populados **importando** personagens existentes `role==='npc'` da aba Personagens (que já têm ficha completa); criar NPC do zero + editor completo é a Fase 2B.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest + @testing-library/react (sem jest-dom — usar `getByText`/`queryByText`/`fireEvent`/`.toBeTruthy()`, e `cleanup` no `afterEach`). Temas via CSS vars (`--bg-*`, `--text-*`, `--sec-accent`, `--ember`, `--border-mid`...).

**Decisões fechadas (do brainstorm/refino):**
- Party (painel direito) = `characters.filter(c => (c.role ?? 'npc') === 'cast')`.
- Personagem **ativo** pode ser da party **ou** um NPC do roster (seleção local em `CenaTab`).
- Botão **+** nesta fase: **importar** um `Character role==='npc'` para o `npcRoster` (criar do zero + editor = Fase 2B).
- Layout B: centro = cena (100%); Selos no canto inferior-esquerdo; Ações no canto inferior-direito.

**Verificação global:** Testes `npx vitest run` · Type-check `npx tsc --noEmit` (baseline tem 3 erros pré-existentes não relacionados: `App.tsx` iterator, `App.tsx` Combatant `pos`, `vitest.config.ts`; nenhuma task pode ADICIONAR erros) · Build `npm run build`.

---

## Escopo

### Entra (Fase 2A)
- Helpers puros de mutação da cena (`setScene`, `addNpcFromCharacter`, `removeNpc`, `toggleNpcHidden`, `toggleNpcPresent`).
- Helpers puros de resolução (`resolveCards`, `resolveSeals`) + reuso de `resolveOwnedItems`/`resolveWeapons`.
- `LogPanel` (esq.): abas Log (read-only) + Notas (edita `scene.notes`).
- `SceneStage` (centro): fundo da cena + título/subtítulo/clima editáveis + personagem ativo em destaque (HP/Aura).
- `RosterPanel` (dir.): abas Party | NPCs; seleciona ativo; importa/oculta/remove NPC; mostra Ocultos.
- `SealsPanel` (inf-esq.) e `ActionsPanel` (inf-dir.): listam selos / cartas+itens+armas do ativo (display).
- `CenaTab`: monta o grid e gerencia o estado do ativo.

### Fica para depois
- Fase 2B: criar NPC do zero + editor completo de NPC.
- Fase 3: botão Iniciar/Encerrar Combate, iniciativa, turnos, resolução de ações, log automático populado.

---

## Estrutura de arquivos (Fase 2A)

- **Modificar** `utils/cena.ts` — add `setScene`, `addNpcFromCharacter`, `removeNpc`, `toggleNpcHidden`, `toggleNpcPresent`.
- **Modificar** `utils/cena.test.ts` — testes dos novos helpers.
- **Modificar** `utils/items.ts` — add `resolveCards`, `resolveSeals`.
- **Modificar** `utils/items.test.ts` (criar se não existir) — testes de `resolveCards`/`resolveSeals`.
- **Criar** `tabs/cena/LogPanel.tsx` + `tabs/cena/LogPanel.test.tsx`.
- **Criar** `tabs/cena/SceneStage.tsx` + `tabs/cena/SceneStage.test.tsx`.
- **Criar** `tabs/cena/RosterPanel.tsx` + `tabs/cena/RosterPanel.test.tsx`.
- **Criar** `tabs/cena/ActivePanels.tsx` (exporta `SealsPanel` e `ActionsPanel`) + `tabs/cena/ActivePanels.test.tsx`.
- **Modificar** `tabs/CenaTab.tsx` — montar layout grid + estado do ativo + fiação. (Test `tabs/CenaTab.test.tsx` atualizado.)

Convenção de teste (todos os `*.test.tsx`): importar `cleanup` e chamar em `afterEach`:
```tsx
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(() => cleanup());
```

---

## Task 1: Helpers de mutação da cena

**Files:**
- Modify: `utils/cena.ts`
- Modify: `utils/cena.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Em `utils/cena.test.ts`, adicionar ao final (mantendo os imports existentes; adicionar os novos):
```ts
import {
  setScene, addNpcFromCharacter, removeNpc, toggleNpcHidden, toggleNpcPresent,
} from './cena';
import type { Character } from '../types';

function fakeChar(id: string, over: Partial<Character> = {}): Character {
  return {
    id, name: `Char ${id}`, icon: '', maxHp: 10, currentHp: 10, maxAura: 5, currentAura: 5,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [],
    role: 'npc', ...over,
  };
}

describe('setScene', () => {
  it('faz merge parcial em scene sem mutar o original', () => {
    const cena = createDefaultCena();
    const next = setScene(cena, { locationName: 'Mina', weather: 'storm' });
    expect(next.scene.locationName).toBe('Mina');
    expect(next.scene.weather).toBe('storm');
    expect(next.scene.notes).toBe(cena.scene.notes);
    expect(cena.scene.locationName).toBe('Local Desconhecido'); // original intacto
    expect(next).not.toBe(cena);
  });
});

describe('addNpcFromCharacter', () => {
  it('cria um NpcEntry presente e revelado a partir de um Character', () => {
    const cena = createDefaultCena();
    const next = addNpcFromCharacter(cena, fakeChar('a'));
    expect(next.npcRoster).toHaveLength(1);
    expect(next.npcRoster[0]).toMatchObject({ id: 'a', isNpc: true, hidden: false, present: true });
  });
  it('não duplica NPC com o mesmo id (no-op)', () => {
    const cena = addNpcFromCharacter(createDefaultCena(), fakeChar('a'));
    const again = addNpcFromCharacter(cena, fakeChar('a'));
    expect(again.npcRoster).toHaveLength(1);
    expect(again).toBe(cena); // no-op retorna a mesma referência
  });
});

describe('removeNpc / toggleNpcHidden / toggleNpcPresent', () => {
  it('removeNpc tira pelo id', () => {
    const cena = addNpcFromCharacter(createDefaultCena(), fakeChar('a'));
    expect(removeNpc(cena, 'a').npcRoster).toHaveLength(0);
  });
  it('toggleNpcHidden inverte hidden só do alvo', () => {
    let cena = addNpcFromCharacter(createDefaultCena(), fakeChar('a'));
    cena = addNpcFromCharacter(cena, fakeChar('b'));
    const next = toggleNpcHidden(cena, 'a');
    expect(next.npcRoster.find(n => n.id === 'a')!.hidden).toBe(true);
    expect(next.npcRoster.find(n => n.id === 'b')!.hidden).toBe(false);
  });
  it('toggleNpcPresent inverte present do alvo', () => {
    const cena = addNpcFromCharacter(createDefaultCena(), fakeChar('a'));
    expect(toggleNpcPresent(cena, 'a').npcRoster[0].present).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run utils/cena.test.ts`
Expected: FAIL — `setScene`/`addNpcFromCharacter`/etc. não exportados.

- [ ] **Step 3: Implementar**

Em `utils/cena.ts`, ao final do arquivo, adicionar:
```ts
/** Merge parcial imutável em scene. */
export function setScene(cena: CenaState, partial: Partial<SceneState>): CenaState {
  return { ...cena, scene: { ...cena.scene, ...partial } };
}

/** Cria um NpcEntry (presente, revelado) a partir de um Character e o adiciona ao roster.
 *  No-op (retorna a mesma referência) se já houver NPC com o mesmo id. */
export function addNpcFromCharacter(cena: CenaState, char: Character): CenaState {
  if (cena.npcRoster.some(n => n.id === char.id)) return cena;
  const npc: NpcEntry = { ...char, isNpc: true, hidden: false, present: true };
  return { ...cena, npcRoster: [...cena.npcRoster, npc] };
}

/** Remove um NPC do roster pelo id. */
export function removeNpc(cena: CenaState, npcId: string): CenaState {
  return { ...cena, npcRoster: cena.npcRoster.filter(n => n.id !== npcId) };
}

/** Inverte o estado oculto/revelado de um NPC. */
export function toggleNpcHidden(cena: CenaState, npcId: string): CenaState {
  return { ...cena, npcRoster: cena.npcRoster.map(n => n.id === npcId ? { ...n, hidden: !n.hidden } : n) };
}

/** Inverte se o NPC está presente na cena. */
export function toggleNpcPresent(cena: CenaState, npcId: string): CenaState {
  return { ...cena, npcRoster: cena.npcRoster.map(n => n.id === npcId ? { ...n, present: !n.present } : n) };
}
```
Garanta que `Character` está importado (já é: `import type { Character } from '../types';`).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run utils/cena.test.ts`
Expected: PASS (todos).

- [ ] **Step 5: Commit**
```bash
git add utils/cena.ts utils/cena.test.ts
git commit -m "feat(cena): helpers de mutação da cena (scene/npc roster)"
```

---

## Task 2: Helpers de resolução de cartas e selos

**Files:**
- Modify: `utils/items.ts`
- Create: `utils/items.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Create `utils/items.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { resolveCards, resolveSeals } from './items';
import type { Card, Character, Seal } from '../types';

function fakeChar(over: Partial<Character> = {}): Character {
  return {
    id: 'c', name: 'C', icon: '', maxHp: 10, currentHp: 10, maxAura: 5, currentAura: 5,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], ...over,
  };
}
const card = (id: string): Card => ({ id, name: id, image: '', auraCost: 0, type: 'ação', description: '' });
const seal = (id: string): Seal => ({ id, name: id, code: '', image: '', description: '' });

describe('resolveCards', () => {
  it('resolve cardIds para cartas do catálogo, ignorando órfãs e preservando ordem', () => {
    const char = fakeChar({ cardIds: ['x', 'missing', 'y'] });
    const out = resolveCards(char, [card('y'), card('x'), card('z')]);
    expect(out.map(c => c.id)).toEqual(['x', 'y']);
  });
  it('lista vazia quando não há cardIds', () => {
    expect(resolveCards(fakeChar({ cardIds: [] }), [card('x')])).toEqual([]);
  });
});

describe('resolveSeals', () => {
  it('resolve sealIds para selos do catálogo, ignorando órfãos', () => {
    const char = fakeChar({ sealIds: ['s1', 'nope'] });
    const out = resolveSeals(char, [seal('s1'), seal('s2')]);
    expect(out.map(s => s.id)).toEqual(['s1']);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run utils/items.test.ts`
Expected: FAIL — `resolveCards`/`resolveSeals` não exportados.

- [ ] **Step 3: Implementar**

Em `utils/items.ts`, trocar a primeira linha de import para incluir `Card` e `Seal`:
```ts
import { Card, Character, Item, OwnedItem, Seal, Weapon } from '../types';
```
E adicionar ao final do arquivo:
```ts
/** Reconstrói as cartas que um personagem possui, a partir do catálogo (ignora órfãs, preserva ordem). */
export function resolveCards(char: Character, catalogue: Card[]): Card[] {
  return (char.cardIds ?? [])
    .map(id => catalogue.find(c => c.id === id))
    .filter(Boolean) as Card[];
}

/** Reconstrói os selos que um personagem possui, a partir do catálogo (ignora órfãos, preserva ordem). */
export function resolveSeals(char: Character, catalogue: Seal[]): Seal[] {
  return (char.sealIds ?? [])
    .map(id => catalogue.find(s => s.id === id))
    .filter(Boolean) as Seal[];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run utils/items.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add utils/items.ts utils/items.test.ts
git commit -m "feat(cena): resolveCards/resolveSeals para o personagem ativo"
```

---

## Task 3: LogPanel (esquerda: Log | Notas)

**Files:**
- Create: `tabs/cena/LogPanel.tsx`
- Test: `tabs/cena/LogPanel.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

Create `tabs/cena/LogPanel.test.tsx`:
```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LogPanel from './LogPanel';
import type { CenaLogEntry } from '../../utils/cena';

afterEach(() => cleanup());

const log: CenaLogEntry[] = [
  { id: '1', kind: 'system', text: 'A aventura começa', timestamp: 1 },
];

describe('LogPanel', () => {
  it('mostra as entradas do log na aba Log', () => {
    render(<LogPanel log={log} notes="" onNotesChange={() => {}} />);
    expect(screen.getByText('A aventura começa')).toBeTruthy();
  });

  it('mostra vazio quando não há log', () => {
    render(<LogPanel log={[]} notes="" onNotesChange={() => {}} />);
    expect(screen.getByText(/nada aconteceu ainda/i)).toBeTruthy();
  });

  it('troca para Notas e edita o texto', () => {
    const onNotesChange = vi.fn();
    render(<LogPanel log={log} notes="velho" onNotesChange={onNotesChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /notas/i }));
    const ta = screen.getByRole('textbox');
    fireEvent.change(ta, { target: { value: 'novo' } });
    expect(onNotesChange).toHaveBeenCalledWith('novo');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/cena/LogPanel.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

Create `tabs/cena/LogPanel.tsx`:
```tsx
import React from 'react';
import type { CenaLogEntry } from '../../utils/cena';

export interface LogPanelProps {
  log: CenaLogEntry[];
  notes: string;
  onNotesChange: (next: string) => void;
}

const tabBtn = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
  textTransform: 'uppercase', cursor: 'pointer', background: 'transparent', border: 'none',
  color: active ? 'var(--sec-accent)' : 'var(--text-muted)',
  borderBottom: active ? '2px solid var(--sec-accent)' : '2px solid transparent',
});

const LogPanel: React.FC<LogPanelProps> = ({ log, notes, onNotesChange }) => {
  const [tab, setTab] = React.useState<'log' | 'notes'>('log');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
      background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', borderRadius: 14, overflow: 'hidden' }}>
      <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid var(--border-faint)' }}>
        <button role="tab" aria-selected={tab === 'log'} style={tabBtn(tab === 'log')} onClick={() => setTab('log')}>Log</button>
        <button role="tab" aria-selected={tab === 'notes'} style={tabBtn(tab === 'notes')} onClick={() => setTab('notes')}>Notas</button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 12 }}>
        {tab === 'log' ? (
          log.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>Nada aconteceu ainda.</p>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none', margin: 0, padding: 0 }}>
              {log.map(e => (
                <li key={e.id} style={{ fontSize: 12, color: 'var(--text-secondary)', borderLeft: '2px solid var(--border-mid)', paddingLeft: 8 }}>
                  {e.text}
                </li>
              ))}
            </ul>
          )
        ) : (
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Anotações do mestre…"
            style={{ width: '100%', height: '100%', minHeight: 200, resize: 'none', background: 'var(--bg-base)',
              color: 'var(--text-primary)', border: '1px solid var(--border-faint)', borderRadius: 8, padding: 10, fontSize: 13, outline: 'none' }}
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
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add tabs/cena/LogPanel.tsx tabs/cena/LogPanel.test.tsx
git commit -m "feat(cena): LogPanel (Log + Notas)"
```

---

## Task 4: SceneStage (centro: cena + clima + ativo em destaque)

**Files:**
- Create: `tabs/cena/SceneStage.tsx`
- Test: `tabs/cena/SceneStage.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

Create `tabs/cena/SceneStage.test.tsx`:
```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SceneStage from './SceneStage';
import { createDefaultCena } from '../../utils/cena';
import type { Character } from '../../types';

afterEach(() => cleanup());

function fakeChar(over: Partial<Character> = {}): Character {
  return { id: 'a', name: 'Doravar', icon: '', maxHp: 20, currentHp: 14, maxAura: 8, currentAura: 5,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], ...over };
}

describe('SceneStage', () => {
  it('mostra o nome e subtítulo do local', () => {
    const scene = { ...createDefaultCena().scene, locationName: 'A Propriedade do Barão', subtitle: 'Sordane' };
    render(<SceneStage scene={scene} active={null} onSceneChange={() => {}} />);
    expect(screen.getByText('A Propriedade do Barão')).toBeTruthy();
    expect(screen.getByText('Sordane')).toBeTruthy();
  });

  it('mostra o personagem ativo em destaque com HP', () => {
    const scene = createDefaultCena().scene;
    render(<SceneStage scene={scene} active={fakeChar()} onSceneChange={() => {}} />);
    expect(screen.getByText('Doravar')).toBeTruthy();
    expect(screen.getByText('14/20')).toBeTruthy();
  });

  it('edita o nome do local pelo campo editável', () => {
    const onSceneChange = vi.fn();
    const scene = createDefaultCena().scene;
    render(<SceneStage scene={scene} active={null} onSceneChange={onSceneChange} />);
    const input = screen.getByDisplayValue(scene.locationName);
    fireEvent.change(input, { target: { value: 'Mina Profunda' } });
    expect(onSceneChange).toHaveBeenCalledWith({ locationName: 'Mina Profunda' });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/cena/SceneStage.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

Create `tabs/cena/SceneStage.tsx`:
```tsx
import React from 'react';
import type { Character } from '../../types';
import type { SceneState, SceneWeather } from '../../utils/cena';
import { ImagePickerButton } from '../../components/ui';

export interface SceneStageProps {
  scene: SceneState;
  /** Personagem (party ou NPC) atualmente ativo, ou null. */
  active: Character | null;
  onSceneChange: (partial: Partial<SceneState>) => void;
}

const WEATHERS: { id: SceneWeather; label: string }[] = [
  { id: 'sunny', label: '☀' }, { id: 'rain', label: '🌧' }, { id: 'storm', label: '⚡' },
  { id: 'fog', label: '🌫' }, { id: 'snow', label: '❄' }, { id: 'night', label: '🌙' },
];

function Bar({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      <span style={{ color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: 'var(--bg-base)', borderRadius: 4, overflow: 'hidden', minWidth: 90 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
      <span style={{ color: 'var(--text-secondary)', minWidth: 44 }}>{current}/{max}</span>
    </div>
  );
}

const SceneStage: React.FC<SceneStageProps> = ({ scene, active, onSceneChange }) => {
  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 0, borderRadius: 16, overflow: 'hidden',
      border: '1px solid var(--border-mid)',
      background: scene.image
        ? `linear-gradient(180deg, rgba(10,8,6,0.45), rgba(10,8,6,0.85)), url(${scene.image}) center/cover`
        : 'radial-gradient(circle at 50% 120%, var(--bg-raised), var(--bg-base))' }}>

      {/* Cabeçalho: título + subtítulo + clima */}
      <div style={{ position: 'absolute', top: 14, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 16px' }}>
        <input
          value={scene.locationName}
          onChange={e => onSceneChange({ locationName: e.target.value })}
          style={{ background: 'transparent', border: 'none', textAlign: 'center', outline: 'none',
            fontFamily: "'Cinzel', serif", fontSize: 26, letterSpacing: '0.1em', color: 'var(--text-primary)', width: '100%' }}
        />
        <input
          value={scene.subtitle}
          onChange={e => onSceneChange({ subtitle: e.target.value })}
          placeholder="subtítulo…"
          style={{ background: 'transparent', border: 'none', textAlign: 'center', outline: 'none',
            fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sec-accent)', width: '100%' }}
        />
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {WEATHERS.map(w => (
            <button key={w.id} title={w.id} onClick={() => onSceneChange({ weather: w.id })}
              style={{ width: 26, height: 26, borderRadius: 6, cursor: 'pointer', fontSize: 13,
                background: scene.weather === w.id ? 'var(--sec-accent)' : 'var(--bg-surface)',
                border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}>
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Picker de imagem da cena, canto superior direito */}
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <ImagePickerButton value={scene.image} onUpdate={url => onSceneChange({ image: url })} label="Cena" compact placement="bottom-left" />
      </div>

      {/* Personagem ativo em destaque, base central */}
      {active && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          background: 'rgba(10,8,6,0.7)', border: '1px solid var(--border-gold)', borderRadius: 14, padding: '10px 18px', minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {active.icon
              ? <img src={active.icon} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-gold)' }} />
              : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-raised)', border: '1px solid var(--border-gold)' }} />}
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: 'var(--text-primary)' }}>{active.name}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <Bar label="HP" current={active.currentHp} max={active.maxHp} color="var(--ember)" />
            <Bar label="Aura" current={active.currentAura} max={active.maxAura} color="var(--sec-accent-2)" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneStage;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/cena/SceneStage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add tabs/cena/SceneStage.tsx tabs/cena/SceneStage.test.tsx
git commit -m "feat(cena): SceneStage (cena central + clima + ativo)"
```

---

## Task 5: RosterPanel (direita: Party | NPCs)

**Files:**
- Create: `tabs/cena/RosterPanel.tsx`
- Test: `tabs/cena/RosterPanel.test.tsx`

Contrato: recebe a party (já filtrada por `role==='cast'`), o `npcRoster`, os personagens importáveis (`role==='npc'` ainda não no roster), o ativo atual e callbacks. Seleciona ativo, importa/oculta/remove NPC.

- [ ] **Step 1: Escrever o teste que falha**

Create `tabs/cena/RosterPanel.test.tsx`:
```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RosterPanel from './RosterPanel';
import { createDefaultCena, addNpcFromCharacter } from '../../utils/cena';
import type { Character } from '../../types';

afterEach(() => cleanup());

function fakeChar(id: string, over: Partial<Character> = {}): Character {
  return { id, name: `N-${id}`, icon: '', maxHp: 10, currentHp: 10, maxAura: 5, currentAura: 5,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], role: 'npc', ...over };
}

describe('RosterPanel', () => {
  it('lista a party e seleciona um ativo ao clicar', () => {
    const onSelectActive = vi.fn();
    const party = [fakeChar('p1', { role: 'cast', name: 'Doravar' })];
    render(
      <RosterPanel party={party} npcRoster={[]} importable={[]} active={null}
        onSelectActive={onSelectActive} onImportNpc={() => {}} onToggleHidden={() => {}}
        onTogglePresent={() => {}} onRemoveNpc={() => {}} />,
    );
    fireEvent.click(screen.getByText('Doravar'));
    expect(onSelectActive).toHaveBeenCalledWith({ id: 'p1', side: 'party' });
  });

  it('na aba NPCs lista o roster e separa os ocultos', () => {
    let cena = addNpcFromCharacter(createDefaultCena(), fakeChar('a', { name: 'Guarda' }));
    cena = addNpcFromCharacter(cena, fakeChar('b', { name: 'Barão' }));
    cena.npcRoster[1].hidden = true;
    render(
      <RosterPanel party={[]} npcRoster={cena.npcRoster} importable={[]} active={null}
        onSelectActive={() => {}} onImportNpc={() => {}} onToggleHidden={() => {}}
        onTogglePresent={() => {}} onRemoveNpc={() => {}} />,
    );
    fireEvent.click(screen.getByRole('tab', { name: /npcs/i }));
    expect(screen.getByText('Guarda')).toBeTruthy();
    expect(screen.getByText('Barão')).toBeTruthy();
    expect(screen.getByText(/ocultos/i)).toBeTruthy();
  });

  it('o botão + importa um personagem importável', () => {
    const onImportNpc = vi.fn();
    render(
      <RosterPanel party={[]} npcRoster={[]} importable={[fakeChar('x', { name: 'Drone' })]} active={null}
        onSelectActive={() => {}} onImportNpc={onImportNpc} onToggleHidden={() => {}}
        onTogglePresent={() => {}} onRemoveNpc={() => {}} />,
    );
    fireEvent.click(screen.getByRole('tab', { name: /npcs/i }));
    fireEvent.click(screen.getByRole('button', { name: /adicionar npc/i }));
    fireEvent.click(screen.getByText('Drone'));
    expect(onImportNpc).toHaveBeenCalledWith('x');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/cena/RosterPanel.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

Create `tabs/cena/RosterPanel.tsx`:
```tsx
import React from 'react';
import { Plus, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { Character } from '../../types';
import type { NpcEntry } from '../../utils/cena';

export type ActiveRef = { id: string; side: 'party' | 'npc' };

export interface RosterPanelProps {
  party: Character[];
  npcRoster: NpcEntry[];
  /** Personagens role==='npc' ainda não no roster (para importar). */
  importable: Character[];
  active: ActiveRef | null;
  onSelectActive: (ref: ActiveRef) => void;
  onImportNpc: (characterId: string) => void;
  onToggleHidden: (npcId: string) => void;
  onTogglePresent: (npcId: string) => void;
  onRemoveNpc: (npcId: string) => void;
}

const tabBtn = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
  textTransform: 'uppercase', cursor: 'pointer', background: 'transparent', border: 'none',
  color: active ? 'var(--sec-accent)' : 'var(--text-muted)',
  borderBottom: active ? '2px solid var(--sec-accent)' : '2px solid transparent',
});

function Row({ char, selected, onClick, children }: {
  char: Character; selected: boolean; onClick: () => void; children?: React.ReactNode;
}) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', cursor: 'pointer',
      borderRadius: 10, background: selected ? 'var(--bg-raised)' : 'transparent',
      border: selected ? '1px solid var(--border-gold)' : '1px solid transparent' }}>
      {char.icon
        ? <img src={char.icon} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
        : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-base)' }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{char.name}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>HP {char.currentHp}/{char.maxHp}</div>
      </div>
      {children}
    </div>
  );
}

const iconBtn: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 3 };

const RosterPanel: React.FC<RosterPanelProps> = ({
  party, npcRoster, importable, active, onSelectActive, onImportNpc, onToggleHidden, onTogglePresent, onRemoveNpc,
}) => {
  const [tab, setTab] = React.useState<'party' | 'npcs'>('party');
  const [importing, setImporting] = React.useState(false);
  const visibleNpcs = npcRoster.filter(n => !n.hidden);
  const hiddenNpcs = npcRoster.filter(n => n.hidden);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
      background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', borderRadius: 14, overflow: 'hidden' }}>
      <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid var(--border-faint)' }}>
        <button role="tab" aria-selected={tab === 'party'} style={tabBtn(tab === 'party')} onClick={() => setTab('party')}>Party</button>
        <button role="tab" aria-selected={tab === 'npcs'} style={tabBtn(tab === 'npcs')} onClick={() => setTab('npcs')}>NPCs</button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tab === 'party' ? (
          party.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', padding: 8 }}>Sem personagens no elenco.</p>
            : party.map(c => (
                <Row key={c.id} char={c} selected={active?.side === 'party' && active.id === c.id}
                  onClick={() => onSelectActive({ id: c.id, side: 'party' })} />
              ))
        ) : (
          <>
            {visibleNpcs.map(n => (
              <Row key={n.id} char={n} selected={active?.side === 'npc' && active.id === n.id}
                onClick={() => onSelectActive({ id: n.id, side: 'npc' })}>
                <button style={iconBtn} title={n.present ? 'Presente' : 'Ausente'}
                  onClick={e => { e.stopPropagation(); onTogglePresent(n.id); }}>
                  <span style={{ fontSize: 14, color: n.present ? 'var(--sec-accent)' : 'var(--text-muted)' }}>●</span>
                </button>
                <button style={iconBtn} title="Ocultar" onClick={e => { e.stopPropagation(); onToggleHidden(n.id); }}><Eye size={14} /></button>
                <button style={iconBtn} title="Remover" onClick={e => { e.stopPropagation(); onRemoveNpc(n.id); }}><Trash2 size={14} /></button>
              </Row>
            ))}

            {hiddenNpcs.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '8px 8px 2px' }}>
                  Ocultos ({hiddenNpcs.length})
                </div>
                {hiddenNpcs.map(n => (
                  <Row key={n.id} char={n} selected={active?.side === 'npc' && active.id === n.id}
                    onClick={() => onSelectActive({ id: n.id, side: 'npc' })}>
                    <button style={iconBtn} title="Revelar" onClick={e => { e.stopPropagation(); onToggleHidden(n.id); }}><EyeOff size={14} /></button>
                    <button style={iconBtn} title="Remover" onClick={e => { e.stopPropagation(); onRemoveNpc(n.id); }}><Trash2 size={14} /></button>
                  </Row>
                ))}
              </>
            )}

            <button onClick={() => setImporting(v => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, padding: '8px',
                background: 'var(--bg-raised)', border: '1px dashed var(--border-gold)', borderRadius: 10,
                color: 'var(--sec-accent)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>
              <Plus size={14} /> Adicionar NPC
            </button>

            {importing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4, padding: 6,
                background: 'var(--bg-base)', borderRadius: 10, border: '1px solid var(--border-faint)' }}>
                {importable.length === 0
                  ? <p style={{ color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', padding: 4 }}>Nenhum NPC disponível para importar.</p>
                  : importable.map(c => (
                      <button key={c.id} onClick={() => { onImportNpc(c.id); setImporting(false); }}
                        style={{ textAlign: 'left', padding: '6px 8px', background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--text-secondary)', fontSize: 12, borderRadius: 6 }}>
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

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/cena/RosterPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add tabs/cena/RosterPanel.tsx tabs/cena/RosterPanel.test.tsx
git commit -m "feat(cena): RosterPanel (Party | NPCs, ativo, importar/ocultar)"
```

---

## Task 6: SealsPanel + ActionsPanel (cantos inferiores)

**Files:**
- Create: `tabs/cena/ActivePanels.tsx`
- Test: `tabs/cena/ActivePanels.test.tsx`

Ambos exibem os recursos do ativo (display-only nesta fase). `SealsPanel` (inf-esq.) = selos. `ActionsPanel` (inf-dir.) = cartas + itens + armas.

- [ ] **Step 1: Escrever o teste que falha**

Create `tabs/cena/ActivePanels.test.tsx`:
```tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SealsPanel, ActionsPanel } from './ActivePanels';
import type { Card, Seal, Weapon } from '../../types';
import type { ResolvedItem } from '../../utils/items';

afterEach(() => cleanup());

const card: Card = { id: 'c1', name: 'Bola de Fogo', image: '', auraCost: 2, type: 'ataque', description: '' };
const seal: Seal = { id: 's1', name: 'Selo do Vínculo', code: '', image: '', description: '' };
const weapon: Weapon = { id: 'w1', name: 'Machado', description: '', image: '' };
const item: ResolvedItem = { id: 'i1', name: 'Poção', description: '', image: '', quantity: 3 };

describe('SealsPanel', () => {
  it('lista os selos do ativo', () => {
    render(<SealsPanel seals={[seal]} />);
    expect(screen.getByText('Selo do Vínculo')).toBeTruthy();
  });
  it('estado vazio sem ativo', () => {
    render(<SealsPanel seals={[]} />);
    expect(screen.getByText(/nenhum selo/i)).toBeTruthy();
  });
});

describe('ActionsPanel', () => {
  it('lista cartas, itens e armas', () => {
    render(<ActionsPanel cards={[card]} items={[item]} weapons={[weapon]} />);
    expect(screen.getByText('Bola de Fogo')).toBeTruthy();
    expect(screen.getByText('Poção')).toBeTruthy();
    expect(screen.getByText('Machado')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/cena/ActivePanels.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

Create `tabs/cena/ActivePanels.tsx`:
```tsx
import React from 'react';
import type { Card, Seal, Weapon } from '../../types';
import type { ResolvedItem } from '../../utils/items';

const shell: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
  background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', borderRadius: 14, overflow: 'hidden',
};
const header: React.CSSProperties = {
  padding: '6px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
  color: 'var(--text-muted)', borderBottom: '1px solid var(--border-faint)',
};
const body: React.CSSProperties = { flex: 1, minHeight: 0, overflow: 'auto', padding: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start' };
const empty: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', padding: 6 };

function Chip({ name, image, badge }: { name: string; image?: string; badge?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 9,
      background: 'var(--bg-raised)', border: '1px solid var(--border-faint)', fontSize: 12, color: 'var(--text-primary)' }}>
      {image
        ? <img src={image} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
        : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sec-accent)' }} />}
      <span>{name}</span>
      {badge && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{badge}</span>}
    </div>
  );
}

export const SealsPanel: React.FC<{ seals: Seal[] }> = ({ seals }) => (
  <div style={shell}>
    <div style={header}>Selos</div>
    <div style={body}>
      {seals.length === 0
        ? <p style={empty}>Nenhum selo.</p>
        : seals.map(s => <Chip key={s.id} name={s.name} image={s.image} />)}
    </div>
  </div>
);

export const ActionsPanel: React.FC<{ cards: Card[]; items: ResolvedItem[]; weapons: Weapon[] }> = ({ cards, items, weapons }) => {
  const isEmpty = cards.length === 0 && items.length === 0 && weapons.length === 0;
  return (
    <div style={shell}>
      <div style={header}>Ações · Cartas · Itens</div>
      <div style={body}>
        {isEmpty
          ? <p style={empty}>Sem ações disponíveis.</p>
          : (
            <>
              {cards.map(c => <Chip key={`c-${c.id}`} name={c.name} image={c.image} badge={c.auraCost ? `${c.auraCost}✦` : undefined} />)}
              {weapons.map(w => <Chip key={`w-${w.id}`} name={w.name} image={w.image} />)}
              {items.map(i => <Chip key={`i-${i.id}`} name={i.name} image={i.image} badge={`×${i.quantity}`} />)}
            </>
          )}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/cena/ActivePanels.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add tabs/cena/ActivePanels.tsx tabs/cena/ActivePanels.test.tsx
git commit -m "feat(cena): SealsPanel + ActionsPanel do ativo (display)"
```

---

## Task 7: Montar o layout e fiar tudo na CenaTab

**Files:**
- Modify: `tabs/CenaTab.tsx`
- Modify: `tabs/CenaTab.test.tsx`

A `CenaTab` monta o grid cockpit, mantém o estado do ativo (local) e liga os filhos aos dados/`updateCena`.

- [ ] **Step 1: Atualizar o teste**

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

describe('CenaTab (exploração)', () => {
  it('mostra o nome do local e a party', () => {
    const cena = createDefaultCena();
    cena.scene.locationName = 'A Propriedade do Barão';
    render(
      <CenaTab cena={cena} characters={[cast('p1', 'Doravar')]} cards={[]} seals={[]} items={[]} weapons={[]}
        updateCena={() => {}} updateCharacterStats={() => {}} />,
    );
    expect(screen.getAllByDisplayValue('A Propriedade do Barão').length).toBeGreaterThan(0);
    expect(screen.getByText('Doravar')).toBeTruthy();
  });

  it('selecionar um membro da party o coloca em destaque no centro', () => {
    const cena = createDefaultCena();
    render(
      <CenaTab cena={cena} characters={[cast('p1', 'Doravar')]} cards={[]} seals={[]} items={[]} weapons={[]}
        updateCena={() => {}} updateCharacterStats={() => {}} />,
    );
    // clica no nome na lista da party (direita)
    fireEvent.click(screen.getByText('Doravar'));
    // agora aparece também no destaque central com a barra de HP (12/20)
    expect(screen.getByText('12/20')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/CenaTab.test.tsx`
Expected: FAIL — a `CenaTab` ainda é o scaffold (não tem party nem destaque).

- [ ] **Step 3: Implementar**

Substituir `tabs/CenaTab.tsx` por:
```tsx
import React from 'react';
import type { Card, Character, Item, Seal, Weapon } from '../types';
import type { CenaState, SceneState } from '../utils/cena';
import { setScene, addNpcFromCharacter, removeNpc, toggleNpcHidden, toggleNpcPresent } from '../utils/cena';
import { resolveCards, resolveSeals, resolveOwnedItems, resolveWeapons } from '../utils/items';
import LogPanel from './cena/LogPanel';
import SceneStage from './cena/SceneStage';
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
 * Aba Cena — exploração (Fase 2A). Layout cockpit:
 *   [log] [  cena (ativo)  ] [roster]
 *   [selos][     cena      ][ações ]
 */
const CenaTab: React.FC<CenaTabProps> = ({ cena, characters, cards, seals, items, weapons, updateCena }) => {
  const [active, setActive] = React.useState<ActiveRef | null>(null);

  const party = characters.filter(c => (c.role ?? 'npc') === 'cast');
  const npcChars = characters.filter(c => (c.role ?? 'npc') === 'npc');
  const importable = npcChars.filter(c => !cena.npcRoster.some(n => n.id === c.id));

  // Resolve o Character do ativo (party ou roster)
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

  return (
    <div style={{
      display: 'grid', gap: 12, height: '100%', minHeight: 0,
      gridTemplateColumns: '260px 1fr 300px',
      gridTemplateRows: '1fr 168px',
      gridTemplateAreas: `"log stage roster" "seals stage actions"`,
    }}>
      <div style={{ gridArea: 'log', minHeight: 0 }}>
        <LogPanel log={cena.log} notes={cena.scene.notes} onNotesChange={notes => onSceneChange({ notes })} />
      </div>

      <div style={{ gridArea: 'stage', minHeight: 0 }}>
        <SceneStage scene={cena.scene} active={activeChar} onSceneChange={onSceneChange} />
      </div>

      <div style={{ gridArea: 'roster', minHeight: 0 }}>
        <RosterPanel
          party={party}
          npcRoster={cena.npcRoster}
          importable={importable}
          active={active}
          onSelectActive={setActive}
          onImportNpc={id => {
            const char = npcChars.find(c => c.id === id);
            if (char) updateCena(addNpcFromCharacter(cena, char));
          }}
          onToggleHidden={id => updateCena(toggleNpcHidden(cena, id))}
          onTogglePresent={id => updateCena(toggleNpcPresent(cena, id))}
          onRemoveNpc={id => {
            updateCena(removeNpc(cena, id));
            setActive(prev => (prev?.side === 'npc' && prev.id === id ? null : prev));
          }}
        />
      </div>

      <div style={{ gridArea: 'seals', minHeight: 0 }}>
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

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/CenaTab.test.tsx`
Expected: PASS.

- [ ] **Step 5: Verificar tipos, suíte e build**

Run: `npx vitest run`
Expected: toda a suíte verde (inclui os novos testes).

Run: `npx tsc --noEmit 2>&1 | grep "error TS"`
Expected: EXATAMENTE os 3 erros pré-existentes (App.tsx iterator, App.tsx Combatant `pos`, vitest.config.ts). Nenhum novo, nenhum em `tabs/cena/*`, `tabs/CenaTab.tsx`, `utils/cena.ts`, `utils/items.ts`.

Run: `npm run build`
Expected: build conclui sem erros.

- [ ] **Step 6: Verificação manual**

Run: `npm run dev` e abrir o app (aba Cena é a inicial).
Expected:
- Layout em grid: Log à esquerda, cena no centro, Party|NPCs à direita, Selos no canto inf-esq., Ações no canto inf-dir.
- Clicar num membro da Party o destaca no centro com HP/Aura; Selos/Ações mostram os recursos dele.
- Aba NPCs: "Adicionar NPC" lista personagens `role==='npc'`; importar adiciona à lista; ocultar move para "Ocultos"; remover tira.
- Editar nome/subtítulo/clima/imagem da cena e o texto de Notas persiste ao recarregar (via `updateCena`).

- [ ] **Step 7: Commit**
```bash
git add tabs/CenaTab.tsx tabs/CenaTab.test.tsx
git commit -m "feat(cena): montar layout de exploração e fiar painéis"
```

---

## Self-Review (cobertura vs. decisões)

- **Layout cockpit B (cena central, selos inf-esq., ações inf-dir.):** Task 7 (grid areas). ✔
- **Party = role 'cast':** Task 7 (`party` filter). ✔
- **Ativo = party OU NPC:** Tasks 5+7 (`ActiveRef.side`, `activeChar` resolve em ambos). ✔
- **Botão + importa role 'npc':** Tasks 5+7 (`importable`, `onImportNpc` → `addNpcFromCharacter`). ✔ (criar do zero + editor = Fase 2B, fora de escopo)
- **Log read-only + Notas editável:** Task 3. ✔
- **Cena editável (nome/sub/clima/imagem) + ativo em destaque:** Task 4. ✔
- **Ocultos:** Task 5 (separação visível/oculto + toggle). ✔
- **Selos/Cartas/Itens/Armas do ativo:** Tasks 2 (resolvers) + 6 (display) + 7 (fiação). ✔
- **Mutação imutável via updateCena:** Task 1 (helpers puros). ✔
- **Placeholder scan:** todo passo de código mostra o código; nenhum "TBD". ✔
- **Consistência de tipos:** `ActiveRef`, `NpcEntry`, `SceneState`, `ResolvedItem`, `resolveCards/resolveSeals`, `setScene/addNpcFromCharacter/removeNpc/toggleNpcHidden/toggleNpcPresent` usados com os mesmos nomes entre tasks. ✔

## Fora de escopo (próximos planos)
- **Fase 2B:** criar NPC do zero + editor completo de NPC (stats/cartas/selos) + (re)editar party pela cena, se desejado.
- **Fase 3:** hub Iniciar/Encerrar Combate, iniciativa, ordem de turnos, resolução de ações (escrevendo HP/Aura/condições via `updateCharacterStats`) e log automático.
- **Fase 4:** remoção do código legado (CombatTab/JourneyTab/components/combat/*, Cozinhar/Forjar/Loja, combatMigration, campos de grid).
