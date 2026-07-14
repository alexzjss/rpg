# Sistema de Efeitos, Condições e Tipos de Dano — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estender o sistema Arsenal existente (`utils/arsenal.ts` / `arsenalEffects.ts` / `arsenalPipeline.ts`) com chance elemental configurável, tabela de interação dano×condição orientada a dados, filtro de efeito unificado, e as condições/mecânicas que faltam (Enraizado, Desequilibrado, Fraturado, Iluminado, Amaldiçoado, Paralisado, Confuso), sem tocar no sistema "combate-v2" morto (`utils/resolve.ts`/`grimoire.ts`/`elements.ts`) além do mínimo necessário para manter o build tipando.

**Architecture:** Motor puro e determinístico já existe (`resolveArsenalAction`, 16 passos). Este plano adiciona dados (tabelas) e pequenos hooks nos passos já existentes (`verificar_condicoes`, `declarar_acao`, `calcular_dano_cura`, `aplicar_efeitos`) — nenhum passo novo, nenhuma nova assinatura pública além dos campos opcionais descritos.

**Tech Stack:** TypeScript, Vitest.

**Spec:** [`docs/superpowers/specs/2026-07-05-sistema-efeitos-condicoes-design.md`](../specs/2026-07-05-sistema-efeitos-condicoes-design.md)

**Nota de escopo (achado durante o planning):** cinco das sete condições novas
(Enraizado, Desequilibrado, Fraturado, Iluminado, Amaldiçoado — todas exceto
Paralisado/Confuso) **não precisam de código novo no pipeline**: usam campos
genéricos que já existem e já são lidos (`attackModifier`, `defenseModifier`,
`speedModifier`, `elementalAffinities`). Só ganham um `classic.kind` para poder
ser alvo de `immunities` no futuro — o valor não é lido por nenhum switch do
pipeline. Só Amaldiçoado precisa de um mecanismo genuinamente novo
(`cura_recebida`/`aura_recebida`), e só Paralisado/Confuso precisam de lógica
bespoke real. Isso reduz o risco de regressão: a maior parte do catálogo é dado
puro sobre uma engine que não muda.

---

### Task 1: Renomear `DamageType` `'normal'` → `'fisico'`

**Files:**
- Modify: `types.ts:5`
- Modify: `utils/theme.ts:109`
- Modify: `components/arsenal/ArsenalCardEditor.tsx:61,101`
- Modify: `components/combat/CardDetailOverlay.tsx:86`
- Modify: `App.tsx:635,670,671,672,1059,1378,1558,1695,1766,2164`
- Modify (só o literal, sem tocar lógica): `utils/resolve.test.ts` (4 ocorrências), `utils/grimoire.test.ts` (1), `utils/elements.test.ts` (1) — necessário porque esses arquivos importam o `Element`/`DamageType` global e `'normal'` deixa de tipar.
- Test: `utils/arsenal.test.ts` (nenhuma referência a `'normal'` hoje — confirmar após a Task 8 que nada quebrou)

- [ ] **Step 1: Renomear no tipo canônico**

Em `types.ts:5`:
```ts
export type DamageType = 'fisico' | 'fogo' | 'raio' | 'água' | 'terra' | 'vento' | 'escuridão' | 'luminoso' | 'sangue' | 'aura';
```

- [ ] **Step 2: Atualizar a lista única de UI**

Em `utils/theme.ts:109`:
```ts
  { value: 'fisico',    label: 'Físico',    color: '#94a3b8', emoji: '⚔️' },
```

- [ ] **Step 3: Atualizar os demais literais `'normal'`**

Rodar, a partir da raiz do projeto:
```bash
grep -rln "'normal'" components/arsenal/ArsenalCardEditor.tsx components/combat/CardDetailOverlay.tsx App.tsx utils/resolve.test.ts utils/grimoire.test.ts utils/elements.test.ts
```
Substituir cada ocorrência de `'normal'` por `'fisico'` nesses 6 arquivos (são todas comparações/defaults de `DamageType`, sem outro sentido semântico — conferir cada ocorrência com o grep acima antes de editar, para não pegar outros usos da palavra "normal" fora de contexto, ex.: `fontStyle: isDmg ? 'italic' : 'normal'` em `components/combat/grid/StatPopups.tsx:35` **não é** `DamageType` e **não deve** ser alterado).

- [ ] **Step 4: Rodar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `'normal'` não ser mais um `DamageType` válido.

- [ ] **Step 5: Rodar suíte completa**

Run: `npx vitest run`
Expected: PASS (nenhum teste dependia do valor literal `'normal'` em asserções, só em construção de dados).

- [ ] **Step 6: Commit**

```bash
git add types.ts utils/theme.ts components/arsenal/ArsenalCardEditor.tsx components/combat/CardDetailOverlay.tsx App.tsx utils/resolve.test.ts utils/grimoire.test.ts utils/elements.test.ts
git commit -m "refactor(arsenal): renomeia DamageType 'normal' para 'fisico'"
```

---

### Task 2: `EffectFilter` unificado

**Files:**
- Modify: `utils/arsenal.ts` (tipos `EffectModifier`, `DiceBonus`, novo `EffectFilter`)
- Modify: `utils/arsenalPipeline.ts` (`matchesModifierScope`, `matchesDiceScope`)
- Modify: `utils/arsenal.test.ts:289-298,300-313,315-330,386-395`

- [ ] **Step 1: Adicionar `EffectFilter` e migrar os dois tipos que filtram**

Em `utils/arsenal.ts`, logo antes de `export interface EffectModifier` (linha 130):
```ts
export interface EffectFilter {
  damageType?: Element[];
  cardIds?: string[];
  cardTags?: ArsenalTag[];
  categories?: ArsenalCategory[];
  abilityTypes?: AbilityType[];
  weaponIds?: string[];
  sourceEntityId?: string;
}
```

Substituir `EffectModifier` (linhas 130-139) por:
```ts
export interface EffectModifier {
  stat: 'ataque' | 'defesa' | 'velocidade' | 'dano' | 'cura' | 'aura' | 'cura_recebida' | 'aura_recebida';
  operation: 'somar' | 'multiplicar' | 'definir';
  value: number;
  filter?: EffectFilter;
}
```

