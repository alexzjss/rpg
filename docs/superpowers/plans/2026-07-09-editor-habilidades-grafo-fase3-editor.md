# Editor de Habilidades em Grafo — Fase 3 (Editor em tela cheia) — Plano

> **For agentic workers:** Execução inline nesta sessão (sem subagentes, sem commits). Formato enxuto (mesma convenção da Fase 2): arquivos, contratos e comportamento exato definidos aqui; código completo escrito durante a execução, cada tarefa termina com testes verdes.

**Goal:** Construir o editor visual em tela cheia do grafo de habilidades — canvas próprio (SVG/DOM, sem lib nova), paleta de nós + templates, inspector de propriedades gerado do `FieldSchema`, painel de simulador, cabeçalho da ficha com seletor de nível. Ainda **não** ligado à lista do arsenal nem à Cena (Fase 4).

**Base:** Fases 1-2 entregues — `nodeRegistry` com 31 tipos de nó registrados via `ensureNodesRegistered()`, `abilityInterpreter`/`abilitySimulator` funcionais, `abilityTemplates` com 5 templates.

**Convenção visual:** seguir o padrão inline `style={{...}}` já usado em `components/arsenal/ArsenalCardEditor.tsx` (sem CSS framework) — reaproveitar as mesmas constantes de estilo (`field`, `label`, `grid`) copiando o padrão, não importando do arquivo antigo (que será deletado na Fase 4).

---

## Camada de lógica pura (testável sem React)

**Task 1 — `utils/abilityGraphEdit.ts`** (+ `.test.ts`): funções puras que retornam um novo `AbilityGraph`:
- `addNode(graph, parentId, type, branch?)` → cria nó com `defaults()` do `nodeRegistry`, aresta `parentId→novoId` (com `branch` se o pai for `ramo`), retorna `{ graph, nodeId }`.
- `removeNode(graph, nodeId)` → remove o nó e **recursivamente sua subárvore** (nós só alcançáveis a partir dele), mais as arestas tocadas. Não remove se `nodeId` for uma raiz-gatilho (no-op).
- `updateNodeProps(graph, nodeId, patch)` → mescla `patch` em `node.props`.
- `moveNode(graph, nodeId, position)` → atualiza `node.position`.
- `setLevelOverride(graph, level, nodeId, field, value)` → cria/atualiza a entrada em `levelProfiles`.

**Task 2 — `utils/graphLayout.ts`** (+ `.test.ts`): `layoutGraph(graph): Map<nodeId, {x,y}>` — BFS a partir de cada raiz-gatilho; profundidade define `y` (120px por nível), ordem de visita entre irmãos define `x` (180px por posição), usando `node.position` quando já definido (não sobrescreve). `edgePath(from: {x,y}, to: {x,y}): string` — gera `d` de uma curva SVG simples entre dois pontos.

---

## Componentes (React, `components/arsenal/graph/`)

**Task 3 — `NodePalette.tsx`** (+ `.test.tsx`): lista `listNodeTypes()` (exceto família `gatilho`) agrupados por família com busca por texto; se `pendingConnection` (prop) estiver setado, cada item é clicável e dispara `onPick(type)`; caso contrário itens ficam desabilitados com dica "selecione um '+' no canvas". Seção "Templates" no topo lista `listAbilityTemplates()`; clicar dispara `onLoadTemplate(id)`.

**Task 4 — `NodeInspector.tsx`** (+ `.test.tsx`): dado um `GraphNode` selecionado, busca `getNodeType(node.type)` e renderiza um input por `FieldSchema` (`numero`→`<input type=number>`, `texto`→`<input>`, `toggle`→checkbox, `select`→`<select>` com `options`, `dado`→input texto com placeholder de notação, `elemento`→select fixo com a lista de elementos do jogo, `condicao`/`duracao`→`<textarea>` editando o valor como JSON — simplificação documentada; um construtor visual de predicados fica para uma fase futura). Mudança em qualquer campo chama `onChange(nodeId, { [field]: valorParseado })`. Botão "Remover nó" (oculto para nós de família `gatilho`) chama `onRemove(nodeId)`.

