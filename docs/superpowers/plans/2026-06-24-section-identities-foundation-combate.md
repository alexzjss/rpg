# Identidades por Seção — Fundação + Combate (Metaphor) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar um motor de tema por seção (`data-section` + tokens `--sec-*`) sem regressão nas outras abas, e reconstruir a aba Combate na linguagem visual real de *Metaphor: ReFantazio* (tipografia serif diagonal com drop-caps, splatter, tags magenta inclinadas, line-art branca, lista de party HP-teal/MP-azul).

**Architecture:** Estende o mecanismo existente de atmosfera ([utils/atmosphere.ts](../../../utils/atmosphere.ts), aplicado em [App.tsx:3293](../../../App.tsx)). Um novo `utils/sectionTheme.ts` registra, por aba, a atmosfera base + um bundle de CSS vars `--sec-*`, escreve `data-section` no `<html>` e injeta as vars. A reconstrução de Combate é feita majoritariamente por **CSS com escopo** `:root[data-section='combat'] .mp-…` (mesmo padrão de `:root[data-atmosphere='parchment'] .mp-page-bg`), com edições mínimas de JSX só onde estilos inline impedem o override.

**Tech Stack:** React 19, Vite, TypeScript, Vitest + Testing Library, CSS puro no `<style>` de `index.html`, lucide-react.

**Non-regression invariant:** Só são adicionadas regras com escopo `[data-section='combat']`. Nenhuma regra global nova. As outras quatro abas continuam pixel-idênticas.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Ação |
|---------|------------------|------|
| `utils/sectionTheme.ts` | Registry `SECTION_THEMES` + `applySectionTheme` | Criar |
| `utils/sectionTheme.test.ts` | Cobertura do registry + efeitos de `applySectionTheme` | Criar |
| `App.tsx` (~3292-3294) | Trocar `applyAtmosphere(...)` por `applySectionTheme(activeTab)` | Modificar |
| `index.html` `<style>` (antes de `</style>` na linha ~3624) | Bloco base `--sec-*` + utilitários `.mph-*` + regras `[data-section='combat']` | Modificar |
| `App.tsx` (`turnBanner` ~5860-5880) | `className` do banner de turno → `.mph-banner` | Modificar |
| `components/combat/grid/CombatArena.tsx` | Cor do anel/base dos tokens (teal/carmesim) | Modificar |
| `tabs/CombatTab.tsx` (bottom HUD ~645-878; deck modal ~878+) | Classes para lista de party + modal | Modificar |

Ordem: Fundação (Tasks 1-4) → Combate visual (Tasks 5-11). Cada visual é verificado no preview contra o mockup aprovado.

---

## FUNDAÇÃO

### Task 1: `sectionTheme.ts` — registry + applySectionTheme

**Files:**
- Create: `utils/sectionTheme.ts`
- Test: `utils/sectionTheme.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SECTION_THEMES, ALL_SEC_VAR_KEYS, applySectionTheme } from './sectionTheme';
import { atmosphereForTab } from './atmosphere';
import type { TabId } from './atmosphere';

const ALL_TABS: TabId[] = ['combat', 'journey', 'characters', 'arsenal', 'extras'];

describe('SECTION_THEMES', () => {
  it('tem entrada para toda TabId', () => {
    for (const t of ALL_TABS) expect(SECTION_THEMES[t]).toBeDefined();
  });
  it('combat usa a tríade Metaphor', () => {
    expect(SECTION_THEMES.combat.vars['--sec-accent']).toBe('#d11f3f');
    expect(SECTION_THEMES.combat.vars['--sec-accent-2']).toBe('#2fd4c4');
    expect(SECTION_THEMES.combat.vars['--sec-accent-3']).toBe('#e6336e');
  });
  it('ALL_SEC_VAR_KEYS cobre todas as chaves usadas por qualquer seção', () => {
    for (const t of ALL_TABS) {
      for (const k of Object.keys(SECTION_THEMES[t].vars)) {
        expect(ALL_SEC_VAR_KEYS).toContain(k);
      }
    }
  });
});

describe('applySectionTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-section');
    for (const k of ALL_SEC_VAR_KEYS) document.documentElement.style.removeProperty(k);
  });
  it('marca data-section e aplica a atmosfera correta da aba', () => {
    applySectionTheme('combat');
    expect(document.documentElement.dataset.section).toBe('combat');
    expect(document.documentElement.dataset.atmosphere).toBe(atmosphereForTab('combat'));
  });
  it('injeta as vars de combat e as limpa ao trocar para uma seção neutra', () => {
    applySectionTheme('combat');
    expect(document.documentElement.style.getPropertyValue('--sec-accent')).toBe('#d11f3f');
    applySectionTheme('extras');
    expect(document.documentElement.dataset.section).toBe('extras');
    expect(document.documentElement.style.getPropertyValue('--sec-accent')).toBe('');
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npm test -- sectionTheme`
Expected: FAIL — `Cannot find module './sectionTheme'`.

