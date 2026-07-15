import React from 'react';
import { Check, Clock3, LogOut, RefreshCw, Search, Shield, Sparkles, Swords, Wifi, X } from 'lucide-react';
import type { Character } from '../../types';
import { OnlineAuth } from '../../online/authClient';
import { PlayerOnline } from '../../online/playerClient';
import type { PlayerActionView, PlayerCampaignView, PublicParticipant } from '../../online/playerView';
import SceneBackdrop from '../../tabs/cena/SceneBackdrop';
import PauseCurtain from '../../tabs/cena/PauseCurtain';
import MapBoard from '../../tabs/cena/MapBoard';
import './PlayerDashboard.css';

type RequestItem = { id: string; action_id: string; status: string; created_at: string };

const needsTarget = (action: PlayerActionView) => action.requiresAim || action.target.type === 'um_alvo' || action.target.type === 'multiplos_alvos';
const actionTags = (action: PlayerActionView) => Array.isArray(action.tags) ? action.tags : [];
const isReaction = (action: PlayerActionView) => actionTags(action).some(tag => /rea[cç][aã]o/i.test(tag));

function asMapCharacter(person: PublicParticipant, masked = false): Character {
  const resource = person as any;
  return {
    ...person,
    currentHp: masked ? 1 : resource.currentHp ?? 1,
    maxHp: masked ? 1 : resource.maxHp ?? 1,
    currentAura: resource.currentAura ?? 0,
    maxAura: resource.maxAura ?? 0,
    currentAmmo: resource.currentAmmo ?? 0,
    maxAmmo: resource.maxAmmo ?? 0,
    baseInitiative: resource.baseInitiative ?? 0,
  } as Character;
}

