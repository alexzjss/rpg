# Personagens e Arsenal como modais na Cena

Data: 2026-07-06

## Objetivo

Remover as abas "Personagens" e "Arsenal" como destinos de navegação de primeiro nível, transformando-as em modais abertos por botões dedicados dentro da aba Cena — que passa a ser a única aba viva do app. Um modal (`CharacterManagerModal`) assume o papel de gerenciar/criar/editar personagens e escolher quem participa da cena; o outro (`ArsenalModal`) dá acesso ao `ArsenalWorkspace` existente, igual a como o Painel do Mestre já funciona hoje.

## Contexto atual (levantado nesta sessão)

- `App.tsx` define `AppTab = 'cena' | 'combat' | 'arsenal' | 'characters' | 'journey'`, mas só 3 desses valores realmente renderizam algo (`cena`, `characters`, `arsenal`); `combat`/`journey` já são código morto de uma limpeza de legado em andamento em outro plano (`docs/superpowers/plans/2026-06-28-aba-cena-fase4-limpeza-legado.md`) — **não mexer nisso aqui**.
- Não existe barra de abas visível hoje (`components/nav/MasterRing`/`CommandWheel` foram construídos num plano antigo mas nunca foram integrados ao `App.tsx`). A navegação para `characters`/`arsenal` só existe via atalho de teclado (1/2/3), tornando essas abas já efetivamente inacessíveis pela UI normal.
- `components/nav/navModel.ts` já modela `MODES = ['cena']` e `SATELLITES = ['characters', 'arsenal']` — ou seja, o projeto já tratava esses dois como "satélites" da Cena, não como modos de primeiro nível. Este spec só termina de executar essa intenção.
- A aba "Personagens" hoje é um bloco inline em `App.tsx` (~3127-3188): grade de `CharacterCard` (componente definido em `App.tsx:1978`) com criar/editar (`editingCharacter`/`setEditingCharacter`, modal genérico `Modal` + `CharacterEditor`) e excluir (`deleteCharacter`).
  - `CharacterCard` mostra "Em combate" checando `isCharInCombat` (`App.tsx:2856`), que lê `combat?.combatants` — estado do antigo sistema de combate em grid (`CombatTab`, já removida). Esse indicador está **desatualizado**: não reflete `cena.encounter`/`cena.benchedCastIds`, que é o que realmente define quem está na Cena hoje.
- A aba "Arsenal" é `ArsenalWorkspace` (`components/arsenal/ArsenalWorkspace.tsx`), já autocontida — recebe só `characters` e `onUpdateCharacter`. Renderizada hoje diretamente como conteúdo da aba (`App.tsx:3192`).
- Em `CenaTab.tsx`, `party = fullCast.filter(c => !cena.benchedCastIds.includes(c.id))` inclui **qualquer** personagem, sem checar `role`. Isso diverge do spec original do Painel do Mestre (`docs/superpowers/specs/2026-07-05-gm-control-modal-design.md`, que previa `role === 'cast'`), mas é o comportamento real hoje — este spec **não corrige** essa divergência, só documenta.
- `CenaTab.tsx:482`, `importNpc` referencia uma variável `npcChars` que **não existe** em nenhum lugar do arquivo — código morto quebrado, sobrevivente de um refactor anterior. A prop `importable`/`importableNpcs` (`RosterPanel`, `GmControlModal`) sempre chega como array vazio e nunca é renderizada em nenhum dos dois componentes. Ou seja, hoje **não existe** nenhuma forma funcional de adicionar um NPC à cena pela UI.
- O Painel do Mestre (`tabs/cena/GmControlModal.tsx`) já tem uma seção "Combatentes" com bench/unbench (adicionar/remover da cena) — vai ser removida daqui, pois o novo modal de Personagens assume esse papel.

## Decisões de escopo (confirmadas no brainstorm)

1. A seção "Combatentes" sai do Painel do Mestre; bench/unbench e a adição de NPCs passam a viver só no `CharacterManagerModal`.
2. O botão que abre o `CharacterManagerModal` fica no cabeçalho do `RosterPanel`, ao lado do botão de engrenagem do Mestre; o botão do `ArsenalModal` fica ao lado desses dois. Os três ficam juntos no mesmo canto.
3. O `CharacterManagerModal` mostra uma lista única combinando personagens fixos e NPCs de cena (em vez de duas telas separadas), com ações consistentes de adicionar/remover da cena.
4. Qualquer personagem cadastrado pode virar uma cópia avulsa (NPC) na cena atual, via um botão extra no card. Não se introduz o campo `role` na UI nem se altera o filtro de `party` — é só consertar o fluxo de "adicionar NPC" que hoje está quebrado, usando `addNpcFromCharacter` diretamente.
5. O `ArsenalWorkspace` não muda de comportamento — só passa a ser aberto num modal em vez de ser o conteúdo de uma aba.

