import type { PlayerAction } from './game';
import { rankCandidates } from './ai/evaluate';
import { tileSpec } from './data/industries';
import { legalSells } from './options';
import { activePlayer, HUMAN, type GameState } from './state';
import type { IndustryType, PlayerId } from './types';
import type { ScoredAction } from './ai/types';

function countPlayerTiles(state: GameState, player: PlayerId, industry: IndustryType): number {
  let n = 0;
  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (tile?.owner === player && tile.industry === industry) n++;
    }
  }
  return n;
}

/** Ajuste de puntuación solo para el entrenador humano (no afecta a la IA). */
function coachActionBias(state: GameState, candidate: ScoredAction, player: PlayerId): number {
  let bias = 0;
  const action = candidate.action;

  if (action.type === 'build') {
    const { industry, level } = action.option;
    const spec = tileSpec(industry, level);
    if (['cotton', 'goods', 'pottery'].includes(industry) && spec.vp > 0) bias += 5;

    const sellCount = legalSells(state).filter((s) => {
      const tile = state.board[s.sale.city][s.sale.slot];
      return tile?.owner === player;
    }).length;
    if (sellCount >= 1 && (industry === 'coal' || industry === 'cotton') && level === 1) bias -= 10;
    const same = countPlayerTiles(state, player, industry);
    if (same >= 2 && level === 1 && (industry === 'coal' || industry === 'cotton')) bias -= 6;
    if (spec.producesCoal) bias -= 3;
    if (spec.producesIron) bias -= 2;
    if (spec.producesBeer && sellCount === 0) bias -= 1;
  }

  if (action.type === 'develop') {
    const industry = action.industries[0];
    bias += 4;
    if (state.era === 'canal') bias += 3;
    const sellables = countPlayerTiles(state, player, 'cotton') + countPlayerTiles(state, player, 'goods');
    if (sellables >= 2 && (industry === 'cotton' || industry === 'goods' || industry === 'pottery')) bias += 5;
  }

  if (action.type === 'scout') bias += 4;

  if (action.type === 'sell') bias += 3;

  return bias;
}

/** Candidatos rankeados con sesgo de aprendizaje para el jugador humano. */
export function rankCandidatesForCoach(state: GameState): ScoredAction[] {
  const player = activePlayer(state);
  const base = rankCandidates(state);
  if (player !== HUMAN) return base;
  return base
    .map((c) => ({ ...c, score: c.score + coachActionBias(state, c, player) }))
    .sort((a, b) => b.score - a.score);
}

export function bestCoachAction(state: GameState, player: PlayerId = activePlayer(state)): PlayerAction | null {
  if (player !== HUMAN) return null;
  const ranked = rankCandidatesForCoach(state).filter((c) => c.action.type !== 'pass');
  return ranked[0]?.action ?? null;
}
