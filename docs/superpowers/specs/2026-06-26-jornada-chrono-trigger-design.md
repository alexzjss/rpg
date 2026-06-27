# Identidades por Seção — Jornada (Chrono Trigger) — Design

**Data:** 2026-06-26
**Status:** Spec aprovado (design) — pronto para plano
**Escopo:** apenas a seção **Jornada**, reconstruída em estilo "twilight storybook" inspirado em *Chrono Trigger*. Parte do projeto de identidades por seção (Fundação + Combate já entregues).

---

## 1. Visão geral

Jornada hoje é um **pergaminho claro** ("Crônica de Viagem"): a classe `.mp-journey` envolve a aba e um bloco grande de CSS **força** as classes Tailwind escuras a parecerem papel creme. O alvo é **crepúsculo roxo** (Chrono Trigger): fundo dusk-purple com estrelas, **janelas de menu estilo SNES** (borda clara nítida + preenchimento gradiente azul-roxo), moldura de **portal (Gate)** na localização, e o Diário mantido porém reestilizado. Mantém a função (crônica/diário/subabas); troca toda a linguagem visual.

Decisão de direção (aprovada): **twilight storybook** — atmosfera dusk + janelas SNES + estrelas + motivos sutis de portal/relógio, mantendo o enquadramento de diário.

### Não-regressão
Só Jornada muda. Nenhuma das outras 4 abas é afetada. A atmosfera `parchment` deixa de ser usada (Jornada era a única consumidora) mas **permanece no código** para reuso futuro.

---

## 2. Arquitetura — `parchment` → nova atmosfera `dusk`

### 2.1 Nova atmosfera base `dusk` ([utils/atmosphere.ts](../../../utils/atmosphere.ts))
- Adicionar `'dusk'` ao tipo `Atmosphere`.
- `TAB_ATMOSPHERE.journey: 'dusk'` (era `'parchment'`).
- `ATMOSPHERE_VARS.dusk` com **exatamente o mesmo conjunto de chaves** de `dark`/`parchment`:
  ```
  '--bg-base': '#150f2c', '--bg-surface': '#1d1640', '--bg-raised': '#2a1f55', '--bg-overlay': '#342861',
  '--text-primary': '#ece3ff', '--text-secondary': '#c4b3e8', '--text-muted': '#8f7fc0',
  '--border-faint': 'rgba(200,180,255,0.10)', '--border-mid': 'rgba(200,180,255,0.20)',
  '--surface-ink': '#ece3ff',
  ```
- `parchment` permanece definido (não removido).

### 2.2 Teste ([utils/atmosphere.test.ts](../../../utils/atmosphere.test.ts))
- `atmosphereForTab('journey')` passa a esperar `'dusk'`.
- O teste "os climas definem o mesmo conjunto de vars" passa a cobrir **os três** climas (dark, parchment, dusk) — todos com o mesmo `Object.keys`.

### 2.3 Section theme ([utils/sectionTheme.ts](../../../utils/sectionTheme.ts))
- `SECTION_THEMES.journey`: `{ atmosphere: atmosphereForTab('journey') /* = 'dusk' */, vars: JOURNEY_VARS }`.
- `JOURNEY_VARS` (bundle roxo, inline via applySectionTheme):
  ```
  '--sec-accent': '#b9a3e8',    // lavanda (acento primário)
  '--sec-accent-2': '#3a48b8',  // azul-roxo da janela SNES
  '--sec-accent-3': '#c9568f',  // magenta (alertas/combate)
  '--sec-ink': '#ece3ff',
  ```
  (Como em Combate, qualquer var de paleta que precise virar roxo entra aqui para vencer a injeção inline de `theme.ts` — ver [[theme-engine-inline-var-gotcha]]. Hoje Jornada usa pouco `var(--gold-*)`; o grosso é CSS de `.mp-journey*`.)

---

## 3. Tratamento visual (Chrono Trigger)

### 3.0 Paleta e tipografia
- Crepúsculo: `#150f2c → #2a1a4e → #4a2356` (gradiente vertical).
- Janela SNES: gradiente `#3a48b8 → #201a62`, borda clara dupla `#e8ecff`.
- Texto: lavanda `#ece3ff` / `#cdbef0` / `#b9a3e8`.
- Acentos: estrela/drop-cap quente `#f0e2a0`; magenta `#c9568f` (combate/alerta); portal ciano-branco `#bfe9ff`.
- Tipografia display: serif storybook (Georgia) clara sobre o escuro.

