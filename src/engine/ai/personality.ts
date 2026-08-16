import type { PlayerId } from '../types';
import { HUMAN } from '../state';

export interface PersonalityWeights {
  build: number;
  sell: number;
  network: number;
  develop: number;
  block: number;
}

/** Distinct play styles per AI slot (cycles for 1–3 rivals). */
export function personalityFor(playerId: PlayerId): PersonalityWeights {
  if (playerId === HUMAN) {
    return { build: 1, sell: 1, network: 1, develop: 1, block: 1 };
  }
  switch ((playerId - 1) % 3) {
    case 0:
      return { build: 1.05, sell: 1, network: 1.25, develop: 0.95, block: 1.1 };
    case 1:
      return { build: 1.2, sell: 0.95, network: 1, develop: 1.1, block: 1.05 };
    default:
      return { build: 0.95, sell: 1.25, network: 0.95, develop: 1, block: 1.15 };
  }
}
