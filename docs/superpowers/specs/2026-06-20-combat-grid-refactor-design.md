# Refatoração Completa da Grid de Combate

**Data:** 2026-06-20  
**Status:** Spec aprovado — aguardando plano de implementação  
**Contexto:** Refatoração total do sistema visual e mecânico da grid de combate. Remove todo o código de grid do `App.tsx`, extrai componentes limpos, substitui o sistema de células por posicionamento livre, e adiciona mecânicas táticas novas (alcance de movimento, AoE, régua, névoa de guerra, badges de condição).

---

## Decisões do brainstorming (2026-06-20)

1. **Motivação:** visual/estética, movimentação ruim, faltam mecânicas, código bagunçado — refatorar tudo.
2. **Estrutura da grid:** posicionamento livre por coordenadas percentuais (0–100% da arena). Sem células obrigatórias.
3. **Grade visual:** toggle opcional pelo mestre. Parâmetro `gridDensity` controla espaçamento. Default: ligada, sutil.
4. **Movimentação:** arrastar com alcance. Círculo de alcance em SVG ao redor do token durante o drag; verde → âmbar → vermelho conforme se aproxima/excede o limite.
5. **Deslocamento:** vem da ficha do personagem (novo campo `deslocamento?: number` em `Character`). Convertido pra `%` de arena usando `escala` do `CombatState`.
6. **Tokens:** retrato circular "aterrado" — sombra elíptica no chão, moldura por time (dourado cast / carmesim npc), anéis redesenhados.
7. **Novas mecânicas:** régua de distância, templates de AoE (círculo/cone/linha), névoa de guerra, badges de condição.
8. **Janela de jogadores (`PlayerMirror`):** paridade total. Reutiliza `CombatArena` em modo `readOnly` com névoa aplicada.
9. **Manter:** uniões (redesenhadas), imagem de cenário, botão de tela cheia.
10. **Remover:** `gridWidth/gridHeight/visualWidthPct/visualHeightPx/maintainAspectRatio`, `customPins`, toggle de coordenadas, lógica de grid em `App.tsx`.
11. **Camada geométrica:** híbrido DOM + SVG. Tokens em DOM absoluto (css `%`); grade, alcance, AoE, régua e fog mask em camada SVG sobreposta.

---

## Modelo de dados

### `Character` — novo campo

```ts
deslocamento?: number; // unidades de movimento (padrão: 6 se não definido)
```

### `Combatant` — mudança de campo

```ts
// ANTES:
gridPos: { x: number; y: number }; // índice de célula

// DEPOIS:
pos: { x: number; y: number }; // porcentagem da arena (0–100)
```

### `CombatState` — campos removidos

```ts
// REMOVIDOS:
gridWidth: number;
gridHeight: number;
visualWidthPct: number;
visualHeightPx: number;
maintainAspectRatio: boolean;
customPins?: CustomPin[];
```

### `CombatState` — campos adicionados

```ts
gridVisible: boolean;      // toggle da grade visual (default: true)
gridDensity: number;       // células por eixo para grade visual (default: 10)
escala: number;            // % de arena width por unidade de deslocamento (default: 10)
fog?: FogState;
aoeTemplates?: AoETemplate[];
```

### Novos tipos

```ts
export interface FogState {
  density: number;           // resolução interna da névoa (ex: 20 → grade 20×20)
  revealed: boolean[][];     // [row][col] = true se revelado ao jogador
}

export type AoEShape = 'circle' | 'cone' | 'line';

export interface AoETemplate {
  id: string;
  shape: AoEShape;
  color: string;             // hex, ex: '#ef444466'
  label?: string;
  // posição origem (%)
  x: number;
  y: number;
  // circle
  radius?: number;           // % de arena width
  // cone
  angle?: number;            // direção em graus (0 = direita)
  arc?: number;              // abertura em graus (ex: 60)
  length?: number;           // comprimento (%) — cone e linha
  // line
  width?: number;            // largura (%)
  visibleToPlayers: boolean; // se aparece no PlayerMirror
}
```

### Tipo removido

```ts
// DELETE:
export interface CustomPin { ... }
```

