# Arsenal — Persona 5 (preto/carmesim, off-grid) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir a aba Arsenal do clima "ardente" (marrom/ouro via `.mp-darktab`) para *Persona 5* (preto/carmesim, bold-itálico, faixas diagonais, halftone, cards recortados com skew leve), sem afetar Personagens/Extras.

**Architecture:** O motor já escreve `data-section='arsenal'`. Como `.mp-darktab` é **compartilhado** com Personagens/Extras, todo o tratamento é escopado sob `:root[data-section='arsenal']` — vencendo por especificidade as regras `.mp-darktab` (que usam `!important`) e as classes Tailwind `amber-*`/`slate-*`. Como só a aba ativa é renderizada, `:root[data-section='arsenal'] .bg-amber-600` só atinge elementos do Arsenal. Vars de paleta (gold/ember, injetadas inline por `theme.ts`) são sobrescritas via `applySectionTheme`. Arsenal continua inline em `App.tsx`.

**Tech Stack:** React 19, Vite, TS, Vitest, CSS no `<style>` de `index.html`.

**Non-regression invariant:** só Arsenal muda. `.mp-darktab` base intacto → Personagens/Extras idênticos. Combate/Jornada intactos.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Ação |
|---------|------------------|------|
| `utils/sectionTheme.ts` | `ARSENAL_VARS` (carmesim) + overrides gold/ember | Modificar |
| `utils/sectionTheme.test.ts` | asserção arsenal | Modificar |
| `index.html` (`<style>`) | bloco `:root[data-section='arsenal']`: page-bg, override mp-darktab, amber→red, subabas, header, cards | Modificar |
| `App.tsx` | classe nas subabas (slant) + className do header se preciso | Modificar |

Ordem: Fundação (A1) → page-bg (A2) → overrides base (A3-A4) → chrome (A5-A6) → cards (A7) → verificação (A8). Cada visual conferido no preview (Arsenal = tecla 4).

---

## Task A1: Bundle carmesim do Arsenal (sectionTheme)

**Files:**
- Modify: `utils/sectionTheme.ts`
- Test: `utils/sectionTheme.test.ts`

- [ ] **Step 1: Asserção no teste (falha)**

Em `utils/sectionTheme.test.ts`, dentro do `describe('SECTION_THEMES', ...)`:
```ts
  it('arsenal usa acento carmesim e override de ember', () => {
    expect(SECTION_THEMES.arsenal.vars['--sec-accent']).toBe('#d4142a');
    expect(SECTION_THEMES.arsenal.vars['--ember']).toBe('#d4142a');
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- sectionTheme`
Expected: FAIL (`arsenal.vars` vazio).

- [ ] **Step 3: Implementar em `utils/sectionTheme.ts`**

