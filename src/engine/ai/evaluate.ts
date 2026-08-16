import { CITIES, LINKS } from '../data/board';
import { tileSpec } from '../data/industries';
import { levelForSpace, LOAN_AMOUNT } from '../income';
import { COAL_MARKET } from '../market';
import { locationLinkVP } from '../scoring';
import { areConnected, connectedToMarket, playerNetwork } from '../connectivity';
import { playerLinksRemaining } from '../links';
import { cardAllowsBuild } from '../actions';
import {
  canLoan,
  legalBuilds,
  legalDevelops,
  legalNetworks,
  legalSells,
  scoutAllowed,
  type BuildChoice,
  type DevelopChoice,
  type NetworkChoice,
  type SellChoice,
} from '../options';
import { activePlayer, HUMAN, type Card, type GameState } from '../state';
import type { CityId, IndustryType, PlayerId } from '../types';
import { personalityFor } from './personality';
import { bonusForBuild, bonusForNetwork, bonusForSell } from './positionEval';
import type { ScoredAction } from './types';

function cardKindValue(card: Card): number {
  switch (card.kind) {
    case 'wildLocation':
      return 14;
    case 'wildIndustry':
      return 12;
    case 'location':
      return 4;
    case 'industry':
      return 3;
  }
}

/** Penalize burning a flexible card on a weak action. */
export function scoreCardForAction(state: GameState, cardIdx: number, actionType: ScoredAction['action']['type']): number {
  const player = activePlayer(state);
  const card = state.players[player].hand[cardIdx];
  if (!card) return -20;
  const flex = cardKindValue(card);
  if (actionType === 'pass' || actionType === 'loan') return -flex * 2;
  if (actionType === 'network' || actionType === 'develop') return -flex * 0.35;
  if (actionType === 'sell') return -flex * 0.15;
  return -flex * 0.05;
}

function humanPressure(state: GameState, city: CityId, player: PlayerId): number {
  if (player === HUMAN) return 0;
  let score = 0;
  if (state.board[city].some((t) => t?.owner === HUMAN)) score += 4;
  const humanNet = playerNetwork(state, HUMAN);
  if (humanNet.has(city)) score += 3;
  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (tile?.owner === HUMAN && areConnected(state, city, city)) score += 0.5;
    }
  }
  return score;
}

function eraUrgency(state: GameState, industry: IndustryType, level: number): number {
  if (state.era !== 'canal') return 0;
  const spec = tileSpec(industry, level);
  if (spec.eras.length === 1) return 10;
  if (level === 1) return 6;
  return 0;
}

function coalIronEfficiency(option: BuildChoice['option']): number {
  let bonus = 0;
  if (option.coalPlan) {
    bonus += option.coalPlan.fromMarket > 0 ? -2 : 4;
    bonus -= option.coalPlan.marketCost * 0.3;
  }
  if (option.ironPlan) {
    bonus += option.ironPlan.fromMarket > 0 ? -1 : 3;
    bonus -= option.ironPlan.marketCost * 0.3;
  }
  return bonus;
}

function incomeValue(state: GameState, player: PlayerId): number {
  return levelForSpace(state.players[player].incomeSpace) * 1.5;
}

