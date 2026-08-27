import { useEffect, useRef, type ReactNode } from "react";

import type { ViewerImage, ViewerLabels } from "../types.js";
import { IconChevronDown } from "./Icons.js";

interface Props {
  images: ViewerImage[];
  index: number;
  open: boolean;
  collapsible: boolean;
  labels: ViewerLabels;
  onSelect: (index: number) => void;
  onToggle: () => void;
  renderThumbnail?: (image: ViewerImage, index: number, active: boolean) => ReactNode;
}

export function Thumbnails({
  images,
  index,
  open,
  collapsible,
  labels,
  onSelect,
  onToggle,
  renderThumbnail,
}: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep the current thumbnail in view when the image changes from the arrows
  // or the keyboard, otherwise the strip and the stage disagree about where
  // the user is.
  useEffect(() => {
    if (!open) return;
    // Guarded because scrollIntoView is absent in jsdom and in older embedded
    // webviews; a thumbnail that fails to centre must not take the viewer down
    // with it.
    const active = activeRef.current;
    if (typeof active?.scrollIntoView !== "function") return;
    active.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index, open]);

  return (
    <div className="riv-thumbs-wrap">
      {collapsible ? (
        <button
          type="button"
          className="riv-thumbs-toggle"
          aria-expanded={open}
          onClick={onToggle}
        >
          {open ? labels.hideThumbnails : labels.showThumbnails}
          <IconChevronDown />
        </button>
      ) : null}

      {open ? (
        <div className="riv-thumbs" ref={stripRef} role="listbox" aria-label="Thumbnails">
          {images.map((image, position) => {
            const active = position === index;
            return (
              <button
                key={`${image.src}-${position}`}
                ref={active ? activeRef : undefined}
                type="button"
                role="option"
                aria-selected={active}
                aria-current={active}
                className="riv-thumb"
                onClick={() => onSelect(position)}
              >
                {renderThumbnail ? (
                  renderThumbnail(image, position, active)
                ) : (
                  <img
                    src={image.thumbnail ?? image.src}
                    alt={image.alt ?? image.title ?? ""}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
