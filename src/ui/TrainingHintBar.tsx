import { useEffect, useMemo, useState } from 'react';
import type { TrainingHint } from '../engine/training/trainingHints';
import type { TrainingScenarioId } from '../engine/training/scenarios';

const PHASE_LABEL: Record<'now' | 'next' | 'later', string> = {
  now: 'Ahora',
  next: 'Siguiente',
  later: 'Después',
};

type CoachTab = 'resumen' | 'comparar' | 'cartas' | 'plan';

const TAB_LABEL: Record<CoachTab, string> = {
  resumen: 'Resumen',
  comparar: 'Comparar',
  cartas: 'Cartas',
  plan: 'Plan',
};

function tabsForHint(hint: TrainingHint): CoachTab[] {
  const tabs: CoachTab[] = ['resumen'];
  if (hint.numericCompare && hint.numericCompare.length >= 2) tabs.push('comparar');
  if ((hint.cardStrategies?.length ?? 0) > 0 || (hint.strategyThemes?.length ?? 0) > 0) tabs.push('cartas');
  if ((hint.planSteps?.length ?? 0) > 0) tabs.push('plan');
  return tabs;
}

function defaultExpanded(kind: TrainingHint['kind']): boolean {
  return kind === 'block' || kind === 'postmove' || kind === 'scenario';
}

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
  const tabs = useMemo(() => tabsForHint(hint), [hint]);
  const [expanded, setExpanded] = useState(() => defaultExpanded(hint.kind));
  const [tab, setTab] = useState<CoachTab>('resumen');

  useEffect(() => {
    setExpanded(defaultExpanded(hint.kind));
    setTab('resumen');
  }, [hint.headline, hint.kind]);

  useEffect(() => {
    if (!tabs.includes(tab)) setTab('resumen');
  }, [tab, tabs]);

  const stripDetail =
    hint.bestLine && hint.kind !== 'block'
      ? hint.bestLine
      : hint.detail.length > 72
        ? `${hint.detail.slice(0, 69)}…`
        : hint.detail;

  return (
    <div
      className={['coach-dock', expanded ? 'coach-dock-open' : '', className].filter(Boolean).join(' ')}
      data-testid="training-hint-bar"
      data-kind={hint.kind}
      role="status"
      aria-live="polite"
    >
      <div className="coach-rail">
        {hint.qualityPct != null && (
          <div className="coach-rail-score" aria-label={`Calidad ${hint.qualityPct} por ciento`}>
            <span className="training-hint-pct">{hint.qualityPct}%</span>
          </div>
        )}
        <button
          type="button"
          className="coach-rail-main"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          data-testid="training-hint-toggle"
        >
          <span className="coach-rail-headline">{hint.headline}</span>
          <span className="coach-rail-sub">{stripDetail}</span>
        </button>
        <div className="coach-rail-actions">
          {onShowOnMap && hint.mapGuide && (
            <button
              type="button"
              className="coach-rail-icon"
              data-testid="training-hint-map"
              aria-label="Ver en mapa"
              title="Ver en mapa"
              onClick={onShowOnMap}
            >
              🗺
            </button>
          )}
          {mapFocused && onResetMapView && (
            <button type="button" className="coach-rail-icon" aria-label="Restablecer mapa" title="Restablecer mapa" onClick={onResetMapView}>
              ↺
            </button>
          )}
          <button
            type="button"
            className="coach-rail-icon coach-rail-expand"
            aria-label={expanded ? 'Contraer coach' : 'Expandir coach'}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? '▾' : '▴'}
          </button>
          {onDismiss && (
            <button type="button" className="coach-rail-icon" aria-label="Cerrar coach" onClick={onDismiss}>
              ×
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="coach-sheet">
          {tabs.length > 1 && (
            <div className="coach-tabs" role="tablist">
              {tabs.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className={`coach-tab${tab === id ? ' active' : ''}`}
                  onClick={() => setTab(id)}
                >
                  {TAB_LABEL[id]}
                </button>
              ))}
            </div>
          )}

          <div className="coach-sheet-body">
            {tab === 'resumen' && (
              <div className="coach-pane" data-testid="training-hint-pane-resumen">
                <p className="training-hint-detail">{hint.detail}</p>
                {hint.scenarioProgress && (
                  <p className="training-scenario-status" data-status={hint.scenarioProgress.status} data-testid="scenario-progress">
                    Estado:{' '}
                    {hint.scenarioProgress.status === 'completed'
                      ? 'completado'
                      : hint.scenarioProgress.status === 'on-track'
                        ? 'en camino'
                        : hint.scenarioProgress.status === 'missed'
                          ? 'perdido'
                          : 'pendiente'}
                  </p>
                )}
                {hint.bestLine && hint.kind !== 'block' && (
                  <p className="training-hint-best">
                    <span className="training-hint-best-label">{hint.kind === 'scenario' ? 'Siguiente paso' : 'Pro'}:</span>{' '}
                    {hint.bestLine}
                  </p>
                )}
                {hint.boardSummary && (
                  <p className="training-hint-board-summary" data-testid="training-hint-board-summary">
                    {hint.boardSummary}
                  </p>
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
            )}

            {tab === 'comparar' && hint.numericCompare && hint.numericCompare.length >= 2 && (
              <div className="coach-pane" data-testid="training-hint-numeric">
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

            {tab === 'cartas' && (
              <div className="coach-pane">
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
              </div>
            )}

            {tab === 'plan' && hint.planSteps && hint.planSteps.length > 0 && (
              <ol className="training-hint-plan coach-pane" data-testid="training-hint-plan">
                {hint.planSteps.map((step, i) => (
                  <li key={i}>
                    <span className="training-hint-plan-phase">{PHASE_LABEL[step.phase]}</span>
                    <span className="training-hint-plan-label">{step.label}</span>
                    <strong className="training-hint-plan-pct">{step.pct}%</strong>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
