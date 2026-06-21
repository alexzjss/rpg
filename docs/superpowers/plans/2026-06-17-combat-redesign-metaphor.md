# Plano de Implementação — Redesign de Combate (Metaphor)

**Data:** 2026-06-17
**Spec:** `docs/superpowers/specs/2026-06-17-combat-redesign-metaphor-design.md`
**Abordagem:** incremental e reversível — nova UI ao lado da antiga → validar → migrar fluxo → remover antiga.
**Baseline tsc:** 29 erros pré-existentes. Toda verificação compara contra esse baseline.

---

## Etapa 0 — Fundação de estilo

**Objetivo:** Adicionar tokens e classes utilitárias `mp-*` sem alterar nenhum comportamento ou visual existente.

### Arquivos a modificar

- `utils/theme.ts`
- `index.html`

### Tarefas

**`utils/theme.ts`:**
1. Adicionar tokens no objeto `PALETTE`:
   ```
   teamCast:   '#c9983a'  // dourado — turno cast
   teamNpc:    '#dc2626'  // carmesim — turno npc
   hpHigh:     '#22c55e'  // verde HP > 60%
   hpMid:      '#eab308'  // amarelo HP 30–60%
   hpLow:      '#ef4444'  // vermelho HP < 30%
   apColor:    '#818cf8'  // azul/roxo para AP/Aura
   stateDown:  '#334155'  // cinza inconsciente
   stateAlert: '#f97316'  // laranja alerta
   ```
2. Adicionar entradas correspondentes no `CSS_VAR_MAP`:
   ```
   teamCast: '--team-cast', teamNpc: '--team-npc',
   hpHigh: '--hp-high', hpMid: '--hp-mid', hpLow: '--hp-low',
   apColor: '--ap-color', stateDown: '--state-down', stateAlert: '--state-alert'
   ```
   (O `injectThemeVars()` existente vai injetar automaticamente.)

**`index.html`:**
3. No bloco `<style>` existente, adicionar as classes utilitárias `mp-*`:
   ```css
   /* mp-panel: painel com corte diagonal, borda dourada, alto contraste, grão */
   .mp-panel {
     background: var(--bg-surface);
     border: 1px solid var(--border-gold);
     clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
     position: relative;
   }
   .mp-panel::before {
     content: '';
     position: absolute; inset: 0;
     background-image: url("data:image/svg+xml,..."); /* noise SVG */
     opacity: 0.03;
     pointer-events: none;
   }

   /* mp-heading: tipografia display */
   .mp-heading {
     font-style: italic;
     text-transform: uppercase;
     font-weight: 900;
     letter-spacing: -0.02em;
   }

   /* mp-skew-row: linha inclinada */
   .mp-skew-row {
     transform: skewX(-6deg);
   }
   .mp-skew-row > * {
     transform: skewX(6deg);
   }

   /* mp-active-glow: realce por time */
   .mp-active-glow {
     box-shadow: 0 0 0 2px var(--team-color, var(--border-gold)),
                 0 0 16px -2px var(--team-color, var(--border-gold));
     border-color: var(--team-color, var(--border-gold)) !important;
   }

   /* mp-list-item: item de lista contextual */
   .mp-list-item {
     display: flex;
     align-items: center;
     gap: 10px;
     padding: 8px 12px;
     border-radius: 6px;
     cursor: pointer;
     transition: background 0.15s, transform 0.1s;
   }
   .mp-list-item:hover:not(.mp-list-item--unavailable) {
     background: rgba(201,152,58,0.1);
     transform: translateX(2px);
   }
   .mp-list-item--selected {
     background: rgba(201,152,58,0.18);
     border-left: 3px solid var(--gold-mid);
   }
   .mp-list-item--unavailable {
     opacity: 0.4;
     cursor: not-allowed;
   }

   /* mp-state-down: combatente inconsciente */
   .mp-state-down {
     filter: grayscale(1);
     opacity: 0.5;
   }
   ```

### O que NÃO fazer nesta etapa
- Não alterar nenhum componente existente.
- Não remover nada.
- Não usar as classes ainda (só definir).

### Verificação
- `npm run build` passa.
- `npx tsc --noEmit` — número de erros = baseline (29).
- Abrir o app no browser: visual idêntico ao de antes.

---

## Etapa 1 — TurnOrderPanel somente leitura

**Objetivo:** Criar a coluna de turnos à esquerda e adicioná-la **ao lado** da sidebar esquerda existente. Nada é removido. Dados e visuais são validados antes de qualquer mudança de fluxo.

