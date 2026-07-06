import type { Element } from '../types';

export type ArsenalCategory = 'habilidade' | 'selo' | 'item' | 'arma';
export type ArsenalVisibility = 'publica' | 'privada' | 'mestre' | 'oculta';
export type AbilityType = 'comum' | 'protecao' | 'combo' | 'forma';
export type SealType = 'ataque' | 'buff' | 'armadilha';
export type SealKind = 'explosao' | 'ritual';
export type ArsenalTag = string;

export interface AmountFormula {
  flat: number;
  dice?: string;
}

export type TargetConfig =
  | { type: 'proprio_usuario' }
  | { type: 'um_alvo' }
  | { type: 'multiplos_alvos'; maxTargets: number }
  | { type: 'todos_aliados' }
  | { type: 'todos_inimigos' }
  | { type: 'todos_em_area' }
  | { type: 'circulo_grid'; radius: number }
  | { type: 'celula_grid' }
  | { type: 'objeto_mapa' }
  /** Mapa inteiro: não mira ninguém específico — afeta todos os presentes no combate,
   *  sem distinção de time, como um efeito de campo de batalha (ver EncounterState.fieldEffects). */
  | { type: 'campo_de_batalha' };

export interface AreaConfig {
  shape: 'circulo' | 'cone' | 'linha' | 'quadrado' | 'customizada';
  size: number;
  unit: 'celulas' | 'metros' | 'unidades';
}

export type PreparationTiming =
  | { type: 'instantaneo' }
  | { type: 'turnos'; amount: number }
  | { type: 'rodadas'; amount: number }
  | { type: 'inicio_proximo_turno' }
  | { type: 'fim_turno_atual' }
  | { type: 'gatilho'; trigger: TriggerEvent };

export interface PreparationConfig {
  timing: PreparationTiming;
  cancellable: boolean;
  interruptedByDamage: boolean;
  persistsAfterDamage: boolean;
  visibility: 'visivel' | 'oculta';
}

export type CooldownConfig =
  | { type: 'sem_cooldown' }
  | { type: 'turnos'; amount: number }
  | { type: 'rodadas'; amount: number }
  | { type: 'usos'; amount: number }
  | { type: 'fim_combate' }
  | { type: 'descanso' }
  | { type: 'gatilho'; trigger: TriggerEvent };

export type ChargeRecharge =
  | { type: 'automatica'; amount: number }
  | { type: 'por_turno'; amount: number }
  | { type: 'por_rodada'; amount: number }
  | { type: 'por_evento'; event: TriggerEvent; amount: number }
  | { type: 'nao_recarrega' };

export interface ChargeConfig {
  maximum: number;
  current: number;
  recharge: ChargeRecharge;
}

export type EffectDurationType =
  | 'turnos'
  | 'rodadas'
  | 'usos'
  | 'permanente'
  | 'ate_removido'
  | 'enquanto_equipado'
  | 'enquanto_forma_ativa'
  | 'enquanto_condicao_verdadeira';

export interface EffectDuration {
  type: EffectDurationType;
  amount?: number;
  conditionId?: string;
}

export type StackBehavior =
  | 'nao_acumula'
  | 'renova_duracao'
  | 'acumula_intensidade'
  | 'acumula_duracao'
  | 'acumula_ambos';

export type TriggerEvent =
  | 'uso_manual'
  | 'ao_atacar'
  | 'ao_ser_atacado'
  | 'ao_causar_dano'
  | 'ao_receber_dano'
  | 'ao_curar'
  | 'ao_ser_curado'
  | 'inicio_turno'
  | 'fim_turno'
  | 'inicio_rodada'
  | 'fim_rodada'
  | 'entrar_combate'
  | 'sair_combate'
  | 'equipar_arma'
  | 'desequipar_arma'
  | 'ativar_forma'
  | 'perder_forma'
  | 'consumir_aura'
  | 'restaurar_aura'
  | 'aplicar_efeito'
  | 'efeito_expirar'
  | 'morrer'
  | 'derrotar_alvo';

