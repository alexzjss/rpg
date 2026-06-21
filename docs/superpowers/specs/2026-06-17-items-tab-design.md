# Aba de Itens: catálogo referenciado + inventário + receitas/loja

**Data:** 2026-06-17
**Status:** Aprovado para implementação (aguardando revisão do spec)
**Contexto:** Feature #2 do roadmap (ver [[rpg-old-roadmap]]). O usuário quer uma aba de Itens que funcione como as Habilidades (cartas), com "cartas de item".

## Decisões tomadas no brainstorming

1. **Modelo da aba:** catálogo global + inventário.
2. **Modelo vs cópia:** referenciado (editar o modelo propaga para todos que o possuem), igual às cartas.
3. **Migração:** começar do zero (catálogo vazio; itens antigos em inventários são ignorados).
4. **Escopo:** incluir receitas e loja de upgrades reconectadas ao catálogo.
5. **Local do inventário:** a aba Itens mostra só o catálogo; a posse/quantidade fica na aba Personagens (onde já é gerida hoje).

## O que já existe (não refazer)

- `Item` interface completa em `types.ts:55` (nome, descrição, imagem, campos de combate, categoria, `usableInCombat`, `quantity`, `consumeOnUse`, etc.).
- `ItemForm` (`App.tsx:1610`) — formulário de criar/editar item.
- `CombatItemPanel` (`App.tsx:2321`) e o comando "Itens" no combate (`App.tsx:8186`, `8406`) — uso de item em combate JÁ funciona.
- `ITEMS_ICON_B64` (`App.tsx:103`).
- Uso de item em combate, receitas e loja já manipulam `Character.items` hoje.
- Padrão de catálogo global: `cards: Card[]` + store IndexedDB `'cards'` + aba "Habilidades" (Grimório).
- `AssignCardModal` (`App.tsx`) — padrão para atribuir carta a personagem.

## Modelo de dados

### Catálogo global
- Novo array global `items: Item[]` (modelos), espelhando `cards: Card[]`. Reutiliza a interface `Item` sem novos campos. O `id` é o id do modelo; `quantity` não é usado no modelo (default de doação é tratado na UI de atribuição).

### Posse referenciada
- `types.ts`: adicionar `interface OwnedItem { itemId: string; quantity: number; }`.
- `Character`: adicionar `ownedItems?: OwnedItem[]`. Campo antigo `items: Item[]` fica descontinuado (não removido do tipo para evitar quebra de import; deixa de ser usado e é esvaziado na carga).

### Resolvedor central
- Novo helper (em `utils/` ou no topo de `App.tsx`, junto de outros helpers):
  ```ts
  export interface ResolvedItem extends Item { quantity: number; }
  function resolveOwnedItems(char: Character, catalog: Item[]): ResolvedItem[]
  ```
  Mapeia `ownedItems` → modelo do catálogo, anexando `quantity`. Ignora referências órfãs (modelo deletado). Usado em TODO lugar que hoje lê `char.items`.

## Persistência (`utils/database.ts`)

- Adicionar `'items'` a `ALL_STORES`.
- **Bump `IDB_VERSION`** (para `onupgradeneeded` criar o store `'items'` com `keyPath:'id'`).
- Novos métodos espelhando `cards`: `syncItems(cb)`, `saveItem(item)`, `deleteItem(id)`.
- `items: Item[]` entra em `AppSnapshot`, `loadAll` (retorno + `initialize`), `saveFullSnapshot`, e no export/import.
- `_listeners` ganha a chave `'items'`.

## Estado no App

- `const [items, setItems] = useState<Item[]>([])`.
- No boot: `DatabaseService.syncItems(setItems)` (+ no `initialize` destructuring).
- Autosave/snapshot incluem `items`.

## Aba "Itens" (catálogo)