### Arquivos a criar

- `components/combat/TurnOrderRow.tsx`
- `components/combat/TurnOrderPanel.tsx`

### Arquivos a modificar

- `App.tsx` (apenas adicionar o novo painel ao lado da sidebar esquerda existente, condicionado à aba de combate ativa)

### Tarefas

**`TurnOrderRow.tsx`:**
1. Props: `combatant: Combatant`, `isActive: boolean`, `activeForms: ActiveForma[]`, `cards: Card[]` (para detectar forma), `turnNumber?: number`.
2. Renderizar:
   - Container: `mp-skew-row` quando `isActive`; `mp-state-down` quando `currentHp <= 0`.
   - `mp-active-glow` com `--team-color` setado inline (`teamCast` se `role === 'cast'`, `teamNpc` se `role === 'npc'`) quando `isActive`.
   - Ícone/retrato: `<img src={combatant.icon}>` (36×36, borda arredondada). Anel colorido leve quando o personagem possui carta `forma` e não tem `ActiveForma` ativa e não está inconsciente.
   - Nome (`mp-heading`, truncado em 1 linha).
   - Barra HP: `<div>` com background linear-gradient ou cor computada (`hpHigh` / `hpMid` / `hpLow` conforme `currentHp/maxHp`), + texto `currentHp / maxHp`.
   - Barra AP/Aura: cor `apColor`, + texto `currentAura / maxAura`.
   - Condições: máximo 5 emojis de `PRESET_CONDITIONS` correspondentes. Se mais, exibir `+N`.
3. Sem callbacks de ação nesta etapa — somente leitura.

**`TurnOrderPanel.tsx`:**
4. Props: `combat: CombatState`, `cards: Card[]`.
5. Renderizar `combat.combatants.map(...)` usando `TurnOrderRow`, passando `isActive = (index === combat.turnIndex)` e `activeForms = combat.activeForms || []`.
6. Container com `mp-panel`, largura fixa ~240px, `overflow-y: auto`, max-height = altura da viewport menos header.
7. Cabeçalho: "Ordem de Turno" (`mp-heading`) + badge de rodada (`combat.round`).

**`App.tsx`:**
8. Importar `TurnOrderPanel`.
9. Na seção de combate, renderizar `<TurnOrderPanel>` **antes** da sidebar esquerda existente (ou seja, mais à esquerda dela), visível apenas quando a aba ativa for combate. Sem remover a sidebar.

### O que NÃO fazer nesta etapa
- Não adicionar ícones de ação.
- Não adicionar interatividade.
- Não remover a sidebar esquerda.

### Verificação
- `npm run build` + `tsc` sem novos erros.
- Iniciar combate com 3+ combatentes: lista aparece à esquerda na ordem correta.
- HP/AP batem com os valores do painel direito existente.
- Turno atual tem realce dourado (cast) ou carmesim (npc).
- Inconsciente fica cinza.
- Condições aparecem como emojis.

---

## Etapa 2 — `selectedAction` + `ActionIconRail` + `ContextCardList` (flyout)

**Objetivo:** Adicionar os ícones de ação na linha do turno atual e abrir a nova lista contextual vertical (skill-list) como flyout. A resolução de carta/item usa a lógica existente. A UI antiga permanece.

### Arquivos a criar

- `components/combat/ActionIconRail.tsx`
- `components/combat/ContextCardList.tsx`

### Arquivos a modificar

- `components/combat/TurnOrderRow.tsx` (receber + renderizar o rail)
- `components/combat/TurnOrderPanel.tsx` (passar callbacks + renderizar o flyout)
- `App.tsx` (novo estado `selectedAction`; callbacks; ligar à resolução existente)

### Tarefas

**`App.tsx` — estado:**
1. Adicionar: `const [selectedAction, setSelectedAction] = useState<{ combatId: string; category: 'ataque'|'acao'|'vinculo'|'item'|'selo'|'forma' } | null>(null)`.
2. Em `advanceTurn` / `endTurnWithTimer`: chamar `setSelectedAction(null)`.
3. Em `executeCardOnTarget` / `handleUseItem` / resolução de selos / forma: chamar `setSelectedAction(null)` ao finalizar.
4. Criar `handleSelectAction(combatId, category)`: seta `selectedAction`; se mesma categoria já ativa, fecha (toggle).