Substituir os campos de filtro soltos em `DiceBonus` (linhas 157-168) por:
```ts
  filter?: EffectFilter;
```
(remove `cardIds`, `categories`, `abilityTypes`, `element`, `tags`, `weaponIds` — todos migram para dentro de `filter`).

- [ ] **Step 2: Atualizar `matchesModifierScope`/`matchesDiceScope` no pipeline**

Em `utils/arsenalPipeline.ts`, substituir `matchesModifierScope` (linhas 210-214) e `matchesDiceScope` (linhas 258-266) por uma função só, compartilhada:
```ts
import type { EffectFilter } from './arsenal';
// ...
function matchesEffectFilter(filter: EffectFilter | undefined, card: ArsenalCard, actor: ArsenalActorState, sourceId?: string): boolean {
  if (!filter) return true;
  if (filter.damageType?.length && (!card.element || !filter.damageType.includes(card.element))) return false;
  if (filter.cardIds?.length && !filter.cardIds.includes(card.id)) return false;
  if (filter.cardTags?.length && !filter.cardTags.some(tag => hasAllTags(card.tags, [tag]))) return false;
  if (filter.categories?.length && !filter.categories.includes(card.category)) return false;
  if (filter.abilityTypes?.length && (!card.abilityType || !filter.abilityTypes.includes(card.abilityType))) return false;
  if (filter.weaponIds?.length && !filter.weaponIds.some(id => actor.equippedWeaponIds.includes(id))) return false;
  if (filter.sourceEntityId && filter.sourceEntityId !== sourceId) return false;
  return true;
}
```
Atualizar os 3 call sites que usavam `matchesModifierScope(modifier, card, actor)` (dentro de `modifierTotal`, `modifierMultiplier`, `modifierOverride`, linhas ~222, 233, 245) para `matchesEffectFilter(modifier.filter, card, actor, active.sourceId)`, e o call site de `matchesDiceScope(bonus, card, actor)` (dentro de `activeDiceBonuses`, linha ~272) para `matchesEffectFilter(bonus.filter, card, actor, active.sourceId)`.

`active.sourceId` ainda não existe em `ActiveEffectState` — é adicionado na Task 10; até lá, passar `undefined` explicitamente (`matchesEffectFilter(modifier.filter, card, actor, undefined)`) para o código compilar; a Task 10 troca esse `undefined` por `active.sourceId`.

- [ ] **Step 3: Atualizar os testes existentes que usavam os campos antigos**

Em `utils/arsenal.test.ts`:
- Linha 290: `{ stat: 'dano', operation: 'somar', value: 5, element: 'fogo' }` → `{ stat: 'dano', operation: 'somar', value: 5, filter: { damageType: ['fogo'] } }`
- Linha 387-389: 
```ts
    const scoped = effect({ diceBonuses: [{
      target: 'teste', bonusFlat: 5, filter: { cardIds: ['guard'], categories: ['habilidade'], abilityTypes: ['protecao'] },
    }] });
```

- [ ] **Step 4: Rodar os testes afetados**

Run: `npx vitest run utils/arsenal.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add utils/arsenal.ts utils/arsenalPipeline.ts utils/arsenal.test.ts
git commit -m "refactor(arsenal): unifica filtros de EffectModifier/DiceBonus em EffectFilter"
```

---

### Task 3: Novos `ClassicEffectKind` e `stat` de modifier

**Files:**
- Modify: `utils/arsenal.ts` (`ClassicEffectKind`, `ClassicEffectConfig`)

- [ ] **Step 1: Estender `ClassicEffectKind`**

Em `utils/arsenal.ts:181-183`:
```ts
export type ClassicEffectKind =
  | 'queimadura' | 'congelamento' | 'lentidao' | 'molhado' | 'eletrocutado'
  | 'sangramento' | 'fraqueza' | 'acelerado' | 'desnorteado'
  | 'enraizado' | 'desequilibrado' | 'fraturado' | 'iluminado' | 'amaldicoado'
  | 'paralisado' | 'confuso';
```

- [ ] **Step 2: Estender `ClassicEffectConfig`**

Em `utils/arsenal.ts:185-192`, adicionar ao union:
```ts
  | { kind: 'enraizado' | 'desequilibrado' | 'fraturado' | 'iluminado' | 'amaldicoado'; value: number }
  | { kind: 'paralisado'; value: number } // DC do teste 1d20 (valor mínimo aceito)
  | { kind: 'confuso'; value: number } // chance (0-1) de a ação ser cancelada
```

- [ ] **Step 3: Rodar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros (nenhum código lê esses kinds ainda, é só o tipo).

- [ ] **Step 4: Commit**

```bash
git add utils/arsenal.ts
git commit -m "feat(arsenal): adiciona 7 novos ClassicEffectKind (elementais + paralisado/confuso)"
```

---

### Task 4: `cura_recebida`/`aura_recebida` — Amaldiçoado

