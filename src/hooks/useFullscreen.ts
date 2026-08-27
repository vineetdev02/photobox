import { useCallback, useEffect, useState, type RefObject } from "react";

interface WebkitElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}
interface WebkitDocument extends Document {
  webkitExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element | null;
}

/**
 * Fullscreen with the Safari prefix still handled, and `supported` reported
 * honestly — iPhone Safari has no element fullscreen at all, so the button is
 * hidden there rather than offered and then doing nothing.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const element = ref.current as WebkitElement | null;
    setSupported(
      Boolean(document.fullscreenEnabled) ||
        typeof element?.webkitRequestFullscreen === "function",
    );

    const onChange = () => {
      const doc = document as WebkitDocument;
      setActive(Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [ref]);

  const toggle = useCallback(async () => {
    const doc = document as WebkitDocument;
    const element = ref.current as WebkitElement | null;
    if (!element) return;

    try {
      if (doc.fullscreenElement ?? doc.webkitFullscreenElement) {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      } else {
        await (element.requestFullscreen?.() ?? element.webkitRequestFullscreen?.());
      }
    } catch {
      // A rejected request means the browser declined; the state listener
      // never fires, the button stays as it was, and nothing else breaks.
    }
  }, [ref]);

  return { active, supported, toggle };
}
