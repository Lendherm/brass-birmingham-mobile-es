import { useCallback, useState, type ReactNode } from 'react';
import { STRATEGY_CHAPTERS, STRATEGY_QUICK_TIPS, type StrategyChapter } from '../i18n/strategy';

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
      nodes.push(<span key={`t-${i}-${j}`}>{line}</span>);
    });
  });
  return nodes;
}

function ChapterView({ chapter }: { chapter: StrategyChapter }) {
  return (
    <article className="strategy-chapter">
      <p className="strategy-subtitle">{chapter.subtitle}</p>
      {chapter.sections.map((sec) => (
        <section key={sec.heading} className="strategy-section">
          <h4>{sec.heading}</h4>
          <div className="strategy-body">{renderBody(sec.body)}</div>
        </section>
      ))}
    </article>
  );
}

export function StrategyGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [chapterIdx, setChapterIdx] = useState(0);
  const [showIndex, setShowIndex] = useState(false);

  const chapter = STRATEGY_CHAPTERS[chapterIdx];
  const go = useCallback((idx: number) => {
    setChapterIdx(Math.max(0, Math.min(STRATEGY_CHAPTERS.length - 1, idx)));
    setShowIndex(false);
  }, []);

  if (!open || !chapter) return null;

  return (
    <div className="gameover" onClick={onClose} data-testid="strategy-modal">
      <div className="panel tutorial-panel strategy-panel" onClick={(e) => e.stopPropagation()}>
        <header className="tutorial-header">
          <div>
            <h2 style={{ margin: 0 }}>Guía de estrategia</h2>
            <p className="tutorial-progress">
              Capítulo {chapterIdx + 1} de {STRATEGY_CHAPTERS.length}: {chapter.title}
            </p>
          </div>
          <button type="button" onClick={onClose} data-testid="strategy-close" aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="strategy-quick-tips" data-testid="strategy-tips">
          <span className="strategy-tips-label">Consejo rápido:</span>{' '}
          {STRATEGY_QUICK_TIPS[chapterIdx % STRATEGY_QUICK_TIPS.length]}
        </div>

        <div className="tutorial-progress-bar" aria-hidden>
          <div className="tutorial-progress-fill" style={{ width: `${((chapterIdx + 1) / STRATEGY_CHAPTERS.length) * 100}%` }} />
        </div>

        <div className="tutorial-layout strategy-layout">
          <nav className={`tutorial-index${showIndex ? ' open' : ''}`} aria-label="Capítulos de estrategia">
            <button type="button" className="tutorial-index-toggle" onClick={() => setShowIndex((v) => !v)}>
              {showIndex ? 'Ocultar índice' : 'Ver capítulos'}
            </button>
            <ol className="tutorial-index-list">
              {STRATEGY_CHAPTERS.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={i === chapterIdx ? 'selected' : ''}
                    onClick={() => go(i)}
                    data-testid={`strategy-ch-${c.id}`}
                  >
                    {i + 1}. {c.title}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <div className="tutorial-content strategy-content" data-testid={`strategy-chapter-${chapter.id}`}>
            <h3 className="tutorial-step-title">{chapter.title}</h3>
            <ChapterView chapter={chapter} />
          </div>
        </div>

        <footer className="tutorial-footer">
          <button type="button" disabled={chapterIdx === 0} onClick={() => go(chapterIdx - 1)} data-testid="strategy-prev">
            ← Anterior
          </button>
          <span className="strategy-page-dots">
            {STRATEGY_CHAPTERS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={`tutorial-dot${i === chapterIdx ? ' active' : ''}`}
                onClick={() => go(i)}
                aria-label={c.title}
              />
            ))}
          </span>
          {chapterIdx >= STRATEGY_CHAPTERS.length - 1 ? (
            <button type="button" className="primary" onClick={onClose} data-testid="strategy-done">
              Cerrar
            </button>
          ) : (
            <button type="button" className="primary" onClick={() => go(chapterIdx + 1)} data-testid="strategy-next">
              Siguiente →
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

export function StrategyGuideButton({ className, compact }: { className?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={[className, compact ? 'topbar-compact-btn' : ''].filter(Boolean).join(' ')}
        onClick={() => setOpen(true)}
        data-testid="strategy-open"
        aria-label="Guía de estrategia"
      >
        {compact ? '📘' : '📘 Estrategia'}
      </button>
      <StrategyGuideModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
