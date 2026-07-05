# Relógio de rodadas, carta com arte e remoção da aba Extras

Data: 2026-07-05

## 1. Relógio de rodadas (reescrita total)

**Onde:** `tabs/cena/RosterPanel.tsx` (linha ~95, `.cena-round-clock`), estilos em `tabs/cena/SceneBackdrop.tsx` (linha ~179, bloco `<style>`).

**Mecânica:**
- Um anel dividido em *n* gomos fixos, onde *n* = `orderIds.length` (combatentes vivos na ordem de turno).
- O gomo correspondente ao índice de `currentTurnId` em `orderIds` (e todos os anteriores dele na rodada atual) fica "aceso"; os seguintes ficam apagados/tênues.
- Ao avançar do último gomo (`onNextTurn` no último índice), a rodada (`round`) incrementa e o anel reseta (todos os gomos apagam, o primeiro acende).
- Centro do relógio mostra `RODADA` (label pequeno) e o número da rodada em destaque (fonte grande).
- Sem animação de rotação contínua (remove `cena-clock-spin`). Transição sutil (ex.: `transition` em stroke/opacity) ao acender um gomo.

**Implementação:**
- Novo componente SVG inline dentro de `RosterPanel.tsx` (substitui a `<div className="cena-round-clock">` atual).
- Props necessárias já existem: `round`, `currentTurnId`, `orderIds`. Calcular `currentIndex = orderIds.indexOf(currentTurnId)`.
- Gomos desenhados via `stroke-dasharray`/`stroke-dashoffset` por segmento (ou múltiplos `<circle>`/`<path>` de arco, um por combatente), com pequeno gap entre eles para leitura visual.
- Remover todo o CSS antigo de `.cena-round-clock` (rings decorativos, `cena-clock-spin`, ponteiro) em `SceneBackdrop.tsx` e substituir por estilos mínimos que suportem o SVG (mantendo paleta ouro/marrom existente: `#c49a58`, `#d9b56f`, `#fff2d9`, fundo `#101319`/`#292d35`).
- Fallback: se `orderIds.length === 0`, não renderiza o relógio (mesmo comportamento condicional atual via `round ? ... : ...`).

**Fora de escopo:** `InitiativeTracker.tsx` e `CombatCinematics.tsx` não usam este componente visual (são textos "RODADA X" separados) — não serão alterados.

## 2. Carta escolhida com arte (ActionMenu)

**Onde:** `tabs/cena/ActionMenu.tsx` (dialog `.cena-floating-card.cena-ability-card`, linhas ~70-94), estilos em `SceneBackdrop.tsx` (linhas ~164-165).

**Mudança de dados:**
- Adicionar campo opcional `image?: string` em `ResolvedAction` (`utils/actions.ts`).
- Popular em cada `normalize*`:
  - `normalizeCard`: `card.image`
  - `normalizeWeapon`: `w.image`
  - `normalizeItem`: `i.image` (verificar se `ResolvedItem` expõe `image`; caso não, usar o campo equivalente do item de origem)
  - `normalizeArsenalCard`: `card.icon` (usar `iconOverride` do nível selecionado quando presente, senão `card.icon`)
  - `GUARD_ACTION`: sem imagem (fallback visual)

**Mudança visual do dialog:**
- Cabeçalho com arte: `background: url(action.image) center/cover` + gradiente escuro na base (`linear-gradient(180deg, transparent 40%, rgba(0,0,0,.75) 100%)`), altura fixa (~120px).
- Nome da carta e categoria sobrepostos no rodapé da arte (texto claro sobre o gradiente), como no mockup aprovado.
- Sem imagem: cabeçalho cai para um bloco neutro com gradiente decorativo atual (mantém compatibilidade com cartas antigas sem `image`/`icon`).
- Corpo abaixo da arte mantém: descrição, stats (ALVO/AURA/MUNIÇÃO), efeitos, botões USAR/CANCELAR — ajustando paddings para a nova estrutura com header de imagem.
- Fechar (X) fica sobreposto no canto superior da arte (com leve fundo escuro para contraste).

## 3. Remoção completa da aba Extras

Remoção mecânica, sem substituto — nenhuma funcionalidade de Extras é preservada em outro lugar.

**Checklist:**
1. `App.tsx`: remover `'extras'` de `AppTab`; remover entrada `extras` de `TAB_META`; remover todos os states/efeitos ligados a extras (`gmNotes`, `combatNotes`, `shopCurrency`, `characterCurrencies`, `progressBars`, `rollHistory`, `lootList`, `nameStyle`, `diceQty`, `diceBonus`, `customDiceSides`, `multiRollResults`, `isTimerRunning`, `timerTime`, `timerInput`); remover inicialização/autosave/snapshot/import ligados a extras; remover o bloco JSX inteiro `{activeTab === 'extras' && ...}`.
2. `components/nav/navModel.ts`: remover `'extras'` de `SATELLITES` e `NAV_ORDER`; remover entrada `extras` de `NAV_DESTS`.
3. `utils/database.ts`: remover interface `AppExtras`, `DEFAULT_EXTRAS`, `ensureExtras()`, `syncExtras()`, `updateExtras()`, referências a `extras` no snapshot, no listener registry, no load/save de IDB e nos caminhos de compatibilidade retroativa.
4. Atualizar testes que hoje cobrem extras: `components/nav/navModel.test.ts`, `components/nav/useKeyboardNav.test.ts`, `utils/sectionTheme.test.ts`, `utils/atmosphere.test.ts`, `hooks/useUnifiedAutosave.test.tsx` — remover casos de teste específicos de extras (não adaptar/mocká-los).
5. Checar `utils/sectionTheme.ts` e `utils/atmosphere.ts` por tema/tipo `TabId` incluindo `'extras'` e remover.
6. Buscar por qualquer resíduo de string `'extras'` no repo ao final para garantir remoção completa.

## Fora de escopo
- Nenhuma migração de dados salvos de Extras (dados antigos em snapshots existentes simplesmente deixam de ser lidos/exibidos).
- Não é necessário criar tela de aviso ou fallback para usuários com dados de Extras salvos.