**`ActionIconRail.tsx`:**
5. Props: `combatant: Combatant`, `combat: CombatState`, `cards: Card[]`, `items: Item[]`, `seals: Seal[]`, `selectedCategory: string | null`, `onSelectAction(category)`.
6. Calcular disponibilidade por categoria:
   - `ataque`: `allActorCards` com tipo `ataque` > 0 ou actor é npc.
   - `acao`: cartas `ação` + `reação` + `reforço` + `combinação` > 0.
   - `vinculo`: cartas `vínculo` > 0.
   - `item`: itens usáveis em combate > 0 (via `resolveOwnedItems`).
   - `selo`: sempre disponível para `cast` (usa código).
   - `forma`: possui carta `forma` + não tem `ActiveForma` ativa + não inconsciente.
   - `ataque` (npc) + `wildcard` (npc): sempre.
7. Renderizar botões/ícones. Desabilitados com `mp-list-item--unavailable`.
8. Para `cast`: ⚔ Ataque, 🎯 Ação, 🔗 Vínculo, 🎒 Item, 🔮 Selo, (💫 Forma se disponível).
9. Para `npc`: ⚔ Ataque, 🃏 Coringa, (🎒 Item se disponível).

**`ContextCardList.tsx`:**
10. Props: `combatant: Combatant`, `combat: CombatState`, `category: string`, `cards: Card[]`, `items: Item[]`, `seals: Seal[]`, `characters: Character[]`, `onUseCard(card: Card)`, `onUseItem(item: Item)`, `onOpenSeal()`, `onNpcWildcard()`, `onActivateForma(card: Card)`, `onClose()`.
11. Calcular lista de itens com base na categoria:
    - `ataque` → cartas de tipo `ataque`.
    - `acao` → cartas de tipo `ação`, `reação`, `reforço`, `combinação` (em subcategorias).
    - `vinculo` → cartas de tipo `vínculo`.
    - `item` → via `CombatItemPanel` ou lista integrada.
    - `selo` → delegar para `SealCommandPanel` embutido.
    - `forma` → cartas de tipo `forma`.
12. **Ordenação:** pinneds (`pinnedCardIds`) no topo (badge "📌") → resto por subcategoria → A→Z.
13. **Layout skill-list:** cada item = `mp-list-item`:
    - Ícone da carta (32px) à esquerda.
    - Nome bold.
    - Tipo (badge colorido por `CARD_TYPE_THEME`).
    - Custo AP à direita (vermelho se insuficiente).
    - Estado: `mp-list-item--unavailable` se AP insuficiente; tooltip com motivo.
14. **Área de descrição:** sticky no rodapé, mostra descrição da carta/item selecionado ao hover/click.
15. **Posicionamento flyout:** `position: absolute`, `left: 100%`, ancorado na linha do combatente ativo dentro do `TurnOrderPanel`. Z-index alto. Em viewport estreita (< 900px), fallback para `position: fixed` centralizado ou para o painel direito.
16. Botão ✕ no header. Fechar ao clicar fora (overlay transparente).

**`TurnOrderRow.tsx`:**
17. Receber `isActiveActor: boolean`, `selectedCategory`, `onSelectAction`, e demais props necessárias.
18. Renderizar `<ActionIconRail>` apenas quando `isActiveActor && !isDown`.
19. O flyout (`ContextCardList`) é renderizado no `TurnOrderPanel` (fora do row), para não ficar clipado pelo overflow.

**`TurnOrderPanel.tsx`:**
20. Receber `selectedAction`, `onSelectAction`, callbacks de resolução.
21. Renderizar `<ContextCardList>` quando `selectedAction !== null` e `selectedAction.combatId` bate com um combatente.
22. Posicionar o flyout absolutamente ao lado da linha do combatente ativo (calcular `top` via `ref` da linha).

### O que NÃO fazer nesta etapa
- Não remover a UI antiga.
- Não desabilitar `activeCommand`.
- Não remover sidebar.

### Verificação
- No turno de um `cast`: ícones aparecem na linha ativa.
- Clicar ícone de Ataque: lista vertical mostra cartas de ataque, pinneds no topo.
- Clicar carta: dano é aplicado, lista fecha (`selectedAction` limpo).
- Clicar ícone de Ação: lista mostra 4 subcategorias separadas.
- Clicar ícone de Item: itens usáveis com quantidade > 0; usar item funciona.
- Ícone sem cartas disponíveis: desabilitado.
- Inconsciente: sem ícones.
- NPC no turno: só Ataque + Coringa.
- Avançar turno: lista fecha.
- UI antiga continua funcional em paralelo.

