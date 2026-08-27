import { useCallback, useMemo, useState } from "react";

export interface UseImageViewer {
  open: boolean;
  index: number;
  /** Open at a specific position, e.g. from a grid tile's onClick. */
  openAt: (index?: number) => void;
  close: () => void;
  setIndex: (index: number) => void;
  /** Spread straight onto `<ImageViewer {...viewer.props} />`. */
  props: { open: boolean; index: number; onClose: () => void; onIndexChange: (index: number) => void };
}

/**
 * The state every consumer would otherwise write by hand. Entirely optional —
 * `ImageViewer` is controlled through plain props and does not need it.
 */
export function useImageViewer(initialIndex = 0): UseImageViewer {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(initialIndex);

  const openAt = useCallback((next = 0) => {
    setIndex(next);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return useMemo(
    () => ({
      open,
      index,
      openAt,
      close,
      setIndex,
      props: { open, index, onClose: close, onIndexChange: setIndex },
    }),
    [open, index, openAt, close],
  );
}