**Files:**
- Modify: `utils/arsenalPipeline.ts:598-620` (aplicação de cura/recuperação de aura em `resolveArsenalAction`)
- Test: `utils/arsenal.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Adicionar em `utils/arsenal.test.ts`, dentro de `describe('capacidades expandidas de efeitos', ...)`:
```ts
  it('Amaldiçoado reduz cura e recuperação de aura recebidas', () => {
    const cursed = effect({
      modifiers: [
        { stat: 'cura_recebida', operation: 'multiplicar', value: -50 },
        { stat: 'aura_recebida', operation: 'multiplicar', value: -50 },
      ],
    });
    const card = createArsenalCard({ id: 'heal', name: 'Cura', category: 'habilidade', healing: { flat: 10 }, auraRestored: { flat: 4 } });
    const target = actor({ id: 't', teamId: 'b', currentHp: 10, maxHp: 30, currentAura: 0, maxAura: 10, effects: applyActiveEffect([], cursed) });
    const result = resolveArsenalAction({ card, actor: actor(), targets: [target] });
    expect(result.targets[0].currentHp).toBe(15); // 10 de cura x 0.5 = 5
    expect(result.targets[0].currentAura).toBe(2); // 4 de aura x 0.5 = 2
  });
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run utils/arsenal.test.ts -t "Amaldiçoado"`
Expected: FAIL (hoje `currentHp` seria 20 e `currentAura` seria 4 — sem redução).

- [ ] **Step 3: Implementar a leitura do modificador "recebido"**

Em `utils/arsenalPipeline.ts`, adicionar uma função ao lado de `modifierTotal`/`modifierMultiplier` (perto da linha 240):
```ts
/** Multiplicador de cura/recuperação de aura RECEBIDA pelo portador (ex.: Amaldiçoado). Diferente de modifierMultiplier: aqui 'value' é um percentual de redução/aumento direto (-50 = metade), não um bônus composto por stack. */
function receivedMultiplier(actor: ArsenalActorState, stat: 'cura_recebida' | 'aura_recebida'): number {
  let multiplier = 1;
  for (const active of actor.effects) {
    for (const modifier of active.effect.modifiers) {
      if (modifier.stat === stat && modifier.operation === 'multiplicar') {
        multiplier *= (1 + modifier.value / 100) ** active.stacks;
      }
    }
  }
  return Math.max(0, multiplier);
}
```

- [ ] **Step 4: Aplicar no cálculo de dano/cura**

Em `utils/arsenalPipeline.ts`, dentro do loop `for (const target of targets)` do passo `calcular_dano_cura` (linhas 600-620), trocar:
```ts
    target.currentHp = Math.max(0, Math.min(target.maxHp, target.currentHp - targetDamage + rolledHealing + absorbedHealing));
    target.currentAura = Math.max(0, Math.min(target.maxAura, target.currentAura + auraRestored));
```
por:
```ts
    const receivedHealing = Math.floor((rolledHealing + absorbedHealing) * receivedMultiplier(target, 'cura_recebida'));
    const receivedAura = Math.floor(auraRestored * receivedMultiplier(target, 'aura_recebida'));
    target.currentHp = Math.max(0, Math.min(target.maxHp, target.currentHp - targetDamage + receivedHealing));
    target.currentAura = Math.max(0, Math.min(target.maxAura, target.currentAura + receivedAura));
```

- [ ] **Step 5: Rodar o teste**

Run: `npx vitest run utils/arsenal.test.ts -t "Amaldiçoado"`
Expected: PASS

- [ ] **Step 6: Rodar a suíte completa**

Run: `npx vitest run`
Expected: PASS (nenhum outro teste usa cura/aura restaurada com efeitos ativos, então o comportamento default — sem modifiers — continua idêntico: `receivedMultiplier` retorna 1 quando não há modifiers do stat).

- [ ] **Step 7: Commit**

```bash
git add utils/arsenalPipeline.ts utils/arsenal.test.ts
git commit -m "feat(arsenal): modificadores cura_recebida/aura_recebida (necessários para Amaldiçoado)"
```

---

### Task 5: Cinco condições elementais novas (dado puro, sem lógica nova)

**Files:**
- Modify: `utils/arsenalEffects.ts`
- Modify: `utils/arsenal.test.ts:26-31`

- [ ] **Step 1: Atualizar o teste de contagem/nomes**

Em `utils/arsenal.test.ts:26-31`, trocar:
```ts
  it('oferece somente os nove efeitos clássicos configuráveis', () => {
    expect(PREDEFINED_ARSENAL_EFFECTS).toHaveLength(9);
    expect(PREDEFINED_ARSENAL_EFFECTS.map(effect => effect.name)).toEqual([
      'Queimadura','Congelamento','Lentidão','Molhado','Eletrocutado','Sangramento','Fraqueza','Acelerado','Desnorteado',
    ]);
  });
```
por:
```ts
  it('oferece os catorze efeitos clássicos configuráveis', () => {
    expect(PREDEFINED_ARSENAL_EFFECTS).toHaveLength(14);
    expect(PREDEFINED_ARSENAL_EFFECTS.map(effect => effect.name)).toEqual([
      'Queimadura','Congelamento','Lentidão','Molhado','Eletrocutado','Sangramento','Fraqueza','Acelerado','Desnorteado',
      'Enraizado','Desequilibrado','Fraturado','Iluminado','Amaldiçoado',
    ]);
  });
```
(Paralisado e Confuso entram na Task 6/7, que têm mecânica própria — ficam de fora deste seed inicial de 5.)

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run utils/arsenal.test.ts -t "catorze"`
Expected: FAIL (hoje só existem 9).

- [ ] **Step 3: Adicionar os 5 seeds**

`makeClassic` (linhas 26-33 de `utils/arsenalEffects.ts`) hoje só preenche campos zerados além de `classic`. Como estes 5 precisam de `speedModifier`/`attackModifier`/`defenseModifier`/`elementalAffinities` reais (não zerados), criar uma segunda função de seed ao lado de `makeClassic`:

