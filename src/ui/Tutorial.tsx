const DONE_KEY = 'bbsolo-tutorial-done';

export function TutorialLauncher({ onStart, prominent, compact }: { onStart: () => void; prominent?: boolean; compact?: boolean }) {
  return (
    <button
      type="button"
      className={[prominent ? 'primary' : '', compact ? 'topbar-compact-btn' : ''].filter(Boolean).join(' ')}
      onClick={() => {
        localStorage.setItem(DONE_KEY, '1');
        onStart();
      }}
      data-testid="tutorial-start"
      aria-label="Tutorial interactivo"
    >
      {compact ? '🎓' : '🎓 Tutorial interactivo'}
    </button>
  );
}

export { INTERACTIVE_TUTORIAL } from '../engine/tutorial/steps';
