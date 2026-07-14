# Formas ativáveis + redesign das auras dos tokens

**Data:** 2026-07-05
**Branch:** feat/grimorio-v2-fase1
**Status:** aprovado

## Problema

Habilidades de **forma** (transformações) hoje são ativadas por um toggle direto na
carta do rail de ações ([CenaTab.tsx:377](../../../tabs/CenaTab.tsx)): não checa
condições especiais, não desconta Aura, não aplica cooldown, não dispara gatilhos e
não registra log. Além disso, formas ativadas não têm **nenhum** feedback visual no
`MapBoard` da aba Cena.

O sistema de auras dos tokens da Cena é limitado a duas classes CSS pisca-pisca
(`is-active` para turno atual, `is-low` para HP ≤ 25%), sem camadas nem identidade.

## Objetivo

1. Quando o personagem do turno atual tiver **todos** os requisitos de uma forma
   (condições especiais + custo de Aura + cooldown/cargas), um **anel de chamas**
   acende ao redor do seu token, indicando que há forma ativável.
2. Clicar no anel abre um **popover** ancorado ao token listando as formas, com
   custo/duração/bônus, permitindo ativar. Formas indisponíveis aparecem esmaecidas
   com o motivo.
3. Ativar passa pelo **pipeline canônico** (`resolveArsenalAction`): desconta Aura,
   respeita cooldown/cargas, dispara `ativar_forma`, aplica bônus de PV/Aura e loga.
4. Forma ativa troca **temporariamente o ícone** do token pelo `iconOverride` e
   envolve o token numa **aura na cor** da forma. Com forma ativa, o anel vira
   controle: trocar por outra forma (paga o custo da nova) ou reverter.
5. Redesenhar o sistema de auras/anéis dos tokens em **camadas** compostas, no lugar
   do pisca-pisca atual.

## Decisões (do brainstorm)

- **Ativação:** pipeline completo (custo de Aura, cooldown/cargas, gatilho
  `ativar_forma`, bônus de PV/Aura, log). O anel só acende quando tudo é pagável.
- **Forma já ativa:** o anel vira controle da forma — clicar abre o popover em modo
  trocar/reverter.
- **Duração:** vem da carta (campo novo `form.durationRounds`); ausente/`null` =
  permanente até reverter manualmente ou o combate acabar. Reverter manual sempre
  disponível. Expira sozinha ao fim das rodadas.
- **Menu:** popover em lista ancorado ao token (mostra custo, duração, bônus; lista
  indisponíveis esmaecidas com motivo).
- **Auras:** linguagem em camadas — vida baixa no aro interno (batimento), turno
  atual nas runas girando + halo, forma no anel externo colorido + partículas.
  Estados compõem sem conflito porque cada um vive num raio próprio.
- **Escopo de quem ativa:** só a tela do Mestre (aba Cena). O anel é clicável apenas
  no turno do personagem atual.
- **Arquitetura:** helper puro novo reusa a validação do pipeline para decidir se o
  anel acende — o anel nunca mente.

## Arquitetura

### 1. Modelo (`utils/arsenal.ts` + `types.ts`)

`FormModule` já possui `grantedAbilityIds`, `removedAbilityIds`, `hpBonus`,
`auraBonus`, `color?`, `iconOverride?`. **Adicionar** um campo opcional:

```ts
export interface FormModule {
  // ...existentes
  color?: string;
  iconOverride?: string;
  durationRounds?: number | null; // null/ausente = permanente
}
```

`ActiveFormaState` (em `utils/cena.ts`) já existe:
`{ ownerId; entryId; roundsRemaining }`. Nenhuma mudança estrutural — passa a ser
alimentado pela ativação. Para desfazer os bônus de PV/Aura no reverter, registrar
os deltas efetivamente aplicados:

```ts
export interface ActiveFormaState {
  ownerId: string;
  entryId: string;
  roundsRemaining: number;
  hpBonusApplied: number;   // quanto de maxHp a forma somou
  auraBonusApplied: number; // quanto de maxAura a forma somou
}
```

### 2. Editor de cartas (`components/arsenal/ArsenalCardEditor.tsx`)

A seção "categoria" para `abilityType === 'forma'` ganha, além do picker de
habilidades liberadas já existente:

- **Cor da aura** — presets (paleta do design system) + input de cor livre → `form.color`.
- **Ícone de transformação** — reusa `ImagePickerButton` → `form.iconOverride`.
- **Bônus de PV** e **Bônus de Aura** — `NumberField` → `form.hpBonus` / `form.auraBonus`.
- **Habilidades removidas pela forma** — `CardPicker` → `form.removedAbilityIds`.
- **Duração da forma (rodadas)** — `NumberField` opcional, vazio = permanente →
  `form.durationRounds`.

### 3. Helper de disponibilidade (`utils/arsenalState.ts` ou `arsenal.ts`)

Função pura nova:

```ts
export interface FormAvailability {
  card: ArsenalCard;
  ok: boolean;
  reason: string | null; // motivo do bloqueio quando !ok
  isActive: boolean;     // já é a forma ativa deste ator
}

export function activatableForms(
  actor: ArsenalActorState,
  catalog: readonly ArsenalCard[],
  loadout: ArsenalLoadout,
): FormAvailability[];
```

