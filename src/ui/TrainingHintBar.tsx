import type { TrainingHint } from '../engine/training/trainingHints';
import type { TrainingScenarioId } from '../engine/training/scenarios';

const PHASE_LABEL: Record<'now' | 'next' | 'later', string> = {
  now: 'Ahora',
  next: 'Siguiente',
  later: 'Después',
};

interface Props {
  hint: TrainingHint;
  onDismiss?: () => void;
  onStartDrill?: (scenarioId: TrainingScenarioId) => void;
  onShowOnMap?: () => void;
  onResetMapView?: () => void;
  mapFocused?: boolean;
  className?: string;
}

export function TrainingHintBar({
  hint,
  onDismiss,
  onStartDrill,
  onShowOnMap,
  onResetMapView,
  mapFocused,
  className,
}: Props) {
  return (
    <div
      className={['training-hint-bar', className].filter(Boolean).join(' ')}
      data-testid="training-hint-bar"
      data-kind={hint.kind}
      role="status"
      aria-live="polite"
    >
      {hint.qualityPct != null && (
        <div className="training-hint-quality" aria-label={`Calidad de jugada ${hint.qualityPct} por ciento`}>
          <span className="training-hint-pct">{hint.qualityPct}%</span>
          <span className="training-hint-pct-label">
            {hint.kind === 'postmove' ? 'coach' : hint.kind === 'scenario' ? 'objetivo' : 'jugada'}
          </span>
        </div>
      )}
      <div className="training-hint-body">
        <p className="training-hint-headline">{hint.headline}</p>
        <p className="training-hint-detail">{hint.detail}</p>
        {hint.scenarioProgress && (
          <p className="training-scenario-status" data-status={hint.scenarioProgress.status} data-testid="scenario-progress">
            Estado: {hint.scenarioProgress.status === 'completed' ? 'completado' : hint.scenarioProgress.status === 'on-track' ? 'en camino' : hint.scenarioProgress.status === 'missed' ? 'perdido' : 'pendiente'}
          </p>
        )}
        {hint.bestLine && hint.kind !== 'block' && (
          <p className="training-hint-best">
            <span className="training-hint-best-label">{hint.kind === 'scenario' ? 'Siguiente paso' : 'Pro'}:</span>{' '}
            {hint.bestLine}
          </p>
        )}
        {hint.numericCompare && hint.numericCompare.length >= 2 && (
          <div className="training-hint-numeric" data-testid="training-hint-numeric">
            {hint.numericCompare.map((line) => (
              <div key={line.action} className="training-hint-numeric-line">
                <div className="training-hint-numeric-head">
                  <span>{line.label}</span>
                  <strong>{line.pct}%</strong>
                </div>
                <ul className="training-hint-numeric-bullets">
                  {line.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {hint.boardSummary && (
          <p className="training-hint-board-summary" data-testid="training-hint-board-summary">
            {hint.boardSummary}
          </p>
        )}
        {hint.strategyThemes && hint.strategyThemes.length > 0 && (
          <div className="training-hint-strategies" data-testid="training-hint-strategies">
            <p className="training-hint-section-label">Estrategias posibles</p>
            {hint.strategyThemes.map((theme) => (
              <div key={theme.id} className="training-hint-strategy-theme">
                <strong>{theme.title}</strong>
                <p>{theme.advice}</p>
              </div>
            ))}
          </div>
        )}
        {hint.cardStrategies && hint.cardStrategies.length > 0 && (
          <ul className="training-hint-card-list" data-testid="training-hint-cards">
            <li className="training-hint-section-label">Por carta en mano</li>
            {hint.cardStrategies.map((line) => (
              <li key={line.cardIdx} className="training-hint-card-line">
                <div className="training-hint-card-head">
                  <strong>{line.cardLabel}</strong>
                  {line.pct != null && <span>{line.pct}%</span>}
                </div>
                <span className="training-hint-card-play">{line.play}</span>
                <span className="training-hint-card-strategy">{line.strategy}</span>
              </li>
            ))}
          </ul>
        )}
        {hint.planSteps && hint.planSteps.length > 0 && (
          <ol className="training-hint-plan" data-testid="training-hint-plan">
            {hint.planSteps.map((step, i) => (
              <li key={i}>
                <span className="training-hint-plan-phase">{PHASE_LABEL[step.phase]}</span>
                <span className="training-hint-plan-label">{step.label}</span>
                <strong className="training-hint-plan-pct">{step.pct}%</strong>
              </li>
            ))}
          </ol>
        )}
        {hint.alternatives.length > 0 && (
          <div className="training-hint-alts" data-testid="training-hint-alts">
            {hint.alternatives.map((alt) => (
              <span key={alt.label} className="training-hint-alt">
                {alt.label} <strong>{alt.pct}%</strong>
              </span>
            ))}
          </div>
        )}
        {onShowOnMap && hint.mapGuide && (
          <button type="button" className="training-hint-map-btn" data-testid="training-hint-map" onClick={onShowOnMap}>
            Ver en mapa
          </button>
        )}
        {mapFocused && onResetMapView && (
          <button type="button" className="training-hint-map-btn training-hint-map-reset" onClick={onResetMapView}>
            Restablecer mapa
          </button>
        )}
        {hint.drillOffer && onStartDrill && (
          <button
            type="button"
            className="training-hint-drill"
            data-testid="training-hint-drill"
            onClick={() => onStartDrill(hint.drillOffer!.scenarioId)}
          >
            {hint.drillOffer.buttonLabel}
          </button>
        )}
      </div>
      {onDismiss && (
        <button type="button" className="training-hint-dismiss" aria-label="Cerrar coach" onClick={onDismiss}>
          ×
        </button>
      )}
    </div>
  );
}
