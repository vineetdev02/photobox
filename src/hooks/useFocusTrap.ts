import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab inside the overlay and hands focus back where it came from on
 * close. Without the restore step, dismissing the viewer drops the caret at
 * the top of the document and a keyboard user loses their place on the page.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    root?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !root) return;

      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null || element === root,
      );
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0] as HTMLElement;
      const last = items[items.length - 1] as HTMLElement;
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === root)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previous?.focus?.({ preventScroll: true });
    };
  }, [ref, enabled]);
}
