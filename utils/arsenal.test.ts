import { describe, expect, it } from 'vitest';
import type { Card, Item, Weapon } from '../types';
import { arsenalCardAtLevel, createArsenalCard, type ArsenalEffect } from './arsenal';
import { getPredefinedEffect, PREDEFINED_ARSENAL_EFFECTS } from './arsenalEffects';
import { cardToArsenal, migrateCharacterArsenalHoldings, migrateLegacyArsenal } from './arsenalMigration';
import { ACTION_PIPELINE_STEPS, activeOrderAdjustment, applyActiveEffect, consumePrincipalBlock, consumeTurnSkip, resolveArsenalAction, sortReactions, tickActiveEffects, type ArsenalActorState } from './arsenalPipeline';
import { activateForm, assignCardToHoldings, availableCardIds, comboStackCandidates, createHolding, equipWeapon, resolveComboCards } from './arsenalState';

const actor = (overrides: Partial<ArsenalActorState> = {}): ArsenalActorState => ({
  id: 'actor', teamId: 'a', name: 'Ator', currentHp: 20, maxHp: 20,
  currentAura: 10, maxAura: 10, defense: 10, speed: 3, tags: ['mágico'],
  equippedWeaponIds: [], activeFormIds: [], effects: [], holdings: [],
  isCurrentTurn: true, inCombat: true, ...overrides,
});

describe('modelo do arsenal', () => {
  it('cria uma carta completa com defaults seguros', () => {
    const card = createArsenalCard({ id: 'x', name: 'X', category: 'habilidade' });
    expect(card.schemaVersion).toBe(1);
    expect(card.preparation.timing.type).toBe('instantaneo');
    expect(card.cooldown.type).toBe('sem_cooldown');
    expect(card.effects).toEqual([]);
    expect(card.weaponLinks).toEqual([]);
  });

  it('oferece somente os nove efeitos clássicos configuráveis', () => {
    expect(PREDEFINED_ARSENAL_EFFECTS).toHaveLength(9);
    expect(PREDEFINED_ARSENAL_EFFECTS.map(effect => effect.name)).toEqual([
      'Queimadura','Congelamento','Lentidão','Molhado','Eletrocutado','Sangramento','Fraqueza','Acelerado','Desnorteado',
    ]);
  });
});

