import type { GameState } from '../engine/state';
import { PLAYER_COLORS } from '../i18n/es';

interface Props {
  state: GameState;
  onReady: () => void;
}

export function PassScreen({ state, onReady }: Props) {
  const id = state.currentPlayer;
  const name = state.playerNames[id];
  const color = PLAYER_COLORS[id] ?? '#888';

  return (
    <div className="gameover pass-screen" data-testid="pass-screen">
      <div className="panel pass-panel">
        <div className="pass-icon" style={{ background: color }}>
          📱
        </div>
        <h2>Pasa el teléfono</h2>
        <p className="pass-player" style={{ color }}>
          Turno de <strong>{name}</strong>
        </p>
        <p style={{ color: 'var(--muted)', margin: '0 0 20px' }}>
          No mires la pantalla hasta que sea tu turno. Cuando tengas el teléfono, confirma abajo.
        </p>
        <button className="primary" onClick={onReady} data-testid="pass-ready">
          Estoy listo — soy {name}
        </button>
      </div>
    </div>
  );
}
