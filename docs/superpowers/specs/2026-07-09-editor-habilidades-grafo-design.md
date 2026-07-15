# Editor de Habilidades em Grafo — Design

**Data:** 2026-07-09
**Branch de contexto:** `feat/grimorio-v2-fase1`
**Relacionado:** [[project-grimorio-unificado-combate-v2]], [[project-aba-cena-unificada]]

## Problema

O sistema atual de criação/edição de habilidades (`components/arsenal/ArsenalCardEditor.tsx`,
~724 linhas) expõe um `ArsenalCard` com um tipo `ArsenalEffect` de ~40 campos, tudo achatado
em 11 abas. É poderosíssimo, mas todo o poder aparece de uma vez — é confuso e pouco convidativo
à criação. O objetivo é **eliminar o editor atual** e recriar um sistema intuitivo na superfície,
profundo por dentro, com margem para habilidades grandes estilo JRPG/RPG de mesa, e **extensível**.

## Decisões do brainstorm (aprovadas)

| Tema | Decisão |
|---|---|
| Paradigma | **Node graph** — canvas visual de nós ligados por fios |
| Teto de lógica | **Fluxo com ramificação** (Gatilho → Condições SE/SENÃO → Efeitos em sequência). Sem loops nem variáveis. |
| Caso simples | **Templates** que nascem com nós prontos; grafo do zero é opção |
| Paleta de efeitos | **Herdar todas** as capacidades atuais + registro extensível para adicionar nós novos |
| Escopo | **Habilidades + Formas** (arma/selo/item ficam de fora nesta fase) |
| Progressão | **Perfis de nível** — nível 1 = grafo base; níveis seguintes sobrescrevem valores / ligam nós |
| Teste | **Simulador dry-run** — rola dados e mostra passo a passo o resultado |
| Escopo da fase | Modelo + editor + simulador **+ integração na Cena ao vivo** |
| Superfície | **Tela cheia dedicada** |
| Coexistência | **Deletar o editor antigo agora.** Habilidades/formas antigas descartadas (começa do zero). Arma/selo/item legados continuam rodando em combate via pipeline antigo, mas ficam sem tela de edição até migrarem em fase futura. |
| Cabeçalho vs grafo | Custo/ativação/alvo-base ficam **fora** do canvas (cabeçalho da ficha) |
| Canvas | **Próprio, em SVG/DOM**, sem dependência nova (projeto só tem react/react-dom/lucide) |
| Alvo | **Seletor de contexto**, não nó de loop |

## Arquitetura

### 1. Anatomia de uma habilidade

Uma habilidade/forma = **Cabeçalho** + **Grafo** + **Perfis de nível**.

```
AbilityGraph {
  kind: 'graph'
  schemaVersion: 2
  id, header: AbilityHeader
  nodes: GraphNode[]
  edges: GraphEdge[]        // controle de fluxo (não dataflow)
  levelProfiles: LevelProfile[]
  metadata?
}
```

**`AbilityHeader`** (campos "chatos-mas-necessários", fora do canvas):
- Identidade: `name`, `description`, `icon`, `iconPosition`, `artLayout`, `element`, `tags`, `visibility`.
- Ativação: `activation` = `'ativa' | 'ao_equipar' | 'ao_consumir' | 'enquanto_forma_ativa'` (define a raiz-gatilho padrão).
- Custo: `auraCost`, `ammoCost`, `actionEconomy` (`'principal' | 'menor' | 'reacao' | 'livre'`).
- Alvo-base: `target: TargetConfig` (reaproveita o tipo atual), `area?: AreaConfig`.
- Recursos: `cooldown: CooldownConfig`, `charges?: ChargeConfig`, `preparation: PreparationConfig`.

Tudo isso já existe hoje em `utils/arsenal.ts` e é **reaproveitado como está**.

### 2. O grafo é uma árvore de fluxo (behavior tree), não dataflow

Um único **nó-raiz de Gatilho**; a partir dele, arestas de **controle** ("próximo passo").
Nós de **Ramo** têm duas saídas (`então` / `senão`). Efeitos executam em sequência ao longo das arestas.

**Famílias de nós:**

- **Gatilho (raiz):** `ao_ativar`, `ao_equipar`/`enquanto_equipado`, `ao_consumir`, `enquanto_forma_ativa`,
  e os `TriggerEvent` reativos existentes (`ao_atacar`, `ao_receber_dano`, `inicio_turno`, …). Um grafo
  pode ter mais de uma raiz (ex.: uma forma com efeito passivo + reação).
