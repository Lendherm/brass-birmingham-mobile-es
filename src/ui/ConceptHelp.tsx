import { useState, type ReactNode } from 'react';
import { CONCEPT_HELPS, NETWORK_TOLL_CONCEPT } from '../i18n/conceptHelp';

function renderBody(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(<strong key={`b${i}`}>{part.slice(2, -2)}</strong>);
      return;
    }
    part.split('\n').forEach((line, j) => {
      if (j > 0) nodes.push(<br key={`br-${i}-${j}`} />);
      if (line.length > 0) nodes.push(<span key={`t-${i}-${j}`}>{line}</span>);
    });
  });
  return nodes;
}

export function ConceptHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="gameover" onClick={onClose} data-testid="concept-help-modal">
      <div className="panel tutorial-panel concept-help-panel" onClick={(e) => e.stopPropagation()}>
        <header className="tutorial-header">
          <div>
            <h2 style={{ margin: 0 }}>¿Por qué importan los enlaces?</h2>
            <p className="tutorial-progress">Conceptos de diseño · no son reglas mecánicas nuevas</p>
          </div>
          <button type="button" onClick={onClose} data-testid="concept-help-close" aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="concept-help-list">
          {CONCEPT_HELPS.map((concept) => (
            <article key={concept.id} className="concept-help-article" data-testid={`concept-help-${concept.id}`}>
              <h3>{concept.title}</h3>
              <p className="concept-help-short">{concept.short}</p>
              <div className="concept-help-body">{renderBody(concept.body)}</div>
            </article>
          ))}
        </div>

        <footer className="tutorial-footer">
          <button type="button" className="primary" onClick={onClose} data-testid="concept-help-done">
            Entendido
          </button>
        </footer>
      </div>
    </div>
  );
}

/** Compact “?” control — opens conceptual help (network toll / VP peaje). */
export function ConceptHelpButton({ className, compact }: { className?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={[className, compact ? 'topbar-compact-btn' : '', 'concept-help-btn'].filter(Boolean).join(' ')}
        onClick={() => setOpen(true)}
        data-testid="concept-help-open"
        aria-label="Ayuda: por qué importan los enlaces"
        title={NETWORK_TOLL_CONCEPT.short}
      >
        {compact ? '?' : '? Ayuda'}
      </button>
      <ConceptHelpModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
