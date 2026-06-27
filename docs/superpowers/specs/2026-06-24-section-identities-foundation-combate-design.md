# Identidades por Seção — Fundação + Combate (Metaphor)

**Data:** 2026-06-24
**Status:** Spec aprovado (design) — pronto para plano de implementação
**Escopo deste spec:** apenas a **Fundação** (motor de temas por seção) + a reconstrução visual de **Combate**. As outras quatro seções têm specs próprios depois.

---

## 1. Visão geral

Cada uma das cinco seções do app ganha uma **identidade visual distinta**, inspirada num jogo de referência — não só cor, mas estilo dos elementos, composição, arte e tratamento:

| Seção | Referência | Linguagem |
|-------|-----------|-----------|
| Combate | Metaphor: ReFantazio | Teal-navy ornado, filigrana dourada, diagonais teatrais, acentos cyan/ouro/carmesim |
| Jornada | Chrono Trigger | Crepúsculo roxo, janelas SNES suaves, motivo portal/relógio |
| Personagens | Final Fantasy | Azul profundo, janelas translúcidas, acentos cristalinos, barras HP/MP |
| Arsenal | Persona | Preto + vermelho, fora do grid, cinético, tipografia bold-itálica |
| Extras | Cinza neutro | Plano, utilitário, recolhido |

O usuário escolheu **reconstrução ground-up** e a ordem: **Fundação → Combate → Arsenal → Personagens → Jornada → Extras**. Cada unidade é seu próprio ciclo design → plano → build → verificação. Este spec cobre as duas primeiras.

### Princípio de não-regressão
A Fundação **não pode alterar visualmente** as outras quatro seções. Até cada seção ter seu próprio spec/build, ela continua exatamente como está hoje. A Fundação instala o *mecanismo*; só Combate recebe tratamento estrutural agora.

---

## 2. Fundação — motor de temas por seção

### 2.1 Mecanismo (estende o que já existe)
Hoje o app troca uma "atmosfera" por aba escrevendo CSS vars no `:root` ([utils/atmosphere.ts](../../../utils/atmosphere.ts)), aplicada no efeito em [App.tsx:3293](../../../App.tsx). Vamos **estender esse mesmo mecanismo**, sem substituí-lo.

- Atributo **`data-section`** no `:root` (`combat` | `journey` | `characters` | `arsenal` | `extras`), escrito no mesmo efeito que já roda `applyAtmosphere`.
- Novo módulo **`utils/sectionTheme.ts`** com:
  - `SECTION_THEMES: Record<TabId, SectionThemeDef>` — registry único.
  - `applySectionTheme(tab)` — aplica a atmosfera base (reusa `applyAtmosphere`), seta `root.dataset.section = tab` e injeta o bundle de tokens da seção.
- `App.tsx` passa a chamar `applySectionTheme(activeTab)` no lugar de `applyAtmosphere(atmosphereForTab(activeTab))`.

### 2.2 Tokens por seção
Cada `SectionThemeDef` declara:

```
interface SectionThemeDef {
  atmosphere: Atmosphere;        // base dark/parchment (futuro: 'dusk', 'neutral')
  vars: {
    '--sec-accent':      string; // acento primário
    '--sec-accent-2':    string; // acento secundário
    '--sec-ink':         string; // texto display
    '--sec-surface':     string; // superfície de painel da seção
    '--sec-border':      string; // borda da seção
    '--sec-glow':        string; // brilho/realce
    '--sec-font-display':string; // família tipográfica de títulos
  };
}
```

Bundles iniciais:
- **combat** — tríade Metaphor: accent **carmesim `#d11f3f`**, accent-2 **teal `#2fd4c4`**, accent-3 **magenta `#e6336e`**, ink **branco-creme `#f4f0e8`**, tinta preta `#0e0a0b`, ouro `#e6b84e` só como acento menor. Surface escura pintada (grunge), border carmesim/teal, glow magenta, `--sec-font-display` serif decorativa condensada caixa-alta. Atmosfera `dark`. **A tipografia diagonal e o splatter são os protagonistas — não molduras douradas.**
- **journey / characters / arsenal / extras** — bundles **neutros** que reproduzem o visual atual (sem mudança perceptível). Suas identidades reais entram nos specs próprios. Jornada mantém atmosfera `parchment` por enquanto (o dusk-purple vem no spec de Jornada).

