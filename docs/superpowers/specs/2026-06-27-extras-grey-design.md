# Identidades por Seção — Extras (cinza neutro) — Design

**Data:** 2026-06-27
**Status:** Spec aprovado (design) — pronto para plano
**Escopo:** apenas a seção **Extras**, reconstruída em **cinza neutro** — a aba que recua, plana e utilitária. Última das 5 identidades por seção (Combate/Jornada/Arsenal/Personagens já entregues).

---

## 1. Visão geral

Extras é a aba de utilitários (Dados/Timer/Progresso/Nomes/Saque/Notas GM), inline em [App.tsx](../../../App.tsx) (~6592+), envolta em `.mp-darktab` (marrom/ouro) com acentos âmbar. O alvo é **cinza básico**: neutro, plano, sem motivos de jogo — deliberadamente discreto, para os outros recuarem em contraste. O trabalho é **tirar o calor** (marrom/ouro/âmbar) e deixar cinza-frio limpo.

### Não-regressão (ponto-chave)
`.mp-darktab` é **compartilhado** com Arsenal e Personagens. Todo o tratamento é escopado sob `:root[data-section='extras']` — o `.mp-darktab` base **não** é tocado. Arsenal (Persona) e Personagens (FF) ficam idênticos; Combate/Jornada intactos.

---

## 2. Arquitetura (mesmo padrão das outras seções)

- **Bundle `EXTRAS_VARS`** ([utils/sectionTheme.ts](../../../utils/sectionTheme.ts)): `--sec-*` cinza + override de `--gold-*`/`--ember`/`--border-gold` para cinza (inline vence a injeção do tema; fallback `:root` garante limpeza ao sair). Wire na entrada `extras` do registry.
```
'--sec-accent':   '#9aa3b0', // cinza-claro
'--sec-accent-2': '#cdd3dc', // cinza muito claro
'--sec-accent-3': '#6b7280', // cinza médio
'--sec-ink':      '#e8ebf0',
'--gold-dim':'#3a3f47', '--gold-mid':'#8a93a0', '--gold-bright':'#cdd3dc', '--gold-pale':'#eef1f5',
'--border-gold':'rgba(160,170,185,0.28)', '--ember':'#8a93a0', '--ember-deep':'#4a4f57',
```
- **CSS escopado** sob `:root[data-section='extras']` no `index.html` (vence por especificidade o `.mp-darktab …!important`).
- **Inline-vence-CSS** (lição das outras seções): onde os botões/subabas usam `background`/cor inline âmbar, ajustar no JSX.

Extras segue inline em `App.tsx`.

---

## 3. Tratamento visual (cinza neutro)

### 3.0 Paleta
- Fundo `#16181c → #1c2026`; superfície `#22262e`; texto `#d6dae2`/`#aab2bf`/`#8a93a0`; bordas `rgba(160,170,185,0.18–0.4)`; acento cinza `#9aa3b0`. **Sem brilho, sem gradiente quente, sem motivo decorativo.**

### 3.1 Fundo da aba
- `:root[data-section='extras'] .mp-page-bg` → cinza neutro plano (`linear-gradient(180deg, #16181c, #1c2026)` ou sólido). `.mp-glaze` (overlay quente) → neutralizado (cinza muito sutil ou quase nulo).

### 3.2 Override do `.mp-darktab` → cinza neutro
- Texto slate aquecido → cinza-frio (`#d6dae2`/`#aab2bf`/`#8a93a0`/`#6a727e`); fundos marrom → cinza (`#16181c`/`#22262e`/`#2a2f38`); bordas ouro → cinza (`rgba(160,170,185,*)`); cyan→ouro revertido para cinza-claro `#cdd3dc`.

### 3.3 Âmbar → cinza
- Botões de dado, +Qtd/+Bônus, "Rolar", hovers (`bg-amber-700`/`hover:border-amber-500`/`text-amber-400`/`text-amber-600`) → cinza neutro (`#4a505a`/`#5a616c` fundo; `#cdd3dc` texto; `rgba(205,211,220,0.5)` borda hover). Ícones hover âmbar → cinza-claro.

### 3.4 Painéis / subabas
- `.glass-panel` → cinza neutro plano (sombra mínima). Subaba ativa já é gradiente branco→slate (`#fff→#e2e8f0`) — manter (combina com cinza). Inativa slate → cinza.

### 3.5 Sem motivos
- Nada de formas/diagonais/cristais. Plano e quieto — é a seção que recua.

---

## 4. Arquivos
- `utils/sectionTheme.ts` (+ test) — `EXTRAS_VARS` + override gold/ember.
- `index.html` — bloco `:root[data-section='extras']`: page-bg, glaze, override `.mp-darktab`, amber→cinza, glass-panel.
- `App.tsx` — quaisquer estilos inline âmbar/ouro nas subabas de Extras que vençam o CSS.

## 5. Verificação
- `npm test` verde.
- Preview: Extras vira cinza neutro plano (subabas, painéis, botões de dado em cinza); **Arsenal (Persona) e Personagens (FF) idênticos**; Combate/Jornada intactos. Via eval: `--gold-mid` = `#8a93a0` em extras; `#d4142a` em arsenal; `#5a9ae8` em characters.
- `prefers-reduced-motion` respeitado.

## 6. Fora de escopo
- **Não** tocar o `.mp-darktab` base. Mudanças funcionais (dados, timer, etc.) — só visual.

## 7. Riscos
- `.mp-darktab` compartilhado + `!important`: cada override precisa de `:root[data-section='extras'] .mp-darktab …` e cobertura completa.
- Inline-vence-CSS: botões âmbar inline nas subabas → JSX se preciso.
- Vars de paleta inline (theme.ts): overrides em `EXTRAS_VARS`, não CSS.
