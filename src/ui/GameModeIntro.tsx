import type { GameState } from '../engine/state';
import { hotseatIntroContent, mautomaIntroContent, vsAIIntroContent } from '../i18n/gameModes';

interface Props {
  state: GameState;
  onContinue: () => void;
}

export function GameModeIntro({ state, onContinue }: Props) {
  const content =
    state.mode === 'solo' && state.difficulty
      ? mautomaIntroContent(state.playerCount, state.difficulty, state.playerCount - 1)
      : state.mode === 'vsAI' && state.aiDifficulty
        ? vsAIIntroContent(state.playerCount, state.aiDifficulty, state.playerCount - 1)
        : hotseatIntroContent(state.playerCount, state.playerNames);

  return (
    <div className="gameover mode-intro-screen" data-testid="mode-intro">
      <div className="panel mode-intro-panel">
        <p className="mode-intro-tag">{state.mode === 'solo' ? 'Antes de empezar' : 'Antes de empezar'}</p>
        <h2>{content.title}</h2>
        <p className="mode-intro-subtitle">{content.subtitle}</p>

        <dl className="mode-intro-facts">
          <div>
            <dt>Cartas</dt>
            <dd>{content.deckLine}</dd>
          </div>
          <div>
            <dt>Rondas</dt>
            <dd>{content.roundsLine}</dd>
          </div>
          <div>
            <dt>Rivales</dt>
            <dd>{content.rivalLine}</dd>
          </div>
        </dl>

        <div className="mode-intro-why">
          <h3>{content.whyTitle}</h3>
          <ul>
            {content.whyBullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <p className="mode-intro-compare">{content.compareNote}</p>

        <button type="button" className="primary" onClick={onContinue} data-testid="mode-intro-continue">
          Entendido — comenzar era Canal
        </button>
      </div>
    </div>
  );
}
