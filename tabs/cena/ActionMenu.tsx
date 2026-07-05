import React from 'react';
import { createPortal } from 'react-dom';
import { Backpack, Flame, Shield, Sparkles, Swords, X } from 'lucide-react';
import type { ActionCategory, ResolvedAction } from '../../utils/actions';
import { arsenalMaxLevel, type ArsenalCard } from '../../utils/arsenal';

export interface ActionMenuProps {
  actions?: Record<ActionCategory, ResolvedAction[]>;
  onSelectAction?: (action: ResolvedAction) => void;
  arsenalWeapons?: ArsenalCard[];
  equippedWeaponId?: string | null;
  onEquipWeapon?: (id: string | null) => void;
  selectedLevels?: Record<string,number>;
  onSelectLevel?: (id:string,level:number) => void;
}

const EMPTY: Record<ActionCategory, ResolvedAction[]> = { atacar: [], habilidade: [], forma: [], item: [], guarda: [] };
const CATS = [
  { id: 'atacar' as const, label: 'ATACAR', key: '1', Icon: Swords },
  { id: 'habilidade' as const, label: 'HABILIDADE', key: '2', Icon: Sparkles },
  { id: 'forma' as const, label: 'FORMA', key: '3', Icon: Flame },
  { id: 'item' as const, label: 'ITEM', key: '4', Icon: Backpack },
  { id: 'guarda' as const, label: 'GUARDA', key: '5', Icon: Shield },
];
const CAT_LABEL: Record<ActionCategory, string> = { atacar: 'ATAQUE', habilidade: 'HABILIDADE', forma: 'FORMA', item: 'ITEM', guarda: 'GUARDA' };
const TARGET_LABEL: Record<string, string> = {
  proprio_usuario: 'Você mesmo', um_alvo: 'Um alvo', multiplos_alvos: 'Múltiplos alvos',
  todos_aliados: 'Todos os aliados', todos_inimigos: 'Todos os inimigos', todos_em_area: 'Área',
  circulo_grid: 'Círculo no grid', celula_grid: 'Célula do grid', objeto_mapa: 'Objeto/interação',
  campo_de_batalha: 'Campo de batalha (mapa inteiro)',
};
const targetLabelOf = (action: ResolvedAction): string =>
  action.arsenalCard ? (TARGET_LABEL[action.arsenalCard.target.type] ?? 'Alvo') : (action.targeting === 'self' ? 'Você mesmo' : 'Um alvo');
const sameAction = (a: ResolvedAction | null, b: ResolvedAction): boolean => !!a && a.source === b.source && a.id === b.id;

