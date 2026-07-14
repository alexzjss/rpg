# Simplificação da paleta do grafo (rumo a JRPG) — Design

**Data:** 2026-07-10
**Relacionado:** [[project-grimorio-unificado-combate-v2]] — reformula parte da paleta entregue nas Fases 1-5 do editor de habilidades em grafo.

## Problema

A paleta de nós cresceu para ~30 tipos (Fases 1-2) cobrindo quase todo o antigo `ArsenalEffect`. Na prática isso ficou "de planilha" — muita coisa nunca usada em um JRPG comum, condição do "SE" exige escrever JSON à mão, o conceito de "proteção" é um toggle escondido no cabeçalho em vez de algo visível no grafo, "Forma" tem um formulário próprio paralelo ao resto do sistema, e os campos "Ativação"/"Economia" do cabeçalho não são lidos por nenhuma lógica do motor — são vestigiais.

## Decisões (aprovadas no brainstorm)

### 1. Paleta enxuta — 10 efeitos

**Ficam:** Dano, Cura, Aplicar Condição (as 16 condições clássicas continuam num nó só), Buff/Debuff (unificado — ver abaixo), Escudo, Espinhos, Roubo de Vida, Silenciar, Incapacitar, Mover.

**Saem do registro** (deletados, não apenas ocultos): Modificador de estat (absorvido pelo Buff unificado), Bônus de rolagem, Gerar recurso, Reduzir custo, Efeito periódico, Afinidade elemental, Imunidade, Provocar, Invisibilidade, Dispel, Conversão de dano, Marcar vulnerável, Corrente, Invocar, Transformar, Reviver, Tabela aleatória, Eco.

**Buff/Debuff unificado:** substitui `buff` (Fase 1) e `modificador_estat` (Fase 2) por um único nó: `stat` (ataque/defesa/velocidade/**vida_maxima**/**aura_maxima**), `operation` (somar/multiplicar/definir), `value`, `rounds`. As duas stats novas (`vida_maxima`/`aura_maxima`) são a base do bloco de Forma (seção 4).

### 2. Gatilhos como blocos escolhíveis na paleta

A paleta passa a incluir a família `gatilho` (hoje excluída). Dois tipos:
- **"Quando usada"** (`ao_ativar`) — o padrão atual, ativação manual.
- **"Quando alvejado"** (`ao_ser_alvejado`, novo) — dispara quando o portador é escolhido como alvo de uma carta/habilidade. É assim que "proteção" deixa de ser o toggle `header.reactionTag` e vira um bloco de verdade.

Uma habilidade sempre tem exatamente uma raiz. Clicar num gatilho na paleta **substitui** a raiz atual (troca o `type` do nó raiz existente, preservando id/arestas dos filhos) — mesma mecânica de qualquer outro bloco da paleta, sem seletor separado.

O interpretador (`interpretAbility`) já é agnóstico ao tipo de gatilho (só procura `family==='gatilho'`), então **nenhuma mudança no motor de execução é necessária** para o novo tipo em si. O que muda é onde/como a Cena decide **quando convidar o jogador a usar essa habilidade como reação**: `protectionAbilityGraphsFor` passa a filtrar por `root.type==='ao_ser_alvejado'` em vez de `header.reactionTag==='protecao'`.

### 3. Blocos prontos para "SE"

O nó genérico `ramo` (predicado em JSON livre) é removido e substituído por 4 nós típados, cada um com campos próprios (sem JSON):
- **Vida do alvo** — comparação (abaixo/acima) + percentual.
- **Alvo tem condição ativa** — select com as 16 condições clássicas.
- **Aura mínima do usuário** — quantidade.
- **Chance aleatória** — percentual (0-100).

Cada um é um nó de família `ramo` com sua própria função `evaluate`, registrado separadamente (mesmo padrão dos outros nós). O `NodeInspector` não precisa de tratamento especial — os campos são `numero`/`select` normais, cobertos pelo schema genérico já existente.

### 4. Forma vira composição, não campo de cabeçalho

`AbilityHeader.forma` é removido. Uma "forma" é modelada como: gatilho "Quando usada" → nó **Buff** (stat `vida_maxima`/`aura_maxima`, operação `somar`, duração longa/permanente) → dois nós novos:
- **Cor do token** (`cor_token`) — define a cor do anel/borda do personagem enquanto a habilidade está ativa.
- **Ícone do token** (`icone_token`) — troca o retrato exibido.

