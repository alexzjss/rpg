# Fundação: Paleta + Store de Combate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralizar as cores do app numa fonte única tipada e adicionar uma camada de broadcast do estado de combate entre janelas, com uma janela-espelho read-only mínima.

**Architecture:** Um módulo `utils/theme.ts` vira a fonte única de cores (injetando CSS vars no boot). O `DatabaseService` ganha um `BroadcastChannel` que publica o snapshot de combate sempre que ele é salvo; uma rota `?view=player` no `index.tsx` renderiza um `PlayerMirror` read-only que assina esse canal.

**Tech Stack:** React 19, TypeScript, Vite, BroadcastChannel API, IndexedDB (já existente).

> **Restrições deste projeto:** (1) **Não há repositório git** — onde o template pediria "commit", fazemos um *checkpoint de verificação* via build. (2) **Não há framework de teste** — verificação é `npm run build` (typecheck do tsc + bundle do Vite) + checagem visual manual pelo usuário. Funções puras ficam exportadas e isoladas para facilitar teste futuro, mas não introduzimos test runner nesta passada.

> **Comando de verificação padrão:** `npm run build`
> **Esperado:** termina sem erros de TypeScript e gera `dist/` com sucesso (`✓ built in ...`).

---

## Estrutura de arquivos

- **Criar** `utils/theme.ts` — fonte única de paleta, temas de tipo de carta, tipos de dano, cores de pin, injeção de CSS vars.
- **Criar** `components/PlayerMirror.tsx` — componente read-only que espelha o grid de combate.
- **Modificar** `index.tsx` — chamar `injectThemeVars()`; ramificar render em `?view=player`.
- **Modificar** `utils/database.ts` — ponte `BroadcastChannel` (`publishCombat`, `subscribeRemoteCombat`) acoplada em `updateCombat` e `saveFullSnapshot`.
- **Modificar** `App.tsx` — substituir os 3 `typeConfig` inline + `DAMAGE_TYPES` + `PIN_COLORS` por imports de `theme.ts`; adicionar botão "Abrir janela de jogadores".

---

## Task 1: Criar `utils/theme.ts`

**Files:**
- Create: `utils/theme.ts`

- [ ] **Step 1: Escrever o módulo de tema**

Criar `utils/theme.ts` com este conteúdo exato:

```ts
import { CardType, DamageType } from '../types';

// ─────────────────────────────────────────────────────────────────
// PALETTE — fonte única dos tokens base (espelha o :root do index.html)
// ─────────────────────────────────────────────────────────────────
export const PALETTE = {
  bgBase:    '#0f1117',
  bgSurface: '#161b26',
  bgRaised:  '#1c2234',
  bgOverlay: '#222840',
  goldDim:   '#7a5e1a',
  goldMid:   '#c9983a',
  goldBright:'#f0c060',
  goldPale:  '#fdf0cc',
  textPrimary:   '#eef2ff',
  textSecondary: '#9aabcc',
  textMuted:     '#4e5f7a',
  textFaint:     '#2e3849',
  borderFaint: 'rgba(255,255,255,0.07)',
  borderMid:   'rgba(255,255,255,0.12)',
  borderGold:  'rgba(201,152,58,0.30)',
} as const;

// Mapa token -> CSS var name (mantém os nomes já usados no index.html)
const CSS_VAR_MAP: Record<keyof typeof PALETTE, string> = {
  bgBase: '--bg-base', bgSurface: '--bg-surface', bgRaised: '--bg-raised', bgOverlay: '--bg-overlay',
  goldDim: '--gold-dim', goldMid: '--gold-mid', goldBright: '--gold-bright', goldPale: '--gold-pale',
  textPrimary: '--text-primary', textSecondary: '--text-secondary', textMuted: '--text-muted', textFaint: '--text-faint',
  borderFaint: '--border-faint', borderMid: '--border-mid', borderGold: '--border-gold',
};

/** Injeta as CSS vars no :root a partir do PALETTE (chamada no boot). */
export function injectThemeVars(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  (Object.keys(PALETTE) as (keyof typeof PALETTE)[]).forEach(k => {
    root.style.setProperty(CSS_VAR_MAP[k], PALETTE[k]);
  });
}

// ─────────────────────────────────────────────────────────────────
// CARD_TYPE_THEME — fonte única (substitui as 3 defs divergentes em App.tsx)
// ─────────────────────────────────────────────────────────────────
export interface CardTypeStyle {
  bg: string;
  border: string;
  glow: string;
  label: string;
  topColor: string;
  headerBg: string;
  nameShadow: string;
}

export const CARD_TYPE_THEME: Record<CardType, CardTypeStyle> = {
  'ataque':     { bg:'linear-gradient(165deg,rgba(45,15,15,0.97) 0%,rgba(55,18,18,0.95) 100%)', border:'rgba(239,68,68,0.7)',  glow:'rgba(239,68,68,0.85)',  label:'ATK', topColor:'#ef4444', headerBg:'rgba(239,68,68,0.15)',  nameShadow:'0 0 20px rgba(239,68,68,0.7)' },
  'ação':       { bg:'linear-gradient(165deg,rgba(40,30,5,0.97) 0%,rgba(60,45,5,0.95) 100%)',   border:'rgba(234,179,8,0.7)',  glow:'rgba(234,179,8,0.85)',  label:'AÇÃ', topColor:'#eab308', headerBg:'rgba(234,179,8,0.15)',  nameShadow:'0 0 20px rgba(234,179,8,0.7)' },
  'reação':     { bg:'linear-gradient(165deg,rgba(5,15,40,0.97) 0%,rgba(8,22,55,0.95) 100%)',   border:'rgba(59,130,246,0.7)', glow:'rgba(59,130,246,0.85)', label:'REA', topColor:'#3b82f6', headerBg:'rgba(59,130,246,0.15)', nameShadow:'0 0 20px rgba(59,130,246,0.7)' },
  'reforço':    { bg:'linear-gradient(165deg,rgba(5,30,12,0.97) 0%,rgba(8,45,18,0.95) 100%)',   border:'rgba(34,197,94,0.7)',  glow:'rgba(34,197,94,0.85)',  label:'REF', topColor:'#22c55e', headerBg:'rgba(34,197,94,0.15)',  nameShadow:'0 0 20px rgba(34,197,94,0.7)' },
  'vínculo':    { bg:'linear-gradient(165deg,rgba(20,22,28,0.97) 0%,rgba(30,32,40,0.95) 100%)', border:'rgba(148,163,184,0.7)',glow:'rgba(148,163,184,0.85)',label:'VÍN', topColor:'#94a3b8', headerBg:'rgba(148,163,184,0.15)',nameShadow:'0 0 20px rgba(148,163,184,0.7)' },
  'combinação': { bg:'linear-gradient(165deg,rgba(40,5,60,0.97) 0%,rgba(55,8,80,0.95) 100%)',   border:'rgba(168,85,247,0.9)', glow:'rgba(168,85,247,1)',    label:'CMB', topColor:'#c084fc', headerBg:'rgba(192,132,252,0.18)',nameShadow:'0 0 20px rgba(192,132,252,0.9)' },
  'forma':      { bg:'linear-gradient(165deg,rgba(40,25,0,0.97) 0%,rgba(60,38,0,0.95) 100%)',   border:'rgba(245,158,11,0.8)', glow:'rgba(245,158,11,0.9)',  label:'FRM', topColor:'#f59e0b', headerBg:'rgba(245,158,11,0.15)', nameShadow:'0 0 20px rgba(245,158,11,0.8)' },
};

// ─────────────────────────────────────────────────────────────────
// DAMAGE_TYPES — movido de App.tsx (fonte única)
// ─────────────────────────────────────────────────────────────────
export const DAMAGE_TYPES: { value: DamageType; label: string; color: string; emoji: string }[] = [
  { value: 'normal',    label: 'Normal',    color: '#94a3b8', emoji: '⚔️' },
  { value: 'fogo',      label: 'Fogo',      color: '#ef4444', emoji: '🔥' },
  { value: 'raio',      label: 'Raio',      color: '#facc15', emoji: '⚡' },
  { value: 'água',      label: 'Água',      color: '#38bdf8', emoji: '💧' },
  { value: 'terra',     label: 'Terra',     color: '#92400e', emoji: '🪨' },
  { value: 'vento',     label: 'Vento',     color: '#86efac', emoji: '🍃' },
  { value: 'escuridão', label: 'Escuridão', color: '#7c3aed', emoji: '🌑' },
  { value: 'luminoso',  label: 'Luminoso',  color: '#fde68a', emoji: '✨' },
  { value: 'sangue',    label: 'Sangue',    color: '#dc2626', emoji: '🩸' },
  { value: 'aura',      label: 'Aura',      color: '#67e8f9', emoji: '💠' },
];

// ─────────────────────────────────────────────────────────────────
// PIN_COLORS — movido de App.tsx
// ─────────────────────────────────────────────────────────────────
export const PIN_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ec4899','#ffffff'];
```