### 2.3 CSS com escopo
Estrutura específica de seção vive em blocos com escopo no `<style>` do `index.html`:

```css
:root[data-section='combat'] .mp-combat-panel-shell { /* ... */ }
:root[data-section='combat'] .mp-control-primary { /* ... */ }
```

Isso permite restyling profundo dos elementos compartilhados (`mp-*`) sem afetar as demais seções. Nenhuma regra `[data-section='...']` para as outras seções neste spec.

### 2.4 Kit de primitivas de arte
Pequeno conjunto de utilitários CSS/elementos reaproveitáveis. A Fundação entrega **apenas o que Combate precisa**; cada seção futura adiciona as suas (starfield, window-frame, shard).

- `.mph-splatter` — respingo/pincelada de tinta (carmesim/teal/magenta) atrás de títulos e nas bordas dos painéis.
- `.mph-banner` — tag em **paralelogramo inclinado magenta** com serif branca (missão, inimigo, turno).
- `.mph-command` — comando em serif decorativa com **drop-cap gigante** + token de botão circular preto ao lado.
- `.mph-lineart` — círculos concêntricos finos / radial (motivo "archetype tree", relógio "turn back the clock").
- `.mph-panel` — superfície escura pintada com borda inclinada e respingo, **sem filigrana**.

Implementadas com escopo em combat agora; generalizadas quando uma segunda seção precisar.

### 2.5 Arquivos da Fundação
- **novo** `utils/sectionTheme.ts` — registry + `applySectionTheme`.
- `utils/atmosphere.ts` — sem mudança de comportamento (reusado); só exporta o necessário.
- `App.tsx` (efeito ~3290-3296) — troca a chamada.
- `index.html` (`<style>`) — bloco base de tokens `--sec-*` (defaults neutros) + início dos blocos `[data-section='combat']`.
- Teste: `utils/sectionTheme.test.ts` — registry cobre todas as `TabId`; `applySectionTheme` seta `data-section` e vars; não quebra `applyAtmosphere`.

---

## 3. Combate — linguagem real do Metaphor (refs anexadas)

As telas reais do jogo (batalha, menu, level-up) definem a linguagem — **não** é JRPG genérico de moldura dourada. Protagonistas visuais: **tipografia serif decorativa empilhada em diagonal**, **respingos de tinta (splatter)**, **tags em paralelogramo magenta**, **line-art branca de círculos** e a tríade **carmesim + teal + magenta** sobre preto/branco-creme. Ouro é acento menor.

Mantém **funções e posições** dos painéis (arena central; painéis flutuantes; banners no topo; HUD/lista de party; modal de deck). "Ground-up" = trocar a linguagem visual de cada superfície pela do Metaphor.

### 3.0 Paleta e tipografia
- Tríade: carmesim `#d11f3f`, teal `#2fd4c4`, magenta `#e6336e`; preto `#0e0a0b`, branco-creme `#f4f0e8`; ouro `#e6b84e` (menor).
- Display: serif decorativa condensada, caixa-alta, com **drop-cap gigante** na 1ª letra de cada comando.
- HP em teal/verde, MP em azul (`#5a8ad8`), como na lista de party do jogo.

### 3.1 Stage / fundo da seção
- Substitui `mp-page-bg` (via `[data-section='combat']`) por **canvas pintado**: base escura + textura grunge/halftone sutil + **respingos** carmesim/teal/magenta nas bordas.
- **Line-art branca** de círculos concêntricos / radial ("archetype tree") em baixa opacidade ao fundo.

### 3.2 Banners (missão / inimigo / turno)
- `.mph-banner` — **paralelogramo inclinado magenta** com serif branca. Usado no banner "é a vez de" (turno), no nome do alvo e em rótulos de missão.
- Acento/barra teal curto ao lado do texto (como o marcador de alvo do jogo).
- Componente do banner em [App.tsx](../../../App.tsx) (`turnBanner`, ~5860-5880) re-estilizado.

### 3.3 Painéis flutuantes (turn order / context / control)
- `mp-combat-panel-shell` → `.mph-panel`: superfície escura pintada, **borda inclinada** com respingo, cabeçalho em serif decorativa com splatter atrás; **sem** filigrana dourada.
- Componentes: `TurnOrderPanel`, `ContextCardList`, `CombatControlPanel` ([components/combat/](../../../components/combat/)).

