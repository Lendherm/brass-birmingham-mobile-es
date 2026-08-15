import { useMemo, useState } from 'react';
import type { IndustryType } from '../engine/types';
import { activePlayer, type GameState } from '../engine/state';
import type { PlayerAction } from '../engine/game';
import {
  canLoan, legalBuilds, legalDevelops, legalNetworks, legalSells, scoutAllowed,
  type BuildChoice, type NetworkChoice, type SellChoice,
} from '../engine/options';

export { cardLabel } from './Card';

type ActionType = 'build' | 'network' | 'sell' | 'develop' | 'loan' | 'scout' | 'pass';

interface Flow {
  action: ActionType | null;
  cardIdx: number | null;
  sales: SellChoice[];
  develops: IndustryType[];
  scoutExtras: number[];
}

const EMPTY_FLOW: Flow = { action: null, cardIdx: null, sales: [], develops: [], scoutExtras: [] };

export function useActionFlow(state: GameState, dispatch: (action: PlayerAction) => string | null) {
  const [flow, setFlow] = useState<Flow>(EMPTY_FLOW);
  const [error, setError] = useState<string | null>(null);

  const builds = useMemo(() => legalBuilds(state), [state]);
  const networks = useMemo(() => legalNetworks(state), [state]);
  const sells = useMemo(() => legalSells(state), [state]);
  const develops = useMemo(() => legalDevelops(state), [state]);

  const hand = state.players[activePlayer(state)].hand;

  const reset = () => {
    setFlow(EMPTY_FLOW);
    setError(null);
  };

  const run = (action: PlayerAction) => {
    const err = dispatch(action);
    setError(err);
    if (!err) reset();
  };

  const cardBuilds = flow.cardIdx !== null ? builds.filter((b) => b.cardIdx === flow.cardIdx) : [];
  const buildableCardIndices = useMemo(() => new Set(builds.map((b) => b.cardIdx)), [builds]);
  const locationCardIndices = useMemo(
    () => new Set(hand.flatMap((c, i) => (c.kind === 'location' ? [i] : []))),
    [hand],
  );
  const pickableForBuild = useMemo(
    () => new Set([...buildableCardIndices, ...locationCardIndices]),
    [buildableCardIndices, locationCardIndices],
  );
  const activeBuildHighlights =
    flow.action === 'build' ? (flow.cardIdx !== null ? cardBuilds : builds) : [];

  const availability: Record<ActionType, boolean> = {
    build: builds.length > 0,
    network: networks.length > 0,
    sell: sells.length > 0,
    develop: develops.length > 0,
    loan: canLoan(state),
    scout: scoutAllowed(state),
    pass: hand.length > 0,
  };

  const cardsSelectable = useMemo(() => {
    if (flow.action === 'build') return pickableForBuild;
    if (flow.action) return new Set(hand.map((_, i) => i));
    return pickableForBuild;
  }, [flow.action, pickableForBuild, hand]);

  const highlightCities = new Set<string>(activeBuildHighlights.map((b) => b.option.city));
  const highlightBuildSlots = new Set<string>(
    activeBuildHighlights.map((b) => `${b.option.city}:${b.option.slot}`),
  );
  const highlightLinks = new Set<string>(
    flow.action === 'network' ? networks.map((n) => n.option.linkIds[0]) : [],
  );

  function chooseAction(action: ActionType) {
    setError(null);
    setFlow({ ...EMPTY_FLOW, action });
  }

  function chooseCard(cardIdx: number) {
    if (!flow.action) {
      if (pickableForBuild.has(cardIdx)) {
        setFlow({ action: 'build', cardIdx, sales: [], develops: [], scoutExtras: [] });
      }
      return;
    }
    if (flow.action === 'scout') {
      if (flow.cardIdx === null) {
        setFlow({ ...flow, cardIdx });
      } else if (cardIdx !== flow.cardIdx && flow.scoutExtras.length < 2 && !flow.scoutExtras.includes(cardIdx)) {
        const extras = [...flow.scoutExtras, cardIdx];
        if (extras.length === 2) {
          run({ type: 'scout', cardIdx: flow.cardIdx, extraDiscards: extras as [number, number] });
        } else {
          setFlow({ ...flow, scoutExtras: extras });
        }
      }
      return;
    }
    if (flow.action === 'loan') {
      run({ type: 'loan', cardIdx });
      return;
    }
    if (flow.action === 'pass') {
      run({ type: 'pass', cardIdx });
      return;
    }
    setFlow({ ...flow, cardIdx });
  }

  function chooseBuild(choice: BuildChoice) {
    run({ type: 'build', cardIdx: choice.cardIdx, option: choice.option });
  }

  function chooseNetwork(choice: NetworkChoice) {
    if (flow.cardIdx === null) return;
    run({ type: 'network', cardIdx: flow.cardIdx, option: choice.option });
  }

  function toggleSale(choice: SellChoice) {
    const key = (c: SellChoice) => `${c.sale.city}:${c.sale.slot}`;
    const exists = flow.sales.some((s) => key(s) === key(choice));
    setFlow({
      ...flow,
      sales: exists ? flow.sales.filter((s) => key(s) !== key(choice)) : [...flow.sales, choice],
    });
  }

  function confirmSell() {
    if (flow.cardIdx === null || flow.sales.length === 0) return;
    run({
      type: 'sell',
      cardIdx: flow.cardIdx,
      sales: flow.sales.map((s) => ({ sale: s.sale, beer: s.beer })),
    });
  }

  function toggleDevelop(industry: IndustryType) {
    const exists = flow.develops.includes(industry);
    const next = exists ? flow.develops.filter((i) => i !== industry) : [...flow.develops, industry].slice(0, 2);
    setFlow({ ...flow, develops: next });
  }

  function confirmDevelop() {
    if (flow.cardIdx === null || flow.develops.length === 0) return;
    run({ type: 'develop', cardIdx: flow.cardIdx, industries: flow.develops });
  }

  return {
    flow, error, reset, availability, cardsSelectable,
    allBuilds: builds, cardBuilds, builds: activeBuildHighlights, networks, sells, develops,
    highlightCities, highlightBuildSlots, highlightLinks,
    chooseAction, chooseCard, chooseBuild, chooseNetwork,
    toggleSale, confirmSell, toggleDevelop, confirmDevelop,
  };
}
