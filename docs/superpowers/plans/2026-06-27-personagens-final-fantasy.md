# Personagens — Final Fantasy (azul, janelas de comando) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir a aba Personagens do clima "ardente" (marrom/ouro via `.mp-darktab`) para *Final Fantasy* (azul profundo, cartões como janelas de comando translúcidas com borda clara, barras HP verde/MP azul, cristais), sem afetar Arsenal/Extras.

**Architecture:** Mesmo padrão do Arsenal — `.mp-darktab` é **compartilhado** (Personagens/Arsenal/Extras), então tudo é escopado sob `:root[data-section='characters']` (vence por especificidade o `.mp-darktab …!important`; e como só a aba ativa renderiza, `[data-section='characters'] .bg-amber-600` só atinge Personagens). Vars de paleta gold/ember (inline via `theme.ts`) viram azul via `applySectionTheme`. Onde estilos inline vencem o CSS (`CharacterCard` `--char-accent`/`--stat-color`, `--divider-color`), editar no JSX. Personagens segue inline em `App.tsx`; `CharacterCard` é componente (`App.tsx:2350`).

**Tech Stack:** React 19, Vite, TS, Vitest, CSS no `<style>` de `index.html`.

**Non-regression invariant:** só Personagens muda. `.mp-darktab` base intacto → Arsenal (Persona) e Extras (quente) idênticos. Combate/Jornada intactos.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Ação |
|---------|------------------|------|
| `utils/sectionTheme.ts` (+ test) | `CHARACTERS_VARS` (azul) + override gold/ember | Modificar |
| `index.html` | bloco `:root[data-section='characters']`: page-bg, override mp-darktab, amber→azul, chrome, CharacterCard janela FF | Modificar |
| `App.tsx` | `accentColor`/`--stat-color` do `CharacterCard` (2359/2398/2402/2407); `--divider-color` inline (6115/6136) | Modificar |

Ordem: Fundação (P1) → page-bg (P2) → overrides (P3-P4) → chrome (P5) → cartões (P6) → verificação (P7). Personagens = tecla 3.

---

## Task P1: Bundle azul (sectionTheme)

**Files:** Modify `utils/sectionTheme.ts`, `utils/sectionTheme.test.ts`

- [ ] **Step 1: Asserção (falha)**
```ts
  it('characters usa acento azul FF e override de ember', () => {
    expect(SECTION_THEMES.characters.vars['--sec-accent']).toBe('#5a9ae8');
    expect(SECTION_THEMES.characters.vars['--ember']).toBe('#5a9ae8');
  });
```
- [ ] **Step 2: Rodar e ver falhar** — `npm test -- sectionTheme` → FAIL.
- [ ] **Step 3: Implementar** — adicionar `CHARACTERS_VARS` perto de `ARSENAL_VARS`:
```ts
const CHARACTERS_VARS: Record<string, string> = {
  '--sec-accent':   '#5a9ae8',
  '--sec-accent-2': '#7fe0ff',
  '--sec-accent-3': '#a8c8ff',
  '--sec-ink':      '#eaf2ff',
  '--gold-dim':    '#1a3866',
  '--gold-mid':    '#5a9ae8',
  '--gold-bright': '#7fe0ff',
  '--gold-pale':   '#dceaff',
  '--border-gold': 'rgba(120,170,255,0.34)',
  '--ember':       '#5a9ae8',
  '--ember-deep':  '#1e4e9a',
};
```
E trocar a entrada `characters` do registry para `vars: CHARACTERS_VARS`.
- [ ] **Step 4: Rodar e ver passar** — `npm test` (count +1).
- [ ] **Step 5: Commit**
```bash
git add utils/sectionTheme.ts utils/sectionTheme.test.ts
git commit -m "feat(characters): bundle azul FF + override de ouro/ember"
```

---

## Task P2: Fundo FF (azul + cristais)

**Files:** Modify `index.html`

- [ ] **Step 1: Inserir page-bg** (junto às outras regras `.mp-page-bg`):
```css
/* ── PERSONAGENS Final Fantasy: azul profundo + cristais ── */
:root[data-section='characters'] .mp-page-bg {
  background: linear-gradient(180deg, #081428 0%, #0e2a52 100%);
}
:root[data-section='characters'] .mp-page-bg::before {
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.4;
  background-image:
    linear-gradient(135deg, transparent 0 49.6%, rgba(127,224,255,0.5) 49.7% 50%, transparent 50.1%),
    linear-gradient(45deg, transparent 0 49.6%, rgba(90,154,232,0.4) 49.7% 50%, transparent 50.1%);
  background-size: 64px 64px, 96px 96px;
  -webkit-mask-image: radial-gradient(ellipse at 80% 0%, #000 0 30%, transparent 60%);
          mask-image: radial-gradient(ellipse at 80% 0%, #000 0 30%, transparent 60%);
}
```
- [ ] **Step 2: Verificar no preview** (tecla 3): fundo azul profundo com leve trama de cristal no canto. Outras abas inalteradas. `preview_screenshot`/inspect.
- [ ] **Step 3: Commit**
```bash
git add index.html
git commit -m "feat(characters): fundo Final Fantasy (azul + cristais)"
```

