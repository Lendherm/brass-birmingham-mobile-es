import { playerLinksPlaced } from '../links';
import { activePlayer, HUMAN, type GameState } from '../state';
import type { IndustryType, PlayerId } from '../types';
import { legalSells } from '../options';

export type PlayPatternId =
  | 'coal-brewery-loop'
  | 'network-heavy'
  | 'sell-neglect'
  | 'network-streak'
  | 'build-loop'
  | 'pass-streak';

export interface PlayPattern {
  id: PlayPatternId;
  title: string;
  message: string;
  pivot: string;
}

const INDUSTRIES: IndustryType[] = ['cotton', 'goods', 'pottery', 'coal', 'iron', 'brewery'];

function countTilesByIndustry(state: GameState, player: PlayerId): Record<IndustryType, number> {
  const counts = Object.fromEntries(INDUSTRIES.map((i) => [i, 0])) as Record<IndustryType, number>;
  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (tile?.owner === player) counts[tile.industry]++;
    }
  }
  return counts;
}

function totalTiles(counts: Record<IndustryType, number>): number {
  return INDUSTRIES.reduce((sum, i) => sum + counts[i], 0);
}

/** Detect repetitive strategic patterns from board shape (not move log). */
export function detectPlayPattern(state: GameState, player: PlayerId = activePlayer(state)): PlayPattern | null {
  const counts = countTilesByIndustry(state, player);
  const total = totalTiles(counts);
  if (total < 3) return null;

  const links = playerLinksPlaced(state, player);
  const coreLoop = counts.coal + counts.brewery + counts.cotton;
  const coreRatio = coreLoop / total;

  if (coreRatio >= 0.65 && counts.coal >= 1 && counts.brewery >= 1 && counts.cotton >= 1) {
    return {
      id: 'coal-brewery-loop',
      title: 'Patrón: mina + cerveza + algodón',
      message:
        'Tu tablero repite el bucle clásico (carbón para enlaces, cerveza para ventas, algodón en mapa). Funciona al inicio, pero estanca PV a medio plazo.',
      pivot:
        'Prueba voltear algodón/cerveza cuando tengas conexión a comerciante, entrar en cerámica/bienes, o desarrollar antes de seguir construyendo N1.',
    };
  }

  if (links >= 3 && total <= links + 1) {
    return {
      id: 'network-heavy',
      title: 'Patrón: mucha red, poca industria',
      message: 'Has invertido muchas fichas de enlace respecto a industrias colocadas. La red abre opciones, pero no suma PV por sí sola.',
      pivot: 'Prioriza construir o vender en ciudades ya conectadas antes de gastar más enlaces.',
    };
  }

  const sells = legalSells(state).filter((s) => {
    const tile = state.board[s.sale.city][s.sale.slot];
    return tile?.owner === player;
  });
  const flipReady = sells.length;
  if (flipReady >= 2 && counts.cotton + counts.brewery >= 2 && player === HUMAN) {
    const recentBuildHeavy = counts.coal + counts.cotton >= 3 && flipReady >= 2;
    if (recentBuildHeavy) {
      return {
        id: 'sell-neglect',
        title: 'Oportunidad: ventas disponibles',
        message: `Tienes ${flipReady} ventas legales ahora. Construir más sin voltear deja ingresos y PV sobre la mesa.`,
        pivot: 'Compara Vender vs Construir abajo: a veces una venta fuerte financia el siguiente salto de nivel.',
      };
    }
  }

  return null;
}
