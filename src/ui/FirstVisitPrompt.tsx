import { useEffect, useState } from 'react';

const DONE_KEY = 'bbsolo-tutorial-done';

/** Banner opcional en la primera visita (no auto-inicia el tutorial). */
export function FirstVisitPrompt({ onStart }: { onStart: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DONE_KEY)) return;
    const t = window.setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="first-visit-banner panel" data-testid="first-visit-banner">
      <p>
        <strong>¿Primera vez?</strong> Prueba el tutorial interactivo (7 capítulos) o lee la guía de estrategia.
      </p>
      <div className="actions">
        <button
          type="button"
          className="primary"
          onClick={() => {
            localStorage.setItem(DONE_KEY, '1');
            setVisible(false);
            onStart();
          }}
          data-testid="first-visit-tutorial"
        >
          Empezar tutorial
        </button>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(DONE_KEY, '1');
            setVisible(false);
          }}
          data-testid="first-visit-dismiss"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
