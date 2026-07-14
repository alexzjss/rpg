# Polimento de UI do editor de habilidades (grafo) — Implementation Plan

> **For agentic workers:** Execução inline nesta sessão (sem subagentes, sem commits — pedido explícito do usuário). Mudança puramente visual (CSS-in-JS via `React.CSSProperties`), sem alteração de comportamento, dados ou marcação testável (`aria-label`/`data-testid`/texto). Nenhum teste novo é necessário — a suíte existente roda ao final só para confirmar zero regressão.

**Goal:** Dar identidade visual por família de bloco na paleta e no canvas, destacar melhor o nó selecionado, e reorganizar o cabeçalho do editor em grupos visuais claros.

**Architecture:** Só estilos inline (`React.CSSProperties`) em `NodePalette.tsx`, `GraphCanvas.tsx` e `GraphEditor.tsx`. Nenhuma prop, tipo ou lógica muda.

**Tech Stack:** React + TypeScript, estilos inline (padrão já usado nesses três arquivos).

---

## Task 1: Cores por família na paleta (`NodePalette.tsx`)

**Files:**
- Modify: `components/arsenal/graph/NodePalette.tsx`

- [ ] **Step 1: Substituir o arquivo inteiro**

```tsx
// components/arsenal/graph/NodePalette.tsx
import React from 'react';
import { Plus, Search, Zap } from 'lucide-react';
import { listNodeTypes } from '../../../utils/nodeRegistry';
import { listAbilityTemplates } from '../../../utils/abilityTemplates';
import type { NodeFamily } from '../../../utils/abilityGraph';

export interface PendingConnection { parentId: string; branch?: 'entao' | 'senao' }

interface Props {
  pendingConnection: PendingConnection | null;
  onPick: (type: string) => void;
  onLoadTemplate: (templateId: string) => void;
  onPickTrigger: (type: string) => void;
}

const FAMILY_LABEL: Record<Exclude<NodeFamily, 'gatilho'>, string> = { ramo: 'Ramos (SE)', alvo: 'Alvo', efeito: 'Efeitos' };
const FAMILIES: Exclude<NodeFamily, 'gatilho'>[] = ['ramo', 'alvo', 'efeito'];

/** Cor de identificação por família, reutilizada na paleta e no canvas (GraphCanvas.FAMILY_COLOR usa os mesmos tons). */
const FAMILY_ACCENT: Record<NodeFamily, { border: string; background: string }> = {
  gatilho: { border: 'rgba(212,168,83,.35)', background: 'rgba(212,168,83,.08)' },
  ramo: { border: 'rgba(96,165,250,.35)', background: 'rgba(96,165,250,.08)' },
  alvo: { border: 'rgba(167,139,250,.35)', background: 'rgba(167,139,250,.08)' },
  efeito: { border: 'rgba(45,212,191,.35)', background: 'rgba(45,212,191,.08)' },
};

const field: React.CSSProperties = { width: '100%', padding: '8px 10px', background: 'rgba(7,9,14,.78)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#f1f1f4', outline: 'none', fontSize: 12 };
const sectionTitle: React.CSSProperties = { color: '#92929c', fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', margin: '10px 0 6px' };
const nodeButton: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left', padding: '7px 9px', borderRadius: 7, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)', color: '#e4e4ea', fontSize: 12, cursor: 'pointer' };

function familyButtonStyle(family: NodeFamily, extra: React.CSSProperties = {}): React.CSSProperties {
  const accent = FAMILY_ACCENT[family];
  return { ...nodeButton, borderColor: accent.border, background: accent.background, ...extra };
}

const NodePalette: React.FC<Props> = ({ pendingConnection, onPick, onLoadTemplate, onPickTrigger }) => {
  const [query, setQuery] = React.useState('');
  const q = query.trim().toLocaleLowerCase('pt-BR');
  const templates = listAbilityTemplates();
  const triggers = listNodeTypes('gatilho').filter(def => !q || def.label.toLocaleLowerCase('pt-BR').includes(q));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 12, overflowY: 'auto' }}>
      <label style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 9, top: 9, color: '#697383' }} />
        <input style={{ ...field, paddingLeft: 30 }} placeholder="Buscar nó…" value={query} onChange={e => setQuery(e.target.value)} />
      </label>

      {!!triggers.length && <>
        <div style={sectionTitle}>Gatilho (raiz da habilidade) · {triggers.length}</div>
        {triggers.map(def => (
          <button key={def.type} type="button" style={familyButtonStyle('gatilho')} onClick={() => onPickTrigger(def.type)} title={def.summarize({})}>
            <Zap size={12} /> {def.label}
          </button>
        ))}
      </>}

      {!pendingConnection && (
        <p style={{ color: '#7a7a86', fontSize: 11, marginTop: 8 }}>
          Selecione um &quot;+&quot; no canvas para conectar um novo nó.
        </p>
      )}

      <div style={sectionTitle}>Templates · {templates.length}</div>
      {templates.filter(template => !q || template.label.toLocaleLowerCase('pt-BR').includes(q)).map(template => (
        <button key={template.id} type="button" style={nodeButton} onClick={() => onLoadTemplate(template.id)} title={template.description}>
          <Plus size={12} /> {template.label}
        </button>
      ))}

      {FAMILIES.map(family => {
        const items = listNodeTypes(family).filter(def => !q || def.label.toLocaleLowerCase('pt-BR').includes(q));
        if (!items.length) return null;
        return (
          <React.Fragment key={family}>
            <div style={sectionTitle}>{FAMILY_LABEL[family]} · {items.length}</div>
            {items.map(def => (
              <button
                key={def.type} type="button" style={familyButtonStyle(family, { opacity: pendingConnection ? 1 : 0.45 })}
                disabled={!pendingConnection} onClick={() => onPick(def.type)}
              >
                {def.label}
              </button>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default NodePalette;
```

