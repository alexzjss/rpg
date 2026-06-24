import React from 'react';
import {
  Compass, ChefHat, Hammer, ShoppingCart,
  ChevronLeft, ChevronRight, MapPin, Users, Plus, Swords,
  Sun, Moon,
  CloudRain, CloudLightning, Cloud, Snowflake,
  Dices,
  Tent, Heart, Zap, Edit3, Activity, Briefcase, ScrollText,
  Trash2, Flame,
  Coins, Shuffle, TrendingUp, TrendingDown,
} from 'lucide-react';
import type { JourneyState, Character, Item, Recipe, RecipeType, UpgradeOffer, UpgradeOfferType, UpgradeLuck } from '../types';
import { resolveOwnedItems } from '../utils/items';
import { ImagePickerButton } from '../components/ui/ImagePickerButton';

interface JourneyTabProps {
  journey: JourneyState;
  characters: Character[];
  items: Item[];
  journeySubTab: 'mapa' | 'cozinhar' | 'forjar' | 'upgrades';
  setJourneySubTab: (tab: 'mapa' | 'cozinhar' | 'forjar' | 'upgrades') => void;
  craftCharacterId: string;
  setCraftCharacterId: (id: string) => void;
  editRecipeData: Partial<Recipe>;
  setEditRecipeData: React.Dispatch<React.SetStateAction<Partial<Recipe>>>;
  recipeModal: { mode: 'new' | 'edit'; recipe?: Recipe; type: RecipeType } | null;
  setRecipeModal: (m: { mode: 'new' | 'edit'; recipe?: Recipe; type: RecipeType } | null) => void;
  upgradeShopOfferCount: number;
  setUpgradeShopOfferCount: (n: number) => void;
  upgradeShopLuck: UpgradeLuck;
  setUpgradeShopLuck: (l: UpgradeLuck) => void;
  upgradeShopOffers: UpgradeOffer[];
  upgradeShopGenerated: boolean;
  upgradeTargetCharId: string;
  setUpgradeTargetCharId: (id: string) => void;
  characterCurrencies: Record<string, number>;
  setCharacterCurrencies: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setIsPartyModalOpen: (v: boolean) => void;
  setQuickEditChar: (c: Character | null) => void;
  openInventoryCharId: string | null;
  setOpenInventoryCharId: (id: string | null) => void;
  managingConditionsCharId: string | null;
  setManagingConditionsCharId: (id: string | null) => void;
  updateJourney: (update: Partial<JourneyState>) => void;
  deleteRecipe: (id: string) => void;
  executeRecipe: (recipe: Recipe, characterId: string) => void;
  generateUpgradeOffers: () => void;
  rerollUpgradeShop: () => void;
  purchaseUpgrade: (offer: UpgradeOffer, charId: string) => void;
  updateCharacterStats: (charId: string, updates: Partial<Character>) => void;
  handleManualRoll: (sides: number, label: string) => void;
  onEnterCombat: () => void;
}

