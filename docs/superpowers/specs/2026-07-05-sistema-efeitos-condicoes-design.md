# Sistema modular de efeitos, condições e tipos de dano

**Data:** 2026-07-05
**Branch:** feat/grimorio-v2-fase1
**Status:** aprovado

## Problema

O motor de combate (`utils/arsenalPipeline.ts`) já resolve ações via um pipeline
declarativo de 16 passos, e o modelo `ArsenalEffect` (`utils/arsenal.ts`) já cobre boa
parte do que um sistema de efeitos genérico precisa: duração, 5 regras de stacking,
modificadores por escopo, bônus de dado, afinidades elementais, dreno/roubo de vida,
espinhos e 20+ gatilhos (`TriggerEvent`). Nove condições "clássicas" já existem
(queimadura, congelamento, lentidão, molhado, eletrocutado, sangramento, fraqueza,
acelerado, desnorteado).

O que falta, comparado ao pedido original de um sistema de efeitos "DamageType →
Condition → Effect" totalmente orientado a dados:

1. Não existe associação configurável entre **tipo de dano** e **condição padrão**
   com chance baixa de aplicação ao acertar — hoje toda condição precisa ser aplicada
   explicitamente por uma carta.
2. As interações dano×condição (molhado+raio, molhado+fogo, água+queimando,
   fogo+queimando) estão hardcoded como `if`s dentro do pipeline
   (`arsenalPipeline.ts:603-614`), em vez de uma tabela extensível por dados.
3. Os filtros de efeito estão espalhados: `EffectModifier` e `DiceBonus` têm cada um
   sua própria lista de campos de filtro (`cardIds`, `categories`, `abilityTypes`,
   `element`, `tags`, arma equipada), sem um tipo único reutilizável.
4. Falta o tipo de dano `fisico` (hoje é `normal`) na lista de `DamageType` —
   `vento` já existe. Faltam 5 condições elementais (enraizado, desequilibrado,
   fraturado, iluminado, amaldiçoado) e 2 condições de controle portadas do sistema
   legado (paralisado, confuso), que hoje não existem no motor novo.
5. Não há suporte a modificadores do lado "recebido" para cura e recuperação de
   aura (só existe o lado "causado"), necessário para Amaldiçoado.

## Objetivo

Fechar essas lacunas **estendendo o sistema Arsenal já existente** (não criar uma
arquitetura paralela em inglês) para que:

- Qualquer carta/arma/item possa ter chance configurável de aplicar a condição
  elemental padrão do seu tipo de dano, com override por carta.
- Interações dano×condição sejam data-driven e extensíveis sem tocar no pipeline.
- Um `EffectFilter` único sirva para modifiers, dice bonuses e as novas peças.
- O catálogo de condições cubra as 9 associações dano→condição pedidas, mais
  Paralisado e Confuso portados do sistema legado.
- Tudo continue serializável, imutável e compatível com o pipeline determinístico
  já existente (`roller` injetado, trace completo).

## Decisões (do brainstorm)

- **Base:** estender `utils/arsenal.ts` / `utils/arsenalEffects.ts` /
  `utils/arsenalPipeline.ts` existentes, não duplicar tipos em inglês à parte.
  Nomes de campo/tipo em inglês, valores de enum e textos em português — mesma
  convenção já usada no código.
- **Escopo:** todas as 5 lacunas entram nesta rodada (chance elemental, tabela de
  interação, filtros unificados, condições novas + Paralisado/Confuso).
- **Tipos de dano:** renomear `normal` → `fisico` (`vento` já existe). Sem migração
  automática de catálogo antigo nesta fase (decisão já tomada no projeto), então o
  rename é seguro.
- **Terra:** condição padrão automática é **Enraizado** (reduz velocidade, não
  impede agir). Petrificado fica como condição manual separada, não como proc
  automático.
- **Paralisado/Confuso:** incluídos nesta rodada, com os 2 mecanismos bespoke que
  exigem (checagem de teste, ação aleatória).
- **Filtros:** migrar `EffectModifier`/`DiceBonus` para usar o `EffectFilter`
  unificado (mesma semântica, um tipo só), em vez de manter os dois formatos
  coexistindo.
- **Fora de escopo:** editor visual de efeitos na UI do Arsenal, badges de condição
  no tabuleiro (não recriar `ConditionBadges.tsx`), push/pull de posição.

## Arquitetura

### 1. Tipos (`types.ts` / `utils/arsenal.ts`)

