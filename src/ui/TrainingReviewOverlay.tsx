import { useMemo, useState } from 'react';
import type { TrainingReplay } from '../engine/training/replay';
import { clampReplayIndex, replayMistakeIndices } from '../engine/training/replay';
import { HUMAN } from '../engine/state';
import { BoardMap } from './BoardMap';
import { PanZoomBoard } from './PanZoomBoard';
import { CoachPanel } from './CoachPanel';
import { PlayerPanel } from './PlayerPanel';
import { PlayerMat } from './PlayerMat';
import { MarketDisplay } from './MarketDisplay';

interface Props {
  replay: TrainingReplay;
  onClose: () => void;
}

export function TrainingReviewOverlay({ replay, onClose }: Props) {
  const mistakes = useMemo(() => replayMistakeIndices(replay), [replay]);
  const [onlyMistakes, setOnlyMistakes] = useState(false);
  const indices = onlyMistakes && mistakes.length > 0 ? mistakes : replay.coachHistory.map((_, i) => i);
  const [pos, setPos] = useState(0);
  const index = clampReplayIndex(replay, indices[Math.min(pos, indices.length - 1)] ?? 0);
  const state = replay.snapshots[index];
  const feedback = replay.coachHistory[index];

  const goPrev = () => setPos((p) => Math.max(0, p - 1));
  const goNext = () => setPos((p) => Math.min(indices.length - 1, p + 1));

  return (
    <div className="training-review-backdrop" data-testid="training-review" role="dialog" aria-modal="true">
      <div className="training-review panel">
        <header className="training-review-header">
          <div>
            <h2 style={{ margin: 0 }}>Repaso jugada a jugada</h2>
            <p className="training-review-meta">
              Posición {pos + 1} / {indices.length} · Ronda {feedback.turn} · Era{' '}
              {state.era === 'canal' ? 'Canal' : 'Ferrocarril'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar repaso">
            ✕
          </button>
        </header>

        <label className="training-review-filter">
          <input
            type="checkbox"
            checked={onlyMistakes}
            onChange={(e) => {
              setOnlyMistakes(e.target.checked);
              setPos(0);
            }}
            disabled={mistakes.length === 0}
          />
          Solo jugadas a revisar ({mistakes.length})
        </label>

        <div className="training-review-body">
          <div className="training-review-map board-wrap">
            <PanZoomBoard viewRevision={index}>
              <BoardMap state={state} />
            </PanZoomBoard>
          </div>
          <aside className="training-review-side">
            <PlayerPanel state={state} />
            <CoachPanel feedback={feedback} />
            <PlayerMat state={state} />
            <MarketDisplay coalCubes={state.coalCubes} ironCubes={state.ironCubes} />
            <p className="training-review-hand">
              Mano ({state.players[HUMAN].hand.length} cartas) · £{state.players[HUMAN].money} ·{' '}
              {state.players[HUMAN].vp} PV
            </p>
          </aside>
        </div>

        <nav className="training-review-nav">
          <button type="button" onClick={goPrev} disabled={pos === 0} data-testid="review-prev">
            ← Anterior
          </button>
          <button type="button" onClick={goNext} disabled={pos >= indices.length - 1} data-testid="review-next">
            Siguiente →
          </button>
          <button type="button" className="primary" onClick={onClose}>
            Terminar repaso
          </button>
        </nav>
      </div>
    </div>
  );
}