- [ ] **Step 2: Checkpoint de verificação**

Run: `npm run build`
Expected: build conclui sem erros (o módulo novo ainda não é importado por ninguém; só validamos que compila).

---

## Task 2: Injetar CSS vars no boot

**Files:**
- Modify: `index.tsx`

- [ ] **Step 1: Importar e chamar `injectThemeVars`**

Em `index.tsx`, adicionar o import no topo (depois dos imports existentes de React/ReactDOM/App):

```tsx
import { injectThemeVars } from './utils/theme';
```

E chamar antes de criar o root (logo após a checagem do `rootElement`):

```tsx
injectThemeVars();

const root = ReactDOM.createRoot(rootElement);
```

- [ ] **Step 2: Checkpoint de verificação**

Run: `npm run build`
Expected: build OK.
Verificação visual (usuário): `npm run dev`, abrir o app — as cores devem estar **idênticas** ao estado anterior (as vars injetadas têm os mesmos valores do `:root`).

---

## Task 3: Substituir `DAMAGE_TYPES` e `PIN_COLORS` por imports

**Files:**
- Modify: `App.tsx:777-788` (DAMAGE_TYPES), `App.tsx:1977` (PIN_COLORS)

- [ ] **Step 1: Remover a definição local de `DAMAGE_TYPES`**

Em `App.tsx`, localizar o bloco que começa em `const DAMAGE_TYPES: { value: DamageType; ...` (linha ~777) e termina em `];` (linha ~788) e **deletá-lo inteiro**.

- [ ] **Step 2: Remover a definição local de `PIN_COLORS`**

Localizar `const PIN_COLORS = ['#ef4444',...];` (linha ~1977) e **deletá-la**.

- [ ] **Step 3: Adicionar os imports a partir de `theme.ts`**

Localizar o import existente do CardReveal (`import CardRevealAnimation, { CardAnimPayload } from './components/CardRevealAnimation';`, linha ~97) e adicionar logo abaixo:

```tsx
import { DAMAGE_TYPES, PIN_COLORS, CARD_TYPE_THEME, type CardTypeStyle } from './utils/theme';
```

- [ ] **Step 4: Checkpoint de verificação**

Run: `npm run build`
Expected: build OK. Se o tsc reclamar de "Cannot redeclare block-scoped variable 'DAMAGE_TYPES'/'PIN_COLORS'", é porque uma das definições locais não foi removida — remover.

---

## Task 4: Substituir os 3 `typeConfig` inline por `CARD_TYPE_THEME`

**Files:**
- Modify: `App.tsx:8357-8364`, `App.tsx:9245-9251`, `App.tsx:10192-10198`

> Os 3 blocos têm formatos diferentes (o de 9245 e 10192 têm menos campos). `CARD_TYPE_THEME` é um superconjunto, então todos os usos continuam válidos. Confira após cada substituição se as propriedades acessadas (`.bg`, `.border`, `.glow`, `.label`, `.topColor`, `.headerBg`, `.nameShadow`, ou aliases) existem no tipo `CardTypeStyle`.

- [ ] **Step 1: Substituir o bloco em ~8357**

Localizar:

```tsx
const typeConfig: Record<string,{bg:string,border:string,glow:string,label:string,topColor:string,headerBg:string,nameShadow:string}> = {
  'ataque': {bg:'linear-gradient(165deg,rgba(45,15,15,0.97) 0%,rgba(55,18,18,0.95) 100%)',border:'rgba(239,68,68,0.7)',glow:'rgba(239,68,68,0.85)',label:'ATK',topColor:'#ef4444',headerBg:'rgba(239,68,68,0.15)',nameShadow:'0 0 20px rgba(239,68,68,0.7)'},
  ... (7 linhas, uma por tipo) ...
};
```

