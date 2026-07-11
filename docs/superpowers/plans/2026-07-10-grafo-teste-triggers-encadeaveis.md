# Grafo de Habilidades — Bloco de Teste + Triggers Encadeáveis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o teste de acerto do cabeçalho (`header.testDice`) e o nó `teste_defesa` por um bloco de teste genérico (`teste`) plugável em qualquer ponto do grafo, e tornar os nós de trigger removíveis/encadeáveis como qualquer outro nó, com um mecanismo de assinatura/evento para reações penduradas dentro de outra árvore.

**Architecture:** Fase A adiciona o nó `teste` (família `ramo`) que roda um dado contra um critério e grava o resultado em `ctx.hitTest`; `resolveAbilityGraphAction` passa a interpretar o grafo **uma vez por alvo** (em vez de uma rolagem única para todos os alvos) e usa `result.hitTest` para decidir acerto/erro por alvo. Fase B relaxa as regras especiais em torno da família `gatilho`: qualquer nó de trigger pode ser removido (exceto a raiz de fato do grafo) e pode ser conectado como filho de outro nó; o motor descobre a raiz estruturalmente ("nó sem arestas de entrada") em vez de por família+tipo, e um trigger alcançado como filho durante o walk (não como ponto de entrada) registra uma reação pendente em vez de executar imediatamente.

**Tech Stack:** TypeScript, Vitest, React (componentes do editor em `components/arsenal/graph/*`).

**Nota de escopo (desvio consciente do spec, documentado aqui para transparência):** o spec menciona uma nova família `evento` substituindo `gatilho`. Nesta implementação o **nome da família continua `'gatilho'`** — só as regras especiais em torno dela mudam (remoção permitida, pode ter pais, motor descobre raiz estruturalmente). Isso evita ter que tocar em toda referência literal `family: 'gatilho'` espalhada em templates/wizard/testes que não dependem da regra especial, reduzindo o raio de mudança sem alterar o comportamento observável descrito no spec.

---

## Fase A — Bloco de teste genérico

### Task A1: Criar o nó `teste` (família `ramo`)

**Files:**
- Create: `utils/nodes/testNodes.ts`
- Test: `utils/nodes/testNodes.test.ts`
- Modify: `utils/nodes/index.ts` (registrar o novo arquivo — leia o arquivo antes de editar para ver o padrão de `ensureNodesRegistered`)

- [ ] **Step 1: Ler `utils/nodes/index.ts` para confirmar o padrão de registro**

Rode: `cat utils/nodes/index.ts` (ou leia via ferramenta) antes de prosseguir — o arquivo deve exportar `ensureNodesRegistered()` chamando `registerCoreNodes()`, `registerConditionNodes()`, `registerControlNodes()`, `registerDefenseNodes()`, `registerFormaNodes()`. Você vai adicionar `registerTestNodes()` a essa lista.

- [ ] **Step 2: Escrever o teste que falha**

```ts
// utils/nodes/testNodes.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { _resetRegistry, getNodeType } from '../nodeRegistry';
import { registerTestNodes } from './testNodes';
import type { InterpretCtx } from '../abilityInterpreter';
import type { ArsenalActorState } from '../arsenalPipeline';

function actor(over: Partial<ArsenalActorState> = {}): ArsenalActorState {
  return {
    id: 'a', teamId: 'A', name: 'Ator', currentHp: 30, maxHp: 30, currentAura: 10, maxAura: 10,
    currentAmmo: 0, maxAmmo: 0, defense: 12, speed: 8, tags: [], equippedWeaponIds: [],
    activeFormIds: [], effects: [], holdings: [], isCurrentTurn: true, inCombat: true, ...over,
  };
}

function ctxWith(over: Partial<InterpretCtx> = {}): InterpretCtx {
  const a = actor();
  const t = actor({ id: 't', defense: 10 });
  return {
    actor: a, scope: [t], primaryTargets: [t], allTargets: [a, t],
    roller: () => 15, element: null, trace: [], ...over,
  };
}

describe('nó teste', () => {
  beforeEach(() => { _resetRegistry(); registerTestNodes(); });

  it('comparador defesa_alvo: sucesso quando rolagem >= defesa do alvo em ctx.scope[0]', () => {
    const def = getNodeType('teste')!;
    const ctx = ctxWith({ roller: () => 12 });
    const result = def.evaluate!({ dice: '1d20', comparador: 'defesa_alvo', modificador: 0 }, ctx);
    expect(result).toBe(true);
    expect(ctx.hitTest).toBe(true);
  });

  it('comparador defesa_alvo: falha quando rolagem < defesa do alvo', () => {
    const def = getNodeType('teste')!;
    const ctx = ctxWith({ roller: () => 3 });
    const result = def.evaluate!({ dice: '1d20', comparador: 'defesa_alvo', modificador: 0 }, ctx);
    expect(result).toBe(false);
    expect(ctx.hitTest).toBe(false);
  });

  it('comparador valor_fixo: compara a rolagem+modificador contra valorFixo', () => {
    const def = getNodeType('teste')!;
    const ctx = ctxWith({ roller: () => 8 });
    expect(def.evaluate!({ dice: '1d20', comparador: 'valor_fixo', valorFixo: 10, modificador: 3 }, ctx)).toBe(true); // 8+3=11 >= 10
    expect(def.evaluate!({ dice: '1d20', comparador: 'valor_fixo', valorFixo: 10, modificador: 0 }, ctx)).toBe(false); // 8 < 10
  });

  it('comparador aura_maxima: compara a rolagem contra a aura atual do ator', () => {
    const def = getNodeType('teste')!;
    const ctx = ctxWith({ roller: () => 9 });
    expect(def.evaluate!({ dice: '1d20', comparador: 'aura_alvo', modificador: 0 }, { ...ctx, actor: actor({ currentAura: 5 }) })).toBe(true);
  });

  it('comparador porcentagem: rola 1d100 e compara contra valorFixo (não usa "dice")', () => {
    const def = getNodeType('teste')!;
    const ctx = ctxWith({ roller: () => 30 });
    expect(def.evaluate!({ dice: '', comparador: 'porcentagem', valorFixo: 50, modificador: 0 }, ctx)).toBe(true);
    expect(def.evaluate!({ dice: '', comparador: 'porcentagem', valorFixo: 20, modificador: 0 }, ctx)).toBe(false);
  });

  it('summarize descreve o dado e o comparador', () => {
    const def = getNodeType('teste')!;
    expect(def.summarize({ dice: '1d20', comparador: 'defesa_alvo', modificador: 0 })).toBe('Teste: 1d20 vs. defesa do alvo');
  });
});
```

- [ ] **Step 3: Rodar e confirmar a falha**

Rode: `npx vitest run utils/nodes/testNodes.test.ts`
Esperado: FAIL — `Cannot find module './testNodes'`.

- [ ] **Step 4: Implementar `utils/nodes/testNodes.ts`**

```ts
import { registerNodeType } from '../nodeRegistry';

export type TesteComparador = 'defesa_alvo' | 'valor_fixo' | 'aura_alvo' | 'porcentagem';

export interface TesteProps {
  dice: string;
  comparador: TesteComparador;
  valorFixo?: number;
  modificador?: number;
}

const COMPARADOR_LABEL: Record<TesteComparador, string> = {
  defesa_alvo: 'defesa do alvo',
  valor_fixo: 'valor fixo',
  aura_alvo: 'aura do usuário',
  porcentagem: 'chance (%)',
};

export function registerTestNodes(): void {
  registerNodeType<TesteProps>({
    type: 'teste', family: 'ramo', label: 'Teste', category: 'Configuração',
    fields: [
      { key: 'dice', kind: 'dado', label: 'Dado' },
      { key: 'comparador', kind: 'select', label: 'Comparar contra', options: [
        { value: 'defesa_alvo', label: 'Defesa do alvo' },
        { value: 'valor_fixo', label: 'Valor fixo' },
        { value: 'aura_alvo', label: 'Aura do usuário' },
        { value: 'porcentagem', label: 'Chance (%)' },
      ] },
      { key: 'valorFixo', kind: 'numero', label: 'Valor fixo / limiar (%)' },
      { key: 'modificador', kind: 'numero', label: 'Modificador' },
    ],
    defaults: () => ({ dice: '1d20', comparador: 'defesa_alvo', valorFixo: 0, modificador: 0 }),
    summarize: p => `Teste: ${p.comparador === 'porcentagem' ? `${p.valorFixo ?? 0}%` : p.dice} vs. ${COMPARADOR_LABEL[p.comparador]}`,
    evaluate: (p, ctx) => {
      if (p.comparador === 'porcentagem') {
        const roll = ctx.roller('1d100', 'Teste: chance');
        const result = roll <= (p.valorFixo ?? 0);
        ctx.hitTest = result;
        return result;
      }
      const roll = ctx.roller(p.dice, 'Teste') + (p.modificador ?? 0);
      const threshold = p.comparador === 'defesa_alvo' ? (ctx.scope[0]?.defense ?? 0)
        : p.comparador === 'aura_alvo' ? ctx.actor.currentAura
        : (p.valorFixo ?? 0);
      const result = roll >= threshold;
      ctx.hitTest = result;
      return result;
    },
  });
}
```

- [ ] **Step 5: Adicionar `hitTest` a `InterpretCtx` e `AbilityResult`**

Em `utils/abilityInterpreter.ts`, adicione o campo opcional logo abaixo de `trace: TraceStep[];` na interface `InterpretCtx` (linha ~21):

```ts
  trace: TraceStep[];
  /** Resultado do último nó 'teste' avaliado no walk — usado por resolveAbilityGraphAction para decidir acerto/erro por alvo. */
  hitTest?: boolean;
```

E em `AbilityResult` (linha ~38-43), adicione o mesmo campo:

```ts
export interface AbilityResult {
  actor: ArsenalActorState;
  targets: ArsenalActorState[];
  trace: TraceStep[];
  ongoingEffectIntents: { targetId: string; casterId: string; rounds: number }[];
  hitTest?: boolean;
}
```

