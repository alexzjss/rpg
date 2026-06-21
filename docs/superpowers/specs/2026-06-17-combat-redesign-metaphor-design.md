# Redesign do Combate (estilo Metaphor) + fundação de estilo

**Data:** 2026-06-17
**Status:** Spec revisado e aprovado — aguardando execução do plano de implementação
**Contexto:** Feature #5 do roadmap (UI/UX). Grande redesign da aba de combate inspirado em **Metaphor: ReFantazio**, mais a fundação de estilo para propagar às demais abas. Antecipada a pedido do usuário antes da fusão (#4 anim) e do grid (#5 mecânica).

---

## Decisões do brainstorming + revisão de 2026-06-17

1. **Escopo:** combate + propagar o estilo a TODAS as abas (faseado: combate primeiro, demais depois).
2. **Suspense de dados nas cartas:** deferido para a feature #1 (não entra aqui).
3. **Selos no combate:** viram **ícone de ação por turno** individual do personagem ativo (junto de ataque/ação/vínculo/item/forma). Não é ação global.
4. **Fusão:** movida para o painel de controles (direita). Não compete com ações individuais.
5. **Lados:** turnos à **esquerda**, controles à **direita**.
6. **Lista contextual (lista de cartas/ações):** abre como **flyout/painel que desliza a partir da linha do personagem ativo** (opção c). Visualmente conectado àquela linha, dando sensação de "surgir dela". Fallback: painel direito com conexão visual muito clara entre personagem ativo → ícone → lista.
7. **Layout da lista contextual:** **lista vertical nova** estilo skill-list — não reusar a grade de cards. Layout: ícone à esq, nome em destaque, custo AP à dir, estado disponível/indisponível, destaque forte no selecionado, descrição do selecionado em área inferior ou lateral.
8. **Ordenação:** cartas **fixadas (pinnedCardIds) no topo** → depois por categoria → dentro de cada categoria, **alfabética**. Pinned indisponível aparece no topo com estado visual claro de indisponível.
9. **Ícones de ação por turno (cast):**
   - `⚔ Ataque` — cartas de tipo `ataque`
   - `🎯 Ação` — cartas de tipo `ação`, `reação`, `reforço`, `combinação` (1 ícone; dentro da lista, separadas por subcategoria)
   - `🔗 Vínculo` — cartas de tipo `vínculo`
   - `🎒 Itens` — itens usáveis em combate
   - `💫 Forma` — aparece quando forma ativável; cartas de tipo `forma`
   - `🔮 Selo` — ação individual (usa o fluxo `SealCommandPanel` existente)
10. **Ícones de ação por turno (npc):** reduzidos — `⚔ Ataque` + `🃏 Coringa de NPC` (abre `NpcWildcardModal`); item se possuir.
11. **Forma ativável:** Usa lógica atual como base. Aura sutil se o personagem "possui carta forma e não está naquela forma e não está inconsciente". Aura forte/clicável se adicionalmente "recursos suficientes e condições satisfeitas". Não inventar regras novas nesta etapa.
12. **Destaque de turno:** por time — `cast` → dourado (`teamCast`), `npc` → carmesim (`teamNpc`/`accentCrimson`).
13. **Combatentes na lista:** **todos** (cast + npc) na ordem de `combat.combatants`, primeiro no topo.
14. **Grid:** ajustar layout para encaixar entre os painéis flutuantes, sem mudar mecânica do grid.
15. **Alvo de telas:** desktop-first (mestre em PC). Não bloquear responsividade futura — painéis devem suportar recolhimento e fallback para telas menores.
16. **Extração:** novos painéis extraídos para `components/combat/*`. Props claras, lógica no App.tsx por ora. Shape de `CombatState` intocado. `PlayerMirror` não quebra.
17. **Abordagem:** incremental e reversível — nova UI ao lado da antiga → validar dados e interação → migrar fluxo → remover UI antiga.

---

## Estado atual relevante

