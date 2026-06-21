# Redesign Visual Completo — Fase 0: Fundação & Casca

**Data:** 2026-06-21
**Status:** Spec — aguardando revisão do usuário antes do plano de implementação
**Contexto:** Início de um redesign visual completo do RPG-Codex. Evolui a fundação "Metaphor dourado" existente para uma direção de arte autoral. Esta spec cobre **somente a Fase 0** (fundação compartilhada + casca global). Combate, Jornada e demais abas terão specs próprias depois.

---

## Direção de arte (DNA estético)

Decisões do brainstorming de 2026-06-21:

- **Âncora:** pintura a óleo / painterly, no registro **épico-ardente (Hades)** — saturado, quente, alto contraste.
- **Camada pintada — híbrida:** textura "óleo" por CSS em toda superfície (consistência barata) + poucas **ilustrações-herói** pintadas estáticas nos momentos-chave (fundos de aba, arena, mapa). Cartas/itens/selos já têm campo `image`; personagens têm `icon`.
- **Ornamento:** linguagem de **manuscrito iluminado (Metaphor)** — filigrana orgânica, capitulares, selos de cera, recortes diagonais.
- **Tipografia:** títulos em **serifa display itálica pesada**; corpo em **sans humanista neutra**.
- **Luminosidade — alterna por modo/aba:** combate/ação no **escuro-ardente**; jornada/leitura no **pergaminho-claro**. A troca de aba vira troca de atmosfera. Dois sistemas irmãos (mesma alma, luminosidade oposta).
- **Movimento:** **máximo espetáculo** (transições explosivas, efeitos), com **escape hatch** (`prefers-reduced-motion` + toggle "reduzir movimento") — importante para sessões longas e para o `PlayerMirror`.
- **Referência principal a estudar:** telas do **Metaphor: ReFantazio / Persona**.
- **Regras de ouro (evitar a todo custo):** (1) nada **corporativo/flat genérico** (SaaS, Material/Bootstrap, flat sem alma); (2) **contraste alto sempre** — é usado ao vivo na mesa, leitura rápida é sagrada.

## Filosofia de execução

- **Abordagem:** Fundação + estrela-guia, depois aba por aba.
- **Risco:** conservador — mudanças **incrementais e reversíveis**, validando aba por aba. Funcionalidade, dados e fluxos **não podem quebrar**. Mudança é puramente de camada de apresentação.
- **Combate (fase futura):** reskin + ajustes pontuais de layout (estrutura atual preservada).

## Decomposição do programa (visão geral, para contexto)

Cada fase terá seu próprio ciclo spec → plano → execução:

- **Fase 0 — Fundação & Casca ("UI geral")** ← *esta spec*. Transforma a pele do app inteiro e serve de estrela-guia aprovada.
- **Fase 1 — Combate** (reskin + ajustes pontuais).
- **Fase 2 — Jornada** (clima pergaminho-claro, leitura imersiva).
- **Fase 3 — Resto:** Personagens, Habilidades, Itens, Selos, Extras.

---

## Estado técnico atual (relevante)

- **Stack:** React 19 + Vite + TS. **Tailwind via CDN** (`cdn.tailwindcss.com`). Fontes Google: **Cinzel** (títulos h1/h2/h3/`.font-cinzel`), **Inter** (corpo), **JetBrains Mono** (mono).
- **Estilo espalhado:** `<style>` gigante no `index.html` + CSS vars no `:root` + classes `mp-*` (já iniciadas) + **muitos `style={{}}` inline** num `App.tsx` de ~10.302 linhas.
- **Paleta centralizada:** `utils/theme.ts` (`PALETTE`, `CARD_TYPE_THEME`, `injectThemeVars`, `DAMAGE_TYPES`, `PIN_COLORS`).
- **Casca atual:** navbar (`App.tsx` ~L5666) já tem recorte diagonal no logo, costura de acento diagonal, marca d'água gigante da aba ativa (`mp-page-title`), kicker (`mp-section-kicker`), botões `mp-cta`. Abas em `TabButton`; `activeTab` ∈ `combat | journey | characters | cards | items | seals | extras` (`TAB_META`).
- **`PlayerMirror`** (`components/PlayerMirror.tsx`): tela espelhada para jogadores via broadcast.
- **Baseline `tsc --noEmit`:** 29 erros pré-existentes — não adicionar novos.

**Implicação central:** como a aparência mora em milhares de estilos inline, "transformar tudo" exige **mover o visual para um sistema central** (tokens + classes `mp-*` + primitivos React). Sem isso, reskin = editar 10k linhas à mão (inviável e irreversível). Centralizar É o trabalho da Fase 0.

---

## Bloco 1 — Paleta épica-ardente (dois climas irmãos)

