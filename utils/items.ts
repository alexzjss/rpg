import { Character, Item, OwnedItem } from '../types';

/** Item do catálogo com a quantidade possuída anexada. */
export interface ResolvedItem extends Item {
  quantity: number;
}

/** Reconstrói os itens completos que um personagem possui, a partir do catálogo.
 *  Referências órfãs (modelo deletado) são ignoradas. */
export function resolveOwnedItems(char: Character, catalog: Item[]): ResolvedItem[] {
  const owned = char.ownedItems ?? [];
  const out: ResolvedItem[] = [];
  for (const o of owned) {
    const tpl = catalog.find(i => i.id === o.itemId);
    if (!tpl) continue;
    out.push({ ...tpl, quantity: o.quantity });
  }
  return out;
}

/** Retorna um novo array ownedItems com +qty do item (cria a entrada se faltar). */
export function giveOwned(char: Character, itemId: string, qty: number): OwnedItem[] {
  const owned = [...(char.ownedItems ?? [])];
  const idx = owned.findIndex(o => o.itemId === itemId);
  if (idx >= 0) owned[idx] = { ...owned[idx], quantity: owned[idx].quantity + qty };
  else owned.push({ itemId, quantity: qty });
  return owned;
}

/** Retorna um novo array ownedItems com -qty (remove a entrada se chegar a 0). */
export function consumeOwned(char: Character, itemId: string, qty: number): OwnedItem[] {
  const owned = [...(char.ownedItems ?? [])];
  const idx = owned.findIndex(o => o.itemId === itemId);
  if (idx < 0) return owned;
  const newQty = owned[idx].quantity - qty;
  if (newQty <= 0) owned.splice(idx, 1);
  else owned[idx] = { ...owned[idx], quantity: newQty };
  return owned;
}

/** Define a quantidade exata (remove se <= 0). */
export function setOwnedQuantity(char: Character, itemId: string, qty: number): OwnedItem[] {
  if (qty <= 0) return (char.ownedItems ?? []).filter(o => o.itemId !== itemId);
  const owned = [...(char.ownedItems ?? [])];
  const idx = owned.findIndex(o => o.itemId === itemId);
  if (idx >= 0) owned[idx] = { ...owned[idx], quantity: qty };
  else owned.push({ itemId, quantity: qty });
  return owned;
}

/** Remove totalmente a posse de um item. */
export function removeOwned(char: Character, itemId: string): OwnedItem[] {
  return (char.ownedItems ?? []).filter(o => o.itemId !== itemId);
}
