import { registerNodeType } from '../nodeRegistry';
import { applyDamage, applyHeal, applyCondition } from '../abilityPrimitives';
import { getPredefinedEffect } from '../arsenalEffects';
import type { InterpretCtx } from '../abilityInterpreter';
import type { Element } from '../../types';

type ScopeKind = 'proprio' | 'alvo_da_habilidade' | 'atacante_original' | 'todos_inimigos' | 'todos_aliados';

function roll(ctx: InterpretCtx, dice: string | undefined, flat: number, label?: string): number {
  return (dice ? ctx.roller(dice, label) : 0) + flat;
}

type BuffStat = 'ataque' | 'defesa' | 'velocidade' | 'vida_maxima' | 'aura_maxima';
type BuffOperation = 'somar' | 'multiplicar' | 'definir';

export function registerCoreNodes(): void {
  registerNodeType({
    type: 'ao_ativar', family: 'gatilho', label: 'Quando usada', fields: [],
    defaults: () => ({}), summarize: () => 'Quando a habilidade é usada',
  });

  registerNodeType({
    type: 'ao_ser_alvejado', family: 'gatilho', label: 'Quando alvejado', fields: [],
    defaults: () => ({}), summarize: () => 'Quando o personagem é alvejado por uma carta',
  });

  registerNodeType({
    type: 'enquanto_ativa', family: 'gatilho', label: 'Enquanto ativa', fields: [],
    defaults: () => ({}), summarize: () => 'A cada início de turno, enquanto o efeito durar',
  });

  registerNodeType<{ stackKey: string; maxStacks: number }>({
    type: 'em_combo', family: 'gatilho', label: 'Em combo',
    fields: [
      { key: 'stackKey', kind: 'texto', label: 'Grupo do combo' },
      { key: 'maxStacks', kind: 'numero', label: 'Máximo de stacks' },
    ],
    defaults: () => ({ stackKey: '', maxStacks: 2 }),
    summarize: p => `Efeito extra em combo (${p.stackKey || 'sem grupo'}, até ${p.maxStacks})`,
  });

  registerNodeType<{ recurso: 'aura' | 'municao' | 'vida'; amount: number }>({
    type: 'custo', family: 'efeito', label: 'Custo de recurso', category: 'Configuração',
    fields: [
      { key: 'recurso', kind: 'select', label: 'Recurso', options: [
        { value: 'aura', label: 'Aura' }, { value: 'municao', label: 'Munição' }, { value: 'vida', label: 'Vida' } ] },
      { key: 'amount', kind: 'numero', label: 'Quantidade' },
    ],
    defaults: () => ({ recurso: 'aura', amount: 1 }),
    summarize: p => `Custo: ${p.amount} de ${p.recurso}`,
    interpret: (p, ctx) => { ctx.trace.push({ node: 'custo', detail: `Custo de ${p.amount} de ${p.recurso}` }); },
  });

  registerNodeType<{ alvo: 'proprio' | 'alvo_atual'; rounds: number }>({
    type: 'aplicar_como_efeito', family: 'efeito', label: 'Aplicar como efeito', category: 'Configuração',
    fields: [
      { key: 'alvo', kind: 'select', label: 'Alvo', options: [
        { value: 'proprio', label: 'Próprio usuário' }, { value: 'alvo_atual', label: 'Alvo atual' } ] },
      { key: 'rounds', kind: 'numero', label: 'Duração (rodadas)' },
    ],
    defaults: () => ({ alvo: 'proprio', rounds: 3 }),
    summarize: p => `Aplica como efeito em ${p.alvo === 'proprio' ? 'si mesmo' : 'alvo atual'} por ${p.rounds} rod.`,
    interpret: (p, ctx) => {
      const target = p.alvo === 'proprio' ? ctx.actor : (ctx.scope[0] ?? ctx.actor);
      ctx.ongoingEffectIntents = [...(ctx.ongoingEffectIntents ?? []), { targetId: target.id, casterId: ctx.actor.id, rounds: p.rounds }];
      ctx.trace.push({ node: 'aplicar_como_efeito', detail: `Aplicado como efeito contínuo em ${target.name} por ${p.rounds} rodadas` });
    },
  });

  registerNodeType<{ scope: ScopeKind }>({
    type: 'alvo', family: 'alvo', label: 'Mudar alvo',
    fields: [{ key: 'scope', kind: 'select', label: 'Escopo', options: [
      { value: 'proprio', label: 'Próprio usuário' },
      { value: 'alvo_da_habilidade', label: 'Alvo da habilidade' },
      { value: 'atacante_original', label: 'Atacante original' },
      { value: 'todos_inimigos', label: 'Todos os inimigos' },
      { value: 'todos_aliados', label: 'Todos os aliados' },
    ] }],
    defaults: () => ({ scope: 'alvo_da_habilidade' }),
    summarize: p => `Alvo → ${p.scope}`,
    interpret: (p, ctx) => {
      if (p.scope === 'proprio') ctx.scope = [ctx.actor];
      else if (p.scope === 'atacante_original') ctx.scope = ctx.additionalTargets?.slice(0, 1) ?? [];
      else if (p.scope === 'todos_inimigos') ctx.scope = ctx.allTargets?.filter(t => t.teamId !== ctx.actor.teamId) ?? ctx.scope;
      else if (p.scope === 'todos_aliados') ctx.scope = ctx.allTargets?.filter(t => t.teamId === ctx.actor.teamId) ?? ctx.scope;
      else ctx.scope = ctx.primaryTargets ?? ctx.scope;
    },
  });

  registerNodeType<{ dice?: string; flat: number; element: Element | null; perfurante: boolean }>({
    type: 'dano', family: 'efeito', label: 'Dano', category: 'Combate',
    fields: [
      { key: 'dice', kind: 'dado', label: 'Dado' },
      { key: 'flat', kind: 'numero', label: 'Fixo' },
      { key: 'element', kind: 'elemento', label: 'Elemento' },
      { key: 'perfurante', kind: 'toggle', label: 'Perfurante (ignora a Defesa, dano direto ao HP)' },
    ],
    defaults: () => ({ dice: '1d6', flat: 0, element: null, perfurante: false }),
    summarize: p => `Dano ${p.dice ?? ''}+${p.flat} ${p.element ?? ''}${p.perfurante ? ' · Perfurante' : ''}`.trim(),
    interpret: (p, ctx) => {
      const base = roll(ctx, p.dice, p.flat, 'Dano');
      ctx.scope = ctx.scope.map(target => {
        const multiplier = ctx.scopeMultiplier?.get(target.id) ?? 1;
        const amount = Math.round(base * multiplier);
        const r = applyDamage(target, amount, p.element ?? ctx.element, ctx.roller, p.perfurante);
        ctx.trace.push({ node: 'dano', detail: `${r.appliedDamage} de dano${p.perfurante ? ' perfurante' : ''} em ${target.name}` });
        return r.target;
      });
      ctx.commit?.();
    },
  });

  registerNodeType<{ dice?: string; flat: number }>({
    type: 'cura', family: 'efeito', label: 'Cura', category: 'Combate',
    fields: [{ key: 'dice', kind: 'dado', label: 'Dado' }, { key: 'flat', kind: 'numero', label: 'Fixo' }],
    defaults: () => ({ dice: '1d4', flat: 0 }),
    summarize: p => `Cura ${p.dice ?? ''}+${p.flat}`.trim(),
    interpret: (p, ctx) => {
      const base = roll(ctx, p.dice, p.flat, 'Cura');
      ctx.scope = ctx.scope.map(target => {
        const multiplier = ctx.scopeMultiplier?.get(target.id) ?? 1;
        const r = applyHeal(target, Math.round(base * multiplier));
        ctx.trace.push({ node: 'cura', detail: `${-r.appliedDamage} de cura em ${target.name}` });
        return r.target;
      });
      ctx.commit?.();
    },
  });

  registerNodeType<{ classicKind: string; rounds: number; value: number; chance: number }>({
    type: 'aplicar_condicao', family: 'efeito', label: 'Aplicar condição', category: 'Combate',
    fields: [
      { key: 'classicKind', kind: 'select', label: 'Condição', options: [
        'queimadura','congelamento','lentidao','molhado','eletrocutado','sangramento','fraqueza',
        'acelerado','desnorteado','enraizado','desequilibrado','fraturado','iluminado','amaldicoado',
        'paralisado','confuso',
      ].map(k => ({ value: k, label: k })) },
      { key: 'rounds', kind: 'numero', label: 'Duração (rodadas)' },
      { key: 'value', kind: 'numero', label: 'Valor do efeito' },
      { key: 'chance', kind: 'numero', label: 'Chance de aplicar (%)' },
    ],
    defaults: () => ({ classicKind: 'queimadura', rounds: 2, value: 2, chance: 100 }),
    summarize: p => `Aplica ${p.classicKind} (${p.chance}% chance)`,
    interpret: (p, ctx) => {
      const preset = getPredefinedEffect(p.classicKind);
      if (!preset) { ctx.trace.push({ node: 'aplicar_condicao', detail: `condição desconhecida: ${p.classicKind}` }); return; }
      const effect = {
        ...preset, duration: { type: 'rodadas' as const, amount: p.rounds },
        classic: preset.classic ? { ...preset.classic, value: p.value } : preset.classic,
      };
      ctx.scope = ctx.scope.map(target => {
        if (ctx.roller('1d100', `Chance: ${p.classicKind}`) > p.chance) {
          ctx.trace.push({ node: 'aplicar_condicao', detail: `falhou na chance de aplicar ${p.classicKind} em ${target.name}` });
          return target;
        }
        const next = applyCondition(target, effect, ctx.roller);
        const applied = next !== target;
        if (applied) ctx.lastEffectKind?.set(target.id, p.classicKind);
        ctx.trace.push({ node: 'aplicar_condicao', detail: `${applied ? 'aplicou' : 'imune a'} ${p.classicKind} em ${target.name}` });
        return next;
      });
      ctx.commit?.();
    },
  });

  registerNodeType<{ tipo: 'sem_cooldown' | 'turnos' | 'rodadas' | 'usos'; amount: number }>({
    type: 'cooldown', family: 'efeito', label: 'Cooldown', category: 'Configuração',
    fields: [
      { key: 'tipo', kind: 'select', label: 'Tipo', options: [
        { value: 'sem_cooldown', label: 'Sem cooldown' }, { value: 'turnos', label: 'Turnos' },
        { value: 'rodadas', label: 'Rodadas' }, { value: 'usos', label: 'Usos' } ] },
      { key: 'amount', kind: 'numero', label: 'Quantidade' },
    ],
    defaults: () => ({ tipo: 'sem_cooldown', amount: 1 }),
    summarize: p => p.tipo === 'sem_cooldown' ? 'Sem cooldown' : `Cooldown: ${p.amount} ${p.tipo}`,
    interpret: (p, ctx) => { ctx.trace.push({ node: 'cooldown', detail: `Cooldown: ${p.tipo === 'sem_cooldown' ? 'nenhum' : `${p.amount} ${p.tipo}`}` }); },
  });

  registerNodeType<{ tipo: 'instantaneo' | 'turnos' | 'rodadas'; amount: number }>({
    type: 'preparacao', family: 'efeito', label: 'Preparação', category: 'Configuração',
    fields: [
      { key: 'tipo', kind: 'select', label: 'Tipo', options: [
        { value: 'instantaneo', label: 'Instantânea' }, { value: 'turnos', label: 'Turnos' }, { value: 'rodadas', label: 'Rodadas' } ] },
      { key: 'amount', kind: 'numero', label: 'Duração' },
    ],
    defaults: () => ({ tipo: 'instantaneo', amount: 1 }),
    summarize: p => p.tipo === 'instantaneo' ? 'Instantânea' : `Preparação: ${p.amount} ${p.tipo}`,
    interpret: (p, ctx) => { ctx.trace.push({ node: 'preparacao', detail: `Preparação: ${p.tipo === 'instantaneo' ? 'instantânea' : `${p.amount} ${p.tipo}`}` }); },
  });

  /** vida_maxima/aura_maxima só têm efeito quando lidos estruturalmente por graphFormaVisual (composição de Forma);
   * fora desse contexto o modificador fica registrado no efeito mas nenhum código de combate o aplica. */
  registerNodeType<{ stat: BuffStat; operation: BuffOperation; value: number; rounds: number }>({
    type: 'buff', family: 'efeito', label: 'Buff/Debuff', category: 'Combate',
    fields: [
      { key: 'stat', kind: 'select', label: 'Atributo', options: [
        { value: 'ataque', label: 'Ataque' }, { value: 'defesa', label: 'Defesa' }, { value: 'velocidade', label: 'Velocidade' },
        { value: 'vida_maxima', label: 'Vida máxima' }, { value: 'aura_maxima', label: 'Aura máxima' } ] },
      { key: 'operation', kind: 'select', label: 'Operação', options: [
        { value: 'somar', label: 'Somar' }, { value: 'multiplicar', label: 'Multiplicar (%)' }, { value: 'definir', label: 'Definir' } ] },
      { key: 'value', kind: 'numero', label: 'Valor (±)' },
      { key: 'rounds', kind: 'numero', label: 'Rodadas' },
    ],
    defaults: () => ({ stat: 'ataque', operation: 'somar', value: 2, rounds: 3 }),
    summarize: p => `${p.stat} ${p.operation} ${p.value >= 0 ? '+' : ''}${p.value} por ${p.rounds} rod.`,
    interpret: (p, ctx) => {
      const effect = {
        id: `buff-${p.stat}-${crypto.randomUUID()}`, name: `${p.stat} ${p.operation} ${p.value}`,
        description: '', tags: [], duration: { type: 'rodadas' as const, amount: p.rounds },
        stackBehavior: 'renova_duracao' as const, maxStacks: 1, triggers: [],
        modifiers: [{ stat: p.stat, operation: p.operation, value: p.value }],
        periodicDamage: null, periodicHealing: null, auraConsumed: null, auraRestored: null,
        attackModifier: 0, defenseModifier: 0, speedModifier: 0, customEffect: null,
      };
      ctx.scope = ctx.scope.map(target => applyCondition(target, effect, ctx.roller));
      ctx.trace.push({ node: 'buff', detail: `${effect.name} por ${p.rounds} rodadas` });
      ctx.commit?.();
    },
  });
}
