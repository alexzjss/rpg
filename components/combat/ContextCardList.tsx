import React from 'react';
import { Pin, Zap, Crosshair, PackageOpen, Hexagon, Sparkles, Link } from 'lucide-react';
import { CombatState, Card, Item, CardType } from '../../types';
import { resolveOwnedItems, ResolvedItem } from '../../utils/items';
import { CARD_TYPE_THEME, PALETTE } from '../../utils/theme';
import type { ActionCategory } from './ActionIconRail';

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  ataque:  'ATAQUE',
  acao:    'ACAO',
  vinculo: 'VINCULO',
  item:    'ITEM',
  forma:   'FORMA',
  selo:    'SELO',
};

const CATEGORY_SUBTITLES: Record<ActionCategory, string> = {
  ataque:  'Tecnicas ofensivas',
  acao:    'Habilidades e respostas',
  vinculo: 'Elos e suporte',
  item:    'Suprimentos de combate',
  forma:   'Manifestacoes',
  selo:    'Codigos rituais',
};

const AO_TYPES: CardType[] = ['ação', 'reação', 'reforço', 'combinação'];

const normalizeLabel = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const isVinculoValue = (value: unknown) => normalizeLabel(value) === 'vinculo';

const isVinculoCard = (card: Card) =>
  isVinculoValue(card.type) || isVinculoValue((card as any).command);

interface ContextCardListProps {
  selectedAction: { combatId: string; category: ActionCategory } | null;
  combat: CombatState;
  cards: Card[];
  items: Item[];
  onCardClick?: (card: Card) => void;
  onItemClick?: (item: ResolvedItem) => void;
  floating?: boolean;
}

type SkillEntry = {
  id: string;
  kind: 'card' | 'item' | 'bond';
  name: string;
  description?: string;
  typeLabel: string;
  accent: string;
  sideLabel: string;
  metaLabel?: string;
  pinned?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  card?: Card;
  item?: ResolvedItem;
};

function canAffordCard(
  card: Card,
  aura: number,
  maxAmmo: number,
  currentAmmo: number,
): boolean {
  const ammoCost = card.ammoCost ?? 0;
  return (
    aura >= card.auraCost &&
    (ammoCost === 0 || maxAmmo === 0 || currentAmmo >= ammoCost)
  );
}

function getUnavailableReason(card: Card, aura: number, maxAmmo: number, currentAmmo: number): string | undefined {
  const ammoCost = card.ammoCost ?? 0;
  if (aura < card.auraCost) return 'AP insuficiente';
  if (ammoCost > 0 && maxAmmo > 0 && currentAmmo < ammoCost) return 'Municao insuficiente';
  return undefined;
}

function getCardCostLabel(card: Card): string {
  const parts: string[] = [];
  if (card.auraCost > 0) parts.push(`${card.auraCost} AP`);
  if ((card.ammoCost ?? 0) > 0) parts.push(`${card.ammoCost} AM`);
  return parts.length > 0 ? parts.join(' + ') : '0';
}

function getCardMetaLabel(card: Card): string | undefined {
  const parts: string[] = [];
  const diceRoll = (card as any).diceRoll;
  if (diceRoll) parts.push(diceRoll);
  if ((card.damage ?? 0) > 0) parts.push(`${card.damage} dmg`);
  if (card.isAreaEffect) parts.push('area');
  return parts.length ? parts.join(' / ') : undefined;
}

function filterCardForCategory(category: ActionCategory, card: Card): boolean {
  switch (category) {
    case 'ataque':  return card.type === 'ataque';
    case 'acao':    return AO_TYPES.includes(card.type);
    case 'vinculo': return isVinculoCard(card);
    case 'forma':   return card.type === 'forma';
    default:        return false;
  }
}

const SkillIcon: React.FC<{ entry: SkillEntry }> = ({ entry }) => {
  if (entry.kind === 'item') return <PackageOpen size={17} />;
  if (entry.kind === 'bond' || (entry.card && isVinculoCard(entry.card))) return <Link size={17} />;
  if (entry.card?.type === 'forma') return <Sparkles size={17} />;
  if (entry.card?.type === 'combinação') return <Hexagon size={17} />;
  if ((entry.card?.ammoCost ?? 0) > 0) return <Crosshair size={17} />;
  return <Zap size={17} />;
};

