import { useEffect } from 'react';
import type { InteractiveTutorialStep } from '../engine/tutorial/steps';
import { TUTORIAL_CHAPTERS } from '../engine/tutorial/steps';

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

export function TutorialCoach({
  step,
  stepIndex,
  total,
  hint,
  focus,
  isContinue,
  onContinue,
  onSkip,
}: {
  step: InteractiveTutorialStep | undefined;
  stepIndex: number;
  total: number;
  hint: string | null;
  focus?: string;
  isContinue: boolean;
  onContinue: () => void;
  onSkip: () => void;
}) {
  useEffect(() => {
    document.querySelectorAll('.tutorial-focus').forEach((el) => el.classList.remove('tutorial-focus'));
    if (!focus) return;
    const el = document.querySelector(`[data-testid="${focus}"]`);
    el?.classList.add('tutorial-focus');
    const isBoard = focus === 'board-viewport' || focus === 'board';
    if (!isBoard) {
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    return () => el?.classList.remove('tutorial-focus');
  }, [focus, stepIndex]);

  if (!step) return null;

  return (
    <div className="tutorial-coach" data-testid="tutorial-coach">
      <div className="tutorial-coach-inner panel">
        <div className="tutorial-coach-top">
          <span className="tutorial-coach-badge">
            Cap. {step.chapter}/{TUTORIAL_CHAPTERS.length} · {step.chapterTitle} · {stepIndex + 1}/{total}
          </span>
          <button type="button" className="tutorial-skip" onClick={onSkip} data-testid="tutorial-skip">
            Salir
          </button>
        </div>
        <h3 className="tutorial-coach-title">{step.title}</h3>
        <p className="tutorial-coach-body">{renderInline(step.body)}</p>
        {hint && (
          <p className="tutorial-coach-hint" data-testid="tutorial-hint">
            {hint}
          </p>
        )}
        {isContinue && (
          <button type="button" className="primary tutorial-continue" onClick={onContinue} data-testid="tutorial-continue">
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}

export function TutorialCompleteOverlay({ onPlay, onSetup }: { onPlay: () => void; onSetup: () => void }) {
  return (
    <div className="gameover" data-testid="tutorial-complete">
      <div className="panel pass-panel">
        <div className="pass-icon" style={{ background: 'var(--human-bg)', color: 'var(--human)' }}>
          🏆
        </div>
        <h2 style={{ margin: '0 0 8px' }}>¡Tutorial completado!</h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 20px' }}>
          Completaste los 6 capítulos: construir, vender, desarrollar, préstamo, explorar y reglas de partida. ¿Listo
          para jugar de verdad?
        </p>
        <div className="actions" style={{ justifyContent: 'center' }}>
          <button type="button" className="primary" onClick={onPlay} data-testid="tutorial-play">
            Nueva partida
          </button>
          <button type="button" onClick={onSetup}>
            Volver al menú
          </button>
        </div>
      </div>
    </div>
  );
}
