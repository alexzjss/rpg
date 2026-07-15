# Aba "Cena" — Fase 3: Combate-lite real — Design

**Data:** 2026-06-28
**Status:** Aprovado para planejamento

Dá lógica real ao modo combate visual (Fase 2D). Sem grid posicional, sem
medição/alcance, sem AoE/névoa, sem timer real. Construído do zero em `tabs/cena/`
e `utils/cena.ts` (sem reusar `components/combat/*`).

## Decisões (do brainstorm)

- **Iniciativa:** automática — cada participante (party + NPCs presentes) rola
  `1d20 + baseInitiative`; ordena decrescente; empate por `baseInitiative`; log.
- **Resolução de ações:** auto completa — escolher ação → clicar no alvo → rolar
  vs defesa → aplicar dano/cura/condição → descontar custos → log.
- **Teste de acerto:** rolagem (`diceRoll` da ação, default `1d20`) vs `defense`
  do alvo (campo novo, default 10). Sucesso se total ≥ defesa.
- **Alvo:** clicar no token (mapa) ou na linha do roster; cura/buff pode mirar a si.
- **Condições:** automáticas a cada rodada via `PRESET_CONDITIONS`.
- **Derrota:** HP ≤ 0 → "caído", esmaecido, pulado na ordem, permanece na lista.
- **Custos:** bloqueia a ação se faltar `auraCost`/`ammoCost`.
- **Dano:** flat (`damage` da ação) do `damageType`; sem rolagem de dano nesta fase.

## Modelo de dados

- **Novo campo** `Character.defense?: number` (default `DEFAULT_DEFENSE = 10` quando
  ausente). `NpcEntry` herda. Editável depois (Personagens / 2B); Fase 3 só lê com default.
- `EncounterState` (já existe): `{ isActive, round, turnIndex, order: EncounterEntry[] }`.
  `EncounterEntry = { refId, side: 'party'|'npc', initiative }`.
- **Ação normalizada** (descritor interno, não persistido):
  `ResolvedAction = { source: 'card'|'seal'|'item'|'weapon'; id; name; diceRoll?; damage?;
  damageType?; healHp?; healAura?; conditionName?; conditionDuration?; auraCost?; ammoCost?; targeting?: 'self'|'other' }`.
  Normaliza Card (diceRoll/damage/damageType/auraCost/ammoCost/conditionEffect/conditionDuration),
  Seal (diceRoll/dc/damage/damageType/healHp/healAura/conditionEffect/conditionDuration/cost),
  Item & Weapon (combatDiceRoll/combatDamage/combatHeal/combatAuraRecover/combatConditionEffect/
  combatConditionDuration/combatAmmoCost/combatTargeting/consumeOnUse).
- **Log:** `CenaLogEntry` (já existe; kind `roll`/`damage`/`condition`/`system`).

## Fluxo

1. **Iniciar Combate** (`encounter.isActive=true`): rola iniciativa de todos os
   presentes, monta `order` ordenada, `round=1`, `turnIndex=0`, e gera log de cada rolagem.
2. **Início do turno do ativo:** processa condições dele (dano/cura/penalidade,
   decremento, expiração) com log. Se "caído", pula.
3. **Agir:** seleciona uma ação do ativo → escolhe alvo (clique) → resolve:
   rola vs `defense` do alvo; no sucesso aplica efeitos; desconta custos; log.
4. **Próximo/Anterior turno:** move `turnIndex`; ao virar a volta, `round++`;
   pula caídos.
5. **Encerrar Combate:** `order=[]`, `isActive=false`.

## Escrita de stats

- Party (`side==='party'`): grava no `Character` via `updateCharacterStats(id, {...})`.
- NPC (`side==='npc'`): grava no `npcRoster` via `updateCena` (helper imutável).
- Um helper único `applyStatDelta(participant, delta)` roteia por `side` e clampa
  HP/Aura em `[0, max]`.

## Decomposição em planos

- **Fase 3A — Ciclo do encounter:** helpers puros de iniciativa (`rollInitiative`,
  `buildOrder`), avanço de turno (`advanceTurn`/`prevTurn` com round e skip de caídos),
  `endEncounter`; UI: botões de turno + `InitiativeTracker` real + estado "caído".
  Sem resolução de ações ainda (botões de ação inertes).
- **Fase 3B — Resolução de ações:** `normalizeAction`, fluxo de alvo (selecionar
  ação → clicar alvo), `resolveAction` (rola vs defesa, aplica dano/cura/condição,
  desconta custos), `applyStatDelta`, log automático. `defense` em `Character`.
- **Fase 3C — Condições automáticas:** `tickConditions` (via `PRESET_CONDITIONS`)
  no início do turno; log de cada efeito; integração com derrota.

## Critérios de sucesso

- Iniciar Combate rola e ordena a iniciativa de party + NPCs presentes; o tracker
  mostra a ordem real e destaca o ativo do turno.
- Avançar turnos cicla a ordem (pulando caídos) e incrementa a rodada na volta.
- É possível agir: escolher uma ação do ativo, clicar num alvo, e ver a rolagem vs
  defesa, o dano/cura/condição aplicados, os custos descontados e tudo no log.
- HP 0 marca "caído"; party grava no Character, NPC no roster.
- Condições aplicam efeitos por rodada e expiram, com log.
- Encerrar volta à exploração. Testes passam; app compila; só os 3 erros de tsc
  pré-existentes permanecem.

## Em aberto (resolver nos planos)

- Bônus do atacante na rolagem de acerto (usar só o `diceRoll` da ação por ora; sem
  bônus de stat do atacante além do que estiver no `diceRoll`).
- Onde editar `defense` da party (fora do escopo da Fase 3; default 10).
- "Confuso"/"Paralisado"/"Desnorteado"/"Dormindo": na 3C, tratar como log/marcador
  (não bloquear a ação automaticamente) para manter o escopo enxuto.
