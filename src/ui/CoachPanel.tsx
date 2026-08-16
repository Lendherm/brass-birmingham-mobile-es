import type { CoachFeedback, CoachVerdict } from '../engine/ai/coach';

interface Props {
  feedback: CoachFeedback;
  onDismiss?: () => void;
}

const VERDICT_LABEL: Record<CoachVerdict, string> = {
  excellent: 'Excelente',
  good: 'Buena',
  ok: 'Mejorable',
  mistake: 'Revisar',
};

export function CoachPanel({ feedback, onDismiss }: Props) {
  return (
    <div className={`panel training-coach training-coach-${feedback.verdict}`} data-testid="training-coach">
      <div className="training-coach-header">
        <div>
          <h3>Entrenador</h3>
          <p className="training-coach-meta">
            Ronda {feedback.turn} · {feedback.actionsLeftBefore}{' '}
            {feedback.actionsLeftBefore === 1 ? 'acción' : 'acciones'} antes de jugar
          </p>
        </div>
        <span className={`training-coach-badge training-coach-badge-${feedback.verdict}`}>
          {VERDICT_LABEL[feedback.verdict]}
        </span>
        {onDismiss && (
          <button
            type="button"
            className="training-coach-close"
            onClick={onDismiss}
            aria-label="Ocultar entrenador"
            data-testid="training-coach-close"
          >
            ×
          </button>
        )}
      </div>

      <p className="training-coach-summary">{feedback.summary}</p>

      {feedback.beliefHint && (
        <p className="training-coach-belief" data-testid="training-coach-belief">
          {feedback.beliefHint}
        </p>
      )}

      <p className="training-coach-confidence" data-testid="training-coach-confidence">
        Confianza del entrenador: <strong>{feedback.confidence}%</strong>
      </p>

      <div className="training-coach-compare">
        <div className="training-coach-line">
          <span className="training-coach-label">Tu jugada</span>
          <strong>{feedback.yourLabel}</strong>
          <ul>
            {feedback.yourReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        {feedback.verdict !== 'excellent' && (
          <div className="training-coach-line training-coach-best">
            <span className="training-coach-label">Mejor línea (IA)</span>
            <strong>{feedback.bestLabel}</strong>
            <ul>
              {feedback.bestReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {feedback.alternatives.length > 0 && feedback.verdict !== 'excellent' && (
        <details className="training-coach-alts">
          <summary>Otras opciones evaluadas</summary>
          <ol>
            {feedback.alternatives.map((alt) => (
              <li key={alt.label}>
                {alt.label} <span className="training-coach-score">≈{Math.round(alt.score)}</span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
