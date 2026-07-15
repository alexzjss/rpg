# Aba "Cena" — Unificação de Combate + Jornada

**Data:** 2026-06-27
**Status:** Aprovado para planejamento

## Objetivo

Eliminar a dualidade entre as abas **Combate** e **Jornada**, unificando-as numa
única aba chamada **Cena** (id interno `cena`), inspirada na tela de jogo do
Alchemy RPG. A nova aba integra a progressão de jornada, o controle dos
personagens ativos e a gestão de combate quando este é iniciado.

O combate posicional (grid) e seus sistemas atrelados são **removidos**.

A aba é construída **do zero**, sem reaproveitar os componentes de combate ou
jornada existentes — apenas a inspiração visual da referência.

## Escopo

### Entra
- Uma única aba `cena` que substitui `combat` e `journey`.
- Progressão de jornada: local, subtítulo, imagem de cena, clima, notas.
- Roster de NPCs/inimigos (novo), com estados oculto/revelado e presente na cena.
- Controle do personagem ativo: selecionar um membro e usar suas ações.
- Combate-lite (sem grid): iniciativa/ordem de turnos, HP/Aura, resolução de
  ações (cartas/selos/dados) com log, e condições.

### Sai (apagado)
- `tabs/CombatTab.tsx` e `tabs/JourneyTab.tsx`.
- Pasta `components/combat/*` inteira (grid, tokens, painéis de combate antigos).
- Funcionalidades **Cozinhar, Forjar e Loja de Upgrades** (UI, tipos
  `Recipe`/`RecipeType`/`RecipeIngredient`/`UpgradeOffer*`/`UpgradeShopState`/
  `UpgradeLuck`, e os campos `recipes`/`upgradeShop` de `JourneyState`).
- Sistemas posicionais do combate: grid, tokens, AoE, névoa (fog), pins, uniões.
- Campos de grid em `CombatState` (`gridPos`, `pos`, `gridWidth`, `gridHeight`,
  `visualWidthPct`, `visualHeightPx`, `maintainAspectRatio`, `customPins`,
  `unions`, `gridVisible`, `gridDensity`, `escala`, `fog`, `aoeTemplates`).
- `utils/combatMigration.ts` (migração da grid antiga).
- Ajuste em `components/nav/navModel.ts`: de 5 destinos para 4.

## Layout (variação "cockpit", estilo Alchemy)

```
┌──────────────┬───────────────────────────────┬──────────────┐
│ LOG (auto)   │   ★ Local · clima             │ Party | NPCs │
│  rolagens    │  [faixa de ordem de turnos]   │  • membros   │
│  dano        │                               │  • inimigos  │
│  condições   │      (arte da cena)           │  Ocultos (n) │
│              │                               │      [ + ]   │
│ — aba Notas  │   ◆ ATIVO em destaque (HP/Aura)│              │
│              │     [d20] [Iniciar Combate]   │              │
├──────────────┴───────────────────────────────┴──────────────┤
│ Selos/Magias do ativo        │        Cartas/Ações do ativo  │
└──────────────────────────────────────────────────────────────┘
```

- **Esquerda:** Log automático (rolagens, dano, condições) + aba **Notas**. Sem
  campo de mensagem livre.
- **Centro:** arte do local (título + clima no topo); **personagem ativo em
  destaque** (HP/Aura); hub inferior central com d20 e botão
  **Iniciar/Encerrar Combate**. Durante o combate, **faixa de ordem de turnos**
  no topo do centro, sobre a cena.
- **Direita:** abas **Party | NPCs**, com seção **Ocultos** e botão **+** para
  adicionar à cena.
- **Inferior-esquerda:** Selos/Magias do ativo.
- **Inferior-direita:** Cartas/Ações (+ itens/armas) do ativo.

## Dados

Princípio: **UI/componentes 100% novos**, mas a party referencia a fonte única
existente; só criamos modelos novos para o que é próprio da aba.

- **Party** = `Character` da aba Personagens (fonte única). Alterações de
  HP/Aura/condições durante o combate gravam no próprio `Character` (como hoje).
- **Estado novo da aba `cena`** (modelos novos):
  - `scene`: `{ locationName, subtitle, image, weather, isNight?, notes }`.
  - `npcRoster`: lista de NPCs no **formato `Character`** (ficha completa: aura,
    cartas, selos, stats), com flags adicionais `isNpc`, `hidden`, `present`.
    Armazenados em slice próprio (não na lista de personagens da party).
  - `encounter` (combate-lite): `{ isActive, round, turnIndex, order }`, onde
    `order` é uma lista de entradas referenciando ids de party/NPC com seus
    resultados de iniciativa. Condições temporárias e estado de turno vivem aqui
    ou no `Character`/NPC referenciado, a definir no plano.
