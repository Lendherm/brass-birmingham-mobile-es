import type { PlayerAction } from '../game';
import { tileSpec } from '../data/industries';
import { developCost } from '../actions';
import { describeAction } from '../ai/coach';
import { rankCandidates } from '../ai/evaluate';
import { activePlayer, type GameState } from '../state';
import { industria } from '../messages';
import { scoreToQualityPct } from './trainingHints';

export interface NumericForkLine {
  action: 'sell' | 'build' | 'develop' | 'network';
  label: string;
  pct: number;
  bullets: string[];
}

function rankedSpread(state: GameState) {
  const ranked = rankCandidates(state);
  const sorted = [...ranked].sort((a, b) => b.score - a.score);
  return {
    ranked,
    best: sorted[0]?.score ?? 0,
    worst: sorted[sorted.length - 1]?.score ?? 0,
  };
}

function bulletsForScored(state: GameState, action: PlayerAction): string[] {
  const bullets: string[] = [];
  switch (action.type) {
    case 'sell': {
      const sale = action.sales[0]?.sale;
      if (!sale) break;
      const tile = state.board[sale.city][sale.slot];
      if (!tile) break;
      const spec = tileSpec(tile.industry, tile.level);
      bullets.push(`${spec.vp} PV (ficha)`);
      bullets.push(`+${spec.incomeBump} ingresos al voltear`);
      bullets.push(`Cerveza ×${sale.beerNeeded}`);
      if (sale.merchantIdx != null) bullets.push('Puede activar bonus de comerciante');
      break;
    }
    case 'build': {
      const { option } = action;
      const spec = tileSpec(option.industry, option.level);
      bullets.push(`Coste ~£${option.totalCost}`);
      if (spec.vp > 0) bullets.push(`${spec.vp} PV al voltear`);
      if (spec.incomeBump > 0) bullets.push(`+${spec.incomeBump} ingresos futuros`);
      if (spec.linkVP > 0) bullets.push(`${spec.linkVP} PV por enlace al cierre de era`);
      if (spec.producesCoal) bullets.push(`Produce ${spec.producesCoal} carbón`);
      if (spec.producesBeer) bullets.push('Produce cerveza');
      break;
    }
    case 'develop': {
      const industry = action.industries[0];
      if (!industry) break;
      const track = state.players[activePlayer(state)].mat[industry];
      const level = track.findIndex((c) => c > 0) + 1;
      const plan = developCost(state, activePlayer(state), action.industries);
      bullets.push(`Retira ${industria(industry)} N${level} del mat`);
      if (plan && plan.marketCost > 0) bullets.push(`Hierro/mercado ~£${plan.marketCost}`);
      else bullets.push('Usa hierro en mapa');
      bullets.push('Desbloquea fichas de nivel superior');
      break;
    }
    case 'network': {
      bullets.push(`Coste ~£${action.option.totalCost}`);
      if (state.era === 'canal') bullets.push('£3 — abre rutas y mercado');
      else bullets.push('£5 + carbón — enlaces puntúan al cierre');
      bullets.push('Mejora acceso a recursos y ventas');
      break;
    }
    default:
      break;
  }
  return bullets.slice(0, 4);
}

/** Numeric sell vs build vs develop comparison for training bar. */
export function numericForkCompare(state: GameState, cardIdx?: number | null): NumericForkLine[] {
  const { ranked, best, worst } = rankedSpread(state);
  const types: Array<'sell' | 'build' | 'develop' | 'network'> = ['sell', 'build', 'develop', 'network'];
  const lines: NumericForkLine[] = [];

  for (const type of types) {
    const pool = ranked.filter((c) => {
      if (c.action.type !== type) return false;
      if (type === 'build' && cardIdx != null) return c.action.cardIdx === cardIdx;
      return true;
    });
    const top = pool.sort((a, b) => b.score - a.score)[0];
    if (!top) continue;
    lines.push({
      action: type,
      label: describeAction(state, top.action).split(':')[0] ?? type,
      pct: scoreToQualityPct(top.score, best, worst),
      bullets: bulletsForScored(state, top.action),
    });
  }

  return lines.sort((a, b) => b.pct - a.pct);
}

/** Short one-liner comparing top sell vs top build. */
export function numericForkSummary(lines: NumericForkLine[]): string | null {
  const sell = lines.find((l) => l.action === 'sell');
  const build = lines.find((l) => l.action === 'build');
  const dev = lines.find((l) => l.action === 'develop');
  if (!sell || !build) return null;
  if (sell.pct > build.pct + 10) {
    const b = sell.bullets.slice(0, 2).join(', ');
    return `Vender gana ahora (${b}).`;
  }
  if (dev && dev.pct > build.pct + 8) {
    return `Desarrollar (${dev.bullets[0]}) prepara más que otro N1.`;
  }
  if (build.pct > sell.pct + 10) {
    return `Construir (${build.bullets.slice(0, 2).join(', ')}) refuerza tablero.`;
  }
  return null;
}
