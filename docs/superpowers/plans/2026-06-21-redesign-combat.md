# Redesign Fase 1 — Combate: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aquecer o visual dos painéis de combate para o vocabulário ardente da Fase 0 — backgrounds warm-dark em vez de cold-dark, acento ember nos headers, substituição de PALETTE.gold* por CSS vars.

**Architecture:** Três categorias de mudanças: (1) CSS em index.html (substituições de rgba frios por quentes + acento ember), (2) Inline styles em TSX (PALETTE.gold* → CSS vars), (3) Verificação de regressão.

**Tech Stack:** React 19 + Vite + TypeScript; Tailwind CDN; CSS custom props; `mp-*` utility classes

**Baseline:** 31 erros tsc pré-existentes; 35 testes passando. Não introduzir novos erros.

---

### Task P1-1: Warmth CSS — Panel shells, collapse tabs, targeting buttons

**Files:**
- Modify: `index.html` (linhas 651–683 e 744–858)

Substituições de cor fria por quente:
- `rgba(8,10,16,X)` → `rgba(19,16,11,X)`
- `rgba(3,5,12,X)` → `rgba(19,16,11,X)`
- `rgba(28,34,52,X)` → `rgba(36,30,20,X)`

- [ ] **Step 1: Backup + ler linha exata do collapse tab**

```bash
grep -n "rgba(8,10,16\|rgba(28,34,52" index.html
```

Expected: linhas com `mp-collapse-tab` background e hover.

- [ ] **Step 2: Atualizar mp-collapse-tab backgrounds (index.html ~L662, L677)**

Localizar:
```css
background: rgba(8,10,16,0.82);
```
Substituir por:
```css
background: rgba(19,16,11,0.82);
```

Localizar hover:
```css
background: rgba(28,34,52,0.9);
```
Substituir por:
```css
background: rgba(36,30,20,0.9);
```

- [ ] **Step 3: Atualizar mp-targeting-button e mp-card-zoom backgrounds (~L774, L779, L808, L853, L858)**

Localizar todas as ocorrências de `rgba(3,5,12,0.58)`, `rgba(3,5,12,0.54)`, `rgba(3,5,12,0.60)`, `rgba(3,5,12,0.66)`, `rgba(4,6,14,0.58)`:

```
rgba(3,5,12,0.58) → rgba(19,16,11,0.58)
rgba(3,5,12,0.54) → rgba(19,16,11,0.54)
rgba(3,5,12,0.60) → rgba(19,16,11,0.60)
rgba(3,5,12,0.66) → rgba(19,16,11,0.66)
rgba(4,6,14,0.58) → rgba(27,23,16,0.58)
rgba(3,5,12,0.50) → rgba(19,16,11,0.50)
rgba(3,5,12,0.55) → rgba(19,16,11,0.55)
```

Use a ferramenta Edit para cada substituição única, ou faça replace_all onde o valor é inequívoco.

- [ ] **Step 4: Atualizar mp-card-zoom-backdrop (L789)**

Localizar `rgba(3,5,12,0.5)` no contexto de `mp-card-zoom-backdrop` e substituir por `rgba(19,16,11,0.5)`.

- [ ] **Step 5: Verificar que as substituições foram feitas**

```bash
grep -n "rgba(8,10,16\|rgba(3,5,12\|rgba(28,34,52" index.html | grep -v "rgba(0,0,0"
```

Expected: zero resultados (todos substituídos).

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "style(combat): warm cold-dark backgrounds in panel shells and targeting buttons"
```

---

### Task P1-2: Warmth CSS — Control sections e battle panel header

**Files:**
- Modify: `index.html` (linhas ~885–1028 e ~2849–2900)

- [ ] **Step 1: Atualizar mp-control-section backgrounds (~L932, L953, L957)**

Localizar e substituir:
```
rgba(4,6,14,0.58) → rgba(27,23,16,0.58)   [mp-control-section base]
rgba(4,6,14,0.68) → rgba(36,30,20,0.68)   [mp-control-section--hero gradiente]
rgba(4,6,14,0.46) → rgba(27,23,16,0.46)   [mp-control-section--compact]
```

- [ ] **Step 2: Atualizar mp-control-primary e buttons (~L976–1028)**

Localizar `rgba(3,5,12,0.54)`, `rgba(3,5,12,0.52)`:
```
rgba(3,5,12,0.54) → rgba(19,16,11,0.54)
rgba(3,5,12,0.52) → rgba(19,16,11,0.52)
rgba(3,5,12,0.5)  → rgba(19,16,11,0.5)
```

- [ ] **Step 3: Atualizar mp-battle-panel-header — substituir pink por ember (~L2852)**

Localizar:
```css
background: linear-gradient(102deg,
    rgba(201,152,58,0.26),
    rgba(236,72,153,0.12) 58%,
    transparent) !important;
