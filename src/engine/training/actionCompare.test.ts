import { describe, expect, it } from 'vitest';
import { newGame } from '../state';
import { numericForkCompare, numericForkSummary } from './actionCompare';

describe('numericForkCompare', () => {
  it('returns ranked lines with bullets for idle turn', () => {
    const state = newGame(7, 'medium', 1);
    state.actionsLeft = 8;
    const lines = numericForkCompare(state);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    for (const line of lines) {
      expect(line.pct).toBeGreaterThanOrEqual(0);
      expect(line.pct).toBeLessThanOrEqual(100);
      expect(line.bullets.length).toBeGreaterThan(0);
    }
  });

  it('filters build lines to selected card', () => {
    const state = newGame(3, 'easy', 1);
    state.actionsLeft = 8;
    const all = numericForkCompare(state);
    const cardIdx = 0;
    const filtered = numericForkCompare(state, cardIdx);
    const buildAll = all.find((l) => l.action === 'build');
    const buildCard = filtered.find((l) => l.action === 'build');
    if (buildAll && buildCard) {
      expect(buildCard.pct).toBeLessThanOrEqual(buildAll.pct + 1);
    }
  });
});

describe('numericForkSummary', () => {
  it('summarizes sell vs build when sell leads', () => {
    const summary = numericForkSummary([
      { action: 'sell', label: 'Vender', pct: 85, bullets: ['4 PV (ficha)', '+1 ingresos al voltear'] },
      { action: 'build', label: 'Construir', pct: 55, bullets: ['Coste ~£8', '2 PV al voltear'] },
    ]);
    expect(summary).toMatch(/Vender/i);
  });
});
