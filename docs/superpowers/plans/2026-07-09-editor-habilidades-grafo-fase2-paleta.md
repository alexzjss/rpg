# Editor de Habilidades em Grafo — Fase 2 (Paleta completa + templates) — Plano

> **For agentic workers:** Execução inline nesta sessão (sem subagentes, sem commits — por pedido explícito do usuário). Formato enxuto por decisão do usuário ("não gaste tokens à toa"): este plano define arquivos, tipos de nó e comportamento exato de cada um; o código completo é escrito diretamente durante a execução (não duplicado aqui) e cada tarefa termina com testes verdes antes de seguir para a próxima.

**Goal:** Registrar os ~24 tipos de nó restantes da paleta (todas as capacidades de `ArsenalEffect` ainda não cobertas pela Fase 1) + galeria de templates prontos — tudo headless, sem UI.

**Base:** Fase 1 entregue (`utils/abilityGraph.ts`, `nodeRegistry.ts`, `abilityPrimitives.ts`, `nodes/coreNodes.ts`, `abilityInterpreter.ts`, `abilitySimulator.ts`). 7 nós já existem: `ao_ativar`, `ramo`, `alvo`, `dano`, `cura`, `aplicar_condicao`, `buff`.

**Extensões necessárias no núcleo (aditivas, não quebram Fase 1):**
- `abilityPrimitives.ts`: `applyDamage` passa a consumir **escudo** (absorve antes do HP), **marcar vulnerável** (amplifica e remove após uso), e **conversão de dano** (troca o elemento antes de calcular). Todas condicionais à presença do efeito ativo — comportamento antigo inalterado quando ausentes.
- `abilityInterpreter.ts` (`InterpretCtx`): campos opcionais novos — `scopeMultiplier?: Map<string,number>` (falloff de corrente), `movementIntents?`, `summonIntents?`, `transformIntents?`, `lastEffectKind?: Map<string,string>` (para Eco). Todos opcionais/inicializados vazios; nós existentes não os tocam.
- `utils/nodes/statusEffect.ts` (novo): `createStatusEffect(overrides)` — fábrica DRY de `ArsenalEffect` para os ~12 nós que só "concedem um status por N rodadas", evitando repetir o esqueleto em cada arquivo de nó.

---

## Task 1 — Modificadores de estat e rolagem

**Files:** `utils/nodes/statusEffect.ts` (novo, fábrica), `utils/nodes/statModifierNodes.ts` (novo), `utils/nodes/statModifierNodes.test.ts` (novo)

- `modificador_estat`: props `{ stat: 'ataque'|'defesa'|'velocidade'|'dano'|'cura'|'aura', operation: 'somar'|'multiplicar'|'definir', value: number, rounds: number }`. Concede `ArsenalEffect` com `modifiers: [{stat,operation,value}]`, duração rodadas.
- `bonus_rolagem`: props `{ target: 'teste'|'dano'|'dano_extra'|'cura', bonusDice?: string, bonusFlat: number, advantage: boolean, rounds: number }`. Concede `ArsenalEffect` com `diceBonuses: [{target,bonusDice,bonusFlat,advantage}]`.

**Testes:** cada nó, ao interpretar, adiciona ao alvo um `ActiveEffectState` cujo `effect.modifiers`/`effect.diceBonuses` contém exatamente o configurado.

---

## Task 2 — Recursos (aura/munição, custo, efeitos periódicos)

**Files:** `utils/nodes/resourceNodes.ts`, `utils/nodes/resourceNodes.test.ts`

- `gerar_recurso`: props `{ resource: 'aura'|'municao', dice?: string, flat: number }`. Incrementa `currentAura`/`currentAmmo` do escopo, respeitando o máximo.
- `reduzir_custo`: props `{ auraDelta: number, cooldownTurnsDelta: number, rounds: number }`. Concede `ArsenalEffect` com `costReduction`.
- `efeito_periodico`: props `{ kind: 'dano'|'cura'|'aura_consumida'|'aura_restaurada', dice?: string, flat: number, rounds: number }`. Concede `ArsenalEffect` com `periodicDamage`/`periodicHealing`/`auraConsumed`/`auraRestored` conforme `kind` (mapeamento 1:1, mutuamente exclusivo).

**Testes:** `gerar_recurso` aumenta `currentAura`/`currentAmmo` sem estourar o máximo; `reduzir_custo` e `efeito_periodico` concedem o `ArsenalEffect` esperado.

---

