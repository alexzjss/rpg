# Grafo de Habilidades — Bloco de Teste Genérico, Triggers Encadeáveis e Polimento — Design

**Data:** 2026-07-10
**Branch de contexto:** `feat/grimorio-v2-fase1`
**Relacionado:** [[project_grimorio_unificado_combate_v2]], `2026-07-09-editor-habilidades-grafo-design.md`, `2026-07-10-efeito-continuo-enquanto-ativa-design.md`

## Problema

O sistema de grafo de habilidades (`utils/abilityGraph.ts`, `utils/abilityInterpreter.ts`,
`utils/abilityGraphAction.ts`, `utils/nodeRegistry.ts`/`nodes/*.ts`, `components/arsenal/graph/*`)
tem duas inconsistências estruturais que limitam o que dá para desenhar como habilidade:

1. **A rolagem/teste de acerto não é um bloco do grafo.** Está espalhada em três lugares que não
   se comunicam: `AbilityHeader.testDice` (campo de cabeçalho, decide acerto/erro de *todos* os
   alvos de uma vez, antes do grafo rodar), `teste_defesa` (é um nó, mas é lido por presença no
   array de nós — não pela árvore — e seu `interpret()` não faz nada além de logar), e `se_chance`
   (é um `ramo` de verdade com `entao`/`senao`, mas só cobre %, não d20-vs-defesa). O simulador
   (`SimulatorPanel`) ignora o teste do header inteiramente, então já se comporta diferente do
   resolver real hoje.

2. **Triggers (`gatilho`) são âncoras especiais, não nós comuns.** Só existe 1 trigger primário
   (`ao_ativar`/`ao_ser_alvejado`, trocado in-place via `setRootTrigger`, nunca removido) + N
   triggers secundários soltos (`enquanto_ativa`, `em_combo`), cada um exigindo uma chamada
   separada de `interpretAbility`. Nada permite ligar uma aresta *para dentro* de um trigger, o
   que impede desenhar uma habilidade de forma como "enquanto ativa → quando alvejada por um
   personagem → executa uma reação" como uma única árvore.

Além disso, `graphCosts`/`graphCooldown`/`graphPreparation`/`graphFormaVisual` leem nós por
presença no array (`n.type === '...'`), ignorando conectividade — diferente de `dano`/`cura`/etc.,
que só se aplicam se alcançados pelo walk. Isso contradiz o modelo geral do grafo.

## Escopo

**Dentro do escopo:**
- Bloco de teste genérico substituindo `header.testDice`, `teste_defesa` e `se_chance`.
- Triggers como nós comuns, encadeáveis, com mecanismo de assinatura/evento para reações penduradas
  dentro de outra árvore (ex. `enquanto_ativa`).
- Polimento: conectividade real para custo/cooldown/preparação/forma-visual, remoção da duplicação
  de `SECONDARY_TRIGGER_TYPES`, correção do mismatch no `NodeInspector`, simulador passando a
  respeitar o teste.

**Fora do escopo (débito técnico documentado, não implementado agora):**
- Reconciliação entre o sistema legado `arsenalPipeline.ts` (reações, vantagem/desvantagem,
  afinidade elemental, defesa dinâmica, custos de selo/ritual) e o novo `abilityGraphAction.ts`.
  O grafo continua sem essas features nesta fase.
- Integração de fato do motor de combate com o disparo de `pendingReactions` (ver seção 2) —
  aqui só se define o contrato de dados; o disparo real no fluxo de turno/dano fica para uma
  fase seguinte.

## Decisões do brainstorm (aprovadas)

| Tema | Decisão |
|---|---|
| Escopo do teste | Substituir tudo — header, `teste_defesa` e `se_chance` viram um único bloco de teste genérico, plugado na árvore como qualquer outro nó, inclusive o acerto inicial da habilidade |
| Fluxo de acerto | Teste = bloco `ramo`; downstream (`dano`/`cura`/etc.) só roda se vier pela saída `entao` |
| Modelo de trigger | Trigger vira nó comum (família `evento`) com `interpret()` próprio; quando pendurado como filho de outro nó, registra uma assinatura/listener em vez de executar imediatamente — motor de interpretação precisa suportar execução adiada, não só DFS síncrono |
| Sistema de eventos | Construído sobre o rastro de efeito ativo já existente (`sourceId`/`appliedAtRound`/`metadata`, ver [[project_grimorio_unificado_combate_v2]]) — estendido com `pendingReactions`; o disparo real no motor de combate é fase seguinte |
| Escopo do legado | Reconciliação com `arsenalPipeline.ts` fica fora, só documentada |

