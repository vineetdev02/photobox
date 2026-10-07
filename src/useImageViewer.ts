import { useCallback, useMemo, useState } from "react";

import type { ViewerContext } from "./types.js";

export interface UseImageViewer {
  open: boolean;
  /** Position of the image on screen in `images` — not in the visible group. */
  index: number;
  /**
   * Open on `images[index]`, e.g. from a grid tile's onClick. With groups on,
   * the viewer switches to that image's tab.
   */
  openAt: (index?: number) => void;
  close: () => void;
  /** Move to `images[index]`. */
  setIndex: (index: number) => void;
  /** Spread straight onto `<ImageViewer {...viewer.props} />`. */
  props: {
    open: boolean;
    absoluteIndex: number;
    onClose: () => void;
    onIndexChange: (index: number, context: ViewerContext) => void;
  };
}

/**
 * The state every consumer would otherwise write by hand. Entirely optional —
 * `ImageViewer` is controlled through plain props and does not need it.
 *
 * It tracks a position in `images`, because that is what the code opening the
 * viewer knows: a grid tile does not know which group tab the viewer was last
 * left on. Tracking the viewer's own `index` instead — a position within the
 * visible group — opened the wrong photo for every tile outside that group.
 */
export function useImageViewer(initialIndex = 0): UseImageViewer {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(initialIndex);

  const openAt = useCallback((next = 0) => {
    setIndex(next);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const onIndexChange = useCallback((_index: number, context: ViewerContext) => {
    setIndex(context.absoluteIndex);
  }, []);

  return useMemo(
    () => ({
      open,
      index,
      openAt,
      close,
      setIndex,
      props: { open, absoluteIndex: index, onClose: close, onIndexChange },
    }),
    [open, index, openAt, close, onIndexChange],
  );
}