No final de `interpretAbility` (linha ~112-117), inclua `hitTest: ctx.hitTest` no objeto de retorno:

```ts
  return {
    actor: byId.get(input.actor.id)!,
    targets: [...byId.values()].filter(a => a.id !== input.actor.id),
    trace: ctx.trace,
    ongoingEffectIntents: ctx.ongoingEffectIntents ?? [],
    hitTest: ctx.hitTest,
  };
```

- [ ] **Step 6: Registrar `registerTestNodes` em `utils/nodes/index.ts`**

Abra `utils/nodes/index.ts`, importe `registerTestNodes` de `./testNodes` e chame-a dentro de `ensureNodesRegistered()`, ao lado das outras chamadas de registro.

- [ ] **Step 7: Rodar e confirmar que passa**

Rode: `npx vitest run utils/nodes/testNodes.test.ts utils/abilityInterpreter.test.ts`
Esperado: PASS em ambos.

- [ ] **Step 8: Commit**

```bash
git add utils/nodes/testNodes.ts utils/nodes/testNodes.test.ts utils/nodes/index.ts utils/abilityInterpreter.ts
git commit -m "feat(grafo): adiciona nó de teste genérico (ramo) com hitTest no ctx"
```

---

### Task A2: Dobrar `se_chance` dentro do `teste` (remover duplicação)

**Files:**
- Modify: `utils/nodes/conditionNodes.ts:43-49` (remove `se_chance`)
- Modify: `utils/nodes/conditionNodes.test.ts` (remover teste de `se_chance`, se existir)
- Modify: qualquer arquivo que referencie `se_chance` como tipo de nó (grep antes de remover)

- [ ] **Step 1: Localizar todas as referências a `se_chance`**

Rode: `grep -rn "se_chance" --include="*.ts" --include="*.tsx" .`
Anote cada arquivo. Esperado incluir pelo menos `utils/nodes/conditionNodes.ts`, `utils/abilityValidate.ts:88-91`, e possivelmente `utils/abilityTemplates.ts`/fixtures de teste.

- [ ] **Step 2: Remover o registro de `se_chance` em `conditionNodes.ts`**

Delete o bloco `registerNodeType<{ percent: number }>({ type: 'se_chance', ... })` (linhas 43-49 do arquivo lido nesta sessão). Se houver um teste dedicado em `conditionNodes.test.ts` cobrindo `se_chance`, remova-o (o comportamento equivalente já é coberto por `testNodes.test.ts`, caso `porcentagem`).

- [ ] **Step 3: Atualizar `utils/abilityValidate.ts`**

Na função `validateAbilityGraph` (linhas 87-91 lidas nesta sessão), o bloco:

```ts
      if (node.type === 'se_chance') {
        const percent = Number(props.percent);
        if (percent <= 0) issues.push({ severity: 'aviso', message: 'Chance de 0% ou menos: o caminho SE nunca acontece.', nodeId: node.id });
        if (percent >= 100) issues.push({ severity: 'aviso', message: 'Chance de 100% ou mais: o caminho SENÃO nunca acontece.', nodeId: node.id });
      }
```

deve virar uma checagem equivalente para o nó `teste` quando `comparador === 'porcentagem'`:

```ts
      if (node.type === 'teste' && props.comparador === 'porcentagem') {
        const percent = Number(props.valorFixo);
        if (percent <= 0) issues.push({ severity: 'aviso', message: 'Chance de 0% ou menos: o caminho SE nunca acontece.', nodeId: node.id });
        if (percent >= 100) issues.push({ severity: 'aviso', message: 'Chance de 100% ou mais: o caminho SENÃO nunca acontece.', nodeId: node.id });
      }
```

- [ ] **Step 4: Rodar os testes afetados**

Rode: `npx vitest run utils/nodes/conditionNodes.test.ts utils/abilityValidate.test.ts`
Esperado: PASS (ajuste qualquer teste de `abilityValidate.test.ts` que ainda espere o antigo `se_chance` — troque o fixture de teste para usar `type: 'teste', props: { comparador: 'porcentagem', valorFixo: ... }`).

- [ ] **Step 5: Rodar a suíte completa de grafo para pegar quebras não previstas**

Rode: `npx vitest run utils/ability* utils/nodes`
Esperado: PASS. Se algum outro arquivo (ex. `abilityTemplates.ts`) referenciar `se_chance`, atualize-o para `teste`/`comparador: 'porcentagem'` seguindo o mesmo padrão do Step 3.

- [ ] **Step 6: Commit**

```bash
git add -u
git commit -m "refactor(grafo): funde se_chance no nó teste (comparador porcentagem)"
```

---

### Task A3: Remover `teste_defesa` e `graphDefenseTest`

**Files:**
- Modify: `utils/nodes/coreNodes.ts:70-76` (remove `teste_defesa`)
- Modify: `utils/abilityGraphAction.ts:107-113` (remove `graphDefenseTest`)
- Modify: `utils/abilityGraphAction.test.ts:366-375` (remove o describe `graphDefenseTest`)
- Modify: qualquer chamador de `graphDefenseTest` (grep antes)

- [ ] **Step 1: Localizar chamadores**

Rode: `grep -rn "graphDefenseTest\|teste_defesa" --include="*.ts" --include="*.tsx" .`
Confirme se algum componente de UI (ex. reação/proteção na Cena) usa `graphDefenseTest` — se sim, anote o call site para decidir o que ele deve fazer agora (provavelmente já não faz sentido, já que o teste de defesa passa a ser modelado como um nó `teste` dentro da própria árvore `ao_ser_alvejado` do defensor, resolvido normalmente pelo walk).

- [ ] **Step 2: Remover o tipo de nó `teste_defesa` de `coreNodes.ts`**

Delete o bloco:
```ts
  registerNodeType<{ dice: string }>({
    type: 'teste_defesa', family: 'efeito', label: 'Teste de defesa', category: 'Defesa',
    fields: [{ key: 'dice', kind: 'dado', label: 'Dado de defesa' }],
    defaults: () => ({ dice: '1d20' }),
    summarize: p => `Defesa: ${p.dice}`,
    interpret: (p, ctx) => { ctx.trace.push({ node: 'teste_defesa', detail: `Teste de defesa: ${p.dice}` }); },
  });
```

- [ ] **Step 3: Remover `graphDefenseTest` de `abilityGraphAction.ts`**

Delete a função inteira (linhas 107-113 lidas nesta sessão) e seu comentário JSDoc acima.

- [ ] **Step 4: Remover o teste correspondente em `abilityGraphAction.test.ts`**

Delete o bloco `describe('graphDefenseTest', ...)` (linhas 366-375 lidas nesta sessão).

- [ ] **Step 5: Atualizar o teste de "alvos contextuais de reação"**

O teste em `abilityGraphAction.test.ts` (linhas 212-235 lidas nesta sessão) usa um nó `teste_defesa` no grafo de exemplo. Substitua por um nó `teste`:

```ts
    it('permite que uma reação cause dano no atacante original sem ferir o defensor', () => {
      const graph: AbilityGraph = {
        ...createAbilityGraph({ id: 'contra', name: 'Contra' }),
        nodes: [
          { id: 'g', type: 'ao_ser_alvejado', family: 'gatilho', props: {} },
          { id: 'teste', type: 'teste', family: 'ramo', props: { dice: '1d20', comparador: 'valor_fixo', valorFixo: 0, modificador: 0 } },
          { id: 'alvo-atacante', type: 'alvo', family: 'alvo', props: { scope: 'atacante_original' } },
          { id: 'dano', type: 'dano', family: 'efeito', props: { dice: undefined, flat: 5, element: 'fisico' } },
        ],
        edges: [
          { id: 'e1', from: 'g', to: 'teste' },
          { id: 'e2', from: 'teste', to: 'alvo-atacante', branch: 'entao' },
          { id: 'e3', from: 'alvo-atacante', to: 'dano' },
        ],
      };
      const defender = actor({ id: 'def', name: 'Defensor', currentHp: 30 });
      const attacker = target({ id: 'atk', name: 'Atacante', currentHp: 30 });
      const res = resolveAbilityGraphAction({ graph, level: 1, actor: defender, targets: [defender], additionalTargets: [attacker], roller: () => 10 });
      expect(res.actor.currentHp).toBe(30);
      expect(res.targets.find(t => t.id === 'def')?.currentHp).toBe(30);
      expect(res.additionalTargets.find(t => t.id === 'atk')?.currentHp).toBe(25);
    });
```

(nota: este teste depende da Task A4 já estar implementada, pois usa `branch: 'entao'` num nó `ramo` dentro de `resolveAbilityGraphAction` — se você está seguindo as tasks em ordem, aplique este Step 5 só depois de concluir a Task A4; se a task-runner exigir passar os testes a cada task, adie este Step 5 para o final da Task A4 em vez de aqui.)

- [ ] **Step 6: Rodar os testes**

Rode: `npx vitest run utils/nodes/coreNodes.test.ts utils/abilityGraphAction.test.ts`
Esperado: PASS (exceto o teste do Step 5, que só fecha após a Task A4 — pule-o por ora com `.skip` se necessário e remova o skip na Task A4).

- [ ] **Step 7: Commit**

```bash
git add -u
git commit -m "refactor(grafo): remove teste_defesa e graphDefenseTest (substituídos pelo nó teste)"
```

---

### Task A4: `resolveAbilityGraphAction` interpreta por alvo usando `hitTest`

Esta é a mudança estrutural central: em vez de rolar `header.testDice` uma vez para todos os alvos antes do walk, cada alvo passa pelo walk individualmente e `result.hitTest` (vindo do nó `teste`, se presente na árvore) decide se ele é hit ou miss. Ausência de nó `teste` na árvore = sempre hit (mesma semântica do antigo `testDice: null`).

