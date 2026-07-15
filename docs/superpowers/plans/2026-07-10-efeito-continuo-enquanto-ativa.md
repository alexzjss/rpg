# Efeito contínuo "Enquanto ativa" — Implementation Plan (enxuto)

> Execução inline nesta mesma sessão, sem subagentes, sem commit. Plano resumido por pedido explícito do usuário (economia de tokens) — código vai direto nos arquivos, não duplicado aqui.

**Goal:** raiz secundária `enquanto_ativa` (o layout já suporta múltiplas raízes — `graphLayout.ts:14` já itera `roots`), bloco `aplicar_como_efeito` que registra o efeito no dono, e a Cena rodando essa árvore no início do turno do dono até a duração acabar.

## Tasks

1. **`utils/nodes/coreNodes.ts`** — registrar gatilho `enquanto_ativa` (family gatilho, sem campos) e efeito `aplicar_como_efeito` (`alvo`: proprio|alvo_atual, `rounds`: numero) que empurra em `ctx.ongoingEffectIntents`.
2. **`utils/abilityInterpreter.ts`** — `InterpretCtx.ongoingEffectIntents?: {targetId,casterId,rounds}[]`, inicializar `[]`; `AbilityResult` ganha `ongoingEffectIntents`; `interpretAbility` aceita `opts?: {rootType?: string}` — raiz = primeiro nó gatilho cujo tipo bate com `opts.rootType` (se informado) ou, por padrão, o primeiro gatilho com tipo ≠ `enquanto_ativa` (preserva comportamento atual).
3. **`utils/abilityGraphEdit.ts`** — `addSecondaryTrigger(graph, type)`: no-op se já existir nó com esse `type`; senão adiciona nó solto (sem aresta) `{id, type, family:'gatilho', props:{}}`. `removeNode`: só protege contra remoção nós gatilho com `type !== 'enquanto_ativa'`.
4. **`utils/abilityGraphAction.ts`** — `AbilityGraphActionResult` ganha `ongoingEffectIntents`; `resolveAbilityGraphAction` acumula entre passes. Nova função `runOngoingEffect(graph, level, owner, roller)` chama `interpretAbility(graph, level, {actor:owner,primaryTargets:[owner],allTargets:[owner],roller}, {rootType:'enquanto_ativa'})`.
5. **`utils/cena.ts`** — `OngoingEffectState {id, ownerId, casterId, graphId, roundsRemaining}`; `EncounterState.activeOngoingEffects: OngoingEffectState[]`; default `[]` em `DEFAULT_ENCOUNTER`/`createDefaultEncounter`.
6. **`utils/database.ts`** (`ensureCena`) — sanitizar `activeOngoingEffects` como os demais arrays de `encounter`.
7. **`tabs/CenaTab.tsx`**:
   - Import `runOngoingEffect`.
   - No fluxo de `resolveAbilityGraphAction` usado ao ativar uma habilidade-grafo normal (mesmo handler que já lê `result.trace`/`result.actor`), se `result.ongoingEffectIntents?.length`, adicionar entradas a `cena.encounter.activeOngoingEffects` (`graphId = action.abilityGraph.id`).
   - Em `goNextTurn`, logo após o bloco `if (owner) { ... tick de activeEffects ... }` (linha ~872-907): para cada entrada de `activeOngoingEffects` com `ownerId===owner.id`, rodar `runOngoingEffect` no grafo correspondente (`leveledAbilityGraphs.find`), aplicar hp/aura/effects resultantes via `updates.set`, decrementar `roundsRemaining`; ao chegar a 0, remover a entrada e logar `"{nome} deixou de estar sob efeito de {habilidade}."` (`logEntry('system', ...)`).
8. **`components/arsenal/graph/NodePalette.tsx`** — botão "Enquanto ativa" na seção de gatilho (ação `onAddSecondaryTrigger`, distinta de `onPickTrigger` que substitui a raiz primária).
9. **`components/arsenal/graph/GraphEditor.tsx`** — prop nova ligada a `addSecondaryTrigger`.

## Testes

TDD por arquivo tocado (mesmo padrão do resto do projeto): `coreNodes.test.ts`, `abilityInterpreter.test.ts`, `abilityGraphEdit.test.ts`, `abilityGraphAction.test.ts`, `CenaTab.test.tsx` (fluxo completo: aplicar → avançar turno → efeito roda → expira). Suíte completa ao final, checando contra a baseline atual (459 passando / 13 falhas pré-existentes).

## Fora de escopo

Bloco "ao expirar", gatilhos reativos genéricos, blocos de grid/turno — fases futuras (spec já registra isso).
