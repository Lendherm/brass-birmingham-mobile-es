import type { CityId, IndustryType } from './types';
import { CITIES, LINKS } from './data/board';
import { tileSpec } from './data/industries';
import { linkTouchesNetwork, networkSingleOption, sellableBuildings } from './actions';
import { connectedMerchants, playerNetwork } from './connectivity';
import { playerLinksRemaining } from './links';
import { planBeerForSale } from './options';
import { developCost } from './actions';
import { activePlayer, isPayingPlayer, type GameState } from './state';
import { eraNombre, industria } from './messages';
import { linkLabel } from '../i18n/es';
import { planCoal, planIron } from './resources';

/** Short reason why a link cannot be placed (null = legal). */
export function networkBlockReason(state: GameState, linkId: string): string | null {
  const player = activePlayer(state);
  if (playerLinksRemaining(state, player) <= 0) return 'Sin fichas de enlace';
  const link = LINKS.find((l) => l.id === linkId);
  if (!link) return 'Enlace desconocido';
  if (state.links[linkId] != null) return 'Enlace ya colocado';
  if (state.era === 'canal' && !link.canal) return 'No disponible en era canal';
  if (state.era === 'rail' && !link.rail) return 'No disponible en era ferrocarril';
  if (!linkTouchesNetwork(state, player, linkId)) return 'No toca tu red';
  if (state.era === 'canal' && isPayingPlayer(state, player) && state.players[player].money < 3) {
    return 'Dinero insuficiente';
  }
  if (state.era === 'rail') {
    const option = networkSingleOption(state, player, linkId);
    if (!option) return 'Carbón insuficiente';
  }
  return networkSingleOption(state, player, linkId) ? null : 'No se puede enlazar';
}

/** Detailed Spanish explanation for training mode. */
export function networkBlockReasonDetailed(state: GameState, linkId: string): string {
  const short = networkBlockReason(state, linkId);
  if (!short) return 'Enlace legal: toca para colocar tu ficha de red.';

  const player = activePlayer(state);
  const link = LINKS.find((l) => l.id === linkId);
  const ends = link ? link.endpoints.map((e) => CITIES[e as CityId]?.name ?? e).join(' ↔ ') : linkId;

  switch (short) {
    case 'Sin fichas de enlace':
      return `Ya gastaste todas tus fichas de enlace (${playerLinksRemaining(state, player)} restantes).`;
    case 'Enlace ya colocado':
      return `${linkLabel(linkId)} ya tiene ficha; otro jugador o tú lo ocupaste antes.`;
    case 'No disponible en era canal':
      return `${linkLabel(linkId)} solo existe en era ferrocarril. En ${eraNombre('canal')} no se puede colocar.`;
    case 'No disponible en era ferrocarril':
      return `${linkLabel(linkId)} no aplica en era ferrocarril (mapa distinto).`;
    case 'No toca tu red': {
      const net = playerNetwork(state, player);
      if (net.size === 0) return 'Sin red aún: el primer enlace puede ir donde quieras si cumple la era.';
      return `${linkLabel(linkId)} (${ends}) no toca ninguna ciudad/comerciante de tu red. Debes extender desde donde ya tienes industria o enlace propio — estar “cerca” visualmente no basta si falta un eslabón intermedio.`;
    }
    case 'Dinero insuficiente':
      return `Enlace en era ${eraNombre('canal')}: cuesta £3 y tienes £${state.players[player].money}.`;
    case 'Carbón insuficiente': {
      if (!link) return short;
      const plans = link.endpoints.map((end) => planCoal(state, end, 1, player));
      const anyMarket = plans.some((p) => p.ok && p.fromMarket > 0);
      const noneOk = plans.every((p) => !p.ok);
      if (noneOk) {
        return `Ferrocarril: ${linkLabel(linkId)} cuesta £5 + 1 carbón desde un extremo (${ends}). Ningún extremo alcanza minas ni mercado.`;
      }
      if (anyMarket) {
        return `Ferrocarril: falta carbón alcanzable en ${ends}. Conecta una mina activa o el mercado antes de enlazar.`;
      }
      return `Ferrocarril: cuesta £5 + carbón; no puedes pagar el total (dinero o cubos).`;
    }
    default:
      return short;
  }
}

/** Why SELL action has zero legal options. */
export function sellActionBlockSummary(state: GameState): string {
  const player = activePlayer(state);
  const buildings = sellableBuildings(state, player);
  if (buildings.length === 0) {
    const owned = countOwnedUnflipped(state, player);
    if (owned === 0) return 'No tienes industrias en el mapa para voltear.';
    const disconnected = countDisconnectedSellableIndustry(state, player);
    if (disconnected > 0) {
      return `Tienes ${disconnected} industria(s) vendible(s) pero sin conexión al comerciante correcto. Enlaza la ciudad al mercado antes de vender.`;
    }
    return 'Tus edificios no son vendibles (minas/hierro) o ya están volteados.';
  }
  const withoutBeer = buildings.filter((b) => planBeerForSale(state, b) === null);
  if (withoutBeer.length === buildings.length) {
    return `Hay ${buildings.length} edificio(s) conectados al comerciante, pero falta cerveza alcanzable (propia, rival en red, o comerciante).`;
  }
  return 'No hay ventas legales con tu mano actual.';
}