---

## Etapa 3 — `CombatControlPanel` (painel de controles) ✅ CONCLUÍDA

> Implementada como "Etapa 4" no roadmap da sessão (2026-06-17).
> Arquivo criado: `components/combat/CombatControlPanel.tsx`.
> Inserido em `App.tsx` após o bloco RIGHT SIDEBAR (~L8129), antes do BARRA OVERLAY.

**Objetivo:** Criar o painel de controles à direita, reunindo tudo que estava na sidebar direita e na sidebar esquerda existentes. Adicionar ao layout ao lado dos painéis existentes. Nada removido ainda.

### Arquivos a criar

- `components/combat/CombatControlPanel.tsx`

### Arquivos a modificar

- `App.tsx` (adicionar `CombatControlPanel` ao lado do painel direito existente)

### Tarefas

**`CombatControlPanel.tsx`:**
1. Props: `combat: CombatState`, `characters: Character[]`, `cards: Card[]`, `items: Item[]`, `seals: Seal[]`, `selectedAction: { combatId; category } | null`, e todos os callbacks necessários (startCombat, endCombat, advanceTurn, addCombatant, openHistory, updateCombat, etc.).
2. **Modo Controles (padrão):** organizado em seções internas com acordeão ou abas leves:
   - **Fluxo de combate:** Iniciar / Aguardar / Próximo / Encerrar; Rodada e "Vez de" como cabeçalho; Cronômetro de turno.
   - **Combatentes:** Adicionar + Histórico.
   - **Fusão:** `<CardFusionPanel>` reusado.
   - **Campo:** Condições de campo (`FieldConditionCreator`); Pins do grid (`CustomPinCreator`); Bônus global; Dano em massa.
   - **Extras:** Uniões; Dado rápido; Notas; Background; Tela cheia; Coordenadas.
3. Aplicar `mp-panel` e `mp-heading` no container e cabeçalhos de seção.
4. Usar `--team-color` do combatente ativo no cabeçalho de Fluxo (glow sutil).
5. Largura fixa ~262px, `overflow-y: auto`, max-height = viewport menos header.

**`App.tsx`:**
6. Importar e renderizar `<CombatControlPanel>` à direita da arena, ao lado do painel direito existente. Por ora: os dois coexistem.

### O que NÃO fazer nesta etapa
- Não remover o painel direito existente.
- Não remover a sidebar esquerda existente.

### Verificação
- Iniciar/Próximo/Encerrar funcionam a partir do novo painel.
- Fusão abre e resolve como antes.
- Condições de campo, pins, bônus global funcionam.
- Notas, dado, uniões acessíveis.
- Cronômetro funciona.

---

### Mapeamento de migração — RIGHT SIDEBAR (App.tsx L7978–8129) → CombatControlPanel

| Elemento da UI antiga | Localização (App.tsx) | Seção no CCP | Status |
|---|---|---|---|
| Exibição de Rodada | ~L7985 | Fluxo de Combate | ✅ Migrado |
| Exibição "Vez de" / ator atual | ~L7987–7997 | Fluxo de Combate | ✅ Migrado |
| Timer display (inline no turno) | ~L8000–8006 | Fluxo de Combate | ✅ Migrado (display) |
| Botão Aguardar | ~L8008 | Fluxo de Combate | ✅ Migrado |
| Botão Próximo | ~L8011 | Fluxo de Combate | ✅ Migrado |
| Botão Iniciar Combate | ~L8031 | Fluxo de Combate | ✅ Migrado |
| Botão Encerrar | ~L8023 | Fluxo de Combate | ✅ Migrado |
| Botão Adicionar combatente | ~L8016 | Combatentes | ✅ Migrado |
| Botão Histórico | ~L8020 | Combatentes | ✅ Migrado |
| Cronômetro (controles completos) | ~L8054–8089 | Fluxo de Combate | 🔲 Skeleton — Etapa 5 |
| Condições de campo | ~L8091–8110 | Campo de Batalha | 🔲 Skeleton — Etapa 5 |
| Custom Pins do grid | ~L8111–8129 | Campo de Batalha | 🔲 Skeleton — Etapa 5 |

### Mapeamento de migração — LEFT SIDEBAR → CombatControlPanel

