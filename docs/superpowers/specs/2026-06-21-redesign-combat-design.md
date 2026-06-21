# Redesign Fase 1 — Combate: Spec de Design

> **Contexto:** Esta spec dá continuidade à Fase 0 (fundação visual já implementada). A fundação estabeleceu tokens de cor ardente, clima dual escuro/pergaminho, primitivos React (`mp-*`), e a casca visual da app. A Fase 1 aplica esse vocabulário ao tab de combate.

---

## Objetivo

Transformar a aparência dos painéis de combate (TurnOrder, ActionRail, ContextCardList, CombatControlPanel) para **usar o sistema de clima ardente** da Fase 0: backgrounds quentes, acento ember/laranja-fogo, substituição de tokens hardcoded por CSS vars.

**O que NÃO muda na Fase 1:**
- Estrutura/layout dos componentes de combate (sem reorganização de layout)
- Cores semânticas de identidade: HP, AP, cor de equipe (`--team-cast`, `--team-npc`)
- Lógica/dados de combate

---

## Direção Visual

### Problema atual
Os painéis de combate usam backgrounds **frios** (`rgba(4,6,14,...)`, `rgba(3,5,12,...)`) que competem com o fundo quente ardente da Fase 0. O resultado é uma dissonância visual: fundo geral quente e dourado, painéis de combate azul-frios.

### Solução
**Aquecer** os backgrounds de combate para o tom marrom-escuro da atmosfera `dark`:
- `rgba(4,6,14,X)` → `rgba(27,23,16,X)` (bg-surface: `#1b1710`)
- `rgba(3,5,12,X)` → `rgba(19,16,11,X)` (bg-base: `#13100b`)
- `rgba(8,10,16,X)` → `rgba(19,16,11,X)` (bg-base)
- `rgba(28,34,52,X)` → `rgba(36,30,20,X)` (bg-raised: `#241e14`)

**Acento ember** (laranja-fogo `var(--ember)` = `#f97316`) nos cabeçalhos de batalha:
- Substituir o gradiente rosa `rgba(236,72,153,...)` no `mp-battle-panel-header` por ember
- Linha decorativa `mp-battle-panel-header::after` incorpora ember
- Estado `mp-action-button--active` brush: adicionar toque ember para ações de ataque

### O que NÃO muda no CSS
- Clip-paths, geometria diagonal, layout dos elementos
- Cores `var(--gold-*)`, `var(--team-color)` usadas nos banners
- Cores semânticas HP/AP nos tracks

---

## Mudanças por Arquivo

### `index.html` — CSS (3 zonas)

**Zona 1: Combat panel shells e collapse tabs (linhas ~594–683)**
- `.mp-collapse-tab` background: `rgba(8,10,16,0.82)` → `rgba(19,16,11,0.82)`
- `.mp-collapse-tab:hover` background: `rgba(28,34,52,0.9)` → `rgba(36,30,20,0.9)`

**Zona 2: Control sections e targeting buttons (linhas ~744–1028)**
- `.mp-targeting-button` / `.mp-card-zoom-button` backgrounds: substituir `rgba(3,5,12,...)` por `rgba(19,16,11,...)`
- `.mp-control-section` background: `rgba(4,6,14,0.58)` → `rgba(27,23,16,0.58)`
- `.mp-control-section--hero` gradiente: trocar `rgba(4,6,14,0.68)` por `rgba(36,30,20,0.68)`
- `.mp-control-section--compact` background: `rgba(4,6,14,0.46)` → `rgba(27,23,16,0.46)`
- `.mp-control-primary` / secondary / danger backgrounds: substituir bases frias

**Zona 3: Turn banners e action rail (linhas ~1030–1425)**
- `.mp-turn-banner` background: `rgba(4,6,14,0.86)` → `rgba(27,23,16,0.88)`
- `.mp-turn-banner__veil` gradiente: substituir `rgba(3,5,12,X)` por `rgba(19,16,11,X)` em todos os stops
- `.mp-turn-banner__position` background: `rgba(0,0,0,0.52)` → manter (neutro, funciona em ambos)
- `.mp-action-button` background: `rgba(3,5,12,0.64)` → `rgba(19,16,11,0.64)`
- `.mp-action-button--active` brush color: acrescentar touch ember (`color-mix(in srgb, var(--ember) 35%, var(--team-color) 65%)`) em vez de só team-color+pink

**Zona 4: Battle panel header (linhas ~2849–2900)**
- `.mp-battle-panel-header` gradiente: trocar `rgba(236,72,153,0.12)` por `rgba(249,115,22,0.18)` (ember)
- `.mp-battle-panel-header::after` linha: usar `var(--ember)` na ponta em vez de pink

