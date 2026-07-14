# Editor de Habilidades em Grafo — Fase 4 (Integração + remoção do antigo) — Plano

> **For agentic workers:** Execução inline nesta sessão (sem subagentes, sem commits). Formato enxuto (mesma convenção das Fases 2-3). Esta fase toca **combate ao vivo** — cada tarefa roda a suíte completa antes de seguir, e o final é verificado no app real via preview tools (não só o harness de demo).

**Goal:** Ligar o motor de grafo (Fases 1-3) na Cena ao vivo, persistir `AbilityGraph` no arsenal, ligar a lista do arsenal ao `GraphEditor`, e **deletar `ArsenalCardEditor.tsx`**.

## Escopo — o que entra e o que fica para depois

**Entra nesta fase:**
- Teste de acerto opcional no cabeçalho (`AbilityHeader.testDice`), igual ao sistema antigo.
- Cooldown/cargas de habilidades-grafo, reaproveitando o mesmo `ArsenalHolding` (`cooldownRemaining`/`currentCharges`) já usado pelo legado — mesmo mecanismo, chave é o `id` do grafo.
- Ações "ativa" (uso manual) mirando outro alvo, o próprio usuário, ou campo de batalha (`target.type==='campo_de_batalha'`).
- Persistência de `AbilityGraph` no store `grimoire` existente (convive com `ArsenalCard` legado).
- `ArsenalWorkspace`: aba "Habilidades" passa a criar/editar via `GraphEditor`; abas Selo/Item/Arma perdem o botão "Editar" (ArsenalCardEditor deletado) mas continuam funcionando em combate (dados legados intocados).
- `ArsenalCardEditor.tsx` e seu teste **deletados**.

**Fica para uma fase futura (documentado, não escondido):**
- Janela de **reação/proteção** (cartas `abilityType:'protecao'`) — só para o pipeline legado por ora.
- **Combos** (empilhamento de cartas) — só legado.
- **Preparação com duração** (`preparation.timing` não-instantâneo) no grafo — o adaptador desta fase trata toda habilidade-grafo como instantânea; preparar fica para depois.
- **Anel visual de Forma** (bônus de HP/aura, ícone, cor) para habilidades-grafo que usam o nó `transformar` — o nó já registra a intenção (`transformIntents`) e ela aparece no log/trace, mas não altera o token visualmente nem aplica bônus ainda.
- Migração de arma/selo/item para o grafo.

## Extensões no núcleo (aditivas)

- `utils/abilityGraph.ts` — `AbilityHeader.testDice: string | null` (default `null` em `createAbilityGraph`).

## Novos arquivos

**`utils/abilityGraphAction.ts`** — adaptador de combate para habilidade-grafo, espelhando o contrato de `resolveArsenalAction`:
```ts
export interface AbilityGraphActionRequest {
  graph: AbilityGraph; level: number;
  actor: ArsenalActorState; targets: ArsenalActorState[];
  attackModifier?: number; // bônus externo ao teste de acerto (paridade com reações, não usado nesta fase)
  roller?: (notation:string)=>number;
}
export interface AbilityGraphActionResult {
  status: 'bloqueada' | 'concluida';
  reason?: string;
  actor: ArsenalActorState; targets: ArsenalActorState[];
  rolls: { test?: number };
  hitTargetIds: string[];
  defeatedIds: string[];
  trace: TraceStep[]; // de abilityInterpreter
  fieldEffects: never[]; // grafo não modela efeitos de campo nesta fase
}
export function resolveAbilityGraphAction(request: AbilityGraphActionRequest): AbilityGraphActionResult;
```
Lógica:
1. `holding = actor.holdings.find(h=>h.cardId===graph.id)`. Se `holding.cooldownRemaining>0` → bloqueada. Se `graph.header` tiver cargas equivalentes (reaproveita `holding.currentCharges` quando existir um `charges` configurado no header — **nota:** `AbilityHeader.charges` já existe desde a Fase 1; se ausente, ignora cargas) e `currentCharges<=0` → bloqueada.
2. Custo: `auraCost>actor.currentAura` → bloqueada; senão desconta `auraCost`/`ammoCost` de uma cópia do ator.
3. Teste de acerto: se `header.testDice`, rola `roller(header.testDice)`; alvo é "hit" se `test >= target.defense`; sem `testDice`, todos os alvos são hit.
4. Roda `interpretAbility(graph, level, {actor, primaryTargets: hitTargets, allTargets: targets, roller})` só com os alvos que acertaram; alvos que erraram entram no resultado final sem alteração.
5. Atualiza `holding.cooldownRemaining`/`currentCharges` (mesma regra do legado: `cooldown.type!=='sem_cooldown'` seta remaining; `charges` decrementa 1) numa cópia de `actor.holdings`.
6. `defeatedIds` = alvos com `currentHp<=0`. `status:'concluida'` sempre que não bloqueado (preparação não modelada nesta fase).

