# Roadmap

Nothing here is built. It is the queue, so we can take it one step at a time.

Current state: everything in the README works and is verified in a real browser.
31 tests pass.

---

## v0.2 — asked for

- [ ] **Smooth show/hide on the thumbnail strip.** Today it snaps. It needs a height
      transition, which means an explicit height rather than `auto` — or a grid-rows
      `0fr → 1fr` trick, which animates cleanly without measuring.
- [ ] **Tooltips on the left of the tool rail.** The rail uses the native `title`
      attribute, and the browser puts that below-right of the cursor, where it covers the
      next button down. Needs a real tooltip element positioned to the left, which also
      buys keyboard and touch users a label they can actually see.
- [ ] **Hide rotate.** *Note: rotate now works* — it was broken by the same pointer-capture
      bug that killed every other control, fixed in this pass. So this is now a choice
      about whether the tool earns its place, not a workaround. `rotate={false}` already
      hides it with no code change.
- [ ] **Download button.** Hidden for now, wanted in a later update. Like rotate, this
      needs no code: `download` already defaults to `false`, so it is off unless a
      consumer opts in. The demo no longer opts in.
- [ ] **Hide "Request more photos".** This one is consumer-side, not library-side: that
      button only exists because the demo passes it in `actions`. Dropping it from the
      `actions` array removes it. Nothing to build unless we want a built-in enquiry
      action with its own props.

---

## Found while building — worth queueing

### High value

- [ ] **Real-click tests in CI.** The bug that broke every button shipped because the
      tests clicked through `element.click()`, which skips the pointer pipeline entirely.
      jsdom cannot express pointer capture, pinch or swipe. A small Playwright suite
      driving actual mouse and touch input is the only thing that catches this class of
      bug, and it is the single highest-value item on this page.
- [ ] **Progressive loading.** A spinner on a slow connection is a blank screen. A
      blurred `thumbnail` scaled up underneath the full image, swapped on load, makes the
      viewer feel instant on mobile data.
- [ ] **Transition between images.** Right now the next image simply replaces the current
      one. A crossfade or slide, opt-out via prop, is what separates this from a plain
      lightbox.
- [ ] **Thumbnail virtualisation.** 13 thumbnails is nothing; 400 is 400 `<img>` elements
      in the DOM on open. Only the visible window needs to exist.
- [ ] **Deep linking.** Sync the index and group to the URL, so a shared link opens the
      photo that was shared. The share button currently copies the *image* URL, which is
      not the same thing.

### Medium

- [ ] **Video support.** Property galleries mix walkthroughs in with the photos. Needs a
      `type` on the item and a `<video>` branch in the stage.
- [ ] **iOS fullscreen fallback.** iPhone Safari has no element fullscreen, so the button
      is hidden there. A CSS-only "cover the viewport" mode would restore it.
- [ ] **RTL.** Arrow directions, the thumbnail strip and the tab bar all assume
      left-to-right.
- [ ] **Pinch zoom origin.** Pinch scales from the centre rather than from the midpoint
      between the two fingers, so the image drifts under them.
- [ ] **Pan inertia.** A flick while zoomed stops dead instead of gliding.
- [ ] **Slideshow progress.** The play button gives no sense of when the next image comes.
- [ ] **Shortcut help overlay** on `?`, listing the keyboard map.

### Low / nice to have

- [ ] **SSR first paint.** The component returns `null` until mounted, which is correct
      for a portal but means the first image is never in the server HTML. Only matters if
      we ever want the open state to be crawlable.
- [ ] **Drag-to-scroll the thumbnail strip** with a mouse, not just the scrollbar.
- [ ] **EXIF / metadata panel** — dimensions, capture date, camera.
- [ ] **Compare mode** — two images side by side, for before and after.
- [ ] **`onImageView` with dwell time**, for analytics on which photos hold attention.
- [ ] **Print / download all.**

---

## Decisions already made, so we do not relitigate them

- **Styles inject themselves** on first mount, and `dist/styles.css` is generated from the
  same string. There is no CSS import to forget, and the two can never drift.
- **`"use client"` is prepended after the bundle is written**, not via tsup's banner —
  rollup hoists module-level directives out of bundled chunks and silently drops them.
- **Zero runtime dependencies.** Icons are inline SVG, the gesture engine is hand-written.
  This is what keeps the package at 38.9 kB.
- **Gestures never start on a control.** A press on a button inside the stage must not
  call `setPointerCapture`, or that button stops working. This is the bug above; the guard
  has three regression tests on it.
- **Group switching restarts the index**, in both controlled and uncontrolled mode. Image
  6 of Indoors is not image 6 of Outdoors.
- **Every feature is a prop**, and switching one off removes it rather than hiding it.