describe('efeitos ativos por turno', () => {
  it('reconhece nomes legados de condições periódicas', () => {
    expect(getPredefinedEffect('Queimando')?.name).toBe('Queimadura');
    expect(getPredefinedEffect('Sangrando')?.name).toBe('Sangramento');
  });
  it('aplica dano periódico, respeita stacks e expira na duração correta', () => {
    const burn = PREDEFINED_ARSENAL_EFFECTS.find(effect => effect.name === 'Queimadura')!;
    const first = tickActiveEffects([{ effect: burn, stacks: 2, remaining: 2 }], { currentHp: 10, maxHp: 20, currentAura: 5, maxAura: 10 });
    expect(first.currentHp).toBe(6);
    expect(first.hpDelta).toBe(-4);
    expect(first.effects[0].remaining).toBe(1);
    const second = tickActiveEffects(first.effects, { currentHp: first.currentHp, maxHp: 20, currentAura: 5, maxAura: 10 });
    expect(second.currentHp).toBe(2);
    expect(second.effects).toEqual([]);
    expect(second.expiredNames).toEqual(['Queimadura']);
  });

  it('aplica cura periódica sem ultrapassar o máximo', () => {
    const custom = { ...PREDEFINED_ARSENAL_EFFECTS[0], id:'custom-heal', name:'Regeneração customizada', classic:undefined, periodicHealing:{flat:5} };
    const tick = tickActiveEffects([{ effect: custom, stacks: 1, remaining: 1 }], { currentHp: 18, maxHp: 20, currentAura: 5, maxAura: 10 });
    expect(tick.currentHp).toBe(20);
    expect(tick.hpDelta).toBe(2);
    expect(tick.events[0]).toMatchObject({ kind:'heal', amount:2 });
  });

  it('calcula sangramento percentual sobre a vitalidade máxima', () => {
    const bleeding={...getPredefinedEffect('Sangramento')!,classic:{kind:'sangramento' as const,value:10,mode:'percentual_vida_maxima' as const}};
    const tick=tickActiveEffects([{effect:bleeding,stacks:1,remaining:2}],{currentHp:80,maxHp:100,currentAura:0,maxAura:0});
    expect(tick.currentHp).toBe(70);
  });

  it('Eletrocutado interage com Molhado e consome o efeito',()=>{
    const wet={...getPredefinedEffect('Molhado')!,classic:{kind:'molhado' as const,value:2}};
    const shocked={...getPredefinedEffect('Eletrocutado')!,classic:{kind:'eletrocutado' as const,value:3}};
    const tick=tickActiveEffects([{effect:wet,stacks:1,remaining:2},{effect:shocked,stacks:1,remaining:2}],{currentHp:20,maxHp:20,currentAura:0,maxAura:0});
    expect(tick.currentHp).toBe(14);
    expect(tick.effects.some(active=>active.effect.classic?.kind==='molhado')).toBe(false);
  });

  it('consome congelamento e desnorteado pelos controles correspondentes', () => {
    const frozen=applyActiveEffect([],getPredefinedEffect('Congelamento')!);
    const skip=consumeTurnSkip(frozen);expect(skip.skipped).toBe(true);expect(skip.effects[0].turnSkipsRemaining).toBe(0);
    const confused=applyActiveEffect([],getPredefinedEffect('Desnorteado')!);
    const block=consumePrincipalBlock(confused);expect(block.blocked).toBe(true);expect(block.effects[0].principalBlocksRemaining).toBe(0);
  });

  it('expõe deslocamento reversível de Lentidão e Acelerado', () => {
    const slow={...getPredefinedEffect('Lentidão')!,classic:{kind:'lentidao' as const,value:2}};
    const haste={...getPredefinedEffect('Acelerado')!,classic:{kind:'acelerado' as const,value:1}};
    expect(activeOrderAdjustment([{effect:slow,stacks:1},{effect:haste,stacks:1}]).positions).toBe(1);
  });
});

describe('migração do legado', () => {
  it('converte habilidade e preserva forma, custo, efeito e área', () => {
    const legacy: Card = {
      id: 'forma', name: 'Forma Solar', image: 'sol.png', description: 'Brilha',
      auraCost: 3, type: 'forma', damage: 4, damageType: 'fogo', diceRoll: '1d20',
      conditionEffect: 'Queimadura', conditionDuration: 2, isAreaEffect: true,
      formaCardIds: ['raio'], formaHpBonus: 5,
    };
    const card = cardToArsenal(legacy);
    expect(card.abilityType).toBe('forma');
    expect(card.form?.grantedAbilityIds).toEqual(['raio']);
    expect(card.auraConsumed?.flat).toBe(3);
    expect(card.effects[0].name).toBe('Queimadura');
    expect(card.area?.shape).toBe('circulo');
  });

  it('unifica os quatro catálogos e cria vínculo bilateral de arma', () => {
    const skill = {
      id: 'golpe', name: 'Golpe', image: '', description: '', auraCost: 0, type: 'ataque', weaponIds: ['espada'],
    } as Card & { weaponIds: string[] };
    const weapon: Weapon = { id: 'espada', name: 'Espada', image: '', description: '' };
    const item: Item = { id: 'pocao', name: 'Poção', image: '', description: '', consumeOnUse: true, quantity: 2 };
    const result = migrateLegacyArsenal({ cards: [skill], weapons: [weapon], items: [item], seals: [] });
    expect(result).toHaveLength(3);
    expect(result.find(card => card.id === 'espada')?.weapon?.grantedAbilityIds).toContain('golpe');
    expect(result.find(card => card.id === 'pocao')?.item).toMatchObject({ consumable: true, quantity: 2 });
  });

  it('adapta posses antigas sem duplicar entradas', () => {
    const holdings = migrateCharacterArsenalHoldings({
      cardIds: ['golpe'], weaponIds: ['espada'], sealIds: [],
      ownedItems: [{ itemId: 'pocao', quantity: 3 }],
      grimoire: [{ entryId: 'golpe', quantity: 1 }],
    });
    expect(holdings).toHaveLength(3);
    expect(holdings.find(holding => holding.cardId === 'pocao')?.quantity).toBe(3);
  });
});

