import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '../engine/state';
import { classifyGameLog, logLineClass } from '../engine/gameHistory';
import { PLAYER_COLORS } from '../i18n/es';

interface Props {
  state: GameState;
}

export function GameHistory({ state }: Props) {
  const [hidden, setHidden] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDetailsElement>(null);
  const lines = useMemo(() => classifyGameLog(state).slice().reverse(), [state.log, state.playerNames]);

  useEffect(() => {
    if (!expanded) return;
    rootRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [expanded]);

  if (hidden) {
    return (
      <button type="button" className="game-history-reopen" onClick={() => setHidden(false)} data-testid="game-history-reopen">
        Ver historial de partida ({state.log.length})
      </button>
    );
  }

  const legend = state.playerNames.map((name, id) => ({
    id,
    name,
    color: PLAYER_COLORS[id] ?? 'var(--muted)',
  }));

  return (
    <details ref={rootRef} className={`panel game-history${expanded ? ' is-expanded' : ''}`} data-testid="game-history" open>
      <summary className="game-history-summary">
        <span>Historial de partida</span>
        <span className="game-history-actions">
          <button
            type="button"
            className="game-history-expand"
            aria-label={expanded ? 'Compactar historial' : 'Ampliar historial'}
            aria-pressed={expanded}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? 'Compactar' : 'Ampliar'}
          </button>
          <button
            type="button"
            className="game-history-close"
            aria-label="Cerrar historial"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHidden(true);
              setExpanded(false);
            }}
          >
            ×
          </button>
        </span>
      </summary>

      <div className="game-history-legend" aria-hidden>
        {legend.map((item) => (
          <span key={item.id} className={`game-history-legend-item game-history-line-p${item.id}`}>
            {item.name}
          </span>
        ))}
        <span className="game-history-legend-item game-history-line-system">Sistema</span>
      </div>

      <div className={`game-history-log${expanded ? ' is-expanded' : ''}`} data-testid="game-history-log">
        {lines.length === 0 ? (
          <p className="game-history-empty">Aún no hay acciones registradas.</p>
        ) : (
          lines.map((line) => (
            <div key={line.index} className={logLineClass(line.playerId)}>
              {line.text}
            </div>
          ))
        )}
      </div>
    </details>
  );
}
