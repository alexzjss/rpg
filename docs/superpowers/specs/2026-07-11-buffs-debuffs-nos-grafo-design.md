# Novos nós de buff/debuff no editor de grafo

**Data:** 2026-07-11
**Branch:** feat/grimorio-v2-fase1
**Status:** aprovado

## Problema

O tipo `ArsenalEffect` (`utils/arsenal.ts`) já modela muito mais do que o editor
visual de habilidades (grafo de nós, `utils/nodes/coreNodes.ts`) permite criar. O
motor de execução (`utils/arsenalPipeline.ts`) já lê corretamente `EffectModifier`
(bônus de atributo), `DiceBonus` (bônus de dado em teste/dano/cura, filtrável por
elemento via `EffectFilter`), `elementalAffinities`, `lifeSteal`,
`periodicHealing`/`auraRestored` (regeneração) — mas o editor só expõe 2 nós de
efeito: `buff` (5 stats, sem filtro por elemento) e `aplicar_condicao` (condições
clássicas pré-definidas). Não existe forma visual de criar: bônus de dado (teste de
acerto, teste de dano, geral ou por elemento), escudo/barreira, regeneração
constante avulsa (fora das condições clássicas pré-definidas), ou remoção de
efeitos ativos (dispel).

## Objetivo

Adicionar 4 nós novos ao editor de grafo, cada um mapeando para um pedaço do
modelo `ArsenalEffect` já existente (ou, no caso de dispersar, um mecanismo novo
de remoção), reaproveitando o padrão de nó atômico já estabelecido pelos nós
`dano`/`cura`/`buff`/`aplicar_condicao`.

## Decisões (do brainstorm)

- **Escopo:** cobre exatamente a lista original do pedido (bônus de teste de
  acerto, bônus de teste de dano, geral ou por elemento específico, escudo/vida/
  aura como cura constante, remoção de efeitos) mais reação (resolvida por
  reaproveitamento, sem trabalho extra — ver seção Reação). Ficam fora desta
  rodada: `silence`, `taunt`, `incapacitate`, `invisibility`, `summon`,
  `transform`, `revive`, `resourceGeneration`, `costReduction`, `chain`,
  `randomTable`, `markVulnerable`, `damageConversion`, `echoLastEffect` — todos já
  têm campo no tipo `ArsenalEffect`, nenhum tem nó nem lógica de motor. Registrado
  como próxima rodada natural, mesmo padrão de extensão.
- **Reação:** `ReactionCandidate` (`utils/arsenalPipeline.ts`) existe como tipo mas
  não está conectado a nenhum fluxo jogável hoje (nem UI, nem grafo). Ligar reação
  ponta a ponta é um projeto à parte, fora de escopo. O nó `bonus_dado` (abaixo)
  já cobre "bônus de dado numa reação" automaticamente assim que o sistema de
  reação existir, porque qualquer carta com `testDice` passa pelo mesmo
  `rollNotationWithBonuses` — nenhuma peça extra necessária agora.
- **Abordagem dos nós:** um nó por capacidade (atômico), consistente com o padrão
  já usado pelos nós existentes — não um nó mega-genérico com seletor de
  categoria.
- **Polaridade positivo/negativo (pro nó `dispersar`):** heurística automática —
  um efeito é "negativo" se tem `classic` (condição) ou algum `EffectModifier`
  com `value < 0`; "positivo" caso contrário. Sem campo explícito novo no tipo.
- **"Defesa atual" do pedido original:** esclarecido como sinônimo de
  escudo/barreira (campo `shield`, já existente no tipo mas nunca lido pelo
  motor) — não é um novo pool de defesa regenerável.

## Arquitetura

### 1. Nó `bonus_dado` (família `efeito`, categoria `Combate`)

Campos: `target` (`'teste' | 'dano' | 'dano_extra' | 'cura'`), `bonusDice`
(dado opcional, ex. `'1d4'`), `bonusFlat` (numero), `elemento` (opcional,
`Element | null` — filtra por `EffectFilter.damageType`; `null` = vale pra
qualquer dano/teste), `rounds`.