**Files:**
- Modify: `utils/abilityGraph.ts:27-41` (remove `testDice` de `AbilityHeader`)
- Modify: `utils/abilityGraph.ts:65-77` (remove `testDice: null` do default de `createAbilityGraph`)
- Modify: `utils/abilityGraphAction.ts:115-209` (`resolveAbilityGraphAction`)
- Modify: `utils/abilityGraphAction.test.ts` (ajustar fixtures que usam `testDice`)
- Modify: `utils/abilityGraph.test.ts` (se referenciar `testDice`, grep antes)

- [ ] **Step 1: Grep por `testDice` para mapear todos os usos**

Rode: `grep -rn "testDice" --include="*.ts" --include="*.tsx" .`
Espera-se encontrar: `utils/abilityGraph.ts` (tipo + default), `utils/abilityGraphAction.ts` (leitura em `resolveAbilityGraphAction`), `components/arsenal/graph/GraphEditor.tsx:88` (campo "Rolagem inicial" — tratado na Task A5), `utils/abilityDescribe.ts:44` (tratado na Task A6), e fixtures em `utils/abilityGraphAction.test.ts`.

- [ ] **Step 2: Remover `testDice` de `AbilityHeader` e do default**

Em `utils/abilityGraph.ts`, remova a linha `testDice: string | null;` (e seu comentário acima) da interface `AbilityHeader`, e remova `testDice: null,` do objeto default dentro de `createAbilityGraph`.

- [ ] **Step 3: Escrever os testes que descrevem o novo comportamento em `abilityGraphAction.test.ts`**

Substitua os dois testes existentes que usam `testDice` (linhas 53-66 lidas nesta sessão — "com testDice, erra..." e "com testDice, acerta...") e o de `defenseBonus` (linhas 201-209) por versões que usam um nó `teste` na árvore:

```ts
function danoComTesteGraph(comparador: 'defesa_alvo' | 'valor_fixo' = 'defesa_alvo', valorFixo = 0): AbilityGraph {
  return {
    ...createAbilityGraph({ id: 'golpe-teste', name: 'Golpe com teste' }),
    nodes: [
      { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
      { id: 'teste', type: 'teste', family: 'ramo', props: { dice: '1d20', comparador, valorFixo, modificador: 0 } },
      { id: 'd', type: 'dano', family: 'efeito', props: { dice: undefined, flat: 6, element: 'fisico' } },
    ],
    edges: [
      { id: 'e1', from: 'g', to: 'teste' },
      { id: 'e2', from: 'teste', to: 'd', branch: 'entao' },
    ],
  };
}

  it('com nó teste, erra quando a rolagem é menor que a defesa do alvo', () => {
    const res = resolveAbilityGraphAction({ graph: danoComTesteGraph(), level: 1, actor: actor(), targets: [target({ defense: 99 })], roller: () => 5 });
    expect(res.hitTargetIds).toEqual([]);
    expect(res.targets[0].currentHp).toBe(30); // não sofreu dano
  });

  it('com nó teste, acerta quando a rolagem é maior ou igual à defesa', () => {
    const res = resolveAbilityGraphAction({ graph: danoComTesteGraph(), level: 1, actor: actor(), targets: [target({ defense: 5 })], roller: () => 10 });
    expect(res.hitTargetIds).toEqual(['t']);
    expect(res.targets[0].currentHp).toBe(24);
  });

  it('sem nó teste, sempre acerta (comportamento padrão preservado)', () => {
    const res = resolveAbilityGraphAction({ graph: danoGraph(), level: 1, actor: actor(), targets: [target()], roller: () => 0 });
    expect(res.status).toBe('concluida');
    expect(res.hitTargetIds).toEqual(['t']);
  });

  it('testa cada alvo individualmente: um alvo pode acertar e outro errar na mesma ação', () => {
    const res = resolveAbilityGraphAction({
      graph: danoComTesteGraph(),
      level: 1,
      actor: actor(),
      targets: [target({ id: 't1', defense: 5 }), target({ id: 't2', defense: 15 })],
      roller: () => 10,
    });
    expect(res.hitTargetIds.sort()).toEqual(['t1']);
    expect(res.targets.find(t => t.id === 't1')!.currentHp).toBe(24); // acertou
    expect(res.targets.find(t => t.id === 't2')!.currentHp).toBe(30); // errou, sem dano
  });

  describe('defenseBonus (proteção/reação)', () => {
    it('soma defenseBonus à defesa do alvo no teste de acerto', () => {
      const graph = danoComTesteGraph();
      const semBonus = resolveAbilityGraphAction({ graph, level: 1, actor: actor(), targets: [target({ defense: 10 })], roller: () => 10 });
      expect(semBonus.hitTargetIds).toEqual(['t']); // 10 >= 10, acerta

      const comBonus = resolveAbilityGraphAction({ graph, level: 1, actor: actor(), targets: [target({ defense: 10 })], roller: () => 10, defenseBonus: 5 });
      expect(comBonus.hitTargetIds).toEqual([]); // 10 >= 15 falso, erra
    });
  });
```

Remova também `rolls.test` das expectativas de qualquer teste que ainda o cheque (o campo `rolls: { test?: number }` deixa de ter sentido — trate no Step 5 abaixo).

- [ ] **Step 4: Rodar para confirmar a falha**

Rode: `npx vitest run utils/abilityGraphAction.test.ts`
Esperado: FAIL nos novos testes (o motor ainda usa `header.testDice`, que não existe mais no tipo, e não itera por alvo).

- [ ] **Step 5: Reescrever `resolveAbilityGraphAction`**

Em `utils/abilityGraphAction.ts`, substitua o bloco a partir de `const defenseBonus = request.defenseBonus ?? 0;` (linha 147) até o fim do `for` de combos (linha 181) por:

```ts
  const defenseBonus = request.defenseBonus ?? 0;
  const passesForTarget = (single: ArsenalActorState) => [
    { graph: request.graph, level: request.level },
    ...combos,
  ];

  let passActor = actor;
  const trace: TraceStep[] = [];
  const ongoingEffectIntents: { targetId: string; casterId: string; rounds: number }[] = [];
  const isCombo = combos.length > 0;
  const hitTargetIds: string[] = [];
  const resultTargetById = new Map<string, ArsenalActorState>();
  let currentAdditionalTargets = additionalTargets;

  for (const originalTarget of targets) {
    let currentTarget = originalTarget;
    let hit = true;
    for (const pass of passesForTarget(originalTarget)) {
      const passResult = interpretAbility(pass.graph, pass.level, {
        actor: passActor, primaryTargets: [currentTarget], allTargets: [passActor, ...targets, ...currentAdditionalTargets], roller,
      });
      hit = hit && (passResult.hitTest ?? true);
      passActor = passResult.actor;
      currentTarget = passResult.targets.find(rt => rt.id === currentTarget.id) ?? currentTarget;
      currentAdditionalTargets = currentAdditionalTargets.map(t => passResult.targets.find(rt => rt.id === t.id) ?? t);
      trace.push(...passResult.trace);
      ongoingEffectIntents.push(...passResult.ongoingEffectIntents);

      if (isCombo) {
        const comboResult = interpretAbility(pass.graph, pass.level, {
          actor: passActor, primaryTargets: [currentTarget], allTargets: [passActor, ...targets, ...currentAdditionalTargets], roller,
        }, { entryNodeIds: findEntryNodeIds(pass.graph, pass.level, 'em_combo') });
        passActor = comboResult.actor;
        currentTarget = comboResult.targets.find(rt => rt.id === currentTarget.id) ?? currentTarget;
        currentAdditionalTargets = currentAdditionalTargets.map(t => comboResult.targets.find(rt => rt.id === t.id) ?? t);
        trace.push(...comboResult.trace);
        ongoingEffectIntents.push(...comboResult.ongoingEffectIntents);
      }
    }
    if (hit) hitTargetIds.push(originalTarget.id);
    resultTargetById.set(originalTarget.id, currentTarget);
  }
  additionalTargets.splice(0, additionalTargets.length, ...currentAdditionalTargets);
```

Note que este bloco introduz uma chamada a `findEntryNodeIds` (implementada na Task B3/B4 — ver adiante) no lugar do antigo `opts.rootType: 'em_combo'`. **Se você está executando as tasks em ordem estrita**, adie a linha do combo (`if (isCombo) { ... }`) para depois da Task B4, deixando por ora (nesta task) o combo simplesmente reutilizando `opts: { rootType: 'em_combo' }` como estava — a assinatura `opts.rootType` só é removida na Task B3. Ou seja: nesta Task A4, mantenha `{ rootType: 'em_combo' }` inalterado; a troca para `entryNodeIds` acontece só na Task B4.

Depois, no fim da função, troque o bloco de retorno (linhas ~192-208) por:

```ts
  if (holding) {
    const cooldown = graphCooldown(request.graph, request.level);
    if (cooldown.type !== 'sem_cooldown') {
      holding.cooldownRemaining = cooldown.type === 'turnos' || cooldown.type === 'rodadas' || cooldown.type === 'usos'
        ? cooldown.amount : 1;
    }
    if (header.charges) holding.currentCharges = Math.max(0, (holding.currentCharges ?? header.charges.current) - 1);
  }

  const resultTargets = targets.map(t => resultTargetById.get(t.id)!);

  return {
    status: 'concluida',
    actor: { ...passActor, holdings: actor.holdings },
    targets: resultTargets,
    rolls: {},
    hitTargetIds,
    defeatedIds: resultTargets.filter(t => t.currentHp <= 0).map(t => t.id),
    trace,
    fieldEffects: [],
    ongoingEffectIntents,
    additionalTargets,
  };
```

Remova o campo `test?: number` de `rolls` na interface `AbilityGraphActionResult` (linha 31), já que não há mais uma rolagem única de acerto — vira `rolls: Record<string, never>` ou simplesmente `rolls: {}` (ajuste o tipo para `rolls: {}`).

- [ ] **Step 6: Rodar e confirmar que passa**

Rode: `npx vitest run utils/abilityGraphAction.test.ts`
Esperado: PASS em todos os testes (exceto o skip pendente da Task A3/Step 5 combinado com Task A4, que deve ser reativado agora — remova o `.skip`).