Substituir o objeto literal inteiro por:

```tsx
const typeConfig: Record<string, CardTypeStyle> = CARD_TYPE_THEME;
```

- [ ] **Step 2: Substituir o bloco em ~9245**

Localizar o `typeConfig` desta região (formato reduzido: `{bg,border,topColor,label}`) e substituir o objeto literal por:

```tsx
const typeConfig: Record<string, CardTypeStyle> = CARD_TYPE_THEME;
```

(Os campos extras de `CardTypeStyle` são ignorados pelos consumidores que só leem `bg/border/topColor/label`.)

- [ ] **Step 3: Substituir o bloco em ~10192**

Localizar o objeto desta região (formato `{border,glow,bg,label,btnBg,btnBorder,btnColor}`).

⚠️ Este bloco tem campos que **NÃO** existem em `CardTypeStyle` (`btnBg`, `btnBorder`, `btnColor`). NÃO substituir por `CARD_TYPE_THEME` direto. Em vez disso, derivar a partir dele:

```tsx
const typeConfig: Record<string, CardTypeStyle & { btnBg:string; btnBorder:string; btnColor:string }> = {
  ataque:     { ...CARD_TYPE_THEME['ataque'],     btnBg:'rgba(239,68,68,0.18)',  btnBorder:'rgba(239,68,68,0.7)',  btnColor:'#fca5a5' },
  reação:     { ...CARD_TYPE_THEME['reação'],     btnBg:'rgba(59,130,246,0.18)', btnBorder:'rgba(59,130,246,0.7)', btnColor:'#93c5fd' },
  ação:       { ...CARD_TYPE_THEME['ação'],       btnBg:'rgba(234,179,8,0.18)',  btnBorder:'rgba(234,179,8,0.7)',  btnColor:'#fde047' },
  reforço:    { ...CARD_TYPE_THEME['reforço'],    btnBg:'rgba(34,197,94,0.18)',  btnBorder:'rgba(34,197,94,0.7)',  btnColor:'#86efac' },
  vínculo:    { ...CARD_TYPE_THEME['vínculo'],    btnBg:'rgba(148,163,184,0.18)',btnBorder:'rgba(148,163,184,0.7)',btnColor:'#cbd5e1' },
  combinação: { ...CARD_TYPE_THEME['combinação'], btnBg:'rgba(168,85,247,0.18)', btnBorder:'rgba(168,85,247,0.7)', btnColor:'#d8b4fe' },
  forma:      { ...CARD_TYPE_THEME['forma'],      btnBg:'rgba(245,158,11,0.18)', btnBorder:'rgba(245,158,11,0.7)', btnColor:'#fcd34d' },
};
```

> Antes de escrever isto, abrir `App.tsx:10192` e copiar os valores reais de `btnBg/btnBorder/btnColor` de cada tipo que já existem ali — usar exatamente esses valores no spread acima, não os do exemplo, para não mudar a aparência dos botões.

- [ ] **Step 4: Checkpoint de verificação**

Run: `npm run build`
Expected: build OK, sem erros de propriedade ausente.
Verificação visual (usuário): abrir o app, abrir o painel de comando de combate (menu de cartas do combatente) — as cores por tipo de carta devem aparecer normalmente; agora vindas de uma fonte só.

---

## Task 5: Ponte BroadcastChannel no `DatabaseService`

**Files:**
- Modify: `utils/database.ts` (registrar canal perto do `_listeners`, ~218; acoplar publish em `updateCombat` ~363 e `saveFullSnapshot` ~382)

- [ ] **Step 1: Criar o canal e as funções de publish/subscribe**

Em `utils/database.ts`, logo após o bloco `_subscribe` (~linha 232), adicionar:

