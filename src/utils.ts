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

/** The All tab, as a choice someone made — distinct from no choice at all. */
export const ALL_GROUPS: unique symbol = Symbol("photobox.all-groups");

/** A tab name, the All tab, or `null` while nothing has been chosen yet. */
export type GroupChoice = string | typeof ALL_GROUPS | null;

/**
 * The group on screen, worked out on every render from what was chosen and
 * what is in hand, rather than decided once and stored.
 *
 * `null` is not the All tab. A gallery that mounts with no images and receives
 * them later has chosen nothing, and must still land on `defaultGroup` or the
 * first tab — not on every image under a tab bar with no tab selected.
 *
 * `requested` is an image the consumer asked for by its position in `images`.
 * When the group on screen does not contain it the viewer moves to the group
 * that does: a grid tile has to open on that tile, whatever tab the reader
 * last left the viewer on.
 */
export function resolveGroup(input: {
  groups: readonly string[];
  enabled: boolean;
  allTab: boolean;
  choice: GroupChoice;
  defaultGroup?: string | undefined;
  requested?: ViewerImage | undefined;
}): string | undefined {
  const { groups, enabled, allTab, choice, defaultGroup, requested } = input;

  // One group or none means no tab bar, and no tab bar has to mean no filter:
  // otherwise the images outside that one group are unreachable.
  if (!enabled || groups.length < 2) return undefined;

  let group: string | undefined;
  if (typeof choice === "string" && groups.includes(choice)) group = choice;
  else if (choice === ALL_GROUPS && allTab) group = undefined;
  else if (defaultGroup !== undefined && groups.includes(defaultGroup)) group = defaultGroup;
  else group = allTab ? undefined : groups[0];

  if (requested && group !== undefined && requested.group !== group) {
    // An image with no group belongs to no tab, so only the unfiltered set can
    // show it.
    return requested.group !== undefined && groups.includes(requested.group) ? requested.group : undefined;
  }
  return group;
}

/** A position that is always inside `[0, length)`, whatever was passed in. */
export function clampIndex(value: number, length: number): number {
  if (length <= 0 || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), length - 1);
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

const TYPING_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

/**
 * True when a keystroke belongs to a field, so the viewer's shortcuts can
 * stand aside.
 *
 * Every shortcut but Escape is a single character or an arrow, which is also
 * what someone types into a search box in `headerExtra` or a caption field in
 * `footerExtra`. Listening on `window` means those keys arrive here first, and
 * `preventDefault` then eats them: `r` rotates instead of typing, and an arrow
 * key moves the gallery rather than the caret.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (typeof element?.closest !== "function") return false;
  return element.closest(TYPING_SELECTOR) !== null;
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