## Arquitetura

### 1. Bloco de teste genérico (`teste`)

Novo tipo de nó, família `ramo` (mesmo grupo de `se_vida_alvo`, `se_aura_minima`, etc.):

```ts
type TesteProps = {
  dice: string;                 // ex: '1d20'
  comparador: 'defesa_alvo' | 'valor_fixo' | 'aura_alvo' | 'porcentagem';
  valorFixo?: number;           // usado quando comparador === 'valor_fixo'
  modificador?: number;         // bônus/penalidade somado à rolagem
};
```

- `evaluate(props, ctx)`: rola `ctx.roller(props.dice) + (props.modificador ?? 0)` e compara com o
  critério indicado por `comparador` (defesa do alvo, aura do alvo, valor fixo, ou puro %-check
  quando `comparador === 'porcentagem'` — este último absorve o `se_chance` atual, que é removido
  do registry por ser um caso particular do mesmo conceito).
- Saída `entao`/`senao` como qualquer `ramo`: efeitos de dano/cura/condição penduram no `entao`;
  `senao` fica livre (vazio, ou um efeito reduzido para representar erro parcial).

**Migração dos usos atuais:**

- `AbilityHeader.testDice` é removido do tipo `AbilityHeader`. `createAbilityGraph()` passa a criar
  por padrão `gatilho(ao_ativar) → teste(comparador: 'defesa_alvo', dice: '1d20') → (espaço para
  efeitos)`, preservando o comportamento de "toda habilidade nova já rola pra acertar", agora como
  bloco editável/removível no canvas em vez de campo de cabeçalho (a UI "Rolagem inicial" em
  `GraphEditor.tsx` some).
- `teste_defesa` é removido do registry. O caso de uso "definir a rolagem de defesa de quem reage"
  passa a ser modelado como um nó `teste` pendurado na própria árvore `ao_ser_alvejado` do
  defensor — ele já é dono da própria reação, não precisa mais existir como config lida de fora.
- `resolveAbilityGraphAction`: a etapa que hoje rola `header.testDice` uma vez para todos os alvos
  antes do walk desaparece. O walk roda direto a partir da raiz para todos os `primaryTargets`;
  hit/miss passa a ser decidido pelo nó `teste` dentro do walk, **por alvo** — corrige de graça um
  bug sutil atual (hoje uma única rolagem de acerto vale para todos os alvos simultaneamente).
- `graphDefenseTest()` (scan estrutural por `n.type==='teste_defesa'`) é removido.
- `abilityDescribe.ts`/`abilityValidate.ts`/`SimulatorPanel` param de mencionar `testDice`/
  `teste_defesa` explicitamente e passam a descrever/simular o nó `teste` como qualquer outro nó
  de `ramo` (ver seção 3, simulador).

### 2. Triggers encadeáveis (evento/assinatura)

**Nova família `evento`** substitui a família especial `gatilho`. Os tipos atuais (`ao_ativar`,
`ao_ser_alvejado`, `enquanto_ativa`, `em_combo`) migram para essa família. Fica separada de
`efeito` porque semanticamente não produzem efeito de jogo por si só — só resolvem *quando* a
subárvore roda.

**Estrutura de dados:** nenhuma mudança em `GraphNode`/`GraphEdge` — a única regra que muda é que
nós de família `evento` passam a poder ter pais (hoje travados a "sempre raiz").
`removeNode()` deixa de bloquear remoção por família; a única regra remanescente é "não remover o
nó-raiz do grafo inteiro" (o nó sem nenhum pai), verificada estruturalmente, não mais por tipo.

**Motor de interpretação (`abilityInterpreter.ts`):**

- Descoberta de raiz muda de `n.family === 'gatilho' && ...` para "nó sem edges de entrada"
  (`!edges.some(e => e.to === n.id)`). Grafos desconexos (ex. `em_combo` solto) continuam gerando
  uma raiz de execução por componente, só que a checagem passa a ser estrutural.
- `walk(node)` ganha um caso novo para `node.family === 'evento'`:
  - Se é o próprio nó de entrada da chamada atual (`ao_ativar` chamado por
    `resolveAbilityGraphAction`, `enquanto_ativa` chamado por `runOngoingEffect`, ou um nó
    explicitamente listado em `entryNodeIds`) → comporta-se como hoje, passa direto para os filhos.
  - Se é alcançado como filho durante o walk de outra árvore (ex. dentro de `enquanto_ativa`) → em
    vez de recursar, chama `ctx.registerPendingReaction(node, childEdges)` e **para** ali.