/** Why a specific building cannot be sold. */
export function sellBlockReasonDetailed(
  state: GameState,
  city: CityId,
  slot: number,
): string {
  const player = activePlayer(state);
  const tile = state.board[city][slot];
  if (!tile || tile.owner !== player) return 'No es tu edificio.';
  if (tile.flipped) return 'Ya está volteado.';
  const spec = tileSpec(tile.industry, tile.level);
  if (spec.beerToSell === undefined) {
    return `${industria(tile.industry)} N${tile.level} no se vende (recurso en mapa, no industria de venta).`;
  }
  const merchants = connectedMerchants(state, city);
  const buying = merchants.filter((m) => {
    const idx = state.merchants.findIndex((x) => x.id === m);
    if (idx < 0) return false;
    return state.merchants[idx].tiles.some((t) => t === 'any' || t === tile.industry);
  });
  if (buying.length === 0) {
    return `${CITIES[city].name} no conecta con un comerciante que compre ${industria(tile.industry)}. Necesitas enlace hasta el mercado.`;
  }
  const sale = sellableBuildings(state, player).find((s) => s.city === city && s.slot === slot);
  if (!sale) return 'Venta bloqueada por reglas de comerciante o conexión.';
  const beer = planBeerForSale(state, sale);
  if (beer) return `Venta legal: necesitas cerveza ×${sale.beerNeeded}.`;
  return `Falta cerveza ×${sale.beerNeeded} alcanzable para voltear ${industria(tile.industry)} en ${CITIES[city].name}. Construye/enlaza cervecería o usa cerveza del comerciante si aplica.`;
}

/** Why DEVELOP has no legal options. */
export function developActionBlockSummary(state: GameState): string {
  const player = activePlayer(state);
  const mat = state.players[player].mat;
  let hasLow = false;
  for (const industry of Object.keys(mat) as IndustryType[]) {
    const level = mat[industry].findIndex((c) => c > 0) + 1;
    if (level === 0) continue;
    hasLow = true;
    if (tileSpec(industry, level).canDevelop && developCost(state, player, [industry])) return '';
  }
  if (!hasLow) return 'Tu mat está vacío: no hay fichas N1 que retirar.';
  return 'Nada desarrollable ahora: industrias bloqueadas, sin hierro alcanzable, o sin dinero para mercado.';
}

/** Detailed develop block for one industry track. */
export function developBlockReasonDetailed(state: GameState, industry: IndustryType): string {
  const player = activePlayer(state);
  const track = state.players[player].mat[industry];
  const level = track.findIndex((c) => c > 0) + 1;
  if (level === 0) return `No te queda ${industria(industry)} en el mat.`;
  if (!tileSpec(industry, level).canDevelop) {
    return `${industria(industry)} N${level} no se puede desarrollar (solo ciertas industrias/niveles).`;
  }
  const plan = developCost(state, player, [industry]);
  if (plan) return `Desarrollar ${industria(industry)} N${level} es legal (cuesta hierro).`;
  const iron = planIron(state, 1, player);
  if (!iron.ok) return `Falta hierro para desarrollar ${industria(industry)} N${level}: no hay altos hornos ni mercado.`;
  if (isPayingPlayer(state, player) && iron.marketCost > state.players[player].money) {
    return `Desarrollar cuesta hierro de mercado (~£${iron.marketCost}) y solo tienes £${state.players[player].money}.`;
  }
  return `No puedes desarrollar ${industria(industry)} ahora.`;
}

function countOwnedUnflipped(state: GameState, player: number): number {
  let n = 0;
  for (const slots of Object.values(state.board)) {
    for (const t of slots) if (t?.owner === player && !t.flipped) n++;
  }
  return n;
}

function countDisconnectedSellableIndustry(state: GameState, player: number): number {
  let n = 0;
  for (const [cityId, slots] of Object.entries(state.board)) {
    for (const [slot, tile] of slots.entries()) {
      if (!tile || tile.owner !== player || tile.flipped) continue;
      const spec = tileSpec(tile.industry, tile.level);
      if (spec.beerToSell === undefined) continue;
      const merchants = connectedMerchants(state, cityId as CityId);
      const ok = merchants.some((m) => {
        const idx = state.merchants.findIndex((x) => x.id === m);
        return idx >= 0 && state.merchants[idx].tiles.some((t) => t === 'any' || t === tile.industry);
      });
      if (!ok) n++;
    }
  }
  return n;
}