export function scoreBuild(state: GameState, choice: BuildChoice, player: PlayerId = activePlayer(state)): number {
  const { option, cardIdx } = choice;
  const spec = tileSpec(option.industry, option.level);
  const weights = personalityFor(player);

  let score = spec.vp * 14;
  if (spec.producesCoal) score += 9 + (state.coalCubes < COAL_MARKET.prices.length - 2 ? 3 : 0);
  if (spec.producesIron) score += 7;
  if (spec.producesBeer) score += 8;
  if (option.overbuild) score += 6;
  score += eraUrgency(state, option.industry, option.level);
  score += coalIronEfficiency(option);
  score -= option.moneyCost * 0.45;
  score += humanPressure(state, option.city, player) * weights.block;

  const moneyAfter = state.players[player].money - option.moneyCost;
  if (moneyAfter < 0) score -= 40;
  else if (moneyAfter < 4) score -= 10;
  else if (moneyAfter > 14) score += 2;

  if (connectedToMarket(state, option.city) && (spec.producesCoal || spec.producesIron)) score += 4;

  const card = state.players[player].hand[cardIdx];
  if (card && cardAllowsBuild(state, player, card, option.city, option.industry)) {
    if (card.kind === 'location' && card.city === option.city) score += 5;
    if (card.kind === 'industry' && card.industries.includes(option.industry)) score += 4;
  }

  score += scoreCardForAction(state, cardIdx, 'build');
  score += bonusForBuild(state, option.city, option.industry, player);
  return score * weights.build;
}

export function scoreNetwork(state: GameState, choice: NetworkChoice, player: PlayerId = activePlayer(state)): number {
  const weights = personalityFor(player);
  let vp = 0;
  let blockBonus = 0;
  const link = LINKS.find((l) => l.id === choice.option.linkIds[0]);
  if (link) {
    for (const end of link.endpoints) vp += locationLinkVP(state, end);
    for (const end of link.endpoints) {
      if (end in CITIES) blockBonus += humanPressure(state, end as CityId, player) * 0.5;
    }
  }

  let score = vp * 11 + blockBonus - choice.option.moneyCost * 0.55;
  if (state.era === 'canal' && playerLinksRemaining(state, player) <= 2) score += 5;
  if (state.era === 'rail') score += 4;
  if (state.players[player].money < choice.option.moneyCost + 4) score -= 14;

  score += scoreCardForAction(state, choice.cardIdx, 'network');
  if (link && link.endpoints[0] in CITIES) {
    score += bonusForNetwork(state, link.endpoints[0] as CityId, player);
  }
  return score * weights.network;
}

export function scoreSell(state: GameState, choice: SellChoice, player: PlayerId = activePlayer(state)): number {
  const weights = personalityFor(player);
  const tile = state.board[choice.sale.city][choice.sale.slot]!;
  const spec = tileSpec(tile.industry, tile.level);

  let score = spec.vp * 20 + incomeValue(state, player) * 0.4 + 8;
  if (choice.sale.merchantIdx != null) score += 12;
  if (tile.resources > 0 && (tile.industry === 'coal' || tile.industry === 'iron')) score -= 5;

  score += scoreCardForAction(state, choice.cardIdx, 'sell');
  score += bonusForSell(state, player);
  return score * weights.sell;
}

export function scoreDevelop(state: GameState, choice: DevelopChoice, player: PlayerId = activePlayer(state)): number {
  const weights = personalityFor(player);
  const industry = choice.industries[0];
  const track = state.players[player].mat[industry];
  const remaining = track.reduce((a, b) => a + b, 0);
  const lowLevels = track.slice(0, 2).reduce((a, b) => a + b, 0);

  let score = 8 + (10 - remaining) + lowLevels * 1.5;
  if (state.era === 'canal') score += 3;
  score += scoreCardForAction(state, choice.cardIdx, 'develop');
  return score * weights.develop;
}

export function scoreLoan(state: GameState, cardIdx: number, player: PlayerId = activePlayer(state)): number {
  const money = state.players[player].money;
  if (money >= LOAN_AMOUNT) return -8;
  let score = 6 + (LOAN_AMOUNT - money) * 0.5;
  if (levelForSpace(state.players[player].incomeSpace) <= -6) score -= 4;
  score += scoreCardForAction(state, cardIdx, 'loan');
  return score;
}