**`utils/combatLogGraph.ts`** — `buildAbilityGraphCombatLog({graph, beforeActor, beforeTargets, result}): CenaLogEntry[]`, no espírito de `buildArsenalCombatLog` mas lendo do `trace` do interpretador em vez de campos de `ArsenalCard`: uma entrada `'roll'` se houve teste de acerto (com sucesso/falha por alvo), uma entrada por alvo atingido com o delta de HP/aura (dano/cura), uma entrada `'system'` por alvo que evitou. Reaproveita `logEntry`/`CenaLogEntry` de `utils/cena.ts`.

**`hooks/useAbilityGraphs.ts`** — espelha `hooks/useArsenal.ts`, mas para `AbilityGraph[]`: `{ graphs, loading, error, save, remove, find }`, usando `DatabaseService.syncAbilityGraphs`/`saveAbilityGraph`/`deleteAbilityGraph` (novos, ver abaixo).

## Arquivos modificados

**`utils/database.ts`**:
- `syncGrimoire`/`_getAll('grimoire')` hoje passa tudo por `normalizeArsenalCard` — isso quebraria um `AbilityGraph` (schemaVersion 2, sem `.combat`/`.category`). Adicionar um discriminador: entradas com `kind==='graph'` passam por uma normalização mínima própria (`normalizeAbilityGraph`, só garante campos obrigatórios com defaults, sem tentar herdar campos de `ArsenalCard`); as demais seguem por `normalizeArsenalCard` como hoje.
- Novas funções espelhando as existentes: `syncAbilityGraphs(cb)` (filtra `kind==='graph'` do mesmo store `grimoire`), `saveAbilityGraph(graph)` (`_put('grimoire', graph)` + notifica), `deleteAbilityGraph(id)` (`_delete('grimoire', id)` + notifica). Sem espelhamento em store legada (grafo não tem equivalente arma/selo/item/cards).
- `syncArsenalCards`/`saveArsenalCard`/`deleteArsenalCard` (legado) passam a **filtrar fora** entradas `kind==='graph'` antes de normalizar como `ArsenalCard`, evitando poluir a lista legada.

**`utils/actions.ts`**:
- `ResolvedAction.abilityGraph?: AbilityGraph` e `abilityGraphLevel?: number` (novos campos opcionais).
- `normalizeAbilityGraph(graph: AbilityGraph, level: number): ResolvedAction` — `category` = `'atacar'` se o grafo mesclado no nível tiver algum nó `type==='dano'` alcançável a partir da raiz, senão `'habilidade'` (reaproveita a mesma heurística simples de `arsenalCardCausesDamage`, adaptada: percorre `mergeLevel(graph,level).nodes` procurando `type==='dano'`). `targeting` = `'self'` se `header.target.type==='proprio_usuario'`, senão `'other'`.
- `actorActions(args)` ganha `abilityGraphs?: { graph: AbilityGraph; level: number }[]` — para cada entrada, `normalizeAbilityGraph` e empilha na categoria resultante (mesmo padrão do loop de `arsenalCards`).

**`components/arsenal/ArsenalWorkspace.tsx`**:
- Remove `import ArsenalCardEditor`.
- `useAbilityGraphs()` além de `useArsenal()`.
- Aba "Habilidades": lista **apenas** `AbilityGraph[]` (não mais `cards.filter(category==='habilidade')` — entradas legadas de habilidade continuam existindo no banco e funcionando se algum personagem as possuir, mas não aparecem mais nesta lista de criação/edição, conforme decisão já registrada na Fase 1: "começa do zero, sem migração").
- "Nova carta" quando `category==='habilidade'` → abre `GraphEditor` com `createAbilityGraph({id: crypto.randomUUID(), name:'Nova habilidade'})`; "Editar" num item da lista de habilidades → abre `GraphEditor` com o `AbilityGraph` existente.
- `onSave` do `GraphEditor` → `saveGraph` (via `useAbilityGraphs().save`), com a mesma lógica de auto-atribuir ao personagem selecionado (via `arsenal: assignCardToHoldings(...)` — `assignCardToHoldings` recebe hoje um `ArsenalCard`; checar assinatura e, se acoplada a campos de `ArsenalCard`, criar `assignEntryToHoldings(holdings, {id,...}, quantity)` mínimo que só precisa de `.id`).
- Abas Selo/Item/Arma: botão "Editar" removido da UI (ou trocado por texto "Edição em migração" desabilitado); botão "Atribuir" continua.