### Migration de estado salvo

Ao carregar `CombatState` persistido que ainda usa `gridPos`:

```ts
function migrateCombatState(old: any): CombatState {
  const gw = old.gridWidth || 10;
  const gh = old.gridHeight || 10;
  return {
    ...old,
    gridVisible: true,
    gridDensity: gw,
    escala: 10,
    combatants: old.combatants.map((c: any) => ({
      ...c,
      pos: c.pos ?? {
        x: ((c.gridPos?.x ?? 0) / gw) * 100,
        y: ((c.gridPos?.y ?? 0) / gh) * 100,
      },
    })),
  };
}
```

---

## Arquitetura de componentes

```
components/combat/grid/
├── CombatArena.tsx           ← raiz: orquestra arena; App.tsx não renderiza mais nada da grid
│   Props: combat, currentActor, mode ('master'|'readOnly'), callbacks
├── GridSVGLayer.tsx          ← camada SVG sobreposta (pointerEvents: none por default)
│   ├── <GridLines>           ← linhas da grade (só se gridVisible)
│   ├── <MovementRange>       ← círculo de alcance do token sendo arrastado
│   ├── <AoETemplateLayer>    ← shapes de área (circle/cone/line)
│   ├── <RulerTool>           ← linha de medição + badge de distância
│   └── <FogMask>             ← <mask> SVG que oculta áreas não reveladas
├── CombatToken.tsx           ← token individual: DOM absoluto pos left/top em %
│   ├── <TokenBase>           ← sombra elíptica de chão (por time)
│   ├── <TokenRing>           ← anéis de turno/seleção/forma/união
│   ├── <ConditionBadges>     ← ícones de condição em semicírculo abaixo do retrato
│   └── <StatPopups>          ← números flutuantes HP/aura
├── FogRevealOverlay.tsx      ← grid clicável para o mestre revelar/ocultar névoa
│   (mode === 'master' only)
└── ArenaToolbar.tsx          ← botões flutuantes: fullscreen, cenário, grade, AoE, régua, névoa
    (mode === 'master' only)
```

**Regras de responsabilidade:**
- `CombatArena` mantém UI state (drag, toolbar mode, hover, régua) em hooks locais. Lógica de domínio (dano, turno, forma) permanece em `App.tsx` e chega por callback.
- `GridSVGLayer` é stateless; recebe tudo por props. `pointerEvents: none` exceto nas ferramentas ativas (régua, AoE drag).
- `CombatToken` é stateless; recebe `combatant`, flags de estado (isCurrent, isSelected, etc.) e callbacks de interação.
- `PlayerMirror` passa `mode="readOnly"` para `CombatArena`; sem toolbar nem overlays de edição.

---

## Posicionamento livre

**Coordenadas:** `pos: {x, y}` em `%` do contêiner da arena (0–100). Token centralizado com `transform: translate(-50%, -50%)`.

**Drag:**
1. `pointerdown` → captura ponteiro (`setPointerCapture`); registra `originPos`; exibe círculo de alcance em SVG
2. `pointermove` → calcula `Δpx` em relação à arena; converte para `Δ%`; move token via CSS `transform` sem atualizar estado (performance)
3. Exibe linha SVG `originPos → currentPos` + badge de distância percorrida em unidades
4. Círculo de alcance: verde se dentro, âmbar se > 80% do limite, vermelho se excedido
5. `pointerup` → confirma `pos` em `CombatState`; anima token na "aterrisagem" (scale bounce)

**Cálculo de alcance:**
```ts
// rangeRadius em % de arena width
const rangeRadiusPct = (c.deslocamento ?? 6) * (combat.escala ?? 10);

// distância percorrida em unidades
const distPx = Math.sqrt(dx*dx + dy*dy); // dx/dy em px
const unitSize = (combat.escala / 100) * arenaWidthPx;
const distUnits = distPx / unitSize;
```

**Uniões:** ao iniciar drag do líder, calcula `Δpos` no `pointerup` e aplica a todos os membros (mesma lógica atual, adaptada para `%`).

---

## Camada SVG (`GridSVGLayer`)

