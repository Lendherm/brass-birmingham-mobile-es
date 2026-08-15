import type { CityId } from '../engine/types';
import { LAYOUT } from '../engine/data/layout';
import type { InteractiveTutorialStep } from '../engine/tutorial/steps';

export function tutorialBoardView(
  step: InteractiveTutorialStep | undefined,
): { x: number; y: number; scale?: number } | null {
  if (!step) return null;

  switch (step.step.type) {
    case 'continue':
      if (step.step.focus === 'board-viewport' || step.step.focus === 'board') return null;
      return null;
    case 'apply-build':
      return { ...LAYOUT[step.step.city as CityId], scale: 1 };
    case 'apply-network':
      return null;
    case 'apply-sell': {
      const pos = LAYOUT[step.step.city as CityId];
      return { x: pos.x, y: pos.y, scale: 1.05 };
    }
    case 'apply-develop':
      return null;
    default:
      return null;
  }
}