export interface TriggerConfig {
  event: TriggerEvent;
  tags?: ArsenalTag[];
  effectIds?: string[];
  /** Outras cartas disparadas por este gatilho. */
  cardIds?: string[];
  automatic?: boolean;
}

/** Filtro único de escopo, reutilizado por EffectModifier, DiceBonus e as tabelas de condição elemental. */
export interface EffectFilter {
  damageType?: Element[];
  cardIds?: string[];
  cardTags?: ArsenalTag[];
  categories?: ArsenalCategory[];
  abilityTypes?: AbilityType[];
  weaponIds?: string[];
  /** Só se aplica quando o efeito ativo foi originalmente aplicado por esta entidade. */
  sourceEntityId?: string;
}

export interface EffectModifier {
  stat: 'ataque' | 'defesa' | 'velocidade' | 'dano' | 'cura' | 'aura' | 'cura_recebida' | 'aura_recebida';
  operation: 'somar' | 'multiplicar' | 'definir';
  value: number;
  filter?: EffectFilter;
}

export type DiceBonusTarget = 'teste' | 'dano_extra' | 'dano' | 'cura';

/** Bônus de rolagem geral ou atrelado a um elemento/arma/tag específico. */
export interface DiceBonus {
  target: DiceBonusTarget;
  /** Dado extra somado à rolagem base (ex.: '1d4'). */
  bonusDice?: string | null;
  bonusFlat?: number;
  /** Rola a rolagem base duas vezes e fica com o maior resultado. */
  advantage?: boolean;
  /** Rola a rolagem base duas vezes e fica com o menor resultado. Anula vantagem. */
  disadvantage?: boolean;
  /** Rerrola uma vez quando o resultado base for menor que este limite. */
  rerollBelow?: number | null;
  /** Eleva o resultado base para, no mínimo, este valor antes dos bônus. */
  minimumResult?: number | null;
  filter?: EffectFilter;
}

export type ElementalAffinityKind = 'resistencia' | 'vulnerabilidade' | 'imunidade' | 'absorcao';

/** Afinidade elemental concedida por um efeito ativo (resistência/vulnerabilidade/imunidade/absorção). */
export interface ElementalAffinity {
  element: Element;
  kind: ElementalAffinityKind;
  /** Percentual do multiplicador para resistência/vulnerabilidade/absorção (0-100+). Ignorado em imunidade. */
  percent: number;
}

export type ClassicEffectKind =
  | 'queimadura' | 'congelamento' | 'lentidao' | 'molhado' | 'eletrocutado'
  | 'sangramento' | 'fraqueza' | 'acelerado' | 'desnorteado'
  | 'enraizado' | 'desequilibrado' | 'fraturado' | 'iluminado' | 'amaldicoado'
  | 'paralisado' | 'confuso';

export type ClassicEffectConfig =
  | { kind: 'queimadura' | 'eletrocutado'; value: number }
  | { kind: 'congelamento'; value: number }
  | { kind: 'lentidao' | 'acelerado'; value: number }
  | { kind: 'molhado'; value: number }
  | { kind: 'sangramento'; value: number; mode: 'fixo' | 'percentual_vida_maxima' }
  | { kind: 'fraqueza'; value: number; mode: 'subtrair' | 'dividir' }
  | { kind: 'desnorteado'; value: number }
  | { kind: 'enraizado' | 'desequilibrado' | 'fraturado' | 'iluminado' | 'amaldicoado'; value: number }
  | { kind: 'paralisado'; value: number } // DC do teste 1d20 (valor mínimo aceito)
  | { kind: 'confuso'; value: number }; // chance (0-1) de a ação ser cancelada

