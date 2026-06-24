# Arsenal Unification Design

**Date:** 2026-06-24  
**Status:** Approved  
**Scope:** Habilidades (Cards), Itens (Items), Selos (Seals), Armas (Weapons)

---

## Problem Statement

The four arsenal types share a conceptual identity but are implemented inconsistently:

| Type | Character assignment | Combat use | Issues |
|---|---|---|---|
| Card (Habilidade) | `character.cardIds: string[]` | Yes, full | Obsolete `command?: CommandType` field |
| Item | `character.ownedItems: OwnedItem[]` | Yes | Different assignment pattern (qty-based) |
| Weapon (Arma) | **None** | **No** | Not linked to characters; no combat logic |
| Seal (Selo) | **None** | Yes | Global catalogue; no per-character ownership |

Goals:
1. Remove `CommandType` and `card.command` — obsolete, illogical
2. Add `weaponIds` and `sealIds` to `Character` — consistent ownership
3. Give `Weapon` the same combat fields `Item` already has
4. Expose a common `ArsenalBase` interface — explicit shared contract
5. Filter combat seals to the character's owned seals
6. Wire weapons into combat action panel alongside items

---

## Approach: B — Shared base + weapon enhancement

Keep four distinct types. Introduce an explicit `ArsenalBase` interface they all extend. Enhance `Weapon` to match `Item` combat capabilities. Add ownership arrays to `Character`.

---

## Section 1: Types (`types.ts`)

### 1.1 New `ArsenalBase` interface

```ts
export interface ArsenalBase {
  id: string;
  name: string;
  image: string;
  description: string;
  isHidden?: boolean;
}
```

All four types (`Card`, `Item`, `Weapon`, `Seal`) extend `ArsenalBase`. No fields are added or removed — this makes the shared contract explicit.

### 1.2 Remove `CommandType`

```diff
- export type CommandType = 'ataque' | 'vínculo' | 'item' | 'foco' | 'fusão' | 'selo';
```

Remove `command?: CommandType` from the `Card` interface.

### 1.3 `Weapon` gains combat fields

The following optional fields are added to `Weapon` — identical to what `Item` already has:

```ts
usableInCombat?: boolean;
combatHeal?: number;
combatDamage?: number;
combatDamageType?: DamageType;
combatAuraRecover?: number;
combatAmmoRecover?: number;
combatConditionEffect?: string;
combatConditionDuration?: number;
combatDc?: number;
consumeOnUse?: boolean;
combatAmmoCost?: number;
combatTargeting?: 'self' | 'other' | 'area' | 'choice';
```

Weapon-specific fields (`damage`, `damageType`, `range`, `bonus`, `traits`, `category`) are unchanged.

### 1.4 `Character` gets weapon and seal ownership

```ts
export interface Character {
  // ... existing fields unchanged ...
  cardIds: string[];
  pinnedCardIds?: string[];
  weaponIds?: string[];    // NEW — references to Weapon.id
  sealIds?: string[];      // NEW — references to Seal.id
  ownedItems?: OwnedItem[]; // unchanged (qty-based)
}
```

`weaponIds` and `sealIds` use `string[]` (no quantity), consistent with `cardIds`.

---

## Section 2: Database (`utils/database.ts`)

Single change in `ensureChar` to default-initialize new fields for backwards compatibility:

```diff
function ensureChar(c: any): Character {
  return {
    ...c,
    items:      c.items      ?? [],
    ownedItems: c.ownedItems ?? [],
    conditions: c.conditions ?? [],
    cardIds:    c.cardIds    ?? [],
+   weaponIds:  c.weaponIds  ?? [],
+   sealIds:    c.sealIds    ?? [],
  };
}
```

No IDB version bump required — `weaponIds` and `sealIds` are optional fields on the existing `characters` object store. Old data migrates transparently.

---

## Section 3: UI — Forms

### 3.1 `CardForm` — remove Comando section

