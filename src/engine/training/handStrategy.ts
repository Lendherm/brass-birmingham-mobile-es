import { describeAction, reasonsForAction } from '../ai/coach';
import { rankCandidates } from '../ai/evaluate';
import { buildWhy, sellWhyFromState } from '../actionExplain';
import { buildBlockReason } from '../buildExplain';
import { connectedToMarket } from '../connectivity';
import { CITIES } from '../data/board';
import { tileSpec } from '../data/industries';
import { playerLinksPlaced } from '../links';
import { legalBuilds, legalDevelops, legalNetworks, legalSells, scoutAllowed } from '../options';
import { activePlayer, type Card, type GameState } from '../state';
import { eraNombre, industria } from '../messages';
import type { IndustryType } from '../types';

function scoreToQualityPct(score: number, best: number, worst: number): number {
  const range = Math.max(6, best - worst);
  return Math.min(100, Math.max(15, Math.round(28 + ((score - worst) / range) * 72)));
}

export interface StrategyTheme {
  id: string;
  title: string;
  advice: string;
}

export interface CardStrategyLine {
  cardIdx: number;
  cardLabel: string;
  play: string;
  strategy: string;
  pct: number | null;
}

export interface HandStrategyGuide {
  boardSummary: string;
  themes: StrategyTheme[];
  cardLines: CardStrategyLine[];
}

const INDUSTRIES: IndustryType[] = ['cotton', 'goods', 'pottery', 'coal', 'iron', 'brewery'];

function cardLabel(card: Card): string {
  switch (card.kind) {
    case 'location':
      return CITIES[card.city].name;
    case 'industry':
      return card.industries.map((i) => industria(i)).join('/');
    case 'wildLocation':
      return 'Comodín ubicación';
    case 'wildIndustry':
      return 'Comodín industria';
  }
}

function countTiles(state: GameState, player: number): Record<IndustryType, { total: number; flipped: number }> {
  const counts = Object.fromEntries(INDUSTRIES.map((i) => [i, { total: 0, flipped: 0 }])) as Record<
    IndustryType,
    { total: number; flipped: number }
  >;
  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (tile?.owner !== player) continue;
      counts[tile.industry].total++;
      if (tile.flipped) counts[tile.industry].flipped++;
    }
  }
  return counts;
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

function bestActionForCard(state: GameState, cardIdx: number) {
  const { ranked, best, worst } = rankedSpread(state);
  const pool = ranked.filter((c) => c.action.cardIdx === cardIdx && c.action.type !== 'pass');
  const top = pool.sort((a, b) => b.score - a.score)[0];
  if (!top) return null;
  return { scored: top, pct: scoreToQualityPct(top.score, best, worst) };
}

function blockedCardAdvice(state: GameState, card: Card, cardIdx: number): string {
  const player = activePlayer(state);
  const hand = state.players[player].hand;

  if (card.kind === 'location') {
    const city = card.city;
    if (!connectedToMarket(state, city) && !legalBuilds(state).some((b) => b.cardIdx === cardIdx)) {
      return `Conecta ${CITIES[city].name} a tu red (enlace) antes de construir ahí.`;
    }
    for (const industry of INDUSTRIES) {
      const reason = buildBlockReason(state, card, city, industry);
      if (reason) return `${CITIES[city].name}: ${reason}.`;
    }
  }

  if (card.kind === 'industry') {
    const builds = legalBuilds(state).filter((b) => b.cardIdx === cardIdx);
    if (builds.length === 0) {
      return 'Necesitas carta de esa ciudad conectada a tu red, o un comodín de ubicación.';
    }
  }

  if (card.kind === 'wildLocation') {
    const net = legalNetworks(state);
    if (net.length > 0) {
      return 'Úsalo en ciudad premium (Birmingham, enlace a mercado) o donde falte industria clave.';
    }
    return 'Reserva el comodín para la ciudad que abra mercado o bloquee al rival.';
  }

  if (card.kind === 'wildIndustry') {
    return 'Gástalo en industria que falte en tu mat (cerámica, bienes) o suba ingresos/PV.';
  }

  if (hand.length > 6) {
    return 'Mano llena: considera explorar o pasar cartas muertas.';
  }

  return 'Guarda la carta para cuando tengas red o recursos (carbón/cerveza).';
}