```ts
// ─────────────────────────────────────────────────────────────────
// Broadcast entre janelas (janela de jogadores)
// ─────────────────────────────────────────────────────────────────
const COMBAT_CHANNEL = 'vat-combat';
let _combatChannel: BroadcastChannel | null = null;
function _getCombatChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!_combatChannel) _combatChannel = new BroadcastChannel(COMBAT_CHANNEL);
  return _combatChannel;
}

/** Publica o snapshot de combate para outras janelas (chamado pelo master). */
function _publishCombat(state: CombatState) {
  _getCombatChannel()?.postMessage({ type: 'combat', data: state });
}
```

- [ ] **Step 2: Acoplar o publish em `updateCombat`**

Localizar (`utils/database.ts:363`):

```ts
  updateCombat: async (state: CombatState) => {
    await _put('meta', { id: '__combat', value: state });
    _notify('combat', state);
  },
```

Substituir por:

```ts
  updateCombat: async (state: CombatState) => {
    await _put('meta', { id: '__combat', value: state });
    _notify('combat', state);
    _publishCombat(state);
  },
```

- [ ] **Step 3: Acoplar o publish em `saveFullSnapshot`**

Localizar dentro de `saveFullSnapshot` a linha `_notify('combat', snapshot.combat);` (~391) e adicionar logo abaixo:

```ts
    _publishCombat(snapshot.combat);
```

- [ ] **Step 4: Expor a API pública no objeto `DatabaseService`**

Dentro do objeto `export const DatabaseService = { ... }`, adicionar (por exemplo logo após `updateExtras`, ~linha 374):

```ts
  /** Master: publica o estado atual sob demanda (resposta a um 'request' do espelho). */
  publishCombat: (state: CombatState) => _publishCombat(state),

  /** Espelho: assina os snapshots de combate vindos de outra janela. Retorna unsubscribe. */
  subscribeRemoteCombat: (cb: (state: CombatState) => void): (() => void) => {
    const ch = _getCombatChannel();
    if (!ch) return () => {};
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === 'combat') cb(ev.data.data as CombatState);
    };
    ch.addEventListener('message', handler);
    return () => ch.removeEventListener('message', handler);
  },

  /** Espelho: pede ao master o snapshot atual (responde com 'combat'). */
  requestCombat: () => _getCombatChannel()?.postMessage({ type: 'request' }),

  /** Master: escuta 'request' do espelho. Retorna unsubscribe. */
  onCombatRequest: (cb: () => void): (() => void) => {
    const ch = _getCombatChannel();
    if (!ch) return () => {};
    const handler = (ev: MessageEvent) => { if (ev.data?.type === 'request') cb(); };
    ch.addEventListener('message', handler);
    return () => ch.removeEventListener('message', handler);
  },
```

- [ ] **Step 5: Checkpoint de verificação**

Run: `npm run build`
Expected: build OK. (`CombatState` já é importado em database.ts; sem novos imports.)

---

## Task 6: Master responde a pedidos do espelho

**Files:**
- Modify: `App.tsx` (declaração de `combat` ~3552; `useEffect` de boot ~3764-3774)

- [ ] **Step 1: Adicionar um ref que sempre reflete o combat atual**

Logo após `const [combat, setCombat] = useState<CombatState | null>(null);` (~3552), adicionar:

```tsx
  const latestCombatRef = useRef<CombatState | null>(null);
```

E um efeito que o mantém sincronizado (junto dos outros efeitos do componente):

```tsx
  useEffect(() => { latestCombatRef.current = combat; }, [combat]);
```

> Verificar o import do React no topo de App.tsx (`import React, { ... } from 'react'`). Se `useRef` não estiver na lista de hooks importados, adicioná-lo.

- [ ] **Step 2: Registrar listener de `request` no master**

No `useEffect` que monta as subscriptions, depois de `const unsubJourney = ...` (~3769), adicionar:

```tsx
    // Responde a pedidos da janela de jogadores com o snapshot atual de combate
    const unsubReq = DatabaseService.onCombatRequest(() => {
      if (latestCombatRef.current) DatabaseService.publishCombat(latestCombatRef.current);
    });
```

- [ ] **Step 3: Incluir `unsubReq` no cleanup**

Na função de cleanup do `useEffect` (`return () => { cancelled = true; unsubChars(); ... unsubJourney(); };`, ~3771-3774), adicionar `unsubReq();`:

