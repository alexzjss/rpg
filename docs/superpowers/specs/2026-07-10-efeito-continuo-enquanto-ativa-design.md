# Efeito contínuo "Enquanto ativa" — Design

**Data:** 2026-07-10
**Relacionado:** [[project-grimorio-unificado-combate-v2]]

## Problema

O grafo hoje só tem uma raiz (gatilho). Não há como uma habilidade se aplicar como um efeito duradouro no personagem e, a cada rodada enquanto durar, rodar blocos próprios (aura, maldição, buff progressivo).

## Decisões (fechadas no brainstorm anterior)

1. **Segunda raiz solta no canvas.** O grafo passa a aceitar duas árvores independentes: a raiz primária (`ao_ativar`/`ao_ser_alvejado`, como hoje) e, opcionalmente, uma raiz secundária `enquanto_ativa` com seus próprios blocos. `setRootTrigger` continua só trocando a raiz primária; uma nova função cria/anexa a raiz secundária.
2. **Bloco `aplicar_como_efeito`** (family `efeito`, na árvore primária): campos `alvo` (`proprio`|`alvo_atual`) e `rounds` (duração). Ao interpretar, registra uma intenção (`ctx.ongoingEffectIntents`) com `targetId`, `casterId`, `rounds`.
3. **Disparo:** a árvore `enquanto_ativa` roda uma vez no início do turno de quem carrega o efeito (não da rodada inteira). `actor`/`scope` do ctx = o portador do efeito.
4. **Expiração:** ao esgotar `rounds`, remove silenciosamente e loga uma linha simples (`"{nome} deixou de estar sob efeito de {habilidade}"`).
5. **Remoção da raiz secundária:** permitida, como qualquer outro nó — só a raiz primária é protegida contra remoção.
6. Sem bloco de "ao expirar" nesta fase.

## Arquivos afetados (visão preliminar — plano detalha)

- `utils/abilityGraph.ts` — permitir 2º nó `family:'gatilho'` tipo `enquanto_ativa`.
- `utils/abilityGraphEdit.ts` — `addSecondaryTrigger`/remover via `removeNode` já genérico (ajustar guarda de "não remove raiz" para só proteger a primária).
- `utils/abilityInterpreter.ts` — `interpretAbility` aceita qual raiz iniciar.
- `utils/nodes/coreNodes.ts` — nó `aplicar_como_efeito` + tipo de gatilho `enquanto_ativa`.
- `utils/abilityGraphAction.ts` — expõe função para rodar a árvore `enquanto_ativa` de um grafo dado um portador.
- `tabs/CenaTab.tsx` — bookkeeping `cena.encounter.activeOngoingEffects` (mesmo padrão de `activeFormas`/`preparations`); hook em `advanceTurn` para: (a) rodar `enquanto_ativa` das entradas do novo ator do turno, (b) decrementar/expirar e logar.
- `components/arsenal/graph/NodePalette.tsx` — botão "Enquanto ativa" na seção de gatilho, com ação de anexar (não substituir).
- `components/arsenal/graph/GraphCanvas.tsx`/`graphLayout.ts` — layout de duas árvores lado a lado.

## Fora de escopo

- Bloco de "ao expirar".
- Gatilhos reativos genéricos (dano causado, matar alvo, entrar em combate) — fase futura.
- Blocos de grid/posição e de turno/iniciativa — fases futuras.