| Elemento da UI antiga | Seção no CCP | Status |
|---|---|---|
| Bônus global de combate | Campo de Batalha | 🔲 Skeleton — Etapa 5 |
| Dano em massa | Campo de Batalha | 🔲 Skeleton — Etapa 5 |
| Uniões de combatentes | Uniões | 🔲 Skeleton — Etapa 5 |
| Dado rápido | Dados | 🔲 Skeleton — Etapa 5 |
| Notas | Notas | 🔲 Skeleton — Etapa 5 |

### Mapeamento de migração — BARRA DE AÇÕES / FusionOverlay

| Elemento da UI antiga | Seção no CCP / novo componente | Status |
|---|---|---|
| Cards fan/list (BARRA DE AÇÕES ~L8131–9017) | ContextCardList + ActionIconRail | ✅ Wired (Etapa 3B) |
| FusionOverlay / painel Fusão | Fusão | 🔲 Skeleton — Etapa 5 |

### Bug pendente (resolver na Etapa 5)

**BUG-001 — Overlay de targeting intercept após uso via ContextCardList**

Após selecionar uma carta pelo `ContextCardList` e confirmar o uso (zoom modal → `confirmCardUsage` → `setSelectingTargetFor`), o overlay/blur da UI antiga (`activeCommand`-based) é ativado e intercepta os cliques no grid, impedindo a seleção de alvo.

- **Causa raiz:** o novo fluxo (ContextCardList → `initiateCardUsage` → `confirmCardUsage`) seta `selectingTargetFor` mas `activeCommand` ainda existe e o overlay da BARRA DE AÇÕES sobrepõe o grid.
- **Solução:** remover a BARRA DE AÇÕES overlay e `activeCommand` state na Etapa 5. Não corrigir antes para evitar retrabalho.
- **Workaround temporário:** usar a UI antiga (BARRA DE AÇÕES) para selecionar cartas que precisam de targeting manual.

---

## Etapa 4 — Forma ativável + NPC reduzido

**Objetivo:** Completar a lógica de forma na `TurnOrderRow` e o fluxo NPC no `ActionIconRail`.

### Arquivos a modificar

- `components/combat/TurnOrderRow.tsx`
- `components/combat/ActionIconRail.tsx`
- `components/combat/ContextCardList.tsx`
- `App.tsx` (callback `onActivateForma`)

### Tarefas

**Detecção de forma:**
1. Em `TurnOrderRow`: computar `hasFormaCard = combatant.cardIds.some(id => cards.find(c => c.id === id)?.type === 'forma')`.
2. Computar `isFormaActive = (combat.activeForms || []).some(f => f.combatantId === combatant.combatId)`.
3. Computar `hasEnoughResourcesForForma` (verificar custo da carta forma que possui — se `auraCost <= currentAura`; se não houver custo explícito, considerar true).
4. `canActivateForma = hasFormaCard && !isFormaActive && !isDown && hasEnoughResourcesForForma`.
5. `hasFormaOnly = hasFormaCard && !isFormaActive && !isDown` (sem checar recursos, para indicação sutil).
6. Anel ao redor do retrato: fino e estático quando `hasFormaOnly && !canActivateForma`; brilhante/animado (`@keyframes forma-pulse`) quando `canActivateForma`.

**ActionIconRail:**
7. Mostrar ícone 💫 Forma apenas quando `hasFormaCard && !isFormaActive && !isDown`. Clicável apenas quando `canActivateForma`.

**ContextCardList — categoria `forma`:**
8. Listar cartas de tipo `forma` do personagem. Estado indisponível se AP insuficiente.
9. Ao clicar carta: chamar `onActivateForma(card)`.

**App.tsx — `onActivateForma`:**
10. Reusar a lógica existente de ativação de forma (que já existe em `App.tsx` via `executeCardOnTarget` ou lógica própria). Ligar ao callback `onActivateForma`.

**NPC coringa:**
11. No `ActionIconRail`, ícone 🃏 Coringa: ao clicar, chama `onNpcWildcard(combatId)`.
12. Em `App.tsx`: `setNpcWildcardModal({ actor: currentActor, command: 'ataque' })` (reusar fluxo existente).

### Verificação
- Personagem com carta `forma` mostra anel no retrato (sutil ou brilhante conforme AP).
- Ícone 💫 aparece no rail quando forma ativável; ausente quando sem forma ou já em forma.
- Ativar forma funciona como antes.
- NPC: 🃏 Coringa abre `NpcWildcardModal` corretamente.
- NPC sem itens: só Ataque + Coringa. Com itens: + Item.

---

## Etapa 5 — Remoção da UI antiga + ajuste de layout

