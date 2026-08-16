import { useEffect, useMemo, useRef, useState } from 'react';
import type { CoachFeedback } from '../engine/ai/coach';
import {
  loadCareerStats,
  summarizeSession,
  updateCareerAfterGame,
  type TrainingCareerStats,
} from '../engine/ai/trainingStats';
import { HUMAN, type PendingEraScore } from '../engine/state';
import { eraNombre } from '../i18n/es';
import { playEraSound, playVpSound } from './visual/sounds';
import { TrainingSummaryPanel } from './TrainingSummaryPanel';

interface Props {
  score: PendingEraScore;
  coachHistory: CoachFeedback[];
  onDismiss: () => void;
}

function trainingResult(score: PendingEraScore): 'win' | 'loss' | 'tie' {
  if (!score.ranking?.length) return 'loss';
  const winner = score.ranking[0];
  const you = score.ranking.find((r) => r.label === score.lines[HUMAN]?.label);
  if (!you) return 'loss';
  if (you.vp === winner.vp && score.ranking.filter((r) => r.vp === winner.vp).length === 1 && you.label === winner.label) {
    return 'win';
  }
  if (you.vp === winner.vp) return 'tie';
  return 'loss';
}

export function EraScoreOverlay({ score, coachHistory, onDismiss }: Props) {
  const [career, setCareer] = useState<TrainingCareerStats>(() => loadCareerStats());
  const careerUpdated = useRef(false);

  const sessionSummary = useMemo(
    () => (coachHistory.length > 0 ? summarizeSession(coachHistory) : null),
    [coachHistory],
  );

  useEffect(() => {
    playEraSound();
    playVpSound();
  }, []);

  useEffect(() => {
    if (!score.gameOver || !sessionSummary || careerUpdated.current) return;
    careerUpdated.current = true;
    setCareer(updateCareerAfterGame(sessionSummary, trainingResult(score)));
  }, [score.gameOver, score, sessionSummary]);

  const title = score.gameOver
    ? `Fin de partida — Era ${eraNombre(score.era)}`
    : `Puntuación — Era ${eraNombre(score.era)}`;

  return (
    <div className="era-score-backdrop" data-testid="era-score-overlay" role="dialog" aria-modal="true" aria-labelledby="era-score-title">
      <div className="era-score-modal panel">
        <h2 id="era-score-title">{title}</h2>
        {score.gameOver && score.resultMessage && <p className="era-score-result">{score.resultMessage}</p>}

        <table className="era-score-table">
          <thead>
            <tr>
              <th>Jugador</th>
              <th>Enlaces</th>
              <th>Industrias</th>
              <th>Total era</th>
              <th>PV total</th>
            </tr>
          </thead>
          <tbody>
            {score.lines.map((line) => (
              <tr key={line.playerId}>
                <td>{line.label}</td>
                <td>{line.linkVp > 0 ? `+${line.linkVp}` : '—'}</td>
                <td>{line.industryVp > 0 ? `+${line.industryVp}` : '—'}</td>
                <td>
                  <b>{line.totalVp > 0 ? `+${line.totalVp}` : '0'}</b>
                </td>
                <td>
                  <b>{line.vpAfter}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {score.ranking && score.ranking.length > 1 && (
          <ol className="era-score-ranking">
            {score.ranking.map((r, i) => (
              <li key={r.label}>
                {i + 1}. {r.label} — <b>{r.vp} PV</b>
              </li>
            ))}
          </ol>
        )}

        {score.gameOver && sessionSummary && <TrainingSummaryPanel session={sessionSummary} career={career} />}

        <button type="button" className="primary era-score-continue" onClick={onDismiss} data-testid="era-score-continue">
          {score.gameOver ? 'Volver al menú' : 'Continuar era Ferrocarril'}
        </button>
      </div>
    </div>
  );
}
