import type { ViewerImage } from "./types.js";

/** Group names in first-seen order, so the tab bar matches the array. */
export function deriveGroups(images: ViewerImage[]): string[] {
  const seen: string[] = [];
  for (const image of images) {
    if (image.group && !seen.includes(image.group)) seen.push(image.group);
  }
  return seen;
}

export function countInGroup(images: ViewerImage[], group: string): number {
  return images.reduce((total, image) => (image.group === group ? total + 1 : total), 0);
}

/**
 * Fills `{placeholders}` and then removes the punctuation left stranded by an
 * empty one. A gallery with no groups and no titles must not print
 * " image 1 of 4 : " — the template is a default, not a contract that every
 * field exists.
 */
export function formatTemplate(
  template: string,
  values: Record<string, string | number | undefined | null>,
): string {
  return template
    .replace(/\{(\w+)\}/g, (_match, key: string) => {
      const value = values[key];
      return value === undefined || value === null ? "" : String(value);
    })
    .replace(/\s*[:·|-]\s*$/g, "")
    .replace(/^\s*[:·|-]\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Triggers a download without navigating away, falling back to a new tab. */
export function downloadFile(url: string, filename?: string): void {
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename ?? url.split("/").pop() ?? "image";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

/** Web Share where it exists, clipboard everywhere else. Returns what it did. */
export async function shareUrl(url: string, title?: string): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ url, title });
      return "shared";
    } catch (error) {
      // A user dismissing the share sheet throws AbortError. That is a
      // cancellation, not a failure, so it must not fall through to copying.
      if ((error as Error)?.name === "AbortError") return "shared";
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

/** Resolves a possibly-relative image URL for sharing. */
export function absoluteUrl(src: string): string {
  if (typeof window === "undefined") return src;
  try {
    return new URL(src, window.location.href).href;
  } catch {
    return src;
  }
}