## Task 3 — Defesa e drenagem (+ extensão de `applyDamage`)

**Files:** `utils/nodes/defenseNodes.ts`, `utils/nodes/defenseNodes.test.ts`, `Modify: utils/abilityPrimitives.ts`, `Modify: utils/abilityPrimitives.test.ts`

- `escudo`: props `{ dice?: string, flat: number, rounds: number }`. Rola o valor no momento da concessão e guarda como `shield: { flat: rolled }` no `ArsenalEffect`.
- `roubo_vida`: props `{ percent: number, rounds: number }` → `lifeSteal`.
- `espinhos`: props `{ dice?: string, flat: number, rounds: number }` → `thorns` (rolado na concessão, igual escudo).
- `afinidade_elemental`: props `{ element: Element, kind: ElementalAffinityKind, percent: number, rounds: number }` → `elementalAffinities`.
- `imunidade`: props `{ classicKinds: string[], rounds: number }` → `immunities`.

**Extensão de `applyDamage`:** antes de descontar HP, se o alvo tem um efeito ativo com `shield.flat > 0`, absorve o dano até esgotar o escudo (reduz `shield.flat` no efeito ativo; remove o efeito quando chega a 0); o excedente segue para o HP.

**Testes:** os 5 nós concedem o `ArsenalEffect` esperado; teste novo em `abilityPrimitives.test.ts` — alvo com escudo de 5 recebe 8 de dano → HP cai só 3, e o escudo é consumido (efeito removido ou com `shield.flat` zerado).

---

## Task 4 — Controle e mobilidade

**Files:** `utils/nodes/controlNodes.ts`, `utils/nodes/controlNodes.test.ts`, `Modify: utils/abilityInterpreter.ts` (adicionar `movementIntents?` ao `InterpretCtx` e inicializar `[]`)

- `mover`: props `{ kind: 'empurrar'|'puxar'|'teleportar'|'trocar_lugar', distance: number }`. Sem estado de grid no núcleo headless: registra a intenção em `ctx.movementIntents` (`{targetId, kind, distance}`) e no `trace` — a Cena (Fase 4) materializa no grid.
- `silenciar`: props `{ blocksBasicAttack: boolean, rounds: number }` → `silence`.
- `provocar`: props `{ rounds: number }` → `taunt: true`.
- `incapacitar`: props `{ rounds: number }` → `incapacitate: true`.
- `invisibilidade`: props `{ breaksOnAction: boolean, breaksOnDamage: boolean, rounds: number }` → `invisibility`.

**Testes:** `mover` popula `ctx.movementIntents`; os 4 nós de controle concedem o `ArsenalEffect` com o campo booleano/objeto esperado.

---

## Task 5 — Manipulação de efeitos e área (+ extensão de `applyDamage`)

**Files:** `utils/nodes/fieldNodes.ts`, `utils/nodes/fieldNodes.test.ts`, `Modify: utils/abilityPrimitives.ts`, `Modify: utils/abilityInterpreter.ts` (adicionar `scopeMultiplier?` ao `InterpretCtx`)

- `dispel`: props `{ category: 'positivo'|'negativo'|'qualquer', count: number }`. Heurística: efeito é "negativo" se tem `classic` definido, `periodicDamage`, ou algum `modifiers[].value < 0`; "positivo" caso contrário. Remove até `count` efeitos do escopo que casem a categoria.
- `conversao_dano`: props `{ from: Element|'qualquer', to: Element, rounds: number }` → `damageConversion`.
- `marcar_vulneravel`: props `{ amplifyPercent: number, rounds: number }` → `markVulnerable`.
- `corrente`: família **alvo** (não efeito). Props `{ maxBounces: number, falloffPercent: number }`. Expande `ctx.scope` para o alvo primário + até `maxBounces` inimigos adicionais de `ctx.allTargets` (mesmo critério de time do alvo primário), e popula `ctx.scopeMultiplier` com `1, (1-falloff), (1-falloff)²...` por id.

**Extensão de `applyDamage`:** (a) se o alvo tem `damageConversion` ativo casando o elemento recebido (`from` = elemento ou `'qualquer'`), o dano é recalculado com o elemento `to`; (b) se o alvo tem `markVulnerable` ativo, o dano é amplificado por `1 + amplifyPercent/100` e o efeito é consumido (removido) nesse hit.

**`dano`/`cura` (coreNodes.ts, Modify):** ao aplicar em cada alvo do escopo, multiplicar o valor rolado por `ctx.scopeMultiplier?.get(target.id) ?? 1` antes de chamar a primitiva.