- Aba de combate (`App.tsx`): sidebar esquerda com abas `status/unions/dice/notes` (`leftSidebarTab`, ~L7357); sidebar direita com painel de turno (round/"Vez de"/Iniciar/Próximo/Encerrar/Adicionar/Histórico, ~L7948) e o **bloco "✦ COMANDO ✦"** tematizado (azul/preto, `activeCommand`, ícones ataque/vínculo/item/foco/fusão/selo, ~L8097–8975).
- Sub-painéis reutilizáveis: `CombatItemPanel` (L2324), `NpcWildcardModal` (L2993), `SealCommandPanel` (L3296), `CardFusionPanel` (L3465).
- Lógica reaproveitável: `allActorCards`, `executeCardOnTarget`, `handleUseItem`, `finalizeAction`, ativação de forma (`activeForms`, `ActiveForma`, `formaCardIds`), coringa de NPC, `advanceTurn`/`endTurnWithTimer`, `startCombat`, `endCombat`.
- Paleta centralizada em `utils/theme.ts`: `PALETTE`, `CARD_TYPE_THEME`, `injectThemeVars`.
- Combatente tem `role: 'cast' | 'npc'`, `currentHp/maxHp`, `currentAura/maxAura`, `conditions[]`, `gridPos`, `activeForms` no `CombatState`.
- Baseline `tsc --noEmit`: 29 erros pré-existentes. Verificação deve comparar contra esse baseline.

---

## Fundação de estilo "Metaphor dourado"

Estender `utils/theme.ts` + utilitários CSS (em `index.html` `<style>` ou bloco dedicado):

### Tokens novos no `PALETTE`

```
teamCast:    '#c9983a'   // dourado — turno de jogador (cast)
teamNpc:     '#dc2626'   // carmesim — turno de inimigo (npc)
hpHigh:      '#22c55e'   // verde (HP > 60%)
hpMid:       '#eab308'   // amarelo (HP 30–60%)
hpLow:       '#ef4444'   // vermelho (HP < 30%)
apColor:     '#818cf8'   // azul/roxo (AP/Aura)
stateDown:   '#334155'   // cinza escuro (inconsciente)
stateAlert:  '#f97316'   // laranja (alerta)
```

### Classes utilitárias `mp-*`

- `mp-panel` — painel com corte diagonal (`clip-path: polygon(...)`), borda dourada fina, fundo escuro alto-contraste, grão/textura leve via `::before` com `opacity`.
- `mp-heading` — tipografia display: `font-style: italic`, `text-transform: uppercase`, `font-weight: 900`, `letter-spacing: -0.02em`.
- `mp-skew-row` — container inclinado (`transform: skewX(-6deg)`); conteúdo interno com `skewX(6deg)` para des-inclinar texto.
- `mp-active-glow` — variável `--team-color` recebe o token por time; aplica `box-shadow` e `border-color` com `--team-color`.
- `mp-list-item` — item de lista contextual: flex row, ícone 32px esq, nome bold central, custo dir; selecionado recebe background accent + escala leve.
- `mp-list-item--unavailable` — opacidade 0.45, cursor `not-allowed`, sem hover effect.
- `mp-state-down` — `filter: grayscale(1); opacity: 0.5` para combatentes inconscientes.

---

## Combate — nova estrutura de componentes

### Layout geral

```
┌─────────────────────────────────────────────────┐
│  [TurnOrderPanel]   [  Arena / Grid  ]   [CombatControlPanel]  │
│  (esquerda, flutuante)                   (direita, flutuante)  │
│                                                                 │
│         [flyout ContextCardList surge da linha ativa]          │
└─────────────────────────────────────────────────┘
```

- **Centro:** grid existente. Layout ajustado para centralizar no espaço entre os painéis. Sem mudar mecânica do grid.
- **Esquerda:** `TurnOrderPanel` flutuante/suspenso (novo).
- **Direita:** `CombatControlPanel` flutuante/suspenso (novo).
- **Remoções (Etapa 5):** bloco COMANDO, barra de ação por-turno, sidebar esquerda de abas.

---

### `TurnOrderPanel` (`components/combat/TurnOrderPanel.tsx`)