## Mudanças de navegação

### `App.tsx`

- Remover os dois blocos de render:
  - `{activeTab === 'characters' && (...)}` (~3127-3188), incluindo o componente `CharacterCard` que mora ali (relocado para `components/characters/CharacterManagerModal.tsx`).
  - `{activeTab === 'arsenal' && (...)}` (~3191-3193).
- Remover o estado/render do editor global de personagem (`editingCharacter`, `setEditingCharacter`, o bloco `{editingCharacter && <Modal>...<CharacterEditor/></Modal>}` em ~3930) — a edição de personagem passa a viver dentro do `CharacterManagerModal`, como estado local dele.
- Manter as funções `saveCharacter`, `deleteCharacter`, `updateCharacterStats` em `App.tsx` (são as que falam com `DatabaseService` e já são usadas por outros fluxos) e passá-las como props para `CenaTab` → `CharacterManagerModal`, no mesmo padrão em que `ArsenalWorkspace` já recebe `onUpdateCharacter`.
- **Não tocar** no tipo `AppTab`/`TabId`: `'characters'`/`'arsenal'` ficam mortos-mas-tipados, no mesmo espírito de como `'combat'`/`'journey'` já são tratados (comentário existente em `navModel.ts` já documenta esse padrão). Só o código de navegação ativa muda.

### `components/nav/navModel.ts`

- `SATELLITES` e `NAV_ORDER` deixam de incluir `'characters'`/`'arsenal'` (viram inalcançáveis por teclado também, já que os modais agora são a única porta de entrada). `MODES` continua `['cena']`.

## Novo componente: `components/characters/CharacterManagerModal.tsx`

Modal full-overlay, mesmo padrão visual grande usado por `GmControlModal`/`CombatantEditor` (`cena-editor-backdrop`/`cena-editor`, com classe própria para largura maior — precisa caber uma grade de cards, não só uma coluna de formulário).

```ts
interface CharacterManagerModalProps {
  characters: Character[];
  npcRoster: NpcEntry[];
  benchedCastIds: string[];
  cards: Card[]; weapons: Weapon[]; seals: Seal[]; arsenalCards: ArsenalCard[]; // repassados ao CharacterEditor
  onToggleBench: (id: string) => void;       // adicionar/remover personagem fixo da cena
  onSpawnNpc: (char: Character) => void;     // clona um personagem como NPC avulso da cena
  onEditNpc: (npcId: string, updates: Partial<Character>) => void; // via updateNpcStats no CenaTab
  onRemoveNpc: (npcId: string) => void;
  onSaveCharacter: (char: Character) => void;
  onDeleteCharacter: (id: string) => void;
  onExportCharacter: (char: Character) => void;
  onClose: () => void;
}
```

Layout:

1. **Cabeçalho**: busca por nome + botão "Novo personagem" (abre `CharacterEditor` em modo criação, como um modal aninhado — igual ao padrão atual do `Modal` genérico envolvendo `CharacterEditor`).
2. **Grade única** ("Elenco"), reaproveitando o visual do `CharacterCard` atual (portrait, stats, stacks), com duas variantes:
   - **Personagem fixo** (`characters`): badge "PERSONAGEM"; indicador "Na cena"/"Fora da cena" calculado como `!benchedCastIds.includes(char.id)` (substitui o `isCharInCombat` antigo, que lia estado morto); botões: Editar, Excluir, Exportar, toggle "Adicionar à cena"/"Remover da cena" (bench/unbench), e "Adicionar cópia como NPC" (`onSpawnNpc`).
   - **NPC de cena** (`npcRoster`): badge "NPC DE CENA"; botões: Editar (abre `CharacterEditor` com os dados do `NpcEntry`, salvando via `onEditNpc`), Remover da cena (`onRemoveNpc` — não existe "excluir" separado, já que o NPC não tem registro persistente fora da cena).
3. Estado local `editingCharacter: Character | null` e `editingNpcId: string | null` controlam qual `CharacterEditor` (se algum) está aberto por cima da grade.