**Testes:** `dispel` remove o efeito certo por categoria; `conversao_dano` e `marcar_vulneravel` concedem os efeitos; `corrente` expande o escopo com o multiplicador correto (teste de integração via `interpretAbility` com `dano` encadeado depois de `corrente`, verificando dano cheio no alvo 1 e reduzido no alvo 2).

---

## Task 6 — Especiais (invocar, transformar, reviver, tabela aleatória, eco)

**Files:** `utils/nodes/specialNodes.ts`, `utils/nodes/specialNodes.test.ts`, `Modify: utils/abilityInterpreter.ts` (adicionar `summonIntents?`, `transformIntents?`, `lastEffectKind?` ao `InterpretCtx`)

- `invocar`: props `{ entityName: string, teamId: string, rounds: number }`. Headless: registra intenção em `ctx.summonIntents` (criação real do ator é responsabilidade da Cena, Fase 4).
- `transformar`: props `{ intoFormId: string }`. Registra intenção em `ctx.transformIntents` (resolução do `FormModule` é responsabilidade do catálogo do arsenal, Fase 4).
- `reviver`: props `{ hpPercent: number, usesLeft: number, rounds: number }` → concede `ArsenalEffect` com `revive` (a checagem de morte que consome isso é do pipeline/Cena, Fase 4).
- `tabela_aleatoria`: props `{ entries: { classicKind: string, weight: number }[] }`. Sorteia com `ctx.roller('1d100')` ponderado pelos pesos e aplica a condição clássica sorteada via `applyCondition` — **totalmente funcional headless** (não é só intenção).
- `eco`: props `{ subject: 'usuario'|'alvo' }`. Reaplica no escopo a última condição clássica registrada em `ctx.lastEffectKind` para o sujeito escolhido (o próprio nó `aplicar_condicao`, ao interpretar, grava `ctx.lastEffectKind.set(target.id, classicKind)` — pequeno ajuste em `coreNodes.ts`).

**Testes:** `tabela_aleatoria` com roller fixo sempre escolhe a mesma entrada (determinístico) e aplica a condição correspondente; `eco` reaplica a condição depois de um `aplicar_condicao` anterior no mesmo grafo (teste via `interpretAbility`); `invocar`/`transformar`/`reviver` verificados por presença da intenção/efeito.

---

## Task 7 — Templates prontos

**Files:** `utils/abilityTemplates.ts`, `utils/abilityTemplates.test.ts`, `Modify: utils/nodes/index.ts` (registrar todos os novos arquivos de nó)

Cinco templates (`AbilityGraph` pré-montados via `createAbilityGraph` + nós/arestas):
1. **Ataque básico** — gatilho → `dano` (1d6 físico).
2. **Cura** — gatilho → `cura` (1d8) no próprio.
3. **Buff** — gatilho → `alvo`(próprio) → `modificador_estat` (+2 ataque, 3 rodadas).
4. **Debuff** — gatilho → `aplicar_condicao` (fraqueza).
5. **Combo condicional** — gatilho → `ramo` (alvo_molhado) → SE: `dano` elemento raio +50% (usa `modificador_estat` dano ou valor maior fixo) / SENÃO: `dano` elemento raio normal.

`listAbilityTemplates(): { id, label, description, build: () => AbilityGraph }[]`.

**Testes:** cada `build()` produz um grafo com `validateGraph`-friendly estrutura (gatilho presente, todo nó exceto o gatilho tem aresta de entrada) — checagem simples via percorrer `edges`/`nodes`; e ao menos um teste roda `interpretAbility` sobre o template "Combo condicional" nos dois ramos.

---

## Self-review

- **Cobertura:** todas as ~24 capacidades do `ArsenalEffect` listadas na spec (Fase 2 do roadmap) mapeadas a um nó. Simplificações headless documentadas onde a semântica completa depende de estado de combate/grid que só existe na Fase 4 (`mover`, `invocar`, `transformar`, `reviver`, `reduzir_custo`) — registradas como **intenções**/efeitos passivos verificáveis, não como placeholders vazios: cada uma tem comportamento real e testável dentro do que o núcleo headless pode observar.
- **Consistência de tipos:** `InterpretCtx` ganha campos opcionais cumulativos (Tasks 4/5/6) — cada task só adiciona, nunca remove/renomeia campos das anteriores.
- **DRY:** `createStatusEffect` evita repetir o esqueleto de `ArsenalEffect` em ~12 nós.