function strategyNarrativeForAction(state: GameState, card: Card, cardIdx: number): string {
  const match = bestActionForCard(state, cardIdx);
  if (!match) return blockedCardAdvice(state, card, cardIdx);

  const player = activePlayer(state);
  const { scored } = match;
  const action = scored.action;
  const reasons = reasonsForAction(state, scored, player);
  if (reasons[0]) return reasons[0];

  switch (action.type) {
    case 'build': {
      const b = legalBuilds(state).find(
        (x) =>
          x.cardIdx === cardIdx &&
          x.option.city === action.option.city &&
          x.option.industry === action.option.industry &&
          x.option.slot === action.option.slot,
      );
      return b ? buildWhy(b) : 'Refuerza tablero en ciudad conectada.';
    }
    case 'sell': {
      const sale = action.sales[0]?.sale;
      if (!sale) return 'Venta rentable: sube ingresos y libera mat.';
      const sell = legalSells(state).find(
        (s) => s.cardIdx === cardIdx && s.sale.city === sale.city && s.sale.slot === sale.slot,
      );
      return sell ? sellWhyFromState(state, sell) : 'Voltea industria conectada al comerciante.';
    }
    case 'network':
      return 'Abre rutas hacia mercado, minas o ciudades de tus cartas de ubicación.';
    case 'develop':
      return 'Prepara niveles altos antes de construir otro N1 en era Canal.';
    case 'loan':
      return 'Solo si el efectivo desbloquea construcción o enlace clave este turno.';
    case 'scout':
      return 'Mejora mano si varias cartas no encajan con tu tablero actual.';
    default:
      return 'Encaja con tu plan de medio plazo.';
  }
}

function cardStrategyLine(state: GameState, cardIdx: number): CardStrategyLine {
  const player = activePlayer(state);
  const card = state.players[player].hand[cardIdx];
  if (!card) {
    return { cardIdx, cardLabel: '?', play: '—', strategy: '', pct: null };
  }

  const match = bestActionForCard(state, cardIdx);
  if (match) {
    return {
      cardIdx,
      cardLabel: cardLabel(card),
      play: describeAction(state, match.scored.action),
      strategy: strategyNarrativeForAction(state, card, cardIdx),
      pct: match.pct,
    };
  }

  return {
    cardIdx,
    cardLabel: cardLabel(card),
    play: 'Sin jugada legal',
    strategy: blockedCardAdvice(state, card, cardIdx),
    pct: null,
  };
}