const ContextCardList: React.FC<ContextCardListProps> = ({
  selectedAction,
  combat,
  cards,
  items,
  onCardClick,
  onItemClick,
  floating = false,
}) => {
  const [highlightedEntryId, setHighlightedEntryId] = React.useState<string | null>(null);

  if (!selectedAction) return null;

  const combatant = combat.combatants.find(c => c.combatId === selectedAction.combatId);
  if (!combatant) return null;

  const { category } = selectedAction;
  const activeForma = (combat.activeForms ?? []).find(f => f.combatantId === combatant.combatId);
  const extraCardIds = activeForma?.extraCardIds ?? [];
  const allCardIds = [...combatant.cardIds, ...extraCardIds];
  const pinnedIds = combatant.pinnedCardIds ?? [];
  const { currentAura, maxAmmo = 0, currentAmmo = 0 } = combatant;

  let entries: SkillEntry[] = [];
  let emptyMessage = 'Nenhuma opcao disponivel';

  if (category === 'item') {
    const resolvedItems = resolveOwnedItems(combatant, items)
      .filter(it => it.usableInCombat && it.quantity > 0);

    emptyMessage = 'Nenhum item de combate';
    entries = resolvedItems.map(item => ({
      id: `item-${item.id}`,
      kind: 'item',
      name: item.name,
      description: item.description,
      typeLabel: 'IT',
      accent: 'var(--gold-mid)',
      sideLabel: `x${item.quantity}`,
      item,
    }));
  } else if (category !== 'selo') {
    const seen = new Set<string>();
    let uniqueCards = allCardIds
      .map(id => cards.find(c => c.id === id))
      .filter((c): c is Card => c !== undefined && filterCardForCategory(category, c))
      .filter(card => {
        if (seen.has(card.id)) return false;
        seen.add(card.id);
        return true;
      });

    const bondNames = category === 'vinculo'
      ? (combatant.bonds ?? []).map(bond => bond.trim()).filter(Boolean)
      : [];

    if (category === 'vinculo' && bondNames.length > 0) {
      const bondCards = bondNames
        .map(bondName => cards.find(card =>
          isVinculoCard(card) && normalizeLabel(card.name) === normalizeLabel(bondName)
        ))
        .filter((card): card is Card => Boolean(card))
        .filter(card => {
          if (seen.has(card.id)) return false;
          seen.add(card.id);
          return true;
        });

      uniqueCards = [...uniqueCards, ...bondCards];
    }

    uniqueCards.sort((a, b) => {
      const aPin = pinnedIds.includes(a.id) ? 0 : 1;
      const bPin = pinnedIds.includes(b.id) ? 0 : 1;
      if (aPin !== bPin) return aPin - bPin;
      return a.name.localeCompare(b.name, 'pt-BR');
    });

    emptyMessage = 'Nenhuma carta disponivel';
    entries = uniqueCards.map(card => {
      const theme = CARD_TYPE_THEME[card.type];
      const affordable = canAffordCard(card, currentAura, maxAmmo, currentAmmo);
      return {
        id: `card-${card.id}`,
        kind: 'card',
        name: card.name,
        description: card.description,
        typeLabel: theme.label,
        accent: theme.topColor,
        sideLabel: getCardCostLabel(card),
        metaLabel: getCardMetaLabel(card),
        pinned: pinnedIds.includes(card.id),
        disabled: !affordable,
        disabledReason: affordable ? undefined : getUnavailableReason(card, currentAura, maxAmmo, currentAmmo),
        card,
      };
    });

    if (category === 'vinculo' && bondNames.length > 0) {
      const representedBondNames = new Set(uniqueCards.map(card => normalizeLabel(card.name)));
      const bondOnlyEntries: SkillEntry[] = bondNames
        .filter(bondName => !representedBondNames.has(normalizeLabel(bondName)))
        .map((bondName, index) => ({
          id: `bond-${normalizeLabel(bondName) || 'vinculo'}-${index}`,
          kind: 'bond',
          name: bondName,
          description: 'Vinculo registrado na ficha. Nenhuma carta correspondente foi encontrada.',
          typeLabel: 'VIN',
          accent: PALETTE.teamCast,
          sideLabel: '--',
          metaLabel: 'Sem carta vinculada',
          disabled: true,
          disabledReason: 'Sem carta vinculada',
        }));

      entries = [...entries, ...bondOnlyEntries];
    }
  }

  const activeEntry =
    entries.find(entry => entry.id === highlightedEntryId) ??
    entries.find(entry => !entry.disabled) ??
    entries[0];

  const handleActivate = (entry: SkillEntry) => {
    if (entry.disabled) return;
    if (entry.kind === 'card' && entry.card && onCardClick) onCardClick(entry.card);
    if (entry.kind === 'item' && entry.item && onItemClick) onItemClick(entry.item);
  };

  return (
    <div
      className={`hidden lg:flex flex-col mp-skill-panel ${floating ? 'mp-floating-panel' : ''}`}
      style={{
        width: floating ? 330 : 292,
        flexShrink: 0,
        height: '100%',
        background: floating ? 'linear-gradient(180deg, rgba(28,20,11,0.93), rgba(17,12,7,0.94))' : 'var(--bg-surface)',
        border: floating ? '1px solid rgba(201,152,58,0.3)' : undefined,
        borderRight: floating ? undefined : '1px solid var(--border-faint)',
        borderRadius: floating ? 16 : undefined,
        overflow: 'hidden',
        boxShadow: floating ? '0 22px 70px rgba(0,0,0,0.62)' : undefined,
        backdropFilter: floating ? 'blur(20px) saturate(1.28)' : undefined,
      }}
    >
      <div className="mp-skill-header">
        <div className="mp-battle-ghost mp-battle-ghost--skill" style={{ position: 'absolute', top: -4, right: -6, zIndex: 0 }}>
          {CATEGORY_LABELS[category].slice(0, 3)}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="mp-skill-kicker">{CATEGORY_SUBTITLES[category]}</div>
          <h3 className="mp-skill-title">{CATEGORY_LABELS[category]}</h3>
        </div>
        <div className="mp-skill-actor" style={{ position: 'relative', zIndex: 1 }}>{combatant.name}</div>
      </div>

      {category === 'selo' ? (
        <div className="mp-skill-empty">
          <Hexagon size={26} />
          <strong>Selos por codigo</strong>
          <span>Use o painel de combate para ativar rituais e comandos de selo.</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="mp-skill-empty">
          <Sparkles size={26} />
          <strong>{emptyMessage}</strong>
          <span>Escolha outra categoria na faixa de turno.</span>
        </div>
      ) : (
        <>
          <div className="mp-skill-list custom-scroll">
            {entries.map(entry => {
              const isActive = activeEntry?.id === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`mp-skill-row ${isActive ? 'mp-skill-row--active' : ''} ${entry.disabled ? 'mp-skill-row--disabled' : ''}`}
                  style={{ ['--skill-color' as any]: entry.accent }}
                  disabled={entry.disabled}
                  onMouseEnter={() => setHighlightedEntryId(entry.id)}
                  onFocus={() => setHighlightedEntryId(entry.id)}
                  onClick={() => handleActivate(entry)}
                >
                  <span className="mp-skill-row__brush" />
                  <span className="mp-skill-row__icon"><SkillIcon entry={entry} /></span>
                  <span className="mp-skill-row__main">
                    <span className="mp-skill-row__name">
                      {entry.pinned && <Pin size={10} />}
                      {entry.name}
                    </span>
                    <span className="mp-skill-row__meta">
                      {entry.disabledReason ?? entry.metaLabel ?? entry.typeLabel}
                    </span>
                  </span>
                  <span className="mp-skill-cost">{entry.sideLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="mp-skill-description" style={{ ['--skill-color' as any]: activeEntry?.accent ?? 'var(--gold-mid)' }}>
            <div className="mp-skill-description__top">
              <span>{activeEntry?.typeLabel}</span>
              <strong>{activeEntry?.name}</strong>
              <em>{activeEntry?.sideLabel}</em>
            </div>
            <p>
              {activeEntry?.description ||
                (activeEntry?.disabledReason
                  ? activeEntry.disabledReason
                  : 'Sem descricao registrada.')}
            </p>
            {activeEntry?.metaLabel && <small>{activeEntry.metaLabel}</small>}
          </div>
        </>
      )}
    </div>
  );
};

export default ContextCardList;