- O parâmetro `opts.rootType` do `interpretAbility` é substituído por `opts.entryNodeIds: string[]`
  — a chamada especifica exatamente quais nós iniciar, já que não há mais tipos fixos de raiz.

**Efeitos ativos e o motor de combate (contrato de dados, disparo real fora de escopo):**

- O rastro de efeito ativo (`ongoingEffectIntents`, que já carrega `sourceId`, `appliedAtRound`,
  `metadata` — ver [[project_grimorio_unificado_combate_v2]]) ganha um campo:
  ```ts
  pendingReactions?: { eventType: string; nodeIds: string[] }[]
  ```
- Quando o motor de combate (fase seguinte, não implementada aqui) processar um evento relevante
  (dano recebido, fim de turno, etc.), a expectativa é: consultar os efeitos ativos do personagem
  atingido, filtrar `pendingReactions` cujo `eventType` casa o evento ocorrido, e disparar
  `interpretAbility(graph, level, input, { entryNodeIds: nodeIds })` para cada match.

**Impacto nos tipos existentes:**

- `enquanto_ativa` e `em_combo` continuam existindo como tipos de nó `evento`, mas perdem o
  tratamento especial de "trigger secundário" — são só mais um nó de evento que, quando é a raiz
  da chamada, executa normal; quando é filho, registra e para.
- `SECONDARY_TRIGGER_TYPES` (hoje duplicado em `abilityGraphEdit.ts` e `NodePalette.tsx`) é
  removido dos dois arquivos — não há mais distinção estrutural entre trigger primário/secundário.
- `NodePalette.tsx`: os dois grupos atuais ("Gatilho raiz" / "Raiz secundária") viram um grupo só,
  "Evento", disponível tanto para adicionar como novo nó-raiz solto (via `addNode` sem parent)
  quanto pendurado como filho de qualquer nó existente, através do fluxo genérico de
  `pendingConnection` que já existe para `ramo`/`alvo`/`efeito`.

### 3. Polimento geral

- **Conectividade real para custo/cooldown/preparação/forma-visual.** `graphCosts`,
  `graphComboConfig`, `graphCooldown`, `graphPreparation`, `graphFormaVisual` deixam de fazer
  `merged.nodes.find(n => n.type === '...')` (presença em qualquer lugar do array) e passam a
  considerar apenas nós alcançáveis a partir da(s) raiz(es) real(is) — reaproveitando a mesma
  lógica de descoberta de raiz da seção 2. Um `custo`/`cooldown`/`preparacao` desconectado deixa
  de contar, alinhando com o comportamento já existente de `dano`/`cura`.
- **Simulador.** `SimulatorPanel`/`utils/abilitySimulator.ts` passam a chamar
  `resolveAbilityGraphAction` (ou uma variante equivalente) em vez de `interpretAbility` puro —
  consequência natural de mover o teste de acerto para dentro do grafo: não existe mais "gate de
  header" para o simulador ignorar, então simular corretamente já exige rodar o walk completo,
  teste incluso, alvo a alvo.
- **Inspector.** `NodeInspector.tsx` hoje esconde "Remover nó" para toda a família `gatilho`,
  mesmo quando a lógica de edição (`removeNode`) já permitia remover triggers secundários — um
  mismatch relatado na análise. Com a família `evento` genérica e a regra "só a raiz do grafo
  inteiro é protegida" (seção 2), o botão passa a usar o mesmo helper estrutural que `removeNode`,
  eliminando o mismatch.

## Consequências e riscos

- A mudança no motor (`abilityInterpreter.ts`) é a mais arriscada: descoberta de raiz por
  "sem pais" em vez de por família precisa ser testada contra todos os tipos de grafo existentes
  (habilidade simples, forma, combo, ongoing effect) para garantir que nenhuma raiz deixa de ser
  encontrada.
- Testar acerto por alvo (em vez de uma vez para todos) muda resultado observável de habilidades
  em área já existentes — é uma correção de comportamento, não só refatoração interna; vale
  destacar isso na descrição da habilidade/changelog quando a mudança for implementada.
- `pendingReactions` é só contrato de dados nesta fase; nenhuma habilidade vai de fato dar reação
  a um evento até a fase seguinte (integração com motor de combate) ser implementada. Isso deve
  ficar claro na UI (ex. aviso "reação ainda não disparada em combate" enquanto a fase não existe),
  para não sugerir uma funcionalidade que ainda não roda.