Remove the "Comando" block (~lines 1198–1214, `App.tsx`). Remove `CommandType` from all imports.

### 3.2 `WeaponForm` — add combat section

Add a collapsible "Uso em Combate" section, structured identically to `ItemForm`'s combat section:

- `usableInCombat` toggle
- When enabled:
  - HP heal / Aura recovery / Ammo recovery (number inputs)
  - Combat damage + damage type selector
  - Condition applied + duration
  - DC
  - Ammo cost
  - Targeting (`self` / `other` / `area` / `choice`)
  - `consumeOnUse` checkbox

Section is hidden when `usableInCombat` is false.

### 3.3 `CharacterForm` — weapon and seal assignment

`CharacterForm` currently accepts `cards: Card[]` and shows a toggle list. It gains two additional props and sections:

```tsx
// new props
weapons: Weapon[]
seals: Seal[]
```

Two new sections rendered below the existing card list:

**Armas section:** list of all weapons → click toggles presence in `formData.weaponIds`. Visual: thumbnail + name + check icon when selected — identical UX to the cards section.

**Selos section:** same pattern for `formData.sealIds`.

### 3.4 Arsenal catalogue — "Assign to character" for Weapons and Seals

The Weapons and Seals sub-tabs in the Arsenal gain the same "Atribuir" affordance cards already have (the `AssignCardModal` pattern, ~line 2084). A modal lists all characters; clicking a character toggles the weapon/seal in their `weaponIds` / `sealIds`.

---

## Section 4: Combat

### 4.1 Weapon resolver utility

New helper in `utils/items.ts`:

```ts
export function resolveWeapons(char: Character, catalogue: Weapon[]): Weapon[] {
  return (char.weaponIds ?? [])
    .map(id => catalogue.find(w => w.id === id))
    .filter(Boolean) as Weapon[];
}
```

### 4.2 Weapons in combat action panel

In the combat UI, weapons where `usableInCombat === true` appear alongside items in the character's action area.

The combat item handler is refactored to accept `Item | Weapon` (a union type — both share identical combat fields). TypeScript's structural typing makes this safe without a discriminated union: the handler only reads the shared combat fields (`combatDamage`, `combatHeal`, `combatConditionEffect`, etc.) and never accesses type-exclusive fields.

At the call site, weapons resolved via `resolveWeapons()` are passed into the same handler as items from `resolveOwnedItems()`. No new application logic is required.

### 4.3 Seals filtered to owned seals

Seal display in combat changes:
- If `character.sealIds.length > 0` → show only seals whose `id` is in `sealIds`
- If `character.sealIds.length === 0` → show all seals (backwards-compatible fallback for characters not yet assigned any seals)

This ensures existing campaigns are unaffected immediately after deploy.

---

## Out of scope

- Merging `Item` and `Weapon` into one type (rejected as Approach C)
- Removing the legacy `character.items: Item[]` field (kept for backwards compat, `ensureChar` already defaults it)
- Changes to Seal's own fields, execution modes, or ritual overlay

---

## File change summary

| File | Change |
|---|---|
| `types.ts` | Add `ArsenalBase`; remove `CommandType`; update `Card`, `Item`, `Weapon`, `Seal` to extend base; add `weaponIds`/`sealIds` to `Character`; add combat fields to `Weapon` |
| `utils/database.ts` | `ensureChar` defaults `weaponIds` and `sealIds` to `[]` |
| `utils/items.ts` | Add `resolveWeapons` helper |
| `App.tsx` | Remove Comando block from `CardForm`; expand `WeaponForm` with combat section; expand `CharacterForm` with weapon/seal sections + pass `weapons`/`seals` props at call site; add assign modals for weapons/seals in Arsenal tab; refactor item combat handler to `Item \| Weapon`; wire weapons into combat action panel |
| `tabs/CombatTab.tsx` | Filter seals by `character.sealIds` where non-empty |
