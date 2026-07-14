import React from 'react';
import { LogOut, RefreshCw, Shield, Sparkles, Swords, UserRound } from 'lucide-react';
import { OnlineAuth } from '../../online/authClient';
import { PlayerOnline } from '../../online/playerClient';
import type { PlayerCampaignView, PublicAlly, PublicParticipant } from '../../online/playerView';

const c = { bg: '#080b12', panel: '#111722', line: '#293244', gold: '#d2a64c', text: '#edf2f7', muted: '#8e9aac', hp: '#e05f68', aura: '#55a8e8', ammo: '#d7a83f' };
const button: React.CSSProperties = { color: c.text, background: '#111827cc', border: `1px solid ${c.line}`, borderRadius: 10, padding: 9, cursor: 'pointer' };

function Meter({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, current / max * 100)) : 0;
  return <div style={{ display: 'grid', gap: 5 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><b>{label}</b><span>{current} / {max}</span></div><div style={{ height: 8, borderRadius: 20, overflow: 'hidden', background: '#06080d' }}><div style={{ height: '100%', width: `${pct}%`, background: color }} /></div></div>;
}
function Portrait({ person }: { person: PublicParticipant }) {
  return person.icon ? <img src={person.icon} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', objectPosition: person.iconPosition }} /> : <div style={{ width: 52, height: 52, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#202838' }}><UserRound /></div>;
}
function Conditions({ person }: { person: PublicParticipant }) {
  return <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>{person.conditions?.length ? person.conditions.map((value: any, index) => <span key={value.id ?? value.name ?? index} style={{ padding: '3px 6px', borderRadius: 7, color: '#f4d995', background: '#3b2c16', fontSize: 10 }}>{value.name ?? value.label ?? String(value)}</span>) : <span style={{ color: c.muted, fontSize: 11 }}>Sem condições</span>}</div>;
}
function Ally({ ally }: { ally: PublicAlly }) {
  return <article style={{ padding: 13, border: `1px solid ${c.line}`, borderRadius: 14, background: c.panel }}><div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 11 }}><Portrait person={ally} /><div><b>{ally.name}</b><Conditions person={ally} /></div></div><div style={{ display: 'grid', gap: 7 }}><Meter label="HP" current={ally.currentHp} max={ally.maxHp} color={c.hp} /><Meter label="Aura" current={ally.currentAura} max={ally.maxAura} color={c.aura} /></div></article>;
}

