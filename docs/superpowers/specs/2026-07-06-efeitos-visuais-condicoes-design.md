# Efeitos visuais de condição no banner e no token

**Data:** 2026-07-06
**Branch:** feat/grimorio-v2-fase1
**Status:** aprovado

## Problema

`Combatant.conditions: Condition[]` (`types.ts:259`) já guarda as condições ativas
de um personagem, e `PRESET_CONDITIONS` (`types.ts:504+`) já define nome, emoji,
cor e descrição para ~15 condições universais (Queimando, Eletrocutado, Molhado,
Envenenado, Paralisado, Desnorteado, Dormindo, Sangrando, Amaldiçoado, Amedrontado,
Confuso, Cego, Imobilizado, Regenerando, Protegido). Mas nada na UI de combate
mostra essas condições de forma visível: nem o banner do personagem na lista de
turnos (`TurnOrderRow.tsx`), nem o token no tabuleiro (`CombatToken.tsx`).

Um `ConditionBadges.tsx` existia antes e foi deletado nesta branch; o spec de
2026-07-05 (`docs/superpowers/specs/2026-07-05-sistema-efeitos-condicoes-design.md`)
marcou explicitamente indicadores visuais de condição no tabuleiro como fora de
escopo. Esta rodada reverte essa decisão: o pedido agora é justamente dar
destaque visual forte (não um badge discreto) a cada condição ativa.

## Objetivo

Quando um personagem está sob uma condição (Queimando, Congelado, etc.), tanto o
banner na lista de turnos quanto o token no tabuleiro devem deixar isso evidente
através de:

1. Um efeito de partícula animado, temático por condição, preenchendo a área do
   banner/token.
2. Uma fileira de selos pequenos (emoji + cor), um por condição ativa, para
   legibilidade quando há múltiplas condições simultâneas.

## Decisões (do brainstorm)

- Reverter a exclusão de escopo do spec de 2026-07-05: reintroduzir indicadores
  visuais de condição, agora no banner E no token (não só um `ConditionBadges`
  isolado).
- Overlay de partícula animada (não emoji estático nem barra utilitária simples).
- Overlay preenche toda a área do banner/token (não só o retrato).
- Todas as condições ativas aparecem lado a lado na fileira de selos (não só a
  mais severa/recente).
- Cobertura completa: as ~15 condições do `PRESET_CONDITIONS` ganham efeito
  temático (não um subconjunto reduzido).
- Sem checagem de `prefers-reduced-motion` nesta rodada — `utils/motionPref.ts`
  foi removido de propósito nesta branch; não reintroduzir essa preocupação.
- Puramente apresentação: nenhuma mudança em `types.ts`, `utils/arsenal*.ts` ou
  no pipeline de combate. Reaproveita `Condition`/`PRESET_CONDITIONS` como já
  existem.

## Arquitetura

### 1. Motor de efeito paramétrico (`components/combat/ConditionEffects.tsx`, novo)

Em vez de 15 keyframes CSS únicos e independentes, um pequeno motor com 5
padrões-base de animação, parametrizados por emoji + cor (já existentes no
preset):

```ts
type FxPattern = 'rise' | 'fall' | 'orbit' | 'vignette' | 'jitter';

interface ConditionFxDef {
  pattern: FxPattern;
  emoji: string;
  color: string;
}

const CONDITION_FX: Record<string, ConditionFxDef> = {
  'Queimando':    { pattern: 'rise',     emoji: '🔥', color: '#ef4444' },
  'Eletrocutado': { pattern: 'jitter',   emoji: '⚡', color: '#facc15' },
  'Molhado':      { pattern: 'fall',     emoji: '💧', color: '#38bdf8' },
  'Envenenado':   { pattern: 'rise',     emoji: '🧪', color: '#a3e635' },
  'Paralisado':   { pattern: 'jitter',   emoji: '🔒', color: '#94a3b8' },
  'Desnorteado':  { pattern: 'orbit',    emoji: '😵', color: '#f97316' },
  'Dormindo':     { pattern: 'rise',     emoji: '💤', color: '#818cf8' },
  'Sangrando':    { pattern: 'fall',     emoji: '🩸', color: '#dc2626' },
  'Amaldiçoado':  { pattern: 'vignette', emoji: '💀', color: '#7c3aed' },
  'Amedrontado':  { pattern: 'vignette', emoji: '😱', color: '#c084fc' },
  'Confuso':      { pattern: 'orbit',    emoji: '🌀', color: '#fb7185' },
  'Cego':         { pattern: 'vignette', emoji: '🌑', color: '#334155' },
  'Imobilizado':  { pattern: 'jitter',   emoji: '🧲', color: '#b45309' },
  'Regenerando':  { pattern: 'rise',     emoji: '💚', color: '#22c55e' },
  'Protegido':    { pattern: 'orbit',    emoji: '🛡', color: '#64748b' },
};

const DEFAULT_FX: ConditionFxDef = { pattern: 'rise', emoji: '✨', color: '#94a3b8' };
```