SVG absoluto com `inset: 0`, `width: 100%`, `height: 100%`, `viewBox: "0 0 100 100"`, `preserveAspectRatio: none`. Todas as coordenadas em unidades `0–100` (mapeadas 1:1 com `%`).

**`<GridLines>`:**
- `N = gridDensity` linhas horizontais e verticais a cada `100/N` unidades
- `stroke: rgba(212,168,83,0.08)`, `strokeWidth: 0.2`
- Renderiza só se `gridVisible === true`

**`<MovementRange>`:**
- `<circle cx={originPos.x} cy={originPos.y} r={rangeRadiusPct}>`
- `fill: none`, `stroke` muda de cor com a distância percorrida (verde/âmbar/vermelho)
- `strokeDasharray` para pontilhado elegante

**`<AoETemplateLayer>`:**
- Círculo: `<circle cx r>` com `fill` translúcido
- Cone: `<path>` via cálculo de arco SVG
- Linha: `<rect>` rotacionado ou `<line>` com `strokeWidth`
- Cada template draggável (handles de controle) no modo mestre

**`<RulerTool>`:**
- `<line>` + `<circle>` nas pontas + `<text>` centralizado com distância
- Ativo só enquanto toolbar mode = 'ruler'

**`<FogMask>`:**
- `<defs><mask id="fog-mask">` retângulo negro base + `<rect>` brancos por célula revelada
- `<rect width="100" height="100" fill="black" mask="url(#fog-mask)">` cobre toda a arena
- No modo mestre: overlay cinza semi-opaco nas células não reveladas (sem bloquear visão total)
- No modo readOnly (jogadores): mask completa, sem visão das áreas ocultas

---

## Templates de AoE

**Toolbar:** botões Circle / Cone / Line. Ao ativar um:
1. `pointerdown` na arena → define `x, y` de origem
2. `pointermove` → preview ao vivo do shape
3. `pointerup` → persiste em `combat.aoeTemplates`

**Cada template:** cor customizável (paleta de 6 cores), label opcional, toggle `visibleToPlayers`.

**Remoção:** clique-direito no template → confirmação inline ou botão de lixo na seleção.

---

## Régua de distância

- Modo ativado pelo toolbar (não persiste no `CombatState`)
- `pointerdown` → âncora A
- `pointermove` → âncora B flutua; SVG mostra linha + círculos nas pontas + badge central com `N unidades`
- `pointerup` → régua congela (descartável via Escape ou clique fora)
- Múltiplas réguas simultâneas suportadas (array em UI state local)

---

## Névoa de guerra

**Estrutura interna:** `fog.density` define uma grade de células de revelação (ex: 20×20), independente de `gridDensity`. Cada célula é `revealed: boolean`.

**SVG mask no `PlayerMirror`:** retângulo preto cobre tudo; cada célula `revealed === true` adiciona `<rect>` branco (furo), deixando o conteúdo visível através da máscara.

**Modo mestre:** vê cenário completo; células não reveladas aparecem cobertas por overlay cinza-escuro translúcido para indicar o que os jogadores não veem. Toolbar toggle para ligar/desligar a visualização do overlay.

**Pincel de revelação (mode mestre):**
- Toolbar mode `fog-reveal` ou `fog-hide`
- `pointerdown` + `pointermove` → revela/oculta células do `fog.revealed` sob o cursor
- Tamanho do pincel configurável (1, 2, 4 células)
- "Revelar tudo" e "Ocultar tudo" como ações rápidas

**Impacto no `PlayerMirror`:** combatentes em células não reveladas ficam ocultos mesmo que `!c.isHidden`.

---

## Tokens visuais

**Anatomia (de baixo pra cima):**

