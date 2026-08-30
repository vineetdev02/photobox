import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImageViewer } from "../src/ImageViewer.js";
import type { ViewerImage } from "../src/types.js";

afterEach(cleanup);

const images: ViewerImage[] = [
  { src: "/out-1.jpg", title: "Elevation", group: "Outdoors" },
  { src: "/out-2.jpg", title: "Entrance", group: "Outdoors" },
  { src: "/in-1.jpg", title: "Kitchen", group: "Indoors" },
];

describe("rendering", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<ImageViewer images={images} open={false} />);
    expect(container.querySelector(".riv-root")).toBeNull();
  });

  it("renders nothing for an empty gallery rather than an empty overlay", () => {
    render(<ImageViewer images={[]} />);
    expect(document.querySelector(".riv-root")).toBeNull();
  });

  it("shows the first image, its caption and the group tabs", () => {
    render(<ImageViewer images={images} />);

    expect(document.querySelector<HTMLImageElement>(".riv-img")?.getAttribute("src")).toBe("/out-1.jpg");
    expect(document.querySelector(".riv-caption")?.textContent).toContain("Outdoors image 1 of 2");
    expect(screen.getByRole("tab", { name: /Outdoors/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Indoors/ })).toBeTruthy();
  });
});

describe("every part is a switch", () => {
  it("hides the chrome when the props are off", () => {
    render(
      <ImageViewer
        images={images}
        groups={false}
        thumbnails={false}
        toolbar={false}
        arrows={false}
        caption={false}
        closeButton={false}
        feedback={false}
      />,
    );

    expect(document.querySelector(".riv-groups")).toBeNull();
    expect(document.querySelector(".riv-thumbs-wrap")).toBeNull();
    expect(document.querySelector(".riv-toolbar")).toBeNull();
    expect(document.querySelector(".riv-arrow")).toBeNull();
    expect(document.querySelector(".riv-caption")).toBeNull();
    expect(document.querySelector(".riv-feedback")).toBeNull();
    // The image itself is not optional.
    expect(document.querySelector(".riv-img")).not.toBeNull();
  });

  it("drops individual tools without dropping the rail", () => {
    render(<ImageViewer images={images} zoom={false} rotate={false} share={false} fullscreen={false} />);
    expect(document.querySelector('[aria-label="Zoom in"]')).toBeNull();
    expect(document.querySelector('[aria-label="Rotate"]')).toBeNull();
  });
});

describe("navigation", () => {
  it("advances with the next arrow and reports the new index", () => {
    const onIndexChange = vi.fn();
    render(<ImageViewer images={images} onIndexChange={onIndexChange} />);

    fireEvent.click(screen.getByLabelText("Next image"));

    expect(onIndexChange).toHaveBeenCalledWith(1, expect.objectContaining({ index: 1 }));
    expect(document.querySelector<HTMLImageElement>(".riv-img")?.getAttribute("src")).toBe("/out-2.jpg");
  });

  it("wraps backwards from the first image when loop is on", () => {
    render(<ImageViewer images={images} loop />);
    fireEvent.click(screen.getByLabelText("Previous image"));
    expect(document.querySelector<HTMLImageElement>(".riv-img")?.getAttribute("src")).toBe("/out-2.jpg");
  });

  it("disables the arrow at the end instead of wrapping when loop is off", () => {
    render(<ImageViewer images={images} loop={false} />);
    expect(screen.getByLabelText("Previous image").hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByLabelText("Next image"));
    expect(screen.getByLabelText("Next image").hasAttribute("disabled")).toBe(true);
    expect(document.querySelector<HTMLImageElement>(".riv-img")?.getAttribute("src")).toBe("/out-2.jpg");
  });

  it("moves on the arrow keys", () => {
    render(<ImageViewer images={images} />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(document.querySelector<HTMLImageElement>(".riv-img")?.getAttribute("src")).toBe("/out-2.jpg");
  });

  it("closes on Escape, and does not when that is switched off", () => {
    const onClose = vi.fn();
    render(<ImageViewer images={images} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    cleanup();
    const onCloseOff = vi.fn();
    render(<ImageViewer images={images} onClose={onCloseOff} closeOnEscape={false} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCloseOff).not.toHaveBeenCalled();
  });
});

describe("groups", () => {
  it("filters to the selected group and restarts the count", () => {
    render(<ImageViewer images={images} />);

    fireEvent.click(screen.getByRole("tab", { name: /Indoors/ }));

    expect(document.querySelector<HTMLImageElement>(".riv-img")?.getAttribute("src")).toBe("/in-1.jpg");
    expect(document.querySelector(".riv-caption")?.textContent).toContain("Indoors image 1 of 1");
  });

  it("does not show a tab bar when a single group would be the only tab", () => {
    render(<ImageViewer images={[{ src: "/a.jpg", group: "Only" }]} />);
    expect(document.querySelector(".riv-group")).toBeNull();
  });
});

describe("actions and feedback", () => {
  it("renders custom actions and hands the current image back", () => {
    const onClick = vi.fn();
    render(<ImageViewer images={images} actions={[{ id: "b", label: "Brochure", onClick }]} />);

    fireEvent.click(screen.getByRole("button", { name: "Brochure" }));

    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ image: images[0], index: 0, total: 2 }));
  });

  it("renders an action with an href as a link", () => {
    render(<ImageViewer images={images} actions={[{ id: "b", label: "Brochure", href: "/b.pdf", download: true }]} />);
    const link = screen.getByRole("link", { name: "Brochure" });
    expect(link.getAttribute("href")).toBe("/b.pdf");
  });

  it("reports a feedback answer once and then thanks the user", () => {
    const onFeedback = vi.fn();
    render(<ImageViewer images={images} feedback onFeedback={onFeedback} />);

    fireEvent.click(screen.getByRole("button", { name: /Yes/ }));

    expect(onFeedback).toHaveBeenCalledWith("yes", expect.objectContaining({ index: 0 }));
    expect(document.querySelector(".riv-feedback-thanks")).not.toBeNull();
  });
});

