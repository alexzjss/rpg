# Grimório Unificado + Combate v2 — Design

**Data:** 2026-07-02
**Status:** Aprovado para planejamento

Reformula o sistema de combate da aba Cena e unifica os quatro catálogos do
grimório (Habilidades/Cartas, Selos, Armas, Itens) em **um tipo único** com um
**sistema de efeitos declarativo** compartilhado. Sem migração do acervo antigo
(decisão: começar do zero); personagens são preservados.

## Decisões do brainstorm

- **Direção:** refazer regras E fluxo do combate.
- **Unificação:** um tipo único (`GrimoireEntry`) com campo de categoria
  (arma/habilidade/selo/item); um catálogo, um formulário.
- **Módulos preservados:** níveis, formas, combos, requisitos/custos especiais.
- **Resolução ofensiva:** duas etapas — rolar acerto vs defesa; acertou, rola
  dano em dados.
- **Elementos:** afinidades por ficha (fraco/resistente/imune) **e** tabela de
  interações automáticas (Molhado+raio etc.).
- **Economia de ações:** 1 principal + 1 menor por turno, aplicada pelo sistema.
- **Defesa:** número fixo da ficha + buffs; reação opcional substitui por
  rolagem ativa do alvo.
- **Acervo existente:** descartado (sem migração); recadastro no novo formato.
- **Arquitetura:** motor de efeitos declarativo (lista de efeitos tipados +
  pipeline puro de resolução).

## 1. Modelo de dados

```ts
type EntryCategory = 'arma' | 'habilidade' | 'selo' | 'item';
type Element = 'normal' | 'fogo' | 'raio' | 'água' | 'terra' | 'vento'
             | 'escuridão' | 'luminoso' | 'sangue' | 'aura';

type Effect =
  | { kind: 'damage';    dice: string; element: Element }              // '2d6+3'
  | { kind: 'heal';      stat: 'hp' | 'aura' | 'ammo'; dice: string }  // aceita '5' flat
  | { kind: 'condition'; name: string; duration: number; value?: number } // PRESET_CONDITIONS
  | { kind: 'buff';      stat: 'defesa' | 'acerto' | 'dano'; value: number; duration: number };

interface CombatProfile {
  actionType: 'principal' | 'menor' | 'reação';
  targeting: 'self' | 'aliado' | 'inimigo' | 'qualquer';
  attackDice?: string;             // ex: '1d20+2'; ausente = sem teste (auto-acerto)
  costs?: { aura?: number; ammo?: number; hp?: number };
  effects: Effect[];               // N efeitos por ação
}

interface GrimoireEntry {
  id: string; name: string; image: string; description: string;
  category: EntryCategory;
  isHidden?: boolean; code?: string;
  combat?: CombatProfile;          // ausente = entrada narrativa
  // módulos opcionais
  levels?: { level: number; name?: string; combat: CombatProfile }[];
  forma?: { color: string; icon?: string; duration: number; hpBonus?: number;
            auraBonus?: number; grantedEntryIds: string[] };
  combo?: { minUsers: number; maxUsers?: number; diceMode: 'sum' | 'highest';
            preparationRounds?: number };
  requirements?: Requirement[];    // ver união abaixo
  consumable?: boolean;            // decrementa quantity ao usar
}

/** SealRequirement adaptada ao novo modelo: `hasVinculo` sai (campo `bonds`
 *  removido da ficha) e `linkedCard`/`itemCount` passam a apontar entradas. */
type Requirement =
  | { type: 'specificCharacter'; characterId: string }
  | { type: 'linkedEntry'; entryId: string }                 // possui a entrada
  | { type: 'entryCount'; entryId: string; quantity: number } // possui N unidades
  | { type: 'minHp'; value: number }                          // % 0–100
  | { type: 'minAura'; value: number };                       // % 0–100
```

Na ficha (`Character`):

```ts
grimoire: { entryId: string; quantity?: number; level?: number }[];
affinities?: Partial<Record<Element, 'fraco' | 'resistente' | 'imune'>>;
```

- Afinidade: fraco = dano ×1.5; resistente = ×0.5; imune = 0 (arredonda pra baixo).
- `level` na posse escolhe qual nível do módulo `levels` o personagem usa.
- NPCs (`NpcEntry extends Character`) herdam tudo.

**Removidos de `Character`:** `cardIds`, `pinnedCardIds`, `weaponIds`,
`sealIds`, `items`, `ownedItems`, `bonds`.

## 2. Grimório — catálogo e criação

