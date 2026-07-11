import { registerNodeType } from '../nodeRegistry';

export function registerConditionNodes(): void {
  registerNodeType<{ comparacao: 'abaixo' | 'acima'; percent: number }>({
    type: 'se_vida_alvo', family: 'ramo', label: 'SE vida do alvo',
    fields: [
      { key: 'comparacao', kind: 'select', label: 'Comparação', options: [{ value: 'abaixo', label: 'Abaixo de' }, { value: 'acima', label: 'Acima de' }] },
      { key: 'percent', kind: 'numero', label: 'Percentual' },
    ],
    defaults: () => ({ comparacao: 'abaixo', percent: 30 }),
    summarize: p => `Se vida ${p.comparacao === 'abaixo' ? '<' : '>'} ${p.percent}%`,
    evaluate: (p, ctx) => {
      const t = ctx.scope[0];
      if (!t || t.maxHp <= 0) return false;
      const pct = (t.currentHp / t.maxHp) * 100;
      return p.comparacao === 'abaixo' ? pct < p.percent : pct > p.percent;
    },
  });

  registerNodeType<{ classicKind: string }>({
    type: 'se_condicao_ativa', family: 'ramo', label: 'SE condição ativa no alvo',
    fields: [{ key: 'classicKind', kind: 'select', label: 'Condição', options: [
      'queimadura','congelamento','lentidao','molhado','eletrocutado','sangramento','fraqueza',
      'acelerado','desnorteado','enraizado','desequilibrado','fraturado','iluminado','amaldicoado',
      'paralisado','confuso',
    ].map(k => ({ value: k, label: k })) }],
    defaults: () => ({ classicKind: 'molhado' }),
    summarize: p => `Se alvo tem ${p.classicKind}`,
    evaluate: (p, ctx) => {
      const t = ctx.scope[0];
      return t ? t.effects.some(e => e.effect.classic?.kind === p.classicKind) : false;
    },
  });

  registerNodeType<{ amount: number }>({
    type: 'se_aura_minima', family: 'ramo', label: 'SE aura mínima do usuário',
    fields: [{ key: 'amount', kind: 'numero', label: 'Aura mínima' }],
    defaults: () => ({ amount: 3 }),
    summarize: p => `Se aura ≥ ${p.amount}`,
    evaluate: (p, ctx) => ctx.actor.currentAura >= p.amount,
  });
}
