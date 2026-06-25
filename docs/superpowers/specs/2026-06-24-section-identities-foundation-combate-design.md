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
- **combat** — accent `#f0c95a` (ouro), accent-2 `#46cfe6` (cyan), ink `#f4ecd6` (creme), surface teal-navy translúcido, border `#1c4a52`, glow ouro, font-display serif itálica. Atmosfera `dark`.
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

- `.sec-filigree-corner` — cantos em "L" dourados (4 por painel).
- `.sec-slash` — faixa/realce diagonal.
- `.sec-glass` — superfície de vidro escura com borda e top-accent.

Implementadas com escopo em combat agora; generalizadas quando uma segunda seção precisar.

### 2.5 Arquivos da Fundação
- **novo** `utils/sectionTheme.ts` — registry + `applySectionTheme`.
- `utils/atmosphere.ts` — sem mudança de comportamento (reusado); só exporta o necessário.
- `App.tsx` (efeito ~3290-3296) — troca a chamada.
- `index.html` (`<style>`) — bloco base de tokens `--sec-*` (defaults neutros) + início dos blocos `[data-section='combat']`.
- Teste: `utils/sectionTheme.test.ts` — registry cobre todas as `TabId`; `applySectionTheme` seta `data-section` e vars; não quebra `applyAtmosphere`.

---

## 3. Combate — tratamento Metaphor completo

Mantém **funções e posições** dos painéis (arena central; painéis flutuantes esquerda/contexto/direita; banner de turno no topo; HUD inferior; modal de deck). "Ground-up" aqui = elevar **cada superfície** à fidelidade teatral Metaphor.

### 3.1 Stage / fundo da seção
- Fundo teal-navy com **sweep de luz diagonal** + textura pintada sutil, substituindo o `mp-page-bg` plano só nesta seção (via `[data-section='combat'] .mp-page-bg`).
- Vinheta mais quente nas bordas; leves linhas diagonais cyan/ouro em baixa opacidade.

### 3.2 Banner de turno
- Forma com **corte diagonal** (não retângulo), moldura dourada filigranada.
- Chip carmesim "é a vez de" à esquerda; nome em serif itálica creme; floреio cyan (losango) à direita.
- Componente atual do banner em [App.tsx](../../../App.tsx) (`turnBanner`, ~5860-5880) re-estilizado.

### 3.3 Painéis flutuantes (turn order / context / control)
- Classe `mp-combat-panel-shell` → **vidro teal escuro** (`.sec-glass`) com **top-slash dourado** e **4 cantos filigranados** (`.sec-filigree-corner`).
- Cabeçalhos em serif itálica dourada, com filete divisor.
- Componentes: `TurnOrderPanel`, `ContextCardList`, `CombatControlPanel` ([components/combat/](../../../components/combat/)).

### 3.4 Arena / tokens
- Stage com elipse de palco sutil e moldura fina.
- Tokens de combatente com **anel de seleção em losango** (ouro = aliados, carmesim = inimigos), retrato circular dentro.
- `CombatArena` ([components/combat/grid/CombatArena](../../../components/combat/grid/)) — anel/base dos tokens re-estilizado; layout do grid preservado.

### 3.5 Botões de ação / controle
- `mp-control-primary` / `mp-action-button` / `mp-skill-row` → botões **ornados, levemente assimétricos** (corte diagonal), borda dourada, energia cyan no hover; "perigo" em carmesim.

### 3.6 HUD inferior
- Medalhão de **HP circular** (arco) com avatar central.
- Barra de **aura** pintada (cyan) com brilho.
- **Condições** como joias em losango (ouro/carmesim/cyan).
- Bloco atual do bottom HUD em `CombatTab` (~645-878) re-estilizado.

### 3.7 Modal de deck
- Moldura de **códice ornamentado**: cantos filigranados, cabeçalho serif, pílulas de filtro douradas, rodapé com filete. Bloco em `CombatTab` (~878+).

### 3.8 Arquivos de Combate
- `tabs/CombatTab.tsx` — banner, HUD, modal de deck, shells de painel.
- `components/combat/TurnOrderPanel.tsx`, `ContextCardList.tsx`, `CombatControlPanel.tsx` — cabeçalhos, linhas, botões.
- `components/combat/grid/CombatArena.tsx` (+ filhos do grid) — anéis de token.
- `index.html` — blocos `[data-section='combat']` para `.mp-page-bg`, `.mp-combat-panel-shell`, `.mp-control-*`, `.mp-action-button`, `.mp-skill-row`, etc.

---

## 4. Verificação
- `npm test` verde (inclui novo `sectionTheme.test.ts` e o `atmosphere.test.ts` existente).
- Preview no navegador: trocar entre abas confirma que **só Combate** mudou; as outras quatro permanecem idênticas ao estado atual.
- Combate: banner, painéis (cantos filigranados + top-slash), tokens em losango, botões ornados, HUD circular e modal de deck conferem com o mockup aprovado.
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
