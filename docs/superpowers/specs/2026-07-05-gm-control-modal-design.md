# Painel do Mestre (GM Control Modal) — aba Cena

Data: 2026-07-05

## Objetivo

Dar ao mestre um conjunto de controles administrativos dentro da aba Cena, acessíveis por um botão dedicado, sem exigir edição manual de cada personagem.

## Contexto atual

- `tabs/CenaTab.tsx` mantém `combat = true` fixo: a aba está sempre em "modo combate" visual. Um `useEffect` com guarda `encounterInitialized` inicia o encontro automaticamente na montagem se `cena.encounter.isActive` for `false`.
- `utils/encounter.ts` já tem `startEncounter`, `advanceTurn`, `prevTurn` e uma função `endEncounter` que hoje não é chamada em lugar nenhum.
- `tabs/cena/RosterPanel.tsx` já resolve adicionar/remover/ocultar/mostrar NPCs (`onImportNpc`, `onRemoveNpc`, `onToggleHidden`, `onTogglePresent`) e exibe os controles de turno (`onPrevTurn`, `onNextTurn`) ao lado do relógio de rodada.
- `tabs/cena/CombatantEditor.tsx` é o modal de referência de estilo (`cena-editor-backdrop` / `cena-editor`) para edição pontual de stats.

## Mudanças de dados

### `utils/cena.ts`

- `EncounterState.isPaused: boolean` — novo campo. Default `false` em `DEFAULT_ENCOUNTER` e `createDefaultEncounter()`.
- `CenaState.benchedCastIds: string[]` — novo campo, ids de personagens do elenco (`role === 'cast'`) temporariamente fora do combate atual. Default `[]` em `createDefaultCena()`.
- Novas funções puras:
  - `setEncounterPaused(cena: CenaState, paused: boolean): CenaState` — espelha `setEncounterActive`.
  - `benchCastMember(cena: CenaState, id: string): CenaState` — adiciona `id` a `benchedCastIds` (idempotente).
  - `unbenchCastMember(cena: CenaState, id: string): CenaState` — remove `id` de `benchedCastIds`.
  - `clearLog(cena: CenaState): CenaState` — retorna `{ ...cena, log: [] }`.

### `utils/actions.ts`

- `resetVitals(c: Character): Partial<Character>` — retorna `{ currentHp: c.maxHp, currentAura: c.maxAura, currentAmmo: c.maxAmmo, conditions: [], activeEffects: [] }`. Não mexe em `maxHp`/`maxAura`/`maxAmmo`/`defense`/`arsenal`.

### `utils/encounter.ts`

- `rerollInitiativeOrder(enc: EncounterState, participants: InitiativeParticipant[]): { encounter: EncounterState; log: CenaLogEntry[] }` — rola iniciativa nova para os `participants` informados (reaproveitando `rollInitiative`/`sortInitiative`), reordena `order`, zera `turnIndex` para `0`, reseta `turn` (`{ majorUsed:false, minorUsed:false }`) e `reactionsUsed` (`{}`). Mantém `round`, `fieldEffects`, `preparations`, `activeBuffs`, `activeFormas` intocados. Retorna também as entradas de log a anexar (`system` + uma `roll` por participante, no mesmo formato usado em `startEncounter`).
- "Reiniciar combate" **não** precisa de função nova: reaproveita `startEncounter(cena, participants)` diretamente, chamado sobre `{ ...cena, log: [] }` (log limpo antes, já que `startEncounter` só anexa).

### `utils/database.ts` (`ensureCena`)

- Adicionar `benchedCastIds: Array.isArray(raw.benchedCastIds) ? raw.benchedCastIds : []` ao objeto retornado, para preservar o campo em saves existentes.
- `encounter.isPaused` já é coberto pelo spread `{ ...base.encounter, ...(raw.encounter ?? {}) }` existente (default `false` vem de `base`).

## Mudanças de comportamento em `CenaTab.tsx`

- `party` passa a excluir ids presentes em `cena.benchedCastIds`:
  ```ts
  const party = characters.filter(c => (c.role ?? 'npc') === 'cast' && !cena.benchedCastIds.includes(c.id));
  ```
