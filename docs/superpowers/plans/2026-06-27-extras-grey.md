# Extras — cinza neutro — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir a aba Extras do clima "ardente" (marrom/ouro via `.mp-darktab` + acentos âmbar) para **cinza neutro** plano e discreto, sem afetar Arsenal/Personagens.

**Architecture:** Mesmo padrão das outras seções — `.mp-darktab` é **compartilhado** (Arsenal/Personagens/Extras), então tudo é escopado sob `:root[data-section='extras']` (vence por especificidade o `.mp-darktab …!important`; e como só a aba ativa renderiza, `[data-section='extras'] .bg-amber-700` só atinge Extras). Vars de paleta gold/ember (inline via `theme.ts`) viram cinza via `applySectionTheme`. Extras segue inline em `App.tsx`.

**Tech Stack:** React 19, Vite, TS, Vitest, CSS no `<style>` de `index.html`.

**Non-regression invariant:** só Extras muda. `.mp-darktab` base intacto → Arsenal (Persona) e Personagens (FF) idênticos. Combate/Jornada intactos.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Ação |
|---------|------------------|------|
| `utils/sectionTheme.ts` (+ test) | `EXTRAS_VARS` (cinza) + override gold/ember | Modificar |
| `index.html` | bloco `:root[data-section='extras']`: page-bg, glaze, override mp-darktab, amber→cinza, glass-panel | Modificar |

Ordem: E1 (vars) → E2 (page-bg/glaze) → E3 (mp-darktab) → E4 (amber+glass) → E5 (verificação). Extras = tecla 5.

---

## Task E1: Bundle cinza (sectionTheme)

**Files:** Modify `utils/sectionTheme.ts`, `utils/sectionTheme.test.ts`

- [ ] **Step 1: Asserção (falha)**
```ts
  it('extras usa acento cinza e override de ember', () => {
    expect(SECTION_THEMES.extras.vars['--sec-accent']).toBe('#9aa3b0');
    expect(SECTION_THEMES.extras.vars['--ember']).toBe('#8a93a0');
  });
```
- [ ] **Step 2: Rodar e ver falhar** — `npm test -- sectionTheme` → FAIL.
- [ ] **Step 3: Implementar** — adicionar `EXTRAS_VARS` perto de `CHARACTERS_VARS`:
```ts
const EXTRAS_VARS: Record<string, string> = {
  '--sec-accent':   '#9aa3b0',
  '--sec-accent-2': '#cdd3dc',
  '--sec-accent-3': '#6b7280',
  '--sec-ink':      '#e8ebf0',
  '--gold-dim':    '#3a3f47',
  '--gold-mid':    '#8a93a0',
  '--gold-bright': '#cdd3dc',
  '--gold-pale':   '#eef1f5',
  '--border-gold': 'rgba(160,170,185,0.28)',
  '--ember':       '#8a93a0',
  '--ember-deep':  '#4a4f57',
};
```
E trocar a entrada `extras` do registry para `vars: EXTRAS_VARS`.
- [ ] **Step 4: Rodar e ver passar** — `npm test` (count +1 → 51).
- [ ] **Step 5: Commit**
```bash
git add utils/sectionTheme.ts utils/sectionTheme.test.ts
git commit -m "feat(extras): bundle cinza neutro + override de ouro/ember"
```

---

## Task E2: Fundo cinza plano + glaze neutralizado

**Files:** Modify `index.html`

- [ ] **Step 1: Inserir** (junto às outras regras `.mp-page-bg`):
```css
/* ── EXTRAS cinza neutro: fundo plano, sem calor ── */
:root[data-section='extras'] .mp-page-bg {
  background: linear-gradient(180deg, #16181c 0%, #1c2026 100%);
}
:root[data-section='extras'] .mp-glaze {
  background:
    radial-gradient(60% 50% at 18% 12%, rgba(160,170,185,0.05), transparent 60%),
    radial-gradient(55% 50% at 85% 80%, rgba(160,170,185,0.04), transparent 60%);
}
```
- [ ] **Step 2: Verificar no preview** (tecla 5): fundo cinza neutro plano, sem tom quente. Outras abas inalteradas. `preview_screenshot`/inspect.
- [ ] **Step 3: Commit**
```bash
git add index.html
git commit -m "feat(extras): fundo cinza plano + glaze neutralizado"
```

---

## Task E3: Override do `.mp-darktab` → cinza neutro

**Files:** Modify `index.html`