- [ ] **Step 3: Implementar `utils/sectionTheme.ts`**

```ts
import type { TabId, Atmosphere } from './atmosphere';
import { applyAtmosphere, atmosphereForTab } from './atmosphere';

export interface SectionThemeDef {
  atmosphere: Atmosphere;
  vars: Record<string, string>;
}

const COMBAT_VARS: Record<string, string> = {
  '--sec-accent':   '#d11f3f', // carmesim
  '--sec-accent-2': '#2fd4c4', // teal
  '--sec-accent-3': '#e6336e', // magenta
  '--sec-ink':      '#f4f0e8', // branco-creme
  '--sec-mp':       '#5a8ad8', // azul MP
  '--sec-gold':     '#e6b84e', // ouro (acento menor)
};

export const SECTION_THEMES: Record<TabId, SectionThemeDef> = {
  combat:     { atmosphere: 'dark',      vars: COMBAT_VARS },
  journey:    { atmosphere: atmosphereForTab('journey'),    vars: {} },
  characters: { atmosphere: atmosphereForTab('characters'), vars: {} },
  arsenal:    { atmosphere: atmosphereForTab('arsenal'),    vars: {} },
  extras:     { atmosphere: atmosphereForTab('extras'),     vars: {} },
};

// União de todas as chaves --sec-* declaradas por qualquer seção (para limpeza ao trocar).
export const ALL_SEC_VAR_KEYS: string[] = Array.from(
  new Set(Object.values(SECTION_THEMES).flatMap(def => Object.keys(def.vars)))
);

export function applySectionTheme(tab: TabId, root: HTMLElement = document.documentElement): void {
  const def = SECTION_THEMES[tab];
  applyAtmosphere(def.atmosphere, root);
  root.dataset.section = tab;
  for (const k of ALL_SEC_VAR_KEYS) root.style.removeProperty(k);
  for (const [k, v] of Object.entries(def.vars)) root.style.setProperty(k, v);
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npm test -- sectionTheme`
Expected: PASS (todos os casos verdes).

- [ ] **Step 5: Commit**

```bash
git add utils/sectionTheme.ts utils/sectionTheme.test.ts
git commit -m "feat(theme): motor de tema por seção (data-section + tokens --sec-*)"
```

---

### Task 2: Ligar `applySectionTheme` no App

**Files:**
- Modify: `App.tsx` (import perto da linha 110; efeito 3292-3294)

- [ ] **Step 1: Trocar o import**

Em `App.tsx`, localize:
```ts
import { applyAtmosphere, atmosphereForTab } from './utils/atmosphere';
```
Substitua por:
```ts
import { applySectionTheme } from './utils/sectionTheme';
```

- [ ] **Step 2: Trocar a chamada no efeito**

Localize (≈3292-3294):
```ts
  React.useEffect(() => {
    applyAtmosphere(atmosphereForTab(activeTab));
  }, [activeTab]);
```
Substitua o corpo por:
```ts
  React.useEffect(() => {
    applySectionTheme(activeTab);
  }, [activeTab]);
```

- [ ] **Step 3: Verificar que não há outros usos órfãos**

Run: `grep -n "applyAtmosphere\|atmosphereForTab" App.tsx`
Expected: nenhuma linha (ambos só eram usados aqui). Se aparecer algum, manter o import necessário.

- [ ] **Step 4: Rodar a suíte e o type-check**