---

## Task P3: Override do `.mp-darktab` → FF azul

**Files:** Modify `index.html`

- [ ] **Step 1: Inserir** (depois das regras `.mp-darktab` base):
```css
/* ── PERSONAGENS: .mp-darktab quente -> azul FF ── */
:root[data-section='characters'] .mp-darktab .text-slate-300 { color: #eaf2ff !important; }
:root[data-section='characters'] .mp-darktab .text-slate-400 { color: #b8cce8 !important; }
:root[data-section='characters'] .mp-darktab .text-slate-500 { color: #7fb3e8 !important; }
:root[data-section='characters'] .mp-darktab .text-slate-600 { color: #5a7fa8 !important; }
:root[data-section='characters'] .mp-darktab .text-slate-700 { color: #3a5578 !important; }
:root[data-section='characters'] .mp-darktab .bg-slate-900,
:root[data-section='characters'] .mp-darktab .bg-slate-900\/80,
:root[data-section='characters'] .mp-darktab .bg-slate-900\/60,
:root[data-section='characters'] .mp-darktab .bg-slate-900\/50,
:root[data-section='characters'] .mp-darktab .bg-slate-950 { background-color: #0a1c3c !important; }
:root[data-section='characters'] .mp-darktab .bg-slate-800,
:root[data-section='characters'] .mp-darktab .bg-slate-800\/80,
:root[data-section='characters'] .mp-darktab .bg-slate-800\/60,
:root[data-section='characters'] .mp-darktab .bg-slate-800\/50 { background-color: #102a52 !important; }
:root[data-section='characters'] .mp-darktab .hover\:bg-slate-800:hover,
:root[data-section='characters'] .mp-darktab .hover\:bg-slate-700:hover { background-color: #163a66 !important; }
:root[data-section='characters'] .mp-darktab .border-slate-800 { border-color: rgba(120,170,255,0.22) !important; }
:root[data-section='characters'] .mp-darktab .border-slate-700 { border-color: rgba(120,170,255,0.34) !important; }
:root[data-section='characters'] .mp-darktab .border-slate-600 { border-color: rgba(120,170,255,0.45) !important; }
:root[data-section='characters'] .mp-darktab [style*="color: rgb(103, 232, 249)"] { color: #7fe0ff !important; }
:root[data-section='characters'] .mp-darktab [style*="rgb(56, 189, 248)"] { color: #7fe0ff !important; }
```
- [ ] **Step 2: Verificar** — superfícies/textos azul FF (sem marrom). `preview_screenshot`.
- [ ] **Step 3: Commit**
```bash
git add index.html
git commit -m "feat(characters): override do .mp-darktab (marrom -> azul FF)"
```

---

## Task P4: Tailwind amber → azul (escopo characters)

**Files:** Modify `index.html`

- [ ] **Step 1: Inserir**:
```css
/* ── PERSONAGENS: âmbar/ouro Tailwind -> azul FF ── */
:root[data-section='characters'] .bg-amber-600,
:root[data-section='characters'] .bg-amber-500 { background-color: #2e6ad0 !important; box-shadow: 0 0 15px rgba(90,154,232,0.4) !important; }
:root[data-section='characters'] .hover\:bg-amber-500:hover,
:root[data-section='characters'] .hover\:bg-amber-600:hover { background-color: #3f82e8 !important; }
:root[data-section='characters'] .text-amber-300,
:root[data-section='characters'] .text-amber-400,
:root[data-section='characters'] .text-amber-500 { color: #9fd0ff !important; }
:root[data-section='characters'] .border-amber-400\/30,
:root[data-section='characters'] .border-amber-600\/40,
:root[data-section='characters'] .border-amber-600 { border-color: rgba(120,170,255,0.5) !important; }
:root[data-section='characters'] .focus\:border-amber-600:focus { border-color: #7fe0ff !important; }
```
- [ ] **Step 2: Verificar** — quaisquer botões/acentos âmbar viram azul. `preview_screenshot`.
- [ ] **Step 3: Commit**
```bash
git add index.html
git commit -m "feat(characters): amber Tailwind -> azul FF no escopo characters"
```

---

## Task P5: Chrome (CTA, divisores, empty, kicker)

**Files:** Modify `index.html`, `App.tsx`

- [ ] **Step 1: Recolorir os divisores inline (App.tsx)**