```ts
interface ElementalSeed {
  name: string;
  description: string;
  tags: string[];
  classic: ClassicEffectConfig;
  speedModifier?: number;
  attackModifier?: number;
  defenseModifier?: number;
  elementalAffinities?: ArsenalEffect['elementalAffinities'];
  modifiers?: ArsenalEffect['modifiers'];
}

const elementalSeeds: ElementalSeed[] = [
  { name:'Enraizado', description:'Reduz a velocidade pela metade enquanto durar.', tags:['terra','controle'],
    classic:{kind:'enraizado',value:50}, speedModifier:-50 },
  { name:'Desequilibrado', description:'Reduz os testes de ataque enquanto durar.', tags:['vento','debuff'],
    classic:{kind:'desequilibrado',value:2}, attackModifier:-2 },
  { name:'Fraturado', description:'Reduz a defesa e aumenta o dano físico recebido.', tags:['fisico','debuff'],
    classic:{kind:'fraturado',value:2}, defenseModifier:-2,
    elementalAffinities:[{element:'fisico',kind:'vulnerabilidade',percent:25}] },
  { name:'Iluminado', description:'Aumenta o dano de trevas recebido.', tags:['luminoso','debuff'],
    classic:{kind:'iluminado',value:25}, elementalAffinities:[{element:'escuridão',kind:'vulnerabilidade',percent:25}] },
  { name:'Amaldiçoado', description:'Reduz cura e recuperação de aura recebidas, e penaliza testes de ataque.', tags:['escuridão','debuff'],
    classic:{kind:'amaldicoado',value:50}, attackModifier:-2,
    modifiers:[{stat:'cura_recebida',operation:'multiplicar',value:-50},{stat:'aura_recebida',operation:'multiplicar',value:-50}] },
];

function makeElemental(seed: ElementalSeed): ArsenalEffect {
  return {
    id:`classic-${slug(seed.name)}`, name:seed.name, description:seed.description, tags:seed.tags,
    duration:{type:'rodadas',amount:2}, stackBehavior:'renova_duracao', maxStacks:1,
    triggers:[], modifiers:seed.modifiers ?? [], periodicDamage:null, periodicHealing:null, auraConsumed:null, auraRestored:null,
    attackModifier:seed.attackModifier ?? 0, defenseModifier:seed.defenseModifier ?? 0, speedModifier:seed.speedModifier ?? 0,
    customEffect:null, classic:seed.classic, elementalAffinities:seed.elementalAffinities,
  };
}
```

Trocar a linha final do arquivo:
```ts
export const PREDEFINED_ARSENAL_EFFECTS: readonly ArsenalEffect[] = Object.freeze(seeds.map(makeClassic));
```
por:
```ts
export const PREDEFINED_ARSENAL_EFFECTS: readonly ArsenalEffect[] = Object.freeze([
  ...seeds.map(makeClassic),
  ...elementalSeeds.map(makeElemental),
]);
```

Atualizar o import no topo do arquivo para incluir `ArsenalEffect` (já importado) — nenhuma mudança de import necessária além da já existente `import type { ArsenalEffect, ClassicEffectConfig } from './arsenal';`.

- [ ] **Step 4: Rodar o teste**

Run: `npx vitest run utils/arsenal.test.ts -t "catorze"`
Expected: PASS

- [ ] **Step 5: Teste de comportamento — Fraturado combina defesa e vulnerabilidade física**

Adicionar em `utils/arsenal.test.ts`:
```ts
  it('Fraturado reduz defesa e aumenta dano físico recebido', () => {
    const fractured = getPredefinedEffect('Fraturado')!;
    const card = createArsenalCard({ id: 'punch', name: 'Soco', category: 'habilidade', element: 'fisico', testDice: '1d20', damage: { flat: 10 } });
    const target = actor({ id: 't', teamId: 'b', defense: 12, currentHp: 30, maxHp: 30, effects: applyActiveEffect([], fractured) });
    const result = resolveArsenalAction({ card, actor: actor(), targets: [target], roller: () => 11 });
    expect(result.hitTargetIds).toEqual(['t']); // 11 >= (12 - 2)
    expect(result.targets[0].currentHp).toBe(17); // defesa 12-2=10, ataque 11 acerta; dano 10 * 1.25 = 12.5 -> ceil 13; 30-13=17
  });
```

- [ ] **Step 6: Rodar e ajustar se necessário**

Run: `npx vitest run utils/arsenal.test.ts -t "Fraturado"`
Expected: PASS. Se o arredondamento da vulnerabilidade (`Math.ceil`, já existente em `arsenalPipeline.ts:612`) não bater com o valor acima, ajustar a expectativa do teste para o valor real computado (o cálculo de `attackTotal`/defesa já está correto no motor; só a expectativa do teste precisa bater com a aritmética real — conferir rodando antes de fixar o número final).

- [ ] **Step 7: Rodar a suíte completa e commitar**

Run: `npx vitest run`
```bash
git add utils/arsenalEffects.ts utils/arsenal.test.ts
git commit -m "feat(arsenal): adiciona Enraizado, Desequilibrado, Fraturado, Iluminado e Amaldiçoado ao catálogo"
```

---

### Task 6: Paralisado — checagem de teste para agir

**Files:**
- Modify: `utils/arsenalPipeline.ts` (dentro de `resolveArsenalAction`, logo após o loop de `conditionFailure`)
- Modify: `utils/arsenalEffects.ts` (seed)
- Test: `utils/arsenal.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
  it('Paralisado bloqueia a ação quando o teste falha', () => {
    const paralyzed = getPredefinedEffect('Paralisado')!;
    const card = createArsenalCard({ id: 'hit', name: 'Golpe', category: 'habilidade', damage: { flat: 5 } });
    const failed = resolveArsenalAction({ card, actor: actor({ effects: applyActiveEffect([], paralyzed) }), targets: [actor({ id: 't', teamId: 'b' })], roller: () => 3 });
    expect(failed.status).toBe('bloqueada');
    expect(failed.reason).toBe('Paralisado: falhou no teste (3 < 10)');
    const passed = resolveArsenalAction({ card, actor: actor({ effects: applyActiveEffect([], paralyzed) }), targets: [actor({ id: 't', teamId: 'b' })], roller: () => 15 });
    expect(passed.status).toBe('concluida');
  });
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run utils/arsenal.test.ts -t "Paralisado bloqueia"`
Expected: FAIL (`getPredefinedEffect('Paralisado')` retorna `undefined` — seed ainda não existe).

- [ ] **Step 3: Adicionar o seed de Paralisado**

Em `utils/arsenalEffects.ts`, adicionar ao array `seeds` (o de `makeClassic`, junto dos 9 originais — Paralisado usa duração em rodadas simples, sem necessidade dos campos extras de `elementalSeeds`):
```ts
  { name:'Paralisado', description:'Deve rolar 1d20 e obter pelo menos X para poder agir.', tags:['controle','teste'], classic:{kind:'paralisado',value:10} },
```
Atualizar a lista esperada da Task 5/Step 1 (o teste "catorze efeitos") para 15, incluindo `'Paralisado'` — ajustar `toHaveLength(14)`→`toHaveLength(15)` e adicionar `'Paralisado'` ao array de nomes esperado, na mesma posição em que foi inserido no array `seeds`.