**Objetivo:** Remover bloco COMANDO, sidebar esquerda de abas e painel direito antigo. Ajustar layout do grid. Validar que nada foi perdido.

**Pré-requisito:** todas as etapas 0–4 passaram na verificação. O novo painel de controles e a lista de turnos estão comprovadamente funcionais.

### Arquivos a modificar

- `App.tsx` (remoção + ajuste de layout)

### Tarefas

**Remoções em `App.tsx`:**
1. Remover bloco COMANDO (`activeCommand`, `setActiveCommand`, bloco JSX ~L8097–8975).
   - `activeCommand` e `setActiveCommand` removidos. Substituído por `selectedAction`.
   - Remover os `setActiveCommand(null)` e substituir por `setSelectedAction(null)` nos callbacks já migrados nas etapas anteriores.
2. Remover **sidebar esquerda** de abas (`leftSidebarTab`, `setLeftSidebarTab`, JSX ~L7357–7094). Verificar se o conteúdo (bônus global, dano em massa, uniões) já foi migrado para o `CombatControlPanel` na Etapa 3 — se não, migrar antes de remover.
3. Remover **painel direito existente** (JSX ~L7944–8095) — substituído pelo `CombatControlPanel`. Verificar que o cronômetro, condições de campo, pins e histórico estão todos no novo painel.
4. Remover `showLeftSidebar`, `showRightSidebar` e seus botões de toggle (ou manter como recolhimento dos novos painéis — decidir na hora, dependendo de como os novos painéis foram implementados).
5. Remover `leftSidebarTab` state e import de abas desnecessárias.

**Ajuste de layout do grid:**
6. A arena (grid) deve ocupar o espaço central entre `TurnOrderPanel` (esquerda) e `CombatControlPanel` (direita). Ajustar `padding` / `margin` / `flex` para que o grid não fique coberto pelos painéis flutuantes.
7. Se os painéis forem `position: absolute` (flutuantes), o grid pode permanecer com `width: 100%` e apenas um `padding-left`/`padding-right` adequado. Se forem `position: relative` no flex layout, ajustar o `flex: 1` da área do grid.

### O que verificar antes de remover cada bloco
- **Antes de remover sidebar esquerda:** confirmar que bônus global, dano em massa, uniões, dado e notas estão no `CombatControlPanel`.
- **Antes de remover painel direito:** confirmar que Iniciar/Próximo/Encerrar, Adicionar, Histórico, Cronômetro, Condições de campo, Pins estão no `CombatControlPanel`.
- **Antes de remover bloco COMANDO:** confirmar que toda resolução de carta/item/selo/forma funciona via `selectedAction` + `ContextCardList`.

### Verificação final
- `npm run build` + `tsc` sem novos erros.
- Visual limpo: sem a sidebar de abas, sem o bloco azul COMANDO, sem o painel direito antigo.
- Grid centralizado entre os painéis.
- Fluxo completo: iniciar combate → lista de turnos → ícones → lista contextual flyout → usar carta → próximo turno.
- Forma, fusão, selos, itens, NPC coringa — tudo funcional.
- `PlayerMirror` continua espelhando o grid sem erro.
- Sem regressões nas outras abas (Personagens, Habilidades, etc.) — testar navegação entre abas.

---

## Fase 2 — Propagar estilo às demais abas (escopo futuro)

Após validar o combate visualmente, aplicar os utilitários `mp-*` e os novos tokens às abas:
- Personagens, Habilidades, Itens, Selos, Jornada, Extras.
- Mecânico em sua maioria: substituir contêineres/cabeçalhos/cards pelos utilitários.
- Sem alterar lógica das abas.
- Spec dedicado será criado após o combate estar aprovado.

---

## Resumo das etapas

| Etapa | O que cria/muda | Remove? | Risco |
|---|---|---|---|
| 0 — Fundação de estilo | Tokens + classes mp-* | ❌ | Mínimo |
| 1 — TurnOrderPanel leitura | TurnOrderPanel, TurnOrderRow | ❌ | Baixo |
| 2 — ActionIconRail + ContextCardList | ActionIconRail, ContextCardList, selectedAction | ❌ | Médio |
| 3 — CombatControlPanel | CombatControlPanel | ❌ | Médio |
| 4 — Forma + NPC | Lógica de forma, coringa NPC | ❌ | Baixo |
| 5 — Remoção + layout | — | ✅ antiga UI | Médio |
| Fase 2 | Estilo nas demais abas | — | Baixo |
