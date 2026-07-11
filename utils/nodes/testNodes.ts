import { registerNodeType } from '../nodeRegistry';

export type TesteComparador = 'defesa_alvo' | 'valor_fixo' | 'aura_alvo' | 'porcentagem';

export interface TesteProps {
  dice: string;
  comparador: TesteComparador;
  valorFixo?: number;
  modificador?: number;
}

const COMPARADOR_LABEL: Record<TesteComparador, string> = {
  defesa_alvo: 'defesa do alvo',
  valor_fixo: 'valor fixo',
  aura_alvo: 'aura do usuário',
  porcentagem: 'chance (%)',
};

export function registerTestNodes(): void {
  registerNodeType<TesteProps>({
    type: 'teste', family: 'ramo', label: 'Teste', category: 'Configuração',
    fields: [
      { key: 'dice', kind: 'dado', label: 'Dado' },
      { key: 'comparador', kind: 'select', label: 'Comparar contra', options: [
        { value: 'defesa_alvo', label: 'Defesa do alvo' },
        { value: 'valor_fixo', label: 'Valor fixo' },
        { value: 'aura_alvo', label: 'Aura do usuário' },
        { value: 'porcentagem', label: 'Chance (%)' },
      ] },
      { key: 'valorFixo', kind: 'numero', label: 'Valor fixo / limiar (%)' },
      { key: 'modificador', kind: 'numero', label: 'Modificador' },
    ],
    defaults: () => ({ dice: '1d20', comparador: 'defesa_alvo', valorFixo: 0, modificador: 0 }),
    summarize: p => `Teste: ${p.comparador === 'porcentagem' ? `${p.valorFixo ?? 0}%` : p.dice} vs. ${COMPARADOR_LABEL[p.comparador]}`,
    evaluate: (p, ctx) => {
      if (p.comparador === 'porcentagem') {
        const roll = ctx.roller('1d100', 'Teste: chance');
        const result = roll <= (p.valorFixo ?? 0);
        ctx.hitTest = result;
        return result;
      }
      const roll = ctx.roller(p.dice, 'Teste') + (p.modificador ?? 0);
      const threshold = p.comparador === 'defesa_alvo' ? (ctx.scope[0]?.defense ?? 0)
        : p.comparador === 'aura_alvo' ? ctx.actor.currentAura
        : (p.valorFixo ?? 0);
      const result = roll >= threshold;
      ctx.hitTest = result;
      return result;
    },
  });
}