**Props:** `combat: CombatState`, `characters: Character[]`, `items: Item[]`, `cards: Card[]`, `seals: Seal[]`, `onSelectAction(combatId, category)`, `onActivateForma(combatId)`.

**Renderiza todos os combatentes** na ordem de `combat.combatants`, primeiro no topo.

**Cada linha (`TurnOrderRow`):**
- Ícone/retrato do combatente (`icon`, 36px).
- Nome (`mp-heading`, truncado).
- **HP:** barra colorida (`hpHigh` → `hpMid` → `hpLow` conforme %) + número `atual / max`.
- **AP/Aura:** barra `apColor` + número `atual / max`.
- **Condições:** ícones emoji de `PRESET_CONDITIONS` para condições ativas (máx ~4 visíveis, resto truncado).
- **Aura de forma:** anel colorido ao redor do retrato quando forma ativável (sutil se só "possui"; brilhante/animado se "pode ativar agora").
- **Inconsciente** (`currentHp <= 0`): classe `mp-state-down` na linha inteira; sem ícones de ação.

**Turno atual:** `mp-active-glow` com `--team-color: teamCast` (cast) ou `teamNpc` (npc); leve `scale(1.03)` + borda.

**`ActionIconRail`** (só na linha do turno atual, não inconsciente):
- `cast`: ⚔ Ataque, 🎯 Ação, 🔗 Vínculo, 🎒 Itens, 🔮 Selo. Se forma ativável: 💫 Forma.
- `npc`: ⚔ Ataque, 🃏 Coringa. Se tem itens usáveis: 🎒 Itens.
- Clicar → chama `onSelectAction(combatId, category)`.
- Ícone indisponível (sem cartas/itens da categoria): opacidade 0.35, `cursor: not-allowed`.

---

### `ContextCardList` flyout (`components/combat/ContextCardList.tsx`)

Abre **ancorado na linha do personagem ativo**, deslizando a partir dela (posicionamento absoluto relativo ao `TurnOrderPanel`, translateX para fora da coluna). Em telas onde isso não caber, fallback para o painel direito com seta/indicador visual apontando para o combatente ativo.

**Layout (skill-list vertical):**
```
┌──────────────────────────────┐
│ [Categoria: Ataques]         │
│ ┌──┬──────────────────┬────┐ │
│ │🔥│ Golpe de Chamas  │ 8AP│ │  ← pinned (se aplicável)
│ └──┴──────────────────┴────┘ │
│ ┌──┬──────────────────┬────┐ │
│ │⚔│ Corte Básico     │ 0AP│ │
│ └──┴──────────────────┴────┘ │
│ ─────────────────────────── │
│ [Categoria: ...]             │
│ ...                          │
│ ══════════════════════════  │
│  [Descrição do item ativo]   │  ← sticky inferior
└──────────────────────────────┘
```

**Ordenação:** pinneds no topo (com badge fixado) → depois por categoria (`ataque`, `ação`, `reação`, `reforço`, `combinação`, `vínculo`, `forma`, `item`, `selo`) → dentro de cada categoria, A→Z.

**Subcategorias do ícone "Ação":** Ações / Reações / Reforços / Combinações (cabeçalhos de seção dentro da mesma lista).

**Estados de item:**
- Disponível: normal.
- Indisponível (AP insuficiente, requisito não atendido, inconsciente): `mp-list-item--unavailable` + tooltip/texto com motivo.
- Selecionado: fundo accent, borda da cor do tipo de carta, descrição aparece na área inferior.

**Fechar:** botão ✕ no header + clicar fora da área.

---

### `CombatControlPanel` (`components/combat/CombatControlPanel.tsx`)

**Dois modos**, controlados por `selectedAction`:

**Modo Controles (padrão):**
- Fluxo de combate: Iniciar / Aguardar / Próximo / Encerrar.
- Adicionar combatente + Histórico.
- Cronômetro de turno.
- **Fusão** (`CardFusionPanel` existente).
- Condições de campo (`FieldConditionCreator`).
- Pins do grid (`CustomPinCreator`).
- Uniões de combate.
- Dado rápido + notas.
- Bônus global + Dano em massa.