Nota: a contagem no título de seção usa `items.length`/`triggers.length`/`templates.length` — já filtrados pela busca, então o número reflete o que está visível no momento (comportamento desejado: "Efeitos · 10" sem busca, "Efeitos · 2" filtrando por "escudo" etc.).

- [ ] **Step 2: Rodar os testes existentes (sem mudança de asserções)**

Run: `npm test -- components/arsenal/graph/NodePalette.test.tsx`
Expected: PASS (6 testes, nenhuma asserção depende de cor/estilo — todas usam `getByText`/`getByRole`/`disabled`).

---

## Task 2: Destaque de seleção + cores compartilhadas no canvas (`GraphCanvas.tsx`)

**Files:**
- Modify: `components/arsenal/graph/GraphCanvas.tsx`

- [ ] **Step 1: Trocar o bloco de estilo do nó (linhas 101-130 do arquivo atual) para usar um anel de seleção mais forte**

```tsx
// components/arsenal/graph/GraphCanvas.tsx — substituir o miolo do map de nodes:
        {graph.nodes.map(node => {
          const pos = positions.get(node.id) ?? { x: 0, y: 0 };
          const def = getNodeType(node.type);
          const selected = node.id === selectedNodeId;
          return (
            <div key={node.id}
              data-testid={`graph-node-${node.id}`}
              onMouseDown={e => { e.stopPropagation(); startDrag(node.id, e); }}
              onClick={e => { e.stopPropagation(); onSelect(node.id); }}
              style={{
                position: 'absolute', left: pos.x, top: pos.y, width: NODE_WIDTH, minHeight: NODE_HEIGHT,
                padding: 8, borderRadius: 10, background: 'rgba(18,20,26,.92)', color: '#e4e4ea', fontSize: 11,
                border: `1.5px solid ${selected ? '#f1f1f4' : FAMILY_COLOR[node.family]}`,
                boxShadow: selected ? '0 0 0 3px rgba(241,241,244,.18), 0 0 14px rgba(241,241,244,.25)' : 'none',
                cursor: 'grab', userSelect: 'none',
              }}
            >
```