Cada padrão é implementado como uma classe CSS reutilizável
(`.mp-cond-fx--rise`, `.mp-cond-fx--fall`, `.mp-cond-fx--orbit`,
`.mp-cond-fx--vignette`, `.mp-cond-fx--jitter`) que usa `--cond-color` e
`--cond-emoji` (via `content` em pseudo-elementos ou `<span>`s gerados em JS,
seguindo o padrão já usado pelos `impact-spark` em `CombatToken.tsx:184-199`).
Condição sem entrada no mapa usa `DEFAULT_FX` (nunca quebra).

### 2. Componentes exportados

```ts
// Preenche position:absolute; inset:0; pointer-events:none sobre o container pai
// (que precisa de position:relative — já é o caso do banner e do wrapper do token).
export const ConditionEffectOverlay: React.FC<{ conditions: Condition[] }>;

// Fileira de selos pequenos: emoji + borda na cor, title com nome + duração restante.
export const ConditionBadgeRow: React.FC<{
  conditions: Condition[];
  maxVisible: number; // 5 no banner, 3 no token
}>;

// <style> com os keyframes compartilhados, montado uma vez por árvore
// (mesmo padrão de AnimFxStyles em components/combat/animFx.tsx).
export const ConditionEffectStyles: React.FC;
```

Regras internas:
- Dedupe por `condition.name` (condições empilhadas/repetidas contam 1x
  visualmente; a duração exibida no badge é a maior/mais recente entre as
  instâncias).
- `ConditionEffectOverlay` renderiza no máximo 3 camadas de partícula
  simultâneas (as 3 condições mais recentes) para não poluir visualmente nem
  pesar performance — o restante ainda aparece no `ConditionBadgeRow`.
- `ConditionBadgeRow` corta em `maxVisible` e agrupa o excedente num selo
  `+N` (título lista os nomes agrupados).

### 3. Integração

- `TurnOrderRow.tsx`: renderiza `<ConditionEffectOverlay conditions={combatant.conditions} />`
  logo após `mp-turn-banner__veil` (acima da imagem, abaixo do conteúdo/stats),
  e `<ConditionBadgeRow conditions={combatant.conditions} maxVisible={5} />`
  dentro de `mp-turn-banner__topline` (ao lado do nome).
- `CombatToken.tsx`: mesma lógica dentro do wrapper com `transform: scale(...)`
  (que já é `position: relative`), overlay entre `TokenRing` e o retrato, badge
  row pequena acima do `mp-token-nameplate` (`maxVisible={3}`).
- `TurnOrderPanel.tsx`: monta `<ConditionEffectStyles />` uma vez (mesmo padrão
  de onde `AnimFxStyles` é montado nos outros componentes de animação).
- `CombatArena.tsx`: monta `<ConditionEffectStyles />` uma vez para os tokens do
  tabuleiro.

## Testes

`components/combat/ConditionEffects.test.tsx` (novo):
- Condição desconhecida (nome fora de `CONDITION_FX`) usa `DEFAULT_FX` e não
  lança erro.
- Dedupe: duas entradas de `Condition` com o mesmo `name` geram um único selo
  e uma única camada de overlay.
- `ConditionEffectOverlay` limita a 3 camadas mesmo com mais condições ativas.
- `ConditionBadgeRow` corta em `maxVisible` e mostra `+N` com o restante.
- Lista vazia de condições não renderiza nada (sem elementos DOM extras).

## Fora de escopo

Nenhuma mudança em `Condition`/`PRESET_CONDITIONS`/pipeline de combate;
prefers-reduced-motion; efeitos visuais para condições customizadas fora do
preset (usam `DEFAULT_FX` genérico); animações 3D/WebGL — tudo é CSS/DOM.
