import type { IndustryType, MerchantBonus } from '../../engine/types';
import { IndustryIcon, WildIcon } from './IndustryIcon';
import { MerchantBonusIcon } from './MerchantBonusIcon';

function TileIcon({ tile, size }: { tile: IndustryType | 'any' | 'blank'; size: number }) {
  if (tile === 'blank') return <span className="merchant-stack-blank">—</span>;
  if (tile === 'any') return <WildIcon size={size} />;
  return <IndustryIcon industry={tile} size={size} colorful />;
}

/** Icono de ficha de compra del comerciante (sin cerveza). */
export function MerchantSlotIcon({
  tile,
  size = 12,
  title,
}: {
  tile: IndustryType | 'any' | 'blank';
  size?: number;
  title?: string;
}) {
  return (
    <span className={`merchant-slot-icon${tile === 'blank' ? ' is-blank' : ''}`} title={title}>
      <TileIcon tile={tile} size={size} />
    </span>
  );
}

/** Símbolo de bonificación del mercado (sin cerveza). */
export function MerchantBonusDisplay({
  bonus,
  size = 12,
  title,
}: {
  bonus: MerchantBonus;
  size?: number;
  title?: string;
}) {
  return (
    <span className="merchant-bonus-icon-only" title={title}>
      <MerchantBonusIcon bonus={bonus} size={size + 4} />
    </span>
  );
}

/** @deprecated use MerchantSlotIcon */
export const MerchantTileBeerStack = MerchantSlotIcon;

/** @deprecated use MerchantBonusDisplay */
export const MerchantBonusBeerStack = MerchantBonusDisplay;
