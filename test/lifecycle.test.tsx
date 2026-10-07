import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ImageViewer } from "../src/ImageViewer.js";
import type { ImageViewerProps, ViewerImage } from "../src/types.js";
import { useImageViewer } from "../src/useImageViewer.js";

afterEach(cleanup);

/**
 * jsdom has no PointerEvent, so testing-library falls back to a plain Event and
 * every pointer arrives with the same undefined id — two fingers read as one.
 * A pinch cannot be expressed without telling them apart.
 */
beforeAll(() => {
  if (typeof window.PointerEvent === "function") return;
  class PointerEventShim extends MouseEvent {
    readonly pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  (window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventShim;
});

const images: ViewerImage[] = [
  { src: "/out-1.jpg", title: "Elevation", group: "Outdoors" },
  { src: "/out-2.jpg", title: "Entrance", group: "Outdoors" },
  { src: "/in-1.jpg", title: "Kitchen", group: "Indoors" },
  { src: "/in-2.jpg", title: "Bath", group: "Indoors" },
];

const currentSrc = (): string | null =>
  document.querySelector<HTMLImageElement>("img.riv-img")?.getAttribute("src") ?? null;
const activeTab = (): string | null =>
  document.querySelector('[role="tab"][aria-selected="true"]')?.textContent ?? null;
const caption = (): string => document.querySelector(".riv-caption")?.textContent ?? "";
const imageTransform = (): string =>
  document.querySelector<HTMLElement>(".riv-img")?.style.transform ?? "";

/** The README's quick start: a grid of every image, each tile opening the viewer. */
function Gallery(props: Partial<ImageViewerProps>) {
  const viewer = useImageViewer();
  return (
    <>
      {images.map((image, position) => (
        <button key={image.src} type="button" data-testid={`tile-${position}`} onClick={() => viewer.openAt(position)}>
          {image.title}
        </button>
      ))}
      <ImageViewer {...viewer.props} images={images} {...props} />
    </>
  );
}

describe("opening from a grid", () => {
  /*
   * A grid tile knows its position in `images`. The viewer's `index` is a
   * position in the *visible* set, so with groups on, tile 2 opened the first
   * group at position 2 — clamped to its last image. The README's own quick
   * start showed the wrong photo for every tile outside the first group.
   */
  it("opens on the tile that was clicked, in that tile's group", () => {
    render(<Gallery />);
    fireEvent.click(screen.getByTestId("tile-2"));

    expect(currentSrc()).toBe("/in-1.jpg");
    expect(activeTab()).toMatch(/Indoors/);
    expect(caption()).toContain("Indoors image 1 of 2");
  });

  it("opens the right image after the reader switched tabs and closed", () => {
    render(<Gallery allGroupsTab />);
    fireEvent.click(screen.getByTestId("tile-0"));
    fireEvent.click(screen.getByRole("tab", { name: /Indoors/ }));
    fireEvent.keyDown(window, { key: "Escape" });

    fireEvent.click(screen.getByTestId("tile-1"));

    expect(currentSrc()).toBe("/out-2.jpg");
  });

  it("stays on the All tab when the clicked image is already in it", () => {
    render(<Gallery allGroupsTab />);
    fireEvent.click(screen.getByTestId("tile-3"));

    expect(currentSrc()).toBe("/in-2.jpg");
    expect(activeTab()).toMatch(/All/);
  });

  it("steps through the group it opened in and reports positions in `images`", () => {
    const seen: number[] = [];
    function Tracked() {
      const viewer = useImageViewer();
      return (
        <>
          <button type="button" data-testid="open" onClick={() => viewer.openAt(2)} />
          <ImageViewer
            {...viewer.props}
            images={images}
            onIndexChange={(index, context) => {
              viewer.props.onIndexChange(index, context);
              seen.push(context.absoluteIndex);
            }}
          />
        </>
      );
    }
    render(<Tracked />);
    fireEvent.click(screen.getByTestId("open"));
    fireEvent.click(screen.getByLabelText("Next image"));

    expect(currentSrc()).toBe("/in-2.jpg");
    expect(caption()).toContain("Indoors image 2 of 2");
    expect(seen).toEqual([3]);
  });

  it("answers a tab click with the first image of that tab", () => {
    render(<Gallery />);
    fireEvent.click(screen.getByTestId("tile-3"));
    fireEvent.click(screen.getByRole("tab", { name: /Outdoors/ }));

    expect(currentSrc()).toBe("/out-1.jpg");
    expect(activeTab()).toMatch(/Outdoors/);
  });

  it("shows an ungrouped image rather than filtering it away", () => {
    const mixed = [...images, { src: "/plan.jpg", title: "Floor plan" }];
    render(<ImageViewer images={mixed} absoluteIndex={4} />);

    expect(currentSrc()).toBe("/plan.jpg");
  });
});

describe("images that arrive after the viewer mounted", () => {
  /*
   * The tab was chosen once, from whatever `images` held on the first render.
   * A gallery that fetches its photos mounts with an empty array, so the
   * choice was "no group" — and when the photos arrived every image was shown
   * under a tab bar with no tab selected.
   */
  it("still selects the first tab", () => {
    const { rerender } = render(<ImageViewer images={[]} />);
    rerender(<ImageViewer images={images} />);

    expect(activeTab()).toMatch(/Outdoors/);
    expect(caption()).toContain("Outdoors image 1 of 2");
  });

  it("still honours defaultGroup", () => {
    const { rerender } = render(<ImageViewer images={[]} defaultGroup="Indoors" />);
    rerender(<ImageViewer images={images} defaultGroup="Indoors" />);

    expect(currentSrc()).toBe("/in-1.jpg");
  });

  it("reports onOpen once there is something open", () => {
    const onOpen = vi.fn();
    const { rerender } = render(<ImageViewer images={[]} onOpen={onOpen} />);
    expect(onOpen).not.toHaveBeenCalled();

    rerender(<ImageViewer images={images} onOpen={onOpen} />);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ index: 0, absoluteIndex: 0 }));
  });
});

