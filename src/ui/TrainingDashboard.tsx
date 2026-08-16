import { useState } from 'react';
import type { AIDifficulty } from '../engine/ai/types';
import {
  loadCareerStats,
  mistakeRate,
  topWeaknesses,
  winRate,
  type TrainingCareerStats,
} from '../engine/ai/trainingStats';

const DIFF_LABEL: Record<AIDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
  tournament: 'Torneo',
};

export function TrainingDashboardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [career] = useState<TrainingCareerStats>(() => loadCareerStats());
  const weaknesses = topWeaknesses(career);

  if (!open) return null;

  return (
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
  );
}

export function TrainingDashboardButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="training-dashboard-btn" onClick={onOpen} data-testid="training-dashboard-open">
      📊 Entrenamiento
    </button>
  );
}