- Aba Arsenal vira **"Grimório"**: as 4 sub-abas somem; uma grade única com
  busca + chips de filtro por categoria e por elemento.
- Card visual único: badge de categoria (cor por categoria), pílulas de efeito
  (⚔ 2d6+3 fogo · ☠ Queimando 3t · ✚ 1d8 HP), custos, badges de módulos ativos.
- Ações: editar, duplicar, excluir, atribuir a personagem (modal unificado;
  consumíveis pedem quantidade).
- **Formulário único em seções:**
  1. Identidade — nome, categoria, imagem, descrição, código, oculto.
  2. Uso em combate (toggle) — tipo de ação, alvo, teste de acerto, custos,
     consumível.
  3. Efeitos — editor de lista ("+ efeito" → Dano/Cura/Condição/Buff), linhas
     compactas editáveis, reordenáveis, removíveis.
  4. Módulos (colapsados, opt-in) — Níveis (cada nível clona e sobrescreve o
     perfil de combate), Forma, Combo, Requisitos.
- **Templates por categoria** pré-preenchem o esqueleto típico (arma → ataque
  1d20 + efeito de dano; item → consumível com cura; selo → requisitos;
  habilidade → custo de aura). Tudo editável.
- O editor nasce em `components/grimoire/*` (não incha App.tsx).

## 3. Combate v2

### Estado do turno (`EncounterState` ganha)

```ts
turn: { majorUsed: boolean; minorUsed: boolean };   // reseta a cada turno
reactionsUsed: Record<string, boolean>;             // 1 reação/rodada; reseta na rodada
activeBuffs: { targetId: string; stat: 'defesa'|'acerto'|'dano'; value: number;
               roundsRemaining: number; source: string }[];
activeFormas: { ownerId: string; entryId: string; roundsRemaining: number }[];
preparations: { ownerId: string; entryId: string; roundsRemaining: number;
                participantIds: string[] }[];
```

- Slot usado ⇒ ações daquele tipo desabilitadas com motivo visível; "Próximo
  turno" continua manual e pulsa quando ambos os slots foram usados.
- **Guarda** = ação menor embutida: +2 defesa até o início do próximo turno do
  usuário (buff comum no `activeBuffs`).
- Buffs expiram no início do turno do dono, no mesmo tick das condições, com log.

### Pipeline de resolução (`utils/resolve.ts`, puro)

1. **Requisitos** → bloqueia com motivo.
2. **Custos** → paga aura/munição/HP; consumível decrementa `quantity`.
3. **Acerto** (se há `attackDice` e alvo hostil): total = rolagem + buffs de
   acerto − penalidades de condição, vs **defesa efetiva** = `defense` + buffs.
   **Nat 20 = crítico** (dados de dano dobrados); **nat 1 = erro automático**.
4. **Reação:** se o alvo tem entrada `reação`, não reagiu na rodada e o mestre
   aceitar, a defesa fixa é substituída pela rolagem da reação. Defesa
   bem-sucedida dispara os efeitos da reação (dano/condição → atacante;
   buff/cura → reagente).
5. **Dano por efeito:** rola dados → interação elemental → afinidade → Protegido
   reduz → aplica no HP.
6. **Demais efeitos:** condições (reaplicar renova duração), buffs com duração,
   curas.
7. **Log** detalhado (dados abertos, modificadores nomeados).

### Módulos em combate

- **Forma:** usar uma entrada com módulo `forma` ativa a transformação
  (registrada em `activeFormas`): aplica os bônus de HP/Aura máx, concede as
  entradas de `grantedEntryIds` enquanto ativa e expira no tick do dono
  (duração 0 = permanente até encerrar o combate). Reverter remove os bônus
  (HP/Aura atuais clampeados ao novo máx).
- **Combo:** ao usar uma entrada com módulo `combo`, o mestre seleciona os
  participantes (entre `minUsers` e `maxUsers`, todos presentes e vivos). O
  acerto usa as rolagens de todos conforme `diceMode` (`sum` soma; `highest`
  usa a maior); custos são pagos por cada participante; o slot principal de
  todos os participantes é consumido. Com `preparationRounds`, entra em
  `preparations` e só dispara (com os mesmos participantes) após N rodadas,
  com log a cada rodada de preparo.
- **Níveis:** a resolução usa `levels[n].combat` (n = `level` da posse do
  personagem); sem `level`, usa o perfil base.

### Interações elementais (`utils/elements.ts`, tabela data-driven)

