# Reformulação das animações de ação no turno

**Data:** 2026-06-20
**Status:** Spec aprovado no brainstorming — aguardando revisão do usuário antes do plano
**Contexto:** Retrabalhar todo o fluxo visual quando um combatente age no turno (carta surgindo, sendo jogada, reação escolhida, dados rolados e comparados, resultado e resolução) e corrigir bugs — em especial o resultado de dados aparecendo várias vezes seguidas quando há reação. Inspiração: JRPGs (Metaphor/Persona) e TTRPGs.

---

## Decisões do brainstorming (2026-06-20)

1. **Dois componentes, separados** — manter `CardRevealAnimation` e `DiceAnimation` como arquivos distintos; **não** fundir num único orquestrador.
2. **Look unificado** — extrair tokens/keyframes/juice/pacing para um módulo comum; `DiceAnimation` é reestilizado para combinar com o `CardRevealAnimation`.
3. **Dados = painéis de número estilizados** — não usar dado 3D físico na sequência; o número "estoura/conta" e trava num painel com cortes diagonais.
4. **Escopo: tudo que rola dado em combate** — ataque, ação/reforço, reação, vínculo, combinação, item, selo, iniciativa. (Fusão e forma ficam de fora — ver item 8.)
5. **Pacing: ágil por padrão, drama nos grandes** — rolagens triviais ~1–2 s; momentos dramáticos ganham suspense + payoff.
6. **Gatilho de modo dramático:** reação **OU** carta/rolagem com CD **OU** crítico/falha.
7. **Controle do usuário:** clicar para pular/avançar beats; respeitar `prefers-reduced-motion`. (Sem configuração de velocidade global nesta etapa.)
8. **Não mexer:** animação de **Forma** (`formaAnimCard`) e de **Fusão** (`FusionOverlay`) — têm visual próprio e podem ter animações especiais.
9. **Dores a resolver:** (a) resultado repetido/piscando (bug das reações); (b) falta de impacto/"juíce"; (c) ritmo errado (arrasta ou ilegível).

---

## Estado atual relevante (não refazer do zero)

Dois sistemas de animação paralelos, hoje com estéticas e timings divergentes:

### `components/CardRevealAnimation.tsx` (`setCardAnim` / estado `cardAnim`)
- Sequência estilo *Metaphor*: fases `card → reaction → rolls → result → resolve`.
- Subcomponentes `BattleCard` (carta com corte diagonal) e `RollPanel` (painel de número).
- Resolução: carta voa para o token do alvo (`findTargetPoint` via `[data-combat-token]`) no sucesso, ou *clash* da reação no fracasso (variantes `REACTION_VARIANTS`).
- Acionado por `finalizeAction` (`App.tsx:4837`), que monta `CardAnimPayload` com `attackRoll`, opcional `reactionRoll`/`reactionCard`, `isSuccess/isCrit/isFumble`.
- Renderizado em `App.tsx:9284` com `onComplete={() => setCardAnim(null)}`.
- CSS inteiro num `<style>` interno; muitos keyframes `mp-card-seq-*`.

### `components/DiceAnimation.tsx` (`setDiceAnim` / `showDiceAnimation`)
- Overlay mais antigo com **dado 3D rolando** (fases `rolling → settling → result`), classes `mp-dice-*`.
- Tem prop `dramatic` e auto-ativa dramático quando `defenderResult !== undefined`.
- Usado por itens, selos, iniciativa e rolagens rápidas (call sites referenciados nas specs anteriores: ataque/itens/quick roll; `showDiceAnimation` em `App.tsx:3413+`).
- Renderizado em `App.tsx:9490` com `onComplete={() => setDiceAnim(null)}`.
- Observação: a spec `2026-06-17-dice-suspense-design.md` descreve fases `buildup`/`suspense-hold` que **não existem** no código atual (o componente foi simplificado depois). Esta spec substitui aquela direção.

