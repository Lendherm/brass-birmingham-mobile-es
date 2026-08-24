import type { IndustryType, PlayerId } from './types';
import { tileSpec } from './data/industries';
import { levelForSpace } from './income';
import { logForPlayer } from './logFormat';
import {
  HUMAN,
  activePlayer,
  automaOpponentIds,
  dealHotseatHands,
  dealSoloHumanDeck,
  initAutomaPlayer,
  isAIPlayer,
  isSolo,
  isTutorial,
  isVsAI,
  log,
  playerLabel,
  type Card,
  type GameState,
} from './state';
import {
  applyBuild,
  applyDevelop,
  applyLoan,
  applyNetworkSingle,
  applyScout,
  cardAllowsBuild,
  sellBuilding,
  type BeerSource,
  type BuildOption,
  type NetworkOption,
  type SellableBuilding,
} from './actions';
import { runAutomaTurn } from './mautoma/bot';
import { pickAIAction } from './ai/bot';
import { canalEraCleanup, computeEraScoreBreakdown, scoreFlippedIndustries, scoreLinks } from './scoring';
import { eraNombre, industria } from './messages';

export type PlayerAction =
  | { type: 'build'; cardIdx: number; option: BuildOption }
  | { type: 'network'; cardIdx: number; option: NetworkOption }
  | { type: 'sell'; cardIdx: number; sales: { sale: SellableBuilding; beer: BeerSource[] }[] }
  | { type: 'develop'; cardIdx: number; industries: IndustryType[] }
  | { type: 'loan'; cardIdx: number }
  | { type: 'scout'; cardIdx: number; extraDiscards: [number, number] }
  | { type: 'pass'; cardIdx: number };

function checkCard(state: GameState, player: number, action: PlayerAction): Card {
  const card = state.players[player].hand[action.cardIdx];
  if (!card) throw new Error('No tienes esa carta en la mano');
  if (action.type === 'build' && !cardAllowsBuild(state, player, card, action.option.city, action.option.industry)) {
    throw new Error('Esta carta no permite esa construcción');
  }
  return card;
}

function discardCard(state: GameState, player: number, idx: number): void {
  state.players[player].hand.splice(idx, 1);
}

export function applyPlayerAction(state: GameState, action: PlayerAction): void {
  const player = activePlayer(state);
  checkCard(state, player, action);
  switch (action.type) {
    case 'build':
      applyBuild(state, player, action.option);
      break;
    case 'network':
      applyNetworkSingle(state, player, action.option);
      break;
    case 'sell':
      if (action.sales.length === 0) throw new Error('Vender requiere al menos una venta');
      for (const { sale, beer } of action.sales) sellBuilding(state, player, sale, beer);
      break;
    case 'develop':
      applyDevelop(state, player, action.industries);
      break;
    case 'loan':
      applyLoan(state, player);
      break;
    case 'scout':
      applyScout(state, player, action.extraDiscards);
      break;
    case 'pass':
      logForPlayer(state, player, 'pasó.');
      break;
  }
  discardCardForAction(state, player, action);
  state.actionsLeft -= 1;
  if (state.actionsLeft === 0) endPlayerTurn(state);
}

/** @deprecated use applyPlayerAction */
export function applyHumanAction(state: GameState, action: PlayerAction): void {
  applyPlayerAction(state, action);
}

function discardCardForAction(state: GameState, player: number, action: PlayerAction): void {
  if (action.type === 'scout') {
    let idx = action.cardIdx;
    for (const removed of action.extraDiscards) {
      if (removed < action.cardIdx) idx -= 1;
    }
    discardCard(state, player, idx);
    return;
  }
  discardCard(state, player, action.cardIdx);
}

function drawToEight(state: GameState, player: number): void {
  const hand = state.players[player].hand;
  while (hand.length < 8 && state.drawPile.length > 0) {
    hand.push(state.drawPile.pop()!);
  }
}

function endPlayerTurn(state: GameState): void {
  const player = activePlayer(state);
  drawToEight(state, player);

  if (isTutorial(state)) {
    return;
  }

  if (isSolo(state)) {
    for (const id of automaOpponentIds(state)) runAutomaTurn(state, id);
    endRound(state);
    return;
  }

  advanceHotseatTurn(state);
}