`interpret`: monta um `ArsenalEffect` com
`diceBonuses: [{ target, bonusDice, bonusFlat, filter: elemento ? { damageType: [elemento] } : undefined }]`
e chama `applyCondition(target, effect, ctx.roller)` para cada alvo em
`ctx.scope` — mesmo padrão do nó `buff` (`coreNodes.ts:196-222`). Nenhuma
mudança de motor: `rollNotationWithBonuses` (`arsenalPipeline.ts:326-327`) já lê
`diceBonuses` corretamente.

### 2. Nó `escudo` (Combate)

Campos: `dice` (dado opcional), `flat` (numero), `rounds`.

`interpret`: monta `ArsenalEffect` com `shield: { dice, flat }` (tipo
`AmountFormula`, já existe em `arsenal.ts`) e aplica via `applyCondition`.

**Mudança de motor necessária** — `applyDamage` (`utils/abilityPrimitives.ts`,
função que hoje desconta direto de `defenseCurrent`/`currentHp`) ganha um passo
novo antes do desconto atual: soma o `shield` de todos os efeitos ativos do
alvo (por stacks, mesmo padrão de soma usado por `totalLifeSteal`), abate o
dano recebido contra esse total primeiro, e só o excedente segue pro fluxo
atual (defesa → HP). O consumo do escudo reduz/zera o efeito correspondente
(escudo é "gasta e acaba" por stack, não parcial por rodada — decisão de
implementação simples, sem persistência de "escudo restante" fracionado entre
ataques diferentes dentro do mesmo stack).

### 3. Nó `regeneracao` (Combate)

Campos: `recurso` (`'vida' | 'aura'`), `dice` (opcional), `flat`, `rounds`.

`interpret`: monta `ArsenalEffect` com `periodicHealing: { dice, flat }` (se
`recurso === 'vida'`) ou `auraRestored: { dice, flat }` (se `'aura'`) e aplica
via `applyCondition`. Nenhuma mudança de motor: `tickActiveEffects`
(`arsenalPipeline.ts:~524`) já processa ambos os campos.

### 4. Nó `dispersar` (Combate)

Campos: `categoria` (`'positivo' | 'negativo' | 'qualquer'`), `quantidade`
(numero, padrão 1).

`interpret`: não monta um `ArsenalEffect` — chama diretamente uma função nova
`removeActiveEffects(target, categoria, quantidade)` (nova, em
`utils/abilityPrimitives.ts`) para cada alvo em `ctx.scope`, e atualiza
`ctx.scope`/comita o resultado. A função:
- Classifica cada efeito ativo do alvo como positivo/negativo pela heurística
  acima.
- Filtra pelos que casam com `categoria` (`'qualquer'` = todos).
- Remove os `quantidade` mais recentes primeiro (ordenado por
  `appliedAtRound` decrescente — mais previsível que aleatório, evita RNG
  extra numa ação que já pode ter outros rolls).
- Retorna o alvo atualizado; nós de trace registram quais efeitos saíram.

## Testes

Em `utils/nodes/coreNodes.test.ts` (ou arquivo de teste equivalente já usado
pelos nós existentes):

- `bonus_dado`: aplica o efeito, resolve uma ação com `testDice`/`damage` via
  `resolveArsenalAction` e confirma que o total inclui o bônus; confirma que
  um filtro por elemento não vaza pra ações de outro elemento.
- `escudo`: dano é absorvido primeiro pelo escudo; excedente vai pra
  defesa/HP; escudo esgota corretamente após consumir o total; múltiplos
  stacks somam.
- `regeneracao`: tick de rodada aumenta vida/aura até o teto (`maxHp`/
  `maxAura`), nunca ultrapassa.
- `dispersar`: remove a quantidade certa respeitando categoria; heurística
  positivo/negativo coberta com um caso de cada lado (`classic` presente,
  `modifier` negativo, e um buff puro sem nenhum dos dois pra confirmar que
  fica de fora de "negativo"); não remove efeitos além da quantidade pedida
  quando há mais elegíveis do que o pedido.

## Fora de escopo

`silence`, `taunt`, `incapacitate`, `invisibility`, `summon`, `transform`,
`revive`, `resourceGeneration`, `costReduction`, `chain`, `randomTable`,
`markVulnerable`, `damageConversion`, `echoLastEffect` — campos já existem no
tipo `ArsenalEffect`, sem nó nem lógica de motor; ficam para uma rodada futura
seguindo o mesmo padrão de extensão usado aqui. Sistema de reação ponta-a-ponta
(`ReactionCandidate` conectado a UI/grafo).
