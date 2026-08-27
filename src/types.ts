import type { CSSProperties, ReactNode } from "react";

/** One image in the viewer. Only `src` is required. */
export interface ViewerImage {
  src: string;
  /** Small image for the strip. Falls back to `src`, so a thumbnail is optional but recommended. */
  thumbnail?: string;
  alt?: string;
  /** Shown in the caption, e.g. "Elevation". */
  title?: string;
  /** Groups the tab bar is built from, e.g. "Outdoors". Images with no group land in one unnamed set. */
  group?: string;
  /** Intrinsic size. Supplying it lets the stage reserve space and avoids a layout jump. */
  width?: number;
  height?: number;
  /** URL the download button should hit. Defaults to `src`. */
  downloadUrl?: string;
  /** Anything you need back in a callback. Never rendered. */
  meta?: Record<string, unknown>;
}

/** Everything a callback needs to know about where the viewer is. */
export interface ViewerContext {
  image: ViewerImage;
  /** Index within the currently visible set, not within `images`. */
  index: number;
  /** Size of the currently visible set. */
  total: number;
  /** Index within the full `images` array, whatever the active group is. */
  absoluteIndex: number;
  group?: string;
}

/** A custom button in the header — "Brochure", "Request more photos", anything. */
export interface ViewerAction {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Renders an anchor instead of a button. */
  href?: string;
  /** Anchor target, e.g. "_blank". */
  target?: string;
  /** Sets the `download` attribute on an `href` action. */
  download?: boolean | string;
  onClick?: (context: ViewerContext) => void;
  /** Filled styling for the one action that matters most. */
  primary?: boolean;
  /** Collapses to an icon-only button on narrow screens instead of taking a row. */
  compact?: boolean;
  disabled?: boolean;
}

export type FeedbackValue = "yes" | "no" | "skip";

export type ViewerTheme = "dark" | "light" | "auto";

/** Every string the viewer renders, so it can be translated. */
export interface ViewerLabels {
  close: string;
  next: string;
  previous: string;
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  rotate: string;
  enterFullscreen: string;
  exitFullscreen: string;
  share: string;
  download: string;
  play: string;
  pause: string;
  showThumbnails: string;
  hideThumbnails: string;
  feedbackQuestion: string;
  feedbackYes: string;
  feedbackNo: string;
  feedbackSkip: string;
  feedbackThanks: string;
  loadFailed: string;
  retry: string;
  copiedLink: string;
  /** `{group} image {index} of {total} : {title}` — placeholders are optional. */
  caption: string;
  counter: string;
  allGroups: string;
}

export interface ImageViewerProps {
  /** The images. Order is preserved; grouping only filters. */
  images: ViewerImage[];

  /** Controlled visibility. Omit it and the viewer is always rendered open. */
  open?: boolean;
  onClose?: () => void;

  /** Controlled index, into the *currently visible* set. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number, context: ViewerContext) => void;

  /* ---- chrome: each one is a switch ---- */
  /** Tab bar built from `image.group`. Ignored when no image has a group. */
  groups?: boolean;
  /** Start on this group instead of the first one. */
  defaultGroup?: string;
  /** Adds an "All" tab in front of the per-group tabs. */
  allGroupsTab?: boolean;
  thumbnails?: boolean;
  /** Show the hide/show toggle over the strip. */
  thumbnailsCollapsible?: boolean;
  defaultThumbnailsOpen?: boolean;
  /** `true` for the default line, or your own renderer. */
  caption?: boolean | ((context: ViewerContext) => ReactNode);
  counter?: boolean;
  arrows?: boolean;
  closeButton?: boolean;
  /** The vertical tool rail. Switching it off hides every tool at once. */
  toolbar?: boolean;

  /* ---- tools ---- */
  zoom?: boolean;
  rotate?: boolean;
  fullscreen?: boolean;
  share?: boolean;
  download?: boolean;
  slideshow?: boolean;

  /* ---- header actions ---- */
  actions?: ViewerAction[];

  /* ---- feedback bar ---- */
  feedback?: boolean;
  feedbackQuestion?: string;
  onFeedback?: (value: FeedbackValue, context: ViewerContext) => void;

  /* ---- behaviour ---- */
  loop?: boolean;
  keyboard?: boolean;
  /** Swipe, pinch and drag. */
  gestures?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /** Stops the page behind from scrolling while the viewer is open. */
  scrollLock?: boolean;
  /** How many neighbours to fetch ahead. 0 disables preloading. */
  preload?: number;
  maxZoom?: number;
  minZoom?: number;
  zoomStep?: number;
  doubleClickZoom?: boolean;
  wheelZoom?: boolean;
  slideshowInterval?: number;

  /* ---- presentation ---- */
  theme?: ViewerTheme;
  className?: string;
  style?: CSSProperties;
  zIndex?: number;
  /** Render into a portal. Pass an element to choose the host. */
  portal?: boolean | HTMLElement;
  /** Set false when you import `styles.css` yourself. */
  injectStyles?: boolean;
  labels?: Partial<ViewerLabels>;

  /* ---- escape hatches ---- */
  /** Swap in `next/image` or anything else for the main stage. */
  renderImage?: (context: ViewerContext & { className: string }) => ReactNode;
  /** Swap in your own thumbnail element. */
  renderThumbnail?: (context: ViewerContext & { active: boolean }) => ReactNode;
  /** Extra nodes in the header, after the actions. */
  headerExtra?: ReactNode;
  /** Extra nodes under the caption. */
  footerExtra?: ReactNode;

  onShare?: (context: ViewerContext) => void | Promise<void>;
  onDownload?: (context: ViewerContext) => void;
  onOpen?: (context: ViewerContext) => void;
  onZoomChange?: (scale: number, context: ViewerContext) => void;
  onGroupChange?: (group: string | undefined) => void;
}
