import { ACCIONES, ACCION_ICON, type AccionId } from '../i18n/es';
import { playActionSound, vibrateTap } from './visual/sounds';

interface Props {
  selected: AccionId | null;
  availability: Record<AccionId, boolean>;
  disabled: (a: AccionId) => boolean;
  onChoose: (a: AccionId) => void;
  recommended?: AccionId | null;
}

export function ActionGrid({ selected, availability, disabled, onChoose, recommended }: Props) {
  const actions: AccionId[] = ['build', 'network', 'sell', 'develop', 'loan', 'scout', 'pass'];

  return (
    <div className="action-grid" data-testid="action-grid">
      {actions.map((a) => (
        <button
          key={a}
          type="button"
          data-testid={`action-${a}`}
          className={[
            'action-tile',
            selected === a ? 'selected' : '',
            !availability[a] ? 'unavailable' : '',
            recommended === a && availability[a] ? 'recommended' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={disabled(a)}
          onClick={() => {
            playActionSound();
            vibrateTap();
            onChoose(a);
          }}
          aria-label={ACCIONES[a]}
        >
          <span className="action-icon" aria-hidden>
            {ACCION_ICON[a]}
          </span>
          <span className="action-label">{ACCIONES[a]}</span>
          {recommended === a && availability[a] && (
            <span className="action-rec-badge" aria-label="Mejor jugada sugerida">
              ★
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