- `activeTab` ganha `'items'`. Novo `TabButton` (ícone `ITEMS_ICON_B64`, lucide `Backpack` ou similar) entre Habilidades e Selos.
- Layout espelha o Grimório (aba `cards`): cabeçalho ("Arsenal" / "Catálogo de Itens"), busca, e grid de **cartas de item**.
- **Carta de item:** reaproveita a estética das cartas existentes; mostra imagem, nome, categoria e — se `usableInCombat` — os stats de combate (cura/dano/custo). Clique abre edição.
- **Criar/editar:** reutiliza `ItemForm` (`App.tsx:1610`), repontado para operar no catálogo (`saveItem`/`deleteItem`) em vez do inventário de um personagem.
- **"Dar a personagem":** botão na carta abre um modal (padrão `AssignCardModal`) que escolhe personagem(ns) + quantidade e incrementa `ownedItems` via helper `giveItem(charId, itemId, qty)`.

## Aba "Personagens" (inventário)

- A seção de inventário existente (que hoje lê `selectedInventoryChar.items`) é repontada para `resolveOwnedItems(char, items)`.
- Mostra itens possuídos com quantidade e controles: +/− quantidade, remover (zera/retira a referência). Editar o item leva ao catálogo (modelo compartilhado), não edita cópia.
- Helpers: `giveItem(charId, itemId, qty)`, `setOwnedQuantity(charId, itemId, qty)`, `removeOwnedItem(charId, itemId)`.

## Receitas e Loja (reconexão por nome)

- Vínculo permanece **por nome** — estruturas de `Recipe`/upgrade não mudam.
- Helper `ensureTemplate(name, seed: Partial<Item>): string` — retorna o `itemId` de um modelo com aquele nome; se não existir, cria um novo no catálogo a partir de `seed` (campos inline da receita/upgrade) e persiste.
- **Receitas (cozinhar/forjar):**
  - Consumir ingrediente: resolver modelo por nome → decrementar `ownedItems` do personagem.
  - Produzir resultado: `ensureTemplate(resultItemName, { description: resultDescription, image: resultImage, category: resultCategory })` → `giveItem(char, itemId, resultQuantity)`.
  - Checagem de "tem ingredientes?" passa a usar `resolveOwnedItems`.
- **Loja de upgrades:** itens 'Upgrade' dados ao grupo passam por `ensureTemplate(name, {category:'Upgrade', ...})` → `giveItem`.

## Combate

- Sem mudança de comportamento. `CombatItemPanel` recebe os itens resolvidos do ator (`resolveOwnedItems`). `handleUseItem` decrementa a quantidade em `ownedItems` (em vez de em `items`). `combatItems` (`App.tsx:2329`) passa a filtrar a lista resolvida.

## Migração ("começar do zero")

- Na carga, cada `Character.ownedItems` inicia `[]` (via sanitizer `ensureChar`). O `Character.items` antigo é ignorado. Catálogo `items` começa vazio.
- Sanitizer `ensureChar` em `database.ts` passa a garantir `ownedItems: c.ownedItems ?? []`.

## Tratamento de erros / edge cases

- Referência órfã (modelo deletado mas ainda em `ownedItems`): `resolveOwnedItems` a ignora; um helper de limpeza pode removê-la na próxima escrita.
- Deletar um modelo do catálogo: remove o modelo; referências órfãs somem da visão. (Opcional: confirmar se algum personagem o possui.)
- Quantidade chega a 0: a referência é removida de `ownedItems`.
- Nome duplicado no catálogo: permitido, mas `ensureTemplate` casa o primeiro por nome (receitas/loja). UI pode avisar sobre nomes duplicados (nice-to-have, fora do escopo mínimo).

## Verificação

- `npm run build` verde + `npx tsc --noEmit` sem novos erros (baseline 29).
- Checagem visual manual (usuário): criar item no catálogo; dar a um personagem; ver no inventário do personagem na aba Personagens; usar em combate; cozinhar/forjar uma receita e ver o item referenciado aparecer; comprar upgrade e idem.

## Arquivos afetados

- `types.ts`: `OwnedItem`, `Character.ownedItems`.
- `utils/database.ts`: store `'items'`, version bump, métodos, snapshot, sanitizer.
- `App.tsx`: estado `items`, resolvedor + helpers de posse, aba Itens, cartas de item, repontar `ItemForm`, modal "dar a personagem", repontar inventário na aba Personagens, repontar receitas/loja/combate.
- Possível novo: `utils/items.ts` (resolvedor + helpers puros) para não inchar o App.tsx.