### `tabs/CenaTab.tsx`

- Novo estado `const [charManagerOpen, setCharManagerOpen] = React.useState(false)`.
- Novo estado `const [arsenalModalOpen, setArsenalModalOpen] = React.useState(false)`.
- Remover a função quebrada `importNpc` (que referenciava `npcChars` inexistente); adicionar:
  ```ts
  const spawnNpc = (char: Character) => updateCena(addNpcFromCharacter(cena, char));
  ```
- Passar `onOpenCharacterManager={() => setCharManagerOpen(true)}` e `onOpenArsenal={() => setArsenalModalOpen(true)}` para `RosterPanel`.
- Renderizar `{charManagerOpen && <CharacterManagerModal ... onClose={() => setCharManagerOpen(false)} />}` e `{arsenalModalOpen && <ArsenalModal characters={characters} onUpdateCharacter={updateCharacterStats} onClose={() => setArsenalModalOpen(false)} />}` perto do `GmControlModal` existente.

### `tabs/cena/RosterPanel.tsx`

- Duas novas props opcionais: `onOpenCharacterManager?: () => void`, `onOpenArsenal?: () => void`.
- No cabeçalho (`cena-combatants-head__nav`), ao lado do botão de engrenagem do Mestre (`onOpenGmPanel`), renderizar os dois novos botões-ícone (ex.: `Users` para Personagens, `Layers3` ou `Sword` para Arsenal — mesma família visual do botão do Mestre). Os três ficam sempre visíveis (não dependem de `round`, diferente do botão do Mestre que só aparece em combate — Personagens/Arsenal precisam estar acessíveis também fora de combate).

### `tabs/cena/GmControlModal.tsx`

- Remover a seção "Combatentes" (linhas 55-67 do arquivo atual) e as props que só ela usava: `fullCast`, `benchedIds`, `importableNpcs`, `onToggleBench`, `onImportNpc`, `onRemoveNpc`.

## Novo componente: `components/arsenal/ArsenalModal.tsx`

Casca fina — só um overlay full-screen (mesmo padrão visual dos outros modais grandes) envolvendo o `ArsenalWorkspace` já existente, com um cabeçalho próprio (título + botão fechar), sem nenhuma mudança de comportamento interno do Arsenal.

```ts
interface ArsenalModalProps {
  characters: Character[];
  onUpdateCharacter: (id: string, updates: Partial<Character>) => void;
  onClose: () => void;
}
```

## Fora de escopo

- Motor de combate/iniciativa (`utils/encounter.ts`, `utils/actions.ts`, `utils/resolve.ts`) — nenhuma mudança.
- Schema de `Character`/campo `role` — não vira selecionável na UI; filtro de `party` em `CenaTab.tsx` não muda.
- Abas mortas `combat`/`journey` e a limpeza de legado associada (plano próprio já existente).
- Fluxo interno do Arsenal (criar carta → atribuir → equipar/ativar) — permanece idêntico.
- `components/nav/MasterRing`/`CommandWheel` — continuam não integrados ao `App.tsx`; não fazem parte deste trabalho.

## Testes

- `tabs/cena/RosterPanel.test.tsx`: novos botões de cabeçalho chamam `onOpenCharacterManager`/`onOpenArsenal`.
- `components/characters/CharacterManagerModal.test.tsx` (novo): renderiza personagens + NPCs numa lista única; toggle de bench chama `onToggleBench`; "adicionar cópia como NPC" chama `onSpawnNpc` com o personagem certo; remover NPC chama `onRemoveNpc`; criar/editar abre `CharacterEditor` e propaga `onSaveCharacter`/`onDeleteCharacter`.
- `components/arsenal/ArsenalModal.test.tsx` (novo): renderiza `ArsenalWorkspace` dentro do overlay; botão fechar chama `onClose`.
- Não existe `GmControlModal.test.tsx` hoje — a cobertura de bench/NPC vive em `tabs/CenaTab.test.tsx`; ao remover a seção "Combatentes" do `GmControlModal`, revisar esse arquivo e remover/mover qualquer teste que dependesse das props `fullCast`/`benchedIds`/`onToggleBench`/`onImportNpc`/`onRemoveNpc` do modal do Mestre.
- `tabs/CenaTab.test.tsx`: `spawnNpc` adiciona corretamente ao `npcRoster` (substituindo qualquer teste que dependesse do `importNpc` quebrado, se existir).
