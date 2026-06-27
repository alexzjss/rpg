# Jornada — Chrono Trigger (twilight storybook) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir a aba Jornada do clima pergaminho (claro) para "twilight storybook" estilo *Chrono Trigger* (crepúsculo roxo, estrelas, janelas SNES, portal/Gate), sem afetar as outras abas.

**Architecture:** Adiciona uma nova atmosfera base `dusk` em [utils/atmosphere.ts](../../../utils/atmosphere.ts) e aponta a Jornada para ela via o motor `applySectionTheme` já existente. O grosso é CSS: o bloco `.mp-journey*` em `index.html` (linhas ~3423-3565), que hoje **força** as classes Tailwind escuras a parecerem papel, é substituído por um bloco dusk/CT (remover os overrides claros → o escuro padrão aparece → aplicar janelas SNES + portal + diário). Edições leves de className/cores inline em [tabs/JourneyTab.tsx](../../../tabs/JourneyTab.tsx).

**Tech Stack:** React 19, Vite, TypeScript, Vitest, CSS no `<style>` de `index.html`.

**Non-regression invariant:** só a Jornada muda. `dusk` só é aplicado à Jornada; `parchment` permanece no código (inerte). As outras 4 abas ficam idênticas; Combate continua Metaphor.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Ação |
|---------|------------------|------|
| `utils/atmosphere.ts` | tipo `Atmosphere` + `dusk` em ATMOSPHERE_VARS + `TAB_ATMOSPHERE.journey` | Modificar |
| `utils/atmosphere.test.ts` | journey→dusk; 3 climas mesmo key-set | Modificar |
| `utils/sectionTheme.ts` | `JOURNEY_VARS` + journey usa dusk | Modificar |
| `index.html` (`<style>`) | page-bg dusk (starfield); reescrita do bloco `.mp-journey*` | Modificar |
| `tabs/JourneyTab.tsx` | cores inline das subabas → dusk; overlay de portal | Modificar |

Ordem: Fundação dusk (Tasks 1-2) → visual (Tasks 3-9) → verificação (Task 10). Cada visual é conferido no preview (aba Jornada, tecla 2).

---

## Task 1: Nova atmosfera `dusk` + teste

**Files:**
- Modify: `utils/atmosphere.ts`
- Test: `utils/atmosphere.test.ts`

- [ ] **Step 1: Atualizar o teste (vai falhar)**

Em `utils/atmosphere.test.ts`, substitua os dois primeiros `describe` por:

```ts
describe('atmosphereForTab', () => {
  it('jornada é dusk; o resto é escuro', () => {
    expect(atmosphereForTab('journey')).toBe('dusk');
    for (const t of ['combat','arsenal','characters','extras'] as const) {
      expect(atmosphereForTab(t)).toBe('dark');
    }
  });
});

describe('ATMOSPHERE_VARS', () => {
  it('os três climas definem exatamente o mesmo conjunto de vars', () => {
    const d = Object.keys(ATMOSPHERE_VARS.dark).sort();
    for (const climate of ['parchment','dusk'] as const) {
      expect(Object.keys(ATMOSPHERE_VARS[climate]).sort()).toEqual(d);
    }
  });
});
```
(O `describe('applyAtmosphere', ...)` existente permanece.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- atmosphere`
Expected: FAIL (`atmosphereForTab('journey')` ainda é 'parchment'; `ATMOSPHERE_VARS.dusk` é undefined).

- [ ] **Step 3: Implementar em `utils/atmosphere.ts`**

1. Tipo: `export type Atmosphere = 'dark' | 'parchment' | 'dusk';`
2. Em `TAB_ATMOSPHERE`, troque a linha do journey para: `combat: 'dark', arsenal: 'dark', characters: 'dark', extras: 'dark', journey: 'dusk',`
3. Em `ATMOSPHERE_VARS`, adicione a chave `dusk` com o MESMO conjunto de chaves de `dark`/`parchment`:
```ts
  dusk: {
    '--bg-base': '#150f2c',
    '--bg-surface': '#1d1640',
    '--bg-raised': '#2a1f55',
    '--bg-overlay': '#342861',
    '--text-primary': '#ece3ff',
    '--text-secondary': '#c4b3e8',
    '--text-muted': '#8f7fc0',
    '--border-faint': 'rgba(200,180,255,0.10)',
    '--border-mid': 'rgba(200,180,255,0.20)',
    '--surface-ink': '#ece3ff',
  },
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- atmosphere`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/atmosphere.ts utils/atmosphere.test.ts
git commit -m "feat(journey): nova atmosfera dusk (crepúsculo roxo) substitui parchment na Jornada"
```

---

## Task 2: Bundle roxo da Jornada (sectionTheme)

**Files:**
- Modify: `utils/sectionTheme.ts`
- Test: `utils/sectionTheme.test.ts`

- [ ] **Step 1: Adicionar asserção ao teste (vai falhar)**

Em `utils/sectionTheme.test.ts`, dentro do `describe('SECTION_THEMES', ...)`, adicione:
```ts
  it('journey usa atmosfera dusk e acento lavanda', () => {
    expect(SECTION_THEMES.journey.atmosphere).toBe('dusk');
    expect(SECTION_THEMES.journey.vars['--sec-accent']).toBe('#b9a3e8');
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- sectionTheme`
Expected: FAIL (journey.vars vazio; `--sec-accent` undefined).

- [ ] **Step 3: Implementar em `utils/sectionTheme.ts`**

Adicione, perto de `COMBAT_VARS`:
```ts
const JOURNEY_VARS: Record<string, string> = {
  '--sec-accent':   '#b9a3e8', // lavanda
  '--sec-accent-2': '#3a48b8', // azul-roxo da janela SNES
  '--sec-accent-3': '#c9568f', // magenta (alertas)
  '--sec-ink':      '#ece3ff',
};
```
E troque a entrada journey do registry de `{ atmosphere: atmosphereForTab('journey'), vars: {} }` para:
```ts
  journey:    { atmosphere: atmosphereForTab('journey'), vars: JOURNEY_VARS },
```
(`atmosphereForTab('journey')` já retorna `'dusk'` após a Task 1; `ALL_SEC_VAR_KEYS` inclui estas chaves automaticamente.)

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS (suite inteira; o teste de "clears combat vars ao trocar para extras" continua válido).

- [ ] **Step 5: Commit**

```bash
git add utils/sectionTheme.ts utils/sectionTheme.test.ts
git commit -m "feat(journey): bundle roxo (--sec-*) + atmosfera dusk no registry"
```

---

## Task 3: Fundo crepuscular + starfield + lua

**Files:**
- Modify: `index.html` (`<style>`, inserir perto do bloco `.mp-page-bg`, ~linha 3418)

- [ ] **Step 1: Inserir o page-bg dusk**

Após a linha `:root[data-atmosphere='parchment'] .mp-page-bg { background: var(--parchment-bg); }` (~3418), insira:
```css
/* ── JORNADA dusk: crepúsculo + estrelas + lua ── */
:root[data-atmosphere='dusk'] .mp-page-bg {
  background:
    radial-gradient(ellipse 130% 80% at 50% 100%, #4a2356 0%, transparent 62%),
    linear-gradient(180deg, #150f2c 0%, #2a1a4e 55%, #3a2356 100%);
}
:root[data-atmosphere='dusk'] .mp-page-bg::before {
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.9;
  background-image:
    radial-gradient(1.2px 1.2px at 14% 18%, rgba(233,226,255,0.9), transparent),
    radial-gradient(1px 1px at 32% 30%, rgba(233,226,255,0.7), transparent),
    radial-gradient(1.4px 1.4px at 56% 13%, #ffffff, transparent),
    radial-gradient(1px 1px at 72% 26%, rgba(201,180,255,0.8), transparent),
    radial-gradient(1.2px 1.2px at 84% 11%, rgba(233,226,255,0.85), transparent),
    radial-gradient(1px 1px at 24% 44%, rgba(233,226,255,0.6), transparent),
    radial-gradient(1px 1px at 46% 39%, rgba(201,180,255,0.7), transparent),
    radial-gradient(1.2px 1.2px at 64% 48%, rgba(233,226,255,0.6), transparent);
}
:root[data-atmosphere='dusk'] .mp-page-bg::after {
  content: ''; position: absolute; top: 7%; right: 8%; width: 44px; height: 44px; border-radius: 50%;
  background: #ece3ff; box-shadow: -12px 7px 0 -2px #20153f; opacity: 0.82; pointer-events: none;
}
```

- [ ] **Step 2: Verificar no preview**

Aba Jornada (tecla 2): fundo vira gradiente roxo crepuscular com estrelinhas e uma lua crescente no canto superior direito. As outras abas inalteradas (regra é `[data-atmosphere='dusk']`). `preview_screenshot`/inspect.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(journey): fundo dusk (gradiente crepuscular + starfield + lua)"
```

---

## Task 4: Remover overrides de pergaminho + base dusk de `.mp-journey`

**Files:**
- Modify: `index.html` (bloco `.mp-journey`, ~3423-3479)

- [ ] **Step 1: Substituir a regra base `.mp-journey`**

Troque o bloco `.mp-journey { ... --jp-* ... }` (~3423-3435) por:
```css
.mp-journey {
  position: relative;
  color: var(--text-primary);
  --ct-win-from: #3a48b8;
  --ct-win-to:   #201a62;
  --ct-border:   #e8ecff;
  --ct-ink:      #ece3ff;
  --ct-ink-soft: #cdbef0;
  --ct-lav:      #b9a3e8;
  --ct-star:     #f0e2a0;
  --ct-portal:   #bfe9ff;
}
```

- [ ] **Step 2: Remover os overrides que forçam pergaminho**

Delete inteiramente o bloco de overrides Tailwind (as regras `.mp-journey .text-white`, `.text-slate-*`, `.bg-slate-*`, `.border-slate-*`, `.glass-panel`, `.bg-slate-900.hover...`, `button.bg-slate-900`, `textarea::placeholder`) — aproximadamente linhas 3447-3479. Com elas removidas, as classes Tailwind escuras voltam ao padrão escuro (que combina com o dusk). NÃO mexa no bloco `:root[data-atmosphere='parchment'] .mp-page-bg::after` (textura de papel) — fica inerte sob dusk.

- [ ] **Step 3: Verificar no preview**

Aba Jornada: painéis/botões agora aparecem escuros (slate) sobre o fundo roxo — sem nada "papel". O texto deve estar claro/legível. (Estilo ainda cru; as janelas SNES vêm na Task 5.) `preview_screenshot`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(journey): remove overrides de pergaminho; base dusk com vars --ct-*"
```

---

## Task 5: Janelas SNES (`.ct-window`) nos painéis

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Inserir o tratamento de janela**

No bloco da Jornada, adicione:
```css
/* janela estilo SNES (borda clara nítida + gradiente azul-roxo) */
.mp-journey .glass-panel {
  background: linear-gradient(180deg, var(--ct-win-from), var(--ct-win-to)) !important;
  border: 2px solid var(--ct-border) !important;
  border-radius: 14px !important;
  color: var(--ct-ink) !important;
  box-shadow: 0 8px 30px rgba(10,6,30,0.5), inset 0 1px 0 rgba(255,255,255,0.18) !important;
  backdrop-filter: none !important;
}
```

- [ ] **Step 2: Verificar no preview**

Painel "Grupo Ativo" (e outros `.glass-panel` da Jornada) viram janelas azul-roxo com borda clara. `preview_screenshot`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(journey): painéis como janelas SNES (.ct-window)"
```

---

## Task 6: Header + subabas dusk

**Files:**
- Modify: `index.html`
- Modify: `tabs/JourneyTab.tsx` (cores inline das subabas, ~130-145)

- [ ] **Step 1: CSS de header/subtabs**

```css
.mp-journey-title {
  font-family: 'Playfair Display', Georgia, serif !important;
  font-style: italic; font-weight: 900;
  color: var(--ct-ink) !important;
  text-shadow: 0 2px 18px rgba(120,90,220,0.5);
}
.mp-journey-kicker {
  font-family: 'Cinzel', Georgia, serif !important;
  color: var(--ct-lav) !important; letter-spacing: 0.32em !important;
}
.mp-journey-subtabs {
  background: rgba(10,6,30,0.42) !important;
  border: 1px solid rgba(200,180,255,0.14) !important;
}
```

- [ ] **Step 2: Cores inline das subabas (JourneyTab.tsx ~130-145)**

Substitua os valores parchment/gold pelos tons dusk-harmonizados. A cor INATIVA (`'rgba(74,54,24,0.5)'`) vira lavanda; os ativos por modo:
- background ativo: cozinhar `'rgba(234,138,60,0.22)'`, forjar `'rgba(168,120,247,0.28)'`, upgrades `'rgba(52,200,180,0.20)'`, mapa `'rgba(120,140,255,0.25)'`.
- color ativo: cozinhar `'#f0b070'`, forjar `'#d2b8ff'`, upgrades `'#7fe0d0'`, mapa `'#cdd6ff'`.
- border ativo: cozinhar `'rgba(234,138,60,0.4)'`, forjar `'rgba(168,120,247,0.5)'`, upgrades `'rgba(52,200,180,0.4)'`, mapa `'rgba(200,180,255,0.45)'`.
- color INATIVA: `'rgba(185,163,232,0.6)'` (no lugar de `'rgba(74,54,24,0.5)'`).

- [ ] **Step 3: Verificar no preview**

Título "JORNADA" claro com brilho roxo; subabas com aba ativa colorida por modo (legível) e inativas em lavanda. Clique entre subabas (`preview_click`) e confirme legibilidade. `preview_screenshot`.

- [ ] **Step 4: Commit**

```bash
git add index.html tabs/JourneyTab.tsx
git commit -m "feat(journey): header storybook + subabas dusk (acentos por modo harmonizados)"
```

---

## Task 7: Moldura da localização → portal/Gate

**Files:**
- Modify: `index.html`
- Modify: `tabs/JourneyTab.tsx` (SVG dos cantos da moldura, ~209, se forem dourados)

- [ ] **Step 1: CSS da moldura de portal**

Substitua `.mp-journey-framed`, `.mp-journey-frame-overlay` (e mantenha os seletores de canto `--tl/--tr/--bl/--br`) por:
```css
.mp-journey-framed {
  border: 0 !important; border-radius: 16px !important;
  box-shadow:
    0 0 0 2px var(--ct-border),
    0 0 0 5px rgba(58,72,184,0.6),
    0 0 42px rgba(120,90,220,0.42),
    0 18px 50px rgba(10,6,30,0.6) !important;
}
.mp-journey-frame-overlay {
  position: absolute; inset: 0; z-index: 18; pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(232,236,255,0.5);
  background: radial-gradient(circle at 50% 44%, rgba(191,233,255,0.14), transparent 46%);
}
```

- [ ] **Step 2: Recolorir o SVG dos cantos (se dourado)**

Em `tabs/JourneyTab.tsx` (~209), os 4 `.mp-journey-frame-corner` renderizam um SVG. Se os `fill`/`stroke` forem dourados (`#f0c060`, `#9a7322`, `#c2410c`, `rgba(154,115,34,*)` etc.), troque por claro/portal: dourado→`#e8ecff`, âmbar/laranja→`#bfe9ff` (ciano-portal). Se já usarem `currentColor`/var, ajuste a cor pai. Reporte o que encontrou.

- [ ] **Step 3: Verificar no preview**

A imagem do local (subaba Mapa) fica emoldurada como um portal: borda clara + halo roxo/ciano, cantos claros. Banner "Local Desconhecido" legível. `preview_screenshot`.

- [ ] **Step 4: Commit**

```bash
git add index.html tabs/JourneyTab.tsx
git commit -m "feat(journey): localização emoldurada como portal/Gate (dusk)"
```

---

## Task 8: Diário de Bordo → janela CT + dropcap

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Inserir/substituir o CSS do diário**

```css
.mp-journey-chronicle {
  background: linear-gradient(180deg, var(--ct-win-from), var(--ct-win-to)) !important;
  border: 2px solid var(--ct-border) !important;
  border-left: 5px solid var(--ct-lav) !important;
  border-radius: 14px !important;
  box-shadow: 0 8px 30px rgba(10,6,30,0.5), inset 0 0 40px rgba(120,90,220,0.12) !important;
}
.mp-journey-chronicle__title {
  font-family: 'Cinzel', Georgia, serif !important;
  color: var(--ct-lav) !important; letter-spacing: 0.22em !important;
}
.mp-journey-chronicle textarea {
  background: transparent !important; border: none !important;
  color: var(--ct-ink-soft) !important; font-style: italic; line-height: 1.7 !important;
}
.mp-journey-dropcap::first-letter {
  float: left; font-family: 'Playfair Display', Georgia, serif; font-style: italic;
  font-weight: 900; font-size: 3.1em; line-height: 0.78; padding: 6px 10px 0 0;
  color: var(--ct-star); text-shadow: 0 2px 10px rgba(240,226,160,0.4);
}
.mp-journey-chronicle textarea::placeholder { color: rgba(205,190,242,0.5) !important; }
```

- [ ] **Step 2: Verificar no preview**

"Diário de Bordo" vira janela azul-roxo com borda clara, título lavanda, drop-cap dourado-quente, texto itálico lavanda. `preview_screenshot`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(journey): diário de bordo como janela CT com dropcap"
```

---

## Task 9: Cards (cozinhar/forjar/upgrades) + scan de resíduo

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Substituir o CSS de cards parchment por dusk**

Troque o bloco `.mp-jcard*` / `.mp-journey-cards` por:
```css
.mp-jcard { background: linear-gradient(180deg, var(--ct-win-from), var(--ct-win-to)) !important; }
.mp-jcard__panel { background: rgba(20,16,52,0.6) !important; }
.mp-jcard__white { color: var(--ct-ink) !important; }
.mp-jcard__muted { color: var(--ct-ink-soft) !important; }
.mp-jcard__faint { color: var(--ct-lav) !important; }
.mp-journey-cards select,
.mp-journey-cards input:not([type=range]),
.mp-journey-cards textarea {
  background: rgba(20,16,52,0.7) !important; color: var(--ct-ink) !important;
  border-color: rgba(200,180,255,0.25) !important;
}
.mp-journey-cards option { color: #ece3ff; background: #201a62; }
```

- [ ] **Step 2: Scan de resíduo parchment/gold na Jornada**

Grep `tabs/JourneyTab.tsx` por valores parchment/gold remanescentes: `#9a7322`, `#b4470f`, `rgba(201,152,58`, `rgba(74,54,24`, `var(--jp-`, `#ece0c2`, `bg-amber-600`. Para os que forem claramente "papel/ouro" no chrome da Jornada (não ícones semânticos), recolorir para dusk (lavanda/janela). O botão "Novo Local" (`bg-amber-600`) pode virar magenta/lavanda — troque a classe por estilo inline dusk se destoar. Reporte cada ocorrência e o que fez.

- [ ] **Step 3: Verificar no preview (subabas Cozinhar/Forjar/Upgrades)**

Clique em Cozinhar/Forjar/Upgrades (`preview_click`) e confirme que os cards/inputs estão em dusk (sem papel). `preview_screenshot` de cada.

- [ ] **Step 4: Commit**

```bash
git add index.html tabs/JourneyTab.tsx
git commit -m "feat(journey): cards e inputs em dusk + remove resíduo de pergaminho"
```

---

## Task 10: Verificação final

**Files:** nenhum (verificação).

- [ ] **Step 1: Suite + tipos**

Run: `npm test`
Expected: PASS (inclui atmosphere/sectionTheme atualizados).
Run: `npx tsc --noEmit`
Expected: apenas os 3 erros PRÉ-EXISTENTES (App.tsx:4746, App.tsx:5640, vitest.config.ts) — nenhum novo.

- [ ] **Step 2: Conferência das 5 abas no preview**

- Jornada: confere com o mockup `jornada_chrono_trigger` (crepúsculo, estrelas, janelas SNES, portal na localização, diário, subabas dusk). Percorra as 4 subabas.
- Combate: continua Metaphor (teal/crimson). Personagens/Arsenal/Extras: idênticas ao baseline.
- Via `preview_eval`, confirme `--bg-base`/`data-atmosphere` por aba: journey=dusk (`#150f2c`), demais inalteradas.

- [ ] **Step 3: Commit (se algum ajuste)**

Se tudo ok, nada a commitar.

---

## Auto-revisão do plano (feita)

- **Cobertura do spec:** §2.1 dusk atmosphere → Task 1; §2.2 teste → Task 1; §2.3 JOURNEY_VARS → Task 2; §3.1 fundo/starfield → Task 3; §3.2 remover overrides → Task 4; §3.3 janelas SNES → Task 5; §3.4 subabas → Task 6; §3.5 portal → Task 7; §3.6 diário → Task 8; §3.7 motivos (estrelas/portal) → Tasks 3/7; cards → Task 9; não-regressão → Tasks 4/10.
- **Placeholders:** lógica com TDD e código real; tarefas visuais com CSS completo + verificação no preview.
- **Consistência:** vars `--ct-*` definidas na Task 4 e usadas nas Tasks 5-9; `JOURNEY_VARS`/`SECTION_THEMES.journey` consistentes entre Tasks 1-2; chaves de ATMOSPHERE_VARS.dusk = mesmas de dark/parchment (validado pelo teste da Task 1).
- **Riscos:** o `!important` dos overrides parchment é removido na Task 4 — conferir no preview que nada ficou "papel"; SVG dos cantos pode ter ouro literal (Task 7 step 2 trata); `theme.ts` injeta paleta inline — Jornada usa pouco `var(--gold-*)`, mas o scan da Task 9 pega resíduos.