```
Substituir por:
```css
background: linear-gradient(102deg,
    rgba(201,152,58,0.26),
    rgba(249,115,22,0.18) 58%,
    transparent) !important;
```

(Trocando `rgba(236,72,153,0.12)` — pink — por `rgba(249,115,22,0.18)` — ember)

- [ ] **Step 4: Atualizar mp-battle-panel-header::after — usar ember na linha decorativa (~L2865)**

Localizar:
```css
background: linear-gradient(90deg, var(--gold-mid), rgba(236,72,153,0.62), transparent);
```
Substituir por:
```css
background: linear-gradient(90deg, var(--gold-mid), var(--ember), transparent);
```

- [ ] **Step 5: Verificar mudanças no battle panel header**

```bash
grep -n "mp-battle-panel-header" index.html
```

Confirmar que `rgba(236,72,153` não aparece mais em mp-battle-panel-header.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "style(combat): warm control sections + ember accent in battle panel header"
```

---

### Task P1-3: Warmth CSS — Turn banners e action rail

**Files:**
- Modify: `index.html` (linhas ~1030–1425)

- [ ] **Step 1: Atualizar mp-turn-banner base background (~L1041)**

Localizar:
```css
background: rgba(4,6,14,0.86);
```
No contexto de `.mp-turn-banner {` (não confundir com outros elementos).
Substituir por:
```css
background: rgba(27,23,16,0.88);
```

- [ ] **Step 2: Atualizar mp-turn-banner__veil gradient (~L1079)**

Localizar:
```css
linear-gradient(90deg, rgba(3,5,12,0.96) 0%, rgba(3,5,12,0.78) 39%, rgba(3,5,12,0.38) 72%, rgba(3,5,12,0.76) 100%),
```
Substituir por:
```css
linear-gradient(90deg, rgba(19,16,11,0.96) 0%, rgba(19,16,11,0.78) 39%, rgba(19,16,11,0.38) 72%, rgba(19,16,11,0.76) 100%),
```

- [ ] **Step 3: Atualizar mp-action-button background (~L1331)**

Localizar:
```css
background: rgba(3,5,12,0.64);
```
No contexto de `.mp-action-button {`.
Substituir por:
```css
background: rgba(19,16,11,0.64);
```

- [ ] **Step 4: Adicionar ember no brush do action-button--active (~L1378)**

Localizar:
```css
background: color-mix(in srgb, var(--team-color) 76%, #ec4899 22%);
```
No contexto de `.mp-action-button__brush {`.
Substituir por:
```css
background: color-mix(in srgb, var(--team-color) 68%, var(--ember) 32%);
```

(Mantém a cor de equipe como base, mas troca o acento pink pelo ember ardente)

- [ ] **Step 5: Verificar que não restam valores frios em turn-banner e action-rail**

```bash
grep -n "rgba(4,6,14\|rgba(3,5,12" index.html | awk -F: '{if ($2 > 1025 && $2 < 1430) print}'
```

Expected: zero resultados nessa faixa de linhas.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "style(combat): warm turn banners + ember accent in action button brush"
```

---

### Task P1-4: Token replacement em TSX de combate

**Files:**
- Modify: `components/combat/TurnOrderPanel.tsx`
- Modify: `components/combat/CombatControlPanel.tsx`
- Modify: `components/combat/ContextCardList.tsx`

**Chave de conversão:**
- `PALETTE.goldBright` → `'var(--gold-bright)'`
- `PALETTE.goldMid` → `'var(--gold-mid)'`
- `PALETTE.goldDim` (em string template com sufixo hex alpha) → valor rgba literal:
  - `${PALETTE.goldDim}33` → `'rgba(122,94,26,0.20)'`
  - `${PALETTE.goldDim}44` → `'rgba(122,94,26,0.27)'`
  - `${PALETTE.goldDim}55` → `'rgba(122,94,26,0.33)'`
  - `${PALETTE.goldDim}77` → `'rgba(122,94,26,0.47)'`
  - `${PALETTE.goldDim}88` → `'rgba(122,94,26,0.53)'`
  - `${PALETTE.goldDim}1e` → `'rgba(122,94,26,0.12)'`
- Gradient strings com `${PALETTE.goldDim}` e `${PALETTE.goldBright}`: substituir por valores literais `#7a5e1a` e `#f0c060`

**NÃO substituir:**
- `PALETTE.hpHigh`, `PALETTE.hpMid`, `PALETTE.hpLow`, `PALETTE.apColor`
- `PALETTE.teamCast`, `PALETTE.teamNpc`
- `PALETTE.teamCast` em `ContextCardList.tsx` L229

- [ ] **Step 1: TurnOrderPanel.tsx — substituir PALETTE.goldBright e goldDim**

Ler as linhas 55-95 de `components/combat/TurnOrderPanel.tsx`.

Substituições a fazer:

Linha ~58 (no floating header):
```tsx
// DE:
color: PALETTE.goldBright,
// PARA:
color: 'var(--gold-bright)',
```

Linha ~87-89 (no non-floating header, round badge):
```tsx
// DE:
color: PALETTE.goldBright,
background: `${PALETTE.goldDim}44`,
border: `1px solid ${PALETTE.goldDim}88`,
// PARA:
color: 'var(--gold-bright)',
background: 'rgba(122,94,26,0.27)',
border: '1px solid rgba(122,94,26,0.53)',
```

Verificar: `grep -n "PALETTE\." components/combat/TurnOrderPanel.tsx` → deve retornar zero linhas.

- [ ] **Step 2: CombatControlPanel.tsx — substituir PALETTE.gold***

Fazer cada substituição usando Edit com contexto suficiente para ser único.

L110-112 (badge de round):
```tsx
// DE:
background: `${PALETTE.goldDim}33`,
border: `1px solid ${PALETTE.goldDim}55`,
color: PALETTE.goldMid,
// PARA:
background: 'rgba(122,94,26,0.20)',
border: '1px solid rgba(122,94,26,0.33)',
color: 'var(--gold-mid)',
```

L264-266 (mass dmg mode buttons):
```tsx
// DE:
background: mode === m ? `${PALETTE.goldDim}33` : 'transparent',
border: `1px solid ${mode === m ? `${PALETTE.goldDim}77` : 'rgba(255,255,255,0.1)'}`,
color: mode === m ? PALETTE.goldMid : 'var(--text-faint)',
// PARA:
background: mode === m ? 'rgba(122,94,26,0.20)' : 'transparent',
border: `1px solid ${mode === m ? 'rgba(122,94,26,0.47)' : 'rgba(255,255,255,0.1)'}`,
color: mode === m ? 'var(--gold-mid)' : 'var(--text-faint)',
```

L310 (quick roll result display):
```tsx
// DE:
color: PALETTE.goldBright,
// PARA:
color: 'var(--gold-bright)',
```

L369-373 (dice result gradient):
```tsx
// DE:
background: `linear-gradient(135deg, ${PALETTE.goldDim} 0%, ${PALETTE.goldBright} 50%, ${PALETTE.goldDim} 100%)`,
// L373:
boxShadow: `0 0 12px ${PALETTE.goldDim}55`,
// PARA:
background: 'linear-gradient(135deg, #7a5e1a 0%, #f0c060 50%, #7a5e1a 100%)',
// L373:
boxShadow: '0 0 12px rgba(122,94,26,0.33)',
```

L405-411 (start/end combat button gradient):
```tsx
// DE:
background: combat.combatants.length === 0 ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${PALETTE.goldDim} 0%, ${PALETTE.goldBright} 50%, ${PALETTE.goldDim} 100%)`,
// L411:
boxShadow: combat.combatants.length === 0 ? 'none' : `0 0 14px ${PALETTE.goldDim}55`,
// PARA:
background: combat.combatants.length === 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7a5e1a 0%, #f0c060 50%, #7a5e1a 100%)',
// L411:
boxShadow: combat.combatants.length === 0 ? 'none' : '0 0 14px rgba(122,94,26,0.33)',
```

L441-442 (add combatant badge):
```tsx
// DE:
background: `${PALETTE.goldDim}1e`, border: `1px solid ${PALETTE.goldDim}44`, borderRadius: 7,
color: PALETTE.goldBright,
// PARA:
background: 'rgba(122,94,26,0.12)', border: '1px solid rgba(122,94,26,0.27)', borderRadius: 7,
color: 'var(--gold-bright)',
```

L595 (MapPin icon color):
```tsx
// DE:
<MapPin size={8} style={{ color: PALETTE.goldMid }} />
// PARA:
<MapPin size={8} style={{ color: 'var(--gold-mid)' }} />
```

Verificar: `grep -n "PALETTE\." components/combat/CombatControlPanel.tsx` → deve retornar zero linhas.

- [ ] **Step 3: ContextCardList.tsx — substituir PALETTE.goldMid**

L158:
```tsx
// DE:
accent: PALETTE.goldMid,
// PARA:
accent: 'var(--gold-mid)',
```

L323:
```tsx
// DE:
['--skill-color' as any]: activeEntry?.accent ?? PALETTE.goldMid
// PARA:
['--skill-color' as any]: activeEntry?.accent ?? 'var(--gold-mid)'
```

L229: `accent: PALETTE.teamCast` → **manter** (semântico).

Verificar: `grep -n "PALETTE\.goldMid\|PALETTE\.goldBright\|PALETTE\.goldDim" components/combat/ContextCardList.tsx` → zero linhas.

- [ ] **Step 4: Remover import do PALETTE nos arquivos que não o usam mais**

```bash
grep -n "PALETTE" components/combat/TurnOrderPanel.tsx
grep -n "PALETTE" components/combat/ContextCardList.tsx
```

Se não houver mais referências a `PALETTE`, remover o import em cada arquivo:
- `TurnOrderPanel.tsx` L3: `import { PALETTE } from '../../utils/theme';` → remover se não restam refs
- `ContextCardList.tsx`: verificar se restam refs (ex: `PALETTE.teamCast` em L229 → SIM, manter o import)

- [ ] **Step 5: Rodar testes**

```bash
npm test
```

Expected: todos os testes passando (35+). Zero novos erros.

- [ ] **Step 6: Verificar tsc baseline**

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
```

Expected: 31 (baseline pré-existente — não aumentar).

- [ ] **Step 7: Commit**

```bash
git add components/combat/TurnOrderPanel.tsx components/combat/CombatControlPanel.tsx components/combat/ContextCardList.tsx
git commit -m "style(combat): replace PALETTE.gold* inline styles with CSS vars"
```

---

### Task P1-5: Verificação final da Fase 1

**Files:** Nenhum — verificação e commit de consolidação

- [ ] **Step 1: Confirmar que nenhum teste regrediu**

```bash
npm test 2>&1 | tail -15
```

Expected: todos passando.

- [ ] **Step 2: Confirmar tsc baseline estável**

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
```

Expected: 31.

- [ ] **Step 3: Confirmar que não restam PALETTE.gold* em arquivos de combate**

```bash
grep -rn "PALETTE\.gold" components/combat/
```

Expected: zero resultados.

- [ ] **Step 4: Confirmar que não restam rgba frios nos classes de combate no index.html**

```bash
grep -n "rgba(4,6,14\|rgba(3,5,12\|rgba(8,10,16" index.html
```

Expected: zero ou apenas nos comentários / seções não-combate que podem ter sido deixadas intencionalmente.

- [ ] **Step 5: Tag do estado Fase 1**

```bash
git tag -a "fase-1-combat" -m "Fase 1 completa: combate reskinado com atmosfera ardente"
```