| Situação | Efeito |
|---|---|
| Dano de água | aplica Molhado (2 rodadas) |
| Raio × alvo Molhado | +X dano (X = value do Molhado) e consome Molhado |
| Fogo × alvo Molhado | dano ÷2 e consome Molhado |
| Água × alvo Queimando | remove Queimando |
| Fogo × alvo Queimando | renova duração de Queimando |

### Fluxo na UI (modo combate da Cena)

1. Menu de ações agrupado por **Principal / Menor** (+ seção informativa de
   reações), custos e bloqueios visíveis.
2. Selecionar ação → banner "escolha o alvo" → clicar token/roster.
3. **Painel de resolução passo a passo** (`tabs/cena/ResolutionPanel.tsx`):
   [Rolar acerto] → total vs defesa (+ oferta de reação do alvo, se aplicável)
   → [Rolar dano] → dados abertos + modificadores (fraqueza/interação) →
   aplica e loga. Botão "resolver tudo" executa as etapas de uma vez.
4. Spotlight do ativo mostra slots (●○) e condições/buffs ativos.

## 4. Limpeza, persistência e testes

**Apagado:**

- `types.ts`: `Card`, `Seal`, `Weapon`, `Item`, `CardLevel`, `CardBonus`,
  `SealCost`, `ActiveSeal`, `SealPreparation`, `ActiveForma` e os tipos já
  mortos do legado (`CombatState`, `Combatant`, `CombatHistoryItem`,
  `FieldCondition`, `CustomPin`, `CombatantUnion`, `FogState`, `AoETemplate`,
  `AoEShape`, `StatPopup`, `GridInteractionMode`, `ToolbarMode`, `Recipe*`,
  `Upgrade*`, `JourneyState`).
- `components/combat/*` inteiro (morto; o import de tipo `ActionCategory` em
  App.tsx passa para o novo módulo; `animFx` — único arquivo vivo, usado pela
  CardRevealAnimation — move para `components/animFx.tsx`).
- `components/PlayerMirror.tsx` e a rota de visão do jogador em `index.tsx`
  (decisão: apagar por ora; um espelho novo da Cena é projeto futuro).
- `components/FusionOverlay.tsx` (morto, dependia de `Card`).
- `components/CardRevealAnimation.tsx` **permanece**, com `CardAnimPayload`
  adaptado para nascer de uma `GrimoireEntry` (nome/imagem/categoria/custos/
  efeitos), sem depender dos tipos antigos.
- `utils/actions.ts` e `utils/combatMigration.ts`.

**Novo:**

- `utils/grimoire.ts` — tipos + helpers (resolver acervo do personagem,
  templates por categoria).
- `utils/resolve.ts` — motor de resolução (determinístico dado o RNG).
- `utils/elements.ts` — afinidades + interações.
- `utils/encounter.ts` — estendido (slots, reações, activeBuffs).
- `components/grimoire/*` — catálogo, card, EntryEditor, editor de efeitos.
- `tabs/cena/ResolutionPanel.tsx` — painel passo a passo.

**Persistência (`utils/database.ts`, IndexedDB):** bump de versão; remove os
stores `cards`, `seals`, `items`, `weapons`; cria o store `grimoire`. Imports de
saves antigos ignoram os catálogos velhos; personagens são preservados e
saneados na carga (campos removidos descartados).

**Testes (vitest):** motor (acerto/crítico/nat 1, custos e bloqueios,
afinidades, cada linha da tabela elemental, reação, buffs com duração, economia
de ações, consumíveis, tick unificado de condições+buffs) + testes leves de
componente (editor de efeitos, painel de resolução), seguindo o padrão dos
testes existentes em `tabs/cena/*` e `utils/*`.

## Critérios de sucesso

- Criar entrada de qualquer categoria num único formulário, com N efeitos e
  módulos opcionais; atribuir a personagens (com quantidade para consumíveis).
- Em combate: agir respeitando slots principal/menor; resolver ataque em duas
  etapas com crítico/nat 1; alvo pode reagir 1×/rodada; fraquezas, resistências
  e interações elementais aplicadas e explicadas no log.
- Buffs e condições tiquem e expirem sozinhos no início do turno do dono.
- Guarda dá +2 defesa até o próximo turno.
- Nenhum resquício dos 4 catálogos antigos (tipos, stores, UI); `tsc` compila e
  os testes passam.

## Fora de escopo

- Migração do acervo antigo (decisão explícita: começar do zero).
- Espelho do jogador para a Cena (PlayerMirror antigo é apagado; o novo é
  projeto futuro).
- Grid posicional com medição/alcance/AoE (o mapa de tokens livre permanece
  como está).
- Edição de afinidades em massa/UI avançada de balanceamento.