O restante do corpo do nó (texto do `summarize`, botões de conectar SE/SENÃO ou "+") permanece idêntico — só a linha de `style` do container do nó muda (adiciona `boxShadow` condicional ao `selected`, mantendo a borda branca já existente como reforço).

- [ ] **Step 2: Rodar os testes existentes**

Run: `npm test -- components/arsenal/graph/GraphCanvas.test.tsx`
Expected: PASS (5 testes, verificam texto/testid/quantidade de `path`, não `boxShadow`).

---

## Task 3: Cabeçalho em grupos visuais (`GraphEditor.tsx`)

**Files:**
- Modify: `components/arsenal/graph/GraphEditor.tsx`

- [ ] **Step 1: Adicionar um estilo de separador de grupo e aplicar no `<header>`**

```tsx
// components/arsenal/graph/GraphEditor.tsx — adicionar junto às constantes de estilo no topo (após `tabButton`):
const headerGroup: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', paddingLeft: 16 };
const headerGroupFirst: React.CSSProperties = { ...headerGroup, paddingLeft: 0 };
```

- [ ] **Step 2: Reestruturar o `<header>` em três grupos (identidade | custos | nível), mantendo ações à direita**

```tsx
// components/arsenal/graph/GraphEditor.tsx — substituir o <header>...</header> inteiro por:
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 0, alignItems: 'flex-end', padding: 16, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div style={headerGroupFirst}>
          <ImagePickerButton value={graph.header.icon} onUpdate={icon => patchHeader({ icon })} label="Ícone" buttonLabel="Escolher ícone" previewHeight={48} compact />
          <label style={{ minWidth: 160 }}><span style={label}>Nome</span><input aria-label="Nome" style={field} value={graph.header.name} onChange={e => patchHeader({ name: e.target.value })} /></label>
          <label style={{ minWidth: 220, flex: 1 }}><span style={label}>Descrição</span><input aria-label="Descrição" style={field} value={graph.header.description} onChange={e => patchHeader({ description: e.target.value })} /></label>
        </div>

        <div style={{ ...headerGroup, borderLeft: '1px solid rgba(255,255,255,.08)' }}>
          <label style={{ width: 110 }}><span style={label}>CUSTO DE AURA (DE QUEM USA)</span><input aria-label="Custo de aura" style={field} type="number" value={graph.header.auraCost} onChange={e => patchHeader({ auraCost: Number(e.target.value) })} /></label>
          <label style={{ width: 130 }}><span style={label}>CUSTO DE MUNIÇÃO (DE QUEM USA)</span><input aria-label="Custo de munição" style={field} type="number" value={graph.header.ammoCost} onChange={e => patchHeader({ ammoCost: Number(e.target.value) })} /></label>
        </div>

        <div style={{ ...headerGroup, borderLeft: '1px solid rgba(255,255,255,.08)', alignItems: 'center' }}>
          <span style={label}>Nível</span>
          <button type="button" aria-label="Diminuir nível" style={button} onClick={() => setLevel(l => Math.max(1, l - 1))}>−</button>
          <strong>{level}</strong>
          <button type="button" aria-label="Aumentar nível" style={button} onClick={() => setLevel(l => Math.min(maxLevel(graph), l + 1))}>+</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button type="button" style={saveButton} onClick={() => onSave(graph)}>Salvar</button>
          <button type="button" aria-label="Fechar" style={button} onClick={onClose}><X size={13} /></button>
        </div>
      </header>
```

Nota: todos os `aria-label` (`"Nome"`, `"Descrição"`, `"Custo de aura"`, `"Custo de munição"`, `"Diminuir nível"`, `"Aumentar nível"`, `"Fechar"`) e o texto `"Salvar"` permanecem idênticos — só a estrutura de `<div>`s em volta muda, então nenhum teste que usa `getByLabelText`/`getByRole('button', {name})` quebra.

