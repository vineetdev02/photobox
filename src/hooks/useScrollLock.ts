import { useEffect } from "react";

/**
 * Freezes the page behind the overlay. The scrollbar is replaced with padding
 * of the same width, because letting it disappear shifts the whole layout and
 * the jump is visible through a translucent backdrop.
 */
export function useScrollLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const gap = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [enabled]);
}
