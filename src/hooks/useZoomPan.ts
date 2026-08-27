import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

export interface ZoomState {
  scale: number;
  x: number;
  y: number;
  rotation: number;
}

const IDENTITY: ZoomState = { scale: 1, x: 0, y: 0, rotation: 0 };

/** Below this a drag reads as a tap, above it as a swipe. */
const SWIPE_DISTANCE = 55;
const SWIPE_TIME_MS = 600;

/**
 * Controls that live inside the stage — the arrows and the tool rail.
 *
 * A press on one of these must never start a gesture. setPointerCapture
 * retargets every later pointer event to the stage, which means the button
 * never sees its own pointerup and no click is ever synthesised: the arrows
 * and every tool silently stop working.
 */
const CONTROL_SELECTOR = 'button, a, input, select, textarea, [role="button"]';

interface Options {
  stageRef: RefObject<HTMLElement | null>;
  /** The element the transform is applied to — the image, or a wrapper around a custom one. */
  imageRef: RefObject<HTMLElement | null>;
  gestures: boolean;
  zoom: boolean;
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  wheelZoom: boolean;
  doubleClickZoom: boolean;
  /** Changing this resets the transform — one image should not inherit the last one's zoom. */
  resetKey: unknown;
  onSwipe?: (direction: 1 | -1) => void;
  onZoomChange?: (scale: number) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function useZoomPan(options: Options) {
  const { stageRef, imageRef, gestures, zoom, minZoom, maxZoom, zoomStep, resetKey } = options;

  const [state, setState] = useState<ZoomState>(IDENTITY);
  const [panning, setPanning] = useState(false);
  const [animate, setAnimate] = useState(true);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef({ x: 0, y: 0, time: 0, distance: 0, scale: 1, offsetX: 0, offsetY: 0 });
  const latest = useRef(state);
  latest.current = state;

  const notifyZoom = options.onZoomChange;
  useEffect(() => {
    notifyZoom?.(state.scale);
  }, [state.scale, notifyZoom]);

  useEffect(() => {
    setAnimate(true);
    setState(IDENTITY);
  }, [resetKey]);

  /**
   * Keeps the image overlapping the stage. Without it, a pan can throw a
   * zoomed image off screen and leave the user staring at an empty overlay
   * with no obvious way back.
   */
  const clampOffset = useCallback(
    (next: ZoomState): ZoomState => {
      const stage = stageRef.current;
      const image = imageRef.current;
      if (!stage || !image) return next;

      const overflowX = Math.max(0, (image.offsetWidth * next.scale - stage.clientWidth) / 2);
      const overflowY = Math.max(0, (image.offsetHeight * next.scale - stage.clientHeight) / 2);

      return { ...next, x: clamp(next.x, -overflowX, overflowX), y: clamp(next.y, -overflowY, overflowY) };
    },
    [stageRef, imageRef],
  );

  /**
   * `resolve` may be a function of the current scale. Two clicks landing in one
   * React batch would otherwise both read the same stale scale and the second
   * one would be swallowed — the increment has to be computed inside the
   * updater, not outside it.
   */
  const applyScale = useCallback(
    (resolve: number | ((scale: number) => number), origin?: { x: number; y: number }) => {
      if (!zoom) return;
      setAnimate(true);
      setState((current) => {
        const target = typeof resolve === "function" ? resolve(current.scale) : resolve;
        const next = clamp(target, minZoom, maxZoom);
        if (next === current.scale) return current;
        // Zooming at the cursor: the point under the pointer must stay put, so
        // the offset scales with it rather than the image growing from centre.
        const ratio = next / current.scale;
        const x = origin ? origin.x - (origin.x - current.x) * ratio : current.x * ratio;
        const y = origin ? origin.y - (origin.y - current.y) * ratio : current.y * ratio;
        return clampOffset(next === 1 ? { ...current, scale: 1, x: 0, y: 0 } : { ...current, scale: next, x, y });
      });
    },
    [zoom, minZoom, maxZoom, clampOffset],
  );

  const zoomIn = useCallback(() => applyScale((scale) => scale + zoomStep), [applyScale, zoomStep]);
  const zoomOut = useCallback(() => applyScale((scale) => scale - zoomStep), [applyScale, zoomStep]);

  const reset = useCallback(() => {
    setAnimate(true);
    setState(IDENTITY);
  }, []);

  const rotateBy = useCallback((degrees: number) => {
    setAnimate(true);
    setState((current) => ({ ...current, rotation: (current.rotation + degrees) % 360 }));
  }, []);

  /* ---------- wheel ---------- */

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !zoom || !options.wheelZoom) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = stage.getBoundingClientRect();
      const origin = {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      };
      const direction = event.deltaY > 0 ? -1 : 1;
      applyScale((scale) => scale + direction * zoomStep * 0.6, origin);
    };

    // Non-passive: the browser would otherwise scroll the page behind the
    // overlay before preventDefault could stop it.
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [stageRef, zoom, options.wheelZoom, applyScale, zoomStep]);

  /* ---------- pointers ---------- */

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!gestures) return;
      if ((event.target as HTMLElement | null)?.closest?.(CONTROL_SELECTOR)) return;
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      const points = [...pointers.current.values()];
      const current = latest.current;

      if (points.length === 2) {
        const [a, b] = points as [{ x: number; y: number }, { x: number; y: number }];
        start.current = {
          ...start.current,
          distance: Math.hypot(a.x - b.x, a.y - b.y),
          scale: current.scale,
        };
      } else {
        start.current = {
          x: event.clientX,
          y: event.clientY,
          time: Date.now(),
          distance: 0,
          scale: current.scale,
          offsetX: current.x,
          offsetY: current.y,
        };
        if (current.scale > 1) setPanning(true);
      }
      setAnimate(false);
    },
    [gestures],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!gestures || !pointers.current.has(event.pointerId)) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      const points = [...pointers.current.values()];

      if (points.length === 2 && zoom) {
        const [a, b] = points as [{ x: number; y: number }, { x: number; y: number }];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (start.current.distance > 0) {
          applyScale(start.current.scale * (distance / start.current.distance));
        }
        return;
      }

      if (points.length === 1 && latest.current.scale > 1) {
        const dx = event.clientX - start.current.x;
        const dy = event.clientY - start.current.y;
        setState((current) =>
          clampOffset({ ...current, x: start.current.offsetX + dx, y: start.current.offsetY + dy }),
        );
      }
    },
    [gestures, zoom, applyScale, clampOffset],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!gestures) return;
      const had = pointers.current.delete(event.pointerId);
      setPanning(false);
      setAnimate(true);
      if (!had) return;

      // A horizontal flick only changes image while the picture is unzoomed;
      // once zoomed, the same gesture is how you look around it.
      if (pointers.current.size === 0 && latest.current.scale === 1 && options.onSwipe) {
        const dx = event.clientX - start.current.x;
        const dy = event.clientY - start.current.y;
        const elapsed = Date.now() - start.current.time;
        if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.4 && elapsed < SWIPE_TIME_MS) {
          options.onSwipe(dx < 0 ? 1 : -1);
        }
      }
    },
    [gestures, options],
  );

  const onDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (!zoom || !options.doubleClickZoom) return;
      if ((event.target as HTMLElement | null)?.closest?.(CONTROL_SELECTOR)) return;
      const stage = stageRef.current;
      if (!stage) return;

      if (latest.current.scale > 1) {
        reset();
        return;
      }
      const rect = stage.getBoundingClientRect();
      applyScale(Math.min(maxZoom, 2.5), {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      });
    },
    [zoom, options.doubleClickZoom, stageRef, reset, applyScale, maxZoom],
  );

  return {
    state,
    panning,
    animate,
    zoomIn,
    zoomOut,
    reset,
    rotateBy,
    isZoomed: state.scale > 1,
    canZoomIn: state.scale < maxZoom,
    canZoomOut: state.scale > minZoom,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onDoubleClick },
  };
}
