import { isFullBrass, nextRoundTurnOrder, roundSpending, type GameState } from '../engine/state';
import { PLAYER_COLORS } from '../i18n/es';

export const ROUND_SPENDING_TOOLTIP =
  'Gasto en libras esta ronda (construir, red, mercado). Al terminar la ronda, actúa primero quien gastó menos; en empate, quien ya tenía prioridad.';

export function RoundSpendingStat({ state, playerId }: { state: GameState; playerId: number }) {
  if (!isFullBrass(state)) return null;

  const spent = roundSpending(state, playerId);
  const leads = nextRoundTurnOrder(state)[0] === playerId;

  return (
    <span
      className={`stat-spent${leads ? ' stat-spent-leads' : ''}`}
      data-testid={`round-spent-${playerId}`}
      title={ROUND_SPENDING_TOOLTIP + (leads ? ' Irás primero la próxima ronda.' : '')}
    >
      Gastado <b>£{spent}</b>
      {leads && (
        <span className="stat-spent-badge" aria-label="Primero la próxima ronda">
          1º
        </span>
      )}
    </span>
  );
}

export function RoundSpendingTopbar({ state }: { state: GameState }) {
  if (!isFullBrass(state)) return null;

  const order = nextRoundTurnOrder(state);

  return (
    <span className="stat round-spending-topbar" data-testid="round-spending-topbar" title={ROUND_SPENDING_TOOLTIP}>
      <span className="round-spending-label">Próx. orden</span>
      {order.map((pid, i) => (
        <span key={pid} className={`round-spending-chip${i === 0 ? ' leads' : ''}`}>
          {i > 0 && <span className="round-spending-sep" aria-hidden>→</span>}
          <span className="round-spending-name" style={{ color: PLAYER_COLORS[pid] }}>
            {state.playerNames[pid]}
          </span>
          <b className="round-spending-amount">£{roundSpending(state, pid)}</b>
        </span>
      ))}
    </span>
  );
}