```ts
// DamageType: renomeia 'normal'->'fisico' (vento já existe)
export type DamageType =
  | 'fisico' | 'fogo' | 'água' | 'vento' | 'terra'
  | 'raio' | 'sangue' | 'luminoso' | 'escuridão' | 'aura';

// Filtro único, reutilizado por modifiers, diceBonuses, tabela de interação
// e chance elemental
export interface EffectFilter {
  damageType?: DamageType[];
  cardIds?: string[];
  cardTags?: ArsenalTag[];
  categories?: ArsenalCategory[];
  abilityTypes?: AbilityType[];
  weaponIds?: string[];
  sourceEntityId?: string;
}
```

`EffectModifier` e `DiceBonus` passam a ter `filter?: EffectFilter` no lugar dos
campos soltos atuais — mapeamento 1:1 preservando a semântica exata de hoje:
`element`→`damageType` (vira array de 1 elemento), `tags`→`cardTags`,
`categories`/`abilityTypes`/`cardIds`/`weaponIds` mantêm o nome. Nenhuma
capacidade de filtro existente é perdida na migração.

`sourceEntityId` exige saber quem aplicou o efeito: `ActiveEffectState`
(`arsenalPipeline.ts:37-43`) ganha um campo opcional `sourceId?: string`, espelhando
o `sourceId` novo de `ActiveEffectEntry` (seção de persistência, abaixo).

`targetTags` e `weaponTags` (cogitados no brainstorm) ficam **fora desta rodada**:
exigiriam reestruturar o cálculo de `attackTotal`/`damageTotal` para rodar por-alvo
em vez de uma vez só antes do loop de alvos (`arsenalPipeline.ts:585-586`), e não
há hoje acesso ao catálogo de cartas de arma dentro de `ArsenalActorState` para
resolver tags de arma. Registrado como próximo passo natural, não bloqueia o
restante do sistema.

`EffectModifier.stat` (hoje `'ataque' | 'defesa' | 'velocidade' | 'dano' | 'cura' | 'aura'`)
ganha 2 valores novos: `'cura_recebida'` e `'aura_recebida'` (modificam cura/
recuperação de aura que o portador do efeito *recebe* de qualquer fonte — hoje só
existe o lado "causado", e mesmo esse (`'cura'`/`'aura'`) ainda não é lido em
nenhuma função do pipeline — gap pré-existente que não faz parte desta rodada).

`ClassicEffectConfig.kind` ganha 7 valores novos: `enraizado`, `desequilibrado`,
`fraturado`, `iluminado`, `amaldicoado`, `paralisado`, `confuso`.

### 2. Catálogo de condições (`utils/arsenalEffects.ts`)

| Condição | Dano associado | Chance padrão | Composição |
|---|---|---|---|
| Queimadura *(existente)* | fogo | 20% | `periodicDamage` |
| Molhado *(existente)* | água | 20% | interação (tabela abaixo) |
| Eletrificado *(rename de eletrocutado)* | raio | 15% | `periodicDamage` + `modifiers` (`velocidade`) |
| Enraizado **novo** | terra | 15% | `modifiers` (`velocidade`, multiplicar ~0.5) |
| Desequilibrado **novo** | vento | 15% | `modifiers` (`ataque`, somar, negativo) |
| Fraturado **novo** | fisico | 10% | `modifiers` (`defesa`, somar, negativo) + `elementalAffinities: [{fisico, vulnerabilidade}]` |
| Sangramento *(existente)* | sangue | 20% | `periodicDamage` no trigger `ao_atacar`/`ao_agir` |
| Iluminado **novo** | luminoso | 15% | `elementalAffinities: [{escuridão, vulnerabilidade}]` |
| Amaldiçoado **novo** | escuridão | 15% | `modifiers` (`cura_recebida`, `aura_recebida` multiplicar <1; `ataque` negativo) |
| Paralisado **novo (porte legado)** | — | manual | bespoke: checagem 1d20≥DC |
| Confuso **novo (porte legado)** | — | manual | bespoke: substitui ação declarada |

Congelamento, Lentidão, Fraqueza, Acelerado e Desnorteado continuam manuais (sem
proc elemental automático). Metadata visual (ícone/cor/descrição) das condições já
existentes é reaproveitada de `PRESET_CONDITIONS` (`types.ts`); as 7 novas ganham
entradas equivalentes.

### 3. Chance elemental (`utils/arsenalElements.ts`, novo arquivo)