### 3.1 Fundo da aba
- `:root[data-atmosphere='dusk'] .mp-page-bg` → **gradiente crepuscular** + **starfield** (pontos via data-uri/box-shadow ou pseudo) + **lua crescente** sutil; substitui a textura de papel do parchment.
- Remover o `::after` de textura de papel quando em dusk (não aplicar).

### 3.2 Remover overrides de pergaminho
- O bloco `.mp-journey .text-white/.text-slate-*/.bg-slate-*/.glass-panel/...` (que força claro) é **substituído**: em dusk deixamos o escuro padrão aparecer e aplicamos o tratamento de janela SNES. Remover/neutralizar essas regras de forçar-claro dentro de `.mp-journey`.

### 3.3 Janelas SNES (`.ct-window`)
- Novo tratamento: borda clara dupla nítida (`#e8ecff`) + preenchimento gradiente azul-roxo, cantos arredondados. Aplicado a `.mp-journey .glass-panel`, ao painel **Grupo Ativo**, ao **Diário**, e aos painéis de subabas (cozinhar/forjar/upgrades).

### 3.4 Subabas (Mapa/Cozinhar/Forjar/Upgrades)
- `.mp-journey-subtabs` → abas estilo menu CT: aba ativa = janela preenchida com borda clara; inativa = contorno lavanda discreto.
- Manter as **4 cores de submodo**, harmonizadas para dusk (cozinhar âmbar quente, forjar roxo, upgrades verde-azulado, mapa lavanda). Ajustar os estilos inline em [tabs/JourneyTab.tsx](../../../tabs/JourneyTab.tsx) (~130-143) para os tons dusk.

### 3.5 Moldura da localização (Mapa) → Portal/Gate
- `.mp-journey-framed` + `.mp-journey-frame-corner` → **viewport de portal**: borda clara + sobreposição de **redemoinho de portal** (anéis ciano-branco) e cantos reestilizados. Banner "Localização Atual / Local Desconhecido" em serif clara.

### 3.6 Diário de Bordo
- `.mp-journey-chronicle` + `.mp-journey-dropcap` → janela CT: drop-cap quente (`#f0e2a0`), texto lavanda, linhas de pauta sutis.

### 3.7 Motivos
- Redemoinho de portal sutil ao fundo; pequeno **relógio (End of Time)** como acento de canto; estrelas. Respeitar `prefers-reduced-motion` (sem girar o portal).

---

## 4. Arquivos
- `utils/atmosphere.ts` — tipo `Atmosphere` + `dusk` em ATMOSPHERE_VARS + `TAB_ATMOSPHERE.journey`.
- `utils/atmosphere.test.ts` — journey→dusk; 3 climas mesmo key-set.
- `utils/sectionTheme.ts` — `JOURNEY_VARS` + journey.atmosphere dusk.
- `index.html` — `[data-atmosphere='dusk']` page-bg (starfield); reescrever bloco `.mp-journey*` (remover parchment, adicionar `.ct-window`/portal/diário/subabas/título dusk).
- `tabs/JourneyTab.tsx` — tweaks de className (janelas, portal overlay) e cores inline das subabas para dusk.

## 5. Verificação
- `npm test` verde (inclui atmosphere.test atualizado).
- Preview: aba Jornada vira crepúsculo roxo com janelas SNES, portal na localização, diário reestilizado; as outras 4 abas permanecem idênticas. Combate continua Metaphor.
- `prefers-reduced-motion` respeitado.

## 6. Fora de escopo
- Demais seções (Arsenal/Personagens/Extras).
- Remoção da atmosfera `parchment` (mantida, só não usada).
- Mudanças funcionais na Jornada (subabas, receitas, mapa) — só visual.

## 7. Riscos
- O bloco `.mp-journey` força muitas classes Tailwind via `!important`; remover/substituir sem deixar resíduo claro exige cuidado (verificar no preview que nada ficou "papel").
- `theme.ts` injeta paleta inline — qualquer override de `--gold-*`/`--ember` para dusk tem que ir em `JOURNEY_VARS` (não CSS). Hoje Jornada usa poucos; conferir o subtab "mapa" (gold literal) e recolorir.
- Starfield/portal como SVG/CSS leve; sem raster pesado.
