import { useEffect } from 'react';

interface Props {
  text: string | null;
  onClose: () => void;
  className?: string;
}

/** Floating info panel for tap-to-read on mobile (replaces native title tooltips). */
export function TapInfoBubble({ text, onClose, className }: Props) {
  useEffect(() => {
    if (!text) return;
    const timer = window.setTimeout(onClose, 20000);
    return () => window.clearTimeout(timer);
  }, [text, onClose]);

  if (!text) return null;

  return (
    <div
      className={['tap-info-bubble', className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="tap-info-text">{text}</p>
      <button type="button" className="tap-info-close" aria-label="Cerrar" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