- [ ] **Step 7: Rodar a suíte completa do domínio de grafo**

Rode: `npx vitest run utils/ability* utils/nodes components/arsenal/graph`
Esperado: PASS. Corrija qualquer fixture remanescente que ainda referencie `testDice` (será erro de tipo do TypeScript, não só teste — rode também `npx tsc --noEmit` e resolva os erros apontados).

- [ ] **Step 8: Commit**

```bash
git add -u
git commit -m "feat(grafo): resolveAbilityGraphAction testa acerto por alvo via nó teste (remove header.testDice)"
```

---

### Task A5: Remover o campo "Rolagem inicial" do `GraphEditor`

**Files:**
- Modify: `components/arsenal/graph/GraphEditor.tsx:87-89`
- Modify: `components/arsenal/graph/GraphEditor.test.tsx` (grep por "Rolagem inicial")

- [ ] **Step 1: Grep pelo campo na suíte de testes do editor**

Rode: `grep -rn "Rolagem inicial\|testDice" components/arsenal/graph`
Ajuste/remova qualquer asserção de teste que dependa desse campo do header.

- [ ] **Step 2: Remover o bloco JSX**

Em `components/arsenal/graph/GraphEditor.tsx`, remova:

```tsx
          <div style={{ minWidth: 220 }}>
            <DiceFormulaInput label="Rolagem inicial" value={graph.header.testDice} allowEmpty onChange={testDice => patchHeader({ testDice })} />
          </div>
```

(linhas 87-89 lidas nesta sessão). Se `DiceFormulaInput` não for mais usado em nenhum outro lugar deste arquivo, remova também o import na linha 13 — confira com `grep -n "DiceFormulaInput" components/arsenal/graph/GraphEditor.tsx` antes de remover o import (o NodeInspector e o NodePalette também importam esse componente separadamente, então remover o import aqui não afeta os outros arquivos).

- [ ] **Step 3: Rodar os testes do editor**

Rode: `npx vitest run components/arsenal/graph/GraphEditor.test.tsx`
Esperado: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/arsenal/graph/GraphEditor.tsx
git commit -m "refactor(grafo): remove campo de rolagem inicial do cabeçalho do editor"
```

---

### Task A6: Atualizar `abilityDescribe.ts` (remove menção a `testDice`)

**Files:**
- Modify: `utils/abilityDescribe.ts:44-48`
- Modify: `utils/abilityDescribe.test.ts`

- [ ] **Step 1: Escrever/ajustar o teste**

Abra `utils/abilityDescribe.test.ts`, localize qualquer teste que monte um grafo com `header.testDice` esperando a frase "realiza um teste de ...". Substitua o fixture para usar um nó `teste` na árvore e ajuste a expectativa para a frase gerada pelo `walk()` genérico de um `ramo` (ex.: `"Quando a habilidade é usada, Teste: 1d20 vs. defesa do alvo: Dano ..."`, formato exato depende do `summarize` do nó `teste` implementado na Task A1 — rode o teste após o Step 2 abaixo e ajuste a string esperada para bater com a saída real).

- [ ] **Step 2: Remover a lógica de `testClause`**

Em `utils/abilityDescribe.ts`, remova:

```ts
  const testClause = graph.header.testDice ? `realiza um teste de ${graph.header.testDice} contra o alvo` : null;
  const parts = [testClause, ...clauses].filter((c): c is string => !!c);
```

e substitua por:

```ts
  const parts = clauses;
```

(o nó `teste`, por ser família `ramo`, já é descrito automaticamente pela função `walk()` existente no mesmo arquivo — nenhuma outra mudança é necessária aqui.)

- [ ] **Step 3: Rodar e ajustar**

Rode: `npx vitest run utils/abilityDescribe.test.ts`
Esperado: PASS após ajustar as strings esperadas conforme o Step 1.

- [ ] **Step 4: Commit**

```bash
git add utils/abilityDescribe.ts utils/abilityDescribe.test.ts
git commit -m "refactor(grafo): descrição textual do grafo não menciona mais header.testDice"
```

---

## Fase B — Triggers encadeáveis

### Task B1: `removeNode` permite remover qualquer trigger exceto a raiz real do grafo

**Files:**
- Modify: `utils/abilityGraphEdit.ts:19-42`
- Modify: `utils/abilityGraphEdit.test.ts`

- [ ] **Step 1: Escrever os testes que descrevem a nova regra**

Em `utils/abilityGraphEdit.test.ts`, substitua o teste `'removeNode remove o nó e sua subárvore, mas não a raiz-gatilho'` (linhas 30-42 lidas nesta sessão) por:

```ts
  it('removeNode remove o nó e sua subárvore, mas não a raiz de fato do grafo (sem pais)', () => {
    const base = createAbilityGraph({ id: 'a', name: 'X' });
    const rootId = base.nodes[0].id;
    const { graph: g1, nodeId: n1 } = addNode(base, rootId, 'dano');
    const { graph: g2, nodeId: n2 } = addNode(g1, n1, 'cura');
    const g3 = removeNode(g2, n1);
    expect(g3.nodes.some(n => n.id === n1)).toBe(false);
    expect(g3.nodes.some(n => n.id === n2)).toBe(false);
    expect(g3.edges).toEqual([]);

    const g4 = removeNode(g3, rootId);
    expect(g4.nodes.some(n => n.id === rootId)).toBe(true); // raiz de fato preservada (no-op)
  });

  it('removeNode permite remover um trigger secundário conectado como filho de outro nó', () => {
    const base = createAbilityGraph({ id: 'a', name: 'X' });
    const rootId = base.nodes[0].id;
    const { graph, nodeId: enquantoId } = addNode(base, rootId, 'enquanto_ativa');
    const next = removeNode(graph, enquantoId);
    expect(next.nodes.some(n => n.id === enquantoId)).toBe(false);
  });

  it('removeNode permite remover uma raiz secundária solta (sem pais, mas não a única raiz)', () => {
    const base = createAbilityGraph({ id: 'a', name: 'X' });
    const withSecondary = addSecondaryTrigger(base, 'em_combo');
    const secondaryId = withSecondary.nodes.find(n => n.type === 'em_combo')!.id;
    const next = removeNode(withSecondary, secondaryId);
    expect(next.nodes.some(n => n.id === secondaryId)).toBe(false);
    expect(next.nodes.some(n => n.type === 'ao_ativar')).toBe(true); // a raiz principal continua lá
  });
```

Adicione `addSecondaryTrigger` ao import do topo do arquivo (linha 5).

- [ ] **Step 2: Rodar e confirmar a falha**

Rode: `npx vitest run utils/abilityGraphEdit.test.ts`
Esperado: FAIL no segundo novo teste (`addNode(base, rootId, 'enquanto_ativa')` tenta conectar um trigger como filho, o que hoje funciona estruturalmente via `addNode` genérico — mas `removeNode` ainda bloqueia por família `gatilho`, então a remoção falha).

- [ ] **Step 3: Reescrever a regra em `removeNode`**

Em `utils/abilityGraphEdit.ts`, substitua:

```ts
/** Nós de gatilho que são raízes secundárias opcionais — podem ser removidos como qualquer outro nó. */
const SECONDARY_TRIGGER_TYPES = new Set(['enquanto_ativa', 'em_combo']);

/** Remove um nó e toda a subárvore alcançável a partir dele. No-op se `nodeId` for a raiz-gatilho primária
 * (as raízes secundárias são opcionais e podem ser removidas como qualquer outro nó). */
