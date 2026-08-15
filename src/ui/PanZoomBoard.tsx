import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

const MIN_SCALE = 0.35;
const MAX_SCALE = 2.5;
const DRAG_THRESHOLD = 8;
const BOARD_WIDTH = 900;
const BOARD_HEIGHT = 860;

export interface BoardViewHandle {
  fitAll: () => void;
  centerOn: (x: number, y: number, scale?: number) => void;
}

interface Transform {
  scale: number;
  x: number;
  y: number;
}

interface Props {
  children: ReactNode;
  /** Cambia cuando el tutorial avanza → reencuadra el tablero */
  viewRevision?: number;
  /** null = ver tablero completo; {x,y} = centrar en punto del mapa (coords 900×860) */
  viewTarget?: { x: number; y: number; scale?: number } | null;
}

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function touchDistance(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function touchMidpoint(touches: TouchList): { x: number; y: number } {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

function snapTransform(t: Transform): Transform {
  return {
    scale: Math.round(t.scale * 40) / 40,
    x: Math.round(t.x),
    y: Math.round(t.y),
  };
}

function isMapInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    '[data-testid^="city-"], [data-testid^="link-"], [data-testid^="merchant-"], .board-zoom-toolbar button',
  );
}

export const PanZoomBoard = forwardRef<BoardViewHandle, Props>(function PanZoomBoard(
  { children, viewRevision = 0, viewTarget = null },
  ref,
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const pinchRef = useRef<{
    dist: number;
    scale: number;
    origX: number;
    origY: number;
    midX: number;
    midY: number;
  } | null>(null);

  const suppressClickRef = useRef(false);

  const fitRetryRef = useRef(0);

  const fitAll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w <= 0 || h <= 0) {
      if (fitRetryRef.current < 8) {
        fitRetryRef.current += 1;
        window.requestAnimationFrame(() => fitAll());
      }
      return;
    }
    fitRetryRef.current = 0;
    const pad = 8;
    const scale = clampScale(Math.min((w - pad * 2) / BOARD_WIDTH, (h - pad * 2) / BOARD_HEIGHT));
    const boardW = BOARD_WIDTH * scale;
    const boardH = BOARD_HEIGHT * scale;
    setTransform(
      snapTransform({
        scale,
        x: Math.round((w - boardW) / 2),
        y: Math.round((h - boardH) / 2),
      }),
    );
  }, []);

  const centerOn = useCallback((bx: number, by: number, targetScale = 0.85) => {
    const el = viewportRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const scale = clampScale(Math.min(targetScale, (w - 16) / BOARD_WIDTH, (h - 16) / BOARD_HEIGHT));
    setTransform(
      snapTransform({
        scale,
        x: Math.round(w / 2 - bx * scale),
        y: Math.round(h / 2 - by * scale),
      }),
    );
  }, []);

  useImperativeHandle(ref, () => ({ fitAll, centerOn }), [fitAll, centerOn]);

  useEffect(() => {
    fitAll();
    const onResize = () => fitAll();
    const onOrient = () => window.setTimeout(fitAll, 120);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrient);
    const el = viewportRef.current;
    let ro: ResizeObserver | undefined;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => fitAll());
      ro.observe(el);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrient);
      ro?.disconnect();
    };
  }, [fitAll]);

  useEffect(() => {
    if (viewTarget) {
      centerOn(viewTarget.x, viewTarget.y, viewTarget.scale ?? 0.9);
    } else {
      fitAll();
    }
  }, [viewRevision, viewTarget, fitAll, centerOn]);

  const zoomAt = useCallback((delta: number, clientX?: number, clientY?: number) => {
    setTransform((prev) => {
      const nextScale = clampScale(prev.scale + delta);
      const el = viewportRef.current;
      if (!el || clientX == null || clientY == null) {
        return snapTransform({ ...prev, scale: nextScale });
      }
      const rect = el.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const ratio = nextScale / prev.scale;
      return snapTransform({
        scale: nextScale,
        x: px - (px - prev.x) * ratio,
        y: py - (py - prev.y) * ratio,
      });
    });
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.deltaY > 0 ? -0.12 : 0.12, e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const blockMisclick = (e: Event) => {
      if (suppressClickRef.current) {
        e.stopPropagation();
        e.preventDefault();
        suppressClickRef.current = false;
      }
    };
    el.addEventListener('click', blockMisclick, true);
    return () => el.removeEventListener('click', blockMisclick, true);
  }, []);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (pinchRef.current || isMapInteractiveTarget(e.target)) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: transformRef.current.x,
      origY: transformRef.current.y,
      moved: false,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || pinchRef.current) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    setPanning(true);
    setTransform((prev) =>
      snapTransform({
        ...prev,
        x: drag.origX + dx,
        y: drag.origY + dy,
      }),
    );
  };

  const endPointer = (e: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (drag.moved) suppressClickRef.current = true;
    dragRef.current = null;
    setPanning(false);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        dragRef.current = null;
        setPanning(false);
        const mid = touchMidpoint(e.touches);
        const rect = el.getBoundingClientRect();
        const t = transformRef.current;
        pinchRef.current = {
          dist: touchDistance(e.touches),
          scale: t.scale,
          origX: t.x,
          origY: t.y,
          midX: mid.x - rect.left,
          midY: mid.y - rect.top,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();
      const pinch = pinchRef.current;
      const dist = touchDistance(e.touches);
      const nextScale = clampScale(pinch.scale * (dist / pinch.dist));
      const ratio = nextScale / pinch.scale;
      setTransform(
        snapTransform({
          scale: nextScale,
          x: pinch.midX - (pinch.midX - pinch.origX) * ratio,
          y: pinch.midY - (pinch.midY - pinch.origY) * ratio,
        }),
      );
    };

    const onTouchEnd = () => {
      pinchRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  return (
    <div className="board-viewport-wrap">
      <div className="board-zoom-toolbar" aria-label="Controles de zoom">
        <button type="button" onClick={() => zoomAt(0.2)} aria-label="Acercar" data-testid="zoom-in">
          +
        </button>
        <button type="button" onClick={() => zoomAt(-0.2)} aria-label="Alejar" data-testid="zoom-out">
          −
        </button>
        <button type="button" onClick={fitAll} aria-label="Ver tablero completo" data-testid="zoom-fit" title="Ver tablero completo">
          ⊙
        </button>
      </div>
      <div
        ref={viewportRef}
        className={`board-viewport${panning ? ' is-panning' : ''}`}
        data-testid="board-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <div
          className="board-pan-layer"
          style={{
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          }}
        >
          {children}
        </div>
      </div>
      <p className="board-pan-hint">⊙ = ver todo · Arrastra · Pellizca para zoom</p>
    </div>
  );
});