- [ ] **Step 4: Implementar a checagem no pipeline**

Em `utils/arsenalPipeline.ts`, dentro de `resolveArsenalAction`, logo depois do loop `for (const condition of request.card.conditions) { ... }` (linha 517, antes de `trace.push({ step: 'verificar_condicoes' });`):
```ts
  const paralysis = actor.effects.find(active => active.effect.classic?.kind === 'paralisado');
  if (paralysis) {
    const dc = paralysis.effect.classic!.value;
    const rollResult = roller('1d20');
    if (rollResult < dc) {
      const reason = `Paralisado: falhou no teste (${rollResult} < ${dc})`;
      return block({ ...base, trace: [...trace, { step: 'verificar_condicoes', detail: reason }] }, reason);
    }
  }
```

- [ ] **Step 5: Rodar o teste**

Run: `npx vitest run utils/arsenal.test.ts -t "Paralisado bloqueia"`
Expected: PASS

- [ ] **Step 6: Rodar a suíte completa e commitar**

Run: `npx vitest run`
```bash
git add utils/arsenalPipeline.ts utils/arsenalEffects.ts utils/arsenal.test.ts
git commit -m "feat(arsenal): condição Paralisado bloqueia ação em falha no teste 1d20"
```

---

### Task 7: Confuso — chance de cancelar a ação

**Files:**
- Modify: `utils/arsenalPipeline.ts`
- Modify: `utils/arsenalEffects.ts` (seed)
- Test: `utils/arsenal.test.ts`

**Nota de escopo:** o design original previa "trocar a carta usada por uma aleatória entre as disponíveis do ator". Isso exigiria a engine pura receber a lista de cartas candidatas do ator (hoje ela só recebe a carta já escolhida pelo chamador) — plumbing novo em `ActionResolutionRequest` e nos chamadores de UI. Para não expandir a superfície pública da engine nesta rodada, Confuso é implementado como **chance de cancelar a ação** (equivalente a "ficar parado" — uma das duas variantes já citadas na descrição legada da condição em `PRESET_CONDITIONS`). Trocar por redirecionamento de alvo/carta fica como extensão futura natural, sem quebrar o que for construído agora.

- [ ] **Step 1: Escrever o teste que falha**

O `roller` da engine recebe uma *notação* de dado (`'1d20'`, `'2d6'` etc.) e devolve
um número — para o roll de chance (0-1) reaproveitamos o mesmo `roller`, chamando
com a notação `'1d100'` e dividindo por 100, em vez de introduzir uma segunda
função de aleatoriedade na assinatura pública.

```ts
  it('Confuso tem chance de cancelar a ação declarada', () => {
    const confused = getPredefinedEffect('Confuso')!;
    const card = createArsenalCard({ id: 'hit', name: 'Golpe', category: 'habilidade', damage: { flat: 5 } });
    const cancelled = resolveArsenalAction({
      card, actor: actor({ effects: applyActiveEffect([], confused) }), targets: [actor({ id: 't', teamId: 'b' })],
      roller: notation => notation === '1d100' ? 10 : 15, // 10/100 = 0.10 < chance padrão (0.25) de Confuso
    });
    expect(cancelled.status).toBe('cancelada');
    expect(cancelled.reason).toBe('Confuso: ação perdida');
  });
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run utils/arsenal.test.ts -t "Confuso tem chance"`
Expected: FAIL (`getPredefinedEffect('Confuso')` é `undefined`).

- [ ] **Step 3: Adicionar o seed de Confuso**

Em `utils/arsenalEffects.ts`, no array `seeds`:
```ts
  { name:'Confuso', description:'Chance de a ação ser perdida (ficar parado) em vez de executada.', tags:['controle','aleatorio'], classic:{kind:'confuso',value:0.25} },
```
Atualizar novamente a expectativa de contagem/nomes do teste da Task 5 (agora 16, incluindo `'Confuso'`).

- [ ] **Step 4: Implementar a checagem no pipeline**

Em `utils/arsenalPipeline.ts`, logo depois do bloco de Paralisado adicionado na Task 6 (ainda antes de `trace.push({ step: 'verificar_condicoes' });`):
```ts
  const confusion = actor.effects.find(active => active.effect.classic?.kind === 'confuso');
  if (confusion) {
    const chance = confusion.effect.classic!.value;
    const roll = roller('1d100') / 100;
    if (roll < chance) {
      return { ...base, status: 'cancelada', trace: [...trace, { step: 'verificar_condicoes', detail: 'Confuso: ação perdida' }], reason: 'Confuso: ação perdida' };
    }
  }
```

- [ ] **Step 5: Rodar o teste**

Run: `npx vitest run utils/arsenal.test.ts -t "Confuso tem chance"`
Expected: PASS

- [ ] **Step 6: Rodar a suíte completa e commitar**

Run: `npx vitest run`
```bash
git add utils/arsenalPipeline.ts utils/arsenalEffects.ts utils/arsenal.test.ts
git commit -m "feat(arsenal): condição Confuso tem chance de cancelar a ação"
```

---

### Task 8: `utils/arsenalElements.ts` — tabela de interação dano×condição

**Files:**
- Create: `utils/arsenalElements.ts`
- Create: `utils/arsenalElements.test.ts`
- Modify: `utils/arsenalPipeline.ts:602-606` (substitui o bloco hardcoded de raio+molhado)
- Modify: `utils/arsenal.test.ts:266-273` ("Molhado multiplica dano elétrico...") — deve continuar passando sem alteração de expectativa, só validando que a migração para a tabela não muda o resultado.

- [ ] **Step 1: Escrever o teste da tabela (arquivo novo)**