Run: `npm test`
Expected: PASS (inclui `atmosphere.test.ts` e `sectionTheme.test.ts`).
Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add App.tsx
git commit -m "feat(theme): App aplica applySectionTheme por aba"
```

---

### Task 3: Verificação de não-regressão (preview das 5 abas)

**Files:** nenhum (verificação).

- [ ] **Step 1: Subir o dev server**

Use `preview_start` (ou `npm run dev`) e abra o app.

- [ ] **Step 2: Confirmar `data-section` mudando**

Com `preview_eval`: `document.documentElement.dataset.section` deve refletir a aba ativa ao trocar (teclas 1-5).

- [ ] **Step 3: Confirmar zero mudança visual ainda**

Navegue por Jornada, Personagens, Arsenal, Extras e Combate. Como ainda não há CSS `[data-section='combat']`, **todas** as abas devem estar idênticas ao estado anterior (a Fundação é só mecanismo). Tire `preview_screenshot` de cada aba para registro.
Expected: nenhuma diferença perceptível.

- [ ] **Step 4: Commit (somente se algo precisou de ajuste)**

Se tudo ok, nada a commitar. Caso contrário, corrigir e commitar o ajuste.

---

### Task 4: Tokens base `--sec-*` + utilitários `.mph-*` no CSS

**Files:**
- Modify: `index.html` — inserir **imediatamente antes** de `</style>` (≈ linha 3624).

- [ ] **Step 1: Inserir o bloco base + primitivas**

Cole este bloco antes de `</style>`:

```css
/* ═══════════════════════════════════════════════════════════
   IDENTIDADES POR SEÇÃO — base + primitivas (Metaphor combat)
   Só tem efeito sob :root[data-section='...'] — sem regra global.
   ═══════════════════════════════════════════════════════════ */
:root {
  --sec-accent:   #c9983a;
  --sec-accent-2: #67e8f9;
  --sec-accent-3: #ec4899;
  --sec-ink:      #f3ecdd;
  --sec-mp:       #5a8ad8;
  --sec-gold:     #e6b84e;
}

/* Splatter de tinta (carmesim/teal/magenta) — leve, via radial-gradient */
.mph-splatter { position: relative; }
.mph-splatter::before {
  content: ''; position: absolute; inset: -8px; z-index: -1; pointer-events: none;
  background:
    radial-gradient(circle at 12% 30%, rgba(209,31,63,0.85), transparent 30%),
    radial-gradient(circle at 78% 60%, rgba(47,212,196,0.7), transparent 26%),
    radial-gradient(circle at 40% 85%, rgba(230,51,110,0.7), transparent 26%);
  opacity: 0.5;
}

