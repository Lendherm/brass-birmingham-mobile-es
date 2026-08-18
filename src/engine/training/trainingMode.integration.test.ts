import { describe, expect, it } from 'vitest';
import { compareCoachMove } from '../ai/coach';
import {
  developActionBlockSummary,
  networkBlockReason,
  networkBlockReasonDetailed,
  sellActionBlockSummary,
} from '../actionBlockExplain';
import { buildBlockReasonDetailed } from '../buildExplain';
import { legalBuilds, legalNetworks } from '../options';
import { newGame } from '../state';
import type { IndustryType } from '../types';
import { numericForkCompare, numericForkSummary } from './actionCompare';
import { drillOfferForPattern } from './habitDrills';
import { detectHistoryPattern, recordTurnHistory, type TurnHistoryEntry } from './turnHistory';
import { getTrainingHint, postMoveTrainingHint } from './trainingHints';
import { buildTrainingMapGuide, mapGuideForAction, mergeMapHighlights } from './trainingMapGuide';
import { buildTrainingPlan } from './trainingPlan';
import { evaluateScenarioProgress } from './scenarioValidation';
import { newTrainingScenario, TRAINING_SCENARIOS } from './scenarios';

/** Smoke + regression suite for the full training-mode stack. */
describe('training mode integration', () => {
  it('enriches idle hints with numeric compare, map guide and plan', () => {
    const state = newGame(11, 'medium', 1);
    state.actionsLeft = 8;
    const hint = getTrainingHint(state, { action: null, cardIdx: null, inspectCity: null });
    expect(hint).not.toBeNull();
    expect(hint!.kind === 'fork' || hint!.kind === 'plan').toBe(true);
    expect(hint!.alternatives.length).toBeGreaterThan(0);
    expect(hint!.planSteps?.length).toBeGreaterThan(0);
    expect(hint!.numericCompare?.length).toBeGreaterThanOrEqual(2);
    expect(hint!.mapGuide?.viewTarget).not.toBeNull();
  });

  it('post-move hint wires coach feedback to map guide', () => {
    const state = newGame(12, 'medium', 1);
    state.actionsLeft = 8;
    const build = legalBuilds(state)[0];
    expect(build).toBeDefined();
    const feedback = compareCoachMove(state, { type: 'pass' });
    const hint = postMoveTrainingHint(state, feedback);
    expect(hint.kind).toBe('postmove');
    expect(hint.dismissible).toBe(true);
    expect(hint.mapGuide?.viewTarget).not.toBeNull();
    expect(hint.qualityPct).toBeGreaterThanOrEqual(0);
  });

  it('explains blocked network links with detailed copy', () => {
    const state = newGame(13, 'easy', 1);
    state.players[0].money = 50;
    state.board.coventry[0] = { industry: 'cotton', level: 1, owner: 0, resources: 0, flipped: false };
    const linkId = 'birmingham-walsall';
    expect(networkBlockReason(state, linkId)).toBe('No toca tu red');
    const hint = getTrainingHint(state, {
      action: 'network',
      cardIdx: null,
      inspectCity: null,
      focusedLinkId: linkId,
    });
    expect(hint?.kind).toBe('block');
    expect(hint?.headline.toLowerCase()).toContain('bloqueado');
    expect(networkBlockReasonDetailed(state, linkId).toLowerCase()).toContain('no toca');
  });

  it('detects build-loop habit and offers a drill', () => {
    const state = newGame(14, 'medium', 1);
    state.actionsLeft = 8;
    let log: TurnHistoryEntry[] = [];
    for (let i = 0; i < 4; i++) {
      log = recordTurnHistory(log, { type: 'build', cardIdx: 0, option: legalBuilds(state)[0]!.option }, state);
    }
    const pattern = detectHistoryPattern(log);
    expect(pattern?.id).toBe('build-loop');
    const drill = drillOfferForPattern('build-loop');
    expect(drill.scenarioId).toBe('develop-mat');
    const hint = getTrainingHint(state, { action: null, cardIdx: null, inspectCity: null, turnLog: log });
    expect(hint?.drillOffer?.scenarioId).toBe('develop-mat');
  });

  it('loads every training scenario and evaluates progress without crashing', () => {
    for (const meta of TRAINING_SCENARIOS) {
      const state = newTrainingScenario(meta.id);
      expect(state.trainingScenario).toBe(meta.id);
      const progress = evaluateScenarioProgress(state);
      expect(progress).not.toBeNull();
      expect(progress!.progressPct).toBeGreaterThanOrEqual(0);
      expect(progress!.progressPct).toBeLessThanOrEqual(100);
      expect(['pending', 'on-track', 'completed', 'missed']).toContain(progress!.status);
    }
  });

  it('keeps map highlights consistent for pro overlays', () => {
    const state = newGame(15, 'medium', 1);
    state.actionsLeft = 8;
    const guide = buildTrainingMapGuide(state);
    expect(guide).not.toBeNull();
    const merged = mergeMapHighlights(new Set(), new Set(), new Set(), guide);
    for (const slot of guide!.buildSlots) {
      expect(merged.slots.has(slot)).toBe(true);
      expect(merged.proSlots.has(slot)).toBe(true);
    }
    for (const linkId of guide!.linkIds) {
      expect(merged.links.has(linkId)).toBe(true);
      expect(merged.proLinks.has(linkId)).toBe(true);
    }
  });

  it('numeric fork compare and summary stay in sync', () => {
    const state = newGame(16, 'medium', 1);
    state.actionsLeft = 8;
    const lines = numericForkCompare(state);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    const sorted = [...lines].sort((a, b) => b.pct - a.pct);
    expect(sorted[0]!.pct).toBeGreaterThanOrEqual(sorted[sorted.length - 1]!.pct);
    const summary = numericForkSummary(lines);
    if (summary) expect(summary.length).toBeGreaterThan(10);
  });

  it('builds a 3-turn plan in canal era', () => {
    const state = newGame(17, 'easy', 1);
    state.era = 'canal';
    state.actionsLeft = 8;
    const plan = buildTrainingPlan(state);
    expect(plan.length).toBeGreaterThanOrEqual(2);
    expect(plan.some((s) => s.phase === 'now')).toBe(true);
  });

  it('maps best build action to a concrete slot on the board', () => {
    const state = newGame(18, 'easy', 1);
    state.actionsLeft = 8;
    const build = legalBuilds(state)[0];
    expect(build).toBeDefined();
    const guide = mapGuideForAction(state, { type: 'build', cardIdx: build!.cardIdx, option: build!.option });
    expect(guide.buildSlots).toEqual([`${build!.option.city}:${build!.option.slot}`]);
    expect(guide.viewTarget).not.toBeNull();
  });

  it('summarizes common action blocks for training bar', () => {
    const emptySell = newGame(19, 'easy', 1);
    expect(sellActionBlockSummary(emptySell).length).toBeGreaterThan(5);
    const emptyDevelop = newGame(20, 'easy', 1);
    const mat = emptyDevelop.players[0].mat;
    for (const k of Object.keys(mat) as IndustryType[]) {
      mat[k] = [0, 0, 0, 0];
    }
    expect(developActionBlockSummary(emptyDevelop).toLowerCase()).toContain('mat');
    const canal = newGame(21, 'easy', 1);
    canal.era = 'canal';
    canal.players[0].money = 100;
    canal.board.birmingham[0] = { industry: 'cotton', level: 1, owner: 0, resources: 0, flipped: false };
    const detail = buildBlockReasonDetailed(canal, { kind: 'location', city: 'birmingham' }, 'birmingham', 'goods');
    expect(detail.includes('Canal') || detail.includes('canal')).toBe(true);
  });

  it('scenario hints include progress and stay enriched', () => {
    const state = newTrainingScenario('sell-or-build');
    const hint = getTrainingHint(state, { action: null, cardIdx: null, inspectCity: null });
    expect(hint?.kind).toBe('scenario');
    expect(hint?.scenarioProgress?.status).toBe('on-track');
    expect(hint?.numericCompare?.length).toBeGreaterThanOrEqual(2);
  });

  it('legal network options produce map guides when ranked best', () => {
    const state = newTrainingScenario('network-timing');
    const net = legalNetworks(state)[0];
    if (!net) return;
    const guide = mapGuideForAction(state, { type: 'network', option: net.option });
    expect(guide.linkIds.length).toBeGreaterThan(0);
    expect(guide.viewTarget).not.toBeNull();
  });
});