O divisor "Cast" (~6115) usa `'--divider-color': 'rgba(201,152,58,0.75)', '--divider-bg': 'rgba(120,90,20,0.22)'` (ouro). Trocar para cyan FF:
```tsx
style={{ '--divider-color': 'rgba(127,224,255,0.8)', '--divider-bg': 'rgba(20,54,110,0.3)' } as React.CSSProperties}
```
O divisor "NPC" (~6136) usa slate `rgba(100,116,139,0.65)`/`rgba(30,41,59,0.35)` — manter (já é azul-acinzentado neutro) ou ajustar para `rgba(120,150,200,0.6)`/`rgba(16,42,82,0.35)`.

- [ ] **Step 2: CSS de chrome (index.html)**

`.mp-cta` usa `var(--gold-*)` → já vira azul pelo override de P1 (confirmar no preview). Adicionar ajustes do empty/kicker e garantir o divisor:
```css
:root[data-section='characters'] .mp-section-kicker { color: #7fe0ff !important; }
:root[data-section='characters'] .mp-empty strong { color: #cfe2ff !important; }
:root[data-section='characters'] .mp-empty { border-color: rgba(120,170,255,0.2) !important; }
```
- [ ] **Step 3: Verificar** — botões Novo/NPC azuis, divisor Cast com losango cyan, empty azul. `preview_screenshot`.
- [ ] **Step 4: Commit**
```bash
git add index.html App.tsx
git commit -m "feat(characters): CTA/divisores/empty em azul FF"
```

---

## Task P6: CharacterCard → janela de comando FF

**Files:** Modify `index.html`, `App.tsx` (`CharacterCard` ~2350-2447)

- [ ] **Step 1: JSX — accent e cores de stat (App.tsx)**

- Linha ~2359: `const accentColor = isNpc ? 'rgba(100,116,139,0.9)' : '#c9983a';` → `const accentColor = isNpc ? 'rgba(120,150,200,0.85)' : '#5a9ae8';`
- Linha ~2398: HP `'--stat-color': '#f87171'` → `'#4ad08a'` (verde HP).
- Linha ~2402: Aura `'--stat-color': '#fbbf24'` → `'#5a9ae8'` (azul MP).
- Linha ~2407: Mun `'--stat-color': '#fb923c'` → `'#7fe0ff'` (cyan).

- [ ] **Step 2: CSS — janela FF (index.html)**
```css
:root[data-section='characters'] .mp-character-banner {
  background: linear-gradient(160deg, rgba(23,56,110,0.92), rgba(11,33,72,0.92)) !important;
  border: 1.5px solid rgba(168,200,255,0.5) !important;
}
:root[data-section='characters'] .mp-character-name { color: #eaf2ff !important; }
:root[data-section='characters'] .mp-character-portrait__badge { color: #cfe2ff !important; }
```
- [ ] **Step 3: Verificar no preview**

Se houver personagens (tecla 3), os cartões viram janela azul translúcida com borda clara, HP verde / Aura azul, badge cyan. Confirmar que hover/ações funcionam (`preview_click` em editar). Se não houver dados, confirmar empty state azul + inspecionar `.mp-character-banner` regra aplicada. Reportar.
- [ ] **Step 4: Commit**
```bash
git add index.html App.tsx
git commit -m "feat(characters): cartões como janelas de comando FF (HP verde/MP azul)"
```

---

## Task P7: Verificação final

**Files:** nenhum.

- [ ] **Step 1: Suite + tipos** — `npm test` (PASS) ; `npx tsc --noEmit` (só os 3 erros pré-existentes).
- [ ] **Step 2: Conferência 5 abas no preview**
  - Personagens: azul FF (cartões janela, HP verde/MP azul, cristais, CTA azul). Confere com `personagens_final_fantasy`.
  - **Arsenal (Persona) e Extras (quente): idênticos** ao baseline. `preview_screenshot` de cada.
  - Combate/Jornada intactos.
  - Via `preview_eval`: `--gold-mid` = `#5a9ae8` em characters; `#d4142a` em arsenal; `#c9983a` em extras.
- [ ] **Step 3: Commit (se ajuste).**

---

## Auto-revisão do plano (feita)

- **Cobertura do spec:** §2 bundle/override → P1; §3.1 fundo → P2; §3.2 override mp-darktab → P3; §3.3 cartões → P6; §3.4 chrome (cta/divisor/empty/kicker) → P5; amber → P4; não-regressão → P7.
- **Placeholders:** lógica com TDD; tarefas visuais com CSS/JSX completos + verificação no preview.
- **Consistência:** `CHARACTERS_VARS`/`SECTION_THEMES.characters` em P1; cores FF (`#5a9ae8`/`#7fe0ff`/`#4ad08a`) consistentes entre P1-P6; seletor `.mp-character-banner` em P6.
- **Riscos:** inline-vence-CSS — `accentColor`/`--stat-color`/`--divider-color` editados no JSX (P5/P6); `.mp-cta` é var-driven (auto-azul via P1) — confirmar no preview; `.mp-character-banner` tem clip-path (cantos cortados) que combina com FF, mantido.