/* Tag em paralelogramo magenta com serif branca */
.mph-banner {
  display: inline-flex; align-items: center; gap: 10px;
  background: var(--sec-accent-3, #e6336e); color: #fff;
  font-family: Georgia, 'Times New Roman', serif;
  padding: 6px 22px 6px 16px;
  clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
}
.mph-banner__accent { width: 4px; align-self: stretch; background: var(--sec-accent-2, #2fd4c4); }

/* Token de botão circular preto (atalho) */
.mph-token {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  background: #0e0a0b; border: 1px solid var(--sec-ink, #f4f0e8);
  font-family: Arial, sans-serif; font-weight: 700; font-size: 11px; color: var(--sec-ink, #f4f0e8);
}

/* Line-art: círculos concêntricos brancos finos */
.mph-lineart {
  background:
    repeating-radial-gradient(circle at center, transparent 0 14px,
      rgba(244,240,232,0.5) 14px 15px, transparent 15px 28px);
}
```

- [ ] **Step 2: Verificar build/preview sem erro**

Recarregue o preview. `preview_console_logs` não deve ter erros de CSS. Nenhuma mudança visual ainda (utilitários não estão aplicados).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(theme): tokens --sec-* base + primitivas .mph-* (splatter/banner/token/lineart)"
```

---

## COMBATE (Metaphor)

> A partir daqui, todas as regras vêm sob `:root[data-section='combat']` e são inseridas no `<style>` (antes de `</style>`), **depois** das regras `mp-*` base. Verifique cada uma no preview na aba Combate (tecla 1) contra o mockup `combate_metaphor_real`.

### Task 5: Stage / fundo pintado da seção

**Files:**
- Modify: `index.html` `<style>`

- [ ] **Step 1: Inserir o fundo pintado + line-art + grunge**

```css
:root[data-section='combat'] .mp-page-bg {
  background:
    radial-gradient(circle at 10% 16%, rgba(209,31,63,0.18), transparent 26%),
    radial-gradient(circle at 6% 54%, rgba(47,212,196,0.13), transparent 24%),
    radial-gradient(circle at 14% 84%, rgba(230,51,110,0.15), transparent 26%),
    radial-gradient(circle at 90% 90%, rgba(47,212,196,0.10), transparent 30%),
    #15100f;
}
:root[data-section='combat'] .mp-page-bg::before {
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.06;
  background:
    repeating-radial-gradient(circle at 26% 72%, transparent 0 26px,
      rgba(244,240,232,0.6) 26px 27px, transparent 27px 54px);
}
:root[data-section='combat'] .mp-page-bg::after {
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.16; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}
```

- [ ] **Step 2: Verificar no preview**

Aba Combate: fundo escuro quente com respingos carmesim/teal/magenta nos cantos e anéis brancos sutis. `preview_screenshot`. As outras abas seguem inalteradas (`mp-page-bg` base não muda).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(combat): stage pintado Metaphor (splatter + line-art + grunge)"
```

---

### Task 6: Painéis flutuantes → superfície pintada

**Files:**
- Modify: `index.html` `<style>`

- [ ] **Step 1: Inserir o restyle dos shells**

```css
:root[data-section='combat'] .mp-combat-panel-shell {
  background: linear-gradient(160deg, rgba(20,14,13,0.96), rgba(30,10,15,0.95)) !important;
  border: 1px solid rgba(47,212,196,0.32);
  box-shadow: 0 10px 34px rgba(0,0,0,0.5), inset 0 1px 0 rgba(244,240,232,0.06);
}
/* respingo magenta no topo do painel */
:root[data-section='combat'] .mp-combat-panel-shell::after {
  content: ''; position: absolute; left: -6px; top: -6px; width: 64px; height: 30px; z-index: 0; pointer-events: none;
  background: radial-gradient(circle at 40% 50%, rgba(230,51,110,0.8), transparent 60%);
  opacity: 0.55;
}
```

- [ ] **Step 2: Verificar no preview**

Painéis esquerda/contexto/direita ficam escuros pintados com borda teal e um respingo magenta no canto superior. **Confirme que nada é cortado** (sem `clip-path` no shell) e que os botões de colapso ainda aparecem. `preview_screenshot`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(combat): painéis flutuantes com superfície pintada e respingo"
```

---

### Task 7: Menu de comando / botões → linguagem Metaphor

**Files:**
- Modify: `index.html` `<style>`

- [ ] **Step 1: Inserir o restyle de comandos**

```css
:root[data-section='combat'] .mp-control-primary,
:root[data-section='combat'] .mp-control-secondary,
:root[data-section='combat'] .mp-action-button,
:root[data-section='combat'] .mp-skill-row {
  font-family: Georgia, 'Times New Roman', serif;
  letter-spacing: 0.5px;
}
/* drop-cap na 1ª letra dos rótulos de bloco (quando o rótulo é um bloco/inline-block) */
:root[data-section='combat'] .mp-skill-row__name::first-letter,
:root[data-section='combat'] .mp-control-primary::first-letter {
  font-size: 1.55em; font-weight: 700; color: var(--sec-ink, #f4f0e8);
}
/* acento de seleção/hover alternando teal→carmesim */
:root[data-section='combat'] .mp-action-button:hover:not(:disabled),
:root[data-section='combat'] .mp-skill-row:hover:not(:disabled) {
  border-color: var(--sec-accent-2, #2fd4c4);
  box-shadow: 0 0 0 1px rgba(47,212,196,0.5), 0 6px 18px rgba(0,0,0,0.5);
}
:root[data-section='combat'] .mp-control-primary {
  border-color: var(--sec-accent, #d11f3f);
}
```

- [ ] **Step 2: Verificar no preview e ajustar seletor do drop-cap**

`::first-letter` só aplica em elementos de bloco. Abra o painel de ações/controle, inspecione com `preview_inspect` o elemento do nome (provável `span` em `components/combat/CombatControlPanel.tsx` / `ContextCardList.tsx`). Se o drop-cap não aparecer, no JSX desse rótulo adicione `style={{ display: 'inline-block' }}` (mudança puramente visual, não altera hit-area). Reverifique.
Expected: comandos em serif; primeira letra ampliada; hover teal.

- [ ] **Step 3: Commit**

```bash
git add index.html components/combat/CombatControlPanel.tsx components/combat/ContextCardList.tsx
git commit -m "feat(combat): comandos em serif com drop-cap e acento teal"
```

(Commit só os arquivos que você de fato tocou.)

---

### Task 8: Banner de turno → tag magenta inclinada

**Files:**
- Modify: `App.tsx` (bloco `turnBanner`, ≈5860-5880)

- [ ] **Step 1: Aplicar `.mph-banner` no banner**

No bloco do banner de turno, o container central que hoje usa estilos inline de "É a vez de / nome" recebe `className="mph-banner mph-splatter"`. Mantenha o conteúdo (kicker "É a vez de" + nome). Exemplo do elemento-alvo (adapte ao JSX real, preservando filhos):

```tsx
<div className="mph-banner mph-splatter">
  <span className="mph-banner__accent" aria-hidden />
  <div style={{ textAlign: 'left' }}>
    <div style={{ fontSize: 8, fontWeight: 900, color: '#ffd6e2', textTransform: 'uppercase', letterSpacing: '0.4em' }}>É a vez de</div>
    <div style={{ fontSize: 28, fontWeight: 900, fontStyle: 'italic', color: '#fff', lineHeight: 1 }}>{turnBanner.name}</div>
  </div>
</div>
```

Remova do elemento as cores/box antigas (dourado/teal-navy) que conflitem; o fundo agora vem de `.mph-banner`.

- [ ] **Step 2: Verificar no preview**

Inicie/ative um combate (ou force `turnBanner`) para o banner aparecer. Deve ser um paralelogramo magenta inclinado com serif branca e barra teal. `preview_screenshot`.

- [ ] **Step 3: Commit**

```bash
git add App.tsx
git commit -m "feat(combat): banner de turno como tag magenta inclinada"
```

---

### Task 9: Tokens da arena → anéis teal/carmesim

**Files:**
- Modify: `components/combat/grid/CombatArena.tsx` (e filhos de token, se houver)

- [ ] **Step 1: Localizar a cor do anel/base do token**

Run: `grep -n "stroke\|borderColor\|ring\|#c9983a\|rgba(201,152,58" components/combat/grid/CombatArena.tsx`
Identifique onde o anel de seleção/base do combatente é colorido.

- [ ] **Step 2: Recolorir por afiliação (visual apenas)**

Use as vars da seção: aliado → `var(--sec-accent-2)` (teal `#2fd4c4`), inimigo → `var(--sec-accent)` (carmesim `#d11f3f`). Substitua os valores de cor do anel/base mantendo geometria e lógica de hit/seleção intactas. Onde o componente já distingue aliado/inimigo, mapeie a cor; onde não, use teal como padrão de aliado.

- [ ] **Step 3: Verificar no preview**

Com combatentes na arena, anéis de aliados ficam teal e de inimigos carmesim; seleção/clique continua funcionando. `preview_click` num token e confirme seleção via `preview_snapshot`.

- [ ] **Step 4: Commit**

```bash
git add components/combat/grid/CombatArena.tsx
git commit -m "feat(combat): anéis de token teal (aliado) / carmesim (inimigo)"
```

---

### Task 10: HUD / lista de party estilo Metaphor

**Files:**
- Modify: `tabs/CombatTab.tsx` (bottom HUD ≈645-878)
- Modify: `index.html` `<style>` (barras HP/MP)

- [ ] **Step 1: Inserir CSS de barras HP/MP**

```css
:root[data-section='combat'] .mph-hp { background: var(--sec-accent-2, #2fd4c4); }
:root[data-section='combat'] .mph-hp-track { background: #0e2420; }
:root[data-section='combat'] .mph-mp { background: var(--sec-mp, #5a8ad8); }
:root[data-section='combat'] .mph-mp-track { background: #0a1428; }
:root[data-section='combat'] .mph-party-name {
  font-family: Georgia, serif; text-transform: uppercase; letter-spacing: 1px; color: var(--sec-ink, #f4f0e8);
}
```

- [ ] **Step 2: Aplicar classes no HUD**

No bloco do bottom HUD em `CombatTab.tsx`: o nome do personagem ativo recebe `className="mph-party-name"`; a barra de aura/HP recebe trilho `mph-hp-track` + preenchimento `mph-hp`; se houver barra secundária (MP/recurso), `mph-mp-track`/`mph-mp`. Tag de posição/turno (se existir) usa `mph-banner` (paralelogramo magenta). Mantenha valores e lógica; só troque cor/forma/tipografia.

- [ ] **Step 3: Verificar no preview**

HUD inferior com nome em serif caixa-alta, barra HP teal, eventual barra MP azul, tag magenta. `preview_screenshot`.

- [ ] **Step 4: Commit**

```bash
git add tabs/CombatTab.tsx index.html
git commit -m "feat(combat): HUD/lista de party com HP teal, MP azul e tag magenta"
```

---

### Task 11: Modal de deck no mesmo idioma + verificação final

**Files:**
- Modify: `tabs/CombatTab.tsx` (deck modal ≈878+)
- Modify: `index.html` `<style>` (se necessário p/ pílulas de filtro)

- [ ] **Step 1: Restyle do modal**

No modal de deck: cabeçalho com `mph-splatter` atrás do título em serif; pílulas de filtro de tipo recebem visual de paralelogramo magenta/teal (reutilize `.mph-banner` ou adicione `clip-path` análogo); canto com `.mph-lineart` opcional. Mantenha busca, grid de cartas e rodapé funcionais.

- [ ] **Step 2: Verificar o modal no preview**

Abra o modal de deck (botão do baralho). Cabeçalho com splatter, filtros inclinados, fundo coerente com o stage. `preview_click` num filtro e confirme que a filtragem ainda funciona via `preview_snapshot`.

- [ ] **Step 3: Verificação final completa**

Run: `npm test`
Expected: PASS.
Run: `npx tsc --noEmit`
Expected: sem erros.
No preview, percorra **as cinco abas**:
- Combate: confere com o mockup `combate_metaphor_real` (stage pintado, painéis, comandos serif, banner magenta, tokens teal/carmesim, HUD party). `preview_screenshot`.
- Jornada, Personagens, Arsenal, Extras: **idênticas** ao baseline da Task 3. `preview_screenshot` de cada e compare.

- [ ] **Step 4: Commit**

```bash
git add tabs/CombatTab.tsx index.html
git commit -m "feat(combat): modal de deck no idioma Metaphor + verificação final"
```

---

## Auto-revisão do plano (feita)

- **Cobertura do spec:** §2 Fundação → Tasks 1-4; §3.0 paleta/tipografia → Task 1 (vars) + 7/10 (tipografia); §3.1 stage → Task 5; §3.2 banners → Tasks 8 (turno) e 10 (party tag); §3.3 painéis → Task 6; §3.4 comandos → Task 7; §3.5 tokens → Task 9; §3.6 HUD/party → Task 10; §3.7 line-art → Tasks 4/5; §3.8 deck modal → Task 11. Não-regressão (§1) → Tasks 3 e 11.
- **Placeholders:** nenhum passo de lógica sem código; passos visuais trazem o CSS completo e instruções de edição JSX explícitas com a classe a aplicar.
- **Consistência de tipos/nomes:** `applySectionTheme`, `SECTION_THEMES`, `ALL_SEC_VAR_KEYS` idênticos entre Task 1 e Task 2; nomes de classe `.mph-banner/.mph-splatter/.mph-token/.mph-lineart/.mph-hp(-track)/.mph-mp(-track)/.mph-party-name` consistentes entre Tasks 4, 8, 10, 11; vars `--sec-*` idênticas entre `sectionTheme.ts` e o bloco `:root` da Task 4.
- **Riscos conhecidos:** `::first-letter` exige elemento de bloco (Task 7 tem passo de ajuste); estilos inline podem vencer CSS — por isso banner/HUD são editados no JSX (Tasks 8, 10); `!important` no `mp-combat-panel-shell` background para vencer estilos inline do shell.
