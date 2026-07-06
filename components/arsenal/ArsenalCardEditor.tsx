import React from 'react';
import { Check, ChevronLeft, ChevronRight, Dices, Plus, Save, Search, Sparkles, Trash2, X } from 'lucide-react';
import {
  arsenalCardAtLevel,
  arsenalMaxLevel,
  createArsenalCard,
  type AbilityType,
  type ArsenalCard,
  type ArsenalCategory,
  type ArsenalEffect,
  type ArsenalLevel,
  type TriggerEvent,
  type UsageCondition,
} from '../../utils/arsenal';
import type { Element } from '../../types';
import { PREDEFINED_ARSENAL_EFFECTS } from '../../utils/arsenalEffects';
import { ImagePickerButton } from '../ui';
import ArsenalCardPreview from './ArsenalCardPreview';

interface Props {
  initial?: ArsenalCard | null;
  catalog: ArsenalCard[];
  onSave: (card: ArsenalCard) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  onClose: () => void;
}

type SectionId = 'basico' | 'niveis' | 'combate' | 'alvo' | 'efeitos' | 'condicoes' | 'gatilhos' | 'preparacao' | 'recursos' | 'vinculos' | 'categoria';
/** Ordem reflete o fluxo natural de criação: identidade → o que a carta É → números → efeitos → regras finas → progressão. */
const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'basico', label: 'Básico' }, { id: 'categoria', label: '★ Categoria específica' },
  { id: 'combate', label: 'Combate' },
  { id: 'alvo', label: 'Alvo e área' }, { id: 'efeitos', label: 'Efeitos' },
  { id: 'condicoes', label: 'Condições' }, { id: 'gatilhos', label: 'Gatilhos' },
  { id: 'preparacao', label: 'Preparação' }, { id: 'recursos', label: 'Cooldown e cargas' },
  { id: 'vinculos', label: 'Vínculos' }, { id: 'niveis', label: '↑ Níveis' },
];
const CATEGORY_LABEL: Record<ArsenalCategory, string> = { habilidade:'Habilidade', selo:'Selo', item:'Item', arma:'Arma' };
const ABILITY_TYPE_LABEL: Record<string,string> = { comum:'Comum', protecao:'Proteção', combo:'Combo', forma:'Forma' };

/** Rótulo de aba com contexto: nome da categoria escolhida na aba "★ …" e contagem de itens nas abas de listas. */
function sectionLabel(item: { id:SectionId; label:string }, card: ArsenalCard): string {
  if (item.id === 'categoria') {
    const detail = card.category === 'habilidade' ? ABILITY_TYPE_LABEL[card.abilityType ?? 'comum'] : CATEGORY_LABEL[card.category];
    return `${item.label} — ${detail}`;
  }
  const count = item.id === 'efeitos' ? card.effects.length
    : item.id === 'condicoes' ? card.conditions.length
    : item.id === 'gatilhos' ? card.triggers.length
    : item.id === 'vinculos' ? card.weaponLinks.length + card.formLinks.length
    : item.id === 'niveis' ? card.levels.length
    : 0;
  return count > 0 ? `${item.label} · ${count}` : item.label;
}

const TRIGGERS: TriggerEvent[] = [
  'uso_manual','ao_atacar','ao_ser_atacado','ao_causar_dano','ao_receber_dano','ao_curar','ao_ser_curado',
  'inicio_turno','fim_turno','inicio_rodada','fim_rodada','entrar_combate','sair_combate','equipar_arma',
  'desequipar_arma','ativar_forma','perder_forma','consumir_aura','restaurar_aura','aplicar_efeito',
  'efeito_expirar','morrer','derrotar_alvo',
];
const ELEMENTS = [
  ['fisico','Físico'],['fogo','Fogo'],['raio','Raio'],['água','Água'],['terra','Terra'],['vento','Vento'],
  ['escuridão','Escuridão'],['luminoso','Luminoso'],['sangue','Sangue'],['aura','Aura'],
].map(([value,label]) => ({ value, label }));
const STATS = [['ataque','Ataque'],['defesa','Defesa'],['velocidade','Velocidade'],['dano','Dano'],['cura','Cura'],['aura','Aura']].map(([value,label])=>({value,label}));
const OPERATIONS = [['somar','Somar'],['multiplicar','Multiplicar (%)'],['definir','Definir (sobrepõe)']].map(([value,label])=>({value,label}));
const DICE_TARGETS = [['teste','Teste'],['dano_extra','Dano extra'],['dano','Dano'],['cura','Cura']].map(([value,label])=>({value,label}));
const AFFINITY_KINDS = [['resistencia','Resistência'],['vulnerabilidade','Vulnerabilidade'],['imunidade','Imunidade'],['absorcao','Absorção']].map(([value,label])=>({value,label}));
const CLASSIC_KINDS = ['queimadura','congelamento','lentidao','molhado','eletrocutado','sangramento','fraqueza','acelerado','desnorteado'];