export default function PlayerDashboard() {
  const [view, setView] = React.useState<PlayerCampaignView | null>(null);
  const [error, setError] = React.useState('');
  const [moving, setMoving] = React.useState(false);
  const [requesting, setRequesting] = React.useState<string | null>(null);
  const load = React.useCallback(async () => { try { setView(await PlayerOnline.state()); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao carregar.'); } }, []);
  React.useEffect(() => { load(); const timer = window.setInterval(() => document.visibilityState === 'visible' && load(), 3000); return () => window.clearInterval(timer); }, [load]);
  if (!view) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: c.bg, color: c.text }}><div>{error || 'Carregando seu personagem…'}</div></main>;
  const own = view.character;
  const turnLabel = !view.encounter.isActive ? 'Exploração livre' : view.permissions.isOwnTurn ? 'É o seu turno' : 'Aguardando outro turno';
  const tokenPosition = view.position;
  const move = async (dx: number, dy: number) => {
    if (!view.permissions.canMove || moving) return;
    setMoving(true);
    try { await PlayerOnline.move(tokenPosition.x + dx, tokenPosition.y + dy, view.revision); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao mover.'); await load(); }
    finally { setMoving(false); }
  };
  const requestAction = async (actionId: string) => {
    setRequesting(actionId);
    try { await PlayerOnline.requestAction(actionId); setError('Solicitação enviada ao mestre.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao solicitar ação.'); }
    finally { setRequesting(null); }
  };
  return <main style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: 'Inter, sans-serif' }}>
    <header style={{ minHeight: 210, padding: '22px clamp(20px,5vw,70px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: view.scene.image ? `linear-gradient(90deg,rgba(8,11,18,.96),rgba(8,11,18,.45)),url(${view.scene.image}) center/cover` : 'linear-gradient(135deg,#151b29,#090c13)', borderBottom: `1px solid ${c.line}` }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: c.gold, letterSpacing: '.18em', fontWeight: 900, fontSize: 11 }}>RPG CODEX · JOGADOR</span><div style={{ display: 'flex', gap: 8 }}><button onClick={load} style={button}><RefreshCw size={17} /></button><button onClick={() => OnlineAuth.logout().finally(() => window.location.assign('/?view=login'))} style={button}><LogOut size={17} /></button></div></div><div><div style={{ color: c.gold }}>{view.scene.subtitle}</div><h1 style={{ font: '700 clamp(30px,5vw,52px) Cinzel,serif', margin: '4px 0' }}>{view.scene.locationName}</h1><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderRadius: 10, background: view.permissions.isOwnTurn ? '#163624' : '#202737' }}><Swords size={15} /> {turnLabel}{view.encounter.isActive && ` · Rodada ${view.encounter.round}`}</span></div></header>
    <div style={{ padding: '28px clamp(20px,5vw,70px) 60px', display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(420px,2fr)', gap: 24 }}>
      <aside style={{ display: 'grid', alignContent: 'start', gap: 20 }}><section style={{ padding: 20, border: `1px solid ${c.line}`, borderRadius: 18, background: c.panel }}><div style={{ display: 'flex', gap: 13, alignItems: 'center', marginBottom: 18 }}><Portrait person={own} /><div><small style={{ color: c.gold }}>SEU PERSONAGEM</small><h2 style={{ margin: 0 }}>{own.name}</h2></div></div><div style={{ display: 'grid', gap: 12 }}><Meter label="Pontos de Vida" current={own.currentHp} max={own.maxHp} color={c.hp} /><Meter label="Aura" current={own.currentAura} max={own.maxAura} color={c.aura} /><Meter label="Munição" current={own.currentAmmo} max={own.maxAmmo} color={c.ammo} /></div><Conditions person={own} /></section><section style={{ padding: 16, border: `1px solid ${c.line}`, borderRadius: 14, background: c.panel }}><h3 style={{ marginTop: 0 }}>Mover token</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,42px)', gap: 6, justifyContent: 'center' }}><span /><button style={button} disabled={!view.permissions.canMove || moving} onClick={() => move(0,-5)}>↑</button><span /><button style={button} disabled={!view.permissions.canMove || moving} onClick={() => move(-5,0)}>←</button><button style={button} disabled={!view.permissions.canMove || moving} onClick={() => move(0,5)}>↓</button><button style={button} disabled={!view.permissions.canMove || moving} onClick={() => move(5,0)}>→</button></div><p style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginBottom: 0 }}>{view.permissions.canMove ? 'Passos de 5% do mapa' : 'Bloqueado fora do seu turno'}</p></section><section><h3><Shield size={17} /> Aliados</h3><div style={{ display: 'grid', gap: 10 }}>{view.allies.map(ally => Ally({ ally }))}{!view.allies.length && <p style={{ color: c.muted }}>Nenhum aliado.</p>}</div></section><section><h3>Inimigos visíveis</h3><div style={{ display: 'grid', gap: 10 }}>{view.enemies.map(enemy => <article key={enemy.id} style={{ padding: 12, border: '1px solid #4b2930', borderRadius: 14, background: '#171117', display: 'flex', gap: 10 }}><Portrait person={enemy} /><div><b>{enemy.name}</b><Conditions person={enemy} /></div></article>)}{!view.enemies.length && <p style={{ color: c.muted }}>Nenhum inimigo visível.</p>}</div></section></aside>
      <section><h2><Sparkles size={20} color={c.gold} /> Habilidades e arsenal</h2><p style={{ color: c.muted }}>Consulta livre. O uso fica bloqueado fora do seu turno.</p>{error && <p style={{ color: error.includes('enviada') ? '#86efac' : '#fca5a5' }}>{error}</p>}<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>{view.actions.map(action => { const reaction = (action.tags ?? []).some(tag => tag.toLocaleLowerCase('pt-BR').includes('reação') || tag.toLowerCase().includes('reacao')); const allowed = view.permissions.canAct || (reaction && view.permissions.canReact); return <article key={action.id} style={{ overflow: 'hidden', border: `1px solid ${c.line}`, borderRadius: 16, background: c.panel }}><div style={{ height: 95, background: action.icon ? `url(${action.icon}) center/cover` : '#1b2331' }} /><div style={{ padding: 15 }}><small style={{ color: c.gold }}>{action.category}</small><h3 style={{ margin: '4px 0' }}>{action.name}</h3><p style={{ color: '#aeb8c7', fontSize: 13 }}>{action.description || 'Sem descrição.'}</p><button onClick={() => requestAction(action.id)} disabled={!allowed || requesting === action.id} style={{ width: '100%', padding: 10, border: 0, borderRadius: 9, background: allowed ? '#a66d20' : '#303746', color: allowed ? '#fff' : '#7d8796', fontWeight: 800 }}>{requesting === action.id ? 'ENVIANDO…' : allowed ? 'SOLICITAR USO' : 'AGUARDE SEU TURNO'}</button></div></article>; })}{!view.actions.length && <p style={{ color: c.muted }}>Nenhuma habilidade vinculada.</p>}</div></section>
    </div>
  </main>;
}