Filtra as cartas de forma que o ator **possui** (holdings com quantity > 0) e, para
cada uma, reaproveita a validação canônica: chama `resolveArsenalAction` em modo
dry-run com alvo = próprio usuário e inspeciona `status` (`bloqueada` → `reason`), OU
extrai `conditionFailure` + checagem de aura + cooldown/cargas num caminho leve. A
lista completa alimenta o popover; o anel acende se existe ao menos um item `ok`.

### 4. Ativação/reversão (`tabs/CenaTab.tsx`)

Substituir o toggle atual (`onSelectAction`, ramo `abilityType==='forma'`) por um
fluxo validado, e adicionar handlers para o popover do token:

- **Ativar** `formId`: monta `ArsenalActorState` do ator do turno; chama
  `resolveArsenalAction` (alvo próprio). Se `concluida`:
  1. Aplica `activateForm(loadout, formId)`.
  2. Aplica bônus: `maxHp += hpBonus`, `currentHp += hpBonus`,
     `maxAura += auraBonus`, `currentAura += auraBonus` (clamp em ≥0).
  3. Registra `ActiveFormaState` com `roundsRemaining = durationRounds ?? 0` e os
     `*BonusApplied`.
  4. Log ("X assume a Forma Ígnea") + gatilho `ativar_forma` (já emitido pelo pipeline).
- **Reverter**: `activateForm(loadout, null)`; desfaz bônus (`maxHp -= hpBonusApplied`,
  clamp `currentHp` ao novo máximo; idem Aura); remove o `ActiveFormaState`; dispara
  `perder_forma`; log.
- **Trocar** forma A→B: reverter A + ativar B (paga custo de B).
- **Expiração**: na virada de rodada (`goNextTurn` / avanço de rodada), decrementa
  `roundsRemaining` das formas com valor > 0; ao chegar a 0, reverte automaticamente
  (mesma rotina de reverter) com log.

O clique na carta de forma no rail (`onSelectAction`) passa a chamar o **mesmo**
fluxo validado (fim do toggle gratuito).

### 5. UI do anel + popover (`tabs/cena/MapBoard.tsx` + subcomponente novo)

`MapBoard` recebe, por token, o estado derivado em `CenaTab`:

```ts
formaState: {
  ring: 'none' | 'available' | 'active';
  color?: string;      // cor da forma ativa
  iconOverride?: string;
} | undefined
```

- **`available`** (só no turno atual): anel âmbar com línguas de chama animadas (CSS),
  clicável → abre o popover de seleção.
- **`active`**: aura na cor da forma (`color`) + ícone do token trocado por
  `iconOverride` + partículas subindo; clicar → popover em modo trocar/reverter.
- **Popover** (`FormaPopover`, componente novo): lista `activatableForms` com nome,
  ícone, custo de Aura, duração e bônus; itens `!ok` esmaecidos com o `reason`. Item
  ativo marcado. Botão "Reverter" quando há forma ativa. Fecha com Esc/clique fora;
  vira para dentro do mapa quando o token está na borda.

### 6. Redesign das auras (CSS da Cena)

Substituir o comportamento de `cena-token.is-active` / `.is-low` pela linguagem em
camadas aprovada (CSS puro, sem JS por frame):

- **Vida baixa** (aro interno): batimento cardíaco vermelho (`hpbeat`).
- **Turno atual**: anel de runas SVG girando (`spin`) + halo respirando (`breathe`)
  na cor do time.
- **Forma ativa** (anel externo): aura na cor da forma + partículas (`rise`).

Cada estado ocupa um raio próprio (`inset` distinto), então compõem sem conflito
(turno+vida baixa, turno+forma etc.). Respeitar `prefers-reduced-motion` (desliga
animações, mantém as cores estáticas).

## Testes

**Unit (`utils/*.test.ts`):**
- `activatableForms`: ok quando tudo satisfeito; bloqueia por condição especial,
  aura insuficiente, cooldown, cargas; marca `isActive` corretamente.
- Ativação: aplica bônus de PV/Aura a atual e máximo; grava `*BonusApplied`.
- Reversão: desfaz bônus e faz clamp de currentHp/currentAura ao novo máximo.
- Troca A→B: reverte A e cobra B; deltas corretos.
- Expiração: decremento por rodada; reverte ao zerar.

**Componente (`tabs/cena/*.test.tsx`):**
- Popover renderiza formas ok e bloqueadas (com motivo).
- Clique numa forma ok chama o handler de ativação.
- Anel `available` só aparece no turno do ator com forma disponível.
- Token em forma ativa usa `iconOverride` e a cor da aura.

## Fora de escopo (YAGNI)

- Espelho do jogador / telas read-only (só a tela do Mestre por ora).
- Custo de manutenção por turno (drenar Aura para manter a forma).
- Múltiplas formas simultâneas (o modelo mantém uma ativa por vez).
- Menu radial (escolhido o popover em lista).