### Bug do resultado repetido (causa-raiz provável)
Ambos os componentes incluem `onComplete` nas dependências do `useEffect` que orquestra a sequência. `onComplete` é uma arrow inline recriada a cada render do `App`. Durante a sequência (longa quando há reação, ~5 s), qualquer re-render do pai (popups de stat, timers de turno, etc.) recria `onComplete` → o efeito re-roda → reseta a fase para o início → re-agenda toda a sequência → o resultado reaparece/pisca. A confirmar com depuração sistemática, mas é o suspeito nº 1 e afeta os dois componentes.

---

## Arquitetura proposta

### Módulo comum novo: `components/combat/animFx.ts` (ou `.tsx` se exportar CSS como componente)

Centraliza o que hoje está duplicado/divergente entre os dois componentes:

- **Tokens de animação** — cores por resultado (crit dourado, falha vermelho, sucesso verde, reação azul), durações base, amplitudes de shake.
- **`prefersReducedMotion()`** — helper único (hoje duplicado nos dois arquivos).
- **Motor de pacing** — dado um `tier` (`'trivial' | 'dramatic'`) e o tipo de beat, retorna as durações de cada fase. Em `reduced`, encurta tudo.
- **Toolkit de juíce** — utilitários/keyframes reaproveitáveis (shake, flash, slow-mo/hit-stop, partículas/embers). Exportados como classes CSS + helpers de intensidade.
- **Keyframes/CSS compartilhados** — cortes diagonais, listras de fundo, sweep, number-pop, winner-pulse, etc., para os dois componentes consumirem (um look só).

Os dois componentes importam desse módulo. Continuam arquivos separados, mas deixam de divergir visualmente.

---

## Modelo de beats (sequência de turno)

Estágios nomeados, cada um com entrada/saída próprias. `CardRevealAnimation` usa todos; `DiceAnimation` usa só **Rolagem → Resultado**.

1. **Carta surge** (`card`) — a carta-comando entra (origem: linha/token do combatente ativo quando houver `[data-combat-token]`; senão centro), com giro/escala.
2. **Reação** (`reaction`, condicional) — a carta de reação do alvo surge do lado dele.
3. **Rolagem** (`rolls`) — painéis de número estilizados; o número conta/estoura e trava. No modo dramático, ganha *beat* de suspense (valores quase-acerto antes de travar no real). Quando há reação, os dois painéis (Ação × Reação) aparecem lado a lado.
4. **Resultado/Comparação** (`result`) — título grande: `ACERTO / FALHA / AÇÃO VENCE / REAÇÃO VENCE / ACERTO CRÍTICO / FALHA CRÍTICA` + subtítulo (ex.: "18 supera 12"). Aplica o juíce do desfecho.
5. **Resolução** (`resolve`) — sucesso: carta voa para o token do alvo + impacto/anel + shake do token + popup de dano. Fracasso com reação: *clash* (a reação cobre/quebra/arremessa a ação).

---

## Camada de juíce (impacto)

Reaproveitável, intensidade derivada do `tier`/desfecho, **toda** com kill-switch de `prefers-reduced-motion`:

- **Screen shake** — amplitude pequena no normal; maior no crítico/falha crítica.
- **Flash de cor** — dourado (crit), vermelho (falha crítica), verde (acerto), azul (reação vence).
- **Hit-stop / slow-mo** — atrasa o reveal ~150–250 ms no crit/falha para dar peso (sem telegrafar antes).
- **Partículas** — burst no impacto; *embers* subindo durante o build-up dramático.
- **Reação no alvo** — token do alvo treme + anel de impacto + popup de dano sincronizados com o beat de resolução (reusar `impactTargetId`/`fireStatPopup` existentes onde possível).

---

## Ritmo e controle

- **Tier por contexto** (derivado em `App.tsx` ao montar o payload, ou inferido no componente):
  - `dramatic` quando: há reação **OU** a carta/rolagem tem CD (`dc`/`combatDc > 0`) **OU** o resultado é crítico/falha.
  - `trivial` caso contrário.
  - O crit/falha **não** é telegrafado no build-up; o payoff extra entra só na revelação.