**Task 5 — `GraphCanvas.tsx`** (+ `.test.tsx`): recebe `graph`, `selectedNodeId`, `onSelect`, `onMove`, `onRequestConnect(parentId, branch?)`. Usa `layoutGraph` para posicionar; renderiza um `<svg>` com uma `<path>` por aresta (`edgePath`) e nós como `<div>` posicionados em absoluto sobre o mesmo container (não dentro do SVG, para simplificar texto/eventos). Cada nó mostra `family` (cor de borda por família), `getNodeType(node.type)!.summarize(node.props)`. Clique seleciona; arrastar (pointerdown+pointermove) chama `onMove(nodeId, novaPos)`; nó não-ramo tem um botão "+" abaixo chamando `onRequestConnect(nodeId)`; nó `ramo` tem dois botões "+ SE" / "+ SENÃO" chamando `onRequestConnect(nodeId, 'entao'|'senao')`. Pan (arrastar o fundo) e zoom (roda do mouse, `transform: scale()`) no container.

**Task 6 — `SimulatorPanel.tsx`** (+ `.test.tsx`): botão "Simular" chama `simulateAbility(graph, level)` (roller real) e renderiza `describeTrace(result.trace)` como lista numerada, mais um resumo de HP/aura antes→depois do alvo fictício.

**Task 7 — `GraphEditor.tsx`** (+ `.test.tsx`): orquestra estado (`graph`, `selectedNodeId`, `level`, `pendingConnection`, aba direita `'propriedades'|'simulador'`). Topo: campos do `AbilityHeader` (nome, descrição, ícone via `ImagePickerButton` existente, elemento, tags, ativação, custo de aura/munição, economia de ação, tipo de alvo, cooldown) + seletor de nível (stepper 1..N, N = `Math.max(1, ...levelProfiles.map(p=>p.level))+1`) + botões Simular/Salvar/Fechar. Corpo: `NodePalette` (esquerda) · `GraphCanvas` (centro) · aba `NodeInspector`/`SimulatorPanel` (direita). `onLoadTemplate` substitui `graph` mantendo `header.name` atual. Editar em nível N>1: mudanças de campo em nós existentes viram `setLevelOverride` em vez de mutar o nó base diretamente (canvas sempre mostra `mergeLevel(graph, level)` para renderizar, mas as arestas/estrutura mostradas seguem o grafo mesclado — adicionar nó em nível N>1 marca `enabledFromLevel: N` no nó novo). Props: `initial: AbilityGraph`, `onSave(graph)`, `onClose()`.

---

## Verificação em navegador

**Task 8:** montar um harness de demonstração acessível via `index.tsx` com `?view=graph-editor-demo` (mesmo padrão já usado para `player`/`gm-dashboard`), renderizando `GraphEditor` com um template carregado, sem persistência real (apenas `console.log` no `onSave`). Usar os `preview_*` tools para: abrir a URL, tirar snapshot/screenshot, selecionar um nó, editar um campo no inspector, clicar "+" e adicionar um nó pela paleta, trocar para a aba Simulador e rodar, verificar que nada quebra no console. Este harness fica no código (é inofensivo e será substituído pela integração real na Fase 4) ou é removido ao final — decidir após ver o resultado.

---

## Self-review

- **Cobertura:** canvas próprio (Task 5), paleta+templates (Task 3), inspector gerado do schema (Task 4), simulador (Task 6), cabeçalho+nível (Task 7) — todos os itens do roadmap da Fase 3. Verificação em navegador real (Task 8), conforme instrução do sistema para mudanças de UI.
- **Simplificação documentada:** campos `condicao`/`duracao` do inspector usam JSON bruto nesta fase (construtor visual de predicados é polimento futuro, não bloqueia a Fase 4).
- **Consistência:** `GraphCanvas`/`NodeInspector`/`NodePalette` dependem só de `nodeRegistry` (Fase 1-2) e `abilityGraphEdit`/`graphLayout` (Task 1-2) — nenhuma dependência nova, nenhum import do editor antigo.
