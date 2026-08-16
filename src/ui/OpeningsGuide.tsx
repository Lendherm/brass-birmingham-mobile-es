import { useCallback, useState, type ReactNode } from 'react';
import { OPENING_LIBRARIES, openingsFor, type OpeningPlan } from '../i18n/openings';

function renderBody(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(<strong key={`b${i}`}>{part.slice(2, -2)}</strong>);
      return;
    }
    part.split('\n').forEach((line, j) => {
      if (j > 0) nodes.push(<br key={`br-${i}-${j}`} />);
      nodes.push(<span key={`t-${i}-${j}`}>{line}</span>);
    });
  });
  return nodes;
}

function PlanView({ plan }: { plan: OpeningPlan }) {
  return (
    <article className="openings-plan">
      <p className="openings-plan-summary">{plan.summary}</p>
      <ul>
        {plan.bullets.map((b) => (
          <li key={b}>{renderBody(b)}</li>
        ))}
      </ul>
    </article>
  );
}

export function OpeningsGuideModal({
  open,
  onClose,
  playerCount = 2,
}: {
  open: boolean;
  onClose: () => void;
  playerCount?: 2 | 3 | 4;
}) {
  const [planIdx, setPlanIdx] = useState(0);
  const [count, setCount] = useState(playerCount);
  const activeLibrary = openingsFor(count);
  const plan = activeLibrary.plans[planIdx] ?? activeLibrary.plans[0];

  const go = useCallback((idx: number) => {
    setPlanIdx(Math.max(0, Math.min(activeLibrary.plans.length - 1, idx)));
  }, [activeLibrary.plans.length]);

  if (!open || !plan) return null;

  return (
    <div className="gameover" onClick={onClose} data-testid="openings-modal">
      <div className="panel tutorial-panel strategy-panel openings-panel" onClick={(e) => e.stopPropagation()}>
        <header className="tutorial-header">
          <div>
            <h2 style={{ margin: 0 }}>Biblioteca de aperturas</h2>
            <p className="tutorial-progress">
              {count} jugadores · plan {planIdx + 1}/{activeLibrary.plans.length}: {plan.title}
            </p>
          </div>
          <button type="button" onClick={onClose} data-testid="openings-close" aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="openings-count-picker">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              className={count === n ? 'active' : ''}
              onClick={() => {
                setCount(n as 2 | 3 | 4);
                setPlanIdx(0);
              }}
            >
              {n}p
            </button>
          ))}
        </div>

        <p className="openings-intro">{activeLibrary.intro}</p>

        <nav className="openings-index" aria-label="Planes de apertura">
          {activeLibrary.plans.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={i === planIdx ? 'selected' : ''}
              onClick={() => go(i)}
            >
              {p.title}
            </button>
          ))}
        </nav>

        <div className="tutorial-content strategy-content">
          <h3 className="tutorial-step-title">{plan.title}</h3>
          <PlanView plan={plan} />
        </div>

        <footer className="tutorial-footer">
          <button type="button" disabled={planIdx === 0} onClick={() => go(planIdx - 1)}>
            ← Anterior
          </button>
          <button type="button" disabled={planIdx >= activeLibrary.plans.length - 1} onClick={() => go(planIdx + 1)}>
            Siguiente →
          </button>
        </footer>
      </div>
    </div>
  );
}

export function OpeningsGuideButton({
  playerCount = 2,
  compact,
}: {
  playerCount?: 2 | 3 | 4;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={compact ? 'topbar-compact-btn' : 'openings-guide-btn'}
        onClick={() => setOpen(true)}
        data-testid="openings-guide-open"
      >
        {compact ? '📖' : '📖 Aperturas'}
      </button>
      <OpeningsGuideModal open={open} onClose={() => setOpen(false)} playerCount={playerCount} />
    </>
  );
}

export { OPENING_LIBRARIES };