export interface ArsenalEffect {
  id: string;
  name: string;
  description: string;
  tags: ArsenalTag[];
  duration: EffectDuration;
  stackBehavior: StackBehavior;
  maxStacks: number;
  triggers: TriggerConfig[];
  modifiers: EffectModifier[];
  periodicDamage: AmountFormula | null;
  periodicHealing: AmountFormula | null;
  auraConsumed: AmountFormula | null;
  auraRestored: AmountFormula | null;
  attackModifier: number;
  defenseModifier: number;
  speedModifier: number;
  customEffect: string | null;
  /** Regra parametrizada dos nove efeitos clássicos. */
  classic?: ClassicEffectConfig;
  /** Bônus de rolagem (dado extra, flat, vantagem) concedidos enquanto este efeito está ativo. */
  diceBonuses?: DiceBonus[];
  /** Resistência/vulnerabilidade/imunidade/absorção elemental concedida a quem carrega o efeito. */
  elementalAffinities?: ElementalAffinity[];
  /** Percentual do dano causado pelo portador que retorna como cura (0-100). */
  lifeSteal?: number | null;
  /** Dano refletido ao atacante quando o portador é atingido. */
  thorns?: AmountFormula | null;
  /** Efeitos clássicos que o portador não pode receber enquanto este efeito está ativo. */
  immunities?: ClassicEffectKind[];
}

export type UsageCondition =
  | { type: 'arma_equipada'; weaponIds?: string[]; tags?: ArsenalTag[] }
  | { type: 'forma_ativa'; formIds?: string[]; tags?: ArsenalTag[] }
  | { type: 'elemento'; element: Element }
  | { type: 'aura_minima'; amount: number }
  | { type: 'vida_acima'; value: number; unit: 'valor' | 'percentual' }
  | { type: 'vida_abaixo'; value: number; unit: 'valor' | 'percentual' }
  | { type: 'efeito_ativo'; effectId: string }
  | { type: 'alvo_com_efeito'; effectId: string }
  | { type: 'proprio_turno' }
  | { type: 'reacao' }
  | { type: 'fora_turno' }
  | { type: 'em_combate' }
  | { type: 'fora_combate' }
  | { type: 'tag'; tag: ArsenalTag; subject: 'usuario' | 'alvo' | 'carta' };

export interface WeaponModule {
  freelyEquippable: boolean;
  grantedAbilityIds: string[];
  /** Efeitos passivos concedidos enquanto a arma está equipada (duração forçada para 'enquanto_equipado'). */
  effects?: ArsenalEffect[];
}

export interface FormModule {
  grantedAbilityIds: string[];
  removedAbilityIds: string[];
  hpBonus: number;
  auraBonus: number;
  color?: string;
  iconOverride?: string;
  /** Duração em rodadas. null/ausente = permanente até reverter ou o combate acabar. */
  durationRounds?: number | null;
  /** Efeitos passivos concedidos enquanto a forma está ativa (duração forçada para 'enquanto_forma_ativa'). */
  effects?: ArsenalEffect[];
}

export interface ItemModule {
  consumable: boolean;
  quantity: number;
  disappearsOnUse: boolean;
  /** Quantas unidades cada ativação consome. Ausente/menor que 1 = 1. */
  usesPerActivation?: number;
}

export interface SealModule {
  /** Comportamento principal. `type` é mantido para compatibilidade com cartas antigas. */
  kind: SealKind;
  type?: SealType;
  persistent: boolean;
  consumable: boolean;
  requiredItems: { itemId: string; quantity: number }[];
  /** Duração geral do ritual em rodadas. null = sem duração definida. */
  durationRounds: number | null;
}

export interface ComboModule {
  /** Cartas de combo com a mesma chave podem ser empilhadas na mesma jogada. */
  stackKey: string;
  maxStacks: number;
  /** Campos legados, lidos apenas durante a migração. */
  abilityIds?: string[];
  minimumAbilities?: number;
  resolution: 'sequencial' | 'simultanea';
}

/** Valores que podem evoluir de um nível para o seguinte. */
export interface ArsenalLevel {
  level: number;
  name?: string;
  description?: string;
  element?: Element | null;
  testDice?: string | null;
  extraDamageDice?: string | null;
  damage?: AmountFormula | null;
  healing?: AmountFormula | null;
  auraConsumed?: AmountFormula | null;
  auraRestored?: AmountFormula | null;
  effects?: ArsenalEffect[];
  cooldown?: CooldownConfig;
  charges?: ChargeConfig | null;
  form?: FormModule;
  weapon?: WeaponModule;
  seal?: SealModule;
  item?: ItemModule;
}