`utils/arsenalElements.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { applyDamageConditionInteractions, DAMAGE_CONDITION_INTERACTIONS } from './arsenalElements';
import { getPredefinedEffect } from './arsenalEffects';
import { applyActiveEffect } from './arsenalPipeline';

describe('tabela de interação dano×condição', () => {
  it('tem as 3 interações conhecidas', () => {
    expect(DAMAGE_CONDITION_INTERACTIONS.map(i => i.id)).toEqual(['molhado-raio', 'molhado-fogo', 'agua-queimadura']);
  });

  it('raio contra Molhado multiplica pelo valor da condição e consome', () => {
    const wet = { ...getPredefinedEffect('Molhado')!, classic: { kind: 'molhado' as const, value: 2 } };
    const effects = applyActiveEffect([], wet);
    const result = applyDamageConditionInteractions(effects, 'raio', 10);
    expect(result.damage).toBe(20);
    expect(result.effects.some(active => active.effect.classic?.kind === 'molhado')).toBe(false);
  });

  it('fogo contra Molhado reduz o dano pela metade e consome', () => {
    const wet = { ...getPredefinedEffect('Molhado')!, classic: { kind: 'molhado' as const, value: 2 } };
    const effects = applyActiveEffect([], wet);
    const result = applyDamageConditionInteractions(effects, 'fogo', 10);
    expect(result.damage).toBe(5);
    expect(result.effects.some(active => active.effect.classic?.kind === 'molhado')).toBe(false);
  });

  it('água contra Queimadura extingue sem alterar o dano da água', () => {
    const burn = getPredefinedEffect('Queimadura')!;
    const effects = applyActiveEffect([], burn);
    const result = applyDamageConditionInteractions(effects, 'água', 8);
    expect(result.damage).toBe(8);
    expect(result.effects.some(active => active.effect.classic?.kind === 'queimadura')).toBe(false);
  });

  it('sem interação aplicável, retorna dano e efeitos inalterados', () => {
    const result = applyDamageConditionInteractions([], 'fogo', 8);
    expect(result.damage).toBe(8);
    expect(result.effects).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run utils/arsenalElements.test.ts`
Expected: FAIL (módulo `./arsenalElements` não existe).

- [ ] **Step 3: Criar `utils/arsenalElements.ts`**

```ts
import type { Element } from '../types';
import type { ClassicEffectKind } from './arsenal';
import type { ActiveEffectState } from './arsenalPipeline';

export interface DamageConditionInteraction {
  id: string;
  incomingElement: Element;
  conditionKind: ClassicEffectKind;
  /** 'valor_da_condicao' reaproveita o classic.value da própria condição (ex.: Molhado x2). Um número fixo é usado como está. */
  damageMultiplier: number | 'valor_da_condicao';
  consumesCondition: boolean;
}

export const DAMAGE_CONDITION_INTERACTIONS: DamageConditionInteraction[] = [
  { id: 'molhado-raio', incomingElement: 'raio', conditionKind: 'molhado', damageMultiplier: 'valor_da_condicao', consumesCondition: true },
  { id: 'molhado-fogo', incomingElement: 'fogo', conditionKind: 'molhado', damageMultiplier: 0.5, consumesCondition: true },
  { id: 'agua-queimadura', incomingElement: 'água', conditionKind: 'queimadura', damageMultiplier: 1, consumesCondition: true },
];

export interface DamageConditionInteractionResult {
  damage: number;
  effects: ActiveEffectState[];
}

/** Aplica as interações cabíveis (pode haver mais de uma) e retorna o dano final e a lista de efeitos já sem as condições consumidas. */
export function applyDamageConditionInteractions(
  effects: readonly ActiveEffectState[],
  incomingElement: Element,
  damage: number,
): DamageConditionInteractionResult {
  let result = damage;
  const consumedKinds = new Set<ClassicEffectKind>();
  for (const interaction of DAMAGE_CONDITION_INTERACTIONS) {
    if (interaction.incomingElement !== incomingElement) continue;
    const active = effects.find(item => item.effect.classic?.kind === interaction.conditionKind);
    if (!active) continue;
    const multiplier = interaction.damageMultiplier === 'valor_da_condicao'
      ? Math.max(1, active.effect.classic!.value)
      : interaction.damageMultiplier;
    result = Math.floor(result * multiplier);
    if (interaction.consumesCondition) consumedKinds.add(interaction.conditionKind);
  }
  return {
    damage: result,
    effects: effects.filter(active => !active.effect.classic || !consumedKinds.has(active.effect.classic.kind)),
  };
}
```

- [ ] **Step 4: Rodar o teste da tabela**

Run: `npx vitest run utils/arsenalElements.test.ts`
Expected: PASS

- [ ] **Step 5: Ligar no pipeline, substituindo o bloco hardcoded**

Em `utils/arsenalPipeline.ts`, trocar (linhas 602-606):
```ts
    let targetDamage=damageTotal;
    if(request.card.element==='raio'&&targetDamage>0){
      const wet=target.effects.filter(active=>active.effect.classic?.kind==='molhado');
      if(wet.length){targetDamage=Math.floor(targetDamage*wet.reduce((multiplier,active)=>multiplier*Math.max(1,active.effect.classic!.value),1));target.effects=target.effects.filter(active=>active.effect.classic?.kind!=='molhado');}
    }
```
por:
```ts
    let targetDamage=damageTotal;
    if (request.card.element && targetDamage > 0) {
      const interaction = applyDamageConditionInteractions(target.effects, request.card.element, targetDamage);
      targetDamage = interaction.damage;
      target.effects = interaction.effects;
    }
```
E adicionar o import no topo do arquivo:
```ts
import { applyDamageConditionInteractions } from './arsenalElements';
```

- [ ] **Step 6: Rodar toda a suíte (garantir que o teste antigo de Molhado+raio ainda passa)**

Run: `npx vitest run`
Expected: PASS — inclui `utils/arsenal.test.ts:266` ("Molhado multiplica dano elétrico e é consumido"), que deve continuar passando sem alteração, e o novo caso simétrico de água extinguindo queimadura.

- [ ] **Step 7: Commit**

```bash
git add utils/arsenalElements.ts utils/arsenalElements.test.ts utils/arsenalPipeline.ts
git commit -m "refactor(arsenal): tabela de interação dano×condição orientada a dados"
```

---

### Task 9: Chance elemental configurável

