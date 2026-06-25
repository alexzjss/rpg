import React from 'react';
import { createPortal } from 'react-dom';
import {
  Swords,
  Trash2,
  X,
  Zap,
  Search,
  Skull,
  Heart,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Pin,
} from 'lucide-react';
import type {
  Card,
  CombatState,
  Character,
  Combatant,
  Item,
  Seal,
  Weapon,
  StatPopup,
  CharacterStack,
  CardType,
} from '../types';
import { PRESET_CONDITIONS } from '../types';
import { CARD_TYPE_THEME, type CardTypeStyle as CardTypeStyleImport } from '../utils/theme';
import type { ActionCategory } from '../components/combat/ActionIconRail';
import TurnOrderPanel from '../components/combat/TurnOrderPanel';
import ContextCardList from '../components/combat/ContextCardList';
import CombatControlPanel from '../components/combat/CombatControlPanel';
import CombatArena from '../components/combat/grid/CombatArena';

export interface CombatTabProps {
  // Core combat state
  combat: CombatState;
  updateCombat: (c: CombatState) => void;

  // Data
  characters: Character[];
  cards: Card[];
  seals: Seal[];
  items: Item[];
  weapons: Weapon[];
  onActivateSeal: (seal: Seal, actorCombatId: string) => void;

  // Combatant selection
  selectedCombatantId: string | null;
  setSelectedCombatantId: (id: string | null) => void;

  // Current actor (derived in App.tsx: combat?.isActive && combat.combatants[combat.turnIndex])
  currentActor: Combatant | null;

  // Initiative strip (legacy — values are always false)
  showLegacyInitiativeStrip: boolean;
  initiativeStripHovered: boolean;
  setInitiativeStripHovered: (v: boolean) => void;
  initiativeStripPinned: boolean;
  setInitiativeStripPinned: React.Dispatch<React.SetStateAction<boolean>>;

  // Filtered combatants for initiative strip
  filteredCombatants: Combatant[];

  // Drag-reorder in initiative strip
  dragSrcIdx: number | null;
  setDragSrcIdx: (v: number | null) => void;
  dragOverIdx: number | null;
  setDragOverIdx: (v: number | null) => void;

  // Turn animation key
  turnChangeKey: number;
  turnFlashing: boolean;

  // Panel visibility (computed booleans in App.tsx)
  showLegacyBottomHud: boolean;
  showCombatLeftPanel: boolean;
  showCombatRightPanel: boolean;
  showCombatContextList: boolean;
  combatTargetingActive: boolean;

  // Panel open state (for collapse tab buttons)
  combatLeftPanelOpen: boolean;
  setCombatLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCombatRightPanelOpen: (v: boolean) => void;
  openCombatRightPanel: () => void;

  // Mass damage
  massDmgMode: 'damage' | 'heal';
  setMassDmgMode: (v: 'damage' | 'heal') => void;
  massDmgAmount: string;
  setMassDmgAmount: (v: string) => void;
  massDmgTargets: string[];
  setMassDmgTargets: React.Dispatch<React.SetStateAction<string[]>>;
  showMassDmgPanel: boolean;
  setShowMassDmgPanel: React.Dispatch<React.SetStateAction<boolean>>;
  applyMassDamage: () => void;

  // Union mode
  unionMode: boolean;
  setUnionMode: (v: boolean) => void;
  unionSelecting: string[];
  setUnionSelecting: React.Dispatch<React.SetStateAction<string[]>>;
  unionColor: string;
  setUnionColor: (v: string) => void;
  createUnion: () => void;
  breakUnion: (unionId: string) => void;

  // Targeting (card usage)
  selectingTargetFor: Card | null;
  setSelectingTargetFor: (v: Card | null) => void;
  itemTargetPickerItem: { actor: any; item: any } | null;
  setItemTargetPickerItem: (v: { actor: any; item: any } | null) => void;
  areaSelectedTargets: string[];
  setAreaSelectedTargets: React.Dispatch<React.SetStateAction<string[]>>;
  executeCardOnTarget: (card: Card, targetType: string, combatId: string) => void;
  handleUseItem: (actor: any, item: any, targetId?: string) => void;

  // Arena visual state
  statPopups: StatPopup[];
  impactTargetId: string | null;

  // Action selection (for ContextCardList / TurnOrderPanel)
  selectedAction: { combatId: string; category: ActionCategory } | null;
  setSelectedAction: React.Dispatch<React.SetStateAction<{ combatId: string; category: ActionCategory } | null>>;

  // Placing pin on arena
  placingPin: { label: string; color: string } | null;
  setPlacingPin: (v: { label: string; color: string } | null) => void;

  // Turn timer
  turnTimerEnabled: boolean;
  setTurnTimerEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  turnTimerSeconds: number;
  setTurnTimerSeconds: (v: number) => void;
  turnTimerRemaining: number;
  setTurnTimerRemaining: (v: number) => void;
  turnTimerRunning: boolean;
  setTurnTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;

  // Field conditions
  removeFieldCondition: (id: string) => void;
  updateFieldCondition: (id: string, newDuration: number) => void;

  // Combat actions
  startCombat: () => void;
  endTurnWithTimer: () => void;
  endCombat: () => void;
  adjustCombatantStat: (combatId: string, stat: 'hp' | 'aura' | 'ammo', delta: number) => void;
  setManagingConditionsCharId: (id: string | null) => void;
  setShowAddCombatantModal: (v: boolean) => void;
  setShowHistoryModal: (v: boolean) => void;
  handleInitiativeStripClick: (combatId: string) => void;
  initiateCardUsage: (card: Card) => void;

  // Quick roll
  combatQuickRoll: { sides: number; result: number; timestamp: number } | null;
  doQuickCombatRoll: (sides: number) => void;

  // Combat notes
  combatNotes: string;
  setCombatNotes: (v: string) => void;

  // Fusion
  setFusionSelectedCards: (v: Card[]) => void;
  setFusionActor: (v: any) => void;
  setFusionStep: (v: 'select' | 'rolling' | 'animating' | 'creating' | 'revealing' | null) => void;

  // Deck modal
  showDeckModal: boolean;
  setShowDeckModal: (v: boolean) => void;
  deckSearchTerm: string;
  setDeckSearchTerm: (v: string) => void;
  deckTypeFilter: CardType | 'all';
  setDeckTypeFilter: (v: CardType | 'all') => void;
}

