import { useEffect } from 'react';
import type { PendingEraScore } from '../engine/state';
import { eraNombre } from '../i18n/es';
import { playEraSound, playVpSound } from './visual/sounds';

interface Props {
  score: PendingEraScore;
  onDismiss: () => void;
}

export function EraScoreOverlay({ score, onDismiss }: Props) {
  useEffect(() => {
    playEraSound();
    playVpSound();
  }, []);

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

        <button type="button" className="primary era-score-continue" onClick={onDismiss} data-testid="era-score-continue">
          {score.gameOver ? 'Volver al menú' : 'Continuar era Ferrocarril'}
        </button>
      </div>
    </div>
  );
}
