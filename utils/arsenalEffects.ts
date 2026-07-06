import type { ArsenalEffect, ClassicEffectConfig } from './arsenal';

interface ClassicSeed {
  name: string;
  description: string;
  tags: string[];
  classic: ClassicEffectConfig;
}

const seeds: ClassicSeed[] = [
  { name:'Queimadura', description:'Causa X de dano de fogo no início de cada turno.', tags:['fogo','dano-periodico'], classic:{kind:'queimadura',value:2} },
  { name:'Congelamento', description:'Faz o personagem perder X turnos.', tags:['gelo','controle'], classic:{kind:'congelamento',value:1} },
  { name:'Lentidão', description:'Move o personagem X posições para depois enquanto durar.', tags:['controle','ordem'], classic:{kind:'lentidao',value:1} },
  { name:'Molhado', description:'Multiplica por X o próximo dano elétrico recebido e então é consumido.', tags:['agua','interacao'], classic:{kind:'molhado',value:1.5} },
  { name:'Eletrocutado', description:'Causa X de dano de raio no início de cada turno.', tags:['raio','dano-periodico'], classic:{kind:'eletrocutado',value:2} },
  { name:'Sangramento', description:'Causa X de dano físico, fixo ou percentual da vida máxima, no início de cada turno.', tags:['fisico','dano-periodico'], classic:{kind:'sangramento',value:2,mode:'fixo'} },
  { name:'Fraqueza', description:'Reduz os testes de ataque por subtração ou divisão.', tags:['debuff','ataque'], classic:{kind:'fraqueza',value:2,mode:'subtrair'} },
  { name:'Acelerado', description:'Move o personagem X posições para antes enquanto durar.', tags:['buff','ordem'], classic:{kind:'acelerado',value:1} },
  { name:'Desnorteado', description:'Impede o uso de ações principais enquanto durar.', tags:['controle','acao'], classic:{kind:'desnorteado',value:1} },
  { name:'Paralisado', description:'Deve rolar 1d20 e obter pelo menos X para poder agir.', tags:['controle','teste'], classic:{kind:'paralisado',value:10} },
  { name:'Confuso', description:'Chance de a ação ser perdida (ficar parado) em vez de executada.', tags:['controle','aleatorio'], classic:{kind:'confuso',value:0.25} },
];

interface ElementalSeed {
  name: string;
  description: string;
  tags: string[];
  classic: ClassicEffectConfig;
  speedModifier?: number;
  attackModifier?: number;
  defenseModifier?: number;
  elementalAffinities?: ArsenalEffect['elementalAffinities'];
  modifiers?: ArsenalEffect['modifiers'];
}

const elementalSeeds: ElementalSeed[] = [
  { name:'Enraizado', description:'Reduz a velocidade pela metade enquanto durar.', tags:['terra','controle'],
    classic:{kind:'enraizado',value:50}, speedModifier:-50 },
  { name:'Desequilibrado', description:'Reduz os testes de ataque enquanto durar.', tags:['vento','debuff'],
    classic:{kind:'desequilibrado',value:2}, attackModifier:-2 },
  { name:'Fraturado', description:'Reduz a defesa e aumenta o dano físico recebido.', tags:['fisico','debuff'],
    classic:{kind:'fraturado',value:2}, defenseModifier:-2,
    elementalAffinities:[{element:'fisico',kind:'vulnerabilidade',percent:25}] },
  { name:'Iluminado', description:'Aumenta o dano de trevas recebido.', tags:['luminoso','debuff'],
    classic:{kind:'iluminado',value:25}, elementalAffinities:[{element:'escuridão',kind:'vulnerabilidade',percent:25}] },
  { name:'Amaldiçoado', description:'Reduz cura e recuperação de aura recebidas, e penaliza testes de ataque.', tags:['escuridão','debuff'],
    classic:{kind:'amaldicoado',value:50}, attackModifier:-2,
    modifiers:[{stat:'cura_recebida',operation:'multiplicar',value:-50},{stat:'aura_recebida',operation:'multiplicar',value:-50}] },
];

function slug(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function makeClassic(seed: ClassicSeed): ArsenalEffect {
  return {
    id:`classic-${slug(seed.name)}`, name:seed.name, description:seed.description, tags:seed.tags,
    duration:{type:'rodadas',amount:2}, stackBehavior:'renova_duracao', maxStacks:1,
    triggers:[], modifiers:[], periodicDamage:null, periodicHealing:null, auraConsumed:null, auraRestored:null,
    attackModifier:0, defenseModifier:0, speedModifier:0, customEffect:null, classic:seed.classic,
  };
}

function makeElemental(seed: ElementalSeed): ArsenalEffect {
  return {
    id:`classic-${slug(seed.name)}`, name:seed.name, description:seed.description, tags:seed.tags,
    duration:{type:'rodadas',amount:2}, stackBehavior:'renova_duracao', maxStacks:1,
    triggers:[], modifiers:seed.modifiers ?? [], periodicDamage:null, periodicHealing:null, auraConsumed:null, auraRestored:null,
    attackModifier:seed.attackModifier ?? 0, defenseModifier:seed.defenseModifier ?? 0, speedModifier:seed.speedModifier ?? 0,
    customEffect:null, classic:seed.classic, elementalAffinities:seed.elementalAffinities,
  };
}

export const PREDEFINED_ARSENAL_EFFECTS: readonly ArsenalEffect[] = Object.freeze([
  ...seeds.map(makeClassic),
  ...elementalSeeds.map(makeElemental),
]);

export function getPredefinedEffect(idOrName: string): ArsenalEffect | undefined {
  const normalized = idOrName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  const aliases: Record<string,string> = {
    queimando:'Queimadura', queimado:'Queimadura', queimada:'Queimadura',
    congelado:'Congelamento', congelada:'Congelamento', lento:'Lentidão', lenta:'Lentidão',
    encharcado:'Molhado', encharcada:'Molhado', eletrocutada:'Eletrocutado',
    sangrando:'Sangramento', fraco:'Fraqueza', fraca:'Fraqueza',
    acelerada:'Acelerado', desnorteada:'Desnorteado',
  };
  const lookup=aliases[normalized]??idOrName;
  const key=lookup.toLocaleLowerCase('pt-BR');
  const found=PREDEFINED_ARSENAL_EFFECTS.find(effect=>effect.id===idOrName||effect.name.toLocaleLowerCase('pt-BR')===key);
  return found?structuredClone(found):undefined;
}
