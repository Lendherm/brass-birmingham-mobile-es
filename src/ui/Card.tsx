import type { CityId, IndustryType } from '../engine/types';
import { CITIES } from '../engine/data/board';
import { industria } from '../i18n/es';
import type { Card } from '../engine/state';
import { CARD_WILD, industryTheme } from './visual/industryTheme';
import { cityZone, zoneTheme } from './visual/cityZones';
import { LocationSlotIcons } from './visual/LocationSlotIcons';
import { IndustryIcon, LocationIcon, WildIcon } from './visual/IndustryIcon';

export interface CardMeta {
  kind: 'location' | 'industry' | 'wildLocation' | 'wildIndustry';
  title: string;
  subtitle: string;
  industries: readonly IndustryType[];
  cssClass: string;
  zoneColor?: string;
  slotSpecs?: readonly (readonly IndustryType[])[];
}

export function cardMeta(card: Card): CardMeta {
  switch (card.kind) {
    case 'location': {
      const zone = zoneTheme(cityZone(card.city));
      const citySpec = CITIES[card.city];
      return {
        kind: 'location',
        title: citySpec.name,
        subtitle: zone.label,
        industries: [],
        cssClass: `card-location zone-${cityZone(card.city)}`,
        zoneColor: zone.banner,
        slotSpecs: citySpec.slots,
      };
    }
    case 'wildLocation':
      return {
        kind: 'wildLocation',
        title: 'Comodín',
        subtitle: 'Cualquier ubicación',
        industries: [],
        cssClass: 'card-wild card-wild-location',
      };
    case 'wildIndustry':
      return {
        kind: 'wildIndustry',
        title: 'Comodín',
        subtitle: 'Cualquier industria',
        industries: [],
        cssClass: 'card-wild card-wild-industry',
      };
    case 'industry':
      return {
        kind: 'industry',
        title: card.industries.length === 1 ? industria(card.industries[0]) : card.industries.map((i) => industryTheme(i).short).join(' · '),
        subtitle: card.industries.length > 1 ? 'Industrias' : 'Industria',
        industries: card.industries,
        cssClass: `card-industry ${card.industries.map((i) => `ind-${i}`).join(' ')}`,
      };
  }
}

export function cardLabel(card: Card): string {
  return cardMeta(card).title;
}

/** City to spotlight on the map when a location card is selected. */
export function cardFocusCity(card: Card | null): CityId | null {
  return card?.kind === 'location' ? card.city : null;
}

interface GameCardProps {
  card: Card;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  testId?: string;
}

export function GameCard({ card, selected, disabled, size = 'md', onClick, testId }: GameCardProps) {
  const meta = cardMeta(card);
  const isWild = meta.kind.startsWith('wild');
  const primaryIndustry = meta.industries[0];

  return (
    <button
      type="button"
      className={[
        'game-card',
        `game-card-${size}`,
        meta.cssClass,
        selected ? 'selected' : '',
        disabled ? 'disabled' : '',
        isWild ? 'wild' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      aria-label={`${meta.subtitle}: ${meta.title}`}
      aria-pressed={selected}
    >
      <div className="game-card-inner">
        {meta.kind === 'location' && (
          <span className="game-card-zone-band" style={{ background: meta.zoneColor }} aria-hidden />
        )}
        {meta.kind === 'industry' && primaryIndustry && <span className={`game-card-stripe ind-${primaryIndustry}`} aria-hidden />}
        <div className="game-card-icon">
          {meta.kind === 'location' && <LocationIcon size={size === 'lg' ? 28 : size === 'sm' ? 16 : 20} zoneColor={meta.zoneColor} />}
          {isWild && <WildIcon size={size === 'lg' ? 32 : size === 'sm' ? 18 : 24} />}
          {meta.kind === 'industry' && primaryIndustry && (
            <IndustryIcon industry={primaryIndustry} size={size === 'lg' ? 32 : size === 'sm' ? 18 : 24} colorful />
          )}
        </div>
        <div className="game-card-type">{meta.subtitle}</div>
        <div className="game-card-title">{meta.title}</div>
        {meta.slotSpecs && meta.slotSpecs.length > 0 && (
          <LocationSlotIcons slots={meta.slotSpecs} size={size === 'lg' ? 'md' : 'sm'} variant="card" />
        )}
        {meta.industries.length > 1 && (
          <div className="game-card-dots">
            {meta.industries.map((ind) => (
              <span key={ind} className={`ind-dot ind-${ind}`} title={industria(ind)} />
            ))}
          </div>
        )}
        <div className="game-card-back-pattern" aria-hidden />
      </div>
    </button>
  );
}

export function CardPreview({ card }: { card: Card | null }) {
  if (!card) return null;
  return (
    <div className="card-preview" data-testid="card-preview">
      <span className="card-preview-label">Carta seleccionada</span>
      <GameCard card={card} size="lg" />
    </div>
  );
}

export { CARD_WILD };
