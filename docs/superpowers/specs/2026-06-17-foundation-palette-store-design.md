# Fundação: Paleta centralizada + Store de combate compartilhável

**Data:** 2026-06-17
**Status:** Aprovado para implementação
**Contexto:** Primeira passada de fundação antes das features maiores (aba de itens, animações, grid 3D, redesign, janela de jogadores). Escolhida pelo usuário como "Paleta + store mínimo", intenção "Aproveitar e refinar", store até "Plumbing + espelho mínimo".

## Objetivo

Destravar o redesign visual (#6) e a janela de jogadores (#6) sem desestabilizar o app de 12k linhas:
1. Centralizar as cores hardcoded numa fonte única tipada, corrigindo inconsistências óbvias.
2. Adicionar uma camada de broadcast do estado de combate entre janelas + uma janela-espelho read-only mínima que prove a sincronização.

Não-objetivos desta passada: redesign visual completo, troca de tema claro/escuro, refatoração dos 186 `useState`, UI bonita da visão de jogador (fica para a #6).

## Estado atual relevante

- `App.tsx` (12.086 linhas): `combat` é um único `useState<CombatState|null>` (App.tsx:3552); atualizado por `updateCombat` e por `DatabaseService.syncCombatState(cb)` (App.tsx:3768).
- Persistência reativa já existe em `utils/database.ts` (IndexedDB + listeners in-memory).
- Cores de tipo de carta (`typeConfig`) duplicadas e divergentes em App.tsx:8357, 9245, 10192.
- `DAMAGE_TYPES` em App.tsx:777; `PIN_COLORS` em App.tsx:1977. CSS vars já existem em `index.html` `:root` mas quase não são usadas no App.tsx.
- `index.tsx` é o entry point; renderiza `<App/>` direto.
- Sem repositório git (spec não será commitado). Sem suite de testes.

## Parte 1 — `utils/theme.ts` (fonte única de cores)

### Conteúdo
- `PALETTE`: tokens base (golds, bg-base/surface/raised/overlay, text-primary/secondary/muted/faint, borders) com os valores atuais do `:root`.
- `CARD_TYPE_THEME: Record<CardType, CardTypeStyle>` — fonte única para `bg`, `border`, `glow`, `label`, `topColor`, `headerBg`, `nameShadow`. Reconcilia as 3 definições divergentes escolhendo a variante mais rica (a de App.tsx:8357) e corrigindo contrastes ruins.
- `DAMAGE_TYPE_THEME`: consolida `DAMAGE_TYPES` (App.tsx:777).
- `PIN_COLORS`: movido de App.tsx:1977.
- `injectThemeVars()`: escreve as CSS vars no `document.documentElement.style` a partir do `PALETTE` no boot, garantindo que CSS estático e lógica TS usem os mesmos valores (sem drift).

### Mudanças no consumo
- `index.tsx` chama `injectThemeVars()` antes do render.
- Os 3 blocos `typeConfig` inline passam a usar `CARD_TYPE_THEME`.
- `DAMAGE_TYPES` e `PIN_COLORS` re-exportados de `theme.ts` (mantendo nomes para não quebrar imports).

### Escopo do sweep
Alvo dirigido, **não** find-replace cego nas 12k linhas: consolidar os mapas estruturados (card types, damage types, pin colors) + corrigir as divergências/contrastes. Substituição massiva de cada rgba inline fica como melhoria incremental futura.

## Parte 2 — Store compartilhável + janela-espelho

### Broadcast no `DatabaseService`
- Novo `BroadcastChannel('vat-combat')`.
- App principal (master) publica `{ type: 'combat', data: CombatState }` a cada mudança do snapshot de combate.
- Ao abrir, o espelho envia `{ type: 'request' }`; o master responde com o snapshot atual (cobre abrir o espelho depois do combate montado).
- Espelho é read-only: só escuta, nunca publica. Papel definido pela URL (`?view=player`). Sem loop de feedback.
- API nova: `publishCombat(data)` (chamado pelo master junto das atualizações) e `subscribeRemoteCombat(cb)` (consumido pelo espelho).

### Entry point
- `index.tsx` checa `new URLSearchParams(location.search).get('view') === 'player'`:
  - `'player'` → renderiza `<PlayerMirror/>`.
  - caso contrário → `<App/>` (master).

### Componente `PlayerMirror`
- Mínimo e read-only. Assina `subscribeRemoteCombat` e dispara `{type:'request'}` ao montar.
- **Só renderiza o grid quando `combat.isActive === true`**; caso contrário mostra tela de espera ("Aguardando o início do combate...").
- Renderiza: fundo do cenário (`backgroundImage`), grid, tokens e barras de HP.
- **Filtro de sigilo:**
  - Combatentes com `isHidden` são omitidos.
  - HP numérico só aparece para `role === 'cast'` (personagens dos jogadores). Para `npc` (inimigos) mostra apenas a barra, sem números.
  - Condições/cartas marcadas `isHidden` não aparecem.

### Botão na aba de combate
- "Abrir janela de jogadores" → `window.open('?view=player', 'vat-player', 'popup,width=1280,height=800')`.

## Fluxo de dados

```
[Master App] --updateCombat--> setCombat + DatabaseService.publishCombat
                                          |
                                   BroadcastChannel('vat-combat')
                                          |
[PlayerMirror] <--subscribeRemoteCombat-- (filtra sigilo) --> render grid read-only
       |
       '--(ao montar) postMessage {type:'request'} --> Master responde snapshot atual
```

## Tratamento de erros / edge cases
- `BroadcastChannel` indisponível (browsers muito antigos): degradar graciosamente — botão de janela ainda abre, mas espelho mostra aviso de incompatibilidade. (Suportado em todos os browsers-alvo modernos.)
- Espelho aberto sem combate ativo: tela de espera.
- Master fechado com espelho aberto: espelho mantém último snapshot; sem crash.
- Múltiplos espelhos: todos recebem o mesmo broadcast (ok).

## Verificação
- `npm run build` + typecheck do TypeScript devem passar.
- Sem testes de browser automatizados (preferência do usuário). Checagem visual manual pelo usuário: abrir app, iniciar combate, abrir janela de jogadores, confirmar sincronização e filtro de sigilo.

## Componentes/arquivos afetados
- Novo: `utils/theme.ts`, componente `PlayerMirror` (arquivo próprio, ex: `components/PlayerMirror.tsx`).
- Editado: `index.tsx`, `index.html` (CSS vars podem ser reduzidas/derivadas), `utils/database.ts`, `App.tsx` (substituir typeConfig + botão de janela + chamar publishCombat).