```ts
export interface ElementalConditionConfig {
  damageType: DamageType;
  conditionId: string;
  chance: number; // 0..1
}

export const ELEMENTAL_CONDITION_TABLE: ElementalConditionConfig[] = [
  { damageType: 'fogo', conditionId: 'queimadura', chance: 0.20 },
  { damageType: 'água', conditionId: 'molhado', chance: 0.20 },
  { damageType: 'raio', conditionId: 'eletrificado', chance: 0.15 },
  { damageType: 'vento', conditionId: 'desequilibrado', chance: 0.15 },
  { damageType: 'terra', conditionId: 'enraizado', chance: 0.15 },
  { damageType: 'fisico', conditionId: 'fraturado', chance: 0.10 },
  { damageType: 'sangue', conditionId: 'sangramento', chance: 0.20 },
  { damageType: 'luminoso', conditionId: 'iluminado', chance: 0.15 },
  { damageType: 'escuridão', conditionId: 'amaldicoado', chance: 0.15 },
  // 'aura' sem condição padrão
];
```

`ArsenalCard` ganha 2 campos opcionais: `elementalConditionChance?: number`
(sobrescreve a chance da tabela para essa carta) e `applyElementalCondition?:
boolean` (`false` desativa o proc). O roll acontece no step `aplicar_efeitos` do
pipeline, depois do dano já ter sido aplicado.

### 4. Tabela de interação (`utils/arsenalElements.ts`)

```ts
export interface DamageConditionInteraction {
  id: string;
  incomingDamageType: DamageType;
  targetConditionId: string;
  effect: 'amplify' | 'reduce' | 'consume';
  multiplier?: number;
  removesCondition?: boolean;
}
```

Os 4 casos hoje hardcoded em `arsenalPipeline.ts:603-614` (molhado+raio amplifica,
molhado+fogo reduz e consome, água+queimadura consome, fogo+queimadura interage)
migram para essa tabela preservando os mesmos valores numéricos — o pipeline passa
a fazer lookup em vez de `if`s, e casos futuros (ex.: terra apaga eletrificado)
entram só como dado novo.

### 5. Paralisado e Confuso — únicos com código novo no pipeline

- **Paralisado**: no step `verificar_condicoes`, se o ator tem a condição ativa,
  rola 1d20 (via `roller` injetado) contra `testDC` (padrão 10); falha bloqueia a
  ação, reaproveitando o padrão de `consumePrincipalBlock` já usado por Desnorteado.
- **Confuso**: no step `declarar_acao`, com a condição ativa, há chance
  configurável (padrão 25%, campo `chance` no `ClassicEffectConfig` do efeito) de a
  carta usada ser trocada por uma ação válida aleatória entre as disponíveis do
  ator — registrado no trace do pipeline para aparecer no log.

### 6. Persistência

`Character.activeEffects` ganha 3 campos opcionais (compatível com saves
existentes, sem migração de schema):

```ts
export interface ActiveEffectEntry {
  effect: ArsenalEffect;
  stacks: number;
  remaining?: number;
  sourceId?: string;
  appliedAtRound?: number;
  metadata?: Record<string, unknown>;
}
```

### 7. Utilitários

Mantém os nomes já usados no código em vez de renomear para inglês
(`stackEffect`, `applyActiveEffect`, `tickActiveEffects`,
`advanceTurnEndEffects`). Novidades:

- `removeActiveEffect(actor, effectId)` / `cleanseByTag(actor, tag)` — remoção
  manual/por tag (hoje só existe expiração por duração).
- `getActiveEffects(actor)` / `hasCondition(actor, conditionId)` — helpers
  triviais de leitura.
- `matchesEffectFilter(context, filter)` — função pura central que resolve o
  `EffectFilter` unificado contra um `EffectContext` (source/target/card/
  weapon/damageType/testType).
- `rollElementalConditionChance(damageType, card, roller)` — em
  `utils/arsenalElements.ts`.

## Testes

Em `utils/arsenalElements.test.ts` (novo) + extensões em `utils/arsenal.test.ts`:

- Chance elemental: roll determinístico aplica/não aplica a condição conforme
  range; override por carta e desativação (`applyElementalCondition: false`)
  funcionam.
- Tabela de interação: os 4 casos existentes preservam os multiplicadores atuais
  (regressão); um caso novo hipotético confirma que a tabela é consultada por
  dado.
- Stacking das 7 condições novas respeita seu `stackBehavior`.
- Paralisado: roll baixo bloqueia ação, roll alto permite (roller fixo).
- Confuso: roller fixo força substituição de ação, aparece no trace.
- `curaRecebida`/`auraRecebida`: Amaldiçoado reduz cura e recuperação de aura
  recebidas de outra fonte.
- `EffectFilter` unificado: regressão garantindo que modifiers/diceBonuses
  existentes continuam filtrando igual após a migração dos campos soltos.

## Fora de escopo

Editor visual de efeitos na UI do Arsenal, badges de condição no tabuleiro
(`ConditionBadges.tsx` não é recriado agora), push/pull de posição (mencionados no
pedido original, mas sem suporte de posicionamento no pipeline ainda).
