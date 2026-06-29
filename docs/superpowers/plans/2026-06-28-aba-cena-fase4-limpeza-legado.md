# Aba "Cena" — Fase 4: Limpeza do Legado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover o código legado das abas Combate e Jornada (já substituídas pela aba Cena e inacessíveis pela navegação), de forma **incremental e verificada**, sem quebrar o app.

**Architecture / cuidado:** O `App.tsx` (~8566 linhas) tem ~780 referências a combat/journey/recipe/upgrade — acoplamento profundo. Parte do legado é **entrelaçada com código vivo**: `components/combat/CardDetailOverlay` é usado GLOBALMENTE no App (linha ~6966), fora do combate — portanto a pasta `components/combat` **não** pode ser apagada em bloco. O `tsconfig` NÃO tem `noUnusedLocals`, então código morto não quebra o build (deletar é seguro; o que sobra inerte não causa erro). A limpeza é fatiada em 4A→4D, cada fatia deixando: `npx vitest run` verde, `npx tsc --noEmit` só com os 3 erros pré-existentes (App.tsx 4760/5654, vitest.config.ts), `npm run build` ok, e o app rodando (aba Cena + Personagens/Arsenal/Extras intactas).

**Tech Stack:** React 19 + TS, Vite, Vitest. Verificação visual via preview (a aba Cena e as satélites devem continuar funcionando).

---

## Decomposição (4A–4D)

- **4A — Apagar as abas legadas (ESTE PLANO, executável):** remover os blocos de render de Jornada e Combate no `App.tsx`, os imports `JourneyTab`/`CombatTab`, e deletar `tabs/JourneyTab.tsx` + `tabs/CombatTab.tsx`. Deixa handlers/estado de combat/journey como código morto (inofensivo). ~2270 linhas removidas.
- **4B — Remover estado/handlers mortos do App.tsx (roadmap):** apagar as ~780 refs — `combat`/`journey` state, handlers de combate (executeCardOnTarget, handleUseItem, startCombat, endCombat, adjustCombatantStat, mass-damage, unions, fog, pins, timer…), handlers de Cozinhar/Forjar/Loja (saveRecipe, executeRecipe, generate/rerollUpgrade, purchaseUpgrade…), e os states correlatos. Fatiar por grupo, verificando a cada passo.
- **4C — Untangle `components/combat/*` + combatMigration (roadmap):** deletar os arquivos de `components/combat` usados SOMENTE pela `CombatTab` deletada; PRESERVAR `CardDetailOverlay` e sua árvore de dependências (usado globalmente no App). Remover imports órfãos no App. Deletar `utils/combatMigration.ts` + `migrateCombatState`.
- **4D — Tipos + DB + navegação (roadmap):** remover campos de grid de `CombatState`, tipos `Recipe*`/`Upgrade*`/`FogState`/`AoETemplate`/`CustomPin`/`CombatantUnion` etc.; campos `recipes`/`upgradeShop` de `JourneyState`; persistência de combat/journey no `database.ts` (DEFAULT_COMBAT/JOURNEY, ensure*, sync*, update*, AppSnapshot.combat/journey, meta __combat/__journey); e `combat`/`journey` de `TabId`/`NAV_DESTS`/atmosphere/sectionTheme/TAB_META.

> Só a 4A é detalhada aqui (executável). 4B–4D serão expandidas em planos próprios após a 4A aterrissar, dada a delicadeza do untangle e a necessidade de verificação contínua.

---

## Task 1 (4A): Remover os blocos de render Jornada + Combate

**Files:**
- Modify: `App.tsx`

READ `App.tsx` ao redor das linhas indicadas antes de editar (números podem ter deslocado).

- [ ] **Step 1: Remover os dois blocos de render**

No `App.tsx`, dentro do `<main>`, há dois blocos consecutivos:
- `{/* Aba Jornada */}` seguido de `{activeTab === 'journey' && journey && ( <JourneyTab ... /> )}` (aprox. linhas 5951–5991).
- `{/* Aba Combate */}` seguido de `{activeTab === 'combat' && combat && ( <CombatTab ... /> )}` (aprox. linhas 5993–6092).

Remover **ambos** os blocos por inteiro (do comentário `{/* Aba Jornada */}` até o `)}` que fecha o bloco do `CombatTab`, inclusive), deixando intacto o que vem antes (o fechamento `)}` do bloco da aba Cena) e o que vem depois (a linha em branco + `{/* Aba Personagens */}` / `{activeTab === 'characters' && (`).

Para localizar com precisão: o bloco a remover começa na linha que contém `{/* Aba Jornada */}` e termina no `)}` imediatamente antes de `{/* Aba Personagens */}`. Use os comentários como âncoras.

- [ ] **Step 2: Remover os imports das abas**

Remover as duas linhas de import (aprox. 115–116):
```tsx
import JourneyTab from './tabs/JourneyTab';
import CombatTab from './tabs/CombatTab';
```
NÃO remover ainda os imports de `./components/combat/*` (linhas ~102–108) nem o de `combatMigration` — isso é a 4B/4C (alguns ainda são usados; remover agora pode deixar imports órfãos, que são inofensivos, mas vamos tratar no untangle).

- [ ] **Step 3: Deletar os arquivos das abas**
```bash
git rm tabs/CombatTab.tsx tabs/JourneyTab.tsx
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit 2>&1 | grep "error TS"`
Expected: **exatamente** os 3 erros pré-existentes (App.tsx 4760, App.tsx 5654, vitest.config.ts). NENHUM novo. (Os componentes de `components/combat` continuam existindo, então imports remanescentes resolvem; o estado/handlers de combat/journey viram código morto, sem erro pois não há `noUnusedLocals`.)

Run: `npx vitest run`
Expected: suíte verde (127 testes; nenhum testava as abas deletadas).

Run: `npm run build`
Expected: sucesso.

- [ ] **Step 5: Verificação no preview**

Subir o dev server (preview) e confirmar:
- A aba **Cena** (inicial) renderiza normalmente (exploração + combate).
- As abas **Personagens / Arsenal / Extras** renderizam (navegação por teclas 1..4 / setas).
- Não há erro no console relacionado a Combat/Journey.
(As abas Combate/Jornada já eram inacessíveis pela navegação; agora seus componentes não existem mais.)

- [ ] **Step 6: Commit**
```bash
git add App.tsx
git commit -m "chore(cena): remover abas legadas Combate e Jornada (render + arquivos)"
```

---

## Self-Review (4A)

- **Abas legadas removidas:** blocos de render + arquivos `CombatTab`/`JourneyTab` deletados. ✔
- **Sem quebrar o vivo:** `CardDetailOverlay` e `components/combat/*` preservados (usados globalmente / pendentes de untangle na 4C); estado/handlers viram código morto inofensivo (sem `noUnusedLocals`). ✔
- **Verificação:** tsc (3 pré-existentes), vitest, build, preview. ✔
- **Escopo:** só a remoção das abas; o untangle profundo (4B–4D) fica para planos próprios. ✔

## Próximos planos (4B–4D)
Conforme o roadmap acima. Cada um será detalhado após a fatia anterior, com verificação contínua (tsc/build/preview) por causa do acoplamento e do entrelaçamento (CardDetailOverlay global).
