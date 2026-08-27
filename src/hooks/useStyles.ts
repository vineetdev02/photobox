import { useEffect } from "react";

import { css } from "../styles.js";

const STYLE_ID = "riv-styles";
let injected = false;

/**
 * Puts the stylesheet in the document the first time any viewer mounts.
 *
 * The viewer is an overlay that only exists after a user action, so injecting
 * on mount rather than at import time costs nothing visually and keeps the
 * package free of import side effects — which is what lets bundlers drop it
 * entirely when it is never used.
 */
export function useStyles(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || injected || typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) {
      injected = true;
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.insertBefore(style, document.head.firstChild);
    injected = true;
  }, [enabled]);
}