- [ ] **Step 3: Dar fundo distinto à barra de Preparação + Combo**

```tsx
// components/arsenal/graph/GraphEditor.tsx — trocar a linha de abertura da barra de preparação/combo:
//   <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', alignItems: 'flex-end' }}>
// por:
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', alignItems: 'flex-end', background: 'rgba(255,255,255,.02)' }}>
```

O conteúdo interno dessa `<div>` (selects/inputs de preparação e combo) não muda.

- [ ] **Step 4: Padronizar o foco dos inputs — adicionar uma variante de `field` com glow e trocá-la nos `<input>`/`<select>` do cabeçalho e da barra de preparação/combo**

```tsx
// components/arsenal/graph/GraphEditor.tsx — adicionar junto às constantes de estilo (após `field`):
const fieldFocusable: React.CSSProperties = { ...field };
```

Como estilos inline do React não suportam pseudo-classes (`:focus`) diretamente, o glow de foco é aplicado via `onFocus`/`onBlur` num pequeno wrapper reutilizável. Para manter o escopo enxuto (mudança puramente visual, sem introduzir um componente novo em todos os inputs do editor), a Task 3 fica limitada aos Steps 1-3 (reorganização em grupos + fundo da barra de preparação/combo); o glow de foco consistente com a paleta é adiado — os inputs já herdam `outline: none` do `field` e o navegador aplica seu próprio indicador de foco padrão, o que é aceitável para este polimento. Reverter/remover o `fieldFocusable` do Step 4 (não adicionar ao arquivo) — ele não é necessário.

- [ ] **Step 5: Rodar os testes existentes**

Run: `npm test -- components/arsenal/graph/GraphEditor.test.tsx`
Expected: PASS (13 testes — todos usam `aria-label`/`role`/texto, que não mudaram).

---

## Task 4: Verificação final

**Files:** nenhum (só verificação)

- [ ] **Step 1: Rodar a suíte completa**

Run: `npm test`
Expected: mesma baseline de antes desta mudança (459 passando / 13 falhas pré-existentes), zero regressão nova — mudança é puramente visual.

- [ ] **Step 2: Verificar visualmente no navegador**

Abrir o app (Arsenal → Nova carta), confirmar:
- Paleta: cada seção (Gatilho/Ramos/Alvo/Efeitos) mostra contagem no título; botões de "Ramos"/"Alvo"/"Efeitos" têm uma cor de borda/fundo sutil e distinta entre si (azul/roxo/verde-água), gatilho continua âmbar.
- Canvas: clicar num nó realça com anel/glow visivelmente mais forte que antes.
- Cabeçalho: identidade (ícone/nome/descrição) visualmente separada de custos e de nível por uma linha divisória sutil; barra de preparação/combo com fundo levemente distinto do resto.
- Nenhum erro no console do navegador.

---

## Self-review

- **Cobertura do spec:** Seção 1 (paleta) → Task 1. Seção 2 (canvas) → Task 2. Seção 3 (cabeçalho/formulários) → Task 3 (reorganização em grupos + fundo da barra secundária cobertos; o glow de foco padronizado foi conscientemente adiado no Step 4 da Task 3, com a razão documentada, para não introduzir um componente novo fora do escopo puramente-CSS desta spec — ajuste ao "Fora de escopo" implícito de manter mudança mínima).
- **Consistência:** `FAMILY_ACCENT` (Task 1, `NodePalette.tsx`) e `FAMILY_COLOR` (já existente em `GraphCanvas.tsx`, inalterado) usam paletas de cor próximas (roxo/azul/verde-água) mas não idênticas em opacidade — ambos já são independentes hoje (arquivos diferentes, sem import compartilhado) e a spec não pediu extrair uma constante compartilhada; mantido assim para não introduzir um novo módulo de estilo fora do escopo.
- **Placeholders:** nenhum "TBD" — o único ponto não implementado (glow de foco) está explicitamente resolvido como "adiado" com justificativa, não como pendência vaga.
