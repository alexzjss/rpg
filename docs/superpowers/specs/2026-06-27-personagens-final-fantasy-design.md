# Identidades por Seção — Personagens (Final Fantasy) — Design

**Data:** 2026-06-27
**Status:** Spec aprovado (design) — pronto para plano
**Escopo:** apenas a seção **Personagens**, reconstruída em estilo *Final Fantasy* (azul, janelas de comando translúcidas, cristais, barras HP/MP). Parte do projeto de identidades por seção (Fundação + Combate + Jornada + Arsenal já entregues).

---

## 1. Visão geral

Personagens hoje é uma aba escura "ardente" envolta em `.mp-darktab` (marrom/ouro). Estrutura: barra de ações ("Receptáculos & Vínculos", botões Novo/NPC), grid `.mp-character-grid` com seções Cast/NPC (divisores `.mp-section-divider`), cartões `CharacterCard`, e empty state `.mp-empty` — tudo inline em [App.tsx](../../../App.tsx) (~6069-6163). O alvo é **Final Fantasy**: azul profundo, **janelas de comando translúcidas** com bordas claras nítidas, acentos **cristalinos** (losangos cyan) e **barras HP (verde) / MP (azul)**. Elegância de menu, calmo e legível.

Decisão de translucidez (aprovada — "o melhor"): janela **quase-opaca** (alpha ~0.92) — mantém o look FF e a legibilidade nos cartões densos.

### Não-regressão (ponto-chave)
`.mp-darktab` é **compartilhado** com Arsenal e Extras. Todo o tratamento FF é escopado sob `:root[data-section='characters']` — o `.mp-darktab` base **não** é tocado. Arsenal (Persona) e Extras (quente) ficam idênticos; Combate/Jornada intactos.

---

## 2. Arquitetura (mesmo padrão do Arsenal)

O motor já escreve `data-section='characters'`. O aquecimento marrom/ouro vem de (1) valores literais no CSS de `.mp-darktab` e (2) vars de paleta (`--gold-*`/`--ember`) injetadas inline por `theme.ts`.

- **Bundle `CHARACTERS_VARS`** ([utils/sectionTheme.ts](../../../utils/sectionTheme.ts)): `--sec-*` azuis + override de `--gold-*`/`--ember`/`--border-gold` para azul (inline vence a injeção; fallback `:root` garante limpeza ao sair). Wire na entrada `characters` do registry.
```
'--sec-accent':   '#5a9ae8', // azul FF
'--sec-accent-2': '#7fe0ff', // cristal cyan
'--sec-accent-3': '#a8c8ff', // azul claro
'--sec-ink':      '#eaf2ff',
'--gold-dim':'#1a3866', '--gold-mid':'#5a9ae8', '--gold-bright':'#7fe0ff', '--gold-pale':'#dceaff',
'--border-gold':'rgba(120,170,255,0.34)', '--ember':'#5a9ae8', '--ember-deep':'#1e4e9a',
```
- **CSS escopado** sob `:root[data-section='characters']` no `index.html` (vence por especificidade o `.mp-darktab …!important`).
- **Inline-vence-CSS** (lição do Arsenal): onde `CharacterCard`/divisores usam `background`/`border` inline ou `-webkit-*`, ajustar no JSX, não só CSS.

Personagens continua inline em `App.tsx`; `CharacterCard` é um componente — estilizar via CSS escopado + edições mínimas de JSX quando inline.

---

## 3. Tratamento visual (Final Fantasy)

### 3.0 Paleta e tipografia
- Azul profundo `#081428 → #0e2a52`; janela `#17386e → #0b2148` (~0.92 alpha); borda clara `#a8c8ff`/`#cfe2ff`; cristal cyan `#7fe0ff`; HP verde `#4ad08a`; MP azul `#5a9ae8`; texto `#eaf2ff`/`#b8cce8`.
- Display: serif elegante (Georgia) para nomes/labels; números em sans.

### 3.1 Fundo da aba
- `:root[data-section='characters'] .mp-page-bg` → gradiente azul profundo + **glints cristalinos** (losangos cyan finos) e linhas diagonais sutis.

### 3.2 Override do `.mp-darktab` (escopo characters)
- Superfícies marrom → azul-escuro (`#0a1c3c`/`#0c2148`); texto slate aquecido → azul-claro (`#eaf2ff`/`#b8cce8`/`#7fb3e8`); bordas ouro → azul-claro (`rgba(120,170,255,*)`); cyan→ouro revertido para cyan.

### 3.3 Cartões de personagem (`CharacterCard`) — janela de comando FF
- **Moldura dupla**: borda externa clara (`#a8c8ff`) + preenchimento gradiente azul translúcido (~0.92); cantos arredondados.
- Retrato com borda clara; nome em serif clara + "Lv N · CAST/NPC" em cyan; **acento de cristal** (losango) no canto.
- **Barras HP (verde) e MP/AP (azul)** com valores; chips de atributo (FOR/AGI/MAG…) em caixas azuis; painel "Vínculos".

### 3.4 Chrome
- `.mp-cta` / `.mp-cta--secondary` (Novo/NPC) → botões de comando FF (azul translúcido + borda clara; "Novo" preenchido).
- `.mp-section-divider` (Cast/NPC) → losango cyan + linha + contagem; recolorir os `--divider-color` inline (gold/slate) para cyan/azul.
- `.mp-empty` → azul/cristal. `.mp-section-kicker` → cyan.

### 3.5 Motivos
- Losangos/cristais cyan como acentos; bordas claras nítidas; sensação de menu translúcido. Respeitar `prefers-reduced-motion`.

---

## 4. Arquivos
- `utils/sectionTheme.ts` (+ test) — `CHARACTERS_VARS` + override de gold/ember.
- `index.html` — bloco `:root[data-section='characters']`: page-bg, override `.mp-darktab`, amber→azul, `.mp-cta`, dividers, `CharacterCard` janela FF, empty.
- `App.tsx` — `--divider-color`/`--divider-bg` inline dos divisores Cast/NPC para cyan/azul; quaisquer estilos inline de `CharacterCard` que vençam o CSS.

## 5. Verificação
- `npm test` verde.
- Preview: Personagens vira azul FF (cartões em janela translúcida, HP verde/MP azul, cristais); **Arsenal (Persona) e Extras (quente) idênticos**; Combate/Jornada intactos. Via eval: `--gold-mid` = `#5a9ae8` em characters; `#c9983a` em extras; `#d4142a` em arsenal.
- `prefers-reduced-motion` respeitado.

## 6. Fora de escopo
- Extras (cinza) — spec próprio; **não** tocar o `.mp-darktab` base.
- Mudanças funcionais (CRUD de personagens, modais) — só visual.

## 7. Riscos
- `.mp-darktab` compartilhado + `!important`: cada override precisa de `:root[data-section='characters'] .mp-darktab …` e cobertura completa.
- Inline-vence-CSS: `CharacterCard` e os `--divider-*` inline precisam de edição no JSX (não só CSS) — conferir no preview.
- Vars de paleta inline (theme.ts): overrides de gold/ember em `CHARACTERS_VARS`, não CSS.
- Cristais/glints como CSS/SVG leve.