Mesma alma, luminosidade oposta. Compartilham os metais; muda o palco. Tokens estendem o `PALETTE` em `utils/theme.ts` e são injetados como CSS vars (`injectThemeVars` já existe). O clima ativo troca um subconjunto de vars via atributo no contêiner raiz (ver Bloco 5).

**Clima ESCURO-ARDENTE** (default; combate, ação, fichas, catálogos):
- Fundo near-black **quente**: `~#13100b` (aquece o `#0f1117` atual, azulado/frio).
- Metais/acentos: **ouro** `#c9983a → #f0c060` (mantido), **carmesim** `#dc2626`, **brasa/laranja** `#f97316` (ação), **púrpura real** `#a855f7` (magia/aura).
- Texto: branco **quente** com leve tom pergaminho `~#f3ecdd` (substitui o branco-azulado `#eef2ff`).

**Clima PERGAMINHO-CLARO** (jornada/leitura):
- Página: pergaminho quente `~#e9dcbf` com manchas pintadas + vinheta.
- Tinta: sépia-quase-preto `~#221a0f` (contraste alto, leitura rápida).
- Mesmos metais recalibrados para fundo claro; molduras em tinta escura + filigrana dourada.

**Estados semânticos** (vivos nos dois climas, saturados, nunca lavados): HP `hpHigh/hpMid/hpLow` (já existem), AP/aura em púrpura, `success/danger/warning` (já existem). Calibrar contraste de cada um nos dois climas.

> A paleta de tipos de carta (`CARD_TYPE_THEME`) e `DAMAGE_TYPES` permanece; ajuste fino de saturação/contraste só se necessário para a regra de contraste — sem mudar semântica.

## Bloco 2 — Tipografia

- **Títulos cerimoniais:** **Playfair Display Black Italic** (serifa display, alto contraste, inclinada). Substitui a Cinzel pesada nos títulos grandes. (Alternativa registrada: DM Serif Display Italic.)
- **Rótulos/kickers caixa-alta** (`letter-spacing` largo): **Cinzel** mantida como serifa "gravada" secundária — sistema de duas serifas.
- **Corpo:** **Inter** mantida (sans humanista neutra).
- **Números/dados:** **JetBrains Mono** mantida (HP/AP/dados de combate).
- **Carregamento:** adicionar Playfair Display ao `<link>` Google Fonts existente no `index.html`.

## Bloco 3 — Sistema de textura óleo (CSS em camadas)

O "pintado" vem de camadas baratas e reutilizáveis (via `::before/::after` + vars), nunca uma imagem por painel. Vira conjunto de tokens + classes (`mp-canvas`, `mp-paint-edge`, `mp-glaze`, `mp-vignette`):

- **Grão de tela:** textura de fibra (SVG `feTurbulence` gerado uma vez, ou PNG tile leve) em `mix-blend-mode: overlay`, opacidade baixa.
- **Bordas de pincelada:** molduras com `mask`/`clip-path` irregular (mata o "flat genérico").
- **Vinheta & profundidade:** gradiente radial escurecendo cantos (escuro) / amarelando (pergaminho).
- **Manchas/glaze:** 2–3 manchas quentes (brasa/púrpura) difusas no fundo de cada aba.
- **Brilho de metal:** realces dourados (`inset` highlight + drop-shadow colorido); embrião já existe na navbar.

**Performance:** texturas estáticas e blends são baratos; cuidado fica nos efeitos animados (Bloco 6), pontuais. Desktop-first é a premissa.

## Bloco 4 — Primitivos ornamentais de manuscrito (tijolos reutilizáveis)

Componentes React + classes que substituem `style={{}}` inline. Cada um nasce "óleo + iluminado" e respeita o clima ativo. São a **API visual** do app:

- **`<Panel>`** — superfície base: moldura de filigrana fina, canto com recorte diagonal/"ferragem" dourada, textura óleo embutida. Variantes: `dark` / `parchment` / `raised`.
- **`<Frame>`** — moldura de quadro pintado para retratos/ilustrações-herói (personagem, arte de carta, arena).
- **`<Title>` / `<Kicker>`** — título Playfair itálico + kicker Cinzel caixa-alta; marca d'água gigante opcional (padroniza a que já existe na navbar).
- **`<Divider>`** — divisória ornamental (filete + losango/selo central) no lugar de `border-top` cru.
- **`<DropCap>`** — capitular iluminada para inícios de leitura (jornada, descrição de carta).
- **`<WaxSeal>` / `<Sigil>`** — selo de cera / sinete para status, categoria, "fixado", confirmar ação (liga com a aba Selos).
- **`<Button>` / `mp-cta`** — evolui o `mp-cta` existente (recorte diagonal, brilho de metal, estados hover/disabled com contraste forte).

Reskins futuros consomem esses primitivos — mudar o look = mudar o primitivo, não a tela.

## Bloco 5 — Os dois climas na prática

Cada clima é um conjunto de tokens trocado num atributo no contêiner raiz (`data-atmosphere="dark" | "parchment"`). Os primitivos leem os tokens e se readaptam — zero código duplicado.