export default function PlayerDashboard() {
  const [view, setView] = React.useState<PlayerCampaignView | null>(null);
  const [requests, setRequests] = React.useState<RequestItem[]>([]);
  const [notice, setNotice] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [moving, setMoving] = React.useState(false);
  const [requesting, setRequesting] = React.useState(false);
  const [armed, setArmed] = React.useState<PlayerActionView | null>(null);
  const [targets, setTargets] = React.useState<string[]>([]);
  const [secondary, setSecondary] = React.useState('');
  const [destination, setDestination] = React.useState({ x: 50, y: 50 });
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const load = React.useCallback(async (quiet = false) => {
    try {
      const [state, history] = await Promise.all([PlayerOnline.state(), PlayerOnline.actionRequests()]);
      setView(state); setRequests(history);
      if (!quiet) setNotice('');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Falha ao carregar a mesa.'); }
  }, []);

  React.useEffect(() => {
    void load();
    const timer = window.setInterval(() => document.visibilityState === 'visible' && void load(true), 2500);
    return () => window.clearInterval(timer);
  }, [load]);

  if (!view) return <main className="pd-loading"><span className="pd-loader" /><h1>Preparando sua mesa</h1><p>{notice || 'Sincronizando personagem e cena…'}</p></main>;

  const publicPeople: PublicParticipant[] = [{ ...view.character, position: view.position }, ...view.allies, ...view.enemies];
  const enemyIds = view.enemies.map(person => person.id);
  const participants = publicPeople.map(person => asMapCharacter(person, enemyIds.includes(person.id)));
  const tokens = Object.fromEntries(publicPeople.filter(person => person.position).map(person => [person.id, person.position! ]));
  const actionAllowed = (action: PlayerActionView) => view.permissions.canAct || (isReaction(action) && view.permissions.canReact && !view.encounter.isPaused);
  const targetableIds = armed && actionAllowed(armed) && needsTarget(armed) ? publicPeople.map(person => person.id) : [];
  const pending = requests.filter(item => item.status === 'pending').length;
  const actions = (Array.isArray(view.actions) ? view.actions : []).filter(action => !search || `${action.name} ${actionTags(action).join(' ')}`.toLowerCase().includes(search.toLowerCase()));

  const selectToken = (id: string) => {
    if (!armed || !needsTarget(armed) || !actionAllowed(armed)) return;
    if (armed.target.type === 'multiplos_alvos' && !armed.requiresAim) {
      setTargets(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id].slice(0, armed.target.maxTargets));
    } else setTargets([id]);
  };
  const moveToken = async (id: string, pos: { x: number; y: number }) => {
    if (id !== view.character.id || !view.permissions.canMove || moving) return;
    setMoving(true);
    try { await PlayerOnline.move(pos.x, pos.y, view.revision); await load(true); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Não foi possível mover o token.'); }
    finally { setMoving(false); }
  };
  const arm = (action: PlayerActionView) => {
    if (!actionAllowed(action)) return;
    setArmed(current => current?.id === action.id ? null : action); setTargets([]); setSecondary('');
  };
  const sendAction = async () => {
    if (!armed || requesting || !actionAllowed(armed) || (needsTarget(armed) && !targets.length)) return;
    setRequesting(true);
    try {
      await PlayerOnline.requestAction(armed.id, targets, secondary || undefined, armed.requiresDestination ? destination : undefined);
      setNotice(`${armed.name} foi enviada ao mestre.`); setArmed(null); setTargets([]); await load(true);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Não foi possível solicitar a ação.'); }
    finally { setRequesting(false); }
  };

  const turnText = !view.encounter.isActive ? 'EXPLORAÇÃO LIVRE' : view.permissions.isOwnTurn ? 'SEU TURNO' : 'AGUARDANDO TURNO';
  return <main className={`cena-shell player-scene is-combat ${view.scene.isNight ? 'is-night' : ''}`} style={{ height: '100dvh', minHeight: '100dvh' }}>
    <SceneBackdrop image={view.scene.image} imagePosition={view.scene.imagePosition} combat={view.encounter.isActive} />
    <PauseCurtain isPaused={view.encounter.isPaused} image={view.scene.pausedImage || view.scene.image} imagePosition={view.scene.pausedImagePosition || view.scene.imagePosition} participants={participants} display={view.scene.pausedDisplay} />

    <header className="player-scene__bar">
      <div><Sparkles size={16}/><span><small>{view.scene.subtitle || 'CENA ATUAL'}</small><strong>{view.scene.locationName}</strong></span></div>
      <b className={view.permissions.isOwnTurn ? 'is-own' : ''}>{turnText}{view.encounter.isActive && ` · RODADA ${view.encounter.round}`}</b>
      <nav><span><Wifi size={13}/> AO VIVO</span><button title="Atualizar" onClick={() => load()}><RefreshCw size={16}/></button><button title="Sair" onClick={() => OnlineAuth.logout().finally(() => window.location.assign('/?view=login'))}><LogOut size={16}/></button></nav>
    </header>

    {notice && <div className="player-scene__notice">{notice}<button onClick={() => setNotice('')}><X size={14}/></button></div>}
    {armed && <div className="player-scene__aim"><CrosshairIcon/><span><small>AÇÃO PREPARADA</small><strong>{armed.name}</strong><em>{needsTarget(armed) ? targets.length ? `${targets.length} alvo(s) marcado(s)` : 'Selecione no mapa' : 'Pronta para enviar'}</em></span></div>}

    <section className="cena-arena-column player-scene__arena">
      <div className="cena-arena-stage">
        <MapBoard image={view.scene.image} imagePosition={view.scene.imagePosition} participants={participants} tokens={tokens} activeId={view.encounter.currentTurnId} combat={view.encounter.isActive} enemyIds={enemyIds} movableIds={view.permissions.canMove ? [view.character.id] : []} maskEnemyResources targetableIds={targetableIds} selectedTargetId={targets[0] ?? null} areaPreviewIds={targets.slice(1)} onMoveToken={moveToken} onSelect={selectToken}/>
      </div>
    </section>

    <aside className="cena-command-deck player-deck">
      <section className="player-deck__identity">
        <i style={view.character.icon ? { backgroundImage: `url(${view.character.icon})`, backgroundPosition: view.character.iconPosition } : undefined}>{!view.character.icon && view.character.name[0]}</i>
        <div><small>JOGANDO COMO</small><strong>{view.character.name}</strong><span>PV {view.character.currentHp}/{view.character.maxHp} · AURA {view.character.currentAura}/{view.character.maxAura}</span></div>
        <Shield size={18}/>
      </section>
      <section className="cena-deck-actions player-deck__actions">
        <header><div><small>ARSENAL PESSOAL</small><strong>COMANDOS</strong></div><label><Search size={13}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"/></label></header>
        <div className="player-deck__list">{actions.map(action => <button key={action.id} data-category={action.category} className={`cena-command ${armed?.id === action.id ? 'is-open' : ''}`} disabled={!actionAllowed(action)} onClick={() => arm(action)}>{action.icon ? <i style={{ backgroundImage: `url(${action.icon})` }}/> : <Swords size={17}/>}<span className="cena-command__copy"><strong>{action.name}</strong><small>{actionTags(action).slice(0,2).join(' · ') || action.category}</small></span>{isReaction(action) && <b>R</b>}</button>)}{!actions.length && <p>Nenhuma ação no arsenal.</p>}</div>
      </section>
      {armed && <section className="player-deck__confirm">
        <p>{armed.description || 'Sem descrição.'}</p>
        {armed.requiresSecondaryTarget && <label>SEGUNDO ALVO<select value={secondary} onChange={e => setSecondary(e.target.value)}><option value="">Selecione…</option>{publicPeople.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>}
        {armed.requiresDestination && <label>DESTINO<div><input type="number" min="0" max="100" value={destination.x} onChange={e => setDestination({...destination,x:Number(e.target.value)})}/><input type="number" min="0" max="100" value={destination.y} onChange={e => setDestination({...destination,y:Number(e.target.value)})}/></div></label>}
        <button disabled={requesting || (needsTarget(armed) && !targets.length) || (armed.requiresSecondaryTarget && !secondary)} onClick={sendAction}><Check size={16}/>{requesting ? 'ENVIANDO…' : 'SOLICITAR AO MESTRE'}</button>
      </section>}
      <button className="player-deck__history" onClick={() => setHistoryOpen(value => !value)}><Clock3 size={15}/> HISTÓRICO {pending > 0 && <b>{pending}</b>}</button>
      {historyOpen && <section className="player-deck__history-list">{requests.slice(0,8).map(item => <div key={item.id} className={`is-${item.status}`}><span>{view.actions.find(action => action.id === item.action_id)?.name || 'Ação'}</span><b>{item.status === 'approved' ? 'APROVADA' : item.status === 'rejected' ? 'RECUSADA' : 'PENDENTE'}</b></div>)}</section>}
    </aside>
  </main>;
}

function CrosshairIcon(){ return <span className="player-scene__crosshair">＋</span>; }

export class PlayerDashboardBoundary extends React.Component<React.PropsWithChildren, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('PlayerDashboard render failed', error); }
  render() {
    if (!this.state.error) return this.props.children;
    return <main className="pd-loading"><h1>Não foi possível montar a Cena</h1><p>Os dados foram preservados. Atualize a página; se continuar, envie ao mestre a mensagem abaixo.</p><code>{this.state.error.message}</code><button onClick={() => window.location.reload()}>ATUALIZAR</button></main>;
  }
}
