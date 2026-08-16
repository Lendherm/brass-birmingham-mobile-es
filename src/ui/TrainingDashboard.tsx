import { useState } from 'react';
import type { AIDifficulty } from '../engine/ai/types';
import {
  loadCareerStats,
  loadWeeklyGoalSettings,
  mistakeRate,
  saveWeeklyGoalSettings,
  topWeaknesses,
  weeklyGoalSummary,
  winRate,
  type TrainingCareerStats,
  type WeeklyGoalSettings,
} from '../engine/ai/trainingStats';
import { loadTrainingReplay } from '../engine/training/replay';
import { recommendedWeaknessDrill } from '../engine/training/weaknessDrills';
import type { TrainingScenarioId } from '../engine/training/scenarios';
import { TrainingReviewOverlay } from './TrainingReviewOverlay';

const DIFF_LABEL: Record<AIDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
  tournament: 'Torneo',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onStartWeaknessDrill?: (scenarioId: TrainingScenarioId, difficulty: AIDifficulty) => void;
}

export function TrainingDashboardModal({ open, onClose, onStartWeaknessDrill }: Props) {
  const [career] = useState<TrainingCareerStats>(() => loadCareerStats());
  const [goalSettings, setGoalSettings] = useState<WeeklyGoalSettings>(() => loadWeeklyGoalSettings());
  const [reviewOpen, setReviewOpen] = useState(false);
  const weaknesses = topWeaknesses(career);
  const weekly = weeklyGoalSummary(career.weekly, goalSettings);
  const drill = recommendedWeaknessDrill(career);
  const savedReplay = loadTrainingReplay();

  const persistGoals = (next: WeeklyGoalSettings) => {
    setGoalSettings(next);
    saveWeeklyGoalSettings(next);
  };

  if (!open) return null;

  return (
    <>
      {reviewOpen && savedReplay && <TrainingReviewOverlay replay={savedReplay} onClose={() => setReviewOpen(false)} />}
      <div className="gameover" onClick={onClose} data-testid="training-dashboard">
        <div className="panel training-dashboard" onClick={(e) => e.stopPropagation()}>
          <header className="training-dashboard-header">
            <h2 style={{ margin: 0 }}>Panel de entrenamiento</h2>
            <button type="button" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </header>

          <div className="training-dashboard-grid">
            <div className="training-dashboard-stat">
              <span className="training-dashboard-label">Elo local</span>
              <strong data-testid="training-elo">{career.elo}</strong>
            </div>
            <div className="training-dashboard-stat">
              <span className="training-dashboard-label">Winrate</span>
              <strong>{winRate(career)}%</strong>
            </div>
            <div className="training-dashboard-stat">
              <span className="training-dashboard-label">Error / jugada</span>
              <strong>{mistakeRate(career)}%</strong>
            </div>
            <div className="training-dashboard-stat">
              <span className="training-dashboard-label">Partidas</span>
              <strong>{career.games}</strong>
            </div>
          </div>

          <section className="training-dashboard-section" data-testid="weekly-goals">
            <h3>Metas semanales ({career.weekly.weekId})</h3>
            <div className="weekly-goals-settings">
              <label>
                Partidas vs IA
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={goalSettings.targetGames}
                  onChange={(e) =>
                    persistGoals({ ...goalSettings, targetGames: Math.max(1, Number(e.target.value) || 1) })
                  }
                  data-testid="goal-target-games"
                />
              </label>
              <label>
                Error máximo (%)
                <input
                  type="number"
                  min={5}
                  max={40}
                  value={goalSettings.maxMistakeRate}
                  onChange={(e) =>
                    persistGoals({
                      ...goalSettings,
                      maxMistakeRate: Math.min(40, Math.max(5, Number(e.target.value) || 15)),
                    })
                  }
                  data-testid="goal-max-mistake"
                />
              </label>
              <label>
                Victorias vs Torneo
                <input
                  type="number"
                  min={0}
                  max={7}
                  value={goalSettings.targetTournamentWins}
                  onChange={(e) =>
                    persistGoals({
                      ...goalSettings,
                      targetTournamentWins: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  data-testid="goal-tournament-wins"
                />
              </label>
            </div>
            <ul className="training-dashboard-goals">
              <li className={weekly.gamesMet ? 'goal-met' : ''}>
                Jugar {goalSettings.targetGames} partidas — {career.weekly.gamesPlayed}/{goalSettings.targetGames}
                {weekly.gamesLeft > 0 ? ` (faltan ${weekly.gamesLeft})` : ' ✓'}
              </li>
              <li className={weekly.accuracyMet ? 'goal-met' : ''}>
                Error ≤{goalSettings.maxMistakeRate}% — actual {weekly.mistakeRate}%
                {weekly.accuracyMet ? ' ✓' : career.weekly.moves < 5 ? ' (mín. 5 jugadas)' : ''}
              </li>
              {goalSettings.targetTournamentWins > 0 && (
                <li className={weekly.tournamentMet ? 'goal-met' : ''}>
                  Victorias Torneo — {career.weekly.tournamentWins}/{goalSettings.targetTournamentWins}
                  {weekly.tournamentLeft > 0 ? ` (faltan ${weekly.tournamentLeft})` : ' ✓'}
                </li>
              )}
            </ul>
          </section>

          <section className="training-dashboard-section">
            <h3>Resultados por dificultad</h3>
            <ul className="training-dashboard-diff">
              {(['easy', 'medium', 'hard', 'tournament'] as AIDifficulty[]).map((d) => {
                const rec = career.byDifficulty[d];
                const total = rec.wins + rec.losses + rec.ties;
                return (
                  <li key={d}>
                    {DIFF_LABEL[d]}: {rec.wins}V / {rec.losses}D / {rec.ties}E
                    {total > 0 ? ` (${Math.round((rec.wins / total) * 100)}%)` : ''}
                  </li>
                );
              })}
            </ul>
          </section>

          {weaknesses.length > 0 && (
            <section className="training-dashboard-section">
              <h3>Debilidades frecuentes</h3>
              <ol>
                {weaknesses.map((w) => (
                  <li key={w.label}>
                    {w.label} — {w.count}×
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="training-dashboard-actions">
            {savedReplay && (
              <button type="button" onClick={() => setReviewOpen(true)} data-testid="dashboard-open-review">
                Repaso última partida ({savedReplay.coachHistory.length} jugadas)
              </button>
            )}
            {drill && onStartWeaknessDrill && (
              <button
                type="button"
                className="primary"
                onClick={() => {
                  onStartWeaknessDrill(drill.scenarioId, 'medium');
                  onClose();
                }}
                data-testid="dashboard-weakness-drill"
              >
                Drill: {drill.label} → {drill.scenarioTitle}
              </button>
            )}
          </div>

          {career.recentMistakes.length > 0 && (
            <section className="training-dashboard-section">
              <h3>Repaso de errores recientes</h3>
              <ol className="training-dashboard-mistakes">
                {career.recentMistakes.slice(0, 10).map((m, i) => (
                  <li key={`${m.turn}-${i}`}>
                    Ronda {m.turn}: {m.yourLabel} → {m.bestLabel}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {career.games === 0 && (
            <p className="training-dashboard-empty">Juega partidas Contra IA con entrenador 🎓 para llenar estadísticas.</p>
          )}
        </div>
      </div>
    </>
  );
}

export function TrainingDashboardButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="training-dashboard-btn" onClick={onOpen} data-testid="training-dashboard-open">
      📊 Entrenamiento
    </button>
  );
}