1. **`TokenBase`** — `div` elíptico, `border-radius: 50%`, `filter: blur(6px)`, `transform: scaleY(0.35)`, cor por time (dourado cast #c9983a / carmesim npc #dc2626), `opacity: 0.35`. Ancora visualmente o token no cenário.

2. **Retrato** — `img` circular, `border-radius: 50%`, borda 3px colorida:
   - Turno ativo: `#d4a853` (dourado) para cast, `#dc2626` (carmesim) para npc
   - Selecionado: `rgba(52,211,153,0.8)` (verde)
   - Forma ativa: cor da forma
   - Default: `rgba(255,255,255,0.12)`

3. **`TokenRing`** — anéis SVG ou `div` absolutamente posicionados:
   - Turno ativo: anel pulsante grande, cor por time
   - Selecionado: anel verde sólido
   - Forma: anel colorido + glow
   - União: anel da cor da união

4. **`ConditionBadges`** — ícones 12×12 em semicírculo imediatamente abaixo do retrato:
   - Até 4 ícones visíveis; "+N" se mais
   - `Condition` só tem `name` e `duration` — ícone determinado por lookup estático `conditionIconMap: Record<string, LucideIcon>` (mapeando nomes comuns como "atordoado", "sangrando", "envenenado" etc. a ícones Lucide). Condições sem entrada no mapa usam ícone genérico `AlertCircle`.
   - Tooltip no hover com nome completo + duração restante
   - Visíveis para jogadores (no PlayerMirror)

5. **Barra HP** — 3px, abaixo do retrato, colorida por tier:
   - > 60%: `#22c55e`
   - 30–60%: `#eab308`
   - < 30%: `#ef4444`

6. **Nome** — `text-shadow: 0 1px 5px rgba(0,0,0,1)` forte para legibilidade em qualquer cenário; substitui por "Derrotado" se HP ≤ 0

7. **Derrotado** — `filter: grayscale(1) brightness(0.35)` no retrato + `<Skull>` overlay + label pulsante

8. **`StatPopups`** — números flutuantes para dano/cura/aura (mantidos do sistema atual, extraídos)

---

## `PlayerMirror` refatorado

```tsx
// components/PlayerMirror.tsx
const PlayerMirror: React.FC = () => {
  const [combat, setCombat] = useState<CombatState | null>(null);
  // ...subscribe via DatabaseService

  return (
    <CombatArena
      combat={visibleCombatState(combat)}   // filtra isHidden + fog
      mode="readOnly"
      currentActor={null}
    />
  );
};
```

`visibleCombatState` aplica:
- Remove combatentes com `isHidden: true`
- Remove combatentes cuja `pos` cai em célula de névoa não revelada
- Filtra `aoeTemplates` para apenas `visibleToPlayers: true`

---

## Fases de implementação

| # | Fase | Entregável |
|---|------|-----------|
| 1 | Migration | `migrateCombatState()`, novos campos em `types.ts`, `deslocamento` na ficha |
| 2 | `CombatArena` + `CombatToken` | Visual aterrado + drag livre básico (sem alcance ainda) |
| 3 | `GridSVGLayer` | Grade toggle + `MovementRange` (círculo de alcance durante drag) |
| 4 | AoE + régua | `AoETemplateLayer`, `RulerTool`, toolbar modes |
| 5 | Névoa | `FogMask`, `FogRevealOverlay`, pincel de revelação |
| 6 | Badges de condição | `ConditionBadges` no token |
| 7 | `PlayerMirror` rebuild | Modo readOnly de `CombatArena`, paridade total |
| 8 | Limpeza | Remover código de grid antigo do `App.tsx` |

---

## Estado atual relevante (antes da refatoração)

- Grid renderizada em `App.tsx` entre ~L7060–L7470: arena, células interativas, tokens, pins, badge de tamanho
- Drag handlers: `handleGridDragStart`, `handleGridDragOverCell`, `handleGridDrop`, `handleGridDragEnd` (~L4714+)
- Handlers de click: `handleGridClick` (~L4646+) — seleção, placingPin, target select, union mode
- Estado UI de grid: `selectedCombatantId`, `gridDragCombatId`, `gridDragOverCell`, `gridHoverCell`, `gridSnapPreview`, `gridMoveHistory`, `gridFullscreen`, `showGridCoords`, `placingPin`, `unionMode`, `unionSelecting`
- `PlayerMirror.tsx`: ~89 linhas, usa `gridPos` diretamente — será reconstruído
- Baseline `tsc --noEmit`: 29 erros pré-existentes. Verificação deve comparar contra esse baseline
