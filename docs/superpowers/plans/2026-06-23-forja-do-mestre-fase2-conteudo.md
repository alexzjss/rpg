# A Forja do Mestre — Fase 2: Conteúdo de Combate & Jornada — Roadmap

> Plano de execução da Fase 2 do redesign (ver spec `2026-06-23-forja-do-mestre-redesign-design.md`).
> A navegação agora é só por teclado (1-7, setas) — o anel foi removido a pedido do usuário.

**Objetivo:** Aplicar a gramática "brasa disciplinada" (calmo por padrão, drama concentrado, respiro)
ao conteúdo das duas telas principais — **Combate** e **Jornada** — extraindo-as do monólito `App.tsx`
e matando a dívida de CSS frágil.

**Restrição de verificação (importante):** as ferramentas de preview NÃO conseguem clicar elementos
`fixed` nem tirar screenshot deste app (backdrop-filter + animações contínuas). Logo:
- Mudanças **estruturais** (extração, classes, tipos) são verificadas por `tsc` + `vitest` + render
  ao vivo (presença de elementos via `preview_eval`).
- Mudanças **visuais/estéticas** precisam do olho do usuário (recarregar `localhost:3177`). Entregar
  em fatias pequenas e pedir reação, em vez de um overhaul cego de uma vez.

---

## Tarefas (ordem de menor→maior risco)

### T1 — Respiro pós-navbar (seguro, visível)
Agora que a barra superior saiu, o conteúdo começa colado no topo. Dar respiro calmo ao `<main>`
e garantir que cada aba tenha um cabeçalho discreto e coerente (kicker + título no corpo, não uma
barra fixa). Verificável: `tsc`/`vitest` + render. Baixo risco.

### T2 — Jornada: matar os hacks `[style*="…"]`
Substituir as regras `.mp-journey-cards [style*="rgba(...)"]` (frágeis, dependem da serialização do
React) por **classes reais** aplicadas no JSX dos cards (ex.: `mp-jcard`, `mp-jcard__ink`).
Verificável: a Jornada continua em pergaminho (checar cor computada dos cards via `preview_eval` na
aba `journey`), `tsc`/`vitest`. Risco médio (fiddly, mas verificável por cor computada).

### T3 — Jornada: extrair para `tabs/JourneyTab.tsx`
Mover o bloco `{activeTab === 'journey' && …}` (~1700 linhas) para um componente próprio, passando
o estado/handlers necessários por props. Refactor que preserva comportamento. Verificável: render
idêntico + `tsc`/`vitest`. Risco médio-alto (muitas props) → fazer com calma, em sub-passos.

### T4 — Combate: extrair para `tabs/CombatTab.tsx`
Idem para o bloco de Combate (orquestra `components/combat/*`). Risco alto (maior bloco) → por último.

### T5 — Combate & Jornada: passada "brasa disciplinada"
Com as telas isoladas, aplicar a gramática calma: menos blur/brasa contínua fora dos momentos-chave
(orçamento de movimento §6 da spec), mais respiro, acento brasa com parcimônia. Entregar em fatias
com reação visual do usuário.

---

## Critério de pronto da Fase 2
- `App.tsx` reduzido (Jornada e Combate em arquivos próprios).
- Zero regras `[style*="…"]` na Jornada.
- Movimento pesado restrito aos momentos-assinatura; `prefers-reduced-motion` respeitado.
- Testes verdes; `tsc` sem novos erros (baseline 31).