const CombatTab: React.FC<CombatTabProps> = ({
  combat,
  updateCombat,
  characters,
  cards,
  seals,
  items,
  weapons,
  onActivateSeal,
  selectedCombatantId,
  setSelectedCombatantId,
  currentActor,
  showLegacyInitiativeStrip,
  initiativeStripHovered,
  setInitiativeStripHovered,
  initiativeStripPinned,
  setInitiativeStripPinned,
  filteredCombatants,
  dragSrcIdx,
  setDragSrcIdx,
  dragOverIdx,
  setDragOverIdx,
  turnChangeKey,
  turnFlashing,
  showLegacyBottomHud,
  showCombatLeftPanel,
  showCombatRightPanel,
  showCombatContextList,
  combatTargetingActive,
  combatLeftPanelOpen,
  setCombatLeftPanelOpen,
  setCombatRightPanelOpen,
  openCombatRightPanel,
  massDmgMode,
  setMassDmgMode,
  massDmgAmount,
  setMassDmgAmount,
  massDmgTargets,
  setMassDmgTargets,
  showMassDmgPanel,
  setShowMassDmgPanel,
  applyMassDamage,
  unionMode,
  setUnionMode,
  unionSelecting,
  setUnionSelecting,
  unionColor,
  setUnionColor,
  createUnion,
  breakUnion,
  selectingTargetFor,
  setSelectingTargetFor,
  itemTargetPickerItem,
  setItemTargetPickerItem,
  areaSelectedTargets,
  setAreaSelectedTargets,
  executeCardOnTarget,
  handleUseItem,
  statPopups,
  impactTargetId,
  selectedAction,
  setSelectedAction,
  placingPin,
  setPlacingPin,
  turnTimerEnabled,
  setTurnTimerEnabled,
  turnTimerSeconds,
  setTurnTimerSeconds,
  turnTimerRemaining,
  setTurnTimerRemaining,
  turnTimerRunning,
  setTurnTimerRunning,
  removeFieldCondition,
  updateFieldCondition,
  startCombat,
  endTurnWithTimer,
  endCombat,
  adjustCombatantStat,
  setManagingConditionsCharId,
  setShowAddCombatantModal,
  setShowHistoryModal,
  handleInitiativeStripClick,
  initiateCardUsage,
  combatQuickRoll,
  doQuickCombatRoll,
  combatNotes,
  setCombatNotes,
  setFusionSelectedCards,
  setFusionActor,
  setFusionStep,
  showDeckModal,
  setShowDeckModal,
  deckSearchTerm,
  setDeckSearchTerm,
  deckTypeFilter,
  setDeckTypeFilter,
}) => {
  return (
    <>
      {/* ══ BLOCO PRINCIPAL DE COMBATE ══ */}
      <div className={`flex flex-col gap-0 anim-fade`} style={{ height: 'calc(100% + 2.5rem + 1.25rem)', marginTop: '-1.25rem', marginLeft: '-2rem', marginRight: '-2rem', overflow: 'hidden' }}>

        {/* ══ CENTRO: ARENA + SIDEBAR ══════════════════════════════════ */}
        <div className="flex-1 flex min-h-0" style={{ position:'relative' }}>

          {/* ══ FAIXA DE INICIATIVA — preservada, mas visualmente desligada na 6A ══ */}
          {showLegacyInitiativeStrip && (
          <div
            style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 60, pointerEvents: 'none' }}
            onMouseEnter={() => setInitiativeStripHovered(true)}
            onMouseLeave={() => setInitiativeStripHovered(false)}
          >
            {/* Thin hover-trigger line */}
            <div style={{ height: 8, pointerEvents: 'auto', cursor: 'pointer', position: 'relative' }}>
              {!initiativeStripPinned && !initiativeStripHovered && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 80, height: 3, borderRadius: 99, background: 'rgba(201,152,58,0.5)', boxShadow: '0 0 8px rgba(201,152,58,0.4)' }} />
                </div>
              )}
            </div>

            {/* Floating cards strip — visible when hovered or pinned */}
            {(initiativeStripPinned || initiativeStripHovered) && (
              <div
                style={{
                  padding: '6px 18px 10px',
                  background: 'transparent',
                  position: 'relative',
                  pointerEvents: 'auto',
                }}
                onClick={() => setInitiativeStripPinned(v => !v)}
              >
                {/* Pin indicator */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: initiativeStripPinned ? 'var(--gold-mid)' : 'var(--text-faint)', background: initiativeStripPinned ? 'rgba(201,152,58,0.25)' : 'rgba(0,0,0,0.55)', border: `1px solid ${initiativeStripPinned ? 'rgba(201,152,58,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 99, padding: '2px 12px', backdropFilter: 'blur(8px)' }}>
                    {initiativeStripPinned ? '📌 Fixado — clique para soltar' : '🖱 Ordem de Iniciativa · clique para fixar'}
                  </div>
                </div>
                {/* — Combatant cards strip — */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar items-stretch py-0.5" style={{ scrollSnapType: 'x mandatory' }}
                  onDragOver={e => e.preventDefault()}
                  onClick={e => e.stopPropagation()}
                  onDrop={() => {
                    if (dragSrcIdx === null || dragOverIdx === null || dragSrcIdx === dragOverIdx) {
                      setDragSrcIdx(null); setDragOverIdx(null); return;
                    }
                    const newCombatants = [...combat.combatants];
                    const srcCombatant = newCombatants.splice(dragSrcIdx, 1)[0];
                    newCombatants.splice(dragOverIdx, 0, srcCombatant);
                    const currentActorId = combat.combatants[combat.turnIndex]?.combatId;
                    const newTurnIndex = newCombatants.findIndex(c => c.combatId === currentActorId);
                    updateCombat({ ...combat, combatants: newCombatants, turnIndex: newTurnIndex >= 0 ? newTurnIndex : 0 });
                    setDragSrcIdx(null); setDragOverIdx(null);
                  }}
                >
                  {filteredCombatants.length === 0 && (
                    <div className="flex items-center" style={{ color: 'var(--text-faint)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', padding: '8px 4px' }}>Nenhum combatente</div>
                  )}
                  {filteredCombatants.map((c) => {
                    const realIdx = combat.combatants.findIndex(cb => cb.combatId === c.combatId);
                    const isTurn = realIdx === combat.turnIndex && combat.isActive;
                    const isSelected = selectedCombatantId === c.combatId;
                    const isDefeated = c.currentHp <= 0;
                    const hpPct = Math.max(0, c.maxHp > 0 ? (c.currentHp / c.maxHp) * 100 : 0);
                    const auraPct = Math.max(0, c.maxAura > 0 ? (c.currentAura / c.maxAura) * 100 : 0);
                    const isDanger = hpPct > 0 && hpPct <= 30;
                    const isUnionModeSelected = unionMode && unionSelecting.includes(c.combatId);
                    const isMassDmgTarget = massDmgTargets.includes(c.combatId);
                    const activeForma = (combat.activeForms || []).find(f => f.combatantId === c.combatId);
                    const formaIcon = activeForma?.iconOverride || null;
                    const formaColor = activeForma?.color || null;
                    return (
                      <div key={isTurn ? `turn-${c.combatId}-${turnChangeKey}` : c.combatId} draggable
                        onDragStart={() => { setDragSrcIdx(realIdx); setDragOverIdx(realIdx); }}
                        onDragEnter={() => setDragOverIdx(realIdx)}
                        onDragEnd={() => { setDragSrcIdx(null); setDragOverIdx(null); }}
                        onClick={() => {
                          if (showMassDmgPanel) setMassDmgTargets(prev => prev.includes(c.combatId) ? prev.filter(id => id !== c.combatId) : [...prev, c.combatId]);
                          else handleInitiativeStripClick(c.combatId);
                        }}
                        style={{
                          flexShrink: 0, scrollSnapAlign: 'start',
                          width: isTurn ? 196 : 152,
                          transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.15s',
                          position: 'relative', cursor: 'grab',
                          opacity: dragSrcIdx === realIdx ? 0.4 : 1,
                          transform: dragOverIdx === realIdx && dragSrcIdx !== null && dragSrcIdx !== realIdx
                            ? (dragSrcIdx < realIdx ? 'translateX(6px)' : 'translateX(-6px)') : 'none',
                          animation: isTurn ? 'turnCardPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' : undefined,
                        }}>
                        <div style={{
                          height: '100%', borderRadius: 12, padding: '8px 10px 9px',
                          backdropFilter: 'blur(16px)',
                          background: isMassDmgTarget
                            ? (massDmgMode === 'damage' ? 'linear-gradient(145deg,rgba(239,68,68,0.55),rgba(120,10,10,0.75))' : 'linear-gradient(145deg,rgba(34,197,94,0.5),rgba(10,80,20,0.65))')
                            : isUnionModeSelected ? 'linear-gradient(145deg,rgba(168,85,247,0.55),rgba(100,30,180,0.75))'
                            : selectingTargetFor ? 'linear-gradient(145deg,rgba(239,68,68,0.5),rgba(120,10,10,0.65))'
                            : isTurn ? 'linear-gradient(145deg,rgba(130,100,25,0.85),rgba(80,60,15,0.95))'
                            : isSelected ? 'rgba(22,27,38,0.9)' : isDefeated ? 'rgba(15,18,24,0.85)' : 'rgba(22,27,38,0.85)',
                          border: isMassDmgTarget ? `1.5px solid ${massDmgMode==='damage'?'rgba(239,68,68,0.7)':'rgba(34,197,94,0.7)'}`
                            : isUnionModeSelected ? '1.5px solid rgba(168,85,247,0.8)'
                            : selectingTargetFor ? '1.5px solid rgba(239,68,68,0.6)'
                            : isTurn ? '1.5px solid rgba(212,168,83,0.75)'
                            : isSelected ? '1.5px solid rgba(212,168,83,0.4)'
                            : '1px solid rgba(255,255,255,0.1)',
                          boxShadow: isTurn ? '0 4px 24px rgba(201,152,58,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' : '0 2px 12px rgba(0,0,0,0.5)',
                          filter: isDefeated ? 'grayscale(0.8) opacity(0.5)' : 'none',
                          overflow: 'hidden', position: 'relative',
                          transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                        }}>
                          {isTurn && <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 40% 0%, rgba(212,168,83,0.18) 0%, transparent 65%)', pointerEvents:'none' }} />}
                          {isTurn && <div style={{ position:'absolute', top:0, left:0, right:0, height:2.5, background:'linear-gradient(90deg,transparent,#c9983a,#f0c060,#c9983a,transparent)' }} />}
                          {dragSrcIdx === null && <div style={{ position:'absolute', top:5, left:'50%', transform:'translateX(-50%)', display:'flex', gap:2.5, pointerEvents:'none', opacity:0.2 }}>{[0,1,2].map(i=><div key={i} style={{width:3,height:3,borderRadius:'50%',background:'white'}}/>)}</div>}
                          {dragOverIdx === realIdx && dragSrcIdx !== null && dragSrcIdx !== realIdx && <div style={{ position:'absolute', inset:0, borderRadius:12, border:'2px dashed rgba(212,168,83,0.9)', pointerEvents:'none', zIndex:10 }} />}
                          <div style={{ position:'absolute', top:6, right:7, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color: isTurn ? '#d4a853' : 'var(--text-faint)' }}>{c.initiativeResult}</div>
                          <div className="flex items-center gap-2 mb-2">
                            <div style={{ position:'relative', flexShrink:0 }}>
                              <div style={{ width:38, height:38, borderRadius:10, overflow:'hidden', border: formaColor ? `2px solid ${formaColor}` : isTurn ? '2px solid rgba(212,168,83,0.85)' : hpPct>0&&hpPct<=30 ? '2px solid rgba(239,68,68,0.9)' : '2px solid rgba(255,255,255,0.15)', boxShadow: isTurn ? '0 0 12px rgba(201,152,58,0.7)' : hpPct>0&&hpPct<=30 ? '0 0 12px rgba(239,68,68,0.8)' : 'none' }}>
                                <img src={(formaIcon||c.icon)||undefined} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                              </div>
                              {isTurn && <div style={{ position:'absolute', bottom:-3, right:-3, width:12, height:12, background:'#c9983a', borderRadius:'50%', border:'2px solid rgba(22,27,38,0.99)', display:'flex', alignItems:'center', justifyContent:'center' }}><Swords style={{width:6,height:6,color:'white'}}/></div>}
                              {isDefeated && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}><Skull style={{width:14,height:14,color:'#f87171'}}/></div>}
                            </div>
                            <div style={{ minWidth:0, flex:1, paddingRight:14 }}>
                              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: formaColor ? formaColor : isTurn?'#fdf0cc':isDefeated?'#334155':'#cbd5e1', textDecoration:isDefeated?'line-through':'none', lineHeight:1.1 }}>{c.name}</p>
                              {(c.conditions||[]).length>0&&<div style={{display:'flex',gap:2,flexWrap:'nowrap',overflow:'hidden',marginTop:2}}>{c.conditions.slice(0,2).map(cd=>{const preset=PRESET_CONDITIONS.find(p=>p.name===cd.name);return(<span key={cd.name} style={{fontSize:7,fontWeight:700,textTransform:'uppercase',background:preset?`${preset.color}22`:'rgba(220,38,38,0.2)',color:preset?preset.color:'#fca5a5',border:`1px solid ${preset?preset.color+'44':'rgba(220,38,38,0.25)'}`,borderRadius:3,padding:'1px 4px',whiteSpace:'nowrap'}}>{preset?preset.emoji+' ':''}{cd.name}·{cd.duration}</span>);})}</div>}
                              {isDefeated&&<div style={{marginTop:2,background:'linear-gradient(90deg,rgba(127,0,0,0.8),rgba(200,20,20,0.9),rgba(127,0,0,0.8))',border:'1px solid rgba(239,68,68,0.5)',borderRadius:4,padding:'2px 6px',display:'inline-flex',alignItems:'center',gap:3}}><Skull style={{width:7,height:7,color:'#fca5a5'}}/><span style={{fontSize:7,fontWeight:900,color:'#fca5a5',textTransform:'uppercase',letterSpacing:'0.18em'}}>Derrotado</span></div>}
                            </div>
                          </div>
                          <div style={{ marginBottom:4 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2.5 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:4 }}><Heart style={{width:9,height:9,color:isDanger?'#f87171':'#4e5f7a'}}/><span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.10em',color:isDanger?'#f87171':'var(--text-muted)'}}>HP</span></div>
                              <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:isDanger?'#f87171':'var(--text-secondary)' }}>{c.currentHp}/{c.maxHp}</span>
                            </div>
                            <div style={{ height:4, background:'rgba(0,0,0,0.55)', borderRadius:99, overflow:'hidden' }}>
                              <div style={{ height:'100%', borderRadius:99, width:`${hpPct}%`, transition:'width 0.5s ease', background:isDanger?'#ef4444':hpPct>60?'#22c55e':'#f59e0b', boxShadow:isDanger?'0 0 5px rgba(239,68,68,0.7)':'none' }} />
                            </div>
                          </div>
                          <div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2.5 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:4 }}><Zap style={{width:9,height:9,color:'var(--gold-dim)'}}/><span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.10em',color:'var(--text-muted)'}}>Aura</span></div>
                              <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'var(--gold-mid)' }}>{c.currentAura}/{c.maxAura}</span>
                            </div>
                            <div style={{ height:4, background:'rgba(0,0,0,0.55)', borderRadius:99, overflow:'hidden' }}>
                              <div style={{ height:'100%', borderRadius:99, width:`${auraPct}%`, transition:'width 0.5s ease', background:'linear-gradient(90deg,#b8892e,#d4a853)', boxShadow:'0 0 4px rgba(201,152,58,0.5)' }} />
                            </div>
                          </div>
                          {(c.maxAmmo||0)>0&&<div style={{marginTop:4,display:'flex',alignItems:'center',gap:4}}><span style={{fontSize:10}}>🎯</span><span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:'#f97316'}}>{c.currentAmmo??0}/{c.maxAmmo}</span></div>}
                          {(c.stacks||[]).length>0&&<div style={{marginTop:4,display:'flex',flexDirection:'column',gap:3}}>{(c.stacks||[]).map((stack:CharacterStack)=>{const pct=stack.max>0?Math.min(1,stack.current/stack.max):0;return(<div key={stack.id}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:1.5}}><span style={{fontSize:7,fontWeight:700,color:stack.color,textTransform:'uppercase',letterSpacing:'0.1em'}}>{stack.name}</span><span style={{fontSize:8,fontWeight:800,color:stack.color,fontFamily:"'JetBrains Mono',monospace"}}>{stack.current}/{stack.max}</span></div><div style={{height:3,background:'rgba(0,0,0,0.5)',borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',width:`${pct*100}%`,background:stack.color,borderRadius:99,transition:'width 0.3s ease'}}/></div></div>);})}</div>}
                          <div style={{ display:'flex', gap:4, marginTop:6 }}>
                            <button onClick={e=>{e.stopPropagation();setManagingConditionsCharId(c.combatId);}} style={{flex:1,fontSize:8,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'3px 0',textAlign:'center'}} className="hover:text-amber-400 hover:border-amber-700/50 transition-colors">+ Cond.</button>
                            <button onClick={e=>{e.stopPropagation();updateCombat({...combat,combatants:combat.combatants.filter(cb=>cb.combatId!==c.combatId)});}} style={{padding:'3px 7px',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,color:'var(--text-faint)',display:'flex',alignItems:'center',justifyContent:'center'}} className="hover:text-rose-400 hover:border-rose-800/40 transition-colors"><Trash2 style={{width:9,height:9}}/></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          )}
          {/* ══ END FAIXA DE INICIATIVA ══ */}

          {/* ── FLOATING COMBAT PANELS (Etapa 6A) ── */}
          {showCombatLeftPanel && (
            <div
              className="hidden lg:block anim-fade mp-combat-panel-shell mp-combat-panel-shell--left"
              style={{ position:'absolute', left:16, top:16, bottom:16, zIndex:70, width:320 }}
            >
              <TurnOrderPanel
                floating
                combat={combat}
                cards={cards}
                items={items}
                selectedAction={selectedAction}
                onSelectAction={(combatId, category) =>
                  setSelectedAction(prev =>
                    prev?.combatId === combatId && prev?.category === category
                      ? null
                      : { combatId, category }
                  )
                }
              />
            </div>
          )}

          {showCombatContextList && (
            <div
              className="hidden lg:block anim-fade mp-combat-panel-shell mp-combat-panel-shell--context"
              style={{
                position:'absolute',
                left: showCombatLeftPanel ? 354 : 16,
                top:56,
                bottom:16,
                zIndex:72,
                width:330,
              }}
            >
              <ContextCardList
                floating
                selectedAction={selectedAction}
                combat={combat}
                cards={cards}
                items={items}
                weapons={weapons}
                seals={seals}
                onCardClick={(card) => initiateCardUsage(card)}
                onItemClick={(item) => {
                  if (currentActor) handleUseItem(currentActor, item);
                }}
                onWeaponClick={(weapon) => {
                  if (currentActor) handleUseItem(currentActor, weapon);
                }}
                onSealClick={(seal) => {
                  if (currentActor) onActivateSeal(seal, currentActor.combatId);
                }}
              />
            </div>
          )}

          {!combatTargetingActive && (
            <>
              <button
                type="button"
                className="hidden lg:flex mp-collapse-tab"
                title={combatLeftPanelOpen ? 'Recolher ordem de turno' : 'Abrir ordem de turno'}
                onClick={() => setCombatLeftPanelOpen(v => !v)}
                style={{
                  left: combatLeftPanelOpen ? 344 : 10,
                  top: 78,
                }}
              >
                {combatLeftPanelOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
              <button
                type="button"
                className="hidden lg:flex mp-collapse-tab mp-collapse-tab--right"
                title={showCombatRightPanel ? 'Recolher controles' : 'Abrir controles'}
                onClick={() => showCombatRightPanel ? setCombatRightPanelOpen(false) : openCombatRightPanel()}
                style={{
                  right: showCombatRightPanel ? 294 : 10,
                  top: 78,
                }}
              >
                {showCombatRightPanel ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </>
          )}

          <div className="flex-1 relative overflow-hidden">
            <CombatArena
              combat={combat}
              activeForms={combat.activeForms || []}
              mode="master"
              selectedCombatantId={selectedCombatantId}
              interactionMode={
                itemTargetPickerItem
                  ? { type: 'item-target' }
                  : selectingTargetFor?.isAreaEffect
                  ? { type: 'target-area' }
                  : selectingTargetFor
                  ? { type: 'target-single' }
                  : unionMode
                  ? { type: 'union' }
                  : { type: 'select' }
              }
              areaSelectedTargets={areaSelectedTargets}
              statPopups={statPopups}
              impactTargetId={impactTargetId}
              unionMode={unionMode}
              unionSelecting={unionSelecting}
              onUpdateCombat={updateCombat}
              onSelectCombatant={setSelectedCombatantId}
              onTargetCombatant={(combatId) => {
                if (!selectingTargetFor) return;
                executeCardOnTarget(selectingTargetFor, 'other', combatId);
                setSelectingTargetFor(null);
              }}
              onToggleAreaTarget={(combatId) => {
                setAreaSelectedTargets(prev =>
                  prev.includes(combatId)
                    ? prev.filter(id => id !== combatId)
                    : [...prev, combatId],
                );
              }}
              onItemTargetCombatant={(combatId) => {
                const pending = itemTargetPickerItem;
                if (!pending || combatId === pending.actor.combatId) return;
                setItemTargetPickerItem(null);
                handleUseItem(pending.actor, pending.item, combatId);
              }}
              onToggleUnionSelect={(combatId) => {
                setUnionSelecting(prev =>
                  prev.includes(combatId)
                    ? prev.filter(id => id !== combatId)
                    : [...prev, combatId],
                );
              }}
            />
          </div>

          {/* ── COMBAT CONTROL PANEL (Etapa 5A → 6A flutuante) ── */}
          {showCombatRightPanel && (
            <div
              className="hidden lg:block anim-fade mp-combat-panel-shell mp-combat-panel-shell--right"
              style={{ position:'absolute', right:16, top:16, bottom:16, zIndex:70, width:260 }}
            >
              <CombatControlPanel
                floating
                combat={combat}
                currentActor={currentActor}
                onStartCombat={startCombat}
                onNextTurn={endTurnWithTimer}
                onEndCombat={endCombat}
                onAddCombatant={() => setShowAddCombatantModal(true)}
                onOpenHistory={() => setShowHistoryModal(true)}
                turnTimerEnabled={turnTimerEnabled}
                turnTimerRemaining={turnTimerRemaining}
                turnTimerRunning={turnTimerRunning}
                turnTimerSeconds={turnTimerSeconds}
                onTimerToggle={() => { setTurnTimerEnabled(v => !v); setTurnTimerRunning(false); setTurnTimerRemaining(turnTimerSeconds); }}
                onTimerPlayPause={() => setTurnTimerRunning(v => !v)}
                onTimerReset={() => { setTurnTimerRemaining(turnTimerSeconds); setTurnTimerRunning(false); }}
                onTimerSecondsChange={(v) => { setTurnTimerSeconds(v); setTurnTimerRemaining(v); setTurnTimerRunning(false); }}
                onAddFieldCondition={(name, duration) => updateCombat({ ...combat, fieldConditions: [...(combat.fieldConditions ?? []), { id: Math.random().toString(36).substr(2, 9), name, duration, sourceCard: 'Manual' }] })}
                onRemoveFieldCondition={removeFieldCondition}
                onUpdateFieldCondition={updateFieldCondition}
                placingPin={placingPin}
                onPlacePin={(label, color) => setPlacingPin({ label, color })}
                onCancelPin={() => setPlacingPin(null)}
                onRemovePin={(id) => updateCombat({ ...combat, customPins: (combat.customPins ?? []).filter(p => p.id !== id) })}
                onGlobalBonus={(delta) => updateCombat({ ...combat, globalBonus: (combat.globalBonus ?? 0) + delta })}
                showMassDmgPanel={showMassDmgPanel}
                massDmgMode={massDmgMode}
                massDmgAmount={massDmgAmount}
                massDmgTargets={massDmgTargets}
                onToggleMassDmgPanel={() => setShowMassDmgPanel(v => !v)}
                onSetMassDmgMode={setMassDmgMode}
                onSetMassDmgAmount={setMassDmgAmount}
                onApplyMassDamage={applyMassDamage}
                onClearMassDmgTargets={() => setMassDmgTargets([])}
                unionMode={unionMode}
                unionSelecting={unionSelecting}
                unionColor={unionColor}
                onSetUnionMode={(v) => { setUnionMode(v); if (!v) setUnionSelecting([]); }}
                onSetUnionColor={setUnionColor}
                onCreateUnion={createUnion}
                onBreakUnion={breakUnion}
                combatQuickRoll={combatQuickRoll}
                onQuickRoll={doQuickCombatRoll}
                combatNotes={combatNotes}
                onNotesChange={setCombatNotes}
                cards={cards}
                onStartFusion={(selectedCards) => {
                  if (!currentActor) return;
                  setFusionSelectedCards(selectedCards);
                  setFusionActor(currentActor);
                  setFusionStep('rolling');
                }}
              />
            </div>
          )}

        </div>{/* /CENTRO: ARENA + PAINEIS */}

        {/* ══ BOTTOM HUD — Status do Personagem Ativo ══════════════════ */}
        {showLegacyBottomHud && combat.isActive && (
          <div
            key={`hud-${turnChangeKey}`}
            style={{
              flexShrink: 0,
              height: 140,
              background: 'var(--bg-surface)',
              borderTop: `2px solid ${turnFlashing ? 'rgba(201,152,58,0.9)' : 'rgba(201,152,58,0.2)'}`,
              display: 'flex',
              gap: 0,
              position: 'relative',
              overflow: 'hidden',
              transition: 'border-color 0.4s ease',
              animation: 'hudSlideIn 0.35s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {/* Turn flash overlay */}
            {turnFlashing && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50,
                background: 'linear-gradient(90deg, rgba(201,152,58,0.0) 0%, rgba(201,152,58,0.18) 50%, rgba(201,152,58,0.0) 100%)',
                animation: 'turnFlashSweep 0.7s ease forwards',
              }} />
            )}

            {/* BG atmospheric glow */}
            <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:`radial-gradient(ellipse at 0% 50%, ${currentActor ? 'rgba(201,152,58,0.06)' : 'transparent'} 0%, transparent 60%)` }} />

            {currentActor ? (() => {
              const actor = currentActor;
              const hpPct = Math.max(0, actor.maxHp > 0 ? (actor.currentHp / actor.maxHp) * 100 : 0);
              const auraPct = Math.max(0, actor.maxAura > 0 ? (actor.currentAura / actor.maxAura) * 100 : 0);
              const hpColor = hpPct <= 20 ? '#ef4444' : hpPct <= 50 ? '#f59e0b' : '#22c55e';
              const CIRC_SIZE = 108;
              const STROKE = 8;
              const R = (CIRC_SIZE - STROKE * 2) / 2;
              const CIRC = 2 * Math.PI * R;
              const stacks = actor.stacks || [];
              const conditions = actor.conditions || [];

              return (
                <div style={{ display:'flex', flex:1, gap:0, padding:'10px 18px', alignItems:'center' }}>

                  {/* ── LEFT: Circular HP + Avatar ── */}
                  <div style={{ position:'relative', flexShrink:0, width:CIRC_SIZE, height:CIRC_SIZE, marginRight:16, animation:`hudTokenIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both` }}>
                    {/* Outer glow ring on turn change */}
                    <div style={{
                      position:'absolute', inset:-4, borderRadius:'50%',
                      boxShadow: turnFlashing ? `0 0 32px 8px ${hpColor}88` : `0 0 12px 2px ${hpColor}44`,
                      transition: 'box-shadow 0.5s ease',
                      pointerEvents:'none',
                    }} />
                    <svg width={CIRC_SIZE} height={CIRC_SIZE} style={{ position:'absolute', inset:0, transform:'rotate(-90deg)' }}>
                      <circle cx={CIRC_SIZE/2} cy={CIRC_SIZE/2} r={R} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={STROKE} />
                      <circle cx={CIRC_SIZE/2} cy={CIRC_SIZE/2} r={R} fill="none"
                        stroke={hpColor} strokeWidth={STROKE}
                        strokeDasharray={`${(hpPct/100)*CIRC} ${CIRC}`}
                        strokeLinecap="round"
                        style={{ filter:`drop-shadow(0 0 6px ${hpColor}cc)`, transition:'stroke-dasharray 0.6s ease, stroke 0.3s ease' }}
                      />
                    </svg>
                    {/* Avatar */}
                    <div style={{ position:'absolute', inset:STROKE+3, borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(20,24,34,0.9)' }}>
                      <img src={actor.icon||undefined} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    </div>
                    {/* HP text */}
                    <div style={{ position:'absolute', bottom:-8, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.9)', border:`1px solid ${hpColor}66`, borderRadius:99, padding:'2px 10px', whiteSpace:'nowrap' }}>
                      <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", fontWeight:900, color:hpColor }}>{actor.currentHp}</span>
                      <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', margin:'0 2px' }}>/</span>
                      <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'rgba(255,255,255,0.45)' }}>{actor.maxHp}</span>
                    </div>
                    {/* Name below */}
                    <div style={{ position:'absolute', top:-22, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', animation:'hudNameIn 0.4s ease both' }}>
                      <span style={{ fontSize:9, fontWeight:900, color:'#fdf0cc', textTransform:'uppercase', letterSpacing:'0.12em', textShadow:'0 0 12px rgba(212,168,83,0.6)' }}>{actor.name}</span>
                    </div>
                    {/* HP adjust buttons */}
                    <div style={{ position:'absolute', bottom:-28, left:'50%', transform:'translateX(-50%)', display:'flex', gap:2, whiteSpace:'nowrap' }}>
                      {([-5,-1,1,5] as const).map(d => (
                        <button key={d} onClick={()=>adjustCombatantStat(actor.combatId,'hp',d)}
                          style={{ padding:'1px 5px', fontSize:8, fontWeight:900, borderRadius:3, cursor:'pointer', lineHeight:1.2,
                            border:'1px solid', borderColor:d<0?'rgba(239,68,68,0.4)':'rgba(34,197,94,0.4)',
                            background:d<0?'rgba(239,68,68,0.12)':'rgba(34,197,94,0.12)',
                            color:d<0?'#fca5a5':'#86efac', transition:'all 0.15s' }}
                        >{d>0?`+${d}`:d}</button>
                      ))}
                    </div>
                  </div>

                  {/* ── CENTER: Aura + Ammo + Stacks + Conditions ── */}
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, justifyContent:'center', paddingTop:4, animation:'hudStatsIn 0.45s ease both' }}>

                    {/* Ammo (if exists) — shown as large number above aura */}
                    {(actor.maxAmmo || 0) > 0 && (
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                        <span style={{ fontSize:16 }}>🎯</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:900, color:'#f97316', lineHeight:1, letterSpacing:'-0.02em' }}>{actor.currentAmmo ?? 0}</span>
                        <span style={{ fontSize:11, color:'rgba(249,115,22,0.4)', fontWeight:700 }}>/{actor.maxAmmo}</span>
                        <div style={{ display:'flex', gap:2, marginLeft:4 }}>
                          {([-5,-1,1,5] as const).map(d => (
                            <button key={d} onClick={()=>adjustCombatantStat(actor.combatId,'ammo',d)}
                              style={{ padding:'2px 5px', fontSize:8, fontWeight:900, borderRadius:3, cursor:'pointer',
                                border:'1px solid', borderColor:d<0?'rgba(249,115,22,0.4)':'rgba(249,115,22,0.6)',
                                background:d<0?'rgba(249,115,22,0.1)':'rgba(249,115,22,0.18)',
                                color:'#fdba74' }}
                            >{d>0?`+${d}`:d}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Aura bar — large horizontal */}
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <Zap style={{ width:11, height:11, color:'#60a5fa' }} />
                          <span style={{ fontSize:8, fontWeight:700, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.18em' }}>AURA</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:900, color:'#93c5fd', lineHeight:1 }}>{actor.currentAura}</span>
                          <span style={{ fontSize:10, color:'rgba(147,197,253,0.4)', fontWeight:700 }}>/{actor.maxAura}</span>
                        </div>
                      </div>
                      <div style={{ height:12, background:'rgba(0,0,0,0.6)', borderRadius:99, overflow:'hidden', border:'1px solid rgba(59,130,246,0.25)', position:'relative' }}>
                        <div style={{ height:'100%', borderRadius:99, width:`${auraPct}%`, background:'linear-gradient(90deg,#1d4ed8,#60a5fa,#93c5fd)', boxShadow:'0 0 10px rgba(96,165,250,0.6)', transition:'width 0.6s ease' }} />
                        {/* Aura shimmer */}
                        <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.08) 50%,transparent 100%)', animation:'barShimmer 3s ease-in-out infinite', pointerEvents:'none' }} />
                      </div>
                      <div style={{ display:'flex', gap:3, marginTop:3 }}>
                        {([-5,-1,1,5] as const).map(d => (
                          <button key={d} onClick={()=>adjustCombatantStat(actor.combatId,'aura',d)}
                            style={{ flex:1, padding:'2px 0', fontSize:8, fontWeight:900, borderRadius:3, cursor:'pointer',
                              border:'1px solid', borderColor:d<0?'rgba(59,130,246,0.35)':'rgba(59,130,246,0.55)',
                              background:d<0?'rgba(59,130,246,0.08)':'rgba(59,130,246,0.16)',
                              color:'#93c5fd', transition:'all 0.15s' }}
                          >{d>0?`+${d}`:d}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── RIGHT: Stacks + Conditions ── */}
                  <div style={{ flexShrink:0, display:'flex', flexDirection:'column', gap:8, paddingLeft:16, paddingTop:4, borderLeft:'1px solid rgba(255,255,255,0.06)', minWidth:180, maxWidth:260, animation:'hudSideIn 0.5s ease both' }}>

                    {/* Stacks as colored dots */}
                    {stacks.length > 0 && (
                      <div>
                        <p style={{ fontSize:7, fontWeight:700, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:6 }}>Stacks</p>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {stacks.map(stack => {
                            const dots = Array.from({ length: stack.max }, (_, i) => i < stack.current);
                            return (
                              <div key={stack.id} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ fontSize:8, fontWeight:700, color:stack.color, textTransform:'uppercase', letterSpacing:'0.1em', minWidth:40, flexShrink:0 }}>{stack.name}</span>
                                <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                                  {dots.map((filled, idx) => (
                                    <button
                                      key={idx}
                                      title={filled ? `Remover 1 ${stack.name}` : `Adicionar 1 ${stack.name}`}
                                      onClick={() => {
                                        const newVal = filled
                                          ? Math.max(0, stack.current - 1)
                                          : Math.min(stack.max, stack.current + 1);
                                        const newCombatants = combat.combatants.map(cb =>
                                          cb.combatId === actor.combatId
                                            ? { ...cb, stacks: (cb.stacks||[]).map(s => s.id === stack.id ? { ...s, current: newVal } : s) }
                                            : cb
                                        );
                                        updateCombat({ ...combat, combatants: newCombatants });
                                      }}
                                      style={{
                                        width: 14, height: 14, borderRadius: '50%', cursor: 'pointer', border: 'none', padding: 0,
                                        background: filled ? stack.color : 'rgba(255,255,255,0.06)',
                                        boxShadow: filled ? `0 0 8px ${stack.color}88` : 'none',
                                        transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                                        transform: filled ? 'scale(1)' : 'scale(0.85)',
                                      }}
                                    />
                                  ))}
                                </div>
                                <span style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:stack.color, marginLeft:'auto' }}>{stack.current}/{stack.max}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Conditions */}
                    {conditions.length > 0 && (
                      <div>
                        <p style={{ fontSize:7, fontWeight:700, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:6 }}>Condições</p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                          {conditions.map(cond => {
                            const preset = PRESET_CONDITIONS.find(p => p.name === cond.name);
                            const col = preset?.color || '#f87171';
                            return (
                              <div key={cond.name} style={{
                                display:'flex', alignItems:'center', gap:4,
                                background:`${col}18`, border:`1px solid ${col}55`,
                                borderRadius:8, padding:'3px 8px',
                                animation:'condIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
                              }}>
                                <span style={{ fontSize:11 }}>{preset?.emoji || '⚠'}</span>
                                <span style={{ fontSize:9, fontWeight:700, color:col, letterSpacing:'0.04em' }}>{cond.name}</span>
                                <span style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:`${col}aa`, background:`${col}22`, borderRadius:4, padding:'0 4px' }}>{cond.duration}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {stacks.length === 0 && conditions.length === 0 && (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', opacity:0.25 }}>
                        <span style={{ fontSize:9, color:'var(--text-faint)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em' }}>Sem stacks ou condições</span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })() : (
              /* No active actor — show placeholder */
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:12, opacity:0.2 }}>
                <Swords style={{ width:20, height:20, color:'var(--gold-dim)' }} />
                <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.25em' }}>Aguardando turno ativo</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ DECK MODAL — Full card browser ══ */}
      {showDeckModal && (() => {
        const actor = combat?.combatants.find(c=>c.combatId===(selectedCombatantId||currentActor?.combatId));
        if (!actor) return null;

        const typeConfig: Record<string, CardTypeStyleImport> = CARD_TYPE_THEME;

        const allActorCards = ['ataque','ação','reação','reforço','vínculo','combinação','forma'].flatMap(type =>
          (actor.cardIds||[])
            .map(id => cards.find(c=>c.id===id))
            .filter(c => c && c.type===type) as any[]
        );

        const filtered = allActorCards.filter(c => {
          const matchSearch = c.name.toLowerCase().includes(deckSearchTerm.toLowerCase()) || c.description?.toLowerCase().includes(deckSearchTerm.toLowerCase());
          const matchType = deckTypeFilter === 'all' || c.type === deckTypeFilter;
          return matchSearch && matchType;
        });

        return createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center anim-fade"
            style={{ background:'rgba(4,3,2,0.88)', backdropFilter:'blur(20px)' }}
            onMouseDown={e => { if (e.target === e.currentTarget) setShowDeckModal(false); }}
          >
            <div
              className="anim-scale-in"
              style={{
                width:'100%', maxWidth:1200,
                maxHeight:'82vh',
                background:'linear-gradient(180deg,rgba(22,27,38,0.99) 0%,rgba(20,24,34,0.95) 100%)',
                border:'1px solid rgba(168,85,247,0.3)',
                borderBottom:'none',
                borderRadius:'28px 28px 0 0',
                display:'flex', flexDirection:'column',
                boxShadow:'0 -20px 80px rgba(168,85,247,0.2), 0 -4px 0 rgba(168,85,247,0.4)',
                overflow:'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding:'16px 24px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, background:'rgba(22,27,38,0.97)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:'rgba(168,85,247,0.15)', border:'1px solid rgba(168,85,247,0.35)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(168,85,247,0.3)' }}>
                    <BookOpen style={{ width:18, height:18, color:'#c084fc' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize:16, fontWeight:700, color:'#fdf0cc', textTransform:'uppercase', fontStyle:'italic', letterSpacing:'0.04em' }}>Baralho Completo</h3>
                    <p style={{ fontSize:9, color:'rgba(168,85,247,0.6)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.25em', marginTop:1 }}>{actor.name} — {allActorCards.length} habilidades</p>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  {/* Search */}
                  <div style={{ position:'relative' }}>
                    <Search style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:13, height:13, color:'#475569' }} />
                    <input
                      type="text"
                      placeholder="Pesquisar habilidade..."
                      autoFocus
                      value={deckSearchTerm}
                      onChange={e => setDeckSearchTerm(e.target.value)}
                      style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:10, padding:'8px 12px 8px 30px', fontSize:11, color:'#e2e8f0', outline:'none', width:220, transition:'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor='rgba(168,85,247,0.6)'}
                      onBlur={e => e.target.style.borderColor='rgba(168,85,247,0.25)'}
                    />
                  </div>
                  {/* Close */}
                  <button
                    onClick={() => setShowDeckModal(false)}
                    style={{ width:36, height:36, borderRadius:10, background:'rgba(30,20,45,0.8)', border:'1px solid rgba(168,85,247,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#9d73d8', cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(220,38,38,0.3)'; (e.currentTarget as HTMLButtonElement).style.color='#f87171'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(30,20,45,0.8)'; (e.currentTarget as HTMLButtonElement).style.color='#9d73d8'; }}
                  >
                    <X style={{ width:14, height:14 }} />
                  </button>
                </div>
              </div>

              {/* Type filter pills */}
              <div style={{ padding:'10px 24px', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', gap:6, flexShrink:0, overflowX:'auto' }}>
                {[
                  { id:'all', label:'Todos', color:'#c9983a', bg:'rgba(201,152,58,0.15)', border:'rgba(201,152,58,0.4)', count: allActorCards.length },
                  { id:'ataque', label:'Ataque', color:'#ef4444', bg:'rgba(239,68,68,0.12)', border:'rgba(239,68,68,0.35)', count: allActorCards.filter(c=>c.type==='ataque').length },
                  { id:'ação', label:'Ação', color:'#eab308', bg:'rgba(234,179,8,0.12)', border:'rgba(234,179,8,0.35)', count: allActorCards.filter(c=>c.type==='ação').length },
                  { id:'reação', label:'Reação', color:'#3b82f6', bg:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.35)', count: allActorCards.filter(c=>c.type==='reação').length },
                  { id:'reforço', label:'Reforço', color:'#22c55e', bg:'rgba(34,197,94,0.12)', border:'rgba(34,197,94,0.35)', count: allActorCards.filter(c=>c.type==='reforço').length },
                  { id:'vínculo', label:'Vínculo', color:'#94a3b8', bg:'rgba(148,163,184,0.12)', border:'rgba(148,163,184,0.35)', count: allActorCards.filter(c=>c.type==='vínculo').length },
                  { id:'combinação', label:'Combinação', color:'#c084fc', bg:'rgba(192,132,252,0.12)', border:'rgba(192,132,252,0.35)', count: allActorCards.filter(c=>c.type==='combinação').length },
                  { id:'forma', label:'Forma', color:'#f59e0b', bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.35)', count: allActorCards.filter(c=>c.type==='forma').length },
                ].filter(f => f.count > 0 || f.id === 'all').map(f => (
                  <button
                    key={f.id}
                    onClick={() => setDeckTypeFilter(f.id as any)}
                    style={{
                      padding:'5px 12px', borderRadius:20, fontSize:9, fontWeight:700,
                      textTransform:'uppercase', letterSpacing:'0.12em', cursor:'pointer',
                      flexShrink:0, display:'flex', alignItems:'center', gap:5,
                      background: deckTypeFilter === f.id ? f.bg : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${deckTypeFilter === f.id ? f.border : 'rgba(255,255,255,0.06)'}`,
                      color: deckTypeFilter === f.id ? f.color : '#475569',
                      boxShadow: deckTypeFilter === f.id ? `0 0 12px ${f.bg}` : 'none',
                      transition:'all 0.2s',
                    }}
                  >
                    {f.label}
                    {f.count > 0 && <span style={{ background:'rgba(255,255,255,0.08)', borderRadius:99, padding:'0 5px', fontSize:8, color:'inherit' }}>{f.count}</span>}
                  </button>
                ))}
              </div>

              {/* Cards grid */}
              <div className="custom-scroll" style={{ flex:1, overflowY:'auto', padding:'16px 24px 24px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12, alignContent:'start' }}>
                {filtered.length === 0 && (
                  <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:'40px', opacity:0.2 }}>
                    <Search style={{ width:32, height:32, color:'#475569' }} />
                    <p style={{ fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.2em' }}>Nenhuma habilidade encontrada</p>
                  </div>
                )}
                {filtered.map((card: any) => {
                  const cfg = typeConfig[card.type] || typeConfig['ação'];
                  const ammoCostCard = card.ammoCost || 0;
                  const canAfford = actor.currentAura >= card.auraCost && (ammoCostCard === 0 || (actor.maxAmmo || 0) === 0 || (actor.currentAmmo ?? 0) >= ammoCostCard);
                  const isPinnedDeck = (actor.pinnedCardIds || []).includes(card.id);
                  const pinnedCountDeck = (actor.pinnedCardIds || []).length;

                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        if (!canAfford) { alert('Aura insuficiente!'); return; }
                        setShowDeckModal(false);
                        initiateCardUsage(card);
                      }}
                      style={{
                        borderRadius:14,
                        background: cfg.bg,
                        border:`1.5px solid ${isPinnedDeck ? 'rgba(251,191,36,0.7)' : canAfford ? cfg.border : 'rgba(255,255,255,0.04)'}`,
                        display:'flex', flexDirection:'column', overflow:'hidden',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        filter: canAfford ? 'none' : 'grayscale(0.8) opacity(0.35)',
                        transition:'all 0.2s',
                        boxShadow: isPinnedDeck
                          ? `0 4px 16px rgba(0,0,0,0.7), 0 0 16px rgba(251,191,36,0.25)`
                          : canAfford ? `0 4px 16px rgba(0,0,0,0.7), 0 0 12px ${cfg.border}20` : '0 2px 8px rgba(0,0,0,0.5)',
                        position:'relative',
                      }}
                      onMouseEnter={e => { if (canAfford) { (e.currentTarget as HTMLDivElement).style.transform='translateY(-4px) scale(1.02)'; (e.currentTarget as HTMLDivElement).style.boxShadow=`0 12px 40px rgba(0,0,0,0.8), 0 0 24px ${cfg.border}50`; }}}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform='none'; (e.currentTarget as HTMLDivElement).style.boxShadow = isPinnedDeck ? `0 4px 16px rgba(0,0,0,0.7), 0 0 16px rgba(251,191,36,0.25)` : canAfford ? `0 4px 16px rgba(0,0,0,0.7), 0 0 12px ${cfg.border}20` : '0 2px 8px rgba(0,0,0,0.5)'; }}
                    >
                      {/* Top color bar */}
                      {isPinnedDeck && <div style={{ height:2.5, background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.9),rgba(255,255,255,0.5),rgba(251,191,36,0.9),transparent)', flexShrink:0 }} />}
                      {!isPinnedDeck && canAfford && <div style={{ height:2.5, background:`linear-gradient(90deg,transparent,${cfg.topColor},rgba(255,255,255,0.5),${cfg.topColor},transparent)`, flexShrink:0 }} />}

                      {/* Image */}
                      <div style={{ width:'100%', paddingBottom:'55%', position:'relative', overflow:'hidden', flexShrink:0 }}>
                        <img src={card.image||null} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                        <div style={{ position:'absolute', inset:0, background:`linear-gradient(0deg,rgba(0,0,0,0.7),transparent 50%)` }} />
                        <div style={{ position:'absolute', top:6, left:6, fontSize:7, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:cfg.topColor, padding:'2px 6px', borderRadius:4, background:`${cfg.topColor}22`, border:`1px solid ${cfg.border}55` }}>{cfg.label}</div>
                        {/* Pin badge no canto da imagem */}
                        {isPinnedDeck && (
                          <div style={{ position:'absolute', bottom:5, left:5, background:'rgba(251,191,36,0.25)', border:'1px solid rgba(251,191,36,0.5)', borderRadius:5, padding:'2px 5px', display:'flex', alignItems:'center', gap:3 }}>
                            <Pin style={{ width:7, height:7, color:'#fbbf24' }} />
                            <span style={{ fontSize:7, fontWeight:700, color:'#fbbf24', textTransform:'uppercase', letterSpacing:'0.1em' }}>Fixado</span>
                          </div>
                        )}
                        <div style={{ position:'absolute', top:6, right:6, display:'flex', flexDirection:'column', gap:2, alignItems:'flex-end' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:2, fontSize:9, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:canAfford?'#67e8f9':'#f87171', background:'rgba(0,0,0,0.7)', borderRadius:5, padding:'1px 5px', border:`1px solid ${canAfford?'rgba(103,232,249,0.2)':'rgba(248,113,113,0.2)'}` }}>
                            ⚡{card.auraCost}
                          </div>
                          {ammoCostCard > 0 && <div style={{ fontSize:8, fontWeight:700, color:'#f97316', background:'rgba(0,0,0,0.6)', borderRadius:5, padding:'1px 5px' }}>🎯{ammoCostCard}</div>}
                        </div>
                      </div>

                      {/* Body */}
                      <div style={{ padding:'8px 10px 8px', flex:1 }}>
                        <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', fontStyle:'italic', color:canAfford?'#fff':'#334155', lineHeight:1.2, marginBottom:3, letterSpacing:'0.02em' }}>{card.name}</p>
                        <p style={{ fontSize:8, color:'rgba(255,255,255,0.25)', fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>{card.diceRoll}{card.damage > 0 ? ` · ${card.damage}dmg` : ''}{card.dc ? ` · CD${card.dc}` : ''}</p>
                        {card.description && (
                          <p style={{ fontSize:8, color:'rgba(255,255,255,0.28)', lineHeight:1.4, fontStyle:'italic', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{card.description}</p>
                        )}
                        {card.conditionEffect && (
                          <div style={{ marginTop:5, fontSize:8, color:'#f59e0b', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:5, padding:'2px 6px', display:'inline-flex', alignItems:'center', gap:4 }}>
                            ✦ {card.conditionEffect}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer stats */}
              <div style={{ padding:'8px 24px', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', gap:16, alignItems:'center', flexShrink:0, background:'rgba(22,27,38,0.95)' }}>
                <span style={{ fontSize:9, color:'var(--text-faint)', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.15em' }}>
                  {filtered.length} de {allActorCards.length} habilidades
                </span>
                {deckSearchTerm && (
                  <button onClick={() => setDeckSearchTerm('')} style={{ fontSize:9, color:'#c9983a', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                    <X style={{width:9,height:9}}/> Limpar busca
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </>
  );
};

export default CombatTab;
