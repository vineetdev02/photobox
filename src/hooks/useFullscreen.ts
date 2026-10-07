import { useCallback, useEffect, useState, type RefObject } from "react";

interface WebkitElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}
interface WebkitDocument extends Document {
  webkitExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
}

/**
 * Fullscreen with the Safari prefix still handled, and `supported` reported
 * honestly — iPhone Safari has no element fullscreen at all, so the button is
 * hidden there rather than offered and then doing nothing.
 *
 * Support is the document's answer, never the element's. The viewer renders
 * nothing until it has mounted, so an effect that asked the element ran while
 * there was no element, and a browser with only the prefixed API was told it
 * had no fullscreen at all. And `active` means *this* element is fullscreen: a
 * video or a kiosk page that is fullscreen already is somebody else's state,
 * and taking it for the viewer's own disabled Escape for closing.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const doc = document as WebkitDocument;
    setSupported(Boolean(doc.fullscreenEnabled) || Boolean(doc.webkitFullscreenEnabled));

    const onChange = () => {
      const element = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setActive(element !== null && element === ref.current);
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
      if ((doc.fullscreenElement ?? doc.webkitFullscreenElement) === element) {
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
