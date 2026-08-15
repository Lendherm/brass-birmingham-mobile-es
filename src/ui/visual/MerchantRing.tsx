import type { IndustryType, MerchantBonus } from '../../engine/types';
import { merchantBonusLabel, merchantTileLabel } from '../../i18n/es';
import { MerchantBonusDisplay, MerchantSlotIcon } from './MerchantStackIcon';

interface Props {
  tiles: readonly (IndustryType | 'any' | 'blank')[];
  beer: readonly boolean[];
  bonus?: MerchantBonus;
  size?: number;
}

export function MerchantRing({ tiles, beer: _beer, bonus, size = 12 }: Props) {
  void _beer;
  const activeSlots = tiles.filter((t) => t !== 'blank').length;
  return (
    <div className="merchant-ring-map" data-testid="merchant-ring">
      {tiles.map((t, i) => {
        if (t === 'blank') return null;
        return (
          <MerchantSlotIcon
            key={i}
            tile={t}
            size={size}
            title={merchantTileLabel(t)}
          />
        );
      })}
      {bonus && activeSlots > 0 && (
        <MerchantBonusDisplay bonus={bonus} size={size} title={merchantBonusLabel(bonus)} />
      )}
    </div>
  );
}
