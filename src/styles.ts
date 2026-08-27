/**
 * The whole stylesheet, as one string. It is the single source of truth: the
 * component injects it at runtime, and the build writes the same text out to
 * dist/styles.css for anyone who would rather manage CSS themselves.
 *
 * Everything is namespaced under .riv- and driven by custom properties, so a
 * consumer can restyle the viewer without patching selectors.
 */
export const css = `
.riv-root {
  --riv-bg: #09090b;
  --riv-surface: rgba(24, 24, 27, 0.92);
  --riv-surface-hover: rgba(63, 63, 70, 0.9);
  --riv-border: rgba(255, 255, 255, 0.12);
  --riv-text: #fafafa;
  --riv-text-dim: rgba(250, 250, 250, 0.62);
  --riv-accent: #f59e0b;
  --riv-accent-text: #1c1917;
  --riv-focus: #60a5fa;
  --riv-radius: 10px;
  --riv-header-h: 56px;
  --riv-thumb-h: 92px;
  --riv-gap: 12px;
  --riv-ease: cubic-bezier(0.22, 0.61, 0.36, 1);

  position: fixed;
  inset: 0;
  z-index: var(--riv-z, 9999);
  display: flex;
  flex-direction: column;
  background: var(--riv-bg);
  color: var(--riv-text);
  font-family: var(--riv-font, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 1.45;
  -webkit-tap-highlight-color: transparent;
  animation: riv-fade 180ms var(--riv-ease);
  overscroll-behavior: contain;
}

.riv-root[data-theme="light"] {
  --riv-bg: #fafafa;
  --riv-surface: rgba(255, 255, 255, 0.92);
  --riv-surface-hover: rgba(228, 228, 231, 0.95);
  --riv-border: rgba(9, 9, 11, 0.12);
  --riv-text: #18181b;
  --riv-text-dim: rgba(24, 24, 27, 0.6);
  --riv-accent: #b45309;
  --riv-accent-text: #ffffff;
}

@media (prefers-color-scheme: light) {
  .riv-root[data-theme="auto"] {
    --riv-bg: #fafafa;
    --riv-surface: rgba(255, 255, 255, 0.92);
    --riv-surface-hover: rgba(228, 228, 231, 0.95);
    --riv-border: rgba(9, 9, 11, 0.12);
    --riv-text: #18181b;
    --riv-text-dim: rgba(24, 24, 27, 0.6);
    --riv-accent: #b45309;
    --riv-accent-text: #ffffff;
  }
}

@keyframes riv-fade { from { opacity: 0 } to { opacity: 1 } }

.riv-root *, .riv-root *::before, .riv-root *::after { box-sizing: border-box; }

.riv-root :focus-visible {
  outline: 2px solid var(--riv-focus);
  outline-offset: 2px;
}

/* ---------- header ---------- */

.riv-header {
  flex: 0 0 auto;
  min-height: var(--riv-header-h);
  display: flex;
  align-items: stretch;
  gap: var(--riv-gap);
  border-bottom: 1px solid var(--riv-border);
  background: var(--riv-surface);
}

.riv-groups {
  flex: 1 1 auto;
  display: flex;
  align-items: stretch;
  gap: 4px;
  padding: 0 8px;
  overflow-x: auto;
  scrollbar-width: none;
}
.riv-groups::-webkit-scrollbar { display: none; }

.riv-group {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--riv-text-dim);
  font: inherit;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  font-size: 12.5px;
  padding: 0 14px;
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: color 140ms var(--riv-ease), border-color 140ms var(--riv-ease);
}
.riv-group:hover { color: var(--riv-text); }
.riv-group[aria-selected="true"] {
  color: var(--riv-accent);
  border-bottom-color: var(--riv-accent);
}
.riv-group-count { opacity: 0.7; margin-left: 5px; font-weight: 500; }

.riv-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  gap: 0;
}

.riv-action {
  appearance: none;
  border: 0;
  border-left: 1px solid var(--riv-border);
  background: transparent;
  color: var(--riv-text);
  font: inherit;
  font-weight: 600;
  font-size: 12.5px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  text-decoration: none;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 140ms var(--riv-ease);
}
.riv-action:hover:not(:disabled) { background: var(--riv-surface-hover); }
.riv-action:disabled { opacity: 0.45; cursor: not-allowed; }
.riv-action[data-primary="true"] { background: var(--riv-accent); color: var(--riv-accent-text); }
.riv-action[data-primary="true"]:hover:not(:disabled) { filter: brightness(1.08); }
.riv-action svg { width: 16px; height: 16px; flex: 0 0 auto; }

.riv-close { padding: 0 16px; }
.riv-close svg { width: 18px; height: 18px; }

/* ---------- body ---------- */

.riv-body {
  flex: 1 1 auto;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.riv-feedback {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  background: var(--riv-surface);
  border: 1px solid var(--riv-border);
  border-top: 0;
  border-radius: 0 0 var(--riv-radius) var(--riv-radius);
  font-size: 13px;
  max-width: calc(100% - 24px);
}
.riv-feedback-q { color: var(--riv-text); white-space: nowrap; }
.riv-feedback-btn {
  appearance: none;
  border: 1px solid transparent;
  background: transparent;
  color: var(--riv-text);
  font: inherit;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 140ms var(--riv-ease);
}
.riv-feedback-btn:hover { background: var(--riv-surface-hover); }
.riv-feedback-btn[aria-pressed="true"] { border-color: var(--riv-accent); color: var(--riv-accent); }
.riv-feedback-btn svg { width: 15px; height: 15px; }
.riv-feedback-skip { color: var(--riv-text-dim); text-decoration: underline; }
.riv-feedback-thanks { color: var(--riv-accent); font-weight: 600; }
/* The acknowledgement fades rather than blinking out from over the picture. */
.riv-feedback[data-state="answered"] { animation: riv-fade-out 1600ms var(--riv-ease) forwards; }
@keyframes riv-fade-out { 0%, 60% { opacity: 1 } 100% { opacity: 0 } }

/* ---------- stage ---------- */

.riv-stage {
  flex: 1 1 auto;
  position: relative;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

.riv-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.riv-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  will-change: transform;
  transform-origin: center center;
  -webkit-user-drag: none;
  user-select: none;
}
.riv-img[data-animate="true"] { transition: transform 200ms var(--riv-ease); }
.riv-stage[data-zoomed="true"] { cursor: grab; }
.riv-stage[data-panning="true"] { cursor: grabbing; }

.riv-spinner {
  position: absolute;
  width: 34px;
  height: 34px;
  border: 3px solid var(--riv-border);
  border-top-color: var(--riv-accent);
  border-radius: 50%;
  animation: riv-spin 720ms linear infinite;
}
@keyframes riv-spin { to { transform: rotate(360deg) } }

.riv-error {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--riv-text-dim);
}
.riv-error button {
  appearance: none;
  border: 1px solid var(--riv-border);
  background: var(--riv-surface);
  color: var(--riv-text);
  font: inherit;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}

/* ---------- arrows ---------- */

.riv-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--riv-text);
  width: 56px;
  height: 88px;
  display: grid;
  place-items: center;
  cursor: pointer;
  opacity: 0.75;
  transition: opacity 140ms var(--riv-ease), background 140ms var(--riv-ease);
}
.riv-arrow:hover { opacity: 1; background: linear-gradient(var(--riv-surface), var(--riv-surface)); }
.riv-arrow:disabled { opacity: 0.2; cursor: default; background: none; }
.riv-arrow svg { width: 30px; height: 30px; }
.riv-arrow-prev { left: 0; }
.riv-arrow-next { right: 0; }
/* The tool rail owns the right edge, so the next arrow steps aside for it
   rather than sitting underneath and swallowing the click. */
.riv-stage[data-toolbar="true"] .riv-arrow-next { right: 62px; }

/* ---------- toolbar ---------- */

.riv-toolbar {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.riv-tool {
  appearance: none;
  width: 38px;
  height: 38px;
  border: 1px solid var(--riv-border);
  border-radius: 50%;
  background: var(--riv-surface);
  color: var(--riv-text);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 140ms var(--riv-ease), transform 140ms var(--riv-ease);
}
.riv-tool:hover:not(:disabled) { background: var(--riv-surface-hover); transform: scale(1.06); }
.riv-tool:disabled { opacity: 0.35; cursor: not-allowed; }
.riv-tool[aria-pressed="true"] { border-color: var(--riv-accent); color: var(--riv-accent); }
.riv-tool svg { width: 18px; height: 18px; }

.riv-toast {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  background: var(--riv-surface);
  border: 1px solid var(--riv-border);
  border-radius: var(--riv-radius);
  padding: 7px 14px;
  font-size: 13px;
  animation: riv-fade 160ms var(--riv-ease);
}

/* ---------- caption ---------- */

.riv-caption {
  flex: 0 0 auto;
  padding: 10px 16px;
  text-align: center;
  color: var(--riv-text-dim);
  font-size: 13px;
  letter-spacing: 0.02em;
}
.riv-caption-title { color: var(--riv-text); }

/* ---------- thumbnails ---------- */

.riv-thumbs-wrap {
  flex: 0 0 auto;
  position: relative;
  border-top: 1px solid var(--riv-border);
  background: var(--riv-surface);
}

.riv-thumbs {
  display: flex;
  gap: 8px;
  padding: 10px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
}
.riv-thumbs::-webkit-scrollbar { height: 6px; }
.riv-thumbs::-webkit-scrollbar-thumb { background: var(--riv-border); border-radius: 3px; }

.riv-thumb {
  appearance: none;
  flex: 0 0 auto;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  background: transparent;
  cursor: pointer;
  height: calc(var(--riv-thumb-h) - 20px);
  width: calc((var(--riv-thumb-h) - 20px) * 1.45);
  opacity: 0.62;
  transition: opacity 140ms var(--riv-ease), border-color 140ms var(--riv-ease);
}
.riv-thumb:hover { opacity: 1; }
.riv-thumb[aria-current="true"] { opacity: 1; border-color: var(--riv-accent); }
.riv-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

.riv-thumbs-toggle {
  position: absolute;
  right: 10px;
  bottom: calc(100% + 6px);
  appearance: none;
  border: 1px solid var(--riv-border);
  border-radius: 6px 6px 0 0;
  border-bottom: 0;
  background: var(--riv-surface);
  color: var(--riv-text);
  font: inherit;
  font-size: 12px;
  padding: 4px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.riv-thumbs-toggle:hover { background: var(--riv-surface-hover); }
.riv-thumbs-toggle svg { width: 13px; height: 13px; transition: transform 160ms var(--riv-ease); }
.riv-thumbs-toggle[aria-expanded="false"] svg { transform: rotate(180deg); }

.riv-sr {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ---------- responsive ---------- */

@media (max-width: 820px) {
  .riv-root { --riv-header-h: 50px; --riv-thumb-h: 74px; }
  .riv-action { padding: 0 12px; font-size: 11.5px; }
  .riv-action[data-compact="true"] span { display: none; }
  .riv-action[data-compact="true"] { padding: 0 14px; }
  .riv-toolbar { right: 8px; gap: 6px; }
  .riv-tool { width: 34px; height: 34px; }
  .riv-stage[data-toolbar="true"] .riv-arrow-next { right: 50px; }
  .riv-arrow { width: 44px; height: 72px; }
  .riv-arrow svg { width: 24px; height: 24px; }
  .riv-group { padding: 0 10px; font-size: 11.5px; }
}

@media (max-width: 560px) {
  .riv-root { --riv-thumb-h: 64px; }
  .riv-header { flex-direction: column; align-items: stretch; }
  .riv-groups { order: 2; border-top: 1px solid var(--riv-border); min-height: 40px; }
  .riv-actions { order: 1; min-height: var(--riv-header-h); }
  .riv-action { flex: 1 1 auto; justify-content: center; border-left: 0; border-right: 1px solid var(--riv-border); }
  .riv-close { flex: 0 0 auto; }
  .riv-toolbar {
    flex-direction: row;
    top: auto;
    bottom: 8px;
    right: 50%;
    transform: translateX(50%);
    background: var(--riv-surface);
    border: 1px solid var(--riv-border);
    border-radius: 999px;
    padding: 5px;
  }
  .riv-tool { border: 0; background: transparent; width: 36px; height: 36px; }
  .riv-arrow { width: 38px; }
  .riv-stage[data-toolbar="true"] .riv-arrow-next { right: 0; }
  .riv-feedback { font-size: 12px; gap: 6px; padding: 6px 10px; }
  .riv-caption { font-size: 12px; padding: 8px 12px 34px; }
  .riv-toast { bottom: 58px; }
}

@media (prefers-reduced-motion: reduce) {
  .riv-root, .riv-img, .riv-tool, .riv-thumbs { animation: none !important; transition: none !important; }
}
`;
