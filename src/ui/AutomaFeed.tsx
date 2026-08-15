import { automaOpponentIds, isVsAutoma, type GameState } from '../engine/state';

/** Last Automa/Mautoma log lines for the action feed panel. */
export function automaFeedLines(state: GameState, limit = 5): string[] {
  if (!isVsAutoma(state)) return [];
  const names = automaOpponentIds(state).map((id) => state.playerNames[id]);
  return state.log.filter((line) => names.some((name) => line.includes(name))).slice(-limit);
}

interface Props {
  state: GameState;
}

export function AutomaFeed({ state }: Props) {
  const lines = automaFeedLines(state);
  if (lines.length === 0) return null;

  return (
    <div className="panel automa-feed" data-testid="automa-feed">
      <h3>Últimas acciones Automa</h3>
      <ul className="automa-feed-list">
        {lines.map((line, i) => (
          <li key={`${state.log.length}-${i}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
