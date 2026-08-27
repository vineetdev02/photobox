# photobox

A full-featured image viewer for React. Groups, zoom, pan, pinch, rotate, fullscreen, share,
thumbnails, custom header actions, a feedback bar — and every one of them is a prop you can
switch off.

Works in **React**, **Vite**, **Next.js** (App Router and Pages), Remix, and anything else that
renders React 18 or 19. Zero runtime dependencies.

```bash
npm i photobox
```

## Quick start

```tsx
import { ImageViewer, useImageViewer } from "photobox";

const images = [
  { src: "/tower.jpg", thumbnail: "/tower-t.jpg", title: "Elevation", group: "Outdoors" },
  { src: "/lobby.jpg", thumbnail: "/lobby-t.jpg", title: "Lobby",     group: "Indoors"  },
];

export function Gallery() {
  const viewer = useImageViewer();

  return (
    <>
      {images.map((image, i) => (
        <img key={image.src} src={image.thumbnail} onClick={() => viewer.openAt(i)} />
      ))}

      <ImageViewer {...viewer.props} images={images} />
    </>
  );
}
```

`useImageViewer` is a convenience, not a requirement. `ImageViewer` is controlled by plain props,
so `open`, `index`, `onClose` and `onIndexChange` work with whatever state you already have.

Styles are injected on first mount, so there is no CSS import to forget. If you would rather own
them, `import "photobox/styles.css"` and pass `injectStyles={false}`.

## Next.js

Nothing to configure. The built files carry the `"use client"` directive, so the component works
inside a server component without a wrapper.

To render through `next/image`, use the escape hatch:

```tsx
<ImageViewer
  images={images}
  renderImage={({ image, className }) => (
    <Image src={image.src} alt={image.alt ?? ""} fill className={className} />
  )}
/>
```

## Every part is a switch

```tsx
<ImageViewer
  images={images}

  groups={false}       // the tab bar
  thumbnails={false}   // the bottom strip
  toolbar={false}      // the whole tool rail
  arrows={false}       // prev / next
  caption={false}      // the line under the image
  closeButton={false}
  feedback             // "Is this photo helpful?"
  counter              // "3 / 12"

  zoom rotate fullscreen share download slideshow   // individual tools
/>
```

A tool switched off is not rendered, not merely hidden — `toolbar={false}` removes the rail and
every tool in it in one go.

## Header actions

The buttons in the top right are yours. Brochure, request more photos, contact — anything.

```tsx
<ImageViewer
  images={images}
  actions={[
    { id: "brochure", label: "Brochure", icon: <DownloadIcon />, href: "/brochure.pdf", download: true, compact: true },
    { id: "enquire", label: "Request more photos", primary: true, onClick: ({ image, index }) => open(image, index) },
  ]}
/>
```

| field | effect |
| --- | --- |
| `href` | renders an anchor instead of a button |
| `download` | sets the download attribute on an `href` action |
| `primary` | filled accent styling, for the one action that matters most |
| `compact` | collapses to icon-only on narrow screens (ignored when there is no icon) |
| `onClick` | receives `{ image, index, total, absoluteIndex, group }` |

## Groups

Give an image a `group` and the tab bar builds itself, with counts, in first-seen order.
Switching tabs filters the set and restarts the count — image 6 of Indoors is not image 6 of
Outdoors. One group means no tab bar at all.

```tsx
<ImageViewer images={images} groups allGroupsTab defaultGroup="Indoors" />
```

## Gestures and keyboard

| input | action |
| --- | --- |
| drag / swipe | pan when zoomed, change image when not |
| pinch, wheel | zoom |
| double click / tap | zoom to 2.5×, again to reset |
| `←` `→` | previous / next |
| `+` `-` `0` | zoom in / out / reset |
| `R` | rotate 90° |
| `F` | fullscreen |
| `Esc` | close |

Turn them off with `gestures={false}`, `keyboard={false}`, `wheelZoom={false}`,
`doubleClickZoom={false}`.

## Props

**Content** — `images`, `open`, `onClose`, `index`, `defaultIndex`, `onIndexChange`

**Chrome** — `groups`, `defaultGroup`, `allGroupsTab`, `thumbnails`, `thumbnailsCollapsible`,
`defaultThumbnailsOpen`, `caption`, `counter`, `arrows`, `closeButton`, `toolbar`

**Tools** — `zoom`, `rotate`, `fullscreen`, `share`, `download`, `slideshow`

**Behaviour** — `loop`, `keyboard`, `gestures`, `closeOnBackdrop`, `closeOnEscape`, `scrollLock`,
`preload`, `minZoom`, `maxZoom`, `zoomStep`, `doubleClickZoom`, `wheelZoom`, `slideshowInterval`

**Presentation** — `theme` (`dark` · `light` · `auto`), `className`, `style`, `zIndex`, `portal`,
`injectStyles`, `labels`

**Escape hatches** — `renderImage`, `renderThumbnail`, `headerExtra`, `footerExtra`

**Callbacks** — `onOpen`, `onShare`, `onDownload`, `onFeedback`, `onZoomChange`, `onGroupChange`

Every prop is typed and documented in the `.d.ts`, so the editor will tell you the rest.

## Theming

Colours, radius and sizes are CSS custom properties. Override them anywhere the viewer is in scope:

```css
.riv-root {
  --riv-accent: #2563eb;
  --riv-bg: #000;
  --riv-radius: 4px;
}
```

`theme="auto"` follows `prefers-color-scheme`.

## Internationalisation

Every string is overridable, including the caption template:

```tsx
<ImageViewer
  images={images}
  labels={{
    next: "अगली", previous: "पिछली", close: "बंद करें",
    caption: "{group} · चित्र {index}/{total} · {title}",
  }}
/>
```

Placeholders that have no value are removed along with the punctuation around them, so a gallery
with no groups never prints a stray separator.

## Accessibility

Rendered as `role="dialog"` with `aria-modal`, focus trapped inside and returned to the trigger
on close, an `aria-live` region announcing position, real `<button>` elements throughout, and
`prefers-reduced-motion` respected.

## Responsive

One component, three layouts. Above 820px the tool rail sits on the right edge and the next arrow
steps aside for it. Below 820px labels collapse to icons. Below 560px the header splits into two
rows, actions stretch to fill, and the rail becomes a pill along the bottom.

## Development

```bash
npm run demo       # vite demo on :5178, exercises every feature
npm test           # vitest
npm run typecheck
npm run build      # tsup -> dist/ (esm + cjs + d.ts), then styles.css and "use client"
```

## Licence

MIT
