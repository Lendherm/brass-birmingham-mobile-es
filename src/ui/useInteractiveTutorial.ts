import { useCallback, useEffect, useState } from 'react';
import type { PlayerAction } from '../engine/game';
import type { Card } from '../engine/state';
import type { SellChoice } from '../engine/options';
import {
  INTERACTIVE_TUTORIAL,
  matchAppliedAction,
  matchCard,
  stepApplyDevelopIndustry,
  stepApplySellTarget,
  stepExpectsActionPick,
  stepExpectsApply,
  stepFocus,
  stepIsContinue,
  type InteractiveTutorialStep,
  type TutorialActionKind,
} from '../engine/tutorial/steps';

export function useInteractiveTutorial(stepIndex: number, onAdvance: () => void, hand: Card[]) {
  const step = INTERACTIVE_TUTORIAL[stepIndex] as InteractiveTutorialStep | undefined;
  const [hint, setHint] = useState<string | null>(null);
  const total = INTERACTIVE_TUTORIAL.length;
  const done = stepIndex >= total;

  useEffect(() => {
    setHint(null);
  }, [stepIndex]);

  const wrong = useCallback(
    (msg?: string) => {
      setHint(msg || step?.wrongHint || 'Sigue las instrucciones del tutorial.');
    },
    [step],
  );

  const canPickAction = useCallback(
    (action: TutorialActionKind): boolean => {
      if (!step || stepIsContinue(step)) return false;
      if (step.step.type === 'pick-action') return step.step.action === action;
      return false;
    },
    [step],
  );

  const canPickCard = useCallback(
    (idx: number): boolean => {
      if (!step || step.step.type !== 'pick-card') return false;
      return matchCard(hand, idx, step.step);
    },
    [step, hand],
  );

  const shouldAdvanceOnCardPick = useCallback(
    (action: TutorialActionKind, cardIndex?: number): boolean => {
      if (action === 'pass' || action === 'loan') return false;
      if (action === 'scout' && cardIndex === 2) return false;
      return true;
    },
    [],
  );

  const guardChooseAction = useCallback(
    (action: TutorialActionKind): boolean => {
      if (!step || done) return true;
      if (stepIsContinue(step)) {
        wrong('Pulsa Continuar en la franja del tutorial.');
        return false;
      }
      if (step.step.type === 'pick-action') {
        if (step.step.action === action) {
          setHint(null);
          onAdvance();
          return true;
        }
        wrong();
        return false;
      }
      if (stepExpectsApply(step) || step.step.type === 'pick-card') {
        wrong('Completa el paso actual antes de cambiar de acción.');
        return false;
      }
      return true;
    },
    [step, done, onAdvance, wrong],
  );

  const guardChooseCard = useCallback(
    (idx: number): boolean => {
      if (!step || done) return true;
      if (step.step.type !== 'pick-card') {
        if (stepIsContinue(step)) wrong('Pulsa Continuar abajo.');
        else wrong();
        return false;
      }
      if (!matchCard(hand, idx, step.step)) {
        wrong();
        return false;
      }
      setHint(null);
      if (shouldAdvanceOnCardPick(step.step.action, step.step.cardIndex)) onAdvance();
      return true;
    },
    [step, done, hand, onAdvance, wrong, shouldAdvanceOnCardPick],
  );

  const guardToggleSale = useCallback(
    (choice: SellChoice): boolean => {
      if (!step || done || step.step.type !== 'apply-sell') return true;
      const ok = choice.sale.city === step.step.city && choice.sale.slot === step.step.slot;
      if (!ok) wrong('Selecciona la algodonera de Worcester.');
      return ok;
    },
    [step, done, wrong],
  );

  const guardToggleDevelop = useCallback(
    (industry: string): boolean => {
      if (!step || done || step.step.type !== 'apply-develop') return true;
      const ok = industry === step.step.industry;
      if (!ok) wrong();
      return ok;
    },
    [step, done, wrong],
  );

  const guardConfirmSell = useCallback(
    (salesCount: number): boolean => {
      if (!step || done || step.step.type !== 'apply-sell') return true;
      if (salesCount === 0) {
        wrong('Marca la algodonera antes de confirmar.');
        return false;
      }
      return true;
    },
    [step, done, wrong],
  );

  const guardConfirmDevelop = useCallback(
    (industries: string[]): boolean => {
      if (!step || done || step.step.type !== 'apply-develop') return true;
      const want = stepApplyDevelopIndustry(step);
      if (!want || !industries.includes(want)) {
        wrong();
        return false;
      }
      return true;
    },
    [step, done, wrong],
  );

  const guardDispatch = useCallback(
    (action: PlayerAction): string | null => {
      if (!step || done) return null;
      if (stepIsContinue(step)) return 'Pulsa Continuar en el tutorial.';
      if (stepExpectsApply(step)) {
        if (!matchAppliedAction(action, step)) return step.wrongHint;
        return null;
      }
      if (step.step.type === 'pick-action') return step.wrongHint;
      if (step.step.type === 'pick-card') {
        if (action.type === 'pass' && step.step.action === 'pass') return null;
        if (action.type === 'loan' && step.step.action === 'loan') return null;
        if (action.type === 'scout' && step.step.action === 'scout') return null;
        return step.wrongHint;
      }
      return null;
    },
    [step, done],
  );

  const onDispatched = useCallback(
    (action: PlayerAction) => {
      if (!step || done) return;
      if (stepExpectsApply(step) && matchAppliedAction(action, step)) onAdvance();
      else if (step.step.type === 'pick-card') {
        if (action.type === 'pass' || action.type === 'loan') onAdvance();
        if (action.type === 'scout' && step.step.cardIndex === 2) onAdvance();
      }
    },
    [step, done, onAdvance],
  );

  return {
    step,
    stepIndex,
    total,
    done,
    hint,
    focus: step ? stepFocus(step) : undefined,
    isContinue: step ? stepIsContinue(step) : false,
    expectsAction: step ? stepExpectsActionPick(step) : null,
    sellTarget: step ? stepApplySellTarget(step) : null,
    developIndustry: step ? stepApplyDevelopIndustry(step) : null,
    canPickAction,
    canPickCard,
    guardChooseAction,
    guardChooseCard,
    guardToggleSale,
    guardToggleDevelop,
    guardConfirmSell,
    guardConfirmDevelop,
    guardDispatch,
    onDispatched,
    clearHint: () => setHint(null),
  };
}
