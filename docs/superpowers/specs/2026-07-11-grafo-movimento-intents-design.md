# Materializar movementIntents (nó `mover`) no mapa da Cena

**Data:** 2026-07-11
**Branch:** feat/grimorio-v2-fase1
**Status:** aprovado

## Problema

O nó `mover` (`utils/nodes/controlNodes.ts:8-24`, tipos `empurrar | puxar |
teleportar | trocar_lugar`) já grava intenção de movimento em
`ctx.movementIntents` durante `interpretAbility`. Mas `AbilityResult`
(`utils/abilityInterpreter.ts:58-65`) não expõe esse campo no retorno — o dado
é descartado antes de sair do interpretador. Resultado: usar uma habilidade
com `empurrar`/`puxar`/`trocar_lugar` não move nenhum token no mapa, apesar do
nó existir no editor e o campo já estar sendo escrito internamente.

A posição de combatentes na aba Cena vive em `cena.tokens`
(`Record<id, {x,y}>`, percentual livre da arena, sem células de grid — ver
`tabs/cena/MapBoard.tsx:34-36`), atualizada via
`updateCena(setToken(cena, id, pos))` tanto pelo drag manual quanto por
qualquer fluxo futuro. O grid tático legado (`CombatArena`/`Combatant.pos`,
aba "Combate") está fora deste projeto — é legado em processo de substituição
pela Cena (confirmado com o usuário) e não compartilha estado com
`cena.tokens`.

## Objetivo

Fechar o pipeline `mover` → `movementIntents` → posição real em `cena.tokens`,
para `empurrar`, `puxar` e `trocar_lugar`. `teleportar` fica fora de escopo
nesta rodada (precisaria de um destino explícito que o nó não captura hoje).

## Decisões (do brainstorm)

- **Unidade de distância:** constante fixa — 1 unidade de `distance` do nó
  `mover` equivale a um percentual fixo do mapa (`MOVE_UNIT_PCT`), não
  proporcional ao tamanho da arena. Simples e previsível; ajustável depois
  como uma única constante caso o valor não funcione bem em playtesting.
- **Teleportar:** fora de escopo. Continua só registrando trace/intent sem
  efeito visual, como já acontece hoje (nenhuma regressão — já não fazia
  nada).
- **Grid tático legado (`CombatArena`):** fora de escopo. A aba "Combate" é
  legado sendo substituído pela Cena; não vale investir integração nele.
- **Colisão/obstáculos/sobreposição de tokens:** fora de escopo. V1 apenas
  desloca; não impede tokens de ocuparem a mesma posição.
- **Animação de deslizamento do token:** fora de escopo. V1 aplica a posição
  final diretamente (mesmo padrão do drag manual, que também "salta" para a
  posição final sem animação intermediária).

## Arquitetura

### 1. Fechar o contrato de dados

- `AbilityResult` (`utils/abilityInterpreter.ts:58-65`) ganha
  `movementIntents?: MovementIntent[]` (tipo já existe implicitamente em
  `ctx.movementIntents`; promovê-lo a um tipo nomeado exportado).
- `interpretAbility` passa a incluir `ctx.movementIntents` no objeto de
  retorno (hoje é montado e descartado nas linhas ~159-166).
- `AbilityGraphActionResult` (`utils/abilityGraphAction.ts:29-43`) ganha o
  mesmo campo, acumulado entre passes/alvos exatamente como
  `ongoingEffectIntents` já é hoje (concatenação simples a cada resolução de
  alvo dentro de `resolveAbilityGraphAction`).

### 2. `utils/movementResolver.ts` (novo módulo, função pura)

```ts
export const MOVE_UNIT_PCT = 8; // % da arena por unidade de distância

export function resolveMovementIntents(
  intents: MovementIntent[],
  tokens: Record<string, { x: number; y: number }>,
  actorId: string,
): Record<string, { x: number; y: number }> // só as entradas que mudaram
```

Regras por `kind`:
- **`empurrar`**: direção = `(posAlvo − posAtor)` normalizada; nova posição =
  `posAlvo + direção × (distance × MOVE_UNIT_PCT)`, clamp `[0, 100]` em x e y.
- **`puxar`**: mesma conta com direção invertida (rumo à posição do ator).
- **`trocar_lugar`**: swap direto — posição do ator vira a do alvo e
  vice-versa (campo `distance` ignorado).
- **`teleportar`**: ignorado (não gera entrada no retorno).
- **Caso degenerado**: se ator e alvo estão exatamente na mesma posição
  (norma do vetor direção é zero), `empurrar`/`puxar` não produzem
  movimento — evita direção indefinida/`NaN`. `trocar_lugar` não é afetado
  por essa guarda (swap funciona mesmo com posições iguais, é um no-op nesse
  caso).

Função pura, sem acesso a estado da Cena — recebe tudo por parâmetro,
facilita teste isolado.

### 3. Wiring no CenaTab

Em `resolveAbilityGraphOn` (`tabs/CenaTab.tsx:761-877`) e
`resolveAbilityGraphFieldCast` (linha ~949-978), depois de obter o resultado
de `resolveAbilityGraphAction`:

```ts
const nextTokens = resolveMovementIntents(result.movementIntents ?? [], cena.tokens, actor.id);
if (Object.keys(nextTokens).length > 0) {
  updateCena({ ...cena, tokens: { ...cena.tokens, ...nextTokens } });
}
```

Mesmo padrão já usado por `registerOngoingEffects` (linha 875) — uma chamada
extra ao final do fluxo existente, sem alterar a estrutura do handler.

## Testes

- `utils/movementResolver.test.ts` (novo): `empurrar` afasta o alvo do ator na
  direção correta; `puxar` aproxima; `trocar_lugar` troca as duas posições;
  caso degenerado (mesma posição) não move em `empurrar`/`puxar`; clamp nas
  bordas do mapa (0/100) é respeitado; `teleportar` não produz entrada no
  resultado.
- `tabs/CenaTab.test.tsx`: um teste novo confirmando que usar uma habilidade
  com nó `mover` (`empurrar`) de fato altera `cena.tokens[targetId]` após
  `resolveAbilityGraphOn`.

## Fora de escopo

Destino explícito de `teleportar`; grid tático legado (`CombatArena`/
`Combatant`); colisão/obstáculos/sobreposição de tokens; animação de
deslizamento do token (poderia reaproveitar `components/combat/animFx.tsx`
numa fase futura, mas não é necessária para o pipeline funcionar).
