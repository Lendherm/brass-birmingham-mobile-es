import type { PlayerAction } from '../game';
import { LINKS } from '../data/board';
import { LAYOUT } from '../data/layout';
import { rankCandidatesForCoach } from '../coachRank';
import { HUMAN, type GameState } from '../state';
import type { CityId, IndustryType } from '../types';

export interface TrainingMapGuide {
  linkIds: string[];
  buildSlots: string[];
  cities: CityId[];
  developIndustries: IndustryType[];
  viewTarget: { x: number; y: number; scale?: number } | null;
}

function viewForCity(city: CityId): TrainingMapGuide['viewTarget'] {
  const pos = LAYOUT[city];
  if (!pos) return null;
  return { x: pos.x, y: pos.y, scale: 1.04 };
}

function viewForLink(linkId: string): TrainingMapGuide['viewTarget'] {
  const link = LINKS.find((l) => l.id === linkId);
  if (!link) return null;
  const a = LAYOUT[link.endpoints[0]];
  const b = LAYOUT[link.endpoints[link.endpoints.length - 1]];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, scale: 1.08 };
}

/** Map highlights + camera target for the coach's recommended line. */
export function mapGuideForAction(_state: GameState, action: PlayerAction): TrainingMapGuide {
  const guide: TrainingMapGuide = {
    linkIds: [],
    buildSlots: [],
    cities: [],
    developIndustries: [],
    viewTarget: null,
  };

  switch (action.type) {
    case 'build': {
      const { city, slot } = action.option;
      guide.cities = [city];
      guide.buildSlots = [`${city}:${slot}`];
      guide.viewTarget = viewForCity(city);
      break;
    }
    case 'network': {
      const linkId = action.option.linkIds[0];
      guide.linkIds = [linkId];
      guide.viewTarget = viewForLink(linkId);
      break;
    }
    case 'sell': {
      for (const { sale } of action.sales) {
        guide.cities.push(sale.city);
        guide.buildSlots.push(`${sale.city}:${sale.slot}`);
      }
      guide.viewTarget = viewForCity(action.sales[0]?.sale.city ?? guide.cities[0]!);
      break;
    }
    case 'develop':
      guide.developIndustries = [...action.industries];
      guide.viewTarget = { x: 450, y: 430, scale: 0.95 };
      break;
    case 'scout':
      guide.viewTarget = { x: 450, y: 520, scale: 0.92 };
      break;
    default:
      break;
  }

  return guide;
}

/** Best non-pass action map guide for training overlays. */
export function buildTrainingMapGuide(state: GameState): TrainingMapGuide | null {
  if (state.gameOver) return null;
  if (state.mode === 'vsAI' && state.currentPlayer !== HUMAN) return null;
  const ranked = rankCandidatesForCoach(state);
  const best =
    ranked.filter((c) => c.action.type !== 'pass').sort((a, b) => b.score - a.score)[0] ??
    ranked.sort((a, b) => b.score - a.score)[0];
  if (!best || best.action.type === 'pass') return null;
  return mapGuideForAction(state, best.action);
}

/** Merge pro guide slots into flow highlight sets (pro marked separately in UI). */
export function mergeMapHighlights(
  flowCities: Set<string>,
  flowSlots: Set<string>,
  flowLinks: Set<string>,
  guide: TrainingMapGuide | null,
): { cities: Set<string>; slots: Set<string>; links: Set<string>; proLinks: Set<string>; proSlots: Set<string> } {
  const cities = new Set(flowCities);
  const slots = new Set(flowSlots);
  const links = new Set(flowLinks);
  const proLinks = new Set<string>();
  const proSlots = new Set<string>();
  if (!guide) return { cities, slots, links, proLinks, proSlots };
  for (const c of guide.cities) cities.add(c);
  for (const s of guide.buildSlots) {
    slots.add(s);
    proSlots.add(s);
  }
  for (const id of guide.linkIds) {
    links.add(id);
    proLinks.add(id);
  }
  return { cities, slots, links, proLinks, proSlots };
}

export function developIndustriesFromGuide(guide: TrainingMapGuide | null): IndustryType[] {
  return guide?.developIndustries ?? [];
}
