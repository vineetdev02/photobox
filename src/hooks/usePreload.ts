import { useEffect } from "react";

import type { ViewerImage } from "../types.js";

/**
 * Warms the neighbours of the current image so the next arrow press paints
 * immediately. Preloading everything would be worse than preloading nothing on
 * a gallery of two hundred photos, so this stays a small window.
 */
export function usePreload(images: ViewerImage[], index: number, radius: number): void {
  useEffect(() => {
    if (radius <= 0 || typeof window === "undefined") return;

    const loaded: HTMLImageElement[] = [];
    for (let offset = 1; offset <= radius; offset += 1) {
      for (const target of [index + offset, index - offset]) {
        const image = images[target];
        if (!image) continue;
        const element = new window.Image();
        element.src = image.src;
        loaded.push(element);
      }
    }

    return () => {
      // Dropping src lets an in-flight request be abandoned when the user
      // moves on faster than the network.
      for (const element of loaded) element.src = "";
    };
  }, [images, index, radius]);
}