function advanceHotseatTurn(state: GameState): void {
  if (eraShouldEnd(state)) {
    endEra(state);
    return;
  }

  state.currentPlayerIndex += 1;
  if (state.currentPlayerIndex >= state.playerCount) {
    endHotseatRound(state);
    return;
  }

  state.currentPlayer = state.turnOrder[state.currentPlayerIndex];
  state.actionsLeft = state.firstTurnOfGame ? 1 : 2;
  if (state.firstTurnOfGame) state.firstTurnOfGame = false;

  skipEmptyHandPlayers(state);
  processAITurns(state);
}

let aiTurnProcessing = false;

/** Run AI opponents until it is the human's turn or the game ends. */
export function processAITurns(state: GameState): void {
  if (!isVsAI(state) || state.gameOver || aiTurnProcessing || state.plannerSim) return;
  aiTurnProcessing = true;
  try {
    let safety = 0;
    while (isAIPlayer(state, state.currentPlayer) && !state.gameOver && safety < 100) {
      safety++;
      const playerBefore = state.currentPlayer;
      let actionSafety = 0;
      while (
        isAIPlayer(state, state.currentPlayer) &&
        state.currentPlayer === playerBefore &&
        state.actionsLeft > 0 &&
        !state.gameOver &&
        actionSafety < 8
      ) {
        actionSafety++;
        try {
          applyPlayerAction(state, pickAIAction(state));
        } catch {
          const hand = state.players[state.currentPlayer].hand;
          if (hand.length === 0 || state.actionsLeft <= 0) break;
          log(state, `${state.playerNames[state.currentPlayer]} — IA sin jugada válida; pasa.`);
          applyPlayerAction(state, { type: 'pass', cardIdx: 0 });
        }
      }
      // Stuck: same AI still has actions after the safety cap → force-pass remaining.
      if (
        isAIPlayer(state, state.currentPlayer) &&
        state.currentPlayer === playerBefore &&
        state.actionsLeft > 0 &&
        actionSafety >= 8 &&
        !state.gameOver &&
        state.players[state.currentPlayer].hand.length > 0
      ) {
        log(state, `${state.playerNames[state.currentPlayer]} — se fuerza pasar para evitar un cuelgue.`);
        let force = 0;
        while (
          isAIPlayer(state, state.currentPlayer) &&
          state.currentPlayer === playerBefore &&
          state.actionsLeft > 0 &&
          !state.gameOver &&
          state.players[state.currentPlayer].hand.length > 0 &&
          force < 4
        ) {
          force++;
          applyPlayerAction(state, { type: 'pass', cardIdx: 0 });
        }
      }
    }
    if (isAIPlayer(state, state.currentPlayer) && !state.gameOver) {
      log(state, 'Se interrumpió un bucle de turnos de IA para desbloquear la partida.');
    }
  } finally {
    aiTurnProcessing = false;
  }
}

function skipEmptyHandPlayers(state: GameState): void {
  let safety = 0;
  while (
    state.players[state.currentPlayer].hand.length === 0 &&
    state.drawPile.length === 0 &&
    safety < state.playerCount
  ) {
    state.currentPlayerIndex += 1;
    safety++;
    if (state.currentPlayerIndex >= state.playerCount) {
      endHotseatRound(state);
      return;
    }
    state.currentPlayer = state.turnOrder[state.currentPlayerIndex];
  }
}

function endHotseatRound(state: GameState): void {
  if (eraShouldEnd(state)) {
    endEra(state);
    return;
  }

  for (let i = 0; i < state.playerCount; i++) {
    const income = levelForSpace(state.players[i].incomeSpace);
    state.players[i].money += income;
    if (income !== 0) log(state, `${state.playerNames[i]} — ingresos: ${income >= 0 ? '+' : ''}£${income}.`);
    if (state.players[i].money < 0) shortfall(state, i);
  }

  state.turnOrder.sort((a, b) => {
    const spentA = state.moneySpentThisRound[a] ?? 0;
    const spentB = state.moneySpentThisRound[b] ?? 0;
    if (spentA !== spentB) return spentA - spentB;
    return state.turnOrder.indexOf(a) - state.turnOrder.indexOf(b);
  });
  state.moneySpentThisRound = Array(state.playerCount).fill(0);

  state.turn += 1;
  state.currentPlayerIndex = 0;
  state.currentPlayer = state.turnOrder[0];
  state.actionsLeft = 2;
  state.firstTurnOfGame = false;
  skipEmptyHandPlayers(state);
  processAITurns(state);
}

