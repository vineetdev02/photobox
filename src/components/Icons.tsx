import type { SVGProps } from "react";

/** Every icon is a 24-box stroke path, so they line up at any size. */
const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

export const IconClose = () => (
  <svg {...base}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const IconPrev = () => (
  <svg {...base}><path d="m15 18-6-6 6-6" /></svg>
);
export const IconNext = () => (
  <svg {...base}><path d="m9 18 6-6-6-6" /></svg>
);
export const IconZoomIn = () => (
  <svg {...base}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M11 8v6M8 11h6" /></svg>
);
export const IconZoomOut = () => (
  <svg {...base}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M8 11h6" /></svg>
);
export const IconRotate = () => (
  <svg {...base}><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
);
export const IconFullscreen = () => (
  <svg {...base}><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg>
);
export const IconExitFullscreen = () => (
  <svg {...base}><path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5" /></svg>
);
export const IconShare = () => (
  <svg {...base}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
);
export const IconDownload = () => (
  <svg {...base}><path d="M12 3v12M7 11l5 5 5-5M4 21h16" /></svg>
);
export const IconPlay = () => (
  <svg {...base}><path d="M6 4l14 8-14 8V4z" /></svg>
);
export const IconPause = () => (
  <svg {...base}><path d="M8 4v16M16 4v16" /></svg>
);
export const IconThumbUp = () => (
  <svg {...base}><path d="M7 22V10l5-8a2.5 2.5 0 0 1 2.4 3.2L13.5 9H19a2 2 0 0 1 2 2.4l-1.6 8A2 2 0 0 1 17.4 21H7z" /><path d="M7 10H4v11h3" /></svg>
);
export const IconThumbDown = () => (
  <svg {...base}><path d="M17 2v12l-5 8a2.5 2.5 0 0 1-2.4-3.2L10.5 15H5a2 2 0 0 1-2-2.4l1.6-8A2 2 0 0 1 6.6 3H17z" /><path d="M17 14h3V3h-3" /></svg>
);
export const IconChevronDown = () => (
  <svg {...base}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconImageOff = () => (
  <svg {...base}><path d="M3 3l18 18" /><path d="M21 15V5a2 2 0 0 0-2-2H7" /><path d="M3 7v12a2 2 0 0 0 2 2h12" /><path d="m3 17 5-5 3 3" /></svg>
);