**Modo Contextual (fallback do flyout):** Se o `ContextCardList` flyout não couber, o painel direito exibe a lista contextual em vez dos controles, com botão **← Voltar** que limpa `selectedAction` e retorna ao modo controles.

---

### Estado e fluxo

- **Novo estado no App:** `selectedAction: { combatId: string; category: 'ataque'|'acao'|'vinculo'|'item'|'selo'|'forma' } | null`.
  - Substitui `activeCommand`. Estado de UI local (fora de `CombatState`).
- Clicar ícone → `setSelectedAction({ combatId, category })` → `ContextCardList` abre.
- Usar carta/item → chama lógica existente (`executeCardOnTarget`, `handleUseItem`, selos, forma) → `setSelectedAction(null)`.
- Avançar turno → `setSelectedAction(null)` implicitamente.
- `fusão` continua sendo acionada pelo `CombatControlPanel`, não pelos ícones de turno.

---

## Reaproveitamento (não reescrever a lógica)

Toda resolução de cartas, reações, dano, condições, forma, NPC coringa, fusão e selos permanece. Só muda **o gatilho de UI** (de `activeCommand` no bloco COMANDO para `selectedAction` nos painéis novos).

Sub-painéis `CombatItemPanel`, `SealCommandPanel`, `CardFusionPanel` são reutilizados como conteúdo dentro do `ContextCardList` / `CombatControlPanel`.

---

## Tratamento de erros / edge cases

- **Sem combate ativo:** `TurnOrderPanel` exibe combatentes sem ícones de ação; `CombatControlPanel` mostra Iniciar/Adicionar.
- **Sem cartas/itens da categoria:** ícone desabilitado (opacidade 0.35); não abre lista.
- **Combatente inconsciente:** linha em `mp-state-down`; sem ícones; `advanceTurn` mantém comportamento atual de pular.
- **Turno NPC:** ícones reduzidos; coringa de NPC abre `NpcWildcardModal` existente.
- **Forma sem "pode ativar agora" detectável:** indicação sutil (anel fino, sem glow animado); ícone 💫 não aparece no rail (só a indicação visual no retrato).
- **`PlayerMirror`:** lê `combat` via broadcast; `selectedAction` é estado local → espelho não é afetado.
- **Baseline tsc:** comparar sempre contra 29 erros pré-existentes.

---

## Fase 2 — propagar o estilo às demais abas

Após validar o combate visualmente, aplicar `mp-*` e tokens às abas: Personagens, Habilidades, Itens, Selos, Jornada, Extras. Mecânico em sua maioria (trocar contêineres/cabeçalhos pelos utilitários); sem mudar lógica dessas abas. Detalhado em spec separada.

---

## Verificação geral

- `npm run build` + `npx tsc --noEmit` sem **novos** erros (baseline 29).
- Checagem visual manual: iniciar combate → lista de turnos à esquerda com HP/AP/condições e turno ativo destacado por time → no turno de um `cast`, ícones aparecem no rail → clicar ícone abre `ContextCardList` flyout → lista mostra pinneds no topo, depois categoria + alfa → usar carta/item resolve como antes → forma ativável mostra aura → inimigo mostra ícones reduzidos → inconsciente fica cinza → fusão acessível no painel direito → `PlayerMirror` espelha grid sem erro.

---

## Arquivos afetados

**Novos:**
- `components/combat/TurnOrderPanel.tsx`
- `components/combat/TurnOrderRow.tsx`
- `components/combat/ActionIconRail.tsx`
- `components/combat/ContextCardList.tsx`
- `components/combat/CombatControlPanel.tsx`

**Modificados:**
- `utils/theme.ts` — tokens novos (teamCast, teamNpc, hp*, apColor, stateDown, stateAlert).
- `index.html` — classes utilitárias `mp-*` no `<style>`.
- `App.tsx` — novo `selectedAction`; renderizar novos painéis; depois (Etapa 5) remover bloco COMANDO, sidebars antigas e religar callbacks; ajuste de layout do grid.