**Detecção na Cena:** uma habilidade "é uma forma" se seu grafo mesclado contém algum nó `cor_token` ou `icone_token` alcançável a partir da raiz. `activatableGraphForms`/`activateAbilityGraphFormaFor`/`formaStates` passam a extrair `color`/`iconOverride` desses nós e `hpBonus`/`auraBonus` somando os nós Buff com stat `vida_maxima`/`aura_maxima` (em vez de ler `graph.header.forma`). A contabilidade de ativar/reverter (`cena.encounter.activeFormas`, bônus aplicado/revertido) **não muda** — só a fonte dos números.

### 5. Cabeçalho: remoção e clareza

- `AbilityHeader.activation` e `AbilityHeader.actionEconomy` são **removidos do tipo** (não só da UI) — levantamento confirmou que nenhuma lógica do motor ou da Cena os lê hoje; não há necessidade de compatibilidade retroativa (projeto já opera sem migração automática, decisão registrada na Fase 1).
- Campos de custo no `GraphEditor` passam a rotular **"Custo de Aura (de quem usa)"** / **"Custo de Munição (de quem usa)"**, deixando explícito que é o gasto de quem ativa a habilidade, não algo infligido ao alvo.

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `utils/nodes/coreNodes.ts` | Ganha `ao_ser_alvejado` (gatilho), Buff unificado (stat `vida_maxima`/`aura_maxima`); perde o `ramo` genérico |
| `utils/nodes/statModifierNodes.ts` | **Deletado** (buff unificado absorvido em coreNodes; bônus de rolagem removido) |
| `utils/nodes/resourceNodes.ts` | **Deletado** |
| `utils/nodes/fieldNodes.ts` | **Deletado** |
| `utils/nodes/specialNodes.ts` | **Deletado** |
| `utils/nodes/defenseNodes.ts` | Mantém escudo/roubo_vida/espinhos; remove afinidade_elemental/imunidade |
| `utils/nodes/controlNodes.ts` | Mantém silenciar/incapacitar/mover; remove provocar/invisibilidade |
| `utils/nodes/conditionNodes.ts` (novo) | 4 nós de `ramo` pré-montados |
| `utils/nodes/formaNodes.ts` (novo) | `cor_token`, `icone_token` |
| `utils/nodes/index.ts` | Atualiza `ensureNodesRegistered` para a lista final |
| `utils/abilityGraph.ts` | Remove `activation`/`actionEconomy` do `AbilityHeader`; remove `forma`/`reactionTag` (substituídos por detecção estrutural) |
| `utils/abilityGraphEdit.ts` | Nova função `setRootTrigger(graph, type)` — substitui o tipo do nó raiz existente |
| `utils/abilityGraphAction.ts` | `activatableGraphForms` passa a introspectar nós em vez de `header.forma` |
| `tabs/CenaTab.tsx` | `protectionAbilityGraphsFor` filtra por `root.type==='ao_ser_alvejado'`; `activateAbilityGraphFormaFor`/`formaStates` leem cor/ícone/bônus dos nós |
| `components/arsenal/graph/NodePalette.tsx` | Inclui família `gatilho`; clique em gatilho chama `setRootTrigger` em vez de `onPick` normal quando aplicável |
| `components/arsenal/graph/GraphEditor.tsx` | Remove selects de Ativação/Economia e o bloco "É uma Forma"/"Oferece como proteção"; reescreve rótulos de custo |
| `utils/abilityTemplates.ts` | Templates existentes revisados para usar só os 10 efeitos finais; template "Forma" novo usando os blocos de Cor/Ícone |
| Todos os `*.test.ts`/`*.test.tsx` dos arquivos acima | Atualizados/removidos junto com o código que testam |

## Fora de escopo

- Migração automática de habilidades já criadas com os nós removidos (o projeto já opera sem migração — quem tiver criado algo com um nó removido precisa recriar).
- Mudanças em arma/selo/item (sistema legado, intocado).
- Combos e preparação com duração (Fase 5) — inalterados por este spec.

## Testes

- Remover/atualizar os testes dos arquivos deletados.
- Novos testes para: os 4 nós de `ramo` pré-montados, `cor_token`/`icone_token`, `ao_ser_alvejado`, Buff unificado com stat `vida_maxima`/`aura_maxima`, `setRootTrigger`, detecção estrutural de forma/proteção em `abilityGraphAction.ts`/`CenaTab.tsx`.
- Rodar a suíte completa a cada etapa — mesmo padrão de verificação incremental das fases anteriores.