- **Durações-alvo:** `trivial` ~1–2 s no total; `dramatic` adiciona suspense-hold + payoff (alvo ~3–4 s, sem arrastar).
- **Clique para pular/avançar:** um clique **avança para o próximo beat**; clicar já no `result`/`resolve` **dispensa** (chama `onComplete`). Funciona em qualquer fase. O overlay precisa capturar clique (hoje é `pointer-events: none`; adicionar uma camada clicável ou trocar para `pointer-events: auto` no container com `onClick`).
- **`prefers-reduced-motion`:** corta shake/partículas/jitter; mantém fades/escala suaves; encurta as fases.

---

## Correção do bug (resultado repetido)

1. **Estabilizar `onComplete`** — envolver `() => setCardAnim(null)` e `() => setDiceAnim(null)` em `useCallback` no `App.tsx` (deps vazias), e/ou guardar `onComplete` num `ref` dentro de cada componente e **removê-lo das dependências** do `useEffect`.
2. **Disparar a sequência pela identidade do payload, não pela função** — usar o objeto `payload`/estado de dados como gatilho do efeito; quando o payload é o mesmo, não re-agendar.
3. **Aplicar o mesmo padrão nos dois componentes.**
4. **Validar com depuração sistemática** — reproduzir "ataque com reação", instrumentar a contagem de execuções do efeito/agendamentos, confirmar 1 disparo por ação e resultado exibido uma única vez. Conferir também itens/selos/iniciativa pelo `DiceAnimation`.

---

## Tratamento de erros / edge cases

- **Múltiplos alvos (área):** o beat de resolução faz a carta voar para cada token (`areaTargets`); juíce escalonado por `STAGGER`.
- **Token do alvo não encontrado** (`[data-combat-token]` ausente): fallback para posição central (já existe em `findTargetPoint`).
- **Skip no meio do dramático:** cancelar timers pendentes e pular direto ao resultado/dispensa, sem deixar juíce "preso" (limpar shake/flash).
- **`prefers-reduced-motion`:** sem shake/jitter; sequência encurtada.
- **Reação sem `reactionRoll`/`reactionCard`:** trata como rolagem simples (sem painel duplo).
- **Forma e Fusão:** intocadas (`formaAnimCard`, `FusionOverlay`).
- **Baseline `tsc --noEmit`:** comparar sempre contra os 29 erros pré-existentes citados nas specs anteriores.

---

## Verificação

- `npm run build` + `npx tsc --noEmit` sem **novos** erros (baseline 29).
- Checagem visual manual (usuário):
  - Ataque simples (sem reação, sem CD): sequência ágil (~1–2 s), resultado aparece **uma vez**.
  - Ataque **com reação**: painéis Ação × Reação, comparação, resolução; **sem repetição/piscar** do resultado.
  - Crítico e falha: payoff extra (flash/shake/slow-mo), sem telegrafar antes.
  - Item/selo/iniciativa (via `DiceAnimation`): visual coerente com o fluxo de carta.
  - Clique pula/avança em qualquer fase.
  - `prefers-reduced-motion` ativo: sem shake, transições suaves, mais curto.
  - Forma e Fusão continuam com suas animações próprias, sem regressão.

---

## Arquivos afetados

**Novos:**
- `components/combat/animFx.ts(x)` — tokens, keyframes/CSS compartilhados, `prefersReducedMotion`, motor de pacing por tier, toolkit de juíce.

**Modificados:**
- `components/CardRevealAnimation.tsx` — consumir o módulo comum; beats explícitos; camada de juíce; clique para pular; correção do `onComplete`/efeito.
- `components/DiceAnimation.tsx` — restyle com o look unificado (painéis/cortes); beats Rolagem → Resultado; clique para pular; mesma correção do efeito.
- `App.tsx` — `onComplete` estável (`useCallback`); derivar/passar `tier`/contexto dramático nos call sites de `setCardAnim` (`finalizeAction`) e `showDiceAnimation`/`setDiceAnim` (itens/selos/iniciativa).

**Intocados (de propósito):**
- Animação de Forma (`formaAnimCard` em `App.tsx`), `components/FusionOverlay.tsx`.