- [ ] **Step 1: Inserir** (depois das regras `.mp-darktab` base):
```css
/* ── EXTRAS: .mp-darktab quente -> cinza neutro ── */
:root[data-section='extras'] .mp-darktab .text-slate-300 { color: #d6dae2 !important; }
:root[data-section='extras'] .mp-darktab .text-slate-400 { color: #aab2bf !important; }
:root[data-section='extras'] .mp-darktab .text-slate-500 { color: #8a93a0 !important; }
:root[data-section='extras'] .mp-darktab .text-slate-600 { color: #6a727e !important; }
:root[data-section='extras'] .mp-darktab .text-slate-700 { color: #4a505a !important; }
:root[data-section='extras'] .mp-darktab .bg-slate-900,
:root[data-section='extras'] .mp-darktab .bg-slate-900\/80,
:root[data-section='extras'] .mp-darktab .bg-slate-900\/70,
:root[data-section='extras'] .mp-darktab .bg-slate-900\/60,
:root[data-section='extras'] .mp-darktab .bg-slate-900\/50,
:root[data-section='extras'] .mp-darktab .bg-slate-950 { background-color: #16181c !important; }
:root[data-section='extras'] .mp-darktab .bg-slate-800,
:root[data-section='extras'] .mp-darktab .bg-slate-800\/80,
:root[data-section='extras'] .mp-darktab .bg-slate-800\/60,
:root[data-section='extras'] .mp-darktab .bg-slate-800\/50 { background-color: #22262e !important; }
:root[data-section='extras'] .mp-darktab .hover\:bg-slate-800:hover,
:root[data-section='extras'] .mp-darktab .hover\:bg-slate-700:hover { background-color: #2a2f38 !important; }
:root[data-section='extras'] .mp-darktab .border-slate-800 { border-color: rgba(160,170,185,0.18) !important; }
:root[data-section='extras'] .mp-darktab .border-slate-700 { border-color: rgba(160,170,185,0.28) !important; }
:root[data-section='extras'] .mp-darktab .border-slate-600 { border-color: rgba(160,170,185,0.38) !important; }
:root[data-section='extras'] .mp-darktab [style*="color: rgb(103, 232, 249)"] { color: #cdd3dc !important; }
:root[data-section='extras'] .mp-darktab [style*="rgb(56, 189, 248)"] { color: #cdd3dc !important; }
```
- [ ] **Step 2: Verificar** — superfícies/textos cinza-frio (sem marrom). `preview_screenshot`.
- [ ] **Step 3: Commit**
```bash
git add index.html
git commit -m "feat(extras): override do .mp-darktab (marrom -> cinza neutro)"
```

---

## Task E4: Âmbar → cinza + glass-panel plano

**Files:** Modify `index.html`

- [ ] **Step 1: Inserir**:
```css
/* ── EXTRAS: âmbar -> cinza neutro ── */
:root[data-section='extras'] .bg-amber-700,
:root[data-section='extras'] .bg-amber-600,
:root[data-section='extras'] .bg-amber-500 { background-color: #4a505a !important; box-shadow: none !important; }
:root[data-section='extras'] .hover\:bg-amber-600:hover,
:root[data-section='extras'] .hover\:bg-amber-500:hover { background-color: #5a616c !important; }
:root[data-section='extras'] .bg-amber-950\/30 { background-color: rgba(160,170,185,0.08) !important; }
:root[data-section='extras'] .text-amber-300,
:root[data-section='extras'] .text-amber-400,
:root[data-section='extras'] .text-amber-500,
:root[data-section='extras'] .text-amber-600 { color: #cdd3dc !important; }
:root[data-section='extras'] .group:hover .group-hover\:text-amber-400 { color: #cdd3dc !important; }
:root[data-section='extras'] .border-amber-400\/30,
:root[data-section='extras'] .border-amber-600 { border-color: rgba(160,170,185,0.4) !important; }
:root[data-section='extras'] .hover\:border-amber-500:hover,
:root[data-section='extras'] .focus\:border-amber-500:focus { border-color: rgba(205,211,220,0.5) !important; }
/* glass-panel plano cinza */
:root[data-section='extras'] .glass-panel {
  background: linear-gradient(160deg, rgba(34,38,46,0.9), rgba(22,24,28,0.9)) !important;
  border: 1px solid rgba(160,170,185,0.14) !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
}
```
- [ ] **Step 2: Verificar** — botões de dado, +Qtd, "Rolar", hovers e o painel em cinza neutro (sem âmbar). Clicar entre subabas (`preview_click`). `preview_screenshot`.
- [ ] **Step 3: Commit**
```bash
git add index.html
git commit -m "feat(extras): amber -> cinza + glass-panel plano"
```

---

## Task E5: Verificação final

**Files:** nenhum.

- [ ] **Step 1: Suite + tipos** — `npm test` (PASS) ; `npx tsc --noEmit` (só os 3 erros pré-existentes).
- [ ] **Step 2: Conferência 5 abas no preview**
  - Extras: percorrer as subabas (Dados/Timer/Progresso/Nomes/Saque/Notas GM) — cinza neutro plano, sem âmbar/marrom. Confere com a direção "cinza básico".
  - **Arsenal (Persona) e Personagens (FF): idênticos**. `preview_screenshot` de cada.
  - Combate/Jornada intactos.
  - Via `preview_eval`: `--gold-mid` = `#8a93a0` em extras; `#d4142a` em arsenal; `#5a9ae8` em characters.
- [ ] **Step 3: Commit (se ajuste).**

---

## Auto-revisão do plano (feita)

- **Cobertura do spec:** §2 bundle/override → E1; §3.1 fundo/glaze → E2; §3.2 override mp-darktab → E3; §3.3 âmbar + §3.4 glass-panel → E4; não-regressão → E5.
- **Placeholders:** lógica com TDD; tarefas visuais com CSS completo + verificação no preview.
- **Consistência:** `EXTRAS_VARS`/`SECTION_THEMES.extras` em E1; cinzas (`#8a93a0`/`#cdd3dc`/`#16181c`) consistentes E1-E4.
- **Riscos:** especificidade — `:root[data-section='extras'] .mp-darktab …` vence o base; glaze é filho do page-bg (override sutil); a subaba ativa usa gradiente branco inline (neutro — manter); `.mp-cta` não é usado em Extras (botões são Tailwind amber, cobertos por E4).