describe('equipamento, formas e combos', () => {
  const skillA = createArsenalCard({ id: 'a', name: 'A', category: 'habilidade' });
  const skillB = createArsenalCard({ id: 'b', name: 'B', category: 'habilidade' });
  const weapon = createArsenalCard({
    id: 'w', name: 'W', category: 'arma', weapon: { freelyEquippable: true, grantedAbilityIds: ['a'] },
  });
  const form = createArsenalCard({
    id: 'f', name: 'F', category: 'habilidade', abilityType: 'forma',
    form: { grantedAbilityIds: ['b'], removedAbilityIds: ['a'], hpBonus: 0, auraBonus: 0 },
  });
  const catalog = [skillA, skillB, weapon, form];

  it('arma concede habilidade e forma pode conceder/remover', () => {
    let loadout = { holdings: [createHolding(weapon), createHolding(form)], equippedWeaponIds: [], activeFormIds: [] };
    loadout = equipWeapon(loadout, 'w');
    expect(availableCardIds(loadout, catalog)).toContain('a');
    loadout = activateForm(loadout, 'f');
    expect(availableCardIds(loadout, catalog)).toEqual(expect.arrayContaining(['w', 'f', 'b']));
    expect(availableCardIds(loadout, catalog)).not.toContain('a');
    expect(equipWeapon(loadout, null).equippedWeaponIds).toEqual([]);
  });

  it('habilidade vinculada fica indisponível sem o equipamento correspondente', () => {
    const linked={...skillA,weaponLinks:['w']};
    let loadout={holdings:[createHolding(linked),createHolding(weapon)],equippedWeaponIds:[],activeFormIds:[]};
    expect(availableCardIds(loadout,[linked,weapon])).not.toContain('a');
    loadout=equipWeapon(loadout,'w');
    expect(availableCardIds(loadout,[linked,weapon])).toContain('a');
  });

  it('combo oferece apenas o mesmo grupo e respeita o máximo de stacks', () => {
    const stackA=createArsenalCard({id:'stack-a',name:'Stack A',category:'habilidade',abilityType:'combo',combo:{stackKey:'solar',maxStacks:2,resolution:'simultanea'}});
    const stackC=createArsenalCard({id:'stack-c',name:'Stack C',category:'habilidade',abilityType:'combo',combo:{stackKey:'solar',maxStacks:2,resolution:'simultanea'}});
    const stackB=createArsenalCard({id:'stack-b',name:'Stack B',category:'habilidade',abilityType:'combo',combo:{stackKey:'lunar',maxStacks:2,resolution:'simultanea'}});
    const combo = createArsenalCard({
      id: 'c', name: 'Combo', category: 'habilidade', abilityType: 'combo',
      combo: { stackKey:'solar', maxStacks:2, resolution: 'simultanea' },
    });
    const comboCatalog=[...catalog,combo,stackA,stackC,stackB];
    expect(comboStackCandidates(combo,comboCatalog).map(card=>card.id)).toEqual(['stack-a','stack-c']);
    expect(resolveComboCards(combo,['stack-a'],comboCatalog).map(card=>card.id)).toEqual(['stack-a']);
    expect(resolveComboCards(combo,['stack-a','stack-c'],comboCatalog)).toEqual([]);
  });

  it('atribuição soma quantidades de itens sem duplicar holdings', () => {
    const item=createArsenalCard({id:'p',name:'Poção',category:'item',item:{consumable:true,quantity:1,disappearsOnUse:true}});
    const first=assignCardToHoldings([],item,3);
    const second=assignCardToHoldings(first,item,2);
    expect(second).toHaveLength(1);
    expect(second[0].quantity).toBe(5);
    expect(assignCardToHoldings([createHolding(skillA)],skillA,4)).toHaveLength(1);
  });
});