const JourneyTab: React.FC<JourneyTabProps> = ({
  journey, characters, items,
  journeySubTab, setJourneySubTab,
  craftCharacterId, setCraftCharacterId,
  editRecipeData, setEditRecipeData,
  recipeModal, setRecipeModal,
  upgradeShopOfferCount, setUpgradeShopOfferCount,
  upgradeShopLuck, setUpgradeShopLuck,
  upgradeShopOffers, upgradeShopGenerated,
  upgradeTargetCharId, setUpgradeTargetCharId,
  characterCurrencies, setCharacterCurrencies,
  setIsPartyModalOpen, setQuickEditChar,
  openInventoryCharId, setOpenInventoryCharId,
  managingConditionsCharId, setManagingConditionsCharId,
  updateJourney, deleteRecipe, executeRecipe,
  generateUpgradeOffers, rerollUpgradeShop, purchaseUpgrade,
  updateCharacterStats, handleManualRoll, onEnterCombat,
}) => {
  const journeyCharacters = characters.filter(c => c.isInJourney);

  const stripHistory = (j: JourneyState): JourneyState => {
    const { history, future, ...rest } = j;
    return rest as JourneyState;
  };

  const handleJourneyPrevious = () => {
    if (!journey.history || journey.history.length === 0) return;
    const previous = journey.history[journey.history.length - 1];
    const newHistory = journey.history.slice(0, -1);
    const newFuture = [stripHistory(journey), ...(journey.future || [])];
    updateJourney({ ...previous, history: newHistory, future: newFuture });
  };

  const handleJourneyNext = () => {
    if (!journey.future || journey.future.length === 0) return;
    const next = journey.future[0];
    const newFuture = journey.future.slice(1);
    const newHistory = [...(journey.history || []), stripHistory(journey)];
    updateJourney({ ...next, history: newHistory, future: newFuture });
  };

  const handleNewWaypoint = () => {
    const newHistory = [...(journey.history || []), stripHistory(journey)];
    updateJourney({
      history: newHistory,
      future: [],
      locationName: 'Nova Localização',
      description: '',
      notes: '',
      weatherEffects: [],
    });
  };

  return (
          <div className="anim-fade-up flex flex-col gap-4 mp-journey" style={{ height:'100%', overflow:'hidden' }}>
             {/* Header & Controls */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div style={{ position:'relative' }}>
                   <p className="mp-journey-kicker font-bold uppercase text-xs" style={{ marginBottom: 2 }}>Crônica de Viagem</p>
                   <h2 className="mp-journey-title text-5xl font-black uppercase">Jornada</h2>
                   <p className="mp-journey-kicker font-bold uppercase tracking-widest text-sm" style={{ marginTop: 4, opacity: 0.75 }}>Exploração e Aventura</p>
                </div>
                <div className="flex gap-4 flex-wrap">
                   {/* Sub-tab navigation */}
                   <div className="flex gap-1 p-1 rounded-2xl mp-journey-subtabs" style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.06)' }}>
                     {([
                       { key:'mapa', icon:<Compass className="w-4 h-4"/>, label:'Mapa' },
                       { key:'cozinhar', icon:<ChefHat className="w-4 h-4"/>, label:'Cozinhar' },
                       { key:'forjar', icon:<Hammer className="w-4 h-4"/>, label:'Forjar' },
                       { key:'upgrades', icon:<ShoppingCart className="w-4 h-4"/>, label:'Upgrades' },
                     ] as const).map(tab => (
                       <button key={tab.key}
                         onClick={() => setJourneySubTab(tab.key)}
                         className="flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold uppercase text-xs tracking-widest transition-all"
                         style={{
                           background: journeySubTab === tab.key
                             ? (tab.key === 'cozinhar' ? 'rgba(234,88,12,0.25)'
                               : tab.key === 'forjar' ? 'rgba(168,85,247,0.25)'
                               : tab.key === 'upgrades' ? 'rgba(16,185,129,0.2)'
                               : 'rgba(201,152,58,0.25)')
                             : 'transparent',
                           color: journeySubTab === tab.key
                             ? (tab.key === 'cozinhar' ? '#b4470f'
                               : tab.key === 'forjar' ? '#7e22ce'
                               : tab.key === 'upgrades' ? '#0f766e'
                               : '#9a7322')
                             : 'rgba(74,54,24,0.5)',
                           border: journeySubTab === tab.key
                             ? `1px solid ${tab.key === 'cozinhar' ? 'rgba(234,88,12,0.4)' : tab.key === 'forjar' ? 'rgba(168,85,247,0.4)' : tab.key === 'upgrades' ? 'rgba(16,185,129,0.35)' : 'rgba(201,152,58,0.4)'}`
                             : '1px solid transparent',
                         }}
                       >{tab.icon}{tab.label}</button>
                     ))}
                   </div>

                   {journeySubTab === 'mapa' && (<>
                   <button
                        onClick={handleJourneyPrevious}
                        disabled={!journey.history || journey.history.length === 0}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all border border-slate-800"
                   >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                   </button>
                   <button
                        onClick={handleJourneyNext}
                        disabled={!journey.future || journey.future.length === 0}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all border border-slate-800"
                   >
                        Próximo <ChevronRight className="w-4 h-4" />
                   </button>
                   <button onClick={handleNewWaypoint} className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all shadow-lg">
                      <MapPin className="w-4 h-4" /> Novo Local
                   </button>
                   <button onClick={() => setIsPartyModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-amber-600 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all border border-slate-800">
                      <Users className="w-4 h-4" /> Gerenciar Grupo
                   </button>
                   </>)}

                   {journeySubTab === 'cozinhar' && (
                     <button onClick={() => { setEditRecipeData({ type: 'cozinhar', ingredients: [] }); setRecipeModal({ mode:'new', type:'cozinhar' }); }}
                       className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all shadow-lg"
                       style={{ background:'linear-gradient(135deg,rgba(234,88,12,0.6),rgba(180,60,5,0.8))', border:'1px solid rgba(234,88,12,0.5)', boxShadow:'0 0 16px rgba(234,88,12,0.3)' }}>
                       <Plus className="w-4 h-4" /> Nova Receita
                     </button>
                   )}
                   {journeySubTab === 'forjar' && (
                     <button onClick={() => { setEditRecipeData({ type: 'forjar', ingredients: [] }); setRecipeModal({ mode:'new', type:'forjar' }); }}
                       className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all shadow-lg"
                       style={{ background:'linear-gradient(135deg,rgba(168,85,247,0.5),rgba(109,40,217,0.7))', border:'1px solid rgba(168,85,247,0.5)', boxShadow:'0 0 16px rgba(168,85,247,0.3)' }}>
                       <Plus className="w-4 h-4" /> Nova Receita de Forja
                     </button>
                   )}

                   <button
                     onClick={onEnterCombat}
                     className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all shadow-lg hover:opacity-90"
                     style={{ background:'linear-gradient(135deg,#dc2626,#7f1d1d)', border:'1px solid rgba(220,38,38,0.5)', boxShadow:'0 0 20px rgba(220,38,38,0.3)' }}
                   >
                      <Swords className="w-4 h-4" /> Entrar em Combate
                   </button>
                </div>
             </div>

             {/* Main Content - conditionally rendered by sub-tab */}

             {/* ─── MAPA ─── */}
             {journeySubTab === 'mapa' && (
             <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Left: Location & Log */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                   {/* Location Visualization — miniatura de manuscrito iluminado */}
                   <div className="relative flex-1 rounded-2xl overflow-hidden group shadow-2xl bg-slate-900/80 mp-journey-framed">
                      <div className="mp-journey-frame-overlay" />
                      {(['tl','tr','bl','br'] as const).map(pos => (
                        <div key={pos} className={`mp-journey-frame-corner mp-journey-frame-corner--${pos}`}>
                          <svg viewBox="0 0 58 58" fill="none">
                            <path d="M6 6 L30 6 M6 6 L6 30" stroke="#caa44e" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M6 6 Q22 9 26 24 Q30 13 42 11" stroke="#9a7322" strokeWidth="1.4" fill="none" opacity="0.9" />
                            <circle cx="6" cy="6" r="3.6" fill="#caa44e" />
                            <circle cx="30" cy="6" r="1.8" fill="#9a7322" opacity="0.8" />
                            <circle cx="6" cy="30" r="1.8" fill="#9a7322" opacity="0.8" />
                          </svg>
                        </div>
                      ))}
                      <img src={journey.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2868&auto=format&fit=crop'} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] ease-linear hover:scale-110" />

                      {/* Night overlay */}
                      {journey.isNight && (
                        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(5,10,30,0.55)', mixBlendMode: 'multiply' }} />
                      )}

                      {/* RAIN animation */}
                      {(journey.weatherEffects || []).includes('rain') && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
                          <style>{`
                            @keyframes rain-fall {
                              0% { transform: translateY(-10px) translateX(0px); opacity: 0; }
                              5% { opacity: 0.8; }
                              95% { opacity: 0.6; }
                              100% { transform: translateY(110vh) translateX(-30px); opacity: 0; }
                            }
                          `}</style>
                          {Array.from({ length: 60 }).map((_, i) => (
                            <div key={i} style={{
                              position: 'absolute',
                              left: `${Math.random() * 110 - 5}%`,
                              top: `-${Math.random() * 20}%`,
                              width: 1.5,
                              height: Math.random() * 18 + 10,
                              background: 'linear-gradient(180deg, transparent, rgba(160,200,255,0.7), rgba(120,180,255,0.4))',
                              borderRadius: 99,
                              animation: `rain-fall ${Math.random() * 0.6 + 0.7}s linear ${Math.random() * 2}s infinite`,
                              transform: 'rotate(12deg)',
                            }} />
                          ))}
                          <div style={{ position:'absolute', inset:0, background:'rgba(80,120,180,0.08)' }} />
                        </div>
                      )}

                      {/* STORM animation */}
                      {(journey.weatherEffects || []).includes('storm') && (() => {
                        return (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }}>
                            <style>{`
                              @keyframes storm-rain {
                                0% { transform: translateY(-10px) translateX(0px); opacity: 0; }
                                5% { opacity: 1; }
                                95% { opacity: 0.7; }
                                100% { transform: translateY(110vh) translateX(-50px); opacity: 0; }
                              }
                              @keyframes lightning-flash {
                                0%, 100% { opacity: 0; }
                                2% { opacity: 0.9; }
                                4% { opacity: 0; }
                                6% { opacity: 0.6; }
                                8% { opacity: 0; }
                              }
                              @keyframes lightning-bolt {
                                0% { opacity: 0; transform: scaleY(0); }
                                10% { opacity: 1; transform: scaleY(1); }
                                30% { opacity: 1; transform: scaleY(1); }
                                60% { opacity: 0; transform: scaleY(1); }
                                100% { opacity: 0; }
                              }
                            `}</style>
                            {/* Heavy rain */}
                            {Array.from({ length: 80 }).map((_, i) => (
                              <div key={i} style={{
                                position: 'absolute',
                                left: `${Math.random() * 115 - 5}%`,
                                top: `-${Math.random() * 20}%`,
                                width: 2,
                                height: Math.random() * 22 + 14,
                                background: 'linear-gradient(180deg, transparent, rgba(180,220,255,0.85))',
                                borderRadius: 99,
                                animation: `storm-rain ${Math.random() * 0.4 + 0.4}s linear ${Math.random() * 1.5}s infinite`,
                                transform: 'rotate(20deg)',
                              }} />
                            ))}
                            {/* Lightning flashes */}
                            {[0, 1, 2].map(li => (
                              <div key={li} style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(220,240,255,0.15)',
                                animation: `lightning-flash ${4 + li * 3}s ease-in-out ${li * 2.5}s infinite`,
                              }} />
                            ))}
                            {/* Lightning bolt SVGs */}
                            {[
                              { left: '25%', delay: '1.2s', dur: '6s' },
                              { left: '60%', delay: '4s', dur: '8s' },
                              { left: '80%', delay: '2.5s', dur: '7s' },
                            ].map((bolt, bi) => (
                              <svg key={bi} style={{
                                position: 'absolute',
                                top: 0, left: bolt.left,
                                width: 32, height: 140,
                                animation: `lightning-bolt ${bolt.dur} ease-in-out ${bolt.delay} infinite`,
                                transformOrigin: 'top center',
                                filter: 'drop-shadow(0 0 8px rgba(200,220,255,0.9))',
                                opacity: 0,
                              }}>
                                <polyline points="16,0 6,55 16,55 4,140" fill="none" stroke="rgba(220,240,255,0.95)" strokeWidth="3" strokeLinejoin="round" />
                                <polyline points="16,0 6,55 16,55 4,140" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                              </svg>
                            ))}
                            <div style={{ position:'absolute', inset:0, background:'rgba(40,60,100,0.18)' }} />
                          </div>
                        );
                      })()}

                      {/* FOG animation */}
                      {(journey.weatherEffects || []).includes('fog') && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
                          <style>{`
                            @keyframes fog-drift-1 {
                              0% { transform: translateX(-5%) scaleY(1); opacity: 0.55; }
                              50% { transform: translateX(5%) scaleY(1.05); opacity: 0.7; }
                              100% { transform: translateX(-5%) scaleY(1); opacity: 0.55; }
                            }
                            @keyframes fog-drift-2 {
                              0% { transform: translateX(8%) scaleY(0.95); opacity: 0.45; }
                              50% { transform: translateX(-8%) scaleY(1.1); opacity: 0.6; }
                              100% { transform: translateX(8%) scaleY(0.95); opacity: 0.45; }
                            }
                            @keyframes fog-drift-3 {
                              0% { transform: translateX(-12%) scaleY(1.1); opacity: 0.35; }
                              50% { transform: translateX(6%) scaleY(0.9); opacity: 0.5; }
                              100% { transform: translateX(-12%) scaleY(1.1); opacity: 0.35; }
                            }
                          `}</style>
                          {/* Base fog layer */}
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(ellipse 140% 60% at 50% 60%, rgba(200,210,220,0.38) 0%, rgba(180,195,210,0.22) 50%, transparent 75%)',
                            animation: 'fog-drift-1 12s ease-in-out infinite',
                          }} />
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(ellipse 120% 50% at 30% 70%, rgba(200,210,220,0.3) 0%, rgba(180,195,210,0.18) 50%, transparent 70%)',
                            animation: 'fog-drift-2 17s ease-in-out infinite',
                          }} />
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(ellipse 110% 45% at 70% 50%, rgba(200,212,225,0.28) 0%, transparent 65%)',
                            animation: 'fog-drift-3 22s ease-in-out infinite',
                          }} />
                          {/* Ground fog */}
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
                            background: 'linear-gradient(0deg, rgba(195,208,220,0.5) 0%, rgba(195,208,220,0.3) 40%, transparent 100%)',
                            animation: 'fog-drift-1 9s ease-in-out 1s infinite',
                          }} />
                        </div>
                      )}

                      {/* SNOW animation */}
                      {(journey.weatherEffects || []).includes('snow') && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
                          <style>{`
                            @keyframes snow-fall {
                              0% { transform: translateY(-10px) translateX(0px) rotate(0deg); opacity: 0; }
                              10% { opacity: 0.9; }
                              90% { opacity: 0.7; }
                              100% { transform: translateY(110vh) translateX(var(--snow-drift)) rotate(360deg); opacity: 0; }
                            }
                          `}</style>
                          {Array.from({ length: 55 }).map((_, i) => {
                            const size = Math.random() * 6 + 3;
                            const drift = (Math.random() - 0.5) * 80;
                            return (
                              <div key={i} style={{
                                position: 'absolute',
                                left: `${Math.random() * 105 - 2}%`,
                                top: `-${Math.random() * 15}%`,
                                width: size,
                                height: size,
                                borderRadius: '50%',
                                background: 'rgba(230,240,255,0.9)',
                                boxShadow: '0 0 4px rgba(200,220,255,0.6)',
                                ['--snow-drift' as any]: `${drift}px`,
                                animation: `snow-fall ${Math.random() * 3 + 3}s linear ${Math.random() * 5}s infinite`,
                              }} />
                            );
                          })}
                          <div style={{ position:'absolute', inset:0, background:'rgba(200,220,255,0.07)' }} />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4" style={{ zIndex: 10 }}>
                         <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3" /> Localização Atual</label>
                            <input
                                value={journey.locationName}
                                onChange={(e) => updateJourney({ locationName: e.target.value })}
                                className="text-4xl md:text-6xl font-black text-white bg-transparent outline-none uppercase italic placeholder-white/20 w-full drop-shadow-lg"
                                placeholder="Nome do Local..."
                            />
                         </div>

                         <div className="flex flex-wrap gap-3 items-center">
                            {/* Day/Night toggle */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0,
                              background: 'rgba(0,0,0,0.5)',
                              backdropFilter: 'blur(12px)',
                              borderRadius: 16,
                              padding: 4,
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                              <button
                                onClick={() => updateJourney({ isNight: false })}
                                title="Dia"
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: 12,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: !journey.isNight ? 'rgba(255,220,80,0.25)' : 'transparent',
                                  color: !journey.isNight ? '#fcd34d' : 'rgba(255,255,255,0.35)',
                                  transition: 'all 0.2s',
                                  display: 'flex', alignItems: 'center', gap: 5,
                                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                                  boxShadow: !journey.isNight ? '0 0 12px rgba(252,211,77,0.3)' : 'none',
                                }}
                              >
                                <Sun style={{ width: 14, height: 14 }} /> Dia
                              </button>
                              <button
                                onClick={() => updateJourney({ isNight: true })}
                                title="Noite"
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: 12,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: journey.isNight ? 'rgba(100,120,255,0.25)' : 'transparent',
                                  color: journey.isNight ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                                  transition: 'all 0.2s',
                                  display: 'flex', alignItems: 'center', gap: 5,
                                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                                  boxShadow: journey.isNight ? '0 0 12px rgba(165,180,252,0.3)' : 'none',
                                }}
                              >
                                <Moon style={{ width: 14, height: 14 }} /> Noite
                              </button>
                            </div>

                            {/* Weather effect toggles */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              background: 'rgba(0,0,0,0.5)',
                              backdropFilter: 'blur(12px)',
                              borderRadius: 16,
                              padding: 4,
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                              {([
                                { id: 'rain' as const,  label: 'Chuva',      icon: <CloudRain style={{width:16,height:16}}/>,      activeColor: 'rgba(96,165,250,0.3)',  textColor: '#93c5fd', glow: 'rgba(96,165,250,0.4)' },
                                { id: 'storm' as const, label: 'Tempestade', icon: <CloudLightning style={{width:16,height:16}}/>,  activeColor: 'rgba(139,92,246,0.3)', textColor: '#c4b5fd', glow: 'rgba(139,92,246,0.4)' },
                                { id: 'fog' as const,   label: 'Névoa',      icon: <Cloud style={{width:16,height:16}}/>,           activeColor: 'rgba(148,163,184,0.3)', textColor: '#cbd5e1', glow: 'rgba(148,163,184,0.4)' },
                                { id: 'snow' as const,  label: 'Neve',       icon: <Snowflake style={{width:16,height:16}}/>,       activeColor: 'rgba(186,230,253,0.3)', textColor: '#bae6fd', glow: 'rgba(186,230,253,0.4)' },
                              ] as const).map(w => {
                                const currentEffects = journey.weatherEffects || [];
                                const isActive = currentEffects.includes(w.id);
                                return (
                                  <button
                                    key={w.id}
                                    onClick={() => {
                                      const newEffects = isActive
                                        ? currentEffects.filter(e => e !== w.id)
                                        : [...currentEffects, w.id];
                                      updateJourney({ weatherEffects: newEffects });
                                    }}
                                    title={w.label}
                                    style={{
                                      padding: '8px 10px',
                                      borderRadius: 12,
                                      border: isActive ? `1px solid ${w.textColor}55` : '1px solid transparent',
                                      cursor: 'pointer',
                                      background: isActive ? w.activeColor : 'transparent',
                                      color: isActive ? w.textColor : 'rgba(255,255,255,0.35)',
                                      transition: 'all 0.2s',
                                      display: 'flex', alignItems: 'center', gap: 5,
                                      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                                      boxShadow: isActive ? `0 0 14px ${w.glow}` : 'none',
                                    }}
                                  >
                                    {w.icon}
                                    <span style={{ fontSize: 10 }}>{w.label}</span>
                                    {isActive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: w.textColor, boxShadow: `0 0 5px ${w.textColor}` }} />}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Random Event Button */}
                            <button onClick={() => handleManualRoll(20, "Evento Aleatório")} className="flex items-center gap-2 px-6 py-4 bg-amber-600 hover:bg-amber-500 rounded-2xl text-white font-extrabold uppercase text-xs shadow-lg">
                                <Dices className="w-4 h-4" /> Checar Evento
                            </button>
                         </div>
                      </div>

                      {/* Image Edit Button (Top Right) */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ zIndex: 10 }}>
                         <ImagePickerButton value={journey.image} onUpdate={(val) => updateJourney({ image: val })} label="Fundo da Jornada" buttonLabel="Fundo" placement="bottom-left" />
                      </div>
                   </div>
                </div>

                {/* Right: Party Status & Notes */}
                <div className="flex flex-col gap-6 min-h-0">
                   {/* Party List */}
                   <div className="flex-1 glass-panel rounded-[2.5rem] p-6 overflow-y-auto custom-scroll flex flex-col border border-amber-900/20">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-extrabold uppercase text-slate-500 tracking-widest flex items-center gap-2"><Tent className="w-4 h-4" /> Grupo Ativo</h3>
                        <span className="text-xs font-bold bg-slate-900 px-2 py-1 rounded text-slate-400">{journeyCharacters.length} membros</span>
                      </div>

                      <div className="space-y-3">
                         {journeyCharacters.map(char => (
                            <div key={char.id} className="bg-slate-900/80/50 p-3 rounded-[1.5rem] border border-slate-800 flex items-center gap-4 hover:border-amber-600/50 transition-colors group">
                                <div className="relative cursor-pointer" onClick={() => setQuickEditChar(char)}>
                                   <img src={char.icon || undefined} className="w-14 h-14 rounded-2xl object-cover bg-slate-900" />
                                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity">
                                       <Edit3 className="w-5 h-5 text-white" />
                                   </div>
                                </div>
                                <div className="flex-1 space-y-1.5 min-w-0">
                                   <div className="flex justify-between items-center">
                                       <p className="font-extrabold uppercase text-white truncate text-xs">{char.name}</p>
                                       <div className="flex gap-1">
                                            {char.conditions.map(c => (
                                                <span key={c.name} className="w-2 h-2 rounded-full bg-rose-500" title={c.name} />
                                            ))}
                                       </div>
                                   </div>
                                   {/* HP — combat-style ±1/±5 */}
                                   <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                     <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:1 }}>
                                       <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                         <Heart style={{ width:9, height:9, color:'#f87171' }} />
                                         <span style={{ fontSize:7, fontWeight:700, color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.15em' }}>HP</span>
                                       </div>
                                       <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#fca5a5' }}>{char.currentHp}/{char.maxHp}</span>
                                     </div>
                                     <div style={{ height:7, background:'rgba(0,0,0,0.5)', borderRadius:99, overflow:'hidden', border:'1px solid rgba(239,68,68,0.2)' }}>
                                       <div style={{ height:'100%', borderRadius:99, width:`${Math.max(0,Math.min(100,(char.currentHp/char.maxHp)*100))}%`, background: char.currentHp/char.maxHp > 0.5 ? 'linear-gradient(90deg,#16a34a,#4ade80)' : char.currentHp/char.maxHp > 0.2 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)', boxShadow:'0 0 6px rgba(239,68,68,0.5)', transition:'width 0.5s ease' }} />
                                     </div>
                                     <div style={{ display:'flex', gap:2 }}>
                                       {([-5,-1,1,5] as const).map(d => (
                                         <button key={d} onClick={() => updateCharacterStats(char.id, { currentHp: Math.max(0, Math.min(char.maxHp, char.currentHp + d)) })}
                                           style={{ flex:1, padding:'2px 0', fontSize:8, fontWeight:900, borderRadius:4, cursor:'pointer', lineHeight:1.1, border:'1px solid', borderColor:d<0?'rgba(239,68,68,0.4)':'rgba(34,197,94,0.4)', background:d<0?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)', color:d<0?'#fca5a5':'#86efac' }}
                                         >{d>0?`+${d}`:d}</button>
                                       ))}
                                     </div>
                                   </div>
                                   {/* Aura — combat-style ±1/±5 */}
                                   <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                     <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:1 }}>
                                       <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                         <Zap style={{ width:9, height:9, color:'#60a5fa' }} />
                                         <span style={{ fontSize:7, fontWeight:700, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.15em' }}>AURA</span>
                                       </div>
                                       <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#93c5fd' }}>{char.currentAura}/{char.maxAura}</span>
                                     </div>
                                     <div style={{ height:7, background:'rgba(0,0,0,0.5)', borderRadius:99, overflow:'hidden', border:'1px solid rgba(59,130,246,0.2)' }}>
                                       <div style={{ height:'100%', borderRadius:99, width:`${Math.max(0,Math.min(100,(char.currentAura/char.maxAura)*100))}%`, background:'linear-gradient(90deg,#1d4ed8,#60a5fa)', boxShadow:'0 0 6px rgba(96,165,250,0.5)', transition:'width 0.5s ease' }} />
                                     </div>
                                     <div style={{ display:'flex', gap:2 }}>
                                       {([-5,-1,1,5] as const).map(d => (
                                         <button key={d} onClick={() => updateCharacterStats(char.id, { currentAura: Math.max(0, Math.min(char.maxAura, char.currentAura + d)) })}
                                           style={{ flex:1, padding:'1px 0', fontSize:7, fontWeight:900, borderRadius:3, cursor:'pointer', lineHeight:1.2, border:'1px solid', borderColor:d<0?'rgba(59,130,246,0.35)':'rgba(59,130,246,0.5)', background:d<0?'rgba(59,130,246,0.08)':'rgba(59,130,246,0.14)', color:'#93c5fd' }}
                                         >{d>0?`+${d}`:d}</button>
                                       ))}
                                     </div>
                                   </div>
                                   {/* Ammo — combat-style ±1/±5 */}
                                   {(char.maxAmmo || 0) > 0 && (
                                     <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                       <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:1 }}>
                                         <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                           <span style={{ fontSize:9 }}>🎯</span>
                                           <span style={{ fontSize:7, fontWeight:700, color:'#f97316', textTransform:'uppercase', letterSpacing:'0.15em' }}>MUNIÇÃO</span>
                                         </div>
                                         <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#fb923c' }}>{char.currentAmmo??0}/{char.maxAmmo}</span>
                                       </div>
                                       <div style={{ height:6, background:'rgba(0,0,0,0.5)', borderRadius:99, overflow:'hidden', border:'1px solid rgba(249,115,22,0.2)' }}>
                                         <div style={{ height:'100%', borderRadius:99, width:`${Math.max(0,Math.min(100,((char.currentAmmo??0)/char.maxAmmo!)*100))}%`, background:'linear-gradient(90deg,#c2410c,#f97316)', boxShadow:'0 0 5px rgba(249,115,22,0.5)', transition:'width 0.5s ease' }} />
                                       </div>
                                       <div style={{ display:'flex', gap:2 }}>
                                         {([-5,-1,1,5] as const).map(d => (
                                           <button key={d} onClick={() => updateCharacterStats(char.id, { currentAmmo: Math.max(0, Math.min(char.maxAmmo!, (char.currentAmmo??0) + d)) })}
                                             style={{ flex:1, padding:'1px 0', fontSize:7, fontWeight:900, borderRadius:3, cursor:'pointer', lineHeight:1.2, border:'1px solid', borderColor:d<0?'rgba(249,115,22,0.35)':'rgba(249,115,22,0.5)', background:d<0?'rgba(249,115,22,0.08)':'rgba(249,115,22,0.14)', color:'#fdba74' }}
                                           >{d>0?`+${d}`:d}</button>
                                         ))}
                                       </div>
                                     </div>
                                   )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => setManagingConditionsCharId(char.id)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors" title="Gerenciar Condições">
                                        <Activity className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setOpenInventoryCharId(char.id)} className="p-2 hover:bg-amber-900/40 rounded-lg text-slate-500 hover:text-amber-400 transition-colors" title="Abrir Inventário">
                                        <Briefcase className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                         ))}
                         {journeyCharacters.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center">
                                <Users className="w-12 h-12 mb-2" />
                                <p className="text-xs font-extrabold uppercase">Ninguém no grupo</p>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Notes — Diário de Bordo (crônica em pergaminho) */}
                   <div className="h-64 rounded-[2.5rem] p-6 flex flex-col mp-journey-chronicle">
                      <h3 className="mp-journey-chronicle__title text-sm font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2"><ScrollText className="w-4 h-4" /> Diário de Bordo</h3>
                      <textarea
                        value={journey.notes}
                        onChange={(e) => updateJourney({ notes: e.target.value })}
                        className="flex-1 rounded-2xl p-4 text-sm outline-none resize-none custom-scroll leading-relaxed"
                        placeholder="Que estas páginas guardem a sua aventura..."
                      />
                   </div>
                </div>
             </div>
             )} {/* end journeySubTab === 'mapa' */}

             {/* ─── COZINHAR ─── */}
             {journeySubTab === 'cozinhar' && (() => {
               const cookRecipes = (journey.recipes || []).filter(r => r.type === 'cozinhar');
               return (
                 <div className="flex-1 min-h-0 overflow-y-auto custom-scroll mp-journey-cards">
                   <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16, padding:'4px 2px' }}>
                     {cookRecipes.map(recipe => {
                       const canCraftBy = journeyCharacters.filter(char => {
                         return recipe.ingredients.every(ing => {
                           const item = resolveOwnedItems(char, items).find(it => it.name.toLowerCase() === ing.itemName.toLowerCase());
                           return (item?.quantity ?? 0) >= ing.quantity;
                         });
                       });
                       return (
                         <div key={recipe.id} style={{ border:'1px solid rgba(234,88,12,0.3)', borderRadius:20, overflow:'hidden', transition:'border-color 0.2s' }}
                           className="mp-jcard hover:border-orange-500/60">
                           {/* Header */}
                           <div style={{ background:'linear-gradient(135deg,rgba(234,88,12,0.2),rgba(180,60,5,0.3))', borderBottom:'1px solid rgba(234,88,12,0.2)', padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
                             <div style={{ width:44, height:44, borderRadius:12, background: recipe.resultImage ? 'transparent' : 'rgba(234,88,12,0.2)', border:'1px solid rgba(234,88,12,0.3)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                               {recipe.resultImage ? <img src={recipe.resultImage} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <ChefHat style={{ width:22, height:22, color:'#fb923c' }} />}
                             </div>
                             <div style={{ flex:1, minWidth:0 }}>
                               <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                                 <p className="mp-jcard__white" style={{ fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.04em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{recipe.name}</p>
                                 {recipe.difficulty && <span style={{ fontSize:8, fontWeight:700, color: recipe.difficulty==='fácil'?'#86efac':recipe.difficulty==='médio'?'#fcd34d':'#f87171', background: recipe.difficulty==='fácil'?'rgba(34,197,94,0.12)':recipe.difficulty==='médio'?'rgba(234,179,8,0.12)':'rgba(239,68,68,0.12)', border:`1px solid ${recipe.difficulty==='fácil'?'rgba(34,197,94,0.3)':recipe.difficulty==='médio'?'rgba(234,179,8,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:6, padding:'2px 6px', textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0 }}>{recipe.difficulty}</span>}
                               </div>
                               <p style={{ fontSize:10, color:'rgba(251,146,60,0.7)', fontWeight:600 }}>Cria: <span style={{ color:'#fb923c', fontWeight:700 }}>{recipe.resultQuantity}x {recipe.resultItemName}</span>{recipe.craftingTime ? ` · ${recipe.craftingTime}` : ''}</p>
                             </div>
                             <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                               <button onClick={() => { setEditRecipeData({...recipe}); setRecipeModal({ mode:'edit', recipe, type:'cozinhar' }); }} style={{ padding:'5px 7px', background:'rgba(234,88,12,0.15)', border:'1px solid rgba(234,88,12,0.25)', borderRadius:8, color:'#fb923c', cursor:'pointer' }} className="hover:brightness-125"><Edit3 style={{ width:12, height:12 }} /></button>
                               <button onClick={() => deleteRecipe(recipe.id)} style={{ padding:'5px 7px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#f87171', cursor:'pointer' }} className="hover:brightness-125"><Trash2 style={{ width:12, height:12 }} /></button>
                             </div>
                           </div>
                           {/* Body */}
                           <div style={{ padding:'14px 16px' }}>
                             {recipe.description && <p className="mp-jcard__muted" style={{ fontSize:11, marginBottom:12, lineHeight:1.5 }}>{recipe.description}</p>}
                             {/* Ingredients */}
                             <div style={{ marginBottom:12 }}>
                               <p style={{ fontSize:9, fontWeight:700, color:'rgba(251,146,60,0.6)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>Ingredientes</p>
                               <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                                 {recipe.ingredients.map((ing, i) => {
                                   const _craftChar = craftCharacterId ? characters.find(c=>c.id===craftCharacterId) : null;
                                   const haveCount = (_craftChar ? resolveOwnedItems(_craftChar, items).find(it=>it.name.toLowerCase()===ing.itemName.toLowerCase())?.quantity ?? 0 : 0);
                                   return (
                                     <span key={i} className="mp-jcard__white" style={{ fontSize:10, fontWeight:600, background:'rgba(234,88,12,0.1)', border:'1px solid rgba(234,88,12,0.2)', borderRadius:6, padding:'3px 8px' }}>
                                       {ing.quantity}× {ing.itemName}
                                     </span>
                                   );
                                 })}
                               </div>
                             </div>
                             {/* Craft button */}
                             <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                               <select value={craftCharacterId} onChange={e => setCraftCharacterId(e.target.value)} style={{ flex:1, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(234,88,12,0.25)', borderRadius:10, padding:'7px 10px', color: craftCharacterId ? '#fff' : 'rgba(255,255,255,0.35)', fontSize:11, fontWeight:600, outline:'none' }}>
                                 <option value="">Selecionar personagem...</option>
                                 {journeyCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                               </select>
                               <button
                                 onClick={() => craftCharacterId && executeRecipe(recipe, craftCharacterId)}
                                 disabled={!craftCharacterId || !canCraftBy.some(c => c.id === craftCharacterId)}
                                 style={{ padding:'8px 16px', background: craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? 'linear-gradient(135deg,rgba(234,88,12,0.7),rgba(180,60,5,0.9))' : 'rgba(60,60,60,0.4)', border:`1px solid ${craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? 'rgba(234,88,12,0.5)' : 'rgba(80,80,80,0.3)'}`, borderRadius:10, color: craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', cursor: craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:5, flexShrink:0 }}
                                 className="transition-all hover:brightness-110">
                                 <Flame style={{ width:13, height:13 }} /> Cozinhar
                               </button>
                             </div>
                             {canCraftBy.length > 0 && <p style={{ fontSize:9, color:'#86efac', marginTop:5, fontWeight:600 }}>✓ {canCraftBy.map(c=>c.name).join(', ')} pode{canCraftBy.length > 1 ? 'm' : ''} preparar</p>}
                           </div>
                         </div>
                       );
                     })}
                     {cookRecipes.length === 0 && (
                       <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:'60px 0', opacity:0.3 }}>
                         <ChefHat style={{ width:48, height:48, color:'#fb923c' }} />
                         <p className="mp-jcard__white" style={{ fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em' }}>Nenhuma receita cadastrada</p>
                         <p className="mp-jcard__muted" style={{ fontSize:11 }}>Clique em "Nova Receita" para adicionar</p>
                       </div>
                     )}
                   </div>
                 </div>
               );
             })()}

             {/* ─── FORJAR ─── */}
             {journeySubTab === 'forjar' && (() => {
               const forgeRecipes = (journey.recipes || []).filter(r => r.type === 'forjar');
               return (
                 <div className="flex-1 min-h-0 overflow-y-auto custom-scroll mp-journey-cards">
                   <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16, padding:'4px 2px' }}>
                     {forgeRecipes.map(recipe => {
                       const canCraftBy = journeyCharacters.filter(char => {
                         return recipe.ingredients.every(ing => {
                           const item = resolveOwnedItems(char, items).find(it => it.name.toLowerCase() === ing.itemName.toLowerCase());
                           return (item?.quantity ?? 0) >= ing.quantity;
                         });
                       });
                       return (
                         <div key={recipe.id} style={{ border:'1px solid rgba(168,85,247,0.3)', borderRadius:20, overflow:'hidden', transition:'border-color 0.2s' }}
                           className="mp-jcard hover:border-purple-500/60">
                           {/* Header */}
                           <div style={{ background:'linear-gradient(135deg,rgba(168,85,247,0.2),rgba(109,40,217,0.3))', borderBottom:'1px solid rgba(168,85,247,0.2)', padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
                             <div style={{ width:44, height:44, borderRadius:12, background: recipe.resultImage ? 'transparent' : 'rgba(168,85,247,0.2)', border:'1px solid rgba(168,85,247,0.3)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                               {recipe.resultImage ? <img src={recipe.resultImage} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Hammer style={{ width:22, height:22, color:'#c084fc' }} />}
                             </div>
                             <div style={{ flex:1, minWidth:0 }}>
                               <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                                 <p className="mp-jcard__white" style={{ fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.04em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{recipe.name}</p>
                                 {recipe.difficulty && <span style={{ fontSize:8, fontWeight:700, color: recipe.difficulty==='fácil'?'#86efac':recipe.difficulty==='médio'?'#fcd34d':'#f87171', background: recipe.difficulty==='fácil'?'rgba(34,197,94,0.12)':recipe.difficulty==='médio'?'rgba(234,179,8,0.12)':'rgba(239,68,68,0.12)', border:`1px solid ${recipe.difficulty==='fácil'?'rgba(34,197,94,0.3)':recipe.difficulty==='médio'?'rgba(234,179,8,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:6, padding:'2px 6px', textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0 }}>{recipe.difficulty}</span>}
                               </div>
                               <p style={{ fontSize:10, color:'rgba(192,132,252,0.7)', fontWeight:600 }}>Forja: <span style={{ color:'#c084fc', fontWeight:700 }}>{recipe.resultQuantity}x {recipe.resultItemName}</span>{recipe.craftingTime ? ` · ${recipe.craftingTime}` : ''}</p>
                             </div>
                             <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                               <button onClick={() => { setEditRecipeData({...recipe}); setRecipeModal({ mode:'edit', recipe, type:'forjar' }); }} style={{ padding:'5px 7px', background:'rgba(168,85,247,0.15)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:8, color:'#c084fc', cursor:'pointer' }} className="hover:brightness-125"><Edit3 style={{ width:12, height:12 }} /></button>
                               <button onClick={() => deleteRecipe(recipe.id)} style={{ padding:'5px 7px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#f87171', cursor:'pointer' }} className="hover:brightness-125"><Trash2 style={{ width:12, height:12 }} /></button>
                             </div>
                           </div>
                           {/* Body */}
                           <div style={{ padding:'14px 16px' }}>
                             {recipe.description && <p className="mp-jcard__muted" style={{ fontSize:11, marginBottom:12, lineHeight:1.5 }}>{recipe.description}</p>}
                             {/* Materials */}
                             <div style={{ marginBottom:12 }}>
                               <p style={{ fontSize:9, fontWeight:700, color:'rgba(192,132,252,0.6)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>Materiais</p>
                               <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                                 {recipe.ingredients.map((ing, i) => (
                                   <span key={i} className="mp-jcard__white" style={{ fontSize:10, fontWeight:600, background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:6, padding:'3px 8px' }}>
                                     {ing.quantity}× {ing.itemName}
                                   </span>
                                 ))}
                               </div>
                             </div>
                             {/* Forge button */}
                             <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                               <select value={craftCharacterId} onChange={e => setCraftCharacterId(e.target.value)} style={{ flex:1, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:10, padding:'7px 10px', color: craftCharacterId ? '#fff' : 'rgba(255,255,255,0.35)', fontSize:11, fontWeight:600, outline:'none' }}>
                                 <option value="">Selecionar personagem...</option>
                                 {journeyCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                               </select>
                               <button
                                 onClick={() => craftCharacterId && executeRecipe(recipe, craftCharacterId)}
                                 disabled={!craftCharacterId || !canCraftBy.some(c => c.id === craftCharacterId)}
                                 style={{ padding:'8px 16px', background: craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? 'linear-gradient(135deg,rgba(168,85,247,0.6),rgba(109,40,217,0.8))' : 'rgba(60,60,60,0.4)', border:`1px solid ${craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? 'rgba(168,85,247,0.5)' : 'rgba(80,80,80,0.3)'}`, borderRadius:10, color: craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', cursor: craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:5, flexShrink:0 }}
                                 className="transition-all hover:brightness-110">
                                 <Hammer style={{ width:13, height:13 }} /> Forjar
                               </button>
                             </div>
                             {canCraftBy.length > 0 && <p style={{ fontSize:9, color:'#86efac', marginTop:5, fontWeight:600 }}>✓ {canCraftBy.map(c=>c.name).join(', ')} pode{canCraftBy.length > 1 ? 'm' : ''} forjar</p>}
                           </div>
                         </div>
                       );
                     })}
                     {forgeRecipes.length === 0 && (
                       <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:'60px 0', opacity:0.3 }}>
                         <Hammer style={{ width:48, height:48, color:'#c084fc' }} />
                         <p className="mp-jcard__white" style={{ fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em' }}>Nenhuma forja cadastrada</p>
                         <p className="mp-jcard__muted" style={{ fontSize:11 }}>Clique em "Nova Receita de Forja" para adicionar</p>
                       </div>
                     )}
                   </div>
                 </div>
               );
             })()}

             {/* ─── UPGRADES (Loja) ─── */}
             {journeySubTab === 'upgrades' && (() => {
               const rarityConf = { common:{border:'rgba(148,163,184,0.35)',bg:'rgba(15,23,42,0.92)',label:'#94a3b8',glow:'rgba(148,163,184,0.1)',badge:'COMUM'}, uncommon:{border:'rgba(52,211,153,0.5)',bg:'rgba(5,25,20,0.94)',label:'#34d399',glow:'rgba(52,211,153,0.18)',badge:'INCOMUM'}, rare:{border:'rgba(99,102,241,0.55)',bg:'rgba(8,8,30,0.95)',label:'#818cf8',glow:'rgba(99,102,241,0.22)',badge:'RARO'}, legendary:{border:'rgba(251,191,36,0.7)',bg:'rgba(20,14,2,0.96)',label:'#fbbf24',glow:'rgba(251,191,36,0.35)',badge:'LENDÁRIO'} };
               const offerIcons: Record<UpgradeOfferType, string> = { vitalidade:'❤', aura:'⚡', reroll:'🎲', par:'✌', trinca:'🔱', quadra:'♦', nova_carta:'🃏', desejo:'✨' };
               const luckConf = { sorte:{ label:'🍀 Sorte', color:'#34d399', bg:'rgba(52,211,153,0.15)', border:'rgba(52,211,153,0.4)' }, neutro:{ label:'⚖ Neutro', color:'#94a3b8', bg:'rgba(148,163,184,0.1)', border:'rgba(148,163,184,0.3)' }, azar:{ label:'💀 Azar', color:'#f87171', bg:'rgba(248,113,113,0.12)', border:'rgba(248,113,113,0.4)' } };
               const journeyParty = characters.filter(c => c.isInJourney);
               return (
                 <div style={{ flex:1, display:'flex', flexDirection:'column', gap:20, minHeight:0, overflowY:'auto', paddingBottom:20 }} className="custom-scroll mp-journey-cards">
                   {/* Shop header */}
                   <div style={{ display:'flex', gap:16, alignItems:'stretch', flexWrap:'wrap' }}>
                     {/* Config panel */}
                     <div className="mp-jcard__panel" style={{ flex:'1 1 320px', border:'1px solid rgba(16,185,129,0.2)', borderRadius:20, padding:'18px 20px', display:'flex', flexDirection:'column', gap:14, boxShadow:'0 0 30px rgba(16,185,129,0.05)' }}>
                       <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                         <ShoppingCart style={{ width:16, height:16, color:'#34d399' }} />
                         <span style={{ fontSize:11, fontWeight:800, color:'#34d399', textTransform:'uppercase', letterSpacing:'0.2em' }}>Configurar Loja</span>
                       </div>

                       {/* Offer count */}
                       <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                         <label className="mp-jcard__faint" style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', width:90, flexShrink:0 }}>Nº de ofertas</label>
                         <div style={{ display:'flex', gap:4 }}>
                           {[2,3,4,5,6,8].map(n => (
                             <button key={n} onClick={() => setUpgradeShopOfferCount(n)}
                               style={{ width:30, height:30, borderRadius:8, fontWeight:800, fontSize:11, cursor:'pointer', transition:'all 0.15s',
                                 background: upgradeShopOfferCount===n ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.04)',
                                 border: upgradeShopOfferCount===n ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                 color: upgradeShopOfferCount===n ? '#34d399' : 'rgba(255,255,255,0.35)',
                               }}>{n}</button>
                           ))}
                         </div>
                       </div>

                       {/* Luck selector */}
                       <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                         <label className="mp-jcard__faint" style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', width:90, flexShrink:0 }}>Sorte</label>
                         <div style={{ display:'flex', gap:5 }}>
                           {(['sorte','neutro','azar'] as UpgradeLuck[]).map(l => (
                             <button key={l} onClick={() => setUpgradeShopLuck(l)}
                               style={{ padding:'5px 12px', borderRadius:10, fontWeight:800, fontSize:9, textTransform:'uppercase', letterSpacing:'0.08em', cursor:'pointer', transition:'all 0.15s',
                                 background: upgradeShopLuck===l ? luckConf[l].bg : 'rgba(255,255,255,0.04)',
                                 border: upgradeShopLuck===l ? `1px solid ${luckConf[l].border}` : '1px solid rgba(255,255,255,0.08)',
                                 color: upgradeShopLuck===l ? luckConf[l].color : 'rgba(255,255,255,0.35)',
                               }}>{luckConf[l].label}</button>
                           ))}
                         </div>
                       </div>

                       {/* Luck description */}
                       <div className="mp-jcard__faint" style={{ fontSize:9, lineHeight:1.5, background:'rgba(0,0,0,0.04)', border:'1px solid rgba(34,26,15,0.1)', borderRadius:10, padding:'8px 12px' }}>
                         {upgradeShopLuck === 'sorte' && '🍀 Itens raros têm mais chance de aparecer e recebem descontos frequentes. Sorte favorece os corajosos!'}
                         {upgradeShopLuck === 'neutro' && '⚖ Sorteio totalmente aleatório. Qualquer item pode aparecer com variação leve de preço (±20%).'}
                         {upgradeShopLuck === 'azar' && '💀 Itens comuns dominam as ofertas e os preços sobem. Só para quem aguenta o tranco.'}
                       </div>

                       {/* Generate / Reroll buttons */}
                       <div style={{ display:'flex', gap:8, marginTop:2 }}>
                         <button onClick={generateUpgradeOffers}
                           style={{ flex:1, padding:'10px 0', borderRadius:12, fontWeight:800, fontSize:10, textTransform:'uppercase', letterSpacing:'0.12em', cursor:'pointer',
                             background:'linear-gradient(135deg,rgba(16,185,129,0.5),rgba(5,150,105,0.7))',
                             border:'1px solid rgba(16,185,129,0.5)', color:'#fff',
                             boxShadow:'0 0 16px rgba(16,185,129,0.25)',
                           }} className="hover:brightness-110 transition-all">
                           <ShoppingCart style={{ width:12, height:12, display:'inline', marginRight:5 }} />
                           {upgradeShopGenerated ? 'Nova Loja' : 'Abrir Loja'}
                         </button>
                         {upgradeShopGenerated && (
                           <button onClick={rerollUpgradeShop}
                             style={{ padding:'10px 14px', borderRadius:12, fontWeight:800, fontSize:10, textTransform:'uppercase', cursor:'pointer',
                               background:'rgba(99,102,241,0.18)', border:'1px solid rgba(99,102,241,0.4)', color:'#818cf8',
                             }} className="hover:brightness-110 transition-all" title="Reroll — refaz todas as ofertas">
                             <Shuffle style={{ width:14, height:14 }} />
                           </button>
                         )}
                       </div>
                     </div>

                     {/* Currency panel */}
                     <div className="mp-jcard__panel" style={{ flex:'0 0 220px', border:'1px solid rgba(251,191,36,0.2)', borderRadius:20, padding:'18px 20px', display:'flex', flexDirection:'column', gap:12, boxShadow:'0 0 20px rgba(251,191,36,0.04)' }}>
                       <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                         <Coins style={{ width:16, height:16, color:'#fbbf24' }} />
                         <span style={{ fontSize:11, fontWeight:800, color:'#fbbf24', textTransform:'uppercase', letterSpacing:'0.2em' }}>Moedas do Personagem</span>
                       </div>
                       {/* Target character — only journey party */}
                       <div>
                         <label className="mp-jcard__faint" style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:5 }}>Personagem (jornada)</label>
                         <select value={upgradeTargetCharId} onChange={e => setUpgradeTargetCharId(e.target.value)}
                           style={{ width:'100%', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'6px 10px', color:'#fff', fontSize:10, fontWeight:700, outline:'none' }}>
                           <option value="">— Personagem —</option>
                           {journeyParty.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                         {journeyParty.length === 0 && <p style={{ fontSize:8, color:'#f87171', marginTop:4 }}>⚠ Nenhum personagem ativo na jornada</p>}
                       </div>
                       {upgradeTargetCharId && (() => {
                         const curr = characterCurrencies[upgradeTargetCharId] || 0;
                         const selChar = journeyParty.find(c => c.id === upgradeTargetCharId);
                         return selChar ? (
                           <>
                             <div style={{ fontSize:36, fontWeight:900, color:'#fbbf24', fontFamily:"'JetBrains Mono',monospace", textShadow:'0 0 20px rgba(251,191,36,0.5)', lineHeight:1 }}>{curr}<span style={{ fontSize:14, color:'rgba(251,191,36,0.5)', marginLeft:6 }}>🪙</span></div>
                             <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                               {[10,25,50,100].map(v => (
                                 <button key={v} onClick={() => setCharacterCurrencies(prev => ({ ...prev, [upgradeTargetCharId]: (prev[upgradeTargetCharId]||0) + v }))}
                                   style={{ flex:'1 1 40px', padding:'4px 0', borderRadius:8, fontSize:9, fontWeight:800, textTransform:'uppercase', cursor:'pointer',
                                     background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.2)', color:'#fbbf24',
                                   }} className="hover:brightness-125 transition-all">+{v}</button>
                               ))}
                             </div>
                             <button onClick={() => setCharacterCurrencies(prev => ({ ...prev, [upgradeTargetCharId]: 0 }))}
                               style={{ padding:'4px 0', borderRadius:8, fontSize:9, fontWeight:700, textTransform:'uppercase', cursor:'pointer', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'rgba(248,113,113,0.6)' }}
                               className="hover:brightness-125 transition-all">Zerar</button>
                           </>
                         ) : null;
                       })()}
                     </div>
                   </div>

                   {/* Offers grid */}
                   {!upgradeShopGenerated && (
                     <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:'60px 0', opacity:0.35 }}>
                       <ShoppingCart style={{ width:52, height:52, color:'#34d399' }} />
                       <p className="mp-jcard__white" style={{ fontSize:14, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em' }}>A loja está fechada</p>
                       <p className="mp-jcard__muted" style={{ fontSize:11 }}>Configure as opções acima e clique em "Abrir Loja"</p>
                       {journeyParty.length === 0 && <p style={{ fontSize:11, color:'#f87171', fontWeight:700 }}>⚠ Marque personagens como "Em Jornada" para usar os upgrades</p>}
                     </div>
                   )}
                   {upgradeShopGenerated && upgradeShopOffers.length === 0 && (
                     <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'40px 0', opacity:0.4 }}>
                       <p style={{ fontSize:13, fontWeight:700, color:'#34d399', textTransform:'uppercase', letterSpacing:'0.15em' }}>Todas as ofertas foram compradas!</p>
                     </div>
                   )}
                   {upgradeShopGenerated && upgradeShopOffers.length > 0 && (
                     <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px,1fr))', gap:14 }}>
                       {upgradeShopOffers.map((offer, idx) => {
                         const rc = rarityConf[offer.rarity];
                         const icon = offerIcons[offer.type];
                         const hasDiscount = offer.priceModifier < 0.95;
                         const hasHike = offer.priceModifier > 1.05;
                         const charCurr = upgradeTargetCharId ? (characterCurrencies[upgradeTargetCharId] || 0) : 0;
                         const canBuy = upgradeTargetCharId && charCurr >= offer.finalPrice;
                         return (
                           <div key={offer.id}
                             className="mp-jcard mp-upgrade-card"
                             style={{ '--deal-delay': `${idx * 0.07}s`, border:`1px solid ${rc.border}`, borderRadius:18, overflow:'hidden',
                               boxShadow:`0 4px 24px rgba(0,0,0,0.6), 0 0 30px ${rc.glow}`,
                               display:'flex', flexDirection:'column',
                             } as React.CSSProperties}
                           >
                             {/* Top accent */}
                             <div style={{ height:3, background:`linear-gradient(90deg, transparent, ${rc.label}, transparent)` }} />

                             {/* Card body */}
                             <div style={{ padding:'16px 16px 14px', display:'flex', flexDirection:'column', gap:10, flex:1 }}>
                               {/* Header */}
                               <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                 <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                   <div style={{ width:38, height:38, borderRadius:10, background:`${rc.label}18`, border:`1px solid ${rc.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
                                   <div>
                                     <p className="mp-jcard__white" style={{ fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.04em', lineHeight:1 }}>{offer.label}</p>
                                     <span style={{ fontSize:7, fontWeight:700, color:rc.label, background:`${rc.label}14`, border:`1px solid ${rc.border}`, borderRadius:4, padding:'1px 5px', textTransform:'uppercase', letterSpacing:'0.1em' }}>{rc.badge}</span>
                                   </div>
                                 </div>
                               </div>

                               {/* Description */}
                               <p className="mp-jcard__muted" style={{ fontSize:10, lineHeight:1.5 }}>{offer.description}</p>

                               {/* Price */}
                               <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto', paddingTop:10, borderTop:`1px solid ${rc.border}66` }}>
                                 <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                                   {hasDiscount && (
                                     <span className="mp-jcard__faint" style={{ fontSize:9, textDecoration:'line-through', fontFamily:"'JetBrains Mono',monospace" }}>{offer.basePrice}🪙</span>
                                   )}
                                   <span style={{ fontSize:18, fontWeight:900, color: hasDiscount ? '#34d399' : hasHike ? '#f87171' : '#fbbf24', fontFamily:"'JetBrains Mono',monospace", textShadow:`0 0 12px ${hasDiscount ? 'rgba(52,211,153,0.5)' : hasHike ? 'rgba(248,113,113,0.4)' : 'rgba(251,191,36,0.4)'}` }}>{offer.finalPrice}🪙</span>
                                 </div>
                                 {/* Price modifier badge */}
                                 <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                   {hasDiscount && (
                                     <span style={{ fontSize:8, fontWeight:800, color:'#34d399', background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:6, padding:'2px 6px', display:'flex', alignItems:'center', gap:3 }}>
                                       <TrendingDown style={{ width:8, height:8 }} />-{Math.round((1-offer.priceModifier)*100)}%
                                     </span>
                                   )}
                                   {hasHike && (
                                     <span style={{ fontSize:8, fontWeight:800, color:'#f87171', background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:6, padding:'2px 6px', display:'flex', alignItems:'center', gap:3 }}>
                                       <TrendingUp style={{ width:8, height:8 }} />+{Math.round((offer.priceModifier-1)*100)}%
                                     </span>
                                   )}
                                   {!hasDiscount && !hasHike && (
                                     <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.25)', padding:'2px 6px' }}>preço normal</span>
                                   )}
                                 </div>
                               </div>

                               {/* Buy button */}
                               <button
                                 onClick={() => upgradeTargetCharId && purchaseUpgrade(offer, upgradeTargetCharId)}
                                 disabled={!canBuy}
                                 style={{ width:'100%', padding:'9px 0', borderRadius:10, fontWeight:800, fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', cursor: canBuy ? 'pointer' : 'not-allowed',
                                   background: canBuy ? `linear-gradient(135deg,${rc.label}44,${rc.label}22)` : 'rgba(255,255,255,0.03)',
                                   border: canBuy ? `1px solid ${rc.border}` : '1px solid rgba(255,255,255,0.07)',
                                   color: canBuy ? rc.label : 'rgba(255,255,255,0.2)',
                                   transition:'all 0.2s',
                                 }} className="hover:brightness-125">
                                 {!upgradeTargetCharId ? '— Selecione um personagem —' : charCurr < offer.finalPrice ? `❌ Faltam ${offer.finalPrice - charCurr}🪙` : `✦ Comprar para ${characters.find(c=>c.id===upgradeTargetCharId)?.name || '...'}`}
                               </button>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}

                   {/* Rarities legend */}
                   {upgradeShopGenerated && (
                     <div style={{ display:'flex', gap:8, flexWrap:'wrap', opacity:0.55 }}>
                       <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.12em', alignSelf:'center' }}>Raridades:</span>
                       {Object.entries(rarityConf).map(([k,v]) => (
                         <span key={k} style={{ fontSize:8, fontWeight:700, color:v.label, background:`${v.label}12`, border:`1px solid ${v.border}`, borderRadius:5, padding:'2px 7px', textTransform:'uppercase' }}>{v.badge}</span>
                       ))}
                     </div>
                   )}
                 </div>
               );
             })()}

          </div>
  );
};

export default JourneyTab;