function buildBoardSummary(state: GameState, player: number): string {
  const counts = countTiles(state, player);
  const built = INDUSTRIES.filter((i) => counts[i].total > 0).map((i) => {
    const c = counts[i];
    const flip = c.flipped > 0 ? ` (${c.flipped} volteada${c.flipped > 1 ? 's' : ''})` : '';
    return `${industria(i)} ×${c.total}${flip}`;
  });
  const links = playerLinksPlaced(state, player);
  const hand = state.players[player].hand.map((c) => cardLabel(c)).join(', ');
  const sells = legalSells(state).length;
  const parts = [
    built.length ? `Construcciones: ${built.join(', ')}` : 'Sin industrias propias aún',
    `Red: ${links} enlace${links === 1 ? '' : 's'}`,
    `Mano: ${hand}`,
  ];
  if (sells > 0) parts.push(`${sells} venta${sells === 1 ? '' : 's'} posible${sells === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

function strategyThemes(state: GameState): StrategyTheme[] {
  const player = activePlayer(state);
  const themes: StrategyTheme[] = [];
  const counts = countTiles(state, player);
  const sells = legalSells(state);
  const builds = legalBuilds(state);
  const networks = legalNetworks(state);
  const develops = legalDevelops(state);
  const hand = state.players[player].hand;

  if (sells.length >= 1) {
    themes.push({
      id: 'sell-window',
      title: 'Vender ahora',
      advice:
        sells.length >= 2
          ? `Tienes ${sells.length} ventas legales. Voltear una sube ingresos ya; comparar cuál da más PV/£ antes de construir otro N1.`
          : 'Tienes venta legal: sube ingresos al instante y libera fichas del mat. Suele ganar a otro N1 repetido.',
    });
  }

  const core = counts.coal.total + counts.brewery.total + counts.cotton.total;
  if (core >= 3 && sells.length === 0) {
    themes.push({
      id: 'break-loop',
      title: 'Romper el bucle mina/cerveza/algodón',
      advice:
        'Ya tienes la cadena básica. El salto pro es vender algodón conectado, desarrollar mat o entrar en cerámica/bienes — no otro N1 igual.',
    });
  }

  const sellableBuilds = builds.filter((b) => b.option.industry === 'goods' || b.option.industry === 'pottery' || b.option.industry === 'cotton');
  if (
    scoutAllowed(state) &&
    sellableBuilds.length === 0 &&
    counts.coal.total + counts.brewery.total >= 1
  ) {
    themes.unshift({
      id: 'scout-unlock',
      title: 'Explorar para desbloquear',
      advice:
        'Tu mano no encaja con manufacturas/cerámica ahora. Explora → roba carta de industria o ubicación → enlaza → construye. Mira la pestaña Plan del coach.',
    });
  }

  if (networks.length >= 1 && builds.some((b) => !connectedToMarket(state, b.option.city))) {
    themes.push({
      id: 'connect-first',
      title: 'Conectar antes de construir',
      advice:
        'Tienes cartas de ciudad sin acceso a mercado. Coloca red hacia comerciante o minas antes de gastar cartas de ubicación.',
    });
  }

  if (develops.length >= 1 && (state.era === 'canal' || counts.cotton.total + counts.coal.total >= 2)) {
    themes.push({
      id: 'develop-path',
      title: 'Desarrollar mat',
      advice:
        'Desarrollar retira N1 y abre niveles altos. En Canal es urgente antes de que desaparezcan fichas de una sola era.',
    });
  }

  if (state.era === 'canal' && state.actionsLeft <= 4) {
    themes.push({
      id: 'canal-clock',
      title: `Cuenta atrás ${eraNombre('canal')}`,
      advice: 'Quedan pocas rondas: prioriza voltear, desarrollar o vender N1 conectados antes de perderlos al cambio de era.',
    });
  }

  if (hand.some((c) => c.kind === 'wildLocation' || c.kind === 'wildIndustry')) {
    themes.push({
      id: 'wild-premium',
      title: 'Comodín estratégico',
      advice:
        'No gastes wild en hueco barato. Úsalo en Birmingham, enlace a mercado, o industria que falte en tu mat (cerámica/bienes).',
    });
  }

  const locationCards = hand.filter((c): c is Extract<Card, { kind: 'location' }> => c.kind === 'location');
  for (const loc of locationCards) {
    const cityBuilds = builds.filter((b) => b.option.city === loc.city);
    if (cityBuilds.length > 0 && connectedToMarket(state, loc.city)) {
      const top = cityBuilds.sort((a, b) => {
        const sa = tileSpec(a.option.industry, a.option.level);
        const sb = tileSpec(b.option.industry, b.option.level);
        return sb.linkVP + sb.incomeBump + sb.vp - (sa.linkVP + sa.incomeBump + sa.vp);
      })[0]!;
      themes.push({
        id: `city-${loc.city}`,
        title: `Carta ${CITIES[loc.city].name}`,
        advice: `Puedes construir ${industria(top.option.industry)} N${top.option.level} en ${CITIES[loc.city].name} (${buildWhy(top).replace(/\.$/, '')}).`,
      });
      break;
    }
  }

  if (themes.length === 0) {
    themes.push({
      id: 'tempo',
      title: 'Tempo de cartas',
      advice:
        'Juega cartas que encadenen acciones: red → mina conectada → cerveza → venta. Evita pasar si puedes explorar o enlazar.',
    });
  }

  return themes.slice(0, 4);
}

/** Strategic themes + per-card lines from hand and board. */
export function buildHandStrategyGuide(state: GameState, focusCardIdx?: number | null): HandStrategyGuide {
  const player = activePlayer(state);
  const hand = state.players[player].hand;
  let cardLines = hand.map((_, i) => cardStrategyLine(state, i));

  if (focusCardIdx != null && focusCardIdx >= 0 && focusCardIdx < cardLines.length) {
    const focused = cardLines[focusCardIdx]!;
    cardLines = [focused, ...cardLines.filter((_, i) => i !== focusCardIdx)];
  }

  return {
    boardSummary: buildBoardSummary(state, player),
    themes: strategyThemes(state),
    cardLines,
  };
}
