import { playerLinksPlaced } from '../links';
import { legalBuilds, legalDevelops, legalNetworks, legalSells } from '../options';
import { HUMAN, type GameState } from '../state';
import { trainingScenarioMeta } from './scenarios';

export type ScenarioStatus = 'pending' | 'on-track' | 'completed' | 'missed';

export interface ScenarioProgress {
  status: ScenarioStatus;
  headline: string;
  detail: string;
  progressPct: number;
}

function tileFlipped(state: GameState, city: keyof typeof state.board, slot: number): boolean {
  return state.board[city][slot]?.owner === HUMAN && state.board[city][slot]?.flipped === true;
}

function humanLinkCount(state: GameState): number {
  return playerLinksPlaced(state, HUMAN);
}

function humanBuiltIn(state: GameState, city: string): boolean {
  return state.board[city as keyof typeof state.board]?.some((t) => t?.owner === HUMAN) ?? false;
}

function evaluateCanalCountdown(state: GameState): ScenarioProgress {
  const cottonSold = tileFlipped(state, 'walsall', 1);
  const coalSold = tileFlipped(state, 'dudley', 0);
  if (cottonSold || coalSold) {
    return {
      status: 'completed',
      headline: 'Objetivo logrado',
      detail: 'Volteaste o desarrollaste antes del fin de era Canal.',
      progressPct: 100,
    };
  }
  if (legalSells(state).length > 0 || legalDevelops(state).length > 0) {
    return {
      status: 'on-track',
      headline: 'Urgente: era Canal',
      detail: 'Tienes venta o desarrollo legal — úsalo antes de que desaparezcan las fichas N1.',
      progressPct: 55,
    };
  }
  return {
    status: 'pending',
    headline: 'Industrias en riesgo',
    detail: 'Busca conexión a comerciante o hierro para desarrollar minas/algodón de una sola era.',
    progressPct: 25,
  };
}

function evaluateSellOrBuild(state: GameState): ScenarioProgress {
  if (tileFlipped(state, 'worcester', 0)) {
    return {
      status: 'completed',
      headline: 'Venta ejecutada',
      detail: 'Volteaste algodón en Worcester — buena línea cuando la venta financia el tempo.',
      progressPct: 100,
    };
  }
  if (humanBuiltIn(state, 'dudley') || humanBuiltIn(state, 'coventry')) {
    return {
      status: 'completed',
      headline: 'Expansión construida',
      detail: 'Elegiste construir — válido si el PV futuro supera la venta inmediata.',
      progressPct: 85,
    };
  }
  if (legalSells(state).length > 0) {
    return {
      status: 'on-track',
      headline: 'Dilema activo',
      detail: 'Puedes vender algodón ahora o construir con la carta de ubicación/industria.',
      progressPct: 50,
    };
  }
  return {
    status: 'pending',
    headline: 'Evalúa venta vs build',
    detail: trainingScenarioMeta('sell-or-build').objective,
    progressPct: 20,
  };
}

function evaluateBeerScarcity(state: GameState): ScenarioProgress {
  if (tileFlipped(state, 'stafford', 0) || tileFlipped(state, 'worcester', 0)) {
    return {
      status: 'completed',
      headline: 'Venta con 1 cerveza',
      detail: 'Volteaste un edificio gastando cerveza escasa — objetivo del escenario.',
      progressPct: 100,
    };
  }
  if (legalSells(state).length >= 2) {
    return {
      status: 'on-track',
      headline: 'Elige la mejor venta',
      detail: 'Solo hay 1 cerveza propia: compara cerámica vs algodón antes de confirmar.',
      progressPct: 60,
    };
  }
  return {
    status: 'pending',
    headline: 'Cerveza escasa',
    detail: 'No gastes la cerveza en una venta débil si otra opción da más ingresos/PV.',
    progressPct: 30,
  };
}