```tsx
    return () => {
      cancelled = true;
      unsubChars(); unsubCards(); unsubSeals(); unsubCombat(); unsubJourney(); unsubReq();
    };
```

- [ ] **Step 4: Checkpoint de verificação**

Run: `npm run build`
Expected: build OK.

---

## Task 7: Criar `components/PlayerMirror.tsx`

**Files:**
- Create: `components/PlayerMirror.tsx`

- [ ] **Step 1: Escrever o componente espelho read-only**

Criar `components/PlayerMirror.tsx` com este conteúdo:

```tsx
import React, { useEffect, useState } from 'react';
import { DatabaseService } from '../utils/database';
import { CombatState, Combatant } from '../types';

/** Aplica o filtro de sigilo da visão de jogador: remove combatentes ocultos. */
function visibleCombatants(combat: CombatState): Combatant[] {
  return combat.combatants.filter(c => !c.isHidden);
}

/** HP numérico só aparece para personagens dos jogadores (role 'cast'). */
function showsHpNumber(c: Combatant): boolean {
  return c.role === 'cast';
}

const PlayerMirror: React.FC = () => {
  const [combat, setCombat] = useState<CombatState | null>(null);

  useEffect(() => {
    const unsub = DatabaseService.subscribeRemoteCombat(setCombat);
    DatabaseService.requestCombat(); // pede o snapshot atual ao abrir
    return unsub;
  }, []);

  const active = combat?.isActive === true;

  if (!active) {
    return (
      <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)', color:'var(--text-secondary)', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', fontSize:14 }}>
        Aguardando o início do combate…
      </div>
    );
  }

  const gw = combat!.gridWidth || 10;
  const gh = combat!.gridHeight || 10;
  const combatants = visibleCombatants(combat!);

  return (
    <div style={{ position:'fixed', inset:0, background:'var(--bg-base)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, overflow:'hidden' }}>
      <div style={{
        position:'relative',
        width:'100%', maxWidth:1400, aspectRatio:`${gw}/${gh}`,
        backgroundImage: combat!.backgroundImage ? `url(${combat!.backgroundImage})` : 'none',
        backgroundColor: combat!.backgroundImage ? undefined : '#100e08',
        backgroundSize:'100% 100%', backgroundPosition:'center',
        borderRadius:16,
        boxShadow:'0 0 0 2px rgba(212,168,83,0.18), 0 0 60px rgba(0,0,0,0.9)',
        overflow:'hidden',
      }}>
        {/* Grid lines */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.1, backgroundImage:`linear-gradient(rgba(212,168,83,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.8) 1px, transparent 1px)`, backgroundSize:`${100/gw}% ${100/gh}%` }} />

        {/* Tokens */}
        {combatants.map(c => {
          const cw = 100/gw, ch = 100/gh;
          const hpPct = c.maxHp > 0 ? (c.currentHp/c.maxHp)*100 : 0;
          const isCurrent = combat!.combatants[combat!.turnIndex]?.combatId === c.combatId;
          const isDefeated = c.currentHp <= 0;
          return (
            <div key={c.combatId} style={{ position:'absolute', left:`${c.gridPos.x*cw}%`, top:`${c.gridPos.y*ch}%`, width:`${cw}%`, height:`${ch}%`, display:'flex', alignItems:'center', justifyContent:'center', transition:'left 0.38s cubic-bezier(0.22,1,0.36,1), top 0.38s cubic-bezier(0.22,1,0.36,1)' }}>
              <div style={{ position:'relative' }}>
                <div style={{ width:'min(7vw,56px)', height:'min(7vw,56px)', borderRadius:'50%', overflow:'hidden', border: isCurrent ? '3px solid #d4a853' : '2px solid rgba(255,255,255,0.15)', boxShadow: isCurrent ? '0 0 24px rgba(201,152,58,0.8)' : '0 4px 16px rgba(0,0,0,0.9)', background:'var(--bg-base)', filter: isDefeated ? 'grayscale(1) brightness(0.35)' : 'none' }}>
                  <img src={c.icon || undefined} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
                {/* HP bar */}
                <div style={{ position:'absolute', bottom:-5, left:'8%', right:'8%', height:3, background:'rgba(0,0,0,0.8)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:99, width:`${Math.max(0,hpPct)}%`, background: hpPct<=30?'#ef4444':hpPct<=60?'#f59e0b':'#22c55e', transition:'width 0.5s ease' }} />
                </div>
                {/* HP número — só para 'cast' */}
                {showsHpNumber(c) && !isDefeated && (
                  <div style={{ position:'absolute', top:-16, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', fontSize:9, fontWeight:700, color:'#86efac', textShadow:'0 1px 4px rgba(0,0,0,1)' }}>
                    {c.currentHp}/{c.maxHp}
                  </div>
                )}
                {/* Nome */}
                <div style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', fontSize:9, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color: isDefeated ? '#f87171' : 'rgba(255,255,255,0.55)', textShadow:'0 1px 5px rgba(0,0,0,1)' }}>
                  {isDefeated ? 'Derrotado' : c.name.split(' ')[0]}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerMirror;
```