const triggerLabel = (value: string) => value.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
const selectedValues = (select:HTMLSelectElement) => Array.from(select.selectedOptions, option => option.value);
const field: React.CSSProperties = { width:'100%', padding:'10px 12px', background:'rgba(7,9,14,.78)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, color:'#f1f1f4', outline:'none' };
const label: React.CSSProperties = { display:'block', marginBottom:6, color:'#92929c', fontSize:10, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase' };
const grid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:14 };

const amount = (value: ArsenalCard['damage'], flat: number, dice?: string) => flat || dice ? { flat, ...(dice ? { dice } : {}) } : null;
const clone = <T,>(value: T): T => structuredClone(value);
const effectiveAmount = (value: ArsenalCard['damage']) => value ?? { flat:0, dice:'' };

const DICE_PRESETS = ['1d4','1d6','1d8','1d10','1d12','1d20','2d6','2d8'];

const Stepper:React.FC<{labelText:string;value:number;onChange:(value:number)=>void;min?:number;hint?:string}>=({labelText,value,onChange,min=0,hint})=><div style={numberCard}>
  <span style={label}>{labelText}</span><div style={{display:'grid',gridTemplateColumns:'36px 1fr 36px',gap:7,alignItems:'center'}}>
    <button type="button" aria-label={`Diminuir ${labelText}`} style={stepButton} onClick={()=>onChange(Math.max(min,value-1))}>−</button>
    <input aria-label={labelText} type="number" min={min} value={value} onChange={e=>onChange(Math.max(min,Number(e.target.value)))} style={{...field,textAlign:'center',fontSize:18,fontWeight:900,padding:8}}/>
    <button type="button" aria-label={`Aumentar ${labelText}`} style={stepButton} onClick={()=>onChange(value+1)}>+</button>
  </div>{hint&&<small style={{color:'#667080',fontSize:10}}>{hint}</small>}
</div>;

const DicePicker:React.FC<{labelText:string;value:string|null;onChange:(value:string|null)=>void;allowNone?:boolean}>=({labelText,value,onChange,allowNone=true})=><div style={{display:'flex',flexDirection:'column',gap:9}}>
  <span style={label}>{labelText}</span><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
    {allowNone&&<button type="button" aria-pressed={!value} onClick={()=>onChange(null)} style={{...diceChip,...(!value?selectedChoice:{})}}>Sem dado</button>}
    {DICE_PRESETS.map(die=><button type="button" key={die} aria-label={`${labelText}: ${die}`} aria-pressed={value===die} onClick={()=>onChange(die)} style={{...diceChip,...(value===die?selectedChoice:{})}}>{die}</button>)}
  </div><label style={{position:'relative'}}><Dices size={15} style={{position:'absolute',left:12,top:12,color:'#8ea5bb'}}/><input aria-label={labelText} style={{...field,paddingLeft:36}} value={value??''} onChange={e=>onChange(e.target.value||null)} placeholder="Ou escreva: 1d20+3"/></label>
</div>;

function blankCondition(type: UsageCondition['type']): UsageCondition {
  switch (type) {
    case 'arma_equipada': return { type };
    case 'forma_ativa': return { type };
    case 'elemento': return { type, element: 'fisico' };
    case 'aura_minima': return { type, amount: 1 };
    case 'vida_acima': return { type, value: 50, unit: 'percentual' };
    case 'vida_abaixo': return { type, value: 50, unit: 'percentual' };
    case 'efeito_ativo': return { type, effectId: '' };
    case 'alvo_com_efeito': return { type, effectId: '' };
    case 'tag': return { type, tag: '', subject: 'usuario' };
    default: return { type } as UsageCondition;
  }
}

function blankEffect(): ArsenalEffect {
  return {
    id: `effect-${crypto.randomUUID()}`, name:'Novo efeito', description:'', tags:[],
    duration:{ type:'rodadas', amount:1 }, stackBehavior:'renova_duracao', maxStacks:1,
    triggers:[], modifiers:[], periodicDamage:null, periodicHealing:null, auraConsumed:null, auraRestored:null,
    attackModifier:0, defenseModifier:0, speedModifier:0, customEffect:null,
  };
}

const Toggle: React.FC<{ checked:boolean; onChange:(v:boolean)=>void; children:React.ReactNode }> = ({ checked, onChange, children }) => (
  <label style={{ display:'flex', alignItems:'center', gap:8, color:'#c7c7ce', fontSize:12, cursor:'pointer' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /> {children}
  </label>
);

const NumberField: React.FC<{ value:number; onChange:(v:number)=>void; min?:number; labelText:string }> = ({ value, onChange, min, labelText }) => (
  <label><span style={label}>{labelText}</span><input style={field} type="number" min={min} value={value} onChange={e => onChange(Number(e.target.value))} /></label>
);

const CardPicker: React.FC<{
  labelText:string; items:ArsenalCard[]; value:string[]; onChange:(ids:string[])=>void;
  emptyText?:string; max?:number;
}> = ({ labelText, items, value, onChange, emptyText='Nenhuma carta disponível.', max }) => {
  const [query,setQuery]=React.useState('');
  const selected=new Set(value);
  const visible=items.filter(item=>`${item.name} ${item.tags.join(' ')}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  const toggle=(id:string)=>onChange(selected.has(id)?value.filter(current=>current!==id):max&&value.length>=max?value:[...value,id]);
  return <div style={{display:'flex',flexDirection:'column',gap:9,minWidth:0}}>
    <span style={label}>{labelText}{max ? ` · ${value.length}/${max}` : value.length ? ` · ${value.length} selecionada(s)` : ''}</span>
    {value.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{value.map(id=>{const item=items.find(candidate=>candidate.id===id);return <button type="button" key={id} onClick={()=>toggle(id)} title="Remover seleção" style={{...pickerChip,borderColor:item?'rgba(125,210,240,.32)':'rgba(251,113,133,.45)',color:item?'#dff8ff':'#fda4af'}}>{item?.name??'Carta removida do catálogo'} <X size={11}/></button>})}</div>}
    {items.length>5&&<label style={{position:'relative'}}><Search size={14} style={{position:'absolute',left:11,top:11,color:'#697383'}}/><input aria-label={`Buscar ${labelText.toLocaleLowerCase('pt-BR')}`} style={{...field,paddingLeft:34}} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nome ou tag…"/></label>}
    <div style={pickerList}>{visible.map(item=>{const active=selected.has(item.id);const blocked=!active&&!!max&&value.length>=max;return <button type="button" key={item.id} aria-pressed={active} disabled={blocked} onClick={()=>toggle(item.id)} style={{...pickerItem,opacity:blocked?.45:1,borderColor:active?'rgba(125,230,255,.5)':'rgba(255,255,255,.07)',background:active?'rgba(35,93,116,.28)':'rgba(255,255,255,.025)'}}><span style={{width:24,height:24,display:'grid',placeItems:'center',border:'1px solid rgba(255,255,255,.1)',background:item.icon?`url(${item.icon}) center/cover`:'#11151c'}}>{active&&!item.icon&&<Check size={13}/>}</span><span style={{minWidth:0,flex:1,textAlign:'left'}}><strong style={{display:'block',color:'#eef2f7',fontSize:12,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.name}</strong><small style={{color:'#747d8b'}}>{item.abilityType??item.category}{item.element?` · ${item.element}`:''}</small></span>{active&&<Check size={15} color="#7de6ff"/>}</button>})}{visible.length===0&&<div style={{padding:18,textAlign:'center',color:'#626b78',fontSize:11}}>{emptyText}</div>}</div>
  </div>;
};

/** Seletor de efeitos passivos (concedidos por formas/armas): reaproveita os clássicos e os efeitos já criados nesta carta. */
const EffectPicker: React.FC<{ labelText:string; cardEffects:ArsenalEffect[]; value:ArsenalEffect[]; onChange:(effects:ArsenalEffect[])=>void }> = ({ labelText, cardEffects, value, onChange }) => {
  const options=[...PREDEFINED_ARSENAL_EFFECTS,...cardEffects];
  const selectedIds=new Set(value.map(effect=>effect.id));
  const toggle=(effect:ArsenalEffect)=>onChange(selectedIds.has(effect.id)?value.filter(current=>current.id!==effect.id):[...value,clone(effect)]);
  return <div style={{display:'flex',flexDirection:'column',gap:8,gridColumn:'1/-1'}}>
    <span style={label}>{labelText}{value.length?` · ${value.length} selecionado(s)`:''}</span>
    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
      {options.map(effectOption=><button type="button" key={effectOption.id} aria-pressed={selectedIds.has(effectOption.id)} onClick={()=>toggle(effectOption)} style={{...pickerChip,borderColor:selectedIds.has(effectOption.id)?'rgba(125,230,255,.5)':'rgba(255,255,255,.12)',color:selectedIds.has(effectOption.id)?'#dff8ff':'#c7c7ce'}}>{effectOption.name}</button>)}
      {options.length===0&&<Empty>Crie efeitos na aba Efeitos para poder concedê-los aqui.</Empty>}
    </div>
  </div>;
};

const CLASSIC_VALUE_LABEL = (kind: NonNullable<ArsenalEffect['classic']>['kind']) =>
  kind==='molhado'?'Multiplicador elétrico':kind==='lentidao'||kind==='acelerado'?'Posições deslocadas':kind==='congelamento'?'Turnos perdidos':kind==='fraqueza'?'Redução do ataque':'Valor do efeito';

/** Editor de um único ArsenalEffect: campos essenciais sempre visíveis, poder avançado atrás de um toggle. */
const EffectEditor: React.FC<{
  effect: ArsenalEffect; index: number; catalog: ArsenalCard[]; weapons: ArsenalCard[];
  onUpdate: (index:number, next:Partial<ArsenalEffect>) => void; onRemove: (index:number) => void;
}> = ({ effect, index, catalog, weapons, onUpdate, onRemove }) => {
  const hasAdvancedContent = effect.modifiers.length>0 || !!(effect.diceBonuses?.length) || !!(effect.elementalAffinities?.length) || !!effect.lifeSteal || !!effect.thorns || !!(effect.immunities?.length);
  const [advancedOpen,setAdvancedOpen]=React.useState(hasAdvancedContent);
  const update=(next:Partial<ArsenalEffect>)=>onUpdate(index,next);
  return <div style={{ display:'flex', flexDirection:'column', gap:14, padding:14 }}>
    <div style={fieldset}>
      <span style={fieldsetTitle}>Identidade</span>
      <label><span style={label}>Nome</span><input style={field} value={effect.name} onChange={e => update({ name:e.target.value })}/></label>
      <label><span style={label}>Tags</span><input style={field} value={effect.tags.join(', ')} onChange={e => update({ tags:e.target.value.split(',').map(v=>v.trim()).filter(Boolean) })}/></label>
      <label style={{ gridColumn:'1/-1' }}><span style={label}>Descrição</span><textarea style={field} value={effect.description} onChange={e => update({ description:e.target.value })}/></label>
    </div>

    <div style={fieldset}>
      <span style={fieldsetTitle}>Duração e acúmulo</span>
      <label><span style={label}>Tipo de duração</span><select style={field} value={effect.duration.type} onChange={e => update({ duration:{ ...effect.duration, type:e.target.value as ArsenalEffect['duration']['type'] } })}>{['turnos','rodadas','usos','permanente','ate_removido','enquanto_equipado','enquanto_forma_ativa','enquanto_condicao_verdadeira'].map(v=><option key={v} value={v}>{triggerLabel(v)}</option>)}</select></label>
      <NumberField labelText="Duração" min={0} value={effect.duration.amount ?? 0} onChange={amount => update({ duration:{ ...effect.duration, amount } })}/>
      <label><span style={label}>Stack</span><select style={field} value={effect.stackBehavior} onChange={e => update({ stackBehavior:e.target.value as ArsenalEffect['stackBehavior'] })}>{['nao_acumula','renova_duracao','acumula_intensidade','acumula_duracao','acumula_ambos'].map(v=><option key={v} value={v}>{triggerLabel(v)}</option>)}</select></label>
      <NumberField labelText="Máximo de stacks" min={1} value={effect.maxStacks} onChange={maxStacks => update({ maxStacks })}/>
    </div>

    {effect.classic && <div style={{...fieldset,border:'1px solid rgba(251,146,60,.25)',background:'rgba(120,53,15,.07)'}}>
      <span style={fieldsetTitle}>Efeito clássico · {triggerLabel(effect.classic.kind)}</span>
      <NumberField labelText={CLASSIC_VALUE_LABEL(effect.classic.kind)} min={effect.classic.kind==='molhado'||(effect.classic.kind==='fraqueza'&&effect.classic.mode==='dividir')?1:0} value={effect.classic.value} onChange={value=>update({classic:{...effect.classic!,value} as ArsenalEffect['classic']})}/>
      {effect.classic.kind==='sangramento'&&<label><span style={label}>Cálculo do dano</span><select style={field} value={effect.classic.mode} onChange={e=>update({classic:{...effect.classic!,mode:e.target.value as 'fixo'|'percentual_vida_maxima'}})}><option value="fixo">Valor fixo</option><option value="percentual_vida_maxima">% da vitalidade máxima</option></select></label>}
      {effect.classic.kind==='fraqueza'&&<label><span style={label}>Operação</span><select style={field} value={effect.classic.mode} onChange={e=>update({classic:{...effect.classic!,mode:e.target.value as 'subtrair'|'dividir'}})}><option value="subtrair">Subtrair do ataque</option><option value="dividir">Dividir e arredondar para baixo</option></select></label>}
    </div>}

    {!effect.classic && <div style={fieldset}>
      <span style={fieldsetTitle}>Efeitos numéricos diretos</span>
      {([['periodicDamage','Dano periódico'],['periodicHealing','Cura periódica'],['auraConsumed','Aura consumida'],['auraRestored','Aura restaurada']] as const).map(([key,title]) => <label key={key}><span style={label}>{title} (fixo)</span><input style={field} type="number" value={effect[key]?.flat ?? 0} onChange={e => update({ [key]:Number(e.target.value) ? { flat:Number(e.target.value) } : null })}/></label>)}
      <NumberField labelText="Modificador de ataque" value={effect.attackModifier} onChange={attackModifier => update({ attackModifier })}/>
      <NumberField labelText="Modificador de defesa" value={effect.defenseModifier} onChange={defenseModifier => update({ defenseModifier })}/>
      <NumberField labelText="Modificador de velocidade" value={effect.speedModifier} onChange={speedModifier => update({ speedModifier })}/>
    </div>}

    <label><span style={label}>Gatilhos do efeito</span><select multiple style={{ ...field, minHeight:80 }} value={effect.triggers.map(t=>t.event)} onChange={e => update({ triggers:selectedValues(e.currentTarget).map(event=>({ event:event as TriggerEvent })) })}>{TRIGGERS.map(t=><option key={t} value={t}>{triggerLabel(t)}</option>)}</select></label>

    <button type="button" style={{...buttonStyle,alignSelf:'flex-start'}} onClick={()=>setAdvancedOpen(v=>!v)}>{advancedOpen?'▾':'▸'} Poderes avançados (modificadores, dados, afinidades, roubo de vida, espinhos, imunidades){hasAdvancedContent&&!advancedOpen?' · configurado':''}</button>

    {advancedOpen && <>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><span style={label}>Modificadores de estat (gerais ou atrelados a elemento/arma)</span><button type="button" style={buttonStyle} onClick={()=>update({modifiers:[...effect.modifiers,{stat:'dano',operation:'somar',value:1}]})}><Plus size={12}/> Modificador</button></div>
        {effect.modifiers.map((modifier,mi)=><div key={mi} style={{display:'grid',gridTemplateColumns:'1fr 1fr 90px 1fr auto',gap:8,alignItems:'end'}}>
          <label><span style={label}>Estat</span><select style={field} value={modifier.stat} onChange={e=>update({modifiers:effect.modifiers.map((m,i)=>i===mi?{...m,stat:e.target.value as typeof m.stat}:m)})}>{STATS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
          <label><span style={label}>Operação</span><select style={field} value={modifier.operation} onChange={e=>update({modifiers:effect.modifiers.map((m,i)=>i===mi?{...m,operation:e.target.value as typeof m.operation}:m)})}>{OPERATIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
          <label><span style={label}>Valor</span><input style={field} type="number" value={modifier.value} onChange={e=>update({modifiers:effect.modifiers.map((m,i)=>i===mi?{...m,value:Number(e.target.value)}:m)})}/></label>
          <label><span style={label}>Só com elemento</span><select style={field} value={modifier.filter?.damageType?.[0]??''} onChange={e=>update({modifiers:effect.modifiers.map((m,i)=>i===mi?{...m,filter:{...m.filter,damageType:e.target.value?[e.target.value as Element]:undefined}}:m)})}><option value="">Qualquer</option>{ELEMENTS.map(el=><option key={el.value} value={el.value}>{el.label}</option>)}</select></label>
          <button aria-label={`Remover modificador ${mi+1}`} style={iconButton} onClick={()=>update({modifiers:effect.modifiers.filter((_,i)=>i!==mi)})}><Trash2 size={14}/></button>
          <div style={{gridColumn:'1/-1'}}><CardPicker labelText="Só com estas armas equipadas" items={weapons} value={modifier.filter?.weaponIds??[]} onChange={weaponIds=>update({modifiers:effect.modifiers.map((m,i)=>i===mi?{...m,filter:{...m.filter,weaponIds}}:m)})}/></div>
        </div>)}
        {effect.modifiers.length===0&&<Empty>Nenhum modificador de estat.</Empty>}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><span style={label}>Bônus de rolagem (dado extra, flat, vantagem)</span><button type="button" style={buttonStyle} onClick={()=>update({diceBonuses:[...(effect.diceBonuses??[]),{target:'dano'}]})}><Plus size={12}/> Bônus de dado</button></div>
        {(effect.diceBonuses??[]).map((bonus,bi)=><div key={bi} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 100px 100px auto',gap:8,alignItems:'end'}}>
          <label><span style={label}>Rolagem</span><select style={field} value={bonus.target} onChange={e=>update({diceBonuses:(effect.diceBonuses??[]).map((b,i)=>i===bi?{...b,target:e.target.value as typeof b.target}:b)})}>{DICE_TARGETS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
          <label><span style={label}>Dado extra</span><input style={field} placeholder="1d4" value={bonus.bonusDice??''} onChange={e=>update({diceBonuses:(effect.diceBonuses??[]).map((b,i)=>i===bi?{...b,bonusDice:e.target.value||null}:b)})}/></label>
          <label><span style={label}>Flat</span><input style={field} type="number" value={bonus.bonusFlat??0} onChange={e=>update({diceBonuses:(effect.diceBonuses??[]).map((b,i)=>i===bi?{...b,bonusFlat:Number(e.target.value)}:b)})}/></label>
          <Toggle checked={!!bonus.advantage} onChange={advantage=>update({diceBonuses:(effect.diceBonuses??[]).map((b,i)=>i===bi?{...b,advantage}:b)})}>Vantagem</Toggle>
          <Toggle checked={!!bonus.disadvantage} onChange={disadvantage=>update({diceBonuses:(effect.diceBonuses??[]).map((b,i)=>i===bi?{...b,disadvantage}:b)})}>Desvantagem</Toggle>
          <button aria-label={`Remover bônus de dado ${bi+1}`} style={iconButton} onClick={()=>update({diceBonuses:(effect.diceBonuses??[]).filter((_,i)=>i!==bi)})}><Trash2 size={14}/></button>
          <label><span style={label}>Rerrolar abaixo de</span><input style={field} type="number" value={bonus.rerollBelow??''} onChange={e=>update({diceBonuses:(effect.diceBonuses??[]).map((b,i)=>i===bi?{...b,rerollBelow:e.target.value===''?null:Number(e.target.value)}:b)})}/></label>
          <label><span style={label}>Resultado mínimo</span><input style={field} type="number" value={bonus.minimumResult??''} onChange={e=>update({diceBonuses:(effect.diceBonuses??[]).map((b,i)=>i===bi?{...b,minimumResult:e.target.value===''?null:Number(e.target.value)}:b)})}/></label>
          <label><span style={label}>Categorias</span><select multiple style={{...field,minHeight:76}} value={bonus.filter?.categories??[]} onChange={e=>update({diceBonuses:(effect.diceBonuses??[]).map((b,i)=>i===bi?{...b,filter:{...b.filter,categories:selectedValues(e.currentTarget) as ArsenalCategory[]}}:b)})}><option value="habilidade">Habilidades</option><option value="selo">Selos</option><option value="item">Itens</option><option value="arma">Armas</option></select></label>
          <label><span style={label}>Tipos de habilidade</span><select multiple style={{...field,minHeight:76}} value={bonus.filter?.abilityTypes??[]} onChange={e=>update({diceBonuses:(effect.diceBonuses??[]).map((b,i)=>i===bi?{...b,filter:{...b.filter,abilityTypes:selectedValues(e.currentTarget) as AbilityType[]}}:b)})}><option value="comum">Comuns</option><option value="protecao">Proteção</option><option value="combo">Combo</option><option value="forma">Forma</option></select></label>
          <label style={{gridColumn:'1/-1'}}><span style={label}>Tags das cartas (qualquer uma)</span><input style={field} placeholder="ex.: fogo, corpo a corpo" value={(bonus.filter?.cardTags??[]).join(', ')} onChange={e=>update({diceBonuses:(effect.diceBonuses??[]).map((b,i)=>i===bi?{...b,filter:{...b.filter,cardTags:e.target.value.split(',').map(v=>v.trim()).filter(Boolean)}}:b)})}/></label>
          <div style={{gridColumn:'1/-1'}}><CardPicker labelText="Somente estas cartas (vazio = qualquer)" items={catalog.filter(item=>item.id)} value={bonus.filter?.cardIds??[]} onChange={cardIds=>update({diceBonuses:(effect.diceBonuses??[]).map((b,i)=>i===bi?{...b,filter:{...b.filter,cardIds}}:b)})}/></div>
          <div style={{gridColumn:'1/-1'}}><CardPicker labelText="Somente com estas armas equipadas" items={weapons} value={bonus.filter?.weaponIds??[]} onChange={weaponIds=>update({diceBonuses:(effect.diceBonuses??[]).map((b,i)=>i===bi?{...b,filter:{...b.filter,weaponIds}}:b)})}/></div>
        </div>)}
        {(effect.diceBonuses??[]).length===0&&<Empty>Nenhum bônus de rolagem.</Empty>}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><span style={label}>Afinidades elementais concedidas</span><button type="button" style={buttonStyle} onClick={()=>update({elementalAffinities:[...(effect.elementalAffinities??[]),{element:'fogo',kind:'resistencia',percent:50}]})}><Plus size={12}/> Afinidade</button></div>
        {(effect.elementalAffinities??[]).map((affinity,ai)=><div key={ai} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:8,alignItems:'end'}}>
          <label><span style={label}>Elemento</span><select style={field} value={affinity.element} onChange={e=>update({elementalAffinities:(effect.elementalAffinities??[]).map((a,i)=>i===ai?{...a,element:e.target.value as ArsenalCard['element'] & string}:a)})}>{ELEMENTS.map(el=><option key={el.value} value={el.value}>{el.label}</option>)}</select></label>
          <label><span style={label}>Tipo</span><select style={field} value={affinity.kind} onChange={e=>update({elementalAffinities:(effect.elementalAffinities??[]).map((a,i)=>i===ai?{...a,kind:e.target.value as typeof a.kind}:a)})}>{AFFINITY_KINDS.map(k=><option key={k.value} value={k.value}>{k.label}</option>)}</select></label>
          <label><span style={label}>Percentual</span><input style={field} type="number" value={affinity.percent} onChange={e=>update({elementalAffinities:(effect.elementalAffinities??[]).map((a,i)=>i===ai?{...a,percent:Number(e.target.value)}:a)})}/></label>
          <button aria-label={`Remover afinidade ${ai+1}`} style={iconButton} onClick={()=>update({elementalAffinities:(effect.elementalAffinities??[]).filter((_,i)=>i!==ai)})}><Trash2 size={14}/></button>
        </div>)}
        {(effect.elementalAffinities??[]).length===0&&<Empty>Nenhuma afinidade elemental.</Empty>}
      </div>

      <div style={fieldset}>
        <span style={fieldsetTitle}>Roubo de vida, espinhos e imunidades</span>
        <NumberField labelText="Roubo de vida (% do dano causado)" min={0} value={effect.lifeSteal??0} onChange={value=>update({lifeSteal:value||null})}/>
        <label><span style={label}>Espinhos (dano refletido ao atacante)</span><div style={{display:'flex',gap:8}}>
          <input style={field} type="number" placeholder="fixo" value={effect.thorns?.flat??0} onChange={e=>{const flat=Number(e.target.value);update({thorns:flat||effect.thorns?.dice?{flat,...(effect.thorns?.dice?{dice:effect.thorns.dice}:{})}:null});}}/>
          <input style={field} placeholder="dado (ex: 1d4)" value={effect.thorns?.dice??''} onChange={e=>{const dice=e.target.value;update({thorns:dice||effect.thorns?.flat?{flat:effect.thorns?.flat??0,...(dice?{dice}:{})}:null});}}/>
        </div></label>
        <label style={{gridColumn:'1/-1'}}><span style={label}>Imunidades a efeitos clássicos</span><select multiple style={{...field,minHeight:90}} value={effect.immunities??[]} onChange={e=>update({immunities:selectedValues(e.currentTarget) as ArsenalEffect['immunities']})}>{CLASSIC_KINDS.map(kind=><option key={kind} value={kind}>{triggerLabel(kind)}</option>)}</select></label>
      </div>
    </>}

    {!effect.classic&&<label><span style={label}>Comportamento customizado</span><textarea style={field} value={effect.customEffect ?? ''} onChange={e => update({ customEffect:e.target.value || null })}/></label>}

    <button type="button" style={{...buttonStyle,alignSelf:'flex-start',color:'#fb7185'}} onClick={()=>onRemove(index)}><Trash2 size={14}/> Remover este efeito</button>
  </div>;
};

const SealCategoryEditor:React.FC<{
  card:ArsenalCard; items:ArsenalCard[]; patch:(next:Partial<ArsenalCard>)=>void; setSealKind:(kind:'explosao'|'ritual')=>void;
}> = ({card,items,patch,setSealKind}) => {
  const seal=card.seal??{kind:'explosao' as const,type:'ataque' as const,persistent:false,consumable:false,requiredItems:[],durationRounds:null};
  const requirementIds=seal.requiredItems.map(requirement=>requirement.itemId);
  const updateRequirements=(ids:string[])=>patch({seal:{...seal,requiredItems:ids.map(itemId=>seal.requiredItems.find(requirement=>requirement.itemId===itemId)??{itemId,quantity:1})}});
  return <div style={{display:'flex',flexDirection:'column',gap:18}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
      <button type="button" onClick={()=>setSealKind('explosao')} style={{...kindCard,borderColor:seal.kind==='explosao'?'#fb923c':'rgba(255,255,255,.09)',background:seal.kind==='explosao'?'rgba(194,65,12,.18)':'rgba(255,255,255,.02)'}}><strong>💥 Selo de Explosão</strong><span>Lançado como uma habilidade: rola dado, resolve efeitos e atinge os alvos imediatamente.</span></button>
      <button type="button" onClick={()=>setSealKind('ritual')} style={{...kindCard,borderColor:seal.kind==='ritual'?'#a78bfa':'rgba(255,255,255,.09)',background:seal.kind==='ritual'?'rgba(91,33,182,.18)':'rgba(255,255,255,.02)'}}><strong>◈ Selo de Ritual</strong><span>Exige preparação, pode consumir itens e aplica efeitos específicos aos alvos.</span></button>
    </div>
    <label><span style={label}>Natureza do efeito</span><select style={field} value={seal.type??'ataque'} onChange={e=>patch({seal:{...seal,type:e.target.value as 'ataque'|'buff'|'armadilha'}})}><option value="ataque">Ataque</option><option value="buff">Fortalecimento</option><option value="armadilha">Armadilha</option></select></label>
    {seal.kind==='explosao'&&<div style={infoBox}><strong>Execução imediata</strong><span>Configure o dado na seção Combate, os destinatários em Alvo e os resultados em Efeitos. A preparação foi fixada como instantânea.</span></div>}
    {seal.kind==='ritual'&&<><div style={infoBox}><strong>Preparação obrigatória</strong><span>O tempo é configurado em Preparação. Os itens abaixo são consumidos ao iniciar o ritual; deixe vazio quando não houver requisito.</span></div><CardPicker labelText="Itens necessários para produzir o ritual" items={items} value={requirementIds} onChange={updateRequirements}/>{seal.requiredItems.length>0&&<div style={{display:'grid',gap:8}}>{seal.requiredItems.map(requirement=><div key={requirement.itemId} style={{display:'grid',gridTemplateColumns:'1fr 110px',gap:10,alignItems:'center',padding:10,border:'1px solid rgba(255,255,255,.07)'}}><span style={{color:'#d6d9df',fontSize:12}}>{items.find(item=>item.id===requirement.itemId)?.name??'Item removido do catálogo'}</span><label><span style={label}>Quantidade</span><input aria-label={`Quantidade de ${items.find(item=>item.id===requirement.itemId)?.name??'item'}`} style={field} type="number" min={1} value={requirement.quantity} onChange={e=>patch({seal:{...seal,requiredItems:seal.requiredItems.map(current=>current.itemId===requirement.itemId?{...current,quantity:Math.max(1,Number(e.target.value))}:current)}})}/></label></div>)}</div>}<Toggle checked={seal.durationRounds!==null} onChange={enabled=>patch({seal:{...seal,durationRounds:enabled?1:null,persistent:enabled}})}>O ritual possui duração</Toggle>{seal.durationRounds!==null&&<NumberField labelText="Duração do ritual (rodadas)" min={1} value={seal.durationRounds} onChange={durationRounds=>patch({seal:{...seal,durationRounds:Math.max(1,durationRounds),persistent:true}})}/>}<p style={{color:'#777f8d',fontSize:11}}>Os efeitos aplicados aos alvos continuam sendo definidos na seção Efeitos, inclusive duração e acúmulo de cada efeito.</p></>}
  </div>;
};

const LevelEditor:React.FC<{card:ArsenalCard; onChange:(levels:ArsenalLevel[])=>void}> = ({card,onChange}) => {
  const [selected,setSelected]=React.useState(()=>arsenalMaxLevel(card));
  const max=arsenalMaxLevel(card);
  React.useEffect(()=>{ if(selected>max) setSelected(max); },[max,selected]);
  const add=()=>{const level=max+1;onChange([...card.levels,{level}]);setSelected(level)};
  const remove=(level:number)=>{onChange(card.levels.filter(entry=>entry.level!==level).map((entry,index)=>({...entry,level:index+2})));setSelected(Math.max(1,level-1))};
  const index=card.levels.findIndex(entry=>entry.level===selected);
  const previous=arsenalCardAtLevel(card,Math.max(1,selected-1));
  const current=arsenalCardAtLevel(card,selected);
  const update=(changes:Partial<ArsenalLevel>)=>onChange(card.levels.map((entry,i)=>i===index?{...entry,...changes}:entry));
  const amountField=(key:'damage'|'healing'|'auraConsumed'|'auraRestored',title:string)=>{
    const before=effectiveAmount(previous[key]); const now=effectiveAmount(current[key]);
    return <div style={levelValueCard}><span style={label}>{title}</span><div style={comparison}><small>Nv {selected-1}: <b>{before.flat}{before.dice?` + ${before.dice}`:''}</b></small><strong>→</strong><small>Nv {selected}: <b>{now.flat}{now.dice?` + ${now.dice}`:''}</b></small></div><div style={grid}><input aria-label={`${title} fixo no nível ${selected}`} style={field} type="number" value={now.flat} onChange={e=>update({[key]:amount(current[key],Number(e.target.value),now.dice)})}/><input aria-label={`${title} dado no nível ${selected}`} style={field} value={now.dice??''} placeholder="dado opcional" onChange={e=>update({[key]:amount(current[key],now.flat,e.target.value)})}/></div></div>;
  };
  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <div style={infoBox}><strong>Progressão por níveis</strong><span>O nível novo herda todos os valores do anterior. Ao alterar um campo, a comparação mostra o resultado efetivo em tempo real.</span></div>
    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><button type="button" style={{...levelPill,background:selected===1?'rgba(224,16,43,.25)':'transparent'}} onClick={()=>setSelected(1)}>Nv 1 · Base</button>{card.levels.map(entry=><button type="button" key={entry.level} style={{...levelPill,background:selected===entry.level?'rgba(224,16,43,.25)':'transparent'}} onClick={()=>setSelected(entry.level)}>Nv {entry.level}</button>)}<button type="button" style={buttonStyle} onClick={add}><Plus size={14}/> Aumentar nível</button></div>
    {selected===1?<Empty>O nível 1 usa os valores-base. Clique em “Aumentar nível” para criar a progressão.</Empty>:<>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><strong style={{color:'#fff'}}>Editando nível {selected}</strong><button type="button" style={{...buttonStyle,color:'#fb7185'}} onClick={()=>remove(selected)}><Trash2 size={14}/> Remover nível</button></div>
      <div style={grid}>
        <div style={levelValueCard}><span style={label}>Dado de teste</span><div style={comparison}><small>Nv {selected-1}: <b>{previous.testDice||'—'}</b></small><strong>→</strong><small>Nv {selected}: <b>{current.testDice||'—'}</b></small></div><input aria-label={`Dado de teste no nível ${selected}`} style={field} value={current.testDice??''} onChange={e=>update({testDice:e.target.value||null})}/></div>
        <div style={levelValueCard}><span style={label}>Dado de dano extra</span><div style={comparison}><small>Nv {selected-1}: <b>{previous.extraDamageDice||'—'}</b></small><strong>→</strong><small>Nv {selected}: <b>{current.extraDamageDice||'—'}</b></small></div><input aria-label={`Dado extra no nível ${selected}`} style={field} value={current.extraDamageDice??''} onChange={e=>update({extraDamageDice:e.target.value||null})}/></div>
        {amountField('damage','Dano causado')}{amountField('healing','Vida curada')}{amountField('auraConsumed','Aura consumida')}{amountField('auraRestored','Aura restaurada')}
        {(card.abilityType==='forma'||current.form)&&<><div style={levelValueCard}><span style={label}>Bônus de HP da forma</span><div style={comparison}><small>{previous.form?.hpBonus??0}</small><strong>→</strong><small><b>{current.form?.hpBonus??0}</b></small></div><input style={field} type="number" value={current.form?.hpBonus??0} onChange={e=>update({form:{...(current.form??{grantedAbilityIds:[],removedAbilityIds:[],hpBonus:0,auraBonus:0}),hpBonus:Number(e.target.value)}})}/></div><div style={levelValueCard}><span style={label}>Bônus de Aura da forma</span><div style={comparison}><small>{previous.form?.auraBonus??0}</small><strong>→</strong><small><b>{current.form?.auraBonus??0}</b></small></div><input style={field} type="number" value={current.form?.auraBonus??0} onChange={e=>update({form:{...(current.form??{grantedAbilityIds:[],removedAbilityIds:[],hpBonus:0,auraBonus:0}),auraBonus:Number(e.target.value)}})}/></div></>}
        <label style={{gridColumn:'1/-1'}}><span style={label}>Descrição neste nível</span><div style={comparison}><small>Nv {selected-1}: {previous.description||'—'}</small><strong>→</strong><small>Nv {selected}: {current.description||'—'}</small></div><textarea style={{...field,minHeight:80}} value={current.description} onChange={e=>update({description:e.target.value})}/></label>
      </div>
    </>}
  </div>;
};

export default function ArsenalCardEditor({ initial, catalog, onSave, onDelete, onClose }: Props) {
  const [section, setSection] = React.useState<SectionId>('basico');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [card, setCard] = React.useState<ArsenalCard>(() => initial ? clone(initial) : createArsenalCard({ id:'', name:'', category:'habilidade', abilityType:'comum' }));
  const patch = (next: Partial<ArsenalCard>) => setCard(current => ({ ...current, ...next }));
  const formDefaults = (c: ArsenalCard): NonNullable<ArsenalCard['form']> => ({
    grantedAbilityIds: c.form?.grantedAbilityIds ?? [],
    removedAbilityIds: c.form?.removedAbilityIds ?? [],
    hpBonus: c.form?.hpBonus ?? 0,
    auraBonus: c.form?.auraBonus ?? 0,
    color: c.form?.color,
    iconOverride: c.form?.iconOverride,
    durationRounds: c.form?.durationRounds,
    effects: c.form?.effects ?? [],
  });
  const setCategory = (category:ArsenalCategory) => setCard(current => ({
    ...current, category,
    ...(category==='habilidade'&&!current.abilityType?{abilityType:'comum' as const}:{}),
    ...(category==='arma'&&!current.weapon?{weapon:{freelyEquippable:true,grantedAbilityIds:[]}}:{}),
    ...(category==='item'&&!current.item?{item:{consumable:false,quantity:1,disappearsOnUse:false}}:{}),
    ...(category==='selo'&&!current.seal?{seal:{kind:'explosao' as const,type:'ataque' as const,persistent:false,consumable:false,requiredItems:[],durationRounds:null},testDice:current.testDice??'1d20'}:{}),
  }));
  const setAbilityType = (abilityType:NonNullable<ArsenalCard['abilityType']>) => setCard(current => ({
    ...current, abilityType,
    ...(abilityType==='protecao'?{target:{type:'proprio_usuario'} as const,triggers:[{event:'ao_ser_atacado' as const}],conditions:[...current.conditions.filter(condition=>condition.type!=='reacao'),{type:'reacao' as const}],testDice:current.testDice??'1d20'}:{}),
    ...(abilityType==='combo'&&!current.combo?{combo:{stackKey:'combo-geral',maxStacks:3,resolution:'simultanea' as const}}:{}),
    ...(abilityType==='forma'&&!current.form?{form:{grantedAbilityIds:[],removedAbilityIds:[],hpBonus:0,auraBonus:0}}:{}),
  }));
  const setSealKind = (kind:'explosao'|'ritual') => setCard(current => ({
    ...current,
    seal:{kind,type:current.seal?.type??'ataque',persistent:kind==='ritual'&&(current.seal?.persistent??false),consumable:false,requiredItems:current.seal?.requiredItems??[],durationRounds:current.seal?.durationRounds??null},
    testDice:kind==='explosao'?(current.testDice??'1d20'):current.testDice,
    preparation:kind==='ritual'
      ? {...current.preparation,timing:current.preparation.timing.type==='instantaneo'?{type:'rodadas',amount:1}:current.preparation.timing,cancellable:true}
      : {...current.preparation,timing:{type:'instantaneo'}},
  }));
  const updateEffect = (index:number, next:Partial<ArsenalEffect>) => patch({ effects: card.effects.map((effect, i) => i === index ? { ...effect, ...next } : effect) });
  const updateCondition = (index:number, next:UsageCondition) => patch({ conditions:card.conditions.map((condition,i)=>i===index?next:condition) });
  const save = async () => {
    if (!card.name.trim()) { setError('Informe o nome da carta.'); setSection('basico'); return; }
    if (card.category==='selo'&&card.seal?.kind==='ritual'&&card.preparation.timing.type==='instantaneo') { setError('Selos de Ritual precisam de ao menos 1 turno ou rodada de preparação.'); setSection('preparacao'); return; }
    setSaving(true); setError('');
    try { await onSave({ ...card, id: card.id || crypto.randomUUID(), tags: [...new Set(card.tags.map(t => t.trim().toLowerCase()).filter(Boolean))] }); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  };

  const categoryOptions: { value:ArsenalCategory; label:string }[] = [
    { value:'habilidade', label:'Habilidade' }, { value:'selo', label:'Selo' }, { value:'item', label:'Item' }, { value:'arma', label:'Arma' },
  ];
  const abilities = catalog.filter(item => item.category === 'habilidade' && item.id !== card.id);
  const weapons = catalog.filter(item => item.category === 'arma');
  const forms = catalog.filter(item => item.category === 'habilidade' && item.abilityType === 'forma' && item.id !== card.id);
  const items = catalog.filter(item => item.category === 'item');

  const content = (() => {
    if (section === 'niveis') return <LevelEditor card={card} onChange={levels=>patch({levels})}/>;
    if (section === 'basico') return <div style={sectionStack}>
      <div style={editorBlock}><div style={blockHeading}><span>1</span><div><strong>Que tipo de carta é?</strong><small>Escolher uma categoria prepara as opções certas.</small></div></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:8}}>{categoryOptions.map((option,index)=><button type="button" key={option.value} onClick={()=>setCategory(option.value)} aria-pressed={card.category===option.value} style={{...choiceCard,...(card.category===option.value?selectedChoice:{})}}><b>{['✦','◇','▣','⚔'][index]}</b><strong>{option.label}</strong><small>{['Poderes e técnicas','Rituais e armadilhas','Consumíveis e utilidades','Equipamento e ataques'][index]}</small></button>)}</div>
      </div>
      <div style={editorBlock}><div style={blockHeading}><span>2</span><div><strong>Identidade da carta</strong><small>Nome e descrição são os únicos campos essenciais.</small></div></div>
      <label><span style={label}>Nome</span><input autoFocus style={{...field,fontSize:18,fontWeight:800}} value={card.name} onChange={e => patch({ name:e.target.value })} placeholder="Ex.: Lâmina do Eclipse" /></label>
      <label><span style={label}>Descrição</span><textarea style={{ ...field, minHeight:100, resize:'vertical',lineHeight:1.55 }} value={card.description} onChange={e => patch({ description:e.target.value })} placeholder="Explique o efeito para os jogadores…" /></label>
      </div><div style={{...editorBlock,display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div><span style={label}>Ícone / imagem</span><ImagePickerButton value={card.icon} onUpdate={icon => patch({ icon })} label="Imagem da carta" buttonLabel="Escolher imagem" showPreviewInline={!!card.icon} previewHeight={96} /></div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <label><span style={label}>Tags, separadas por vírgula</span><input style={field} value={card.tags.join(', ')} onChange={e => patch({ tags:e.target.value.split(',') })} placeholder="fogo, área, combo" /></label>
        <label><span style={label}>Elemento</span><select style={field} value={card.element ?? ''} onChange={e => patch({ element:(e.target.value || null) as ArsenalCard['element'] })}><option value="">Sem elemento</option>{ELEMENTS.map(el => <option key={el.value} value={el.value}>{el.label}</option>)}</select></label>
        <label><span style={label}>Visibilidade</span><select style={field} value={card.visibility} onChange={e => patch({ visibility:e.target.value as ArsenalCard['visibility'] })}><option value="publica">Pública</option><option value="privada">Privada</option><option value="mestre">Apenas mestre</option><option value="oculta">Oculta</option></select></label>
      </div>
    </div></div>;

    if (section === 'combate') return <div style={sectionStack}>
      <div style={editorBlock}><div style={blockHeading}><span><Dices size={15}/></span><div><strong>Rolagem principal</strong><small>Sem dado significa que a carta funciona automaticamente.</small></div></div><DicePicker labelText="Dado de teste" value={card.testDice} onChange={testDice=>patch({testDice})}/></div>
      <div style={editorBlock}><div style={blockHeading}><span>⚔</span><div><strong>Números da carta</strong><small>Valor fixo e dado podem ser usados juntos.</small></div></div><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
      {([['damage','Dano causado'],['healing','Vida curada'],['auraConsumed','Aura consumida'],['auraRestored','Aura restaurada']] as const).map(([key,title]) => <div key={key} style={numberCard}><Stepper labelText={`${title} fixo`} value={card[key]?.flat??0} onChange={flat=>patch({[key]:amount(card[key],flat,card[key]?.dice)})}/><DicePicker labelText={`${title} dado`} value={card[key]?.dice??null} onChange={dice=>patch({[key]:amount(card[key],card[key]?.flat??0,dice??undefined)})}/></div>)}
      </div></div><div style={editorBlock}><div style={blockHeading}><span>+</span><div><strong>Dano extra</strong><small>Rolagem separada para armas e efeitos condicionais.</small></div></div><DicePicker labelText="Dado de dano extra" value={card.extraDamageDice} onChange={extraDamageDice=>patch({extraDamageDice})}/></div>
    </div>;

    if (section === 'alvo') return <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <label><span style={label}>Sistema de alvo</span><select style={field} value={card.target.type} onChange={e => { const type=e.target.value; patch({ target:type === 'multiplos_alvos' ? { type, maxTargets:2 } : type === 'circulo_grid' ? { type, radius:1 } : { type } as ArsenalCard['target'] }); }}>
        <option value="proprio_usuario">Próprio usuário</option><option value="um_alvo">Um alvo</option><option value="multiplos_alvos">Múltiplos alvos</option><option value="todos_aliados">Todos aliados</option><option value="todos_inimigos">Todos inimigos</option><option value="todos_em_area">Todos em área</option><option value="circulo_grid">Círculo no grid</option><option value="celula_grid">Célula específica</option><option value="objeto_mapa">Objeto/interação</option><option value="campo_de_batalha">Campo de batalha (mapa inteiro)</option>
      </select></label>
      {card.target.type === 'multiplos_alvos' && <NumberField labelText="Máximo de alvos" min={1} value={card.target.maxTargets} onChange={maxTargets => patch({ target:{ type:'multiplos_alvos', maxTargets } })} />}
      {card.target.type === 'circulo_grid' && <NumberField labelText="Raio em espaços do grid" min={1} value={card.target.radius} onChange={radius => patch({ target:{ type:'circulo_grid', radius }, area:{ shape:'circulo', size:radius, unit:'celulas' } })} />}
      <Toggle checked={!!card.area} onChange={enabled => patch({ area:enabled ? { shape:'circulo', size:1, unit:'celulas' } : null })}>Configurar área de efeito adicional</Toggle>
      {card.area && <div style={grid}><label><span style={label}>Formato</span><select style={field} value={card.area.shape} onChange={e => patch({ area:{ ...card.area!, shape:e.target.value as NonNullable<ArsenalCard['area']>['shape'] } })}><option value="circulo">Círculo</option><option value="cone">Cone</option><option value="linha">Linha</option><option value="quadrado">Quadrado</option><option value="customizada">Customizada</option></select></label><NumberField labelText="Tamanho" min={1} value={card.area.size} onChange={size => patch({ area:{ ...card.area!, size } })} /></div>}
    </div>;

    if (section === 'efeitos') return <div style={sectionStack}>
      <div style={editorBlock}><div style={blockHeading}><span><Sparkles size={15}/></span><div><strong>Escolha um efeito pronto</strong><small>Um clique adiciona; depois você pode ajustar duração e intensidade.</small></div></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:8}}>{PREDEFINED_ARSENAL_EFFECTS.map(effect=><button type="button" key={effect.id} onClick={()=>patch({effects:[...card.effects,clone(effect)]})} style={presetCard}><b>{effect.name}</b><small>{effect.description||'Efeito clássico configurável'}</small><span><Plus size={12}/> adicionar</span></button>)}</div>
        <details><summary style={{...summaryStyle,padding:'10px 0',color:'#788391'}}>Seleção compacta</summary><div style={{display:'flex',gap:8}}><select aria-label="Efeito clássico" id="preset-effect" style={field} defaultValue=""><option value="">Selecionar efeito clássico…</option>{PREDEFINED_ARSENAL_EFFECTS.map(effect=><option key={effect.id} value={effect.id}>{effect.name}</option>)}</select><button type="button" style={buttonStyle} onClick={()=>{const el=document.getElementById('preset-effect') as HTMLSelectElement;const selected=PREDEFINED_ARSENAL_EFFECTS.find(effect=>effect.id===el.value);if(selected)patch({effects:[...card.effects,clone(selected)]});}}><Plus size={14}/> Adicionar efeito clássico</button></div></details>
      </div>
      <button type="button" aria-label="Efeito customizado" style={{...buttonStyle,alignSelf:'flex-start',padding:'12px 16px'}} onClick={()=>patch({effects:[...card.effects,blankEffect()]})}><Plus size={14}/> Criar efeito do zero</button>
      {card.effects.length === 0 && <Empty>Nenhum efeito configurado.</Empty>}
      {card.effects.map((effect,index) => <details key={`${effect.id}-${index}`} open={index === card.effects.length - 1} style={detailStyle}>
        <summary style={summaryStyle}><span>{effect.name}</span><button type="button" onClick={e => { e.preventDefault(); patch({ effects:card.effects.filter((_,i)=>i!==index) }); }} style={iconButton}><Trash2 size={14}/></button></summary>
        <EffectEditor effect={effect} index={index} catalog={catalog.filter(item=>item.id!==card.id)} weapons={weapons} onUpdate={updateEffect} onRemove={i=>patch({ effects:card.effects.filter((_,idx)=>idx!==i) })}/>
      </details>)}
    </div>;

    if (section === 'condicoes') return <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <button style={{ ...buttonStyle, alignSelf:'flex-start' }} onClick={() => patch({ conditions:[...card.conditions, blankCondition('arma_equipada')] })}><Plus size={14}/> Adicionar condição</button>
      {card.conditions.map((condition,index) => <div key={index} style={{ ...grid, padding:12, border:'1px solid rgba(255,255,255,.08)', borderRadius:10 }}>
        <label><span style={label}>Condição</span><select style={field} value={condition.type} onChange={e=>updateCondition(index,blankCondition(e.target.value as UsageCondition['type']))}>{['arma_equipada','forma_ativa','elemento','aura_minima','vida_acima','vida_abaixo','efeito_ativo','alvo_com_efeito','proprio_turno','reacao','fora_turno','em_combate','fora_combate','tag'].map(v=><option key={v} value={v}>{triggerLabel(v)}</option>)}</select></label>
        <div style={{display:'flex',alignItems:'end',gap:8}}>
          {condition.type==='arma_equipada'&&<CardPicker labelText="Quais armas" items={weapons} value={condition.weaponIds??[]} onChange={weaponIds=>updateCondition(index,{...condition,weaponIds})}/>}
          {condition.type==='forma_ativa'&&<CardPicker labelText="Quais formas" items={forms} value={condition.formIds??[]} onChange={formIds=>updateCondition(index,{...condition,formIds})}/>}
          {condition.type==='elemento'&&<select style={field} value={condition.element} onChange={e=>updateCondition(index,{...condition,element:e.target.value as ArsenalCard['element'] & string})}>{ELEMENTS.map(el=><option key={el.value} value={el.value}>{el.label}</option>)}</select>}
          {condition.type==='aura_minima'&&<input aria-label="Aura mínima" style={field} type="number" value={condition.amount} onChange={e=>updateCondition(index,{...condition,amount:Number(e.target.value)})}/>} 
          {(condition.type==='vida_acima'||condition.type==='vida_abaixo')&&<><input aria-label="Limite de vida" style={field} type="number" value={condition.value} onChange={e=>updateCondition(index,{...condition,value:Number(e.target.value)})}/><select style={field} value={condition.unit} onChange={e=>updateCondition(index,{...condition,unit:e.target.value as 'valor'|'percentual'})}><option value="valor">Valor</option><option value="percentual">Percentual</option></select></>}
          {(condition.type==='efeito_ativo'||condition.type==='alvo_com_efeito')&&<select style={field} value={condition.effectId} onChange={e=>updateCondition(index,{...condition,effectId:e.target.value})}><option value="">Selecione um efeito</option>{PREDEFINED_ARSENAL_EFFECTS.map(effect=><option key={effect.id} value={effect.id}>{effect.name}</option>)}</select>}
          {condition.type==='tag'&&<><input style={field} placeholder="tag" value={condition.tag} onChange={e=>updateCondition(index,{...condition,tag:e.target.value})}/><select style={field} value={condition.subject} onChange={e=>updateCondition(index,{...condition,subject:e.target.value as 'usuario'|'alvo'|'carta'})}><option value="usuario">Usuário</option><option value="alvo">Alvo</option><option value="carta">Carta</option></select></>}
          <button aria-label="Remover condição" style={iconButton} onClick={()=>patch({conditions:card.conditions.filter((_,i)=>i!==index)})}><Trash2 size={14}/></button>
        </div>
      </div>)}
      {card.conditions.length===0 && <Empty>Nenhuma condição de uso.</Empty>}
    </div>;

    if (section === 'gatilhos') return <div style={{ display:'flex', flexDirection:'column', gap:12 }}><button style={{ ...buttonStyle, alignSelf:'flex-start' }} onClick={() => patch({ triggers:[...card.triggers,{ event:'uso_manual' }] })}><Plus size={14}/> Adicionar gatilho</button>{card.triggers.map((trigger,index)=><div key={index} style={{display:'flex',flexDirection:'column',gap:12,padding:12,border:'1px solid rgba(255,255,255,.08)',borderRadius:10}}><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:10 }}><select aria-label={`Evento do gatilho ${index+1}`} style={field} value={trigger.event} onChange={e => patch({ triggers:card.triggers.map((t,i)=>i===index?{...t,event:e.target.value as TriggerEvent}:t) })}>{TRIGGERS.map(t=><option key={t} value={t}>{triggerLabel(t)}</option>)}</select><input aria-label={`Tags do gatilho ${index+1}`} style={field} placeholder="tags opcionais" value={(trigger.tags??[]).join(', ')} onChange={e => patch({ triggers:card.triggers.map((t,i)=>i===index?{...t,tags:e.target.value.split(',').map(v=>v.trim()).filter(Boolean)}:t) })}/><button aria-label={`Remover gatilho ${index+1}`} style={iconButton} onClick={()=>patch({triggers:card.triggers.filter((_,i)=>i!==index)})}><Trash2 size={14}/></button></div><CardPicker labelText="Cartas disparadas por este gatilho" items={catalog.filter(item=>item.id!==card.id)} value={trigger.cardIds??[]} onChange={cardIds=>patch({triggers:card.triggers.map((current,i)=>i===index?{...current,cardIds}:current)})}/></div>)}</div>;

    if (section === 'preparacao') { const timing=card.preparation.timing; return <div style={{ display:'flex', flexDirection:'column', gap:16 }}><label><span style={label}>Tempo de preparação</span><select style={field} value={timing.type} onChange={e => { const type=e.target.value; patch({ preparation:{ ...card.preparation, timing:type==='turnos'||type==='rodadas'?{type,amount:1}:type==='gatilho'?{type,trigger:'ao_ser_atacado'}:{type} as ArsenalCard['preparation']['timing'] } }); }}>{['instantaneo','turnos','rodadas','inicio_proximo_turno','fim_turno_atual','gatilho'].map(v=><option key={v} value={v}>{triggerLabel(v)}</option>)}</select></label>{(timing.type==='turnos'||timing.type==='rodadas')&&<NumberField labelText="Quantidade" min={1} value={timing.amount} onChange={amount=>patch({preparation:{...card.preparation,timing:{...timing,amount}}})}/>} {timing.type==='gatilho'&&<select style={field} value={timing.trigger} onChange={e=>patch({preparation:{...card.preparation,timing:{type:'gatilho',trigger:e.target.value as TriggerEvent}}})}>{TRIGGERS.map(t=><option key={t} value={t}>{triggerLabel(t)}</option>)}</select>}<div style={{display:'flex',gap:18,flexWrap:'wrap'}}><Toggle checked={card.preparation.cancellable} onChange={cancellable=>patch({preparation:{...card.preparation,cancellable}})}>Pode ser cancelada</Toggle><Toggle checked={card.preparation.interruptedByDamage} onChange={interruptedByDamage=>patch({preparation:{...card.preparation,interruptedByDamage}})}>Interrompida por dano</Toggle><Toggle checked={card.preparation.persistsAfterDamage} onChange={persistsAfterDamage=>patch({preparation:{...card.preparation,persistsAfterDamage}})}>Permanece após dano</Toggle></div><label><span style={label}>Visibilidade da preparação</span><select style={field} value={card.preparation.visibility} onChange={e=>patch({preparation:{...card.preparation,visibility:e.target.value as 'visivel'|'oculta'}})}><option value="visivel">Visível</option><option value="oculta">Oculta</option></select></label></div> }

    if(section==='recursos') { const cooldown=card.cooldown; const recharge=card.charges?.recharge; return <div style={{display:'flex',flexDirection:'column',gap:18}}><label><span style={label}>Cooldown</span><select style={field} value={cooldown.type} onChange={e=>{const type=e.target.value;patch({cooldown:type==='turnos'||type==='rodadas'||type==='usos'?{type,amount:1}:type==='gatilho'?{type,trigger:'fim_turno'}:{type} as ArsenalCard['cooldown']})}}><option value="sem_cooldown">Sem cooldown</option><option value="turnos">X turnos</option><option value="rodadas">X rodadas</option><option value="usos">X usos</option><option value="fim_combate">Fim do combate</option><option value="descanso">Descanso</option><option value="gatilho">Por gatilho</option></select></label>{(cooldown.type==='turnos'||cooldown.type==='rodadas'||cooldown.type==='usos')&&<NumberField labelText="Quantidade" min={1} value={cooldown.amount} onChange={amount=>patch({cooldown:{...cooldown,amount}})}/>} {cooldown.type==='gatilho'&&<label><span style={label}>Gatilho de recarga</span><select style={field} value={cooldown.trigger} onChange={e=>patch({cooldown:{type:'gatilho',trigger:e.target.value as TriggerEvent}})}>{TRIGGERS.map(trigger=><option key={trigger} value={trigger}>{triggerLabel(trigger)}</option>)}</select></label>}<Toggle checked={!!card.charges} onChange={enabled=>patch({charges:enabled?{maximum:1,current:1,recharge:{type:'nao_recarrega'}}:null})}>Usa cargas</Toggle>{card.charges&&<div style={grid}><NumberField labelText="Máximo" min={1} value={card.charges.maximum} onChange={maximum=>patch({charges:{...card.charges!,maximum,current:Math.min(card.charges!.current,maximum)}})}/><NumberField labelText="Atual" min={0} value={card.charges.current} onChange={current=>patch({charges:{...card.charges!,current}})}/><label style={{gridColumn:'1/-1'}}><span style={label}>Recarga</span><select style={field} value={card.charges.recharge.type} onChange={e=>{const type=e.target.value;const nextRecharge:NonNullable<ArsenalCard['charges']>['recharge']=type==='por_evento'?{type,event:'inicio_turno',amount:1}:type==='nao_recarrega'?{type}:{type:type as 'automatica'|'por_turno'|'por_rodada',amount:1};patch({charges:{...card.charges!,recharge:nextRecharge}})}}><option value="automatica">Automática</option><option value="por_turno">Por turno</option><option value="por_rodada">Por rodada</option><option value="por_evento">Por evento</option><option value="nao_recarrega">Não recarrega</option></select></label>{recharge&&recharge.type!=='nao_recarrega'&&<NumberField labelText="Quantidade recarregada" min={1} value={recharge.amount} onChange={amount=>patch({charges:{...card.charges!,recharge:{...recharge,amount}}})}/>} {recharge?.type==='por_evento'&&<label><span style={label}>Evento de recarga</span><select style={field} value={recharge.event} onChange={e=>patch({charges:{...card.charges!,recharge:{...recharge,event:e.target.value as TriggerEvent}}})}>{TRIGGERS.map(trigger=><option key={trigger} value={trigger}>{triggerLabel(trigger)}</option>)}</select></label>}</div>}</div> }

    if(section==='vinculos') return <div style={{display:'flex',flexDirection:'column',gap:18}}><div style={infoBox}><strong>Disponibilidade vinculada</strong><span>A carta só aparece quando ao menos uma das armas ou formas escolhidas estiver ativa. Clique novamente numa seleção para removê-la.</span></div><div style={grid}><CardPicker labelText="Armas vinculadas" items={weapons} value={card.weaponLinks} onChange={weaponLinks=>patch({weaponLinks})}/><CardPicker labelText="Formas vinculadas" items={forms} value={card.formLinks} onChange={formLinks=>patch({formLinks})}/></div></div>;

    return <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {card.category==='habilidade'&&<><label><span style={label}>Tipo de habilidade</span><select style={field} value={card.abilityType??'comum'} onChange={e=>setAbilityType(e.target.value as NonNullable<ArsenalCard['abilityType']>)}><option value="comum">Comum</option><option value="protecao">Proteção</option><option value="combo">Combo</option><option value="forma">Forma</option></select></label>{card.abilityType==='protecao'&&<div style={infoBox}><strong>Reação opcional de proteção</strong><span>Quando o personagem for alvejado por outra carta, esta proteção será oferecida. Sua rolagem será animada e somada à defesa antes da comparação com o ataque.</span></div>}{card.abilityType==='combo'&&<div style={{...grid,padding:16,border:'1px solid rgba(167,139,250,.25)',background:'rgba(91,33,182,.08)'}}><label><span style={label}>Grupo de stack</span><input style={field} value={card.combo?.stackKey??'combo-geral'} onChange={e=>patch({combo:{stackKey:e.target.value,maxStacks:card.combo?.maxStacks??3,resolution:'simultanea'}})} placeholder="ex: corrente-elemental"/></label><NumberField labelText="Máximo de stacks" min={1} value={card.combo?.maxStacks??3} onChange={maxStacks=>patch({combo:{stackKey:card.combo?.stackKey??'combo-geral',maxStacks:Math.max(1,maxStacks),resolution:'simultanea'}})}/><p style={{gridColumn:'1/-1',color:'#a9a1bc',fontSize:11,lineHeight:1.5}}>Ao jogar esta carta, o jogo oferecerá somente outras habilidades de combo do mesmo grupo. A carta inicial conta como 1 stack.</p></div>}{card.abilityType==='forma'&&<div style={{...grid,padding:16,border:'1px solid rgba(245,158,11,.25)',background:'rgba(120,53,15,.08)'}}>
  <CardPicker labelText="Habilidades liberadas pela forma" items={abilities} value={card.form?.grantedAbilityIds??[]} onChange={grantedAbilityIds=>patch({form:{...formDefaults(card),grantedAbilityIds}})}/>
  <CardPicker labelText="Habilidades removidas pela forma" items={abilities} value={card.form?.removedAbilityIds??[]} onChange={removedAbilityIds=>patch({form:{...formDefaults(card),removedAbilityIds}})}/>
  <NumberField labelText="Bônus de PV" value={card.form?.hpBonus??0} onChange={hpBonus=>patch({form:{...formDefaults(card),hpBonus}})}/>
  <NumberField labelText="Bônus de Aura" value={card.form?.auraBonus??0} onChange={auraBonus=>patch({form:{...formDefaults(card),auraBonus}})}/>
  <NumberField labelText="Duração (rodadas, 0 = permanente)" min={0} value={card.form?.durationRounds??0} onChange={durationRounds=>patch({form:{...formDefaults(card),durationRounds:durationRounds>0?durationRounds:null}})}/>
  <label><span style={label}>Cor da aura</span><input type="color" style={{...field,padding:4,height:40}} value={card.form?.color??'#f59e0b'} onChange={e=>patch({form:{...formDefaults(card),color:e.target.value}})}/></label>
  <div style={{gridColumn:'1/-1'}}><span style={label}>Ícone de transformação</span><ImagePickerButton value={card.form?.iconOverride??''} onUpdate={iconOverride=>patch({form:{...formDefaults(card),iconOverride}})} label="Ícone de transformação" buttonLabel="Escolher ícone" showPreviewInline={!!card.form?.iconOverride} previewHeight={72} /></div>
  <EffectPicker labelText="Efeitos passivos concedidos pela forma" cardEffects={card.effects} value={card.form?.effects??[]} onChange={effects=>patch({form:{...formDefaults(card),effects}})}/>
</div>}</>}
      {card.category==='item'&&<div style={grid}><Toggle checked={card.item?.consumable??false} onChange={consumable=>patch({item:{consumable,quantity:card.item?.quantity??1,disappearsOnUse:card.item?.disappearsOnUse??false,usesPerActivation:card.item?.usesPerActivation}})}>Consumível</Toggle><Toggle checked={card.item?.disappearsOnUse??false} onChange={disappearsOnUse=>patch({item:{consumable:card.item?.consumable??false,quantity:card.item?.quantity??1,disappearsOnUse,usesPerActivation:card.item?.usesPerActivation}})}>Desaparece após uso</Toggle><NumberField labelText="Quantidade" min={0} value={card.item?.quantity??1} onChange={quantity=>patch({item:{consumable:card.item?.consumable??false,quantity,disappearsOnUse:card.item?.disappearsOnUse??false,usesPerActivation:card.item?.usesPerActivation}})}/><NumberField labelText="Unidades consumidas por uso" min={1} value={card.item?.usesPerActivation??1} onChange={usesPerActivation=>patch({item:{consumable:card.item?.consumable??false,quantity:card.item?.quantity??1,disappearsOnUse:card.item?.disappearsOnUse??false,usesPerActivation}})}/><p style={{gridColumn:'1/-1',color:'#777',fontSize:11}}>Efeitos permanentes ou temporários são configurados na seção Efeitos.</p></div>}
      {card.category==='selo'&&<SealCategoryEditor card={card} items={items} patch={patch} setSealKind={setSealKind}/>} 
      {card.category==='arma'&&<div style={grid}>
        <CardPicker labelText="Habilidades liberadas pela arma" items={abilities} value={card.weapon?.grantedAbilityIds??[]} onChange={grantedAbilityIds=>patch({weapon:{freelyEquippable:true,grantedAbilityIds:grantedAbilityIds,effects:card.weapon?.effects??[]}})}/>
        <EffectPicker labelText="Efeitos passivos concedidos enquanto equipada" cardEffects={card.effects} value={card.weapon?.effects??[]} onChange={effects=>patch({weapon:{freelyEquippable:true,grantedAbilityIds:card.weapon?.grantedAbilityIds??[],effects}})}/>
      </div>} 
    </div>;
  })();

  const sectionIndex=SECTIONS.findIndex(item=>item.id===section);
  const goSection=(offset:number)=>setSection(SECTIONS[Math.max(0,Math.min(SECTIONS.length-1,sectionIndex+offset))].id);
  const cardAccent=card.element?'#7dd3fc':card.category==='arma'?'#f59e0b':card.category==='selo'?'#a78bfa':'#e94b64';

  return <div role="dialog" aria-modal="true" aria-label="Editor de Carta de Arsenal" style={{position:'fixed',inset:0,zIndex:100000,background:'rgba(3,4,8,.88)',backdropFilter:'blur(18px)',display:'grid',placeItems:'center',padding:24}}>
    <div style={{width:'min(1420px,97vw)',height:'min(900px,96vh)',background:'radial-gradient(circle at 80% 0%,rgba(78,96,125,.14),transparent 32%),linear-gradient(145deg,#14171d,#090b0f)',border:'1px solid rgba(148,163,184,.2)',borderRadius:18,boxShadow:'0 34px 120px rgba(0,0,0,.82)',display:'grid',gridTemplateRows:'auto 1fr auto',overflow:'hidden'}}>
      <header style={{display:'flex',alignItems:'center',gap:14,padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.07)',background:'rgba(255,255,255,.018)'}}><div style={{width:38,height:38,borderRadius:11,display:'grid',placeItems:'center',background:`${cardAccent}18`,border:`1px solid ${cardAccent}55`,color:cardAccent}}><Sparkles size={18}/></div><div style={{flex:1}}><div style={{fontSize:9,color:'#8090a2',fontWeight:900,letterSpacing:'.25em'}}>OFICINA DO MESTRE</div><h2 style={{fontSize:20,color:'#f8fafc',marginTop:3}}>{card.id ? `Editando ${card.name||'carta sem nome'}` : 'Criar nova carta'}</h2></div><div style={{color:'#697586',fontSize:11}}>{sectionIndex+1} de {SECTIONS.length}</div><button aria-label="Fechar" onClick={onClose} style={iconButton}><X size={18}/></button></header>
      <div style={{display:'grid',gridTemplateColumns:'190px minmax(0,1fr) 270px',minHeight:0}}><nav style={{padding:12,borderRight:'1px solid rgba(255,255,255,.07)',overflow:'auto',background:'rgba(0,0,0,.16)'}}><div style={{padding:'7px 9px 12px',color:'#596474',fontSize:9,fontWeight:900,letterSpacing:'.16em'}}>ETAPAS DA CARTA</div>{SECTIONS.map((item,index)=>{const active=section===item.id;return <button key={item.id} onClick={()=>setSection(item.id)} style={{width:'100%',display:'grid',gridTemplateColumns:'24px 1fr',alignItems:'center',gap:8,padding:'9px 8px',marginBottom:3,textAlign:'left',border:'1px solid '+(active?`${cardAccent}55`:'transparent'),borderRadius:9,background:active?`${cardAccent}13`:'transparent',color:active?'#f1f5f9':'#737f8d',fontSize:10.5,fontWeight:800,cursor:'pointer'}}><span style={{width:22,height:22,borderRadius:7,display:'grid',placeItems:'center',background:active?cardAccent:'#20252d',color:active?'#091016':'#66717e',fontSize:9}}>{index+1}</span><span>{sectionLabel(item,card)}</span></button>})}</nav><main style={{padding:'20px 22px 32px',overflow:'auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}><h3 style={{fontSize:15,color:'#eee',textTransform:'uppercase',letterSpacing:'.16em'}}>{sectionLabel(SECTIONS.find(item=>item.id===section)!,card)}</h3><span style={{height:1,flex:1,background:'linear-gradient(90deg,rgba(224,16,43,.5),transparent)'}}/></div>
        <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:20}}>
          <span style={summaryChip}>{card.name.trim()||'Sem nome'}</span>
          <span style={summaryChip}>{CATEGORY_LABEL[card.category]}{card.category==='habilidade'&&card.abilityType&&card.abilityType!=='comum'?` · ${ABILITY_TYPE_LABEL[card.abilityType]}`:''}</span>
          {card.element&&<span style={summaryChip}>{ELEMENTS.find(el=>el.value===card.element)?.label}</span>}
          {card.testDice&&<span style={summaryChip}>Teste {card.testDice}</span>}
          {!!card.damage&&<span style={summaryChip}>Dano {card.damage.flat}{card.damage.dice?` + ${card.damage.dice}`:''}</span>}
          {!!card.healing&&<span style={summaryChip}>Cura {card.healing.flat}{card.healing.dice?` + ${card.healing.dice}`:''}</span>}
          {!!card.auraConsumed&&<span style={summaryChip}>{card.auraConsumed.flat} aura</span>}
          {card.cooldown.type!=='sem_cooldown'&&<span style={summaryChip}>{triggerLabel(card.cooldown.type)}</span>}
        </div>
        {content}
      </main>
      <aside style={{borderLeft:'1px solid rgba(255,255,255,.07)',padding:16,background:'rgba(0,0,0,.18)',overflow:'auto'}}>
        <div style={{fontSize:9,color:'#647182',fontWeight:900,letterSpacing:'.18em',marginBottom:12}}>PRÉVIA AO VIVO</div>
        <ArsenalCardPreview card={card}/>
        <div style={{marginTop:14,padding:12,borderRadius:10,background:'rgba(255,255,255,.025)',color:'#6f7b89',fontSize:10,lineHeight:1.55}}>A prévia mostra exatamente a mesma carta que aparecerá no Arsenal e na Cena.</div>
      </aside>
    </div>
      <footer style={{display:'flex',alignItems:'center',gap:10,padding:'14px 22px',borderTop:'1px solid rgba(255,255,255,.08)'}}>{error&&<span style={{color:'#fb7185',fontSize:12,flex:1}}>{error}</span>} {!error&&<span style={{flex:1,color:'#696973',fontSize:11}}>Campos avançados ficam separados para manter a edição legível.</span>}{card.id&&onDelete&&<button style={{...buttonStyle,color:'#fb7185'}} onClick={()=>onDelete(card.id)}><Trash2 size={14}/> Excluir</button>}<button style={buttonStyle} onClick={onClose}>Cancelar</button><button style={{...buttonStyle,background:'#b50f27',borderColor:'#e0102b',color:'#fff'}} disabled={saving} onClick={save}><Save size={14}/> {saving?'Salvando…':'Salvar carta'}</button></footer>
    </div>
  </div>;
}

const buttonStyle:React.CSSProperties={display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,padding:'9px 13px',borderRadius:8,border:'1px solid rgba(255,255,255,.12)',background:'rgba(255,255,255,.05)',color:'#c9c9d0',fontSize:11,fontWeight:800,cursor:'pointer'};
const iconButton:React.CSSProperties={...buttonStyle,padding:8};
const detailStyle:React.CSSProperties={border:'1px solid rgba(255,255,255,.09)',borderRadius:10,background:'rgba(255,255,255,.02)',overflow:'hidden'};
const summaryStyle:React.CSSProperties={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',cursor:'pointer',color:'#eee',fontSize:12,fontWeight:800};
const pickerList:React.CSSProperties={maxHeight:250,overflow:'auto',display:'grid',gap:6,padding:6,border:'1px solid rgba(255,255,255,.08)',borderRadius:9,background:'rgba(0,0,0,.18)'};
const pickerItem:React.CSSProperties={display:'flex',alignItems:'center',gap:9,width:'100%',padding:'8px',border:'1px solid rgba(255,255,255,.07)',borderRadius:7,color:'#dfe7ef',cursor:'pointer'};
const pickerChip:React.CSSProperties={display:'inline-flex',alignItems:'center',gap:5,padding:'5px 8px',border:'1px solid rgba(125,210,240,.32)',borderRadius:999,background:'rgba(35,76,96,.3)',fontSize:10,cursor:'pointer'};
const infoBox:React.CSSProperties={display:'flex',flexDirection:'column',gap:5,padding:13,border:'1px solid rgba(125,210,240,.18)',borderLeft:'3px solid #7dd3fc',background:'rgba(14,116,144,.08)',color:'#9ca8b7',fontSize:11,lineHeight:1.5};
const summaryChip:React.CSSProperties={padding:'5px 10px',borderRadius:999,border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.03)',color:'#b6b6bf',fontSize:10.5,fontWeight:700,letterSpacing:'.02em',whiteSpace:'nowrap'};
const fieldset:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:14,padding:14,border:'1px solid rgba(255,255,255,.07)',borderRadius:10,background:'rgba(255,255,255,.015)'};
const fieldsetTitle:React.CSSProperties={gridColumn:'1/-1',margin:'0 0 2px',color:'#d6d9df',fontSize:12,fontWeight:800,letterSpacing:'.04em'};
const sectionStack:React.CSSProperties={display:'flex',flexDirection:'column',gap:12};
const editorBlock:React.CSSProperties={display:'flex',flexDirection:'column',gap:14,padding:16,border:'1px solid rgba(255,255,255,.075)',borderRadius:13,background:'linear-gradient(145deg,rgba(255,255,255,.025),rgba(255,255,255,.01))'};
const blockHeading:React.CSSProperties={display:'flex',alignItems:'center',gap:10,paddingBottom:4,color:'#e7edf5'};
const choiceCard:React.CSSProperties={display:'flex',flexDirection:'column',alignItems:'flex-start',gap:5,minHeight:92,padding:12,border:'1px solid rgba(255,255,255,.09)',borderRadius:11,background:'rgba(255,255,255,.02)',color:'#c8d0da',textAlign:'left',cursor:'pointer'};
const selectedChoice:React.CSSProperties={border:'1px solid rgba(125,211,252,.65)',background:'rgba(14,116,144,.15)',color:'#eefaff',boxShadow:'inset 0 0 0 1px rgba(125,211,252,.08)'};
const diceChip:React.CSSProperties={padding:'7px 10px',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,background:'rgba(255,255,255,.025)',color:'#9da8b6',fontSize:11,fontWeight:800,cursor:'pointer'};
const numberCard:React.CSSProperties={display:'flex',flexDirection:'column',gap:10,padding:12,border:'1px solid rgba(255,255,255,.07)',borderRadius:11,background:'rgba(0,0,0,.12)'};
const stepButton:React.CSSProperties={height:36,border:'1px solid rgba(255,255,255,.1)',borderRadius:8,background:'rgba(255,255,255,.04)',color:'#cbd5e1',fontSize:18,cursor:'pointer'};
const presetCard:React.CSSProperties={display:'flex',flexDirection:'column',alignItems:'flex-start',gap:6,minHeight:100,padding:12,border:'1px solid rgba(167,139,250,.18)',borderRadius:11,background:'linear-gradient(145deg,rgba(91,33,182,.1),rgba(255,255,255,.015))',color:'#ddd6fe',textAlign:'left',cursor:'pointer'};
const previewCard:React.CSSProperties={display:'flex',flexDirection:'column',gap:11,padding:12,border:'1px solid rgba(255,255,255,.12)',borderRadius:15,background:'linear-gradient(155deg,#171b22,#0d1015)'};
const previewPill:React.CSSProperties={padding:'4px 7px',border:'1px solid rgba(255,255,255,.09)',borderRadius:999,background:'rgba(255,255,255,.04)',color:'#aab4c2',fontSize:9.5,fontWeight:700};
const kindCard:React.CSSProperties={display:'flex',flexDirection:'column',gap:8,padding:16,minHeight:105,textAlign:'left',border:'1px solid rgba(255,255,255,.09)',color:'#edf1f7',cursor:'pointer',fontSize:12,lineHeight:1.45};
const levelPill:React.CSSProperties={padding:'8px 11px',border:'1px solid rgba(224,16,43,.35)',borderRadius:999,color:'#eee',fontSize:11,fontWeight:900,cursor:'pointer'};
const levelValueCard:React.CSSProperties={padding:13,border:'1px solid rgba(255,255,255,.09)',borderRadius:10,background:'rgba(255,255,255,.02)'};
const comparison:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:9,minHeight:34,marginBottom:9,color:'#7f8794',fontSize:11};
const Empty:React.FC<{children:React.ReactNode}>=({children})=><div style={{padding:30,textAlign:'center',border:'1px dashed rgba(255,255,255,.1)',color:'#696973',fontSize:12}}>{children}</div>;