function evaluateRailFlipRace(state: GameState): ScenarioProgress {
  const matDeveloped = state.players[HUMAN].mat.coal[0] < 2;
  const soldMore = tileFlipped(state, 'walsall', 1);
  if (matDeveloped || soldMore) {
    return {
      status: 'completed',
      headline: 'Decisión tomada',
      detail: matDeveloped
        ? 'Desarrollaste el tapete — preparas niveles altos de carbón.'
        : 'Volteaste industria adicional en era ferrocarril.',
      progressPct: 100,
    };
  }
  if (legalDevelops(state).some((d) => d.industries.includes('coal')) || legalSells(state).length > 0) {
    return {
      status: 'on-track',
      headline: 'Vender vs desarrollar',
      detail: 'Carbón volteado en mapa o retirar N1 del mat: elige según tu plan de ingresos.',
      progressPct: 55,
    };
  }
  return {
    status: 'pending',
    headline: 'Era ferrocarril',
    detail: trainingScenarioMeta('rail-flip-race').objective,
    progressPct: 25,
  };
}

function evaluatePassTempo(state: GameState): ScenarioProgress {
  return evaluateSellOrBuild(state);
}

function evaluateNetworkTiming(state: GameState): ScenarioProgress {
  if (humanLinkCount(state) >= 3) {
    return {
      status: 'completed',
      headline: 'Enlace colocado',
      detail: 'Extendiste la red — deberías haber abierto nuevas rutas al mercado.',
      progressPct: 100,
    };
  }
  if (legalNetworks(state).length > 0) {
    return {
      status: 'on-track',
      headline: 'Ventana de enlace',
      detail: 'Hay enlaces legales baratos que desbloquean mercado o ventas pronto.',
      progressPct: 65,
    };
  }
  return {
    status: 'pending',
    headline: 'Prioriza la red',
    detail: 'Sin enlace nuevo pierdes tempo frente a la IA en este escenario.',
    progressPct: 30,
  };
}

function evaluateDevelopMat(state: GameState): ScenarioProgress {
  if (state.players[HUMAN].mat.coal[0] === 0) {
    return {
      status: 'completed',
      headline: 'Tapete desarrollado',
      detail: 'Retiraste carbón N1 del mat — ya puedes apuntar a niveles superiores.',
      progressPct: 100,
    };
  }
  if (legalDevelops(state).some((d) => d.industries.includes('coal'))) {
    return {
      status: 'on-track',
      headline: 'Desarrollar ahora',
      detail: 'Desarrollar carbón suele ser mejor que otro N1 en mapa aquí.',
      progressPct: 70,
    };
  }
  return evaluateRailFlipRace(state);
}

function evaluateWildSpot(state: GameState): ScenarioProgress {
  if (humanBuiltIn(state, 'birmingham')) {
    return {
      status: 'completed',
      headline: 'Comodín bien usado',
      detail: 'Construiste en Birmingham con el wild — casilla premium.',
      progressPct: 100,
    };
  }
  if (legalBuilds(state).some((b) => b.option.city === 'birmingham')) {
    return {
      status: 'on-track',
      headline: 'Wild disponible',
      detail: 'Birmingham es el hueco fuerte; evita gastarlo en ciudad secundaria.',
      progressPct: 60,
    };
  }
  return {
    status: 'pending',
    headline: 'Comodín en mano',
    detail: trainingScenarioMeta('wild-spot').objective,
    progressPct: 25,
  };
}

/** Auto-check training scenario objective from board state. */
export function evaluateScenarioProgress(state: GameState): ScenarioProgress | null {
  const id = state.trainingScenario;
  if (!id) return null;

  switch (id) {
    case 'canal-countdown':
      return evaluateCanalCountdown(state);
    case 'sell-or-build':
      return evaluateSellOrBuild(state);
    case 'beer-scarcity':
      return evaluateBeerScarcity(state);
    case 'rail-flip-race':
      return evaluateRailFlipRace(state);
    case 'pass-tempo':
      return evaluatePassTempo(state);
    case 'network-timing':
      return evaluateNetworkTiming(state);
    case 'develop-mat':
      return evaluateDevelopMat(state);
    case 'wild-spot':
      return evaluateWildSpot(state);
  }
}