describe("an open viewer with nothing to show leaves the page alone", () => {
  /*
   * `open` defaults to true, so a gallery whose images are still loading is an
   * open viewer with no overlay. It used to take the arrow keys and freeze the
   * scroll of a page that showed nothing on top of it.
   */
  it("does not swallow the arrow keys", () => {
    render(<ImageViewer images={[]} />);
    expect(fireEvent.keyDown(window, { key: "ArrowRight" })).toBe(true);
    expect(fireEvent.keyDown(window, { key: "r" })).toBe(true);
  });

  it("does not lock the page's scroll", () => {
    render(<ImageViewer images={[]} />);
    expect(document.body.style.overflow).toBe("");
  });
});

describe("wheel zoom", () => {
  /*
   * The wheel listener was attached in an effect that read the stage ref once.
   * The overlay is gated on a mount flag, so on that pass there was no stage,
   * and nothing in the effect's dependencies changed when the stage arrived —
   * the wheel never zoomed anything.
   */
  it("zooms a viewer that was open from the first render", () => {
    render(<ImageViewer images={images} />);
    fireEvent.wheel(document.querySelector(".riv-stage") as Element, { deltaY: -100 });

    expect(imageTransform()).toContain("scale(1.3)");
  });

  it("zooms a viewer that was opened after it mounted", () => {
    const { rerender } = render(<ImageViewer images={images} open={false} />);
    rerender(<ImageViewer images={images} open />);
    fireEvent.wheel(document.querySelector(".riv-stage") as Element, { deltaY: -100 });

    expect(imageTransform()).toContain("scale(1.3)");
  });

  it("leaves the wheel alone when wheelZoom is off", () => {
    render(<ImageViewer images={images} wheelZoom={false} />);
    const stage = document.querySelector(".riv-stage") as Element;

    expect(fireEvent.wheel(stage, { deltaY: -100 })).toBe(true);
    expect(imageTransform()).toContain("scale(1)");
  });
});

describe("a pinch is not a swipe", () => {
  /*
   * The swipe test compared where the first finger went down with where the
   * last one came up. Two fingers 200px apart, lifted without moving, read as
   * a 200px flick and changed the image.
   */
  it("keeps the image after two fingers go down and come up", () => {
    render(<ImageViewer images={images} groups={false} />);
    const target = document.querySelector(".riv-img") as Element;

    fireEvent.pointerDown(target, { pointerId: 1, clientX: 100, clientY: 200 });
    fireEvent.pointerDown(target, { pointerId: 2, clientX: 300, clientY: 200 });
    fireEvent.pointerUp(target, { pointerId: 1, clientX: 100, clientY: 200 });
    fireEvent.pointerUp(target, { pointerId: 2, clientX: 300, clientY: 200 });

    expect(currentSrc()).toBe("/out-1.jpg");
  });

  it("still changes image on a one-finger flick", () => {
    render(<ImageViewer images={images} groups={false} />);
    const target = document.querySelector(".riv-img") as Element;

    fireEvent.pointerDown(target, { pointerId: 1, clientX: 300, clientY: 200 });
    fireEvent.pointerUp(target, { pointerId: 1, clientX: 100, clientY: 200 });

    expect(currentSrc()).toBe("/out-2.jpg");
  });
});

