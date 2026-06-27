# Identidades por Seção — Arsenal (Persona) — Design

**Data:** 2026-06-27
**Status:** Spec aprovado (design) — pronto para plano
**Escopo:** apenas a seção **Arsenal**, reconstruída em estilo *Persona 5* (preto/carmesim, fora do grid, cinético). Parte do projeto de identidades por seção (Fundação + Combate + Jornada já entregues).

---

## 1. Visão geral

Arsenal hoje é uma aba escura "ardente": o conteúdo é envolto em `.mp-darktab`, cujo CSS **aquece** as classes Tailwind slate (cinza-frio) para marrom/ouro. Subabas: Habilidades / Itens / Selos / Armas (inline em [App.tsx](../../../App.tsx) ~6167). O alvo é **Persona 5**: preto/carmesim, tipografia bold-itálica pesada, faixas diagonais vermelhas, halftone, recortes irregulares; chrome bem cinético, **mas com os cards num grid legível** (skew leve ~1.5°), conforme escolhido.

Direção aprovada: **chrome cinético, listas legíveis**.

### Não-regressão (ponto-chave)
`.mp-darktab` é **compartilhado** com Personagens e Extras. Portanto todo o tratamento Persona é escopado sob `:root[data-section='arsenal']` — sobrescrevendo o aquecimento só ali. **Nada** muda em `.mp-darktab` base. Combate/Jornada intactos.

---

## 2. Arquitetura

O motor já escreve `data-section='arsenal'`. O aquecimento marrom/ouro vem de duas fontes:
1. **Valores literais** no CSS de `.mp-darktab` (`#1b1710`, `#241e14`, `rgba(201,152,58,*)`, `#f0c060`, regra que converte cyan→ouro). → sobrescrever com regras `:root[data-section='arsenal'] .mp-darktab …` (maior especificidade vence o `!important` existente).
2. **Vars de paleta** injetadas inline por `theme.ts` (`--gold-*`, `--ember`, `--accent`). → sobrescrever via `applySectionTheme` (inline vence CSS — ver [[theme-engine-inline-var-gotcha]]).

Arsenal permanece inline em `App.tsx` (não extraído). Trabalho = CSS escopado + poucos ajustes inline (cor ativa das subabas, banner do header).

### Bundle `ARSENAL_VARS` ([utils/sectionTheme.ts](../../../utils/sectionTheme.ts))
```
'--sec-accent':   '#d4142a', // carmesim
'--sec-accent-2': '#f01030', // vermelho vivo
'--sec-accent-3': '#ff3a5e', // rosa-vermelho
'--sec-ink':      '#f4f0e8', // branco-osso
```
Mais overrides inline para neutralizar o ouro: `--gold-dim/-mid/-bright/-pale → tons de carmesim/branco`, `--ember → #d4142a`, `--ember-deep → #8a0a18` (todos com fallback `:root` já garantido pelo trabalho de Combate/Jornada, então remover ao sair de arsenal é seguro).

---

## 3. Tratamento visual (Persona)

### 3.0 Paleta e tipografia
- Carmesim `#d4142a` / vivo `#f01030`; preto `#0c0708`; superfície de card `#141014`; branco-osso `#f4f0e8`; cinza `#5a5560`; rosa `#ff3a5e`.
- Display: bold-itálico pesado, caixa-alta (Arial Black italic / similar).

### 3.1 Fundo da aba
- `:root[data-section='arsenal'] .mp-page-bg` → preto + **faixas diagonais carmesim** + **halftone** (pontos vermelhos, data-uri/radial). Cantos com sombras vermelhas.

### 3.2 Override do `.mp-darktab` (escopo arsenal)
- Superfícies marrom (`#1b1710`/`#241e14`/`#2e2718`) → preto (`#0c0708`/`#141014`/`#1c1418`).
- Texto slate aquecido (`#ddcfb0`/`#b8a888`/…) → branco-osso/cinza frio (`#f4f0e8`/`#cabfc2`/`#7a7074`).
- Bordas ouro (`rgba(201,152,58,*)`) → carmesim (`rgba(212,20,42,*)`).
- Regra cyan→ouro (`[style*="rgb(103,232,249)"]`) e `rgb(56,189,248)→#f59e0b` → vermelho (`#f01030`).

### 3.3 Header "ARSENAL"
- O `<h2>` já é `font-black uppercase italic` — aplicar **banner diagonal preto/carmesim** com **slash vermelho** e drop bold-itálico. Kicker "Habilidades · Itens · Selos · Armas" em rosa.

### 3.4 Subabas (Habilidades/Itens/Selos/Armas)
- Ativa hoje `bg-amber-600` (App.tsx ~6179) → **carmesim**; reshaped como **paralelogramo inclinado** (clip-path skew) estilo menu P5. Inativa = contorno escuro + texto cinza-rosado.

### 3.5 Cards (skills/itens/selos/armas) — grid legível com skew
- Painéis pretos (`#141014`) com **slash vermelho no topo**, **canto cortado** (jagged) e **skew leve (~1.5°)**; nome em bold-itálico branco; tag de tipo (ATAQUE/CURA/SELO/ARMA/ITEM) em caixinha vermelha; stats em itálico cinza. Mantém o grid escaneável.
- Estilizado via CSS escopado sobre as classes de card existentes (a confirmar no plano) + possíveis classes utilitárias `.p5-card`/`.p5-slash`.

### 3.6 Motivos
- Estilhaços diagonais vermelhos + halftone ao fundo/cantos; tipografia bold-itálica pesada. Respeitar `prefers-reduced-motion` (sem animação cinética que ignore o toggle).

---

## 4. Arquivos
- `utils/sectionTheme.ts` — `ARSENAL_VARS` + overrides de gold/ember para arsenal.
- `index.html` — bloco `:root[data-section='arsenal']`: page-bg (preto+vermelho+halftone), override de `.mp-darktab`, subabas, cards, header; utilitários `.p5-*` se necessário.
- `App.tsx` — cor ativa das subabas (amber→carmesim) + banner do header; classes de card se preciso.

## 5. Verificação
- `npm test` verde.
- Preview: aba Arsenal vira preto/carmesim Persona (header banner, subabas inclinadas, cards skew com slash/recorte, halftone); **Personagens e Extras continuam com `.mp-darktab` quente e idênticos**; Combate/Jornada intactos.
- `prefers-reduced-motion` respeitado.

## 6. Fora de escopo
- Personagens (FF azul) e Extras (cinza) — specs próprios; **não** alterar o `.mp-darktab` base.
- Mudanças funcionais no Arsenal (subabas, CRUD de itens/skills/selos/armas) — só visual.

## 7. Riscos
- `.mp-darktab` é compartilhado e usa `!important`; cada override precisa de `:root[data-section='arsenal'] .mp-darktab …` (especificidade maior) e cobertura completa para não deixar resíduo marrom em Arsenal — conferir no preview.
- Vars de paleta inline (theme.ts) — overrides de gold/ember têm que ir em `ARSENAL_VARS`, não CSS.
- Skew/clip-path nos cards não pode quebrar hit-area de botões dentro deles — rotação/skew só visual, alvo de clique retangular.
- Halftone como CSS/SVG leve; sem raster pesado.