**Mapa aba → clima:**
- **Escuro-ardente:** Combate, Personagens, Habilidades, Itens, Selos, Extras.
- **Pergaminho-claro:** Jornada.

> Mapa binário e simples de propósito; mudar uma aba de clima = uma linha.

**Troca-espetáculo entre abas:** transição encenada — pincelada/cortina de tinta varre a tela, marca d'água gigante da nova aba entra com força, e o clima vira (escurece/clareia) no meio do movimento. **Escape hatch:** `prefers-reduced-motion` + toggle "reduzir movimento".

## Bloco 6 — Casca global (muda em TODA tela)

A Fase 0 já transforma a pele do app inteiro (casca + primitivos aparecem em toda aba):

- **Navbar:** evolui a atual para o novo registro — moldura de manuscrito, brasão/sinete no logo, metal mais rico.
- **Barra de abas:** ícone + rótulo; ativo = selo de cera aceso / brasa; inativo legível (sem sumir).
- **Fundos por aba:** glaze de cor + (Fase 0) um **fundo pintado-herói** sutil e estático por clima; refino aba a aba nas fases seguintes.
- **Cabeçalho de aba:** padroniza kicker + título Playfair + marca d'água via `<Title>`.
- **Overlays/modais/toasts:** ganham `<Panel>` e o registro novo.
- **Detalhes:** scrollbar (dourada já existe), foco, seleção — alinhados ao tom.

## Bloco 7 — Arquitetura técnica (sem quebrar nada)

- **Centralização:** tokens no `:root` via `injectThemeVars` (já existe) + classes `mp-*` em bloco CSS dedicado + primitivos React. `style={{}}` inline migram **gradualmente** para primitivos/classes, começando pela casca (alto impacto, baixo risco).
- **Tailwind CDN:** mantido por ora; utilitárias convivem com o sistema novo (não é pré-requisito mexer).
- **Fontes:** adicionar Playfair Display ao `<link>` existente.
- **Reversibilidade:** Fase 0 é **aditiva** — tokens/primitivos novos; UI antiga só trocada onde o primitivo provou equivalência. Reversível por bloco.
- **Sem tocar em lógica/dados:** nenhuma mudança em estado, persistência (`utils/database.ts`), combate ou fluxos. Apenas apresentação.

---

## Tratamento de erros / edge cases

- **`PlayerMirror`:** continua espelhando via broadcast; espetáculo respeita o toggle de reduzir movimento. Verificar que não quebra.
- **`prefers-reduced-motion`:** desliga transições pesadas; UI continua funcional e bonita estática.
- **Telas menores (futuro):** desktop-first; primitivos não devem impedir responsividade futura, mas não é foco da Fase 0.
- **Contraste:** todo par texto/fundo nos dois climas deve passar leitura rápida (regra de ouro). Sem texto fino claro sobre textura.
- **Baseline tsc:** comparar sempre contra 29 erros pré-existentes.

## Verificação

- `npx tsc --noEmit` sem **novos** erros (baseline 29).
- `npm run build` limpo; `npm test` (vitest) verde.
- Checagem visual manual: navegar todas as abas → casca nova coerente → troca-espetáculo funcionando → Jornada em pergaminho legível → contraste alto em tudo → `PlayerMirror` sem quebrar → toggle de reduzir movimento funciona.
- **Critério de pronto da Fase 0:** casca + primitivos aprovados pelo usuário no real, servindo de estrela-guia para as próximas fases.

## Arquivos afetados (previstos)

**Novos:**
- `components/ui/` — primitivos: `Panel.tsx`, `Frame.tsx`, `Title.tsx` (`Kicker`), `Divider.tsx`, `DropCap.tsx`, `WaxSeal.tsx` (`Sigil`), `Button.tsx`.
- Possível `utils/atmosphere.ts` — definição dos dois conjuntos de tokens por clima e o switch.
- Asset(s) de textura/fundo-herói (SVG/PNG leve) conforme necessário.

**Modificados:**
- `utils/theme.ts` — tokens novos da paleta ardente + tokens por clima.
- `index.html` — `<link>` Playfair; bloco `<style>` com classes `mp-*` novas (canvas/paint-edge/glaze/vignette/atmosfera).
- `App.tsx` — casca (navbar, barra de abas, cabeçalho, fundos, troca de aba) migrada para primitivos; atributo de clima no raiz; toggle reduzir movimento. Sem tocar lógica/dados.

---

## Fora de escopo (Fase 0)

- Reskin profundo de Combate, Jornada e demais abas (fases seguintes).
- Mudança de Tailwind CDN para build local.
- Ilustrações-herói específicas por aba/personagem além de 1 por clima (refinadas nas fases seguintes).
- Qualquer mudança de lógica, mecânica, persistência ou fluxo.