- **Ramo (SE/SENÃO):** avalia um **Predicado** e segue por uma das duas saídas. Predicados reaproveitam
  `UsageCondition` + checagens de estado do alvo (tem condição X, vida </> %, aura ≥ N, tem tag/efeito,
  está Molhado, etc.).
- **Alvo (seletor):** troca o escopo dos efeitos seguintes (`proprio`, `alvo_da_habilidade`, `todos_inimigos`,
  `todos_aliados`, `area`, `campo`). Não há nó de repetição; "para cada alvo" é resolvido pela camada de alvo.
- **Efeito (a paleta):** **um nó por capacidade atual**, herdando tudo de `ArsenalEffect`:
  Dano, Cura, AplicarCondição (as 16 clássicas), Buff/Debuff de stat (`EffectModifier`), BônusDeRolagem
  (`DiceBonus`), Escudo, Mover (empurrar/puxar/teleportar/trocar), Silenciar, Provocar, Incapacitar,
  Invisibilidade, Dispel, Invocar, Transformar, Reviver, GerarRecurso, ReduzirCusto, Corrente, Eco,
  TabelaAleatória, MarcarVulnerável, ConversãoDeDano, conceder RouboDeVida/Espinhos/AfinidadeElemental,
  AçãoExtra, DanoPeriódico/CuraPeriódica.

Os **valores** (dado, flat, %, elemento, duração, stack) ficam **inline no nó** (painel de propriedades),
não como nós separados — o canvas não vira sopa de nós-de-número.

**Extensibilidade — registro de nós:**
```
registerNodeType({
  type: 'dano',
  family: 'efeito',
  label: 'Dano',
  fields: FieldSchema[],          // descreve o painel de propriedades
  interpret: (props, ctx) => …,   // como o motor executa
  summarize: (props) => string,   // texto para o resumo/preview
})
```
Adicionar uma capacidade nova = registrar uma entrada. Editor e interpretador se auto-configuram a partir
do registro (paleta, painel de propriedades e execução derivam do mesmo schema).

### 3. Interpretador (motor único: simulador + Cena)

`interpretAbility(graph, level, ctx): AbilityResult`

- Caminha da raiz-gatilho; em cada **Ramo** avalia o predicado e segue "então"/"senão"; em cada **Efeito**
  executa a `interpret` do tipo de nó.
- **Reutiliza as primitivas que já existem** em `arsenalPipeline.ts`. Extraímos as operações atômicas hoje
  embutidas em `resolveArsenalAction` — aplicar dano com elemento+afinidade+interação
  (`applyDamageConditionInteractions`, `activeAffinity`), aplicar condição com imunidade+rolagem
  (`stackEffect`, `isImmuneTo`, `classicApplyRoll`), cura, aura, lifesteal, espinhos — para um módulo de
  **primitivas compartilhadas** (`utils/abilityPrimitives.ts`). **Pipeline antigo e interpretador novo chamam
  a mesma matemática.**
- Saída `AbilityResult`: mutação de ator/alvos, efeitos ativos aplicados, `trace` passo-a-passo (para o
  simulador), gatilhos emitidos, derrotados. Recebe um `roller` injetável (determinístico nos testes/simulador).

**Simulador dry-run** = `interpretAbility` com roller real + um ator/alvo fictícios, renderizando o `trace`
("acertou 14 ≥ 12; 2d6=7 de fogo; alvo Molhado → +50% = 10; aplicou Queimadura 3 rodadas").

### 4. Integração na Cena ao vivo

`CenaTab` despacha por tipo de entrada:
- Entrada `kind:'graph'` (habilidade/forma) → `interpretAbility`.
- Carta legada (arma/selo/item, `schemaVersion:1`) → `resolveArsenalAction` (inalterado).

Ambos operam sobre o **mesmo `ArsenalActorState`/`ActiveEffectState`** — uma arma legada equipada e uma
habilidade nova coexistem no mesmo combate. O adaptador normaliza os dois resultados para o que a Cena já
aplica hoje (dano/cura/efeitos/log/mortes).

### 5. Progressão — perfis de nível

```
LevelProfile { level: number; overrides: NodeFieldOverride[]; enabledNodeIds?: string[] }
NodeFieldOverride { nodeId: string; field: string; value: unknown }
```
Nível 1 = grafo base. Editar no nível N mostra o grafo **mesclado** (base + overrides até N) e grava no
perfil de N. `enabledNodeIds` liga nós que só existem a partir daquele nível.

### 6. Editor em tela cheia

Overlay full-screen, três zonas + topo:
- **Topo:** cabeçalho da ficha (identidade, ativação, custo, alvo-base, recursos), **seletor de nível**,
  botão **Simular**, **Salvar**, fechar.