function endRound(state: GameState): void {
  if (eraShouldEnd(state)) {
    endEra(state);
    return;
  }

  const income = levelForSpace(state.players[HUMAN].incomeSpace);
  state.players[HUMAN].money += income;
  if (income !== 0) log(state, `Ingresos: ${income >= 0 ? '+' : ''}£${income}.`);
  if (state.players[HUMAN].money < 0) shortfall(state, HUMAN);
  state.turn += 1;
  state.actionsLeft = 2;
}

function eraShouldEnd(state: GameState): boolean {
  if (state.drawPile.length > 0) return false;
  return state.players.every((p) => p.hand.length === 0);
}

function shortfall(state: GameState, playerId: number): void {
  const p = state.players[playerId];
  log(state, `¡Déficit de ${playerLabel(state, playerId)}! Debe £${-p.money}.`);
  const owned: { city: keyof typeof state.board; slot: number; value: number }[] = [];
  for (const [city, slots] of Object.entries(state.board)) {
    slots.forEach((tile, slot) => {
      if (tile?.owner === playerId) {
        owned.push({
          city: city as keyof typeof state.board,
          slot,
          value: Math.floor(tileSpec(tile.industry, tile.level).cost / 2),
        });
      }
    });
  }
  owned.sort((a, b) => a.value - b.value);
  for (const o of owned) {
    if (p.money >= 0) break;
    const tile = state.board[o.city][o.slot]!;
    state.board[o.city][o.slot] = null;
    p.money += o.value;
    log(state, `Venta forzada: ${industria(tile.industry)} N${tile.level} en ${o.city} por £${o.value}.`);
  }
  if (p.money < 0) {
    const penalty = Math.min(p.vp, -p.money);
    p.vp -= penalty;
    log(state, `Aún debe: -${penalty} PV.`);
    p.money = 0;
  }
}

function endEra(state: GameState): void {
  const eraEnding = state.era;
  log(state, `--- Fin de la Era ${eraNombre(state.era)} ---`);
  const breakdown = computeEraScoreBreakdown(state);
  scoreLinks(state);
  scoreFlippedIndustries(state);

  const lines = state.players.map((p, i) => ({
    playerId: i as PlayerId,
    label: playerLabel(state, i),
    linkVp: breakdown.linkVp[i],
    industryVp: breakdown.industryVp[i],
    totalVp: breakdown.linkVp[i] + breakdown.industryVp[i],
    vpAfter: p.vp,
  }));

  if (state.era === 'canal') {
    canalEraCleanup(state);
    state.era = 'rail';
    state.turn = 1;
    state.actionsLeft = 2;
    state.firstTurnOfGame = false;
    state.currentPlayerIndex = 0;
    state.currentPlayer = state.turnOrder[0];

    if (isSolo(state)) {
      dealSoloHumanDeck(state);
      for (const id of automaOpponentIds(state)) initAutomaPlayer(state, id);
    } else {
      dealHotseatHands(state);
    }

    state.pendingEraScore = { era: eraEnding, lines, gameOver: false };
    log(state, 'Comienza la Era Ferrocarril.');
    processAITurns(state);
    return;
  }

  state.gameOver = true;
  if (isSolo(state) || isVsAI(state)) {
    const ranking = state.players.map((p, i) => ({ label: playerLabel(state, i), vp: p.vp })).sort((a, b) => b.vp - a.vp);
    const you = ranking.find((r) => r.label === playerLabel(state, HUMAN))!;
    const winner = ranking[0];
    const result =
      winner.label === you.label && ranking.filter((r) => r.vp === you.vp).length === 1
        ? '¡Ganaste!'
        : you.vp === winner.vp
          ? 'Empate por el primer puesto.'
          : `Gana ${winner.label}.`;
    log(state, `Final: ${ranking.map((r) => `${r.label} ${r.vp} PV`).join(' · ')}. ${result}`);
    state.pendingEraScore = { era: eraEnding, lines, gameOver: true, ranking, resultMessage: result };
    return;
  }

  const ranking = state.players
    .map((p, i) => ({ label: state.playerNames[i], vp: p.vp }))
    .sort((a, b) => b.vp - a.vp);
  log(state, `Final: ${ranking.map((r) => `${r.label} ${r.vp} PV`).join(' · ')}. ¡Gana ${ranking[0].label}!`);
  state.pendingEraScore = {
    era: eraEnding,
    lines,
    gameOver: true,
    ranking,
    resultMessage: `¡Gana ${ranking[0].label}!`,
  };
}
