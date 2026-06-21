# Dados com mais suspense (adaptativo)

**Data:** 2026-06-17
**Status:** Aprovado para implementação (aguardando revisão do spec)
**Contexto:** Feature #3 do roadmap (animações), item "dados com mais suspense". Melhora o `components/DiceAnimation.tsx` existente sem reconstruí-lo.

## Decisões do brainstorming

1. Técnicas: **todas as quatro** — build-up antes de rolar, tease na desaceleração, pausa dramática antes de travar, câmera/ambiente escalando.
2. Duração: **suspense só nos momentos grandes** (adaptativo). Rolagens normais ficam rápidas (~atual).
3. Gatilho: **por contexto** — rolagens com CD/defesa (combate, selos, contestadas). Crítico/falha ganham payoff extra só na revelação (sem telegrafar).
4. Tremor de tela: **sutil**, só no modo dramático, respeitando `prefers-reduced-motion`.

## Estado atual (não refazer)

`components/DiceAnimation.tsx` já tem:
- `SingleDie` com fases `hidden→cycling→slowing→landing→revealed`, rotação 3D, sequência de desaceleração (`slowT`) terminando no `finalValue`, bounce de aterrissagem (`die-land3d`).
- `DiceAnimation` com fases `rolling→burst→result`, `ParticleBurst`, slam do resultado, barra VS (`defenderResult`), tratamento de crit/fumble.
- Timings: `ROLL_DUR=1600`, `STAGGER=170`, `TOTAL_MS=5400`, `allRevAt`.
- Invocado via estado `diceAnim` no `App.tsx` (call sites: ataque ~5950, itens ~4537/4600/4713, quick "RESULTADO" ~5988) e renderizado em `App.tsx:11350`.
- Props: `isVisible, result, defenderResult, isSuccess, customLabel, notation, individualRolls, numSides, bonus, onComplete`.

## Modelo: modo adaptativo

### Novo prop `dramatic`
- Adicionar `dramatic?: boolean` a `DiceAnimationProps` e ao tipo do estado `diceAnim` (`App.tsx:3898`).
- **Auto-ativação interna:** o componente trata como dramático quando `dramatic === true` **ou** `defenderResult !== undefined` (contestada é sempre alto risco).
- **Call sites que passam `dramatic: true`:** a rolagem principal de ataque (`finalizeAction`, ~5950) e as rolagens de item/selo que têm CD (`combatDc > 0`) (~4537, ~4600, ~4713 conforme tenham CD). A quick roll "RESULTADO" (~5988) e rolagens avulsas **não** passam (ficam rápidas).
- Renderização em `App.tsx:11350` passa `dramatic={diceAnim?.dramatic}`.

### Modo rápido (dramatic falso)
- Comportamento atual, **pulando** a fase de build-up e a pausa dramática. Mantém giro + desaceleração + reveal. Duração ~atual (5,4s) ou pouco menos.

### Modo dramático (dramatic verdadeiro) — sequência
Duração-alvo ~7-8s. Nova fase de topo `buildup` antes de `rolling`.

1. **Build-up (~1s)** — fase `buildup`:
   - Backdrop escurece mais; uma **vinheta** (radial inset shadow) fecha de fora para dentro.
   - Os dados se **materializam**: `opacity 0→1` + `scale 0.6→1` com leve flutuação.
   - **Glow pulsando** tipo batimento (keyframe `suspense-heartbeat`) sob os dados.
   - Label "⚔ Desafiando o Destino ⚔" entra com intensidade crescente (escala/opacidade subindo).
2. **Giro** — fase `rolling` (atual `cycling`):
   - Rotação 3D existente.
   - **Ambiente escalando:** vinheta aperta gradualmente, **tremor de tela sutil** crescente (keyframe `screen-shake`, amplitude pequena, ex.: 0→3px), partículas subindo de baixo (novo `RisingEmbers`), glow intensificando.
3. **Tease na desaceleração** — estende `slowT`:
   - Sequência de desaceleração mais longa, com os últimos valores **enviesados para perto do `finalValue`** (quase-acertos: finalValue±1, ±2) antes de assentar no valor real.
4. **Pausa dramática (~0.5s)** — nova fase `suspense-hold` entre `slowing` e `landing`:
   - O dado **treme na borda** (micro-jitter), todo o **ambiente recua** (vinheta relaxa, tremor para, partículas somem) — um beat de silêncio visual.
5. **Trava + revelação:**
   - `landing` (bounce `die-land3d` atual) → número crava → `ParticleBurst` → slam do resultado (atual).
   - **Crítico/falha:** payoff extra **só aqui** — burst maior (mais partículas), leve **slow-mo** (atrasar o reveal ~150-250ms), **flash de tela** dourado (crit) ou vermelho (falha). Sem qualquer pista disso no build-up.

### Acessibilidade
- Detectar `window.matchMedia('(prefers-reduced-motion: reduce)')`. Quando ativo: desligar o tremor de tela e reduzir o jitter; manter as demais transições suaves (opacidade/escala).

## Arquitetura

- **Tudo dentro de `components/DiceAnimation.tsx`** — sem novos arquivos. Mudanças:
  - `DiceAnimationProps`: + `dramatic?: boolean`.
  - Máquina de fases do `DiceAnimation`: inserir `buildup` no início (só dramático) e orquestrar os timings condicionalmente (dramático vs rápido) via constantes derivadas.
  - `SingleDie`: aceitar flags para a pausa dramática (`holdMs`) e o tease estendido; ajustar `slowT`/`landT` conforme dramático.
  - Novos keyframes CSS no bloco `<style>`: `suspense-heartbeat`, `screen-shake`, `vignette-close`, `rising-ember`, `crit-flash`.
  - Novo subcomponente `RisingEmbers` (partículas subindo) ativo no modo dramático.
  - Helper de `prefers-reduced-motion`.
- `App.tsx`: + campo `dramatic` no tipo `diceAnim`; passar `dramatic` no JSX (11350); setar `dramatic: true` nos call sites de combate/CD.

## Tratamento de erros / edge cases
- Múltiplos dados (`numDice>1`): build-up e pausa aplicados ao conjunto; o tease/hold por dado respeita o `STAGGER` (o último a travar comanda a pausa dramática).
- `prefers-reduced-motion`: sem shake/jitter.
- Clique para pular: funciona em qualquer fase (chama `onComplete`).
- Modo rápido nunca entra em `buildup`/`suspense-hold`.

## Verificação
- `npm run build` + `npx tsc --noEmit` sem novos erros (baseline 29).
- Checagem visual manual (usuário): rolagem de ataque em combate (com CD/defesa) deve ter o suspense completo; uma quick roll avulsa deve ser rápida; crit/falha devem ter o payoff extra; conferir com 1 e com vários dados.

## Arquivos afetados
- `components/DiceAnimation.tsx` (núcleo da feature).
- `App.tsx`: tipo `diceAnim` + prop no JSX + `dramatic: true` nos call sites de combate/CD.