Adicione perto de `COMBAT_VARS`/`JOURNEY_VARS`:
```ts
const ARSENAL_VARS: Record<string, string> = {
  '--sec-accent':   '#d4142a', // carmesim
  '--sec-accent-2': '#f01030', // vermelho vivo
  '--sec-accent-3': '#ff3a5e', // rosa-vermelho
  '--sec-ink':      '#f4f0e8', // branco-osso
  // override do ouro/ember injetado inline por theme.ts (fallback :root garante limpeza ao sair)
  '--gold-dim':    '#5a0a14',
  '--gold-mid':    '#d4142a',
  '--gold-bright': '#f01030',
  '--gold-pale':   '#ffd9de',
  '--border-gold': 'rgba(212,20,42,0.34)',
  '--ember':       '#d4142a',
  '--ember-deep':  '#8a0a18',
};
```
E troque a entrada arsenal do registry para:
```ts
  arsenal:    { atmosphere: atmosphereForTab('arsenal'), vars: ARSENAL_VARS },
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS (count sobe +1 do novo teste).

- [ ] **Step 5: Commit**

```bash
git add utils/sectionTheme.ts utils/sectionTheme.test.ts
git commit -m "feat(arsenal): bundle carmesim + override de ouro/ember (Persona)"
```

---

## Task A2: Fundo Persona (preto + faixas vermelhas + halftone)

**Files:**
- Modify: `index.html` (perto do `.mp-page-bg`, ~3418; depois das regras dusk)

- [ ] **Step 1: Inserir o page-bg arsenal**

```css
/* ── ARSENAL Persona: preto + faixas diagonais + halftone ── */
:root[data-section='arsenal'] .mp-page-bg {
  background:
    linear-gradient(118deg, transparent 0 46%, rgba(212,20,42,0.10) 46.2% 47%, transparent 47.2% 63%, rgba(212,20,42,0.07) 63.2% 64%, transparent 64.2%),
    #0c0708;
}
:root[data-section='arsenal'] .mp-page-bg::before {
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
  background-image: radial-gradient(rgba(212,20,42,0.5) 1px, transparent 1.4px);
  background-size: 12px 12px;
  -webkit-mask-image: linear-gradient(135deg, #000 0 22%, transparent 42%);
          mask-image: linear-gradient(135deg, #000 0 22%, transparent 42%);
}
:root[data-section='arsenal'] .mp-page-bg::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 100% 100%, rgba(212,20,42,0.10), transparent 40%);
}
```

- [ ] **Step 2: Verificar no preview**

Aba Arsenal (tecla 4): fundo preto com faixa diagonal vermelha sutil e halftone no canto superior-esquerdo. Outras abas inalteradas. `preview_screenshot`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(arsenal): fundo Persona (preto + faixas + halftone)"
```

---

## Task A3: Override do `.mp-darktab` quente → Persona

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Inserir overrides escopados**

```css
/* ── ARSENAL: neutraliza o aquecimento do .mp-darktab ── */
:root[data-section='arsenal'] .mp-darktab .text-slate-300 { color: #f4f0e8 !important; }
:root[data-section='arsenal'] .mp-darktab .text-slate-400 { color: #cabfc2 !important; }
:root[data-section='arsenal'] .mp-darktab .text-slate-500 { color: #8a8086 !important; }
:root[data-section='arsenal'] .mp-darktab .text-slate-600 { color: #6a6066 !important; }
:root[data-section='arsenal'] .mp-darktab .text-slate-700 { color: #4a444a !important; }
:root[data-section='arsenal'] .mp-darktab .bg-slate-900,
:root[data-section='arsenal'] .mp-darktab .bg-slate-900\/80,
:root[data-section='arsenal'] .mp-darktab .bg-slate-900\/60,
:root[data-section='arsenal'] .mp-darktab .bg-slate-900\/50,
:root[data-section='arsenal'] .mp-darktab .bg-slate-950 { background-color: #100a0c !important; }
:root[data-section='arsenal'] .mp-darktab .bg-slate-800,
:root[data-section='arsenal'] .mp-darktab .bg-slate-800\/80,
:root[data-section='arsenal'] .mp-darktab .bg-slate-800\/60,
:root[data-section='arsenal'] .mp-darktab .bg-slate-800\/50 { background-color: #1a1218 !important; }
:root[data-section='arsenal'] .mp-darktab .hover\:bg-slate-800:hover,
:root[data-section='arsenal'] .mp-darktab .hover\:bg-slate-700:hover { background-color: #241820 !important; }
:root[data-section='arsenal'] .mp-darktab .border-slate-800 { border-color: rgba(212,20,42,0.22) !important; }
:root[data-section='arsenal'] .mp-darktab .border-slate-700 { border-color: rgba(212,20,42,0.34) !important; }
:root[data-section='arsenal'] .mp-darktab .border-slate-600 { border-color: rgba(212,20,42,0.45) !important; }
:root[data-section='arsenal'] .mp-darktab [style*="color: rgb(103, 232, 249)"] { color: #f01030 !important; }
:root[data-section='arsenal'] .mp-darktab [style*="rgb(56, 189, 248)"] { color: #f01030 !important; }
```

- [ ] **Step 2: Verificar no preview**

