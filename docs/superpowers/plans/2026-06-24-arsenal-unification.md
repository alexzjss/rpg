# Arsenal Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify habilidades/itens/selos/armas under a common ArsenalBase interface, add combat capabilities to weapons, assign weapons/seals to characters, and wire them into the combat action panel.

**Architecture:** Remove obsolete `CommandType`; introduce `ArsenalBase`; give `Weapon` the same combat fields `Item` has; add `weaponIds`/`sealIds` to `Character`; add assign modals in Arsenal tab; wire weapons+seals into `ContextCardList`.

**Tech Stack:** TypeScript, React, IndexedDB (DatabaseService), Vitest

**Spec:** `docs/superpowers/specs/2026-06-24-arsenal-unification-design.md`

---

### Task 1: types.ts — type foundations

**Files:**
- Modify: `types.ts`

- [ ] Remove `CommandType` type (line 5)
- [ ] Add `ArsenalBase` interface after the imports block
- [ ] Remove `command?: CommandType` from `Card` interface (was line 107)
- [ ] Add `combatDiceRoll?: string` to `Item` (after `combatAmmoCost`)
- [ ] Add combat fields to `Weapon` (after existing `isHidden?: boolean`)
- [ ] Add `weaponIds?: string[]` and `sealIds?: string[]` to `Character`
- [ ] Run `npx tsc --noEmit` — expect no new errors

---

### Task 2: utils/database.ts — ensureChar defaults

**Files:**
- Modify: `utils/database.ts:184-186`

- [ ] Add `weaponIds: c.weaponIds ?? []` and `sealIds: c.sealIds ?? []` to `ensureChar`

---

### Task 3: utils/items.ts — resolveWeapons helper

**Files:**
- Modify: `utils/items.ts`

- [ ] Add `Weapon` to the import line
- [ ] Add `resolveWeapons(char, catalogue)` function

---

### Task 4: App.tsx — remove CommandType from CardForm

**Files:**
- Modify: `App.tsx`

- [ ] Remove `CommandType` from import at line 94
- [ ] Remove the "Comando" block from CardForm (~lines 1197–1217)

---

### Task 5: App.tsx — WeaponForm combat section

**Files:**
- Modify: `App.tsx:1896`

- [ ] Insert combat section (identical to ItemForm's) before the submit div

---

### Task 6: App.tsx — CharacterForm weapon/seal sections

**Files:**
- Modify: `App.tsx:555-701`

- [ ] Add `weapons: Weapon[]` and `seals: Seal[]` to props
- [ ] Add `toggleWeapon` and `toggleSeal` handlers
- [ ] Update initial formData with `weaponIds: [], sealIds: []`
- [ ] Add weapon toggle list after card list
- [ ] Add seal toggle list after weapon list
- [ ] Update CharacterForm call site at line 7876

---

### Task 7: App.tsx — Arsenal assign modals

**Files:**
- Modify: `App.tsx`

- [ ] Add `assignWeaponModal` and `assignSealModal` state
- [ ] Add assign button to each weapon catalogue card (with stopPropagation)
- [ ] Add assign button to each seal catalogue card
- [ ] Add `AssignWeaponModal` and `AssignSealModal` components
- [ ] Render assign modals in the modal section

---

### Task 8: ContextCardList.tsx — weapons and seals

**Files:**
- Modify: `components/combat/ContextCardList.tsx`

- [ ] Import `Weapon`, `Seal` from types; import `resolveWeapons` from utils/items
- [ ] Add `weapons`, `seals`, `onWeaponClick`, `onSealClick` to props interface
- [ ] Extend `SkillEntry` with `weapon?: Weapon`, `seal?: Seal`, and kinds
- [ ] Merge `usableInCombat` weapons into `category === 'item'` entries
- [ ] Add `category === 'selo'` case (filter by `combatant.sealIds` if non-empty)
- [ ] Remove hardcoded selo empty-state in JSX; let normal empty-state handle it
- [ ] Update `handleActivate` for weapon/seal kinds
- [ ] Update `SkillIcon` for weapon/seal

---

### Task 9: CombatTab.tsx — forward weapons/seals

**Files:**
- Modify: `tabs/CombatTab.tsx`

- [ ] Import `Weapon` type
- [ ] Add `weapons: Weapon[]` and `onActivateSeal: (seal, actorCombatId) => void` to CombatTabProps
- [ ] Pass `weapons`, filtered `seals`, `onWeaponClick`, `onSealClick` to `ContextCardList`

---

### Task 10: App.tsx — wire CombatTab

**Files:**
- Modify: `App.tsx:5723-5817`

- [ ] Define `handleActivateSeal(seal, actorCombatId)` (combo → modal; else → executeSeal)
- [ ] Pass `weapons={weapons}` and `onActivateSeal={handleActivateSeal}` to CombatTab

---

### Commit

```bash
git add types.ts utils/database.ts utils/items.ts App.tsx tabs/CombatTab.tsx components/combat/ContextCardList.tsx
git commit -m "feat(arsenal): T7 — unifica arsenal (ArsenalBase, weapon combat, assign, combat panel)"
```