- **Esquerda:** paleta de nós (famílias, busca) + **galeria de templates** (Ataque básico, Cura, Buff,
  Debuff, Combo condicional…) que instanciam um grafo pronto.
- **Centro:** canvas SVG/DOM — pan/zoom, nós arrastáveis, arestas de fluxo, layout top-down
  auto-organizável, adicionar nó por arrastar da paleta ou por "+" numa saída.
- **Direita:** painel de propriedades do nó selecionado, gerado a partir do `FieldSchema` do tipo do nó.

O canvas é **componente próprio** (`components/arsenal/graph/…`), sem dependência externa.

## Componentes (isolamento e responsabilidade)

| Unidade | Responsabilidade | Depende de |
|---|---|---|
| `utils/abilityGraph.ts` | Tipos `AbilityGraph`/nós/arestas/perfis + `createAbilityGraph`, merge de níveis | `arsenal.ts` (tipos reaproveitados) |
| `utils/nodeRegistry.ts` | Registro de tipos de nó (schema de campos + interpret + summarize) | `abilityGraph.ts` |
| `utils/nodes/*.ts` | Um arquivo por família registrando os tipos concretos | `nodeRegistry`, `abilityPrimitives` |
| `utils/abilityPrimitives.ts` | Operações atômicas de combate compartilhadas (dano/condição/cura/…) | extraído de `arsenalPipeline` |
| `utils/abilityInterpreter.ts` | Caminha o grafo, avalia ramos, executa efeitos → `AbilityResult` | `nodeRegistry`, `abilityPrimitives` |
| `utils/abilitySimulator.ts` | Dry-run headless + montagem do relato do `trace` | `abilityInterpreter` |
| `components/arsenal/graph/GraphEditor.tsx` | Orquestra as três zonas + topo | os abaixo |
| `…/graph/NodePalette.tsx` | Paleta + templates | `nodeRegistry` |
| `…/graph/GraphCanvas.tsx` | Canvas SVG/DOM (nós, arestas, pan/zoom, drag) | `abilityGraph` |
| `…/graph/NodeInspector.tsx` | Painel de propriedades a partir do `FieldSchema` | `nodeRegistry` |
| `…/graph/SimulatorPanel.tsx` | UI do dry-run | `abilitySimulator` |
| `utils/abilityTemplates.ts` | Templates prontos (grafos pré-montados) | `abilityGraph`, `nodeRegistry` |

## Tratamento de erros

- **Grafo inválido** (ramo sem predicado, efeito sem alvo resolvível, ciclo acidental): validação
  `validateGraph(graph)` roda no salvar e no simular; erros aparecem ancorados ao nó no canvas.
  Salvar é permitido com avisos, mas o simulador marca passos não resolvíveis.
- **Interpretador** nunca lança em runtime da Cena: nó desconhecido/malformado é registrado no `trace`
  como "ignorado" e o fluxo continua (resiliência de combate).
- **Roller determinístico** injetável garante testes reproduzíveis.

## Testes

- **Unitário** por primitiva (`abilityPrimitives`) — paridade numérica com o comportamento atual do pipeline.
- **Unitário** do registro/interpretador: cada família de nó tem um teste "interpreta e produz o efeito X".
- **Ramos:** grafo com SE/SENÃO exercitando os dois caminhos com roller fixo.
- **Perfis de nível:** merge base+overrides produz o grafo esperado no nível N.
- **Simulador:** dado um grafo e um roller fixo, o `trace` bate com o esperado.
- **Integração Cena:** despacho grafo vs legado sobre o mesmo estado de ator.
- Testes de UI do editor seguem o padrão existente (`@testing-library/react`) para paleta, inspector e canvas.

## Fora de escopo (fases futuras)

- Migração de arma/selo/item para o grafo (continuam no pipeline legado, sem editor nesta fase).
- Loops / variáveis / valores computados no grafo.
- Conversão automática de habilidades antigas (descartadas de propósito).

## Ordem de entrega

1. **Núcleo testável:** `abilityGraph` + `nodeRegistry` + `abilityPrimitives` (extração do pipeline) +
   `abilityInterpreter`, com testes. Sem UI.
2. **Simulador dry-run** headless + `SimulatorPanel`.
3. **Editor em tela cheia:** canvas, paleta, inspector, templates, seletor de nível.
4. **Integração na Cena ao vivo** (despacho grafo↔legado) + **deletar `ArsenalCardEditor`** e ligar a
   lista do arsenal ao novo editor (habilidade/forma) com "migrar" para as categorias legadas.