**Files:**
- Modify: `utils/arsenalElements.ts` (tabela + roll)
- Modify: `utils/arsenalElements.test.ts`
- Modify: `utils/arsenal.ts` (campos novos em `ArsenalCard`)
- Modify: `utils/arsenalPipeline.ts` (aplica no passo `aplicar_efeitos`)
- Test: `utils/arsenal.test.ts`

- [ ] **Step 1: Escrever os testes da chance elemental**

Em `utils/arsenalElements.test.ts`, adicionar:
```ts
import { ELEMENTAL_CONDITION_TABLE, rollElementalConditionChance } from './arsenalElements';
import { createArsenalCard } from './arsenal';

describe('chance elemental configurável', () => {
  it('tem uma entrada por elemento com condição padrão', () => {
    expect(ELEMENTAL_CONDITION_TABLE.map(entry => entry.damageType)).toEqual([
      'fogo', 'água', 'raio', 'vento', 'terra', 'fisico', 'sangue', 'luminoso', 'escuridão',
    ]);
  });

  it('aplica a condição quando o roll cai dentro da chance', () => {
    const card = createArsenalCard({ id: 'fire', name: 'Fogo', category: 'habilidade', element: 'fogo' });
    expect(rollElementalConditionChance(card, () => 10)).toBe('queimadura'); // 10 <= 20
    expect(rollElementalConditionChance(card, () => 25)).toBeNull(); // 25 > 20
  });

  it('carta pode sobrescrever a chance', () => {
    const card = createArsenalCard({ id: 'fire', name: 'Fogo', category: 'habilidade', element: 'fogo', elementalConditionChance: 0.9 });
    expect(rollElementalConditionChance(card, () => 80)).toBe('queimadura');
  });

  it('carta pode desativar o proc elemental', () => {
    const card = createArsenalCard({ id: 'fire', name: 'Fogo', category: 'habilidade', element: 'fogo', applyElementalCondition: false });
    expect(rollElementalConditionChance(card, () => 1)).toBeNull();
  });

  it('sem elemento ou sem entrada na tabela (aura), não aplica nada', () => {
    const card = createArsenalCard({ id: 'x', name: 'X', category: 'habilidade' });
    expect(rollElementalConditionChance(card, () => 1)).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run utils/arsenalElements.test.ts -t "chance elemental"`
Expected: FAIL (`ELEMENTAL_CONDITION_TABLE`/`rollElementalConditionChance` não existem, e `ArsenalCard` não tem os 2 campos novos).

- [ ] **Step 3: Adicionar os 2 campos opcionais em `ArsenalCard`**

Em `utils/arsenal.ts`, dentro de `ArsenalCard` (perto da linha 333, junto de `effects: ArsenalEffect[];`):
```ts
  /** Sobrescreve a chance padrão de aplicar a condição elemental do seu tipo de dano (0-1). */
  elementalConditionChance?: number;
  /** false desativa completamente o proc de condição elemental para esta carta. */
  applyElementalCondition?: boolean;
```

- [ ] **Step 4: Implementar a tabela e o roll em `utils/arsenalElements.ts`**

Adicionar ao arquivo criado na Task 8:
```ts
import type { ArsenalCard } from './arsenal';

export interface ElementalConditionConfig {
  damageType: Element;
  conditionKind: ClassicEffectKind;
  chance: number; // 0..1
}

export const ELEMENTAL_CONDITION_TABLE: ElementalConditionConfig[] = [
  { damageType: 'fogo', conditionKind: 'queimadura', chance: 0.20 },
  { damageType: 'água', conditionKind: 'molhado', chance: 0.20 },
  { damageType: 'raio', conditionKind: 'eletrocutado', chance: 0.15 },
  { damageType: 'vento', conditionKind: 'desequilibrado', chance: 0.15 },
  { damageType: 'terra', conditionKind: 'enraizado', chance: 0.15 },
  { damageType: 'fisico', conditionKind: 'fraturado', chance: 0.10 },
  { damageType: 'sangue', conditionKind: 'sangramento', chance: 0.20 },
  { damageType: 'luminoso', conditionKind: 'iluminado', chance: 0.15 },
  { damageType: 'escuridão', conditionKind: 'amaldicoado', chance: 0.15 },
];

/** Rola (1-100 via roller) se a carta deve aplicar a condição elemental padrão do seu dano. Retorna o kind ou null. */
export function rollElementalConditionChance(card: ArsenalCard, roller: (notation: string) => number): ClassicEffectKind | null {
  if (card.applyElementalCondition === false) return null;
  if (!card.element) return null;
  const entry = ELEMENTAL_CONDITION_TABLE.find(item => item.damageType === card.element);
  if (!entry) return null;
  const chance = card.elementalConditionChance ?? entry.chance;
  const roll = roller('1d100');
  return roll <= chance * 100 ? entry.conditionKind : null;
}
```

- [ ] **Step 5: Rodar os testes da chance**

Run: `npx vitest run utils/arsenalElements.test.ts`
Expected: PASS

- [ ] **Step 6: Ligar no pipeline — aplicar a condição após o dano**

Em `utils/arsenalPipeline.ts`, dentro do loop de `request.card.effects` no passo `aplicar_efeitos` (linhas 627-633), depois do loop existente, adicionar:
```ts
  for (const target of targets) {
    if (!hitIds.includes(target.id)) continue;
    const procKind = rollElementalConditionChance(request.card, roller);
    if (procKind) {
      const procEffect = getPredefinedEffect(procKind);
      if (procEffect && !isImmuneTo(target, procKind)) target.effects = stackEffect(target.effects, procEffect);
    }
  }
```
Import necessário no topo do arquivo:
```ts
import { rollElementalConditionChance } from './arsenalElements';
import { getPredefinedEffect } from './arsenalEffects';
```
`getPredefinedEffect` recebe nome OU id — usar o `kind` (`'queimadura'`, `'molhado'` etc.) exige que `getPredefinedEffect` também aceite o `classic.kind` como chave de busca. Conferir `utils/arsenalEffects.ts:37-50`: hoje só compara por `id`/`name` normalizado, não por `classic.kind`. Adicionar essa terceira via de busca:
```ts
export function getPredefinedEffect(idOrName: string): ArsenalEffect | undefined {
  // ...corpo existente...
  const found = PREDEFINED_ARSENAL_EFFECTS.find(effect =>
    effect.id === idOrName || effect.name.toLocaleLowerCase('pt-BR') === key || effect.classic?.kind === idOrName,
  );
  return found ? structuredClone(found) : undefined;
}
```