**`tabs/CenaTab.tsx`**:
- Prop nova `abilityGraphs: AbilityGraph[]` (App.tsx passa a lista de `useAbilityGraphs()`), leveled por holding: `leveledAbilityGraphs = abilityGraphs.map(g => ({ graph: g, level: arsenalLevels[g.id] ?? 1 }))` (reaproveita o mesmo `arsenalLevels` state por id, já que ids não colidem entre sistemas).
- `activeArsenalCards`-equivalente: `activeAbilityGraphs = activeChar ? leveledAbilityGraphs.filter(entry => (activeChar.arsenal??[]).some(h=>h.cardId===entry.graph.id)) : []`.
- `actorActions({..., arsenalCards: activeArsenalCards, abilityGraphs: activeAbilityGraphs})`.
- `resolveCanonicalOn`: no topo, se `action.abilityGraph` (em vez de `action.arsenalCard`), delega para um novo `resolveAbilityGraphOn(targetId, action)` — versão simplificada de `resolveCanonicalOn` sem proteção/preparação, usando `resolveAbilityGraphAction` + `buildAbilityGraphCombatLog` + `applyArsenalActor` (reaproveitado, já é agnóstico ao tipo de "card" pois só lê `ArsenalActorState`).
- `resolveFieldCast`: mesmo padrão — branch por `action.abilityGraph` chamando `resolveAbilityGraphAction` com `targets:[]` quando `header.target.type==='campo_de_batalha'` (fieldEffects sempre vazio nesta fase — nota: se o grafo for de campo de batalha, ele roda mas não instala efeito de campo persistente; log indica execução mesmo assim). *(Simplificação aceitável: campo de batalha via grafo é raro nesta fase inicial.)*
- `onSelectAction`: os branches de `action.arsenalCard?.abilityType==='forma'|'combo'` continuam exclusivos do legado (uma habilidade-grafo nunca cai nesses branches, pois não tem `arsenalCard`); adiciona um branch cedo para `action.abilityGraph` seguir para mira normal (self/other) via `resolveAbilityGraphOn`/`setArmed`.
- `onParticipantClick`: `armed?.arsenalCard` vira `armed?.arsenalCard || armed?.abilityGraph`, com o branch de proteção reativa (`protectionCardsFor`) pulado quando é `abilityGraph` (proteção é feature legado-only nesta fase).

**Deleções:**
- `components/arsenal/ArsenalCardEditor.tsx`
- `components/arsenal/ArsenalCardEditor.test.tsx`

## Testes

- `utils/abilityGraphAction.test.ts`: bloqueia por cooldown/cargas/aura insuficiente; sem `testDice` sempre acerta; com `testDice` acerta/erra conforme roller determinístico vs `defense`; atualiza `holding.cooldownRemaining`/`currentCharges` após uso; roda o interpretador só nos alvos que acertaram.
- `utils/combatLogGraph.test.ts`: gera entrada de dano/cura por alvo atingido, entrada de "evita" por alvo que errou, entrada de rolagem quando há `testDice`.
- `utils/database.test.ts` (arquivo existente, adicionar casos): salvar/ler um `AbilityGraph` via `saveAbilityGraph`/`syncAbilityGraphs` não corrompe nem aparece em `syncArsenalCards`.
- `components/arsenal/ArsenalWorkspace.test.tsx` (criar, não existe hoje — checar antes): aba Habilidades abre `GraphEditor` ao clicar "Nova carta"/"Editar"; abas legadas não mostram mais "Editar".
- `tabs/CenaTab.test.tsx` (arquivo existente): um teste novo — personagem com uma `AbilityGraph` (ex.: template Ataque básico) atribuída, seleciona a ação, clica no alvo, confirma dano aplicado + log gerado + cooldown setado quando configurado.
- Rodar a suíte inteira a cada tarefa (`npm test`) — mesmas 13 falhas pré-existentes de WIP alheio em `CenaTab.test.tsx` são aceitáveis; qualquer falha NOVA precisa ser corrigida antes de seguir.

## Verificação em navegador (app real, não o harness de demo)

Depois de tudo verde: abrir o app real (sem `?view=`), ir à aba Arsenal → Habilidades → criar uma habilidade de dano simples pelo `GraphEditor` → salvar → atribuir a um personagem → ir à Cena, iniciar combate, usar a habilidade num alvo → confirmar dano aplicado, log correto, e (se configurado cooldown) a ação ficar indisponível na rodada seguinte.

## Self-review

- **Cobertura:** teste de acerto (spec aprovado pelo usuário), cooldown/cargas, persistência, UI do arsenal, despacho na Cena (mira outro/self/campo), remoção do editor antigo — todos os itens do roadmap da Fase 4 que são razoáveis para uma integração inicial.
- **Riscos descope explícito:** proteção/combo/preparação-com-duração/anel de forma para grafo — documentados como não-cobertos, não escondidos.
- **Consistência:** `AbilityGraphActionResult` é deliberadamente mais enxuto que `ActionResolutionResult` (sem `reactions`/`preparation`/`fieldEffects` reais) porque o escopo desta fase não implementa essas features para o grafo — os campos que existem batem 1:1 com o que `resolveCanonicalOn`/`buildAbilityGraphCombatLog` de fato consomem.
