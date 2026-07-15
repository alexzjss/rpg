# Polimento de UI do editor de habilidades (grafo) — Design

**Data:** 2026-07-10
**Relacionado:** [[project-grimorio-unificado-combate-v2]] — polimento visual sobre o editor entregue nas Fases 1-5 e na rework de simplificação da paleta.

## Problema

O editor de habilidades (`GraphEditor` + `NodePalette` + `GraphCanvas`) funciona, mas visualmente está "cru": só o gatilho tem cor de destaque na paleta, o nó selecionado no canvas quase não se distingue dos outros, e o cabeçalho amontoa nome/descrição/custos/nível numa única linha sem hierarquia, com a barra de preparação/combo logo abaixo competindo visualmente pelo mesmo peso.

Esta é uma spec **puramente visual** (CSS/layout, sem mudança de comportamento ou de dados) — decidida como frente independente do sistema de "efeito contínuo/enquanto ativa" (spec futura separada).

## Escopo

### 1. Paleta lateral (`NodePalette.tsx`)

- Cada família de bloco ganha uma cor de identificação sutil na borda esquerda do botão, não só o gatilho (que já tem `rgba(212,168,83,...)`):
  - `ramo` → azul (`rgba(96,165,250,.35)` borda / `rgba(96,165,250,.08)` fundo)
  - `alvo` → roxo (`rgba(167,139,250,.35)` / `rgba(167,139,250,.08)`)
  - `efeito` → verde-água (`rgba(45,212,191,.35)` / `rgba(45,212,191,.08)`)
  - `gatilho` mantém o âmbar já existente.
- Título de cada seção (`sectionTitle`) passa a incluir a contagem de itens, ex. `"EFEITOS · 10"`.
- Mantém toda a lógica existente (busca, templates, disabled sem `pendingConnection`, `onPickTrigger`) — só estilo.

### 2. Canvas (`GraphCanvas.tsx`)

- Nó selecionado (`selectedNodeId`) ganha um anel de destaque mais forte (`box-shadow` em duas camadas ou `outline` colorido), hoje é só uma borda sutil.
- Nó com família correspondente usa a mesma cor de identificação da paleta (consistência entre os dois painéis), mantendo o estilo de gatilho já existente inalterado.

### 3. Cabeçalho e formulários (`GraphEditor.tsx`)

- A linha única de topo (ícone/nome/descrição/custos/nível/ações) é reorganizada em grupos visuais dentro do mesmo `<header>`: identidade (ícone+nome+descrição) | custos (aura+munição) | nível — usando `border-left` sutil entre grupos ou `gap` maior, sem quebrar layout responsivo existente (`flexWrap: wrap`).
- A barra de "Preparação + Combo" (`<div>` logo abaixo do header) ganha um fundo levemente distinto (`rgba(255,255,255,.02)`) e padding para não parecer "grudada" no cabeçalho principal.
- Inputs padronizam altura/padding; foco (`:focus`) ganha um glow sutil consistente com o campo de busca da paleta (que já usa a paleta padrão do editor).

## Fora de escopo

- Qualquer mudança de comportamento, dados, ou novos campos/nós.
- O traço de conexão entre blocos no canvas (adiado a pedido do usuário).
- Sistema de "efeito contínuo/enquanto ativa" e demais integrações de combate (spec separada, a seguir).

## Testes

- Este polimento é puramente visual (estilos inline `React.CSSProperties`), sem lógica nova — não requer testes automatizados novos. Verificação por inspeção visual no navegador (screenshot + `preview_inspect` de cores/bordas) ao final da implementação.
- Rodar a suíte completa ao final apenas para confirmar que nenhum teste existente que dependa de `aria-label`/texto/estrutura DOM quebrou (mudanças são só de `style`, não de marcação).