describe("accessibility", () => {
  it("is a modal dialog with a live region for the position", () => {
    render(<ImageViewer images={images} />);
    const root = document.querySelector(".riv-root");
    expect(root?.getAttribute("role")).toBe("dialog");
    expect(root?.getAttribute("aria-modal")).toBe("true");
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe("1 / 2");
  });

  it("uses the label overrides it is given", () => {
    render(<ImageViewer images={images} labels={{ next: "Siguiente" }} />);
    expect(screen.getByLabelText("Siguiente")).toBeTruthy();
  });
});

describe("gestures must not swallow the controls", () => {
  /**
   * Regression: the stage called setPointerCapture on every pointerdown,
   * including presses that landed on the arrows and the tool rail. Capture
   * retargets later pointer events to the stage, so those buttons never
   * received a click and every one of them silently stopped working.
   */
  function captureSpyOnStage() {
    const stage = document.querySelector<HTMLElement>(".riv-stage");
    if (!stage) throw new Error("no stage");
    const spy = vi.fn();
    (stage as HTMLElement & { setPointerCapture: unknown }).setPointerCapture = spy;
    return { stage, spy };
  }

  it("does not capture the pointer when the press starts on an arrow", () => {
    render(<ImageViewer images={images} />);
    const { spy } = captureSpyOnStage();

    fireEvent.pointerDown(screen.getByLabelText("Next image"), { pointerId: 1 });

    expect(spy).not.toHaveBeenCalled();
  });

  it("does not capture the pointer when the press starts on a tool", () => {
    render(<ImageViewer images={images} />);
    const { spy } = captureSpyOnStage();

    fireEvent.pointerDown(screen.getByLabelText("Zoom in"), { pointerId: 1 });

    expect(spy).not.toHaveBeenCalled();
  });

  it("still captures the pointer for a drag on the image itself", () => {
    render(<ImageViewer images={images} />);
    const { stage, spy } = captureSpyOnStage();

    fireEvent.pointerDown(document.querySelector(".riv-img") as Element, { pointerId: 1 });

    // jsdom does not construct a real PointerEvent, so the id is not asserted
    // — what matters is that a drag on the picture still claims the pointer.
    expect(spy).toHaveBeenCalledTimes(1);
    expect(stage).not.toBeNull();
  });

  it("leaves the controls alone entirely when gestures are off", () => {
    render(<ImageViewer images={images} gestures={false} />);
    const { spy } = captureSpyOnStage();

    fireEvent.pointerDown(document.querySelector(".riv-img") as Element, { pointerId: 1 });

    expect(spy).not.toHaveBeenCalled();
  });
});

describe("feedback dismisses itself", () => {
  it("hides immediately on skip", () => {
    render(<ImageViewer images={images} feedback />);

    fireEvent.click(screen.getByRole("button", { name: "skip" }));

    expect(document.querySelector(".riv-feedback")).toBeNull();
  });

  it("thanks the user and then gets out of the way", async () => {
    vi.useFakeTimers();
    try {
      render(<ImageViewer images={images} feedback />);
      fireEvent.click(screen.getByRole("button", { name: /Yes/ }));

      expect(document.querySelector(".riv-feedback-thanks")).not.toBeNull();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(document.querySelector(".riv-feedback")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("switching group restarts the set", () => {
  it("asks a controlled consumer to go back to the first image", () => {
    const onIndexChange = vi.fn();
    render(<ImageViewer images={images} index={1} onIndexChange={onIndexChange} />);

    fireEvent.click(screen.getByRole("tab", { name: /Indoors/ }));

    expect(onIndexChange).toHaveBeenCalledWith(0, expect.objectContaining({ index: 0, total: 1 }));
  });
});

describe("accessibility", () => {
  /*
   * The rules turned off are environmental, not excuses. jsdom computes no
   * colours at all, so contrast cannot be judged here — it is a design review
   * question. `region` wants every node inside a landmark, which is a page
   * concern: an overlay portalled to <body> is not the host page's structure.
   */
  const rules = { "color-contrast": { enabled: false }, region: { enabled: false } };

  it("has no axe violations with the full chrome on", async () => {
    const axe = (await import("axe-core")).default;
    render(<ImageViewer images={images} />);

    const results = await axe.run(document.body, { rules });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  it("has no axe violations with every switch off", async () => {
    // The bare overlay is the configuration a consumer reaches for when they
    // want their own chrome, and it must not lose the dialog semantics.
    const axe = (await import("axe-core")).default;
    render(
      <ImageViewer
        images={images}
        groups={false}
        thumbnails={false}
        toolbar={false}
        arrows={false}
        caption={false}
      />,
    );

    const results = await axe.run(document.body, { rules });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  it("is a labelled modal dialog", () => {
    render(<ImageViewer images={images} />);
    const dialog = screen.getByRole("dialog");

    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toBeTruthy();
  });

  it("takes focus on open and hands it back on close", () => {
    // The restore is the half people forget: without it, dismissing the
    // viewer drops the caret at the top of the document and a keyboard user
    // loses their place on the page. The wrapping half of the trap cannot be
    // tested here — it filters on offsetParent, which jsdom always reports as
    // null, so every element reads as invisible.
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    expect(document.activeElement).toBe(opener);

    const { unmount } = render(<ImageViewer images={images} />);
    expect(document.activeElement).toBe(screen.getByRole("dialog"));

    unmount();
    expect(document.activeElement).toBe(opener);

    opener.remove();
  });
});
