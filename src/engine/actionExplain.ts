import type { CityId, IndustryType, MerchantId } from './types';
import { CITIES, LINKS, MERCHANTS } from './data/board';
import { tileSpec } from './data/industries';
import { activePlayer, type GameState } from './state';
import {
  canLoan,
  legalBuilds,
  legalDevelops,
  legalNetworks,
  legalSells,
  scoutAllowed,
  type BuildChoice,
  type NetworkChoice,
  type SellChoice,
} from './options';
import { developCost } from './actions';

export type ActionKind = 'build' | 'network' | 'sell' | 'develop' | 'loan' | 'scout' | 'pass';

function locationLabel(id: string): string {
  if (id in CITIES) return CITIES[id as CityId].name;
  if (id in MERCHANTS) return MERCHANTS[id as MerchantId].name;
  return id;
}

/** Por qué conviene o cuándo usar esta acción (texto introductorio). */
export function actionIntroHint(state: GameState, action: ActionKind): string {
  const player = activePlayer(state);
  const money = state.players[player].money;

  switch (action) {
    case 'build':
      if (legalBuilds(state).length === 0) {
        return 'Construir coloca industrias en el mapa para ganar PV, ingresos y conectar recursos.';
      }
      return 'Construir expande tu red, sube ingresos y prepara ventas futuras. Las casillas resaltadas son legales ahora.';
    case 'network':
      if (legalNetworks(state).length === 0) {
        return 'Red conecta ciudades con tus fichas; en era canal cuesta £3, en ferrocarril £5 + carbón.';
      }
      return 'Red enlaza ciudades para mover carbón/cerveza y sumar PV por enlace. Toca un enlace resaltado o elige abajo.';
    case 'sell':
      if (legalSells(state).length === 0) {
        return 'Vender voltea edificios conectados a comerciantes: gastas cerveza y subes ingresos al instante.';
      }
      return 'Vender convierte industrias en ingresos (y a veces PV). Necesitas cerveza y conexión al comerciante.';
    case 'develop':
      if (legalDevelops(state).length === 0) {
        return 'Desarrollar retira fichas N1 de tu mat para liberar niveles superiores (era ferrocarril).';
      }
      return 'Desarrollar quita fichas viejas de tu mat y cuesta hierro; útil antes de construir niveles altos.';
    case 'loan':
      return canLoan(state)
        ? `Préstamo: +£30 ahora, pero bajas 3 espacios de ingresos (tienes £${money}).`
        : 'Préstamo: +£30, −3 espacios de ingresos. Solo si te quedan cartas de préstamo.';
    case 'scout':
      return scoutAllowed(state)
        ? 'Explorar descarta 3 cartas y roba 3 nuevas: busca cartas de la ciudad o industria que necesitas.'
        : 'Explorar cambia tu mano descartando 3 y robando 3 del mazo.';
    case 'pass':
      return 'Pasar descarta una carta sin efecto; útil cuando no hay jugada rentable.';
    default:
      return '';
  }
}

export function buildWhy(b: BuildChoice): string {
  const spec = tileSpec(b.option.industry, b.option.level);
  const parts: string[] = [];
  if (spec.linkVP > 0) parts.push(`+${spec.linkVP} PV de enlace`);
  if (spec.incomeBump > 0) parts.push(`+${spec.incomeBump} ingresos`);
  if (spec.vp > 0) parts.push(`${spec.vp} PV al vender`);
  if (b.option.overbuild) parts.push('reemplaza edificio existente');
  if (parts.length === 0) return 'Refuerza presencia en el mapa.';
  return parts.join(', ') + '.';
}

export function networkWhy(n: NetworkChoice): string {
  const link = LINKS.find((l) => l.id === n.option.linkIds[0]);
  if (!link) return 'Conecta ciudades para recursos y PV.';
  const ends = link.endpoints.map(locationLabel).join('–');
  return `Une ${ends}: mueve recursos y suma PV por enlace.`;
}

export function sellWhyFromState(state: GameState, s: SellChoice): string {
  const t = state.board[s.sale.city][s.sale.slot];
  if (!t) return `Voltea en ${CITIES[s.sale.city].name} (cerveza ×${s.sale.beerNeeded}).`;
  const spec = tileSpec(t.industry, t.level);
  const parts = [`Voltea en ${CITIES[s.sale.city].name}`];
  if (spec.incomeBump > 0) parts.push(`+${spec.incomeBump} ingresos`);
  if (spec.vp > 0) parts.push(`${spec.vp} PV`);
  parts.push(`cerveza ×${s.sale.beerNeeded}`);
  return parts.join(' · ') + '.';
}

export function developWhy(state: GameState, industry: IndustryType, industryLabel?: string): string {
  const player = activePlayer(state);
  const name = industryLabel ?? industry;
  const track = state.players[player].mat[industry];
  const level = track.findIndex((c) => c > 0) + 1;
  const plan = developCost(state, player, [industry]);
  const iron = plan ? `, hierro ×${plan.fromMarket + plan.takes.reduce((n, t) => n + t.count, 0)}` : '';
  return `Retira ${name} N${level} de tu mat${iron} para construir niveles superiores.`;
}

function bestBuild(state: GameState): BuildChoice | null {
  const builds = legalBuilds(state);
  if (builds.length === 0) return null;
  return [...builds].sort((a, b) => buildScore(b) - buildScore(a))[0];
}

function buildScore(b: BuildChoice): number {
  const spec = tileSpec(b.option.industry, b.option.level);
  return spec.linkVP * 2 + spec.incomeBump + (spec.vp > 0 ? 1 : 0);
}

/** Mejor motivo por acción (panel de sugerencias). */
export function topActionReason(
  state: GameState,
  action: ActionKind,
  labelFn: (city: CityId, industry: IndustryType) => { city: string; industry: string },
): string {
  switch (action) {
    case 'build': {
      const b = bestBuild(state);
      if (!b) return 'No hay construcciones legales ahora.';
      const labels = labelFn(b.option.city, b.option.industry);
      return `${labels.city}: ${buildWhy(b)}`;
    }
    case 'network': {
      const nets = legalNetworks(state);
      if (nets.length === 0) return 'No hay enlaces legales.';
      return networkWhy(nets[0]);
    }
    case 'sell': {
      const sells = legalSells(state);
      if (sells.length === 0) return 'No hay ventas legales.';
      return sellWhyFromState(state, sells[0]);
    }
    case 'develop': {
      const devs = legalDevelops(state);
      if (devs.length === 0) return 'No puedes desarrollar ahora.';
      return developWhy(state, devs[0].industries[0]);
    }
    case 'loan':
    case 'scout':
    case 'pass':
      return actionIntroHint(state, action);
    default:
      return '';
  }
}
