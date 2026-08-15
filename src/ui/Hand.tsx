import type { Card } from '../engine/state';
import { GameCard } from './Card';
import { playCardSound, vibrateTap } from './visual/sounds';

interface Props {
  cards: Card[];
  selectedIdx: number | null;
  scoutExtras: number[];
  selectable: Set<number>;
  hasAction: boolean;
  onSelect: (idx: number) => void;
}

export function Hand({ cards, selectedIdx, scoutExtras, selectable, hasAction, onSelect }: Props) {
  const anyBuildable = selectable.size > 0;
  return (
    <div className="hand-scroll" data-testid="hand">
      <div className="hand-fan">
        {cards.map((card, i) => {
          const selected = selectedIdx === i || scoutExtras.includes(i);
          const playable = selectable.has(i);
          const dimmed = !playable && (hasAction || anyBuildable);
          return (
            <GameCard
              key={i}
              card={card}
              size="md"
              selected={selected}
              disabled={dimmed}
              testId={`hand-card-${i}`}
              onClick={() => {
                if (!playable) return;
                playCardSound();
                vibrateTap();
                onSelect(i);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