export function scoreScout(state: GameState, cardIdx: number, player: PlayerId = activePlayer(state)): number {
  const hand = state.players[player].hand;
  let flexible = 0;
  for (const card of hand) {
    if (card.kind === 'wildIndustry' || card.kind === 'wildLocation') flexible++;
    if (card.kind === 'industry' && card.industries.length >= 2) flexible++;
  }
  const ratio = flexible / Math.max(1, hand.length);
  let score = ratio < 0.25 ? 10 : ratio < 0.4 ? 5 : -4;
  if (hand.length <= 4) score -= 6;
  if (state.drawPile.length < 3) score -= 8;
  score += scoreCardForAction(state, cardIdx, 'scout');
  return score;
}

export function scorePass(state: GameState, cardIdx: number): number {
  return -12 + scoreCardForAction(state, cardIdx, 'pass');
}

/** Prefer discarding weak cards for loans/scout/pass. */
export function pickExpendableCard(state: GameState): number {
  const player = activePlayer(state);
  const hand = state.players[player].hand;
  let bestIdx = 0;
  let bestValue = Infinity;
  hand.forEach((card, i) => {
    const v = cardKindValue(card);
    if (v < bestValue) {
      bestValue = v;
      bestIdx = i;
    }
  });
  return bestIdx;
}

export function pickScoutDiscards(state: GameState, keepIdx: number): [number, number] {
  const player = activePlayer(state);
  const hand = state.players[player].hand;
  const ranked = hand
    .map((card, i) => ({ i, v: i === keepIdx ? Infinity : cardKindValue(card) }))
    .filter((x) => x.i !== keepIdx)
    .sort((a, b) => a.v - b.v);
  if (ranked.length < 2) return [0, 1];
  return [ranked[0].i, ranked[1].i];
}

export function rankCandidates(state: GameState): ScoredAction[] {
  const player = activePlayer(state);
  if (state.players[player].hand.length === 0) return [];

  const candidates: ScoredAction[] = [];
  const expend = pickExpendableCard(state);

  for (const choice of legalSells(state)) {
    candidates.push({
      action: { type: 'sell', cardIdx: choice.cardIdx, sales: [{ sale: choice.sale, beer: choice.beer }] },
      score: scoreSell(state, choice, player),
      tags: ['sell'],
    });
  }
  for (const choice of legalBuilds(state)) {
    candidates.push({
      action: { type: 'build', cardIdx: choice.cardIdx, option: choice.option },
      score: scoreBuild(state, choice, player),
      tags: ['build'],
    });
  }
  for (const choice of legalNetworks(state)) {
    candidates.push({
      action: { type: 'network', cardIdx: choice.cardIdx, option: choice.option },
      score: scoreNetwork(state, choice, player),
      tags: ['network'],
    });
  }
  for (const choice of legalDevelops(state)) {
    candidates.push({
      action: { type: 'develop', cardIdx: choice.cardIdx, industries: choice.industries },
      score: scoreDevelop(state, choice, player),
      tags: ['develop'],
    });
  }
  if (canLoan(state)) {
    const loanScore = scoreLoan(state, expend, player);
    if (loanScore > -5) {
      candidates.push({ action: { type: 'loan', cardIdx: expend }, score: loanScore, tags: ['loan'] });
    }
  }
  if (scoutAllowed(state)) {
    const scoutScore = scoreScout(state, expend, player);
    if (scoutScore > 0) {
      candidates.push({
        action: { type: 'scout', cardIdx: expend, extraDiscards: pickScoutDiscards(state, expend) },
        score: scoutScore,
        tags: ['scout'],
      });
    }
  }

  candidates.push({
    action: { type: 'pass', cardIdx: expend },
    score: scorePass(state, expend),
    tags: ['pass'],
  });

  return candidates;
}

export function bestActionScore(candidates: ScoredAction[]): number {
  if (candidates.length === 0) return -999;
  return Math.max(...candidates.map((c) => c.score));
}

export function topCandidates(candidates: ScoredAction[], n: number): ScoredAction[] {
  return [...candidates].sort((a, b) => b.score - a.score).slice(0, n);
}
