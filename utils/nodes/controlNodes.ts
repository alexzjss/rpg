import { registerNodeType } from '../nodeRegistry';

type MoveKind = 'empurrar' | 'puxar' | 'teleportar' | 'trocar_lugar';

/** 'Silenciar' e 'Incapacitar' foram removidos: eram wrappers finos e redundantes com as condições
 *  'Silenciado'/'Atordoado' do nó 'aplicar_condicao', que já cobrem o mesmo efeito com chance de aplicar,
 *  teste de resistência, stacks e sub-campos específicos (blocksAuraCards/blocksForms/allowsReactions,
 *  losesAction/losesReaction/endsAfterTakingDamage). Use 'aplicar_condicao' para esses efeitos. */
export function registerControlNodes(): void {
  registerNodeType<{ kind: MoveKind; distance: number }>({
    type: 'mover', family: 'efeito', label: 'Mover', category: 'Controle',
    fields: [
      { key: 'kind', kind: 'select', label: 'Tipo', options: [
        { value: 'empurrar', label: 'Empurrar' }, { value: 'puxar', label: 'Puxar' },
        { value: 'teleportar', label: 'Teleportar' }, { value: 'trocar_lugar', label: 'Trocar de lugar' } ] },
      { key: 'distance', kind: 'numero', label: 'Distância' },
    ],
    defaults: () => ({ kind: 'empurrar', distance: 1 }),
    summarize: p => `${p.kind} ${p.distance}`,
    interpret: (p, ctx) => {
      for (const target of ctx.scope) {
        ctx.movementIntents = [...(ctx.movementIntents ?? []), { targetId: target.id, kind: p.kind, distance: p.distance }];
        ctx.trace.push({ node: 'mover', detail: `${p.kind} ${target.name} em ${p.distance}` });
      }
    },
  });
}