- [ ] **Step 2: Checkpoint de verificação**

Run: `npm run build`
Expected: build OK. (Componente ainda não montado por ninguém; só validamos compilação.)

---

## Task 8: Ramificar `index.tsx` em `?view=player`

**Files:**
- Modify: `index.tsx`

- [ ] **Step 1: Importar `PlayerMirror` e escolher a raiz pela URL**

Substituir o conteúdo de `index.tsx` por:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import PlayerMirror from './components/PlayerMirror';
import { injectThemeVars } from './utils/theme';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

injectThemeVars();

const isPlayerView = new URLSearchParams(window.location.search).get('view') === 'player';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isPlayerView ? <PlayerMirror /> : <App />}
  </React.StrictMode>
);
```

> Isto absorve a mudança da Task 2 (a chamada `injectThemeVars()` já está aqui). Se a Task 2 já editou o arquivo, esta substituição completa apenas a consolida.

- [ ] **Step 2: Checkpoint de verificação**

Run: `npm run build`
Expected: build OK.

---

## Task 9: Botão "Abrir janela de jogadores"

**Files:**
- Modify: `App.tsx` (toolbar do grid de combate, ~7585-7598)

- [ ] **Step 1: Adicionar o botão na toolbar do grid**

Logo após o botão de fullscreen (`App.tsx:7588`, fim do `<button ...>Tela Cheia</button>`), adicionar:

```tsx
                {/* Botão: janela de jogadores */}
                <button onClick={() => window.open('?view=player', 'vat-player', 'popup,width=1280,height=800')} title="Abrir visão de jogadores em janela separada" style={{ position:'absolute', top:8, left:8, zIndex:40, background:'rgba(22,27,38,0.92)', border:'1px solid var(--border-gold)', borderRadius:9, padding:'6px 10px', color:'var(--gold-mid)', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }} className="hover:bg-amber-900/30 hover:text-amber-300 transition-colors">
                  <Users style={{width:11,height:11}}/> Jogadores
                </button>
```

> `Users` já é importado de `lucide-react` em App.tsx (usado no modo união). Confirmar; se não, adicionar ao import.

- [ ] **Step 2: Checkpoint de verificação end-to-end**

Run: `npm run build`
Expected: build OK.

Verificação visual (usuário) — roteiro:
1. `npm run dev`, abrir o app.
2. Ir na aba **Combate**, iniciar um combate com pelo menos um personagem `cast` e um `npc`.
3. Clicar em **Jogadores** (canto superior esquerdo do grid) → abre nova janela.
4. Confirmar: a janela mostra o grid com fundo, tokens nas mesmas posições, barras de HP. HP numérico aparece só nos `cast`. Combatentes `isHidden` não aparecem.
5. Mover um token / aplicar dano na janela principal → a janela de jogadores reflete em tempo real.
6. Fechar o combate (isActive=false) → janela mostra "Aguardando o início do combate…".

---

## Notas de verificação final

- Sem git: nenhum commit; cada "checkpoint" é um `npm run build` verde.
- Sem test runner: as funções puras `visibleCombatants` e `showsHpNumber` (em PlayerMirror) e `injectThemeVars` (em theme.ts) ficam isoladas e exportáveis caso se adicione Vitest no futuro.
- A substituição de cores foi dirigida (mapas estruturados), não um find-replace global — coerente com a decisão "Aproveitar e refinar" sem redesign.