- [ ] **Step 7: Escrever teste de integração no pipeline**

Em `utils/arsenal.test.ts`:
```ts
  it('carta de fogo tem chance de aplicar Queimadura após o dano', () => {
    const card = createArsenalCard({ id: 'fire', name: 'Fogo', category: 'habilidade', element: 'fogo', damage: { flat: 5 }, elementalConditionChance: 1 });
    const result = resolveArsenalAction({ card, actor: actor(), targets: [actor({ id: 't', teamId: 'b', currentHp: 20 })], roller: dice => dice === '1d100' ? 1 : 0 });
    expect(result.targets[0].effects.some(active => active.effect.classic?.kind === 'queimadura')).toBe(true);
  });

  it('applyElementalCondition:false nunca aplica a condição', () => {
    const card = createArsenalCard({ id: 'fire', name: 'Fogo', category: 'habilidade', element: 'fogo', damage: { flat: 5 }, applyElementalCondition: false, elementalConditionChance: 1 });
    const result = resolveArsenalAction({ card, actor: actor(), targets: [actor({ id: 't', teamId: 'b', currentHp: 20 })], roller: dice => dice === '1d100' ? 1 : 0 });
    expect(result.targets[0].effects).toEqual([]);
  });
```

- [ ] **Step 8: Rodar a suíte completa**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add utils/arsenal.ts utils/arsenalElements.ts utils/arsenalElements.test.ts utils/arsenalPipeline.ts utils/arsenalEffects.ts utils/arsenal.test.ts
git commit -m "feat(arsenal): chance elemental configurável de aplicar condição padrão após dano"
```

---

### Task 10: Persistência — `sourceId`/`appliedAtRound`/`metadata` e utilitários de leitura/remoção

**Files:**
- Modify: `utils/arsenalPipeline.ts` (`ActiveEffectState`)
- Modify: `types.ts:274` (`Character.activeEffects`)
- Modify: `utils/arsenalPipeline.ts` (retomar o `undefined` deixado na Task 2, Step 2)
- Test: `utils/arsenal.test.ts`

- [ ] **Step 1: Estender `ActiveEffectState`**

Em `utils/arsenalPipeline.ts:37-43`:
```ts
export interface ActiveEffectState {
  effect: ArsenalEffect;
  stacks: number;
  remaining?: number;
  turnSkipsRemaining?: number;
  principalBlocksRemaining?: number;
  sourceId?: string;
  appliedAtRound?: number;
  metadata?: Record<string, unknown>;
}
```

- [ ] **Step 2: Estender `Character.activeEffects`**

Em `types.ts:274`:
```ts
  activeEffects?: Array<{ effect: ArsenalEffect; stacks: number; remaining?: number; sourceId?: string; appliedAtRound?: number; metadata?: Record<string, unknown> }>;
```

- [ ] **Step 3: Retomar o `sourceId` no filtro (pendência da Task 2)**

Em `utils/arsenalPipeline.ts`, nos 4 call sites de `matchesEffectFilter(...)` adicionados na Task 2, trocar o `undefined` fixo por `active.sourceId`:
```ts
matchesEffectFilter(modifier.filter, card, actor, active.sourceId)
```
(idem para o call site de `bonus.filter` dentro de `activeDiceBonuses`).

- [ ] **Step 4: Utilitários de leitura/remoção**

Em `utils/arsenalPipeline.ts`, adicionar ao lado de `applyActiveEffect` (linha 380-382):
```ts
export function getActiveEffects(actor: Pick<ArsenalActorState, 'effects'>): ActiveEffectState[] {
  return actor.effects;
}

export function hasCondition(actor: Pick<ArsenalActorState, 'effects'>, effectId: string): boolean {
  return actor.effects.some(active => active.effect.id === effectId);
}

export function removeActiveEffect(effects: readonly ActiveEffectState[], effectId: string): ActiveEffectState[] {
  return effects.filter(active => active.effect.id !== effectId);
}

export function cleanseByTag(effects: readonly ActiveEffectState[], tag: string): ActiveEffectState[] {
  return effects.filter(active => !active.effect.tags.includes(tag));
}
```

- [ ] **Step 5: Testar os utilitários novos**

```ts
  it('remove efeito ativo por id e por tag', () => {
    const burn = getPredefinedEffect('Queimadura')!;
    const cursed = getPredefinedEffect('Amaldiçoado')!;
    const effects = applyActiveEffect(applyActiveEffect([], burn), cursed);
    expect(hasCondition({ effects }, burn.id)).toBe(true);
    expect(removeActiveEffect(effects, burn.id).some(active => active.effect.id === burn.id)).toBe(false);
    expect(cleanseByTag(effects, 'debuff').some(active => active.effect.name === 'Amaldiçoado')).toBe(false);
  });
```

- [ ] **Step 6: Rodar a suíte completa**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add utils/arsenalPipeline.ts types.ts utils/arsenal.test.ts
git commit -m "feat(arsenal): sourceId/appliedAtRound/metadata em efeitos ativos + utilitários de leitura/remoção"
```

---

### Task 11: Regressão final

- [ ] **Step 1: Typecheck completo**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 2: Suíte completa**

Run: `npx vitest run`
Expected: todos os testes (novos e antigos) em PASS.

- [ ] **Step 3: Conferir que `utils/resolve.ts`/`grimoire.ts`/`elements.ts` (código morto) não foram tocados além do literal da Task 1**

Run: `git diff --stat -- utils/resolve.ts utils/grimoire.ts utils/elements.ts utils/resolve.test.ts utils/grimoire.test.ts utils/elements.test.ts`
Expected: só `utils/resolve.test.ts`, `utils/grimoire.test.ts` e `utils/elements.test.ts` aparecem, com poucas linhas alteradas (só o literal `'normal'`→`'fisico'`).