### 3.4 Menu de comando / ações — peça central
- `mp-control-primary` / `mp-action-button` / `mp-skill-row` → estilo **comando diagonal empilhado** (`.mph-command`): primeira letra gigante estilizada, palavra em serif, respingo de tinta atrás, **token de botão circular preto** (atalho) ao lado. Acentos alternando teal/carmesim/magenta entre comandos.
- Leve rotação/escalonamento diagonal entre itens (composição assimétrica, como nas telas de batalha).

### 3.5 Arena / tokens
- Tokens com **anel de seleção angular/losango** recolorido — teal = aliados, carmesim = inimigos — com respingo de tinta na base; retrato circular dentro.
- `CombatArena` ([components/combat/grid/CombatArena](../../../components/combat/grid/)) — só o anel/base muda; lógica de grid/hit preservada.

### 3.6 HUD / lista de party (estilo Metaphor)
- Linhas de combatente como no jogo: **moldura de retrato angular/inclinada**, nome em serif caixa-alta, **barra HP teal + barra MP azul**, numeral de ordem de turno, tag **"FRONT/F1"** em paralelogramo magenta.
- HP do ativo pode manter medalhão circular, integrado à linha angular. Bloco do bottom HUD em `CombatTab` (~645-878).

### 3.7 Motivos line-art
- `.mph-lineart` — círculos concêntricos finos + radial; ao fundo, no marcador "RETRY / turn back the clock" (relógio) e detalhes de canto. Brancos, finos, baixa opacidade.

### 3.8 Modal de deck
- Mesmo idioma: cabeçalho serif com splatter, pílulas de filtro em paralelogramo (magenta/teal), line-art de canto, fundo grunge. Bloco em `CombatTab` (~878+).

### 3.9 Arquivos de Combate
- `tabs/CombatTab.tsx` — banners, HUD/lista de party, modal de deck, shells de painel, menu de comando.
- `components/combat/TurnOrderPanel.tsx`, `ContextCardList.tsx`, `CombatControlPanel.tsx` — cabeçalhos, linhas, comandos.
- `components/combat/grid/CombatArena.tsx` (+ filhos) — anéis de token.
- `index.html` — blocos `[data-section='combat']` + utilitários `.mph-*` (splatter, banner, command, panel, lineart); precisam vir **depois** das regras `mp-*` base.

---

## 4. Verificação
- `npm test` verde (inclui novo `sectionTheme.test.ts` e o `atmosphere.test.ts` existente).
- Preview no navegador: trocar entre abas confirma que **só Combate** mudou; as outras quatro permanecem idênticas ao estado atual.
- Combate: banners magenta inclinados, painéis pintados com splatter, menu de comando diagonal com drop-caps, tokens angulares teal/carmesim, lista de party com HP teal/MP azul, line-art branca e modal de deck conferem com as referências reais do Metaphor.
- `prefers-reduced-motion` respeitado (sem novas animações que ignorem o toggle existente).

## 5. Fora de escopo (specs futuros)
- Identidades de Jornada (dusk-purple), Personagens (FF azul), Arsenal (Persona), Extras (cinza).
- Atmosferas base novas `dusk` e `neutral` (entram com Jornada/Extras).
- Re-layout funcional do combate (mover/funcionalmente recompor painéis) — preservamos posições/funções.
- Generalização das primitivas de arte além do que Combate usa.

## 6. Riscos
- `index.html` tem um `<style>` grande e único; blocos com escopo `[data-section='combat']` precisam vir **depois** das regras `mp-*` base para vencer especificidade sem `!important`.
- Re-estilizar o token do `CombatArena` não pode interferir na lógica de hit/seleção do grid — mudança só visual (anel/base).
- Garantir que os bundles neutros das outras seções reproduzem o pixel atual (evitar regressão).
- Splatter/halftone/line-art como **SVG/CSS leve** (não imagens raster pesadas); respeitar `prefers-reduced-motion` (splatter estático, sem animação).
- Tipografia diagonal empilhada não pode quebrar legibilidade nem hit-area dos comandos — rotação só visual, alvo de clique permanece retangular.