const ActionMenu: React.FC<ActionMenuProps> = ({ actions = EMPTY, onSelectAction, arsenalWeapons = [], equippedWeaponId = null, onEquipWeapon, selectedLevels = {}, onSelectLevel }) => {
  const [open, setOpen] = React.useState<ActionCategory | null>(null);
  const [selected, setSelected] = React.useState<ResolvedAction | null>(null);
  const equippedWeapon=arsenalWeapons.find(weapon=>weapon.id===equippedWeaponId);
  const LevelSwitch=({card}:{card:ArsenalCard})=>card.levels.length?<label style={levelSwitch}><span>NÍVEL</span><select aria-label={`Nível de ${card.name}`} value={selectedLevels[card.id]??1} onChange={e=>onSelectLevel?.(card.id,Number(e.target.value))}>{Array.from({length:arsenalMaxLevel(card)},(_,index)=>index+1).map(level=><option key={level} value={level}>NV {level}</option>)}</select></label>:null;
  const useSelected = () => { if (!selected) return; onSelectAction?.(selected); setSelected(null); };
  return (
    <section className="cena-actions">
      <header className="cena-section-head"><div><span>ARSENAL</span><strong>COMANDOS</strong></div></header>
      {!!arsenalWeapons.length && <div className="cena-actions__weapon">
        <select aria-label="Arma equipada" value={equippedWeaponId ?? ''} onChange={e => onEquipWeapon?.(e.target.value || null)}>
          <option value="">Sem arma equipada</option>
          {arsenalWeapons.map(weapon => <option key={weapon.id} value={weapon.id}>{weapon.name}</option>)}
        </select>
        {equippedWeapon&&<LevelSwitch card={equippedWeapon}/>}
        {equippedWeaponId && <button onClick={() => onEquipWeapon?.(null)}>×</button>}
      </div>}
      <div className="cena-actions__grid">
        {CATS.map(({ id, label, key, Icon }) => {
          const list = actions[id] ?? [];
          const isOpen = open === id;
          return <React.Fragment key={id}>
            <button className={`cena-command ${isOpen ? 'is-open' : ''}`} onClick={() => setOpen(isOpen ? null : id)}>
              <Icon size={17} /><strong>{label}</strong><span>{list.length || key}</span>
            </button>
            {isOpen && <div className="cena-command-list">
              {list.length === 0 ? <em>Nada nesta categoria.</em> : list.map(action => <div key={action.id} style={actionRow}>
                <button style={{flex:1}} className={sameAction(selected,action)?'is-selected':''} onClick={() => setSelected(current => sameAction(current,action) ? null : action)}><i>◇</i><span>{action.name}</span>{action.auraCost ? <b>{action.auraCost} AURA</b> : null}</button>
                {action.arsenalCard&&<LevelSwitch card={action.arsenalCard}/>}
              </div>)}
            </div>}
          </React.Fragment>;
        })}
      </div>
      {selected && createPortal(
        <div className={`cena-floating-card cena-ability-card`} role="dialog" aria-label={`Detalhes de ${selected.name}`}>
          <button className="cena-ability-card__close" aria-label="Fechar detalhes" onClick={() => setSelected(null)}><X size={14}/></button>
          <div className="cena-floating-card__heading"><span>{CAT_LABEL[selected.category]}</span><strong>{selected.name}</strong></div>
          {selected.description && <p className="cena-ability-card__desc">{selected.description}</p>}
          <div className="cena-floating-card__stats">
            <span><b>ALVO</b>{targetLabelOf(selected)}</span>
            <span><b>AURA</b>{selected.auraCost ?? 0}</span>
            <span><b>MUNIÇÃO</b>{selected.ammoCost ?? 0}</span>
          </div>
          {(!!selected.damage || !!selected.healHp || !!selected.healAura || selected.conditionName) && <div className="cena-floating-card__effects">
            {!!selected.damage && <i><Swords size={12}/> {selected.damage} de dano{selected.damageType ? ` (${selected.damageType})` : ''}</i>}
            {!!selected.healHp && <i><Sparkles size={12}/> Recupera {selected.healHp} de HP</i>}
            {!!selected.healAura && <i><Sparkles size={12}/> Recupera {selected.healAura} de Aura</i>}
            {selected.conditionName && <i><Sparkles size={12}/> Aplica {selected.conditionName}{selected.conditionDuration ? ` (${selected.conditionDuration} rodada(s))` : ''}</i>}
          </div>}
          {!!selected.arsenalCard?.effects.length && <div className="cena-floating-card__effects">
            {selected.arsenalCard.effects.map((effect,index) => <i key={index}><Sparkles size={12}/> {effect.name}{effect.tags.length?` — ${effect.tags.join(', ')}`:''}</i>)}
          </div>}
          <div className="cena-ability-card__actions">
            <button className="is-primary" onClick={useSelected}>USAR</button>
            <button onClick={() => setSelected(null)}>CANCELAR</button>
          </div>
        </div>, document.body,
      )}
    </section>
  );
};

const actionRow:React.CSSProperties={display:'flex',alignItems:'stretch',gap:6};
const levelSwitch:React.CSSProperties={display:'flex',alignItems:'center',gap:5,padding:'0 7px',border:'1px solid rgba(255,255,255,.1)',background:'rgba(0,0,0,.25)',color:'#8f98a8',fontSize:8,fontWeight:900,letterSpacing:'.08em'};

export default ActionMenu;