- Nova variável `fullCast = characters.filter(c => (c.role ?? 'npc') === 'cast')` — usada só pelo modal (lista completa, incluindo banidos), para permitir debanir.
- Novo estado local `const [gmModalOpen, setGmModalOpen] = React.useState(false)`.
- Handlers novos passados ao modal:
  - `onTogglePause`: `updateCena(setEncounterPaused(cena, !cena.encounter.isPaused))`.
  - `onToggleBench(id)`: `updateCena(cena.benchedCastIds.includes(id) ? unbenchCastMember(cena, id) : benchCastMember(cena, id))`.
  - `onResetAllStatus`: para cada personagem em `characters.filter(c => (c.role ?? 'npc') === 'cast')`, chama `updateCharacterStats(id, resetVitals(char))`; para cada NPC em `cena.npcRoster`, acumula `updateNpcStats` num único `updateCena` (loop imutável). Roda só após `window.confirm(...)`.
  - `onClearLog`: `updateCena(clearLog(cena))`, após `window.confirm(...)`.
  - `onRerollInitiative`: monta `initiativeParticipants` (mesmo array já calculado no corpo de `CenaTab` para `startEncounter`), chama `rerollInitiativeOrder(cena.encounter, initiativeParticipants)`, aplica `updateCena({ ...cena, encounter: result.encounter })` e `appendLog` com `result.log`. Após `window.confirm(...)`.
  - `onEndCombat`: após `window.confirm(...)`, `updateCena(startEncounter({ ...cena, log: [] }, initiativeParticipants))`. Fecha o modal ao concluir.
  - Reaproveita os handlers já existentes de NPC (`onImportNpc`/`onRemoveNpc` já definidos na render de `RosterPanel`) — passados também ao modal.
- `RosterPanel` recebe duas props novas:
  - `onOpenGmPanel: () => void` — renderiza um botão de engrenagem no cabeçalho, ao lado dos botões de turno (só quando `round` é truthy, i.e. em combate).
  - `turnControlsDisabled?: boolean` — quando `true` (= `cena.encounter.isPaused`), desabilita (`disabled`) os botões de turno anterior/próximo e mostra uma tag "PAUSADO" ao lado do `RoundClock`.

## Novo componente: `tabs/cena/GmControlModal.tsx`

Modal full-overlay no mesmo estilo visual de `CombatantEditor` (`cena-editor-backdrop`/`cena-editor`, com classe adicional `is-gm` para estilos próprios). Props:

```ts
interface GmControlModalProps {
  isPaused: boolean;
  round: number;
  fullCast: Character[];
  benchedIds: string[];
  npcRoster: NpcEntry[];
  importableNpcs: Character[];
  onTogglePause: () => void;
  onToggleBench: (id: string) => void;
  onImportNpc: (id: string) => void;
  onRemoveNpc: (id: string) => void;
  onResetAllStatus: () => void;
  onClearLog: () => void;
  onRerollInitiative: () => void;
  onEndCombat: () => void;
  onClose: () => void;
}
```

Layout (uma coluna, seções com `<h3>` de seção, mesmo tom visual do `CombatantEditor`):

1. **Combate** — mostra "Rodada N"; botão grande de toggle Pausar/Retomar (label muda conforme `isPaused`); botão secundário "Rerolar iniciativa"; botão de perigo "Reiniciar combate" (estilo destrutivo, como os botões `is-primary`/danger já usados no app).
2. **Status** — botão de perigo "Reiniciar status de todos os combatentes" com texto de aviso curto abaixo explicando o efeito (cura total + remove condições).
3. **Combatentes** — duas listas simples (nome + botão de toggle):
   - Elenco: cada nome do `fullCast` com botão "Banir"/"Reincluir" conforme presença em `benchedIds`.
   - NPCs: lista de `npcRoster` com botão remover (ícone `Trash2`, reaproveitando o padrão do `RosterPanel`); abaixo, lista de `importableNpcs` com botão "+" para importar.
4. **Log** — botão de perigo "Limpar log de combate".

Todas as ações destrutivas (reset de status, limpar log, reiniciar combate, rerolar iniciativa) usam `window.confirm(...)` antes de disparar o callback — mesmo padrão já usado em `CharacterEditor.tsx` e `ArsenalWorkspace.tsx`.

## Fora de escopo

- Não altera o fluxo de "criar personagem" nem a ficha de personagem fora da aba Cena.
- Não introduz undo/histórico de ações do GM — as ações são diretas e definitivas (mitigadas só por `window.confirm`).
- Não lida com o caso raro de banir um combatente que está no meio do turno atual (`turnIndex` aponta pra ele); o comportamento existente do código (`byId` retorna `null` e os fluxos já toleram `turnActor` nulo) é aceito como está, no mesmo espírito da limitação já documentada em `prevTurn`/`reactionsUsed`.

## Testes

- `utils/cena.test.ts`: `setEncounterPaused`, `benchCastMember`/`unbenchCastMember` (idempotência), `clearLog`.
- `utils/actions.test.ts`: `resetVitals` (cura total, limpa condições/efeitos, preserva máximos).
- `utils/encounter.test.ts`: `rerollInitiativeOrder` (reordena, zera turnIndex/turn/reactionsUsed, preserva round/fieldEffects/preparations).
- `tabs/CenaTab.test.tsx`: banir um membro do elenco remove ele de `participants`/mapa; pausa desabilita avanço de turno; reset de status aplica a todos.