export function removeNode(graph: AbilityGraph, nodeId: string): AbilityGraph {
  const target = graph.nodes.find(n => n.id === nodeId);
  if (!target || (target.family === 'gatilho' && !SECONDARY_TRIGGER_TYPES.has(target.type))) return graph;
```

por:

```ts
/** Um nó é a raiz de fato do grafo se nenhuma aresta aponta para ele. */
function isStructuralRoot(graph: AbilityGraph, nodeId: string): boolean {
  return !graph.edges.some(e => e.to === nodeId);
}

/** Remove um nó e toda a subárvore alcançável a partir dele. No-op se `nodeId` for a raiz estrutural
 * do grafo (o único nó sem pais que serve de ponto de entrada da ação) — qualquer outro nó,
 * incluindo triggers secundários ou triggers pendurados como filhos, pode ser removido normalmente. */
export function removeNode(graph: AbilityGraph, nodeId: string): AbilityGraph {
  const target = graph.nodes.find(n => n.id === nodeId);
  if (!target) return graph;
  if (target.family === 'gatilho' && isStructuralRoot(graph, nodeId)) return graph;
```

(o corpo da função continua igual a partir da linha `const toRemove = new Set<string>([nodeId]);`.)

- [ ] **Step 4: Rodar e confirmar que passa**

Rode: `npx vitest run utils/abilityGraphEdit.test.ts`
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/abilityGraphEdit.ts utils/abilityGraphEdit.test.ts
git commit -m "feat(grafo): removeNode usa raiz estrutural (sem pais) em vez de família gatilho"
```

---

### Task B2: `addNode` aceita conectar um tipo de trigger como filho de qualquer nó (via UI)

`addNode` já é genérico (Task exploratória confirmou: não restringe por família). O que falta é a **paleta** permitir escolher um trigger quando há uma `pendingConnection` ativa, e não só nos dois fluxos dedicados (`onPickTrigger`/`onAddSecondaryTrigger`).

**Files:**
- Modify: `components/arsenal/graph/NodePalette.tsx`
- Modify: `components/arsenal/graph/NodePalette.test.tsx`

- [ ] **Step 1: Ler o teste atual da paleta**

Leia `components/arsenal/graph/NodePalette.test.tsx` por completo antes de editar, para seguir o padrão de queries/assertions já usado (ex. `render`, `screen.getByRole`, etc.).

- [ ] **Step 2: Escrever o teste que descreve o novo botão**

Adicione a `components/arsenal/graph/NodePalette.test.tsx` um teste cobrindo: quando há `pendingConnection`, os triggers (inclusive os "secundários" `enquanto_ativa`/`em_combo`) aparecem também na lista clicável via `onPick` (não só via `onPickTrigger`/`onAddSecondaryTrigger`). Use o padrão de render já existente no arquivo; um esqueleto de asserção:

```tsx
it('com pendingConnection ativa, permite conectar um trigger como filho via onPick', () => {
  const onPick = vi.fn();
  render(
    <NodePalette
      pendingConnection={{ parentId: 'algum-id' }}
      onPick={onPick}
      onLoadTemplate={vi.fn()}
      onPickTrigger={vi.fn()}
      onAddSecondaryTrigger={vi.fn()}
      onWizardBuild={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Enquanto ativa/i }));
  expect(onPick).toHaveBeenCalledWith('enquanto_ativa');
});
```

(ajuste `render`/`fireEvent`/`screen` imports conforme o que o arquivo já usa — provavelmente `@testing-library/react`.)

- [ ] **Step 3: Rodar e confirmar a falha**

Rode: `npx vitest run components/arsenal/graph/NodePalette.test.tsx`
Esperado: FAIL — o botão "Enquanto ativa" hoje só existe na seção "Raiz secundária" chamando `onAddSecondaryTrigger`, não `onPick`.

- [ ] **Step 4: Adicionar uma seção "Evento" clicável via `onPick` quando há `pendingConnection`**

Em `NodePalette.tsx`, adicione, logo após o bloco `{!!secondaryTriggers.length && <>...</>}` (linha ~126), uma nova seção que reaproveita `allTriggers` para oferecer conexão via `onPick` quando houver `pendingConnection`:

```tsx
      {!!pendingConnection && !!allTriggers.length && <>
        <div style={sectionTitle}>Evento (conectar como filho) · {allTriggers.length}</div>
        {allTriggers.map(def => (
          <button key={`child-${def.type}`} type="button" style={familyButtonStyle('gatilho')} onClick={() => onPick(def.type)} title={def.summarize({})}>
            <Zap size={12} /> {def.label}
          </button>
        ))}
      </>}
```

Isso não substitui as duas seções existentes (que continuam servindo para trocar/anexar raízes soltas) — apenas adiciona uma terceira via, só visível quando há uma conexão pendente, para pendurar um trigger como filho de qualquer nó do canvas.

- [ ] **Step 5: Rodar e confirmar que passa**

Rode: `npx vitest run components/arsenal/graph/NodePalette.test.tsx`
Esperado: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/arsenal/graph/NodePalette.tsx components/arsenal/graph/NodePalette.test.tsx
git commit -m "feat(grafo): permite conectar um trigger como filho de qualquer nó via paleta"
```

---

### Task B3: Descoberta de raiz estrutural + `entryNodeIds` no motor de interpretação

**Files:**
- Modify: `utils/abilityInterpreter.ts:52-118`
- Modify: `utils/abilityInterpreter.test.ts`

- [ ] **Step 1: Escrever os testes que descrevem o novo comportamento**

Adicione a `utils/abilityInterpreter.test.ts`:

```ts
  it('descobre a raiz estruturalmente (nó sem arestas de entrada), não por família/tipo', () => {
    const g: AbilityGraph = {
      ...createAbilityGraph({ id: 'g3', name: 'Estrutural' }),
      nodes: [
        { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
        { id: 'd', type: 'dano', family: 'efeito', props: { dice: undefined, flat: 4, element: 'fisico' } },
      ],
      edges: [{ id: 'e1', from: 'g', to: 'd' }],
    };
    const res = interpretAbility(g, 1, { actor: actor(), primaryTargets: [enemy()], allTargets: [actor(), enemy()], roller: () => 0 });
    expect(res.targets.find(t => t.id === 'e')!.currentHp).toBe(26);
  });

  it('com entryNodeIds explícito, inicia o walk a partir dos nós indicados (ignorando a raiz estrutural)', () => {
    const g: AbilityGraph = {
      ...createAbilityGraph({ id: 'g4', name: 'Entrada explícita' }),
      nodes: [
        { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
        { id: 'd1', type: 'dano', family: 'efeito', props: { dice: undefined, flat: 4, element: 'fisico' } },
        { id: 'evt', type: 'enquanto_ativa', family: 'gatilho', props: {} },
        { id: 'd2', type: 'dano', family: 'efeito', props: { dice: undefined, flat: 9, element: 'fisico' } },
      ],
      edges: [
        { id: 'e1', from: 'g', to: 'd1' },
        { id: 'e2', from: 'd1', to: 'evt' },
        { id: 'e3', from: 'evt', to: 'd2' },
      ],
    };
    const res = interpretAbility(g, 1, { actor: actor(), primaryTargets: [enemy()], allTargets: [actor(), enemy()], roller: () => 0 }, { entryNodeIds: ['evt'] });
    // só o dano do nó 'd2' (pendurado sob 'evt') deve ter rodado, não o 'd1' da raiz principal
    expect(res.targets.find(t => t.id === 'e')!.currentHp).toBe(21);
  });
```

- [ ] **Step 2: Rodar e confirmar a falha**

Rode: `npx vitest run utils/abilityInterpreter.test.ts`
Esperado: o primeiro teste já passa (comportamento coincide com o atual); o segundo falha, porque `opts.entryNodeIds` ainda não existe (a função só aceita `opts?.rootType`).

- [ ] **Step 3: Reescrever a descoberta de raiz e o suporte a múltiplas entradas**

Em `utils/abilityInterpreter.ts`, troque a assinatura de `interpretAbility` (linha 52):

```ts
export function interpretAbility(graph: AbilityGraph, level: number, input: InterpretInput, opts?: { entryNodeIds?: string[] }): AbilityResult {
```

E troque a descoberta de raiz (linha 90):

```ts
  const root = merged.nodes.find(n => n.family === 'gatilho' && (opts?.rootType ? n.type === opts.rootType : n.type !== 'enquanto_ativa'));
  if (!root) return { actor: ctx.actor, targets: [...byId.values()].filter(a => a.id !== ctx.actor.id), trace: ctx.trace, ongoingEffectIntents: [] };
```

por:

```ts
  const structuralRoots = opts?.entryNodeIds
    ? opts.entryNodeIds.map(id => nodeById.get(id)).filter((n): n is GraphNode => !!n)
    : merged.nodes.filter(n => !merged.edges.some(e => e.to === n.id));
  const entryPoints = opts?.entryNodeIds
    ? structuralRoots
    : structuralRoots.filter(n => n.type !== 'enquanto_ativa' && n.type !== 'em_combo');
  if (!entryPoints.length) return { actor: ctx.actor, targets: [...byId.values()].filter(a => a.id !== ctx.actor.id), trace: ctx.trace, ongoingEffectIntents: [] };
```

(o filtro `n.type !== 'enquanto_ativa' && n.type !== 'em_combo'` no caso padrão preserva o comportamento atual de "ignorar raízes secundárias soltas ao rodar a ação principal" — quem quiser rodar `enquanto_ativa`/`em_combo` explicitamente passa `entryNodeIds`.)

E troque a chamada final do walk (linha 109, `walk(root);`) por:

```ts
  for (const entry of entryPoints) walk(entry);
```

- [ ] **Step 4: Ajustar `nodeById` para ser declarado antes do uso em `structuralRoots`**

Confirme que `const nodeById = new Map(merged.nodes.map(n => [n.id, n]));` (linha 86) já está declarado **antes** do novo bloco de `structuralRoots`/`entryPoints` — no arquivo lido nesta sessão já está nessa ordem, então nenhuma reordenação é necessária, apenas confirme ao editar.

- [ ] **Step 5: Rodar e confirmar que passa**

Rode: `npx vitest run utils/abilityInterpreter.test.ts`
Esperado: PASS em ambos os novos testes.

- [ ] **Step 6: Rodar toda a suíte de grafo (breakage de `opts.rootType`)**

Rode: `npx tsc --noEmit` — isso vai apontar todo chamador que ainda passa `{ rootType: ... }`, que agora é um erro de tipo (a opção não existe mais). Os chamadores esperados são `runOngoingEffect` e o passe de combo `em_combo` em `resolveAbilityGraphAction`, tratados na Task B4 a seguir — **não corrija esses chamadores nesta task**, apenas confirme que os erros apontados são exatamente esses dois pontos (mais nenhum outro).

- [ ] **Step 7: Commit**

```bash
git add utils/abilityInterpreter.ts utils/abilityInterpreter.test.ts
git commit -m "feat(grafo): motor descobre raiz estruturalmente e aceita entryNodeIds explícito"
```

---

### Task B4: Atualizar os chamadores de `rootType` para `entryNodeIds`

**Files:**
- Modify: `utils/abilityGraphAction.ts` (`runOngoingEffect`, passe de combo em `resolveAbilityGraphAction`)
- Modify: `utils/abilityGraphAction.test.ts` (reativar o teste adiado na Task A4/Step 5)

- [ ] **Step 1: Adicionar um helper para achar o nó de um tipo de trigger específico**

Em `utils/abilityGraphAction.ts`, adicione (perto de `graphComboConfig`, já que resolve um conceito parecido):

```ts
/** Acha o id do nó de trigger de um tipo específico no grafo mesclado, para uso como entryNodeIds. */
function findEntryNodeIds(graph: AbilityGraph, level: number, triggerType: string): string[] {
  const node = mergeLevel(graph, level).nodes.find(n => n.type === triggerType);
  return node ? [node.id] : [];
}
```

- [ ] **Step 2: Atualizar `runOngoingEffect`**

Troque:

```ts
export function runOngoingEffect(
  graph: AbilityGraph, level: number, owner: ArsenalActorState, roller: (notation: string) => number,
) {
  return interpretAbility(graph, level, { actor: owner, primaryTargets: [owner], allTargets: [owner], roller }, { rootType: 'enquanto_ativa' });
}
```

por:

```ts
export function runOngoingEffect(
  graph: AbilityGraph, level: number, owner: ArsenalActorState, roller: (notation: string) => number,
) {
  return interpretAbility(graph, level, { actor: owner, primaryTargets: [owner], allTargets: [owner], roller }, { entryNodeIds: findEntryNodeIds(graph, level, 'enquanto_ativa') });
}
```

- [ ] **Step 3: Atualizar o passe de combo em `resolveAbilityGraphAction`**

Dentro do bloco `if (isCombo) { ... }` escrito na Task A4/Step 5, troque `{ rootType: 'em_combo' }` por `{ entryNodeIds: findEntryNodeIds(pass.graph, pass.level, 'em_combo') }` (se a Task A4 foi seguida à risca deixando esse trecho pendente, implemente-o agora com essa forma final).

- [ ] **Step 4: Reativar o teste adiado**

Volte ao teste `'roda o ramo "em_combo" do grafo base além do fluxo principal quando usada com companheiras'` em `utils/abilityGraphAction.test.ts` (linhas 182-198 lidas nesta sessão) e remova qualquer `.skip` que tenha sido adicionado durante a Task A3/A4. Rode-o isoladamente:

Rode: `npx vitest run utils/abilityGraphAction.test.ts -t "em_combo"`
Esperado: PASS.

- [ ] **Step 5: Rodar `tsc` e a suíte completa**

Rode: `npx tsc --noEmit && npx vitest run utils/ability* utils/nodes components/arsenal/graph`
Esperado: sem erros de tipo, todos os testes passando.

- [ ] **Step 6: Commit**

```bash
git add utils/abilityGraphAction.ts utils/abilityGraphAction.test.ts
git commit -m "refactor(grafo): runOngoingEffect e combos usam entryNodeIds em vez de rootType"
```

---

### Task B5: Trigger alcançado como filho (não como ponto de entrada) registra reação pendente em vez de executar

**Files:**
- Modify: `utils/abilityInterpreter.ts` (`InterpretCtx`, `AbilityResult`, `walk`)
- Modify: `utils/abilityInterpreter.test.ts`

- [ ] **Step 1: Escrever o teste que descreve o comportamento**

```ts
  it('um trigger alcançado como filho (não como entrada) registra reação pendente em vez de executar', () => {
    const g: AbilityGraph = {
      ...createAbilityGraph({ id: 'g5', name: 'Reação encadeada' }),
      nodes: [
        { id: 'enquanto', type: 'enquanto_ativa', family: 'gatilho', props: {} },
        { id: 'alvejado', type: 'ao_ser_alvejado', family: 'gatilho', props: {} },
        { id: 'd', type: 'dano', family: 'efeito', props: { dice: undefined, flat: 7, element: 'fisico' } },
      ],
      edges: [
        { id: 'e1', from: 'enquanto', to: 'alvejado' },
        { id: 'e2', from: 'alvejado', to: 'd' },
      ],
    };
    // roda a árvore 'enquanto_ativa' como entrada: o filho 'alvejado' não deve executar 'd' imediatamente,
    // deve só registrar a reação pendente.
    const res = interpretAbility(g, 1, { actor: actor(), primaryTargets: [enemy()], allTargets: [actor(), enemy()], roller: () => 0 }, { entryNodeIds: ['enquanto'] });
    expect(res.targets.find(t => t.id === 'e')!.currentHp).toBe(30); // dano NÃO aplicado ainda
    expect(res.pendingReactions).toEqual([{ eventType: 'ao_ser_alvejado', nodeIds: ['d'] }]);
  });

  it('o mesmo trigger, quando é o próprio ponto de entrada, executa normalmente', () => {
    const g: AbilityGraph = {
      ...createAbilityGraph({ id: 'g6', name: 'Reação direta' }),
      nodes: [
        { id: 'alvejado', type: 'ao_ser_alvejado', family: 'gatilho', props: {} },
        { id: 'd', type: 'dano', family: 'efeito', props: { dice: undefined, flat: 7, element: 'fisico' } },
      ],
      edges: [{ id: 'e1', from: 'alvejado', to: 'd' }],
    };
    const res = interpretAbility(g, 1, { actor: actor(), primaryTargets: [enemy()], allTargets: [actor(), enemy()], roller: () => 0 });
    expect(res.targets.find(t => t.id === 'e')!.currentHp).toBe(23);
    expect(res.pendingReactions ?? []).toEqual([]);
  });
```

- [ ] **Step 2: Rodar e confirmar a falha**

Rode: `npx vitest run utils/abilityInterpreter.test.ts`
Esperado: FAIL no primeiro novo teste (hoje `walk()` não distingue trigger-como-entrada de trigger-como-filho; ambos apenas passam para os filhos sem side-effect, então o dano de 7 é aplicado sempre, e `res.pendingReactions` não existe).

- [ ] **Step 3: Adicionar `pendingReactions` a `InterpretCtx` e `AbilityResult`**

Em `InterpretCtx` (perto de `hitTest?: boolean;` adicionado na Task A1):

```ts
  /** Reações registradas por triggers alcançados como filhos (não como ponto de entrada) durante este walk. */
  pendingReactions?: { eventType: string; nodeIds: string[] }[];
```

Em `AbilityResult`:

```ts
  pendingReactions?: { eventType: string; nodeIds: string[] }[];
```

- [ ] **Step 4: Inicializar `pendingReactions` no ctx e copiar no retorno**

No objeto `ctx` construído em `interpretAbility` (perto de `trace: [],`), adicione `pendingReactions: [],`. No retorno final da função, adicione `pendingReactions: ctx.pendingReactions,`.

- [ ] **Step 5: Ajustar `walk` para distinguir entrada de filho**

O `walk` precisa saber se o nó atual é um ponto de entrada desta chamada. Troque a assinatura interna e o corpo (a partir da linha 94 lida nesta sessão):

```ts
  const entryIds = new Set(entryPoints.map(n => n.id));
  const visited = new Set<string>();
  const walk = (node: GraphNode | undefined) => {
    if (!node || visited.has(node.id)) return;
    visited.add(node.id);
    const def = getNodeType(node.type);
    if (node.family === 'gatilho' && !entryIds.has(node.id)) {
      // trigger alcançado como filho (não como entrada): registra a reação e para o walk aqui.
      const childIds = outgoing(node.id).map(e => e.to);
      if (childIds.length) {
        ctx.pendingReactions = [...(ctx.pendingReactions ?? []), { eventType: node.type, nodeIds: childIds }];
      }
      return;
    }
    if (!def) { ctx.trace.push({ node: node.type, detail: 'nó desconhecido — ignorado' }); }
    else if (node.family === 'ramo' && def.evaluate) {
      const branch = def.evaluate(node.props, ctx) ? 'entao' : 'senao';
      ctx.trace.push({ node: node.type, detail: `→ ${branch}` });
      for (const e of outgoing(node.id, branch)) walk(nodeById.get(e.to));
      return;
    } else if (def.interpret) {
      def.interpret(node.props, ctx);
    }
    for (const e of outgoing(node.id)) walk(nodeById.get(e.to));
  };
  for (const entry of entryPoints) walk(entry);
```

(isso substitui tanto o antigo corpo do `walk` quanto a linha final `walk(root);`/`for (const entry of entryPoints) walk(entry);` escrita na Task B3 — unifique num só bloco.)

- [ ] **Step 6: Rodar e confirmar que passa**

Rode: `npx vitest run utils/abilityInterpreter.test.ts`
Esperado: PASS em todos os testes (incluindo os das Tasks B3 e A1).

- [ ] **Step 7: Rodar a suíte completa do domínio**

Rode: `npx tsc --noEmit && npx vitest run utils/ability* utils/nodes components/arsenal/graph`
Esperado: sem erros.

- [ ] **Step 8: Commit**

```bash
git add utils/abilityInterpreter.ts utils/abilityInterpreter.test.ts
git commit -m "feat(grafo): trigger alcançado como filho registra reação pendente (pendingReactions)"
```

---

### Task B6: Estender `ongoingEffectIntents` com `pendingReactions` (contrato de dados, sem disparo no motor de combate)

Conforme o spec (seção 2, "Efeitos ativos e o motor de combate"), esta task só grava o dado — o disparo real do motor de combate ao processar eventos é trabalho futuro, fora de escopo.

**Files:**
- Modify: `utils/abilityInterpreter.ts` (tipo de `ongoingEffectIntents`)
- Modify: `utils/nodes/coreNodes.ts:63-67` (`aplicar_como_efeito`)
- Modify: `utils/nodes/coreNodes.test.ts`

- [ ] **Step 1: Escrever o teste**

Em `utils/nodes/coreNodes.test.ts`, adicione um teste que constrói um ctx com `pendingReactions` já populado (simulando que, durante o próprio walk da aplicação do efeito, algum trigger-filho pendurado sob o nó `aplicar_como_efeito` já registrou uma reação) e verifica que `aplicar_como_efeito` propaga `ctx.pendingReactions` para dentro do `ongoingEffectIntents` emitido:

```ts
  it('aplicar_como_efeito carrega ctx.pendingReactions para o ongoingEffectIntent emitido', () => {
    const def = getNodeType('aplicar_como_efeito')!;
    const ctx = ctxWith({ pendingReactions: [{ eventType: 'ao_ser_alvejado', nodeIds: ['d'] }] });
    def.interpret!({ alvo: 'proprio', rounds: 3 }, ctx);
    expect(ctx.ongoingEffectIntents?.[0]).toMatchObject({
      pendingReactions: [{ eventType: 'ao_ser_alvejado', nodeIds: ['d'] }],
    });
  });
```

(ajuste `ctxWith` para o helper de contexto já usado em `coreNodes.test.ts` — se o arquivo ainda não tiver um helper assim, siga o padrão de `abilityInterpreter.test.ts` para construir um `InterpretCtx` mínimo.)

- [ ] **Step 2: Rodar e confirmar a falha**

Rode: `npx vitest run utils/nodes/coreNodes.test.ts`
Esperado: FAIL — o campo `pendingReactions` não existe em `ongoingEffectIntents` ainda.

- [ ] **Step 3: Estender o tipo `ongoingEffectIntents`**

Em `utils/abilityInterpreter.ts`, troque toda ocorrência do tipo inline `{ targetId: string; casterId: string; rounds: number }[]` (em `InterpretCtx.ongoingEffectIntents`, `AbilityResult.ongoingEffectIntents`, e o array local dentro de `interpretAbility`) por um tipo nomeado exportado:

```ts
export interface OngoingEffectIntent {
  targetId: string;
  casterId: string;
  rounds: number;
  pendingReactions?: { eventType: string; nodeIds: string[] }[];
}
```

e use `OngoingEffectIntent[]` nos três lugares.

- [ ] **Step 4: Propagar `pendingReactions` em `aplicar_como_efeito`**

Em `utils/nodes/coreNodes.ts`, na função `interpret` do nó `aplicar_como_efeito` (linhas 63-67 lidas nesta sessão), troque:

```ts
    interpret: (p, ctx) => {
      const target = p.alvo === 'proprio' ? ctx.actor : (ctx.scope[0] ?? ctx.actor);
      ctx.ongoingEffectIntents = [...(ctx.ongoingEffectIntents ?? []), { targetId: target.id, casterId: ctx.actor.id, rounds: p.rounds }];
      ctx.trace.push({ node: 'aplicar_como_efeito', detail: `Aplicado como efeito contínuo em ${target.name} por ${p.rounds} rodadas` });
    },
```

por:

```ts
    interpret: (p, ctx) => {
      const target = p.alvo === 'proprio' ? ctx.actor : (ctx.scope[0] ?? ctx.actor);
      ctx.ongoingEffectIntents = [...(ctx.ongoingEffectIntents ?? []), {
        targetId: target.id, casterId: ctx.actor.id, rounds: p.rounds,
        ...(ctx.pendingReactions?.length ? { pendingReactions: ctx.pendingReactions } : {}),
      }];
      ctx.trace.push({ node: 'aplicar_como_efeito', detail: `Aplicado como efeito contínuo em ${target.name} por ${p.rounds} rodadas` });
    },
```

- [ ] **Step 5: Rodar e confirmar que passa**

Rode: `npx vitest run utils/nodes/coreNodes.test.ts utils/abilityInterpreter.test.ts`
Esperado: PASS.

- [ ] **Step 6: Rodar `tsc` para achar outros consumidores do tipo antigo**

Rode: `npx tsc --noEmit`
Corrija qualquer arquivo (ex. lógica de Cena que materializa `ongoingEffectIntents` em `activeOngoingEffects`) que desestruture esse array com um tipo inline em vez de importar `OngoingEffectIntent` — ajuste o import conforme necessário.

- [ ] **Step 7: Commit**

```bash
git add utils/abilityInterpreter.ts utils/nodes/coreNodes.ts utils/nodes/coreNodes.test.ts
git commit -m "feat(grafo): ongoingEffectIntents carrega pendingReactions (contrato de dados p/ motor de combate)"
```

---

### Task B7: `NodeInspector` usa a mesma regra estrutural para exibir "Remover nó"

**Files:**
- Modify: `components/arsenal/graph/NodeInspector.tsx:118`
- Modify: `components/arsenal/graph/NodeInspector.test.tsx`

Hoje o botão é escondido para **toda** a família `gatilho` (`node.family !== 'gatilho'`), mesmo que `removeNode` já permita remover triggers secundários e triggers-filho (Task B1). O Inspector precisa saber se aquele nó é a raiz estrutural do grafo — o que exige receber o grafo completo (ou pelo menos as `edges`), não só o `node` selecionado.

- [ ] **Step 1: Escrever o teste**

Em `components/arsenal/graph/NodeInspector.test.tsx`, adicione (seguindo o padrão de render já existente no arquivo):

```tsx
it('mostra "Remover nó" para um trigger secundário/filho, mas não para a raiz estrutural do grafo', () => {
  const edges = [{ id: 'e1', from: 'raiz', to: 'filho' }];
  const { rerender } = render(
    <NodeInspector node={{ id: 'raiz', type: 'ao_ativar', family: 'gatilho', props: {} }} edges={edges} onChange={vi.fn()} onRemove={vi.fn()} />,
  );
  expect(screen.queryByRole('button', { name: /Remover nó/i })).not.toBeInTheDocument();

  rerender(
    <NodeInspector node={{ id: 'filho', type: 'enquanto_ativa', family: 'gatilho', props: {} }} edges={edges} onChange={vi.fn()} onRemove={vi.fn()} />,
  );
  expect(screen.getByRole('button', { name: /Remover nó/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Rode: `npx vitest run components/arsenal/graph/NodeInspector.test.tsx`
Esperado: FAIL — o componente ainda não aceita a prop `edges` e a regra ainda é `node.family !== 'gatilho'` (esconderia o botão nos dois casos).

- [ ] **Step 3: Adicionar a prop `edges` e a regra estrutural**

Em `components/arsenal/graph/NodeInspector.tsx`, atualize a interface `Props` (linha 8-12):

```ts
interface Props {
  node: GraphNode | null;
  edges: { from: string; to: string }[];
  onChange: (nodeId: string, patch: Record<string, unknown>) => void;
  onRemove: (nodeId: string) => void;
}
```

Atualize a assinatura do componente (linha 86):

```ts
const NodeInspector: React.FC<Props> = ({ node, edges, onChange, onRemove }) => {
```

E troque a condição do botão (linha 118):

```tsx
      {!(node.family === 'gatilho' && !edges.some(e => e.to === node.id)) && (
```

- [ ] **Step 4: Atualizar o único call site em `GraphEditor.tsx`**

Em `components/arsenal/graph/GraphEditor.tsx`, no `<NodeInspector ... />` (linha 134), passe `edges={displayed.edges}`.

- [ ] **Step 5: Rodar e confirmar que passa**

Rode: `npx vitest run components/arsenal/graph/NodeInspector.test.tsx components/arsenal/graph/GraphEditor.test.tsx`
Esperado: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/arsenal/graph/NodeInspector.tsx components/arsenal/graph/GraphEditor.tsx components/arsenal/graph/NodeInspector.test.tsx
git commit -m "fix(grafo): Remover no no Inspector usa a mesma regra estrutural de removeNode"
```

---

## Fase C — Polimento (conectividade real para config nodes + simulador)

### Task C1: `graphCosts`/`graphCooldown`/`graphPreparation`/`graphComboConfig`/`graphFormaVisual` só consideram nós alcançáveis

**Files:**
- Modify: `utils/abilityGraphAction.ts:45-113,218-244`
- Modify: `utils/abilityGraphAction.test.ts`

- [ ] **Step 1: Escrever os testes que expõem o bug atual**

Adicione a `utils/abilityGraphAction.test.ts`, dentro de `describe('graphCosts', ...)`:

```ts
    it('ignora um nó custo desconectado do fluxo (não alcançável a partir da raiz)', () => {
      const base = danoGraph();
      const desconectado: AbilityGraph = {
        ...base,
        nodes: [...base.nodes, { id: 'custo-solto', type: 'custo', family: 'efeito', props: { recurso: 'aura', amount: 99 } }],
      };
      expect(graphCosts(desconectado, 1)).toEqual({ aura: 0, municao: 0, vida: 0 });
    });
```

E um análogo em `describe('graphCooldown', ...)`:

```ts
    it('ignora um nó cooldown desconectado do fluxo', () => {
      const base = danoGraph();
      const desconectado: AbilityGraph = {
        ...base,
        nodes: [...base.nodes, { id: 'cd-solto', type: 'cooldown', family: 'efeito', props: { tipo: 'rodadas', amount: 5 } }],
      };
      expect(graphCooldown(desconectado, 1)).toEqual({ type: 'sem_cooldown' });
    });
```

- [ ] **Step 2: Rodar e confirmar a falha**

Rode: `npx vitest run utils/abilityGraphAction.test.ts -t "desconectado"`
Esperado: FAIL — hoje essas funções acham o nó mesmo desconectado.

- [ ] **Step 3: Adicionar um helper de alcançabilidade e usá-lo nas funções**

Em `utils/abilityGraphAction.ts`, adicione (perto do topo, depois dos imports):

```ts
/** Ids de todos os nós alcançáveis a partir de qualquer raiz estrutural (nó sem arestas de entrada) do grafo mesclado. */
function reachableNodeIds(graph: AbilityGraph): Set<string> {
  const roots = graph.nodes.filter(n => !graph.edges.some(e => e.to === n.id));
  const reachable = new Set<string>(roots.map(r => r.id));
  const queue = [...reachable];
  while (queue.length) {
    const id = queue.pop()!;
    for (const edge of graph.edges) {
      if (edge.from === id && !reachable.has(edge.to)) { reachable.add(edge.to); queue.push(edge.to); }
    }
  }
  return reachable;
}
```

Em seguida, troque cada `merged.nodes.find(n => n.type === '...')` / `merged.nodes.filter(n => n.type === '...')` dentro de `graphCosts`, `graphComboConfig`, `graphCooldown`, `graphPreparation` e `graphFormaVisual` para filtrar primeiro por alcançabilidade. Exemplo para `graphCosts`:

```ts
export function graphCosts(graph: AbilityGraph, level: number): GraphCosts {
  const merged = mergeLevel(graph, level);
  const reachable = reachableNodeIds(merged);
  const sum = (recurso: string) => merged.nodes
    .filter(n => reachable.has(n.id) && n.type === 'custo' && (n.props as { recurso?: string }).recurso === recurso)
    .reduce((total, n) => total + Number((n.props as { amount?: number }).amount ?? 0), 0);
  return { aura: sum('aura'), municao: sum('municao'), vida: sum('vida') };
}
```

Aplique o mesmo padrão (`reachable.has(n.id) &&` adicionado ao `.find`/`.filter`) em `graphComboConfig`, `graphCooldown`, `graphPreparation` e nos três `.find`/`.filter` dentro de `graphFormaVisual`. **Não** aplique isso em `advanceAbilityGraphCooldowns` (usa `catalog.find(...).nodes.find(...)` sobre o catálogo já resolvido, é um caso diferente, fora do escopo desta task).

- [ ] **Step 4: Rodar e confirmar que passa**

Rode: `npx vitest run utils/abilityGraphAction.test.ts`
Esperado: PASS em todos, incluindo os testes antigos que tinham nós custo/cooldown conectados normalmente (devem continuar funcionando, já que `reachable` inclui qualquer nó alcançável a partir de qualquer raiz, não só a raiz principal).

- [ ] **Step 5: Commit**

```bash
git add utils/abilityGraphAction.ts utils/abilityGraphAction.test.ts
git commit -m "fix(grafo): custo/cooldown/preparacao/combo/forma só contam nós alcançáveis no grafo"
```

---

### Task C2: Simulador roda `resolveAbilityGraphAction` (respeita o teste de acerto)

**Files:**
- Modify: `utils/abilitySimulator.ts`
- Modify: `utils/abilitySimulator.test.ts`
- Modify: `components/arsenal/graph/SimulatorPanel.tsx` (se consumir campos que mudam de forma — leia antes de editar)
- Modify: `components/arsenal/graph/SimulatorPanel.test.tsx`

- [ ] **Step 1: Ler `SimulatorPanel.tsx` e seu teste antes de editar**

Leia ambos os arquivos por completo para entender quais campos de `AbilityResult`/`SimulateOptions` o painel consome hoje (ex. `res.trace`, `res.targets`), já que o retorno de `simulateAbility` vai mudar de forma (de `AbilityResult` para algo baseado em `AbilityGraphActionResult`).

- [ ] **Step 2: Escrever o teste que descreve o novo comportamento de `simulateAbility`**

Em `utils/abilitySimulator.test.ts`, adicione (ou ajuste o existente) um teste que confirma que o simulador agora respeita um nó `teste` na árvore, ao invés de sempre acertar:

```ts
  it('respeita o nó teste da árvore: alvo com defesa alta erra mesmo que o dano exista no grafo', () => {
    const graph: AbilityGraph = {
      ...createAbilityGraph({ id: 'sim-teste', name: 'Simulação com teste' }),
      nodes: [
        { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
        { id: 'teste', type: 'teste', family: 'ramo', props: { dice: '1d20', comparador: 'defesa_alvo', valorFixo: 0, modificador: 0 } },
        { id: 'd', type: 'dano', family: 'efeito', props: { dice: undefined, flat: 10, element: 'fisico' } },
      ],
      edges: [{ id: 'e1', from: 'g', to: 'teste' }, { id: 'e2', from: 'teste', to: 'd', branch: 'entao' }],
    };
    const res = simulateAbility(graph, 1, { roller: () => 1, targets: [{ ...dummyEnemy(), defense: 99 }] });
    expect(res.targets[0].currentHp).toBe(res.targets[0].maxHp); // errou, sem dano
  });
```

(crie/exporte um `dummyEnemy()` equivalente ao `dummyActor` interno de `abilitySimulator.ts` se precisar de um alvo customizado nos testes — ou monte o objeto ator inline como os outros arquivos de teste já fazem.)

- [ ] **Step 3: Rodar e confirmar a falha**

Rode: `npx vitest run utils/abilitySimulator.test.ts`
Esperado: FAIL — `simulateAbility` hoje chama `interpretAbility` puro, que sempre executa `d` incondicionalmente após o teste ser avaliado, sem separar hit/miss (na verdade `interpretAbility` já respeitaria o branch, então revise: o teste real que expõe a lacuna é que hoje o simulador **ignora completamente `header.testDice`**, mas como esse campo já foi removido na Fase A, o teste relevante aqui é simplesmente confirmar que o nó `teste` dentro do grafo já funciona via `interpretAbility` puro — o que na verdade **já funciona** pela Task A1, já que `teste` é um `ramo` normal.

**Ajuste de escopo:** ao investigar, você provavelmente vai achar que este teste específico já passa sem mudança nenhuma (porque a Fase A tornou o teste de acerto um nó `ramo` comum, e `interpretAbility` sempre respeitou branches `ramo`). Se for o caso, **não invente uma falha artificial** — troque este teste por um que realmente distingue o comportamento antigo do novo: o ganho real do simulador chamar `resolveAbilityGraphAction` em vez de `interpretAbility` é herdar bloqueio por custo/cooldown/preparação, que hoje o simulador ignora. Escreva em vez disso:

```ts
  it('simula custo insuficiente: se o simulador rodar resolveAbilityGraphAction, reporta bloqueio em vez de aplicar o efeito', () => {
    const graph: AbilityGraph = {
      ...createAbilityGraph({ id: 'sim-custo', name: 'Simulação com custo' }),
      nodes: [
        { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
        { id: 'custo', type: 'custo', family: 'efeito', props: { recurso: 'aura', amount: 999 } },
        { id: 'd', type: 'dano', family: 'efeito', props: { dice: undefined, flat: 10, element: 'fisico' } },
      ],
      edges: [{ id: 'e1', from: 'g', to: 'custo' }, { id: 'e2', from: 'custo', to: 'd' }],
    };
    const res = simulateAbility(graph, 1, { roller: () => 10 });
    expect(res.status).toBe('bloqueada');
  });
```

- [ ] **Step 4: Rodar e confirmar a falha**

Rode: `npx vitest run utils/abilitySimulator.test.ts`
Esperado: FAIL — `res.status` não existe no retorno atual de `simulateAbility` (que retorna `AbilityResult`, sem campo `status`).

- [ ] **Step 5: Reescrever `simulateAbility` sobre `resolveAbilityGraphAction`**

Em `utils/abilitySimulator.ts`:

```ts
import { resolveAbilityGraphAction, type AbilityGraphActionResult } from './abilityGraphAction';
import type { AbilityGraph } from './abilityGraph';
import type { ArsenalActorState } from './arsenalPipeline';

function dummyActor(id: string, teamId: string, name: string): ArsenalActorState {
  return {
    id, teamId, name, currentHp: 50, maxHp: 50, currentAura: 20, maxAura: 20, currentAmmo: 10, maxAmmo: 10,
    defense: 10, speed: 6, tags: [], equippedWeaponIds: [], activeFormIds: [], effects: [], holdings: [],
    isCurrentTurn: teamId === 'A', inCombat: true,
  };
}

export interface SimulateOptions {
  roller?: (notation: string, label?: string) => number;
  actor?: ArsenalActorState;
  targets?: ArsenalActorState[];
}

/** Executa a ação completa do grafo (custo, cooldown, preparação, teste por alvo) contra atores fictícios (ou fornecidos) — mesmo motor da Cena. */
export function simulateAbility(graph: AbilityGraph, level: number, options: SimulateOptions = {}): AbilityGraphActionResult {
  const actor = options.actor ?? dummyActor('sim-actor', 'A', 'Usuário (simulação)');
  const targets = options.targets ?? [dummyActor('sim-target', 'B', 'Alvo (simulação)')];
  return resolveAbilityGraphAction({ graph, level, actor, targets, roller: options.roller });
}

/** Converte o trace em texto passo-a-passo para exibição. */
export function describeTrace(trace: { node: string; detail?: string }[]): string {
  return trace.map((s, i) => `${i + 1}. ${s.detail ?? s.node}`).join('\n');
}
```

- [ ] **Step 6: Ajustar `SimulatorPanel.tsx` para o novo formato de retorno**

Com base no que você leu no Step 1, atualize os acessos a campos do resultado do simulador (`res.actor`/`res.targets`/`res.trace` continuam existindo em `AbilityGraphActionResult`, mas agora há também `res.status`/`res.reason`/`res.hitTargetIds` — exiba `res.status`/`res.reason` na UI quando `status !== 'concluida'`, e destaque quais alvos estão em `hitTargetIds` vs. não, se o painel já lista alvos individualmente).

- [ ] **Step 7: Rodar e confirmar que passa**

Rode: `npx vitest run utils/abilitySimulator.test.ts components/arsenal/graph/SimulatorPanel.test.tsx`
Esperado: PASS (ajuste as asserções de `SimulatorPanel.test.tsx` para o novo shape de retorno conforme necessário).

- [ ] **Step 8: Rodar `tsc` e a suíte completa do domínio**

Rode: `npx tsc --noEmit && npx vitest run utils/ability* utils/nodes components/arsenal/graph`
Esperado: sem erros.

- [ ] **Step 9: Commit**

```bash
git add utils/abilitySimulator.ts utils/abilitySimulator.test.ts components/arsenal/graph/SimulatorPanel.tsx components/arsenal/graph/SimulatorPanel.test.tsx
git commit -m "feat(grafo): simulador roda resolveAbilityGraphAction (respeita custo/cooldown/preparação/teste)"
```

---

## Verificação final

- [ ] **Rodar toda a suíte do projeto**

Rode: `npx vitest run && npx tsc --noEmit`
Esperado: tudo verde, sem erros de tipo.

- [ ] **Abrir o editor de habilidades no navegador e testar manualmente**

Use a skill `run`/preview do projeto para abrir a Cena/Arsenal, criar uma habilidade nova, confirmar que:
1. É possível adicionar um nó `teste` no canvas (não existe mais campo "Rolagem inicial" no cabeçalho).
2. É possível pendurar um trigger (`enquanto_ativa`) como filho de outro nó via a nova seção "Evento (conectar como filho)" na paleta.
3. O simulador reporta bloqueio quando a habilidade tem custo maior que a aura disponível do ator de simulação.

## Débito técnico documentado (fora de escopo, não implementar agora)

- Reconciliação entre `arsenalPipeline.ts` (legado) e `abilityGraphAction.ts` (grafo).
- Disparo real do motor de combate para `pendingReactions` (hoje só o contrato de dados existe — nenhuma reação dispara de fato durante o combate ao vivo).