describe("the slideshow without loop", () => {
  it("stops on the last image instead of reporting it again on every tick", () => {
    vi.useFakeTimers();
    try {
      const onIndexChange = vi.fn();
      render(
        <ImageViewer
          images={images}
          groups={false}
          loop={false}
          slideshow
          slideshowInterval={1000}
          defaultIndex={2}
          onIndexChange={onIndexChange}
        />,
      );
      fireEvent.click(screen.getByTitle("Start slideshow"));

      act(() => { vi.advanceTimersByTime(1000); });
      expect(currentSrc()).toBe("/in-2.jpg");

      act(() => { vi.advanceTimersByTime(5000); });
      expect(onIndexChange).toHaveBeenCalledTimes(1);
      expect(screen.getByTitle("Start slideshow")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not report a move that did not happen", () => {
    const onIndexChange = vi.fn();
    render(<ImageViewer images={images} groups={false} loop={false} defaultIndex={3} onIndexChange={onIndexChange} />);

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(onIndexChange).not.toHaveBeenCalled();
  });
});

describe("loading state", () => {
  it("does not spin forever over a custom renderer it cannot watch", () => {
    render(<ImageViewer images={images} renderImage={({ image }) => <img src={image.src} alt="" />} />);
    expect(document.querySelector(".riv-spinner")).toBeNull();
  });

  it("hides the next image until that image has loaded", () => {
    render(<ImageViewer images={images} groups={false} />);
    fireEvent.load(document.querySelector("img.riv-img") as Element);
    expect(document.querySelector<HTMLElement>("img.riv-img")?.style.visibility).toBe("visible");

    fireEvent.click(screen.getByLabelText("Next image"));
    expect(document.querySelector<HTMLElement>("img.riv-img")?.style.visibility).toBe("hidden");
    expect(document.querySelector(".riv-spinner")).not.toBeNull();

    fireEvent.load(document.querySelector("img.riv-img") as Element);
    expect(document.querySelector<HTMLElement>("img.riv-img")?.style.visibility).toBe("visible");
  });
});

describe("fullscreen", () => {
  const doc = document as Document & { webkitFullscreenEnabled?: boolean };
  const proto = HTMLElement.prototype as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

  /*
   * Support was judged from the overlay element, read in an effect that ran
   * before the overlay existed. On a browser with only the prefixed API the
   * answer was always "unsupported" and the button never appeared.
   */
  it("is offered where only the prefixed API exists", () => {
    Object.defineProperty(doc, "webkitFullscreenEnabled", { value: true, configurable: true });
    proto.webkitRequestFullscreen = () => Promise.resolve();
    try {
      render(<ImageViewer images={images} />);
      expect(screen.queryByLabelText("Fullscreen")).not.toBeNull();
    } finally {
      delete doc.webkitFullscreenEnabled;
      delete proto.webkitRequestFullscreen;
    }
  });

  it("does not mistake another element's fullscreen for its own", () => {
    const other = document.createElement("div");
    document.body.append(other);
    Object.defineProperty(doc, "fullscreenElement", { get: () => other, configurable: true });
    try {
      const onClose = vi.fn();
      render(<ImageViewer images={images} onClose={onClose} />);
      act(() => { document.dispatchEvent(new Event("fullscreenchange")); });

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      Reflect.deleteProperty(doc, "fullscreenElement");
      other.remove();
    }
  });
});

describe("header actions", () => {
  it("a disabled link action cannot be followed", () => {
    const onClick = vi.fn();
    render(<ImageViewer images={images} actions={[{ id: "b", label: "Brochure", href: "/b.pdf", disabled: true, onClick }]} />);

    const control = screen.getByTitle("Brochure");
    fireEvent.click(control);

    expect(control.getAttribute("href")).toBeNull();
    expect(control.hasAttribute("disabled")).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });
});