- **Cartas, Selos, Itens, Armas:** referenciados das abas existentes (Arsenal).
- **NPCs** usam o mesmo formato `Character` (campo a campo), porém em roster
  próprio e marcados como NPC.

> Decisão registrada: o usuário pediu "dados do zero", refinada para "modelos
> novos só para o que é da aba (cena, NPC roster, encounter); a party continua
> referenciando a aba Personagens, sem duplicar personagem".

## Combate (sem grid)

**Mantém:** iniciativa/ordem de turnos, HP/Aura por personagem, resolução de
ações via cartas/selos/dados (com log), condições/efeitos.

**Remove:** tudo que é posicional (grid, tokens, AoE, névoa, pins, uniões).

**Fluxo:**
1. Modo exploração — sem turnos.
2. Botão **Iniciar Combate** → rola iniciativa da party + NPCs presentes →
   exibe a ordem de turnos.
3. Resolução de ações por turno (cartas/selos/dados), com HP/Aura e condições
   atualizando e tudo registrado no log.
4. Botão **Encerrar Combate** → volta ao modo exploração.

## Tema

**Brasa / Pergaminho** (quente, dourado-âmbar sobre marrom-escuro), coerente com
o tema atual do app. Aplicado via `applySectionTheme` para a seção `cena` — **não**
por CSS puro, pois `theme.ts` injeta a paleta inline (ver gotcha de tema).

## Navegação

`components/nav/navModel.ts` passa a ter 4 destinos:
`cena` (mode) · `characters` · `arsenal` · `extras` (satellites).
`NAV_ORDER` e os atalhos numéricos são reajustados de 5 para 4.
A união `activeTab` em `App.tsx` troca `'combat' | 'journey'` por `'cena'`.

## Critérios de sucesso

- Abas Combate e Jornada não existem mais; existe a aba Cena.
- A aba Cena exibe local/clima, party e NPCs, e o personagem ativo com suas ações.
- É possível iniciar combate (iniciativa automática de party + NPCs presentes),
  agir por turnos com cartas/selos/dados, ajustar HP/Aura e condições, ver tudo
  no log, e encerrar o combate.
- Nenhum resquício de grid/tokens/AoE/névoa/pins/uniões, nem de
  Cozinhar/Forjar/Loja de Upgrades, permanece no app.
- O app compila e os testes existentes (ajustados às remoções) passam.

## Em aberto (resolver no plano)

- Onde exatamente vivem as condições temporárias e o estado de turno do encounter.
- Comportamento do botão **+** (criar NPC novo vs. adicionar do roster à cena).
- Persistência do `npcRoster` e `scene` no `utils/database.ts`.

---

## Revisão 2026-06-28 — Renovação Visual "Crimson Showtime" (handoff Claude Design)

O usuário trouxe um handoff de design (Claude Design) com duas frames: **Variação A —
Equilíbrio (Exploração)** e **Variação B — Showtime (Turno de Combate)**. Decidiu
seguir esse design, o que **reverte/ajusta** decisões anteriores deste spec:

- **GRID DE VOLTA (reversão):** o mapa central passa a ter **grid funcional simples** —
  imagem de fundo (`scene.image`), grade decorativa e **tokens arrastáveis** dos
  participantes presentes (party + NPCs com `present`), com posição salva. SEM medição,
  AoE ou névoa. Construído **do zero** em `tabs/cena/` (mantém a regra de não reusar
  `components/combat/grid/*`). → O critério "nenhum resquício de grid/tokens" acima fica
  restrito a AoE/névoa/pins/uniões; tokens posicionáveis voltam ao escopo.
- **Tema:** a seção Cena adota a estética **dark + crimson `#E0102B`** (substitui
  Brasa/Pergaminho **apenas na Cena**), via `applySectionTheme('cena')` (nova atmosfera
  "noir" + vars `--sec-*` crimson). Fontes **Anton / Barlow Condensed / Barlow Semi
  Condensed / Cinzel** carregadas no `index.html`. Cortes angulares (clip-path).
- **Log sem input:** mantém-se a decisão de **log automático sem campo de digitação**
  (o campo de mensagem do design é omitido).
- **Dois modos na mesma aba:** **Exploração (Frame A)** e **Combate (Frame B)**,
  alternados por um **toggle visual** nesta etapa (flip de `encounter.isActive`); a
  lógica real de iniciativa/turnos/resolução continua na **Fase 3**. O tracker de
  iniciativa e o spotlight do combate são montados como **skin** (ordem derivada dos
  presentes, sem rolagem real ainda).
- **Layout (ambos os modos):** esquerda = Log/Notas + Selos; centro = (título da
  cena | tracker de iniciativa) + mapa + (barra | spotlight) do ativo; direita =
  Party|NPCs + (Ações em grade | menu de ações vertical estilo P5).

Plano correspondente: `docs/superpowers/plans/2026-06-28-aba-cena-fase2c-renovacao-visual.md`.