describe('pipeline de resolução', () => {
  it('acumula os valores dos níveis e limita a seleção ao maior nível', () => {
    const card=createArsenalCard({id:'level',name:'Golpe',category:'arma',damage:{flat:3},testDice:'1d20',levels:[
      {level:2,damage:{flat:5},testDice:'1d20+1'},
      {level:3,damage:{flat:8}},
    ]});
    expect(arsenalCardAtLevel(card,2)).toMatchObject({damage:{flat:5},testDice:'1d20+1'});
    expect(arsenalCardAtLevel(card,99)).toMatchObject({damage:{flat:8},testDice:'1d20+1'});
    expect(card.damage?.flat).toBe(3);
  });

  it('ordena reações por alvo, aliados, inimigos e automáticas', () => {
    expect(sortReactions([
      { id: 'auto', ownerId: 'x', ownerKind: 'automatico' },
      { id: 'enemy', ownerId: 'x', ownerKind: 'inimigo' },
      { id: 'target', ownerId: 'x', ownerKind: 'alvo' },
      { id: 'ally', ownerId: 'x', ownerKind: 'aliado_alvo' },
    ]).map(reaction => reaction.id)).toEqual(['target', 'ally', 'enemy', 'auto']);
  });

  it('executa as 16 etapas, custos, dano, efeitos, cooldown e cargas', () => {
    const burn = PREDEFINED_ARSENAL_EFFECTS.find(effect => effect.name === 'Queimadura')!;
    const card = createArsenalCard({
      id: 'fire', name: 'Fogo', category: 'habilidade', tags: ['fogo'], testDice: '1d20',
      damage: { flat: 5 }, extraDamageDice: '1d4', auraConsumed: { flat: 2 },
      effects: [burn], cooldown: { type: 'turnos', amount: 2 },
      charges: { maximum: 3, current: 3, recharge: { type: 'por_turno', amount: 1 } },
    });
    const user = actor({ holdings: [createHolding(card)] });
    const target = actor({ id: 'target', teamId: 'b', currentHp: 20, defense: 10, isCurrentTurn: false });
    const rolls: Record<string, number> = { '1d20': 15, '1d4': 3 };
    const result = resolveArsenalAction({ card, actor: user, targets: [target], roller: dice => rolls[dice] });
    expect(result.status).toBe('concluida');
    expect(result.trace.map(entry => entry.step)).toEqual(ACTION_PIPELINE_STEPS);
    expect(result.actor.currentAura).toBe(8);
    expect(result.targets[0].currentHp).toBe(12);
    expect(result.targets[0].effects[0].effect.name).toBe('Queimadura');
    expect(result.actor.holdings[0]).toMatchObject({ cooldownRemaining: 2, currentCharges: 2 });
  });

  it('pausa em preparação e não abre janela de reação antes da retomada', () => {
    const card = createArsenalCard({
      id: 'ritual', name: 'Ritual', category: 'selo', auraConsumed: { flat: 1 },
      preparation: { timing: { type: 'rodadas', amount: 2 }, cancellable: true, interruptedByDamage: true, persistsAfterDamage: false, visibility: 'oculta' },
    });
    const result = resolveArsenalAction({ card, actor: actor(), targets: [actor({ id: 't', teamId: 'b' })] });
    expect(result.status).toBe('preparando');
    expect(result.preparation).toMatchObject({ visibility: 'oculta', targetIds: ['t'] });
    expect(result.trace.at(-1)?.step).toBe('iniciar_preparacao');
    const resumed = resolveArsenalAction({ card, actor: result.actor, targets: result.targets, resumePreparation: true });
    expect(resumed.status).toBe('concluida');
    expect(resumed.actor.currentAura).toBe(9);
  });

  it('bloqueia condição antes de consumir recursos', () => {
    const card = createArsenalCard({
      id: 'armed', name: 'Armada', category: 'habilidade', auraConsumed: { flat: 3 }, conditions: [{ type: 'arma_equipada' }],
    });
    const result = resolveArsenalAction({ card, actor: actor(), targets: [actor({ id: 't', teamId: 'b' })] });
    expect(result.status).toBe('bloqueada');
    expect(result.actor.currentAura).toBe(10);
  });

  it('ritual exige e consome os itens ao iniciar a preparação', () => {
    const card=createArsenalCard({
      id:'ritual',name:'Ritual',category:'selo',
      seal:{kind:'ritual',type:'buff',persistent:true,consumable:false,requiredItems:[{itemId:'cristal',quantity:2}],durationRounds:3},
      preparation:{timing:{type:'rodadas',amount:2},cancellable:true,interruptedByDamage:true,persistsAfterDamage:false,visibility:'visivel'},
    });
    const prepared=resolveArsenalAction({card,actor:actor({holdings:[{cardId:'cristal',quantity:3,equipped:false,active:false}]}),targets:[actor()]});
    expect(prepared.status).toBe('preparando');
    expect(prepared.actor.holdings[0].quantity).toBe(1);
    const blocked=resolveArsenalAction({card,actor:actor({holdings:[{cardId:'cristal',quantity:1,equipped:false,active:false}]}),targets:[actor()]});
    expect(blocked).toMatchObject({status:'bloqueada',reason:'Itens insuficientes para o ritual'});
  });

  it('soma a rolagem de proteção à defesa contra a carta lançada', () => {
    const burn = PREDEFINED_ARSENAL_EFFECTS.find(effect => effect.name === 'Queimadura')!;
    const attack=createArsenalCard({id:'atk',name:'Ataque',category:'habilidade',testDice:'1d20',damage:{flat:4},effects:[burn]});
    const target=actor({id:'target',teamId:'b',defense:10,currentHp:20});
    const result=resolveArsenalAction({card:attack,actor:actor(),targets:[target],reactions:[{id:'escudo',ownerId:'target',ownerKind:'alvo',defenseModifier:3}],roller:()=>12});
    expect(result.hitTargetIds).toEqual([]);
    expect(result.targets[0].currentHp).toBe(20);
    expect(result.targets[0].effects).toEqual([]);
  });

  it('Molhado multiplica dano elétrico e é consumido', () => {
    const wet={...getPredefinedEffect('Molhado')!,classic:{kind:'molhado' as const,value:2}};
    const lightning=createArsenalCard({id:'zap',name:'Raio',category:'habilidade',element:'raio',damage:{flat:5}});
    const target=actor({id:'target',teamId:'b',currentHp:20,effects:applyActiveEffect([],wet)});
    const result=resolveArsenalAction({card:lightning,actor:actor(),targets:[target]});
    expect(result.targets[0].currentHp).toBe(10);
    expect(result.targets[0].effects.some(active=>active.effect.classic?.kind==='molhado')).toBe(false);
  });

  it('Fraqueza reduz somente o teste de ataque e arredonda divisão para baixo', () => {
    const weak={...getPredefinedEffect('Fraqueza')!,classic:{kind:'fraqueza' as const,value:2,mode:'dividir' as const}};
    const attack=createArsenalCard({id:'weak-hit',name:'Golpe',category:'habilidade',testDice:'1d20',damage:{flat:4}});
    const result=resolveArsenalAction({card:attack,actor:actor({effects:applyActiveEffect([],weak)}),targets:[actor({id:'t',teamId:'b',defense:10})],roller:()=>19});
    expect(result.hitTargetIds).toEqual([]);
  });
});