---

### `components/combat/TurnOrderPanel.tsx`

Substituir inline styles com `PALETTE.*`:

| Linha | De | Para |
|-------|-----|------|
| L58   | `color: PALETTE.goldBright` | `color: 'var(--gold-bright)'` |
| L87   | `color: PALETTE.goldBright` | `color: 'var(--gold-bright)'` |
| L88   | `background: \`${PALETTE.goldDim}44\`` | `background: 'rgba(122,94,26,0.27)'` |
| L89   | `border: \`1px solid ${PALETTE.goldDim}88\`` | `border: '1px solid rgba(122,94,26,0.53)'` |

Nota: `PALETTE.goldDim` = `#7a5e1a` = `rgb(122,94,26)`. As versões alpha são aproximadas com rgba().

---

### `components/combat/CombatControlPanel.tsx`

Substituir inline styles com `PALETTE.gold*`:

| Linhas | De | Para |
|--------|-----|------|
| L110   | `background: \`${PALETTE.goldDim}33\`` | `background: 'rgba(122,94,26,0.20)'` |
| L111   | `border: \`1px solid ${PALETTE.goldDim}55\`` | `border: '1px solid rgba(122,94,26,0.33)'` |
| L112   | `color: PALETTE.goldMid` | `color: 'var(--gold-mid)'` |
| L264   | `background: mode === m ? \`${PALETTE.goldDim}33\` : 'transparent'` | `background: mode === m ? 'rgba(122,94,26,0.20)' : 'transparent'` |
| L265   | ternary `${PALETTE.goldDim}77` / `rgba(255,255,255,0.1)` | `mode === m ? 'rgba(122,94,26,0.47)' : 'rgba(255,255,255,0.1)'` |
| L266   | `color: mode === m ? PALETTE.goldMid : 'var(--text-faint)'` | `color: mode === m ? 'var(--gold-mid)' : 'var(--text-faint)'` |
| L310   | `color: PALETTE.goldBright` | `color: 'var(--gold-bright)'` |
| L369   | gradient string com `PALETTE.goldDim` / `PALETTE.goldBright` | manter com valores literais `#7a5e1a` / `#f0c060` |
| L373   | `boxShadow: \`0 0 12px ${PALETTE.goldDim}55\`` | `boxShadow: '0 0 12px rgba(122,94,26,0.33)'` |
| L405   | gradient condicional com `PALETTE.goldDim`/`PALETTE.goldBright` | manter literais |
| L411   | `boxShadow: \`0 0 14px ${PALETTE.goldDim}55\`` | `boxShadow: '0 0 14px rgba(122,94,26,0.33)'` |
| L441   | `background: \`${PALETTE.goldDim}1e\`` | `background: 'rgba(122,94,26,0.12)'` |
| L442   | `color: PALETTE.goldBright` | `color: 'var(--gold-bright)'` |
| L595   | `color: PALETTE.goldMid` | `color: 'var(--gold-mid)'` |

---

### `components/combat/ContextCardList.tsx`

| Linhas | De | Para |
|--------|-----|------|
| L158   | `accent: PALETTE.goldMid` | `accent: 'var(--gold-mid)'` |
| L229   | `accent: PALETTE.teamCast` | manter (semântico) |
| L323   | `['--skill-color']: activeEntry?.accent ?? PALETTE.goldMid` | `activeEntry?.accent ?? 'var(--gold-mid)'` |

---

## Tokens NÃO Substituídos (semânticos)

Estes ficam como `PALETTE.*` — são cores de identidade que não mudam com o clima:

- `PALETTE.hpHigh`, `PALETTE.hpMid`, `PALETTE.hpLow` — cores de saúde
- `PALETTE.apColor` — cor de Aura/AP
- `PALETTE.teamCast`, `PALETTE.teamNpc` — identidade de equipe
- Gradientes de `CARD_TYPE_THEME` — identidade visual dos cards

---

## Verificação

- `npm test` deve continuar com todos os testes passando (35 ou mais)
- `tsc --noEmit` não deve introduzir novos erros além dos 31 pré-existentes
- Inspecionar visualmente: painéis de combate devem ter tons quentes marrom-escuro, sem o azul frio anterior

---

## Fora de Escopo (Fases Futuras)

- Canvas grain texture nos cabeçalhos de combate (não obrigatório na Fase 1)
- Animações de entrada/saída de combatentes
- Aba Journey (Fase 2)
- Demais abas (Fase 3)
