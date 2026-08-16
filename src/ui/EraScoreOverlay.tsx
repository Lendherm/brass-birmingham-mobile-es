import { useEffect, useMemo, useRef, useState } from 'react';
import type { CoachFeedback } from '../engine/ai/coach';
import type { AIDifficulty } from '../engine/ai/types';
import {
  loadCareerStats,
  summarizeSession,
  updateCareerAfterGame,
  type TrainingCareerStats,
} from '../engine/ai/trainingStats';
import { buildTrainingReplay, saveTrainingReplay } from '../engine/training/replay';
import { recommendedWeaknessDrill } from '../engine/training/weaknessDrills';
import type { TrainingScenarioId } from '../engine/training/scenarios';
import { HUMAN, type GameState, type PendingEraScore } from '../engine/state';
import { eraNombre } from '../i18n/es';
import { playEraSound, playVpSound } from './visual/sounds';
import { TrainingSummaryPanel } from './TrainingSummaryPanel';
import { TrainingReviewOverlay } from './TrainingReviewOverlay';

interface Props {
  score: PendingEraScore;
  coachHistory: CoachFeedback[];
  replaySnapshots: GameState[];
  aiDifficulty?: AIDifficulty;
  onDismiss: () => void;
  onStartWeaknessDrill?: (scenarioId: TrainingScenarioId, difficulty: AIDifficulty) => void;
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

export function EraScoreOverlay({
  score,
  coachHistory,
  replaySnapshots,
  aiDifficulty = 'medium',
  onDismiss,
  onStartWeaknessDrill,
}: Props) {
  const [career, setCareer] = useState<TrainingCareerStats>(() => loadCareerStats());
  const [reviewOpen, setReviewOpen] = useState(false);
  const careerUpdated = useRef(false);
  const replaySaved = useRef(false);

  const sessionSummary = useMemo(
    () => (coachHistory.length > 0 ? summarizeSession(coachHistory) : null),
    [coachHistory],
  );

  const replay = useMemo(
    () =>
      buildTrainingReplay(coachHistory, replaySnapshots, {
        difficulty: aiDifficulty,
        result: score.gameOver ? trainingResult(score) : undefined,
      }),
    [coachHistory, replaySnapshots, aiDifficulty, score],
  );

  useEffect(() => {
    playEraSound();
    playVpSound();
  }, []);

  useEffect(() => {
    if (!score.gameOver || !sessionSummary || careerUpdated.current) return;
    careerUpdated.current = true;
    setCareer(updateCareerAfterGame(sessionSummary, trainingResult(score), aiDifficulty, coachHistory));
  }, [score.gameOver, score, sessionSummary, aiDifficulty, coachHistory]);

  useEffect(() => {
    if (!score.gameOver || !replay || replaySaved.current) return;
    replaySaved.current = true;
    saveTrainingReplay(replay);
  }, [score.gameOver, replay]);

  const weaknessDrill = recommendedWeaknessDrill(career);

  const title = score.gameOver
    ? `Fin de partida — Era ${eraNombre(score.era)}`
    : `Puntuación — Era ${eraNombre(score.era)}`;

  return (
    <>
      {reviewOpen && replay && <TrainingReviewOverlay replay={replay} onClose={() => setReviewOpen(false)} />}
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

          {score.gameOver && sessionSummary && (
            <TrainingSummaryPanel
              session={sessionSummary}
              career={career}
              onOpenReview={replay ? () => setReviewOpen(true) : undefined}
              onStartWeaknessDrill={
                weaknessDrill && onStartWeaknessDrill
                  ? () => onStartWeaknessDrill(weaknessDrill.scenarioId, aiDifficulty)
                  : undefined
              }
              weaknessDrillLabel={weaknessDrill?.label}
            />
          )}

          {score.gameOver && replay && (
            <button
              type="button"
              className="training-review-launch"
              onClick={() => setReviewOpen(true)}
              data-testid="open-training-review"
            >
              Repaso jugada a jugada ({replay.coachHistory.length})
            </button>
          )}

          <button type="button" className="primary era-score-continue" onClick={onDismiss} data-testid="era-score-continue">
            {score.gameOver ? 'Volver al menú' : 'Continuar era Ferrocarril'}
          </button>
        </div>
      </div>
    </>
  );
}