describe('capacidades expandidas de efeitos', () => {
  const template = getPredefinedEffect('Queimadura')!;
  const effect = (overrides: Partial<ArsenalEffect> = {}): ArsenalEffect => ({
    ...template, classic: undefined, periodicDamage: null, ...overrides,
  });

  it('modificador de dano só se aplica quando o elemento da carta bate', () => {
    const buff = effect({ modifiers: [{ stat: 'dano', operation: 'somar', value: 5, filter: { damageType: ['fogo'] } }] });
    const fireCard = createArsenalCard({ id: 'fire', name: 'Fogo', category: 'habilidade', element: 'fogo', damage: { flat: 4 } });
    const waterCard = createArsenalCard({ id: 'water', name: 'Água', category: 'habilidade', element: 'água', damage: { flat: 4 } });
    const user = actor({ effects: applyActiveEffect([], buff) });
    const withFire = resolveArsenalAction({ card: fireCard, actor: user, targets: [actor({ id: 't', teamId: 'b', currentHp: 20 })] });
    const withWater = resolveArsenalAction({ card: waterCard, actor: user, targets: [actor({ id: 't', teamId: 'b', currentHp: 20 })] });
    expect(withFire.targets[0].currentHp).toBe(11);
    expect(withWater.targets[0].currentHp).toBe(16);
  });

  it('modificador multiplicativo dobra o dano', () => {
    const buff = effect({ modifiers: [{ stat: 'dano', operation: 'multiplicar', value: 100 }] });
    const card = createArsenalCard({ id: 'hit', name: 'Golpe', category: 'habilidade', damage: { flat: 6 } });
    const result = resolveArsenalAction({ card, actor: actor({ effects: applyActiveEffect([], buff) }), targets: [actor({ id: 't', teamId: 'b', currentHp: 30 })] });
    expect(result.targets[0].currentHp).toBe(18);
  });

  it('modificador de definir sobrepõe a defesa calculada do alvo', () => {
    const debuff = effect({ modifiers: [{ stat: 'defesa', operation: 'definir', value: 1 }] });
    const card = createArsenalCard({ id: 'hit', name: 'Golpe', category: 'habilidade', testDice: '1d20', damage: { flat: 3 } });
    const target = actor({ id: 't', teamId: 'b', defense: 99, currentHp: 20, effects: applyActiveEffect([], debuff) });
    const result = resolveArsenalAction({ card, actor: actor(), targets: [target], roller: () => 2 });
    expect(result.hitTargetIds).toEqual(['t']);
  });

  it('bônus de dado flat e vantagem se somam à rolagem de dano', () => {
    const buff = effect({ diceBonuses: [{ target: 'dano', bonusFlat: 3, bonusDice: '1d4' }] });
    const card = createArsenalCard({ id: 'hit', name: 'Golpe', category: 'habilidade', damage: { flat: 5 } });
    const rolls: Record<string, number> = { '1d4': 2 };
    const result = resolveArsenalAction({ card, actor: actor({ effects: applyActiveEffect([], buff) }), targets: [actor({ id: 't', teamId: 'b', currentHp: 30 })], roller: dice => rolls[dice] });
    expect(result.targets[0].currentHp).toBe(20);
  });

  it('vantagem no teste rola duas vezes e fica com o maior resultado', () => {
    const buff = effect({ diceBonuses: [{ target: 'teste', advantage: true }] });
    const card = createArsenalCard({ id: 'hit', name: 'Golpe', category: 'habilidade', testDice: '1d20', damage: { flat: 1 } });
    const rolls = [8, 17];
    const result = resolveArsenalAction({ card, actor: actor({ effects: applyActiveEffect([], buff) }), targets: [actor({ id: 't', teamId: 'b', defense: 15, currentHp: 20 })], roller: () => rolls.shift()! });
    expect(result.rolls.test).toBe(17);
    expect(result.hitTargetIds).toEqual(['t']);
  });

  it('resistência elemental reduz o dano e vulnerabilidade aumenta', () => {
    const resist = effect({ elementalAffinities: [{ element: 'fogo', kind: 'resistencia', percent: 50 }] });
    const vulnerable = effect({ elementalAffinities: [{ element: 'fogo', kind: 'vulnerabilidade', percent: 50 }] });
    const card = createArsenalCard({ id: 'fire', name: 'Fogo', category: 'habilidade', element: 'fogo', damage: { flat: 10 } });
    const resistant = resolveArsenalAction({ card, actor: actor(), targets: [actor({ id: 't', teamId: 'b', currentHp: 30, maxHp: 40, effects: applyActiveEffect([], resist) })] });
    const vulnerableResult = resolveArsenalAction({ card, actor: actor(), targets: [actor({ id: 't', teamId: 'b', currentHp: 30, maxHp: 40, effects: applyActiveEffect([], vulnerable) })] });
    expect(resistant.targets[0].currentHp).toBe(25);
    expect(vulnerableResult.targets[0].currentHp).toBe(15);
  });

  it('imunidade elemental zera o dano e absorção converte em cura', () => {
    const immune = effect({ elementalAffinities: [{ element: 'fogo', kind: 'imunidade', percent: 0 }] });
    const absorb = effect({ elementalAffinities: [{ element: 'fogo', kind: 'absorcao', percent: 100 }] });
    const card = createArsenalCard({ id: 'fire', name: 'Fogo', category: 'habilidade', element: 'fogo', damage: { flat: 10 } });
    const immuneResult = resolveArsenalAction({ card, actor: actor(), targets: [actor({ id: 't', teamId: 'b', currentHp: 30, maxHp: 30, effects: applyActiveEffect([], immune) })] });
    const absorbResult = resolveArsenalAction({ card, actor: actor(), targets: [actor({ id: 't', teamId: 'b', currentHp: 20, maxHp: 30, effects: applyActiveEffect([], absorb) })] });
    expect(immuneResult.targets[0].currentHp).toBe(30);
    expect(absorbResult.targets[0].currentHp).toBe(30);
  });

  it('roubo de vida cura o atacante com base no dano causado', () => {
    const drain = effect({ lifeSteal: 50 });
    const card = createArsenalCard({ id: 'hit', name: 'Golpe', category: 'habilidade', damage: { flat: 10 } });
    const result = resolveArsenalAction({ card, actor: actor({ currentHp: 10, maxHp: 20, effects: applyActiveEffect([], drain) }), targets: [actor({ id: 't', teamId: 'b', currentHp: 30 })] });
    expect(result.actor.currentHp).toBe(15);
    expect(result.targets[0].currentHp).toBe(20);
  });

  it('espinhos refletem dano ao atacante quando o alvo é atingido', () => {
    const thorny = effect({ thorns: { flat: 4 } });
    const card = createArsenalCard({ id: 'hit', name: 'Golpe', category: 'habilidade', damage: { flat: 6 } });
    const result = resolveArsenalAction({ card, actor: actor({ currentHp: 20 }), targets: [actor({ id: 't', teamId: 'b', currentHp: 30, maxHp: 40, effects: applyActiveEffect([], thorny) })] });
    expect(result.actor.currentHp).toBe(16);
    expect(result.targets[0].currentHp).toBe(24);
  });

  it('Amaldiçoado reduz cura e recuperação de aura recebidas', () => {
    const cursed = effect({
      modifiers: [
        { stat: 'cura_recebida', operation: 'multiplicar', value: -50 },
        { stat: 'aura_recebida', operation: 'multiplicar', value: -50 },
      ],
    });
    const card = createArsenalCard({ id: 'heal', name: 'Cura', category: 'habilidade', healing: { flat: 10 }, auraRestored: { flat: 4 } });
    const target = actor({ id: 't', teamId: 'b', currentHp: 10, maxHp: 30, currentAura: 0, maxAura: 10, effects: applyActiveEffect([], cursed) });
    const result = resolveArsenalAction({ card, actor: actor(), targets: [target] });
    expect(result.targets[0].currentHp).toBe(15);
    expect(result.targets[0].currentAura).toBe(2);
  });

  it('imunidade a um efeito clássico impede sua aplicação no alvo', () => {
    const burn = PREDEFINED_ARSENAL_EFFECTS.find(entry => entry.name === 'Queimadura')!;
    const fireproof = effect({ id: 'fireproof', name: 'À Prova de Fogo', immunities: ['queimadura'] });
    const card = createArsenalCard({ id: 'hit', name: 'Golpe', category: 'habilidade', damage: { flat: 2 }, effects: [burn] });
    const result = resolveArsenalAction({ card, actor: actor(), targets: [actor({ id: 't', teamId: 'b', currentHp: 30, effects: applyActiveEffect([], fireproof) })] });
    expect(result.targets[0].effects.some(active => active.effect.name === 'Queimadura')).toBe(false);
  });

  it('usesPerActivation consome múltiplas unidades por uso e bloqueia sem estoque suficiente', () => {
    const potion = createArsenalCard({ id: 'potion', name: 'Poção Tripla', category: 'item', item: { consumable: true, quantity: 5, disappearsOnUse: false, usesPerActivation: 3 } });
    const holding = createHolding(potion, 5);
    const enough = resolveArsenalAction({ card: potion, actor: actor({ holdings: [holding] }), targets: [actor()] });
    expect(enough.status).toBe('concluida');
    expect(enough.actor.holdings[0].quantity).toBe(2);
    const short = resolveArsenalAction({ card: potion, actor: actor({ holdings: [{ ...holding, quantity: 2 }] }), targets: [actor()] });
    expect(short).toMatchObject({ status: 'bloqueada', reason: 'Item indisponível' });
  });

  it('aplica bônus somente à carta, categoria e tipo de habilidade selecionados', () => {
    const scoped = effect({ diceBonuses: [{
      target: 'teste', bonusFlat: 5, filter: { cardIds: ['guard'], categories: ['habilidade'], abilityTypes: ['protecao'] },
    }] });
    const guard = createArsenalCard({ id:'guard', name:'Guarda Arcana', category:'habilidade', abilityType:'protecao', testDice:'1d20' });
    const other = createArsenalCard({ id:'other', name:'Golpe', category:'habilidade', abilityType:'comum', testDice:'1d20' });
    const user = actor({ effects:applyActiveEffect([],scoped) });
    expect(resolveArsenalAction({card:guard,actor:user,targets:[actor({id:'t',teamId:'b'})],roller:()=>10}).rolls.test).toBe(15);
    expect(resolveArsenalAction({card:other,actor:user,targets:[actor({id:'t',teamId:'b'})],roller:()=>10}).rolls.test).toBe(10);
  });

  it('combina rerrolagem, resultado mínimo e desvantagem; vantagem anula desvantagem', () => {
    const control = effect({ diceBonuses:[{ target:'teste', rerollBelow:5, minimumResult:8, disadvantage:true }] });
    const card = createArsenalCard({id:'test',name:'Teste',category:'habilidade',testDice:'1d20'});
    const rolls=[3,12,9];
    const result=resolveArsenalAction({card,actor:actor({effects:applyActiveEffect([],control)}),targets:[actor({id:'t',teamId:'b'})],roller:()=>rolls.shift()!});
    expect(result.rolls.test).toBe(9);
    const neutral=effect({diceBonuses:[{target:'teste',advantage:true,disadvantage:true}]});
    let calls=0;
    resolveArsenalAction({card,actor:actor({effects:applyActiveEffect([],neutral)}),targets:[actor({id:'t',teamId:'b'})],roller:()=>{calls+=1;return 10;}});
    expect(calls).toBe(1);
  });

  it('multiplica bônus flat pela quantidade de stacks ativos', () => {
    const stacking=effect({id:'stacking',stackBehavior:'acumula_intensidade',maxStacks:3,diceBonuses:[{target:'dano',bonusFlat:2}]});
    const effects=applyActiveEffect(applyActiveEffect([],stacking),stacking);
    const card=createArsenalCard({id:'hit',name:'Golpe',category:'arma',damage:{flat:1}});
    const result=resolveArsenalAction({card,actor:actor({effects}),targets:[actor({id:'t',teamId:'b',currentHp:20})]});
    expect(result.targets[0].currentHp).toBe(15);
  });
});