Superfícies/textos do Arsenal viram preto + branco-osso + bordas vermelhas (sem marrom). `preview_screenshot`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(arsenal): override do .mp-darktab (marrom -> preto/carmesim)"
```

---

## Task A4: Tailwind amber → carmesim (escopo arsenal)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Inserir overrides amber**

```css
/* ── ARSENAL: âmbar/ouro Tailwind -> carmesim ── */
:root[data-section='arsenal'] .bg-amber-600,
:root[data-section='arsenal'] .bg-amber-500 { background-color: #d4142a !important; box-shadow: 0 0 15px rgba(212,20,42,0.45) !important; }
:root[data-section='arsenal'] .hover\:bg-amber-500:hover,
:root[data-section='arsenal'] .hover\:bg-amber-600:hover { background-color: #f01030 !important; }
:root[data-section='arsenal'] .bg-amber-700\/40 { background-color: rgba(212,20,42,0.30) !important; }
:root[data-section='arsenal'] .text-amber-300,
:root[data-section='arsenal'] .text-amber-400 { color: #ff7a8c !important; }
:root[data-section='arsenal'] .border-amber-400\/30,
:root[data-section='arsenal'] .border-amber-600\/40,
:root[data-section='arsenal'] .border-amber-600 { border-color: rgba(212,20,42,0.5) !important; }
:root[data-section='arsenal'] .focus\:border-amber-600:focus { border-color: #f01030 !important; }
```

- [ ] **Step 2: Verificar no preview**

Botões "Nova", filtros ativos, foco de busca e subaba ativa ficam carmesim (sem ouro). `preview_screenshot`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(arsenal): amber Tailwind -> carmesim no escopo arsenal"
```

---

## Task A5: Subabas inclinadas (paralelogramo Persona)

**Files:**
- Modify: `App.tsx` (subaba ~6176-6182)
- Modify: `index.html`

- [ ] **Step 1: Adicionar classe na subaba (App.tsx)**

Na subaba do Arsenal, adicione `p5-subtab` ao className do botão (linha ~6179), preservando o resto:
```tsx
className={`p5-subtab flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all ${arsenalSubTab === sub.id ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(201,152,58,0.4)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
```

- [ ] **Step 2: CSS do paralelogramo (index.html)**

```css
:root[data-section='arsenal'] .p5-subtab {
  border-radius: 0 !important;
  clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
  font-style: italic;
}
```

- [ ] **Step 3: Verificar no preview**

As 4 subabas (Habilidades/Itens/Selos/Armas) viram paralelogramos inclinados; ativa em carmesim. Clique entre elas (`preview_click`). `preview_screenshot`.

- [ ] **Step 4: Commit**

```bash
git add App.tsx index.html
git commit -m "feat(arsenal): subabas como paralelogramos Persona"
```

---

## Task A6: Header em banner diagonal

**Files:**
- Modify: `index.html`

- [ ] **Step 1: CSS do header**

Os títulos de seção do Arsenal são `<h2 class="text-4xl font-black uppercase italic">` (ex.: "Grimório", "Arsenal") dentro de `.mp-darktab`. Estiliza como banner Persona:
```css
:root[data-section='arsenal'] .mp-darktab h2 {
  position: relative; display: inline-block;
  padding: 6px 22px 6px 16px;
  background: #0a0506;
  color: #f4f0e8 !important;
  clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
  border-left: 5px solid #d4142a;
  text-shadow: 0 2px 0 rgba(212,20,42,0.6);
}
:root[data-section='arsenal'] .mp-darktab h2::after {
  content: ''; position: absolute; left: -5px; bottom: -7px; width: 70%; height: 4px;
  background: linear-gradient(90deg, #f01030, transparent);
}
```

- [ ] **Step 2: Verificar no preview**

O título de cada subaba vira banner preto inclinado com slash vermelho. `preview_screenshot` (Habilidades + Itens).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(arsenal): header em banner diagonal Persona"
```

---

## Task A7: Cards Persona (recorte + skew + slash)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: CSS dos cards**

Os cards de Arsenal têm container `group relative border rounded-[2.5rem] overflow-hidden` (escapa para `.rounded-\[2\.5rem\]`). Aplica a casca Persona:
```css
:root[data-section='arsenal'] .mp-darktab .group.rounded-\[2\.5rem\] {
  border-radius: 4px !important;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%);
  transform: rotate(-1.2deg);
  background-color: #141014 !important;
  border-width: 1.5px !important;
}
:root[data-section='arsenal'] .mp-darktab .group.rounded-\[2\.5rem\]:nth-child(even) { transform: rotate(0.8deg); }
:root[data-section='arsenal'] .mp-darktab .group.rounded-\[2\.5rem\]::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 8px; z-index: 2;
  background: linear-gradient(90deg, #f01030, #8a0a18); pointer-events: none;
}
:root[data-section='arsenal'] .mp-darktab .group.rounded-\[2\.5rem\] h3 { font-style: italic; }
```

- [ ] **Step 2: Verificar no preview e ajustar acentos de tipo**

Inspecione os cards (Habilidades): devem ter casca preta, slash vermelho no topo, canto inferior-direito recortado, skew leve alternado, nome bold-itálico. As cores por tipo (`getCardColors`) ainda aparecem na borda/badge/nome — recoloque para a família carmesim/branco onde destoar do Persona (via overrides escopados das classes de cor que os cards usam; identifique no preview com `preview_inspect`). Confirme que o skew não quebra hover/clique dos botões internos (`preview_click` em editar). `preview_screenshot`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(arsenal): cards Persona (recorte + skew + slash vermelho)"
```

---

## Task A8: Verificação final

**Files:** nenhum (verificação).

- [ ] **Step 1: Suite + tipos**

Run: `npm test`
Expected: PASS.
Run: `npx tsc --noEmit`
Expected: apenas os 3 erros PRÉ-EXISTENTES (App.tsx:4746, App.tsx:5640, vitest.config.ts) — nenhum novo.

- [ ] **Step 2: Conferência no preview**

- Arsenal: percorra as 4 subabas (Habilidades/Itens/Selos/Armas) — preto/carmesim Persona, banners inclinados, subabas em paralelogramo, cards recortados com skew/slash, halftone. Confere com o mockup `arsenal_persona`.
- **Personagens e Extras**: idênticas ao baseline (ainda `.mp-darktab` quente/marrom). `preview_screenshot` de cada.
- Combate (Metaphor) e Jornada (dusk): intactos.
- Via `preview_eval`: `--gold-mid` = `#d4142a` em arsenal e `#c9983a` em characters/extras (override só no arsenal).

- [ ] **Step 3: Commit (se ajuste)**

Se tudo ok, nada a commitar.

---

## Auto-revisão do plano (feita)

- **Cobertura do spec:** §2 bundle/overrides → A1; §3.1 fundo → A2; §3.2 override mp-darktab → A3; §3.3 header → A6; §3.4 subabas → A5 (+ amber em A4); §3.5 cards → A7; amber chrome → A4; §3.6 motivos (halftone/faixas) → A2; não-regressão → A8.
- **Placeholders:** lógica com TDD e código real; tarefas visuais com CSS completo + verificação no preview. A7 step 2 deixa o ajuste fino de acentos de tipo como trabalho guiado no preview (intenção explícita), não placeholder de código.
- **Consistência:** `ARSENAL_VARS`/`SECTION_THEMES.arsenal` entre A1; classe `p5-subtab` entre A5 (App.tsx) e A5 (CSS); seletor `.group.rounded-\[2\.5rem\]` entre A7.
- **Riscos:** especificidade — `:root[data-section='arsenal'] .mp-darktab …` vence o `.mp-darktab …!important`; o bloco deve vir **depois** das regras `.mp-darktab` base no `<style>`. Skew dos cards é só visual (alvo de clique retangular). Cores por tipo dos cards são semânticas — A7 step 2 decide caso a caso no preview.
