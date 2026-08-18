import { buildBlockReason, buildBlockReasonDetailed } from '../buildExplain';
import {
  developActionBlockSummary,
  developBlockReasonDetailed,
  networkBlockReason,
  networkBlockReasonDetailed,
  sellActionBlockSummary,
  sellBlockReasonDetailed,
} from '../actionBlockExplain';
import { describeAction, reasonsForAction } from '../ai/coach';
import { actionKey } from '../ai/actionKey';
import { rankCandidates } from '../ai/evaluate';
import type { ActionKind } from '../actionExplain';
import { CITIES, LINKS } from '../data/board';
import { connectedToMarket, playerNetwork } from '../connectivity';
import { playerLinksRemaining } from '../links';
import { legalBuilds, legalDevelops, legalNetworks, legalSells, type BuildChoice, type SellChoice } from '../options';
import { activePlayer, HUMAN, type Card, type GameState } from '../state';
import { eraNombre, industria } from '../messages';
import { linkLabel } from '../../i18n/es';
import type { CityId, IndustryType } from '../types';
import type { CoachFeedback, CoachVerdict } from '../ai/coach';
import { detectPlayPattern } from './detectors';
import { drillOfferForPattern, type HabitDrillOffer } from './habitDrills';
import { evaluateScenarioProgress, type ScenarioProgress } from './scenarioValidation';
import { trainingScenarioMeta } from './scenarios';
import { buildTrainingPlan, type TrainingPlanStep } from './trainingPlan';
import { numericForkCompare, numericForkSummary, type NumericForkLine } from './actionCompare';
import { buildTrainingMapGuide, mapGuideForAction, type TrainingMapGuide } from './trainingMapGuide';
import { buildHandStrategyGuide, type CardStrategyLine, type StrategyTheme } from './handStrategy';
import { mergePatternDetection, type TurnHistoryEntry } from './turnHistory';

export interface TrainingPendingChoice {
  type: 'build' | 'network' | 'sell' | 'develop';
  build?: BuildChoice;
  linkId?: string;
  sell?: SellChoice;
  developIndustries?: IndustryType[];
}

export interface TrainingHintContext {
  action: ActionKind | null;
  cardIdx: number | null;
  inspectCity: CityId | null;
  focusedLinkId?: string | null;
  pendingChoice?: TrainingPendingChoice | null;
  turnLog?: TurnHistoryEntry[];
  flowError?: string | null;
}

export interface TrainingAlternative {
  label: string;
  pct: number;
}

export interface TrainingHint {
  kind: 'block' | 'pattern' | 'fork' | 'action' | 'era' | 'choice' | 'plan' | 'postmove' | 'scenario' | 'idle';
  headline: string;
  detail: string;
  qualityPct: number | null;
  bestLine: string | null;
  alternatives: TrainingAlternative[];
  planSteps?: TrainingPlanStep[];
  drillOffer?: HabitDrillOffer;
  scenarioProgress?: ScenarioProgress;
  numericCompare?: NumericForkLine[];
  mapGuide?: TrainingMapGuide | null;
  strategyThemes?: StrategyTheme[];
  cardStrategies?: CardStrategyLine[];
  boardSummary?: string;
  dismissible?: boolean;
}

export function scoreToQualityPct(score: number, best: number, worst: number): number {
  const range = Math.max(6, best - worst);
  return Math.min(100, Math.max(15, Math.round(28 + ((score - worst) / range) * 72)));
}

function rankedSpread(state: GameState) {
  const ranked = rankCandidates(state);
  const sorted = [...ranked].sort((a, b) => b.score - a.score);
  const best = sorted[0]?.score ?? 0;
  const worst = sorted[sorted.length - 1]?.score ?? best - 10;
  return { ranked, best, worst };
}

