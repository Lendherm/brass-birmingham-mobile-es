import type { IndustryType } from '../../engine/types';
import { IndustryIcon } from './IndustryIcon';

interface Props {
  slots: readonly (readonly IndustryType[])[];
  size?: 'sm' | 'md';
  variant?: 'card' | 'board';
}

/** Mini grid of buildable industry icons (PC-style location card / map slots). */
export function LocationSlotIcons({ slots, size = 'md', variant = 'card' }: Props) {
  const iconSize = size === 'sm' ? 11 : 13;

  return (
    <div className={`location-slot-icons location-slot-icons-${size} location-slot-icons-${variant}`} aria-hidden>
      {slots.map((allowed, i) => (
        <div key={i} className="location-slot-cell">
          {allowed.slice(0, 2).map((ind) => (
            <IndustryIcon key={ind} industry={ind} size={iconSize} colorful />
          ))}
        </div>
      ))}
    </div>
  );
}
