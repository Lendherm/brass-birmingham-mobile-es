import type { TrainingCareerStats, TrainingSessionSummary } from '../engine/ai/trainingStats';
import { winRate } from '../engine/ai/trainingStats';

interface Props {
  session: TrainingSessionSummary;
  career: TrainingCareerStats;
}

export function TrainingSummaryPanel({ session, career }: Props) {
  if (session.moves === 0) return null;

  return (
    <div className="training-summary panel" data-testid="training-summary">
      <h3>Resumen de entrenamiento</h3>
      <p className="training-summary-meta">
        {session.moves} jugadas analizadas · error medio ≈{session.avgDelta.toFixed(1)} pts
      </p>

      <div className="training-summary-bars">
        <span className="training-bar training-bar-excellent">Excelente {session.excellent}</span>
        <span className="training-bar training-bar-good">Buena {session.good}</span>
        <span className="training-bar training-bar-ok">Mejorable {session.ok}</span>
        <span className="training-bar training-bar-mistake">Revisar {session.mistakes}</span>
      </div>

      {session.topIssues.length > 0 && (
        <div className="training-summary-issues">
          <strong>Patrones a corregir</strong>
          <ul>
            {session.topIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {session.mistakes > 0 && (
        <details className="training-summary-moves">
          <summary>Jugadas a revisar ({session.mistakes})</summary>
          <ol>
            {session.records
              .filter((r) => r.verdict === 'mistake' || r.verdict === 'ok')
              .slice(0, 8)
              .map((r) => (
                <li key={`${r.turn}-${r.yourLabel}`}>
                  Ronda {r.turn}: {r.yourLabel} → mejor: {r.bestLabel}
                </li>
              ))}
          </ol>
        </details>
      )}

      <div className="training-career" data-testid="training-career">
        <strong>Carrera vs IA</strong>
        <p>
          {career.games} partidas · {career.wins} victorias · {winRate(career)}% winrate · racha actual{' '}
          {career.currentStreak} (mejor {career.bestStreak})
        </p>
      </div>
    </div>
  );
}