function bestByType(state: GameState) {
  const { ranked, best, worst } = rankedSpread(state);
  const byType = new Map<string, (typeof ranked)[0]>();
  for (const c of ranked) {
    const t = c.action.type;
    const prev = byType.get(t);
    if (!prev || c.score > prev.score) byType.set(t, c);
  }
  const alts: TrainingAlternative[] = [...byType.entries()]
    .filter(([t]) => t !== 'pass' && t !== 'scout')
    .map(([, c]) => ({
      label: describeAction(state, c.action).split(':')[0] ?? c.action.type,
      pct: scoreToQualityPct(c.score, best, worst),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);
  const top = [...byType.values()].sort((a, b) => b.score - a.score)[0];
  return { ranked, top, alts, best, worst };
}

function qualityForActionKey(state: GameState, key: string): number | null {
  const { ranked, best, worst } = rankedSpread(state);
  const match = ranked.find((c) => actionKey(c.action) === key);
  if (!match) return null;
  return scoreToQualityPct(match.score, best, worst);
}

function eraHint(state: GameState): TrainingHint | null {
  if (state.actionsLeft > 2) return null;
  if (state.era === 'canal') {
    return {
      kind: 'era',
      headline: `Quedan ${state.actionsLeft} acciones en era ${eraNombre('canal')}`,
      detail:
        'Industrias de una sola era desaparecerán pronto. Enlaces sin PV también. Cierra ventas/construcciones canal antes de pasar.',
      qualityPct: null,
      bestLine: null,
      alternatives: [],
    };
  }
  if (state.era === 'rail' && state.actionsLeft === 1) {
    return {
      kind: 'era',
      headline: 'Última acción de la era ferrocarril',
      detail: 'Prioriza PV inmediatos (ventas, overbuild) y enlaces que puntúen al cierre de era.',
      qualityPct: null,
      bestLine: null,
      alternatives: [],
    };
  }
  return null;
}

function inspectBlockHint(state: GameState, city: CityId, card: Card | null): TrainingHint | null {
  const industries = new Set<IndustryType>();
  for (const allowed of CITIES[city].slots) {
    for (const ind of allowed) industries.add(ind);
  }
  for (const industry of industries) {
    if (buildBlockReason(state, card, city, industry)) {
      return {
        kind: 'block',
        headline: `No puedes construir en ${CITIES[city].name}`,
        detail: buildBlockReasonDetailed(state, card, city, industry),
        qualityPct: null,
        bestLine: null,
        alternatives: [],
      };
    }
  }
  return null;
}

function actionEmptyBlockHint(state: GameState, action: ActionKind): TrainingHint | null {
  switch (action) {
    case 'network':
      if (legalNetworks(state).length > 0) return null;
      return {
        kind: 'block',
        headline: 'Red bloqueada',
        detail: networkActionBlockSummary(state),
        qualityPct: null,
        bestLine: null,
        alternatives: [],
      };
    case 'sell':
      if (legalSells(state).length > 0) return null;
      return {
        kind: 'block',
        headline: 'Vender bloqueado',
        detail: sellActionBlockSummary(state),
        qualityPct: null,
        bestLine: null,
        alternatives: [],
      };
    case 'develop':
      if (legalDevelops(state).length > 0) return null;
      return {
        kind: 'block',
        headline: 'Desarrollar bloqueado',
        detail: developActionBlockSummary(state),
        qualityPct: null,
        bestLine: null,
        alternatives: [],
      };
    default:
      return null;
  }
}

function networkActionBlockSummary(state: GameState): string {
  const player = activePlayer(state);
  if (playerLinksRemaining(state, player) <= 0) {
    return 'Sin fichas de enlace restantes en esta era.';
  }
  const sample = LINKS.map((l) => ({ id: l.id, reason: networkBlockReason(state, l.id) })).filter((x) => x.reason);
  const noTouch = sample.filter((x) => x.reason === 'No toca tu red');
  if (noTouch.length === sample.length && noTouch.length > 0) {
    return 'Ningún enlace toca tu red. Coloca industria en una ciudad nueva o extiende desde un extremo de tu red actual.';
  }
  const coal = sample.find((x) => x.reason === 'Carbón insuficiente');
  if (coal) return networkBlockReasonDetailed(state, coal.id);
  const money = sample.find((x) => x.reason === 'Dinero insuficiente');
  if (money) return networkBlockReasonDetailed(state, money.id);
  if (sample[0]) return networkBlockReasonDetailed(state, sample[0].id);
  return 'No hay enlaces legales en esta era.';
}

function pendingChoiceHint(state: GameState, ctx: TrainingHintContext): TrainingHint | null {
  const choice = ctx.pendingChoice;
  if (!choice) return null;
  const { ranked } = rankedSpread(state);
  const top = ranked.sort((a, b) => b.score - a.score)[0];

  if (choice.type === 'build' && choice.build) {
    const b = choice.build;
    const key = actionKey({ type: 'build', cardIdx: b.cardIdx, option: b.option });
    const pct = qualityForActionKey(state, key);
    const scored = ranked.find((c) => actionKey(c.action) === key);
    return {
      kind: 'choice',
      headline: `${CITIES[b.option.city].name}: ${industria(b.option.industry)} N${b.option.level}`,
      detail: scored ? reasonsForAction(state, scored, activePlayer(state)).slice(0, 2).join(' ') : 'Construcción legal.',
      qualityPct: pct,
      bestLine: top ? describeAction(state, top.action) : null,
      alternatives: [],
    };
  }

  if (choice.type === 'network' && choice.linkId) {
    const block = networkBlockReason(state, choice.linkId);
    if (block) {
      return {
        kind: 'block',
        headline: `Enlace bloqueado: ${linkLabel(choice.linkId)}`,
        detail: networkBlockReasonDetailed(state, choice.linkId),
        qualityPct: null,
        bestLine: top ? describeAction(state, top.action) : null,
        alternatives: [],
      };
    }
    const cardIdx = ctx.cardIdx ?? 0;
    const key = actionKey({
      type: 'network',
      cardIdx,
      option: legalNetworks(state).find((n) => n.option.linkIds[0] === choice.linkId)!.option,
    });
    return {
      kind: 'choice',
      headline: linkLabel(choice.linkId),
      detail: 'Enlace legal: conecta ciudades y desbloquea recursos/PV.',
      qualityPct: qualityForActionKey(state, key),
      bestLine: top ? describeAction(state, top.action) : null,
      alternatives: [],
    };
  }

  if (choice.type === 'sell' && choice.sell) {
    const s = choice.sell;
    const cardIdx = ctx.cardIdx ?? 0;
    const key = actionKey({
      type: 'sell',
      cardIdx,
      sales: [{ sale: s.sale, beer: s.beer }],
    });
    const tile = state.board[s.sale.city][s.sale.slot]!;
    return {
      kind: 'choice',
      headline: `Vender ${industria(tile.industry)} en ${CITIES[s.sale.city].name}`,
      detail: sellBlockReasonDetailed(state, s.sale.city, s.sale.slot),
      qualityPct: qualityForActionKey(state, key),
      bestLine: top ? describeAction(state, top.action) : null,
      alternatives: [],
    };
  }

  if (choice.type === 'develop' && choice.developIndustries?.length) {
    const cardIdx = ctx.cardIdx ?? 0;
    const key = actionKey({ type: 'develop', cardIdx, industries: choice.developIndustries });
    const names = choice.developIndustries.map((i) => industria(i)).join(', ');
    return {
      kind: 'choice',
      headline: `Desarrollar ${names}`,
      detail: developBlockReasonDetailed(state, choice.developIndustries[0]),
      qualityPct: qualityForActionKey(state, key),
      bestLine: top ? describeAction(state, top.action) : null,
      alternatives: [],
    };
  }

  return null;
}

function cardForkHint(state: GameState, cardIdx: number): TrainingHint {
  const { ranked, best, worst } = rankedSpread(state);
  const player = activePlayer(state);
  const card = state.players[player].hand[cardIdx];
  const types: Array<'sell' | 'build' | 'network' | 'develop'> = ['sell', 'build', 'network', 'develop'];
  const alts: TrainingAlternative[] = [];

  for (const type of types) {
    const pool = ranked.filter((c) => {
      if (c.action.type !== type) return false;
      if (type === 'build') return c.action.cardIdx === cardIdx;
      return true;
    });
    const topType = pool.sort((a, b) => b.score - a.score)[0];
    if (!topType) continue;
    alts.push({
      label: describeAction(state, topType.action).split(':')[0] ?? type,
      pct: scoreToQualityPct(topType.score, best, worst),
    });
  }

  alts.sort((a, b) => b.pct - a.pct);
  const top = ranked.sort((a, b) => b.score - a.score)[0];
  const sellAlt = alts.find((a) => a.label.startsWith('Vender'));
  const buildAlt = alts.find((a) => a.label.startsWith('Construir'));
  const devAlt = alts.find((a) => a.label.startsWith('Desarrollar'));

  let detail = `Con esta carta (${cardKindLabel(card)}), compara el plan a largo plazo. `;
  if (sellAlt && buildAlt && sellAlt.pct > buildAlt.pct + 10) {
    detail += 'Vender suele ser mejor ahora: subes ingresos y liberas el mat.';
  } else if (devAlt && buildAlt && devAlt.pct > buildAlt.pct + 8) {
    detail += 'Desarrollar prepara niveles altos; construir otro N1 repite el bucle.';
  } else if (buildAlt && alts[0]?.label.startsWith('Construir')) {
    detail += 'Construir refuerza tablero si aún no tienes ventas listas.';
  }

  return {
    kind: 'fork',
    headline: '¿Vender, desarrollar o construir?',
    detail,
    qualityPct: alts[0] ? alts[0].pct : null,
    bestLine: top ? describeAction(state, top.action) : null,
    alternatives: alts.slice(0, 4),
  };
}

function cardKindLabel(card: Card | undefined): string {
  if (!card) return 'carta';
  switch (card.kind) {
    case 'location':
      return CITIES[card.city].name;
    case 'industry':
      return card.industries.map((i) => industria(i)).join('/');
    case 'wildLocation':
      return 'comodín ubicación';
    case 'wildIndustry':
      return 'comodín industria';
  }
}

function actionTypeHint(state: GameState, action: ActionKind): TrainingHint {
  const empty = actionEmptyBlockHint(state, action);
  if (empty) return empty;

  const { ranked, top, alts, best, worst } = bestByType(state);
  const typeBest = ranked.filter((c) => c.action.type === action).sort((a, b) => b.score - a.score)[0];
  const qualityPct = typeBest ? scoreToQualityPct(typeBest.score, best, worst) : 15;
  const globalPct = top ? scoreToQualityPct(top.score, best, worst) : null;

  let detail = '';
  if (typeBest && top && typeBest.action.type !== top.action.type) {
    detail = `Mejor línea global: ${describeAction(state, top.action)} (${globalPct}%). `;
    detail += reasonsForAction(state, top, activePlayer(state))[0] ?? '';
  } else if (typeBest) {
    detail = reasonsForAction(state, typeBest, activePlayer(state)).slice(0, 2).join(' ');
  } else {
    detail = 'No hay jugadas legales de este tipo en este turno.';
  }

  const actionLabel =
    action === 'build'
      ? 'Construir'
      : action === 'network'
        ? 'Red'
        : action === 'sell'
          ? 'Vender'
          : action === 'develop'
            ? 'Desarrollar'
            : action;

  return {
    kind: 'action',
    headline: `Calidad de ${actionLabel}`,
    detail,
    qualityPct,
    bestLine: top ? describeAction(state, top.action) : null,
    alternatives: alts.filter((a) => a.pct >= 40),
  };
}

function scenarioProgressHint(state: GameState, progress: ScenarioProgress): TrainingHint {
  const meta = trainingScenarioMeta(state.trainingScenario!);
  return {
    kind: 'scenario',
    headline: `${meta.title}: ${progress.headline}`,
    detail: progress.detail,
    qualityPct: progress.progressPct,
    bestLine: progress.status === 'completed' ? 'Escenario superado — juega otra partida o sube dificultad.' : meta.objective,
    alternatives: [],
    scenarioProgress: progress,
  };
}

function forkHint(state: GameState, turnLog: TurnHistoryEntry[] = []): TrainingHint {
  const boardPattern = detectPlayPattern(state);
  const pattern = mergePatternDetection(state, turnLog, boardPattern);
  const drillOffer = pattern ? drillOfferForPattern(pattern.id) : undefined;
  const { top, alts } = bestByType(state);
  const era = eraHint(state);
  const planSteps = buildTrainingPlan(state, 3);

  if (pattern) {
    return {
      kind: 'pattern',
      headline: pattern.title,
      detail: `${pattern.message} ${pattern.pivot}`,
      qualityPct: top ? scoreToQualityPct(top.score, top.score, top.score - 10) : null,
      bestLine: top ? describeAction(state, top.action) : null,
      alternatives: alts,
      planSteps,
      drillOffer,
    };
  }

  if (era && state.actionsLeft <= 1) return { ...era, planSteps, drillOffer: pattern ? drillOffer : undefined };

  const sellAlt = alts.find((a) => a.label.startsWith('Vender'));
  const buildAlt = alts.find((a) => a.label.startsWith('Construir'));
  let detail = 'El entrenador compara acciones legales este turno. ';
  if (era && state.actionsLeft === 2) detail += `${era.detail} `;
  if (sellAlt && buildAlt && sellAlt.pct > buildAlt.pct + 12) {
    detail += 'Vender puntúa mejor que seguir construyendo: hay industrias listas para voltear.';
  } else if (buildAlt && sellAlt && buildAlt.pct > sellAlt.pct + 12) {
    detail += 'Construir supera a vender ahora: refuerza tablero antes de voltear.';
  } else if (alts[0]) {
    detail += `Prioridad sugerida: ${alts[0].label}.`;
  }

  if (planSteps.length >= 2) {
    detail += ` Plan a ${planSteps.length} turnos abajo.`;
  }

  return {
    kind: planSteps.length >= 2 ? 'plan' : 'fork',
    headline: planSteps.length >= 2 ? 'Plan pro (3 turnos)' : '¿Qué hacer este turno?',
    detail,
    qualityPct: top ? scoreToQualityPct(top.score, top.score, top.score - 12) : null,
    bestLine: top ? describeAction(state, top.action) : null,
    alternatives: alts,
    planSteps,
    drillOffer,
  };
}

function enrichHint(state: GameState, hint: TrainingHint, cardIdx?: number | null): TrainingHint {
  if (hint.kind === 'postmove' || hint.kind === 'block') return hint;
  const numericCompare = numericForkCompare(state, cardIdx);
  const summary = numericForkSummary(numericCompare);
  const mapGuide = buildTrainingMapGuide(state);
  const strategy = buildHandStrategyGuide(state, cardIdx);
  return {
    ...hint,
    numericCompare: numericCompare.length >= 2 ? numericCompare.slice(0, 3) : undefined,
    mapGuide,
    strategyThemes: strategy.themes,
    cardStrategies: strategy.cardLines,
    boardSummary: strategy.boardSummary,
    detail: summary && !hint.detail.includes(summary.slice(0, 12)) ? `${hint.detail} ${summary}` : hint.detail,
  };
}

/** Proactive coaching hint for training mode (Spanish). */
export function getTrainingHint(state: GameState, ctx: TrainingHintContext): TrainingHint | null {
  if (state.gameOver) return null;
  const player = activePlayer(state);
  if (state.mode === 'vsAI' && player !== HUMAN) return null;

  if (ctx.flowError) {
    return {
      kind: 'block',
      headline: 'Jugada rechazada',
      detail: ctx.flowError,
      qualityPct: null,
      bestLine: null,
      alternatives: [],
    };
  }

  const finish = (hint: TrainingHint | null): TrainingHint | null =>
    hint ? enrichHint(state, hint, ctx.cardIdx) : null;

  if (state.trainingScenario) {
    const progress = evaluateScenarioProgress(state);
    if (progress) return finish(scenarioProgressHint(state, progress));
  }

  const card = ctx.cardIdx != null ? state.players[player].hand[ctx.cardIdx] ?? null : null;

  const choiceHintResult = pendingChoiceHint(state, ctx);
  if (choiceHintResult) return finish(choiceHintResult);

  if (ctx.focusedLinkId && ctx.action === 'network') {
    const block = networkBlockReason(state, ctx.focusedLinkId);
    if (block) {
      return {
        kind: 'block',
        headline: `Enlace bloqueado: ${linkLabel(ctx.focusedLinkId)}`,
        detail: networkBlockReasonDetailed(state, ctx.focusedLinkId),
        qualityPct: null,
        bestLine: null,
        alternatives: [],
      };
    }
  }

  if (ctx.inspectCity && ctx.action === 'build') {
    const block = inspectBlockHint(state, ctx.inspectCity, card);
    if (block) return block;
  }

  if (ctx.action === 'build' && ctx.cardIdx != null && card) {
    const focusCity = card.kind === 'location' ? card.city : ctx.inspectCity;
    if (focusCity) {
      const industries: readonly IndustryType[] =
        card.kind === 'industry' ? card.industries : (['cotton', 'goods', 'pottery', 'coal', 'iron', 'brewery'] as IndustryType[]);
      for (const industry of industries) {
        const reason = buildBlockReason(state, card, focusCity, industry);
        if (reason) {
          const net = playerNetwork(state, player);
          const extra =
            reason === 'Carbón insuficiente' && net.has(focusCity) && !connectedToMarket(state, focusCity)
              ? ' Estás conectado por red, pero sin acceso a mercado ni minas con carbón al alcance.'
              : '';
          return {
            kind: 'block',
            headline: `Bloqueo al construir ${CITIES[focusCity].name}`,
            detail: buildBlockReasonDetailed(state, card, focusCity, industry) + extra,
            qualityPct: null,
            bestLine: null,
            alternatives: [],
          };
        }
      }
    }
  }

  if (
    ctx.cardIdx != null &&
    ctx.action &&
    !ctx.pendingChoice &&
    !ctx.inspectCity &&
    !ctx.focusedLinkId
  ) {
    return finish(cardForkHint(state, ctx.cardIdx));
  }

  if (ctx.action) return finish(actionTypeHint(state, ctx.action));

  const era = eraHint(state);
  if (era && state.actionsLeft <= 1) return finish(era);

  return finish(forkHint(state, ctx.turnLog ?? []));
}

const VERDICT_HEADLINE: Record<CoachVerdict, string> = {
  excellent: 'Excelente jugada',
  good: 'Buena jugada',
  ok: 'Mejorable',
  mistake: 'Revisar jugada',
};

/** Compact post-move feedback for training bar (replaces coach panel). */
export function postMoveTrainingHint(state: GameState, feedback: CoachFeedback): TrainingHint {
  return {
    kind: 'postmove',
    headline: VERDICT_HEADLINE[feedback.verdict],
    detail: `${feedback.summary} Tu jugada: ${feedback.yourLabel}.`,
    qualityPct: feedback.confidence,
    bestLine: feedback.bestLabel,
    alternatives: feedback.alternatives.slice(0, 3).map((a) => ({
      label: a.label.split(':')[0] ?? a.label,
      pct: scoreToQualityPct(a.score, feedback.bestScore, feedback.yourScore),
    })),
    mapGuide: mapGuideForAction(state, feedback.bestAction),
    dismissible: true,
  };
}

/** Quality 0–100 for a specific pending build choice. */
export function qualityForBuildChoice(
  state: GameState,
  cardIdx: number,
  city: CityId,
  industry: IndustryType,
  slot: number,
): number | null {
  const match = legalBuilds(state).find(
    (b) =>
      b.cardIdx === cardIdx &&
      b.option.city === city &&
      b.option.industry === industry &&
      b.option.slot === slot,
  );
  if (!match) return null;
  return qualityForActionKey(state, actionKey({ type: 'build', cardIdx, option: match.option }));
}