/** Entidade canônica do arsenal. A UI antiga é adaptada para este contrato. */
export interface ArsenalCard {
  schemaVersion: 1;
  id: string;
  name: string;
  description: string;
  category: ArsenalCategory;
  icon: string;
  tags: ArsenalTag[];
  element: Element | null;
  testDice: string | null;
  extraDamageDice: string | null;
  damage: AmountFormula | null;
  healing: AmountFormula | null;
  auraConsumed: AmountFormula | null;
  auraRestored: AmountFormula | null;
  target: TargetConfig;
  area: AreaConfig | null;
  preparation: PreparationConfig;
  conditions: UsageCondition[];
  triggers: TriggerConfig[];
  effects: ArsenalEffect[];
  cooldown: CooldownConfig;
  charges: ChargeConfig | null;
  visibility: ArsenalVisibility;
  weaponLinks: string[];
  formLinks: string[];
  abilityType?: AbilityType;
  weapon?: WeaponModule;
  form?: FormModule;
  item?: ItemModule;
  seal?: SealModule;
  combo?: ComboModule;
  /** Nível 1 é a própria carta; a lista contém somente os níveis seguintes. */
  levels: ArsenalLevel[];
  metadata?: Record<string, unknown>;
  /** Sobrescreve a chance padrão de aplicar a condição elemental do seu tipo de dano (0-1). */
  elementalConditionChance?: number;
  /** false desativa completamente o proc de condição elemental para esta carta. */
  applyElementalCondition?: boolean;
}

export interface ArsenalHolding {
  cardId: string;
  quantity: number;
  equipped: boolean;
  active: boolean;
  currentCharges?: number;
  cooldownRemaining?: number;
}

export const INSTANT_PREPARATION: PreparationConfig = {
  timing: { type: 'instantaneo' },
  cancellable: false,
  interruptedByDamage: false,
  persistsAfterDamage: true,
  visibility: 'visivel',
};

export function createArsenalCard(
  input: Pick<ArsenalCard, 'id' | 'name' | 'category'> & Partial<Omit<ArsenalCard, 'id' | 'name' | 'category'>>,
): ArsenalCard {
  return {
    schemaVersion: 1,
    description: '',
    icon: '',
    tags: [],
    element: null,
    testDice: null,
    extraDamageDice: null,
    damage: null,
    healing: null,
    auraConsumed: null,
    auraRestored: null,
    target: { type: 'um_alvo' },
    area: null,
    preparation: INSTANT_PREPARATION,
    conditions: [],
    triggers: [{ event: 'uso_manual' }],
    effects: [],
    cooldown: { type: 'sem_cooldown' },
    charges: null,
    visibility: 'publica',
    weaponLinks: [],
    formLinks: [],
    levels: [],
    ...input,
  };
}

export function arsenalMaxLevel(card: ArsenalCard): number {
  return Math.max(1, ...card.levels.map(entry => entry.level));
}

/** Resolve a carta efetiva acumulando as substituições até o nível escolhido. */
export function arsenalCardAtLevel(card: ArsenalCard, requestedLevel = 1): ArsenalCard {
  const level = Math.max(1, Math.min(Math.floor(requestedLevel) || 1, arsenalMaxLevel(card)));
  const base = structuredClone(card);
  const levels = base.levels;
  for (const entry of [...levels].sort((a, b) => a.level - b.level)) {
    if (entry.level > level) break;
    const { level: _level, ...changes } = entry;
    Object.assign(base, structuredClone(changes));
  }
  base.levels = levels;
  return base;
}

export function normalizeTags(tags: readonly string[] | undefined): ArsenalTag[] {
  return [...new Set((tags ?? []).map(tag => tag.trim().toLocaleLowerCase('pt-BR')).filter(Boolean))];
}

export function hasAllTags(source: readonly ArsenalTag[], required: readonly ArsenalTag[]): boolean {
  const normalized = new Set(normalizeTags(source));
  return normalizeTags(required).every(tag => normalized.has(tag));
}

export function grantedAbilities(card: ArsenalCard): string[] {
  if (card.category === 'arma') return card.weapon?.grantedAbilityIds ?? [];
  if (card.abilityType === 'forma') return card.form?.grantedAbilityIds ?? [];
  return [];
}
