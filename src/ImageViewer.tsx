import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

import { Feedback } from "./components/Feedback.js";
import { Header } from "./components/Header.js";
import {
  IconDownload,
  IconExitFullscreen,
  IconFullscreen,
  IconImageOff,
  IconNext,
  IconPause,
  IconPlay,
  IconPrev,
  IconRotate,
  IconShare,
  IconZoomIn,
  IconZoomOut,
} from "./components/Icons.js";
import { Thumbnails } from "./components/Thumbnails.js";
import { defaultLabels } from "./defaults.js";
import { useFocusTrap } from "./hooks/useFocusTrap.js";
import { useFullscreen } from "./hooks/useFullscreen.js";
import { usePreload } from "./hooks/usePreload.js";
import { useScrollLock } from "./hooks/useScrollLock.js";
import { useStyles } from "./hooks/useStyles.js";
import { useZoomPan } from "./hooks/useZoomPan.js";
import type { FeedbackValue, ImageViewerProps, ViewerContext, ViewerImage } from "./types.js";
import { absoluteUrl, countInGroup, deriveGroups, downloadFile, formatTemplate, shareUrl } from "./utils.js";

export function ImageViewer(props: ImageViewerProps) {
  const {
    images,
    open = true,
    onClose,
    groups: groupsEnabled = true,
    defaultGroup,
    allGroupsTab = false,
    thumbnails: thumbnailsEnabled = true,
    thumbnailsCollapsible = true,
    defaultThumbnailsOpen = true,
    caption: captionProp = true,
    counter = false,
    arrows = true,
    closeButton = true,
    toolbar = true,
    zoom = true,
    rotate = true,
    fullscreen = true,
    share = true,
    download = false,
    slideshow = false,
    actions = [],
    feedback = false,
    feedbackQuestion,
    onFeedback,
    loop = true,
    keyboard = true,
    gestures = true,
    closeOnBackdrop = false,
    closeOnEscape = true,
    scrollLock = true,
    preload = 2,
    maxZoom = 5,
    minZoom = 1,
    zoomStep = 0.5,
    doubleClickZoom = true,
    wheelZoom = true,
    slideshowInterval = 3500,
    theme = "dark",
    className,
    style,
    zIndex = 9999,
    portal = true,
    injectStyles = true,
    labels: labelOverrides,
    renderImage,
    renderThumbnail,
    headerExtra,
    footerExtra,
    onShare,
    onDownload,
    onOpen,
    onZoomChange,
    onGroupChange,
  } = props;

  const labels = useMemo(() => ({ ...defaultLabels, ...labelOverrides }), [labelOverrides]);

  /* ---------- mount guard: portals and refs need a document ---------- */

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* ---------- groups ---------- */

  const groupNames = useMemo(() => deriveGroups(images), [images]);
  const showGroups = groupsEnabled && groupNames.length > 1;

  const [activeGroup, setActiveGroup] = useState<string | undefined>(() => {
    if (!groupsEnabled || groupNames.length < 2) return undefined;
    if (defaultGroup && groupNames.includes(defaultGroup)) return defaultGroup;
    return allGroupsTab ? undefined : groupNames[0];
  });

  const visible = useMemo(
    () => (activeGroup === undefined ? images : images.filter((image) => image.group === activeGroup)),
    [images, activeGroup],
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const group of groupNames) result[group] = countInGroup(images, group);
    return result;
  }, [images, groupNames]);

  /* ---------- index ---------- */

  const [internalIndex, setInternalIndex] = useState(props.defaultIndex ?? 0);
  const isControlled = props.index !== undefined;
  const rawIndex = isControlled ? (props.index as number) : internalIndex;
  const index = visible.length === 0 ? 0 : Math.min(Math.max(rawIndex, 0), visible.length - 1);

  const current: ViewerImage | undefined = visible[index];

  const context: ViewerContext | null = useMemo(() => {
    if (!current) return null;
    return {
      image: current,
      index,
      total: visible.length,
      absoluteIndex: images.indexOf(current),
      group: current.group,
    };
  }, [current, index, visible.length, images]);

  const contextRef = useRef(context);
  contextRef.current = context;

  const goTo = useCallback(
    (next: number) => {
      if (visible.length === 0) return;
      const wrapped = loop
        ? ((next % visible.length) + visible.length) % visible.length
        : Math.min(Math.max(next, 0), visible.length - 1);

      if (!isControlled) setInternalIndex(wrapped);
      const image = visible[wrapped];
      if (image) {
        props.onIndexChange?.(wrapped, {
          image,
          index: wrapped,
          total: visible.length,
          absoluteIndex: images.indexOf(image),
          group: image.group,
        });
      }
    },
    [visible, loop, isControlled, images, props],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const previous = useCallback(() => goTo(index - 1), [goTo, index]);

  const selectGroup = useCallback(
    (group: string | undefined) => {
      setActiveGroup(group);
      onGroupChange?.(group);

      // A new set means the old position is meaningless — image 6 of Indoors
      // is not image 6 of Outdoors. A controlled consumer owns the index, so
      // it has to be told to go back to the start; without this the viewer
      // opens the new group somewhere in the middle, or on its last image.
      if (!isControlled) {
        setInternalIndex(0);
        return;
      }

      const nextSet = group === undefined ? images : images.filter((image) => image.group === group);
      const first = nextSet[0];
      if (!first) return;
      props.onIndexChange?.(0, {
        image: first,
        index: 0,
        total: nextSet.length,
        absoluteIndex: images.indexOf(first),
        group: first.group,
      });
    },
    [isControlled, onGroupChange, images, props],
  );

  /* ---------- refs and transform ---------- */

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLElement>(null);

  const transform = useZoomPan({
    stageRef,
    imageRef,
    gestures,
    zoom,
    minZoom,
    maxZoom,
    zoomStep,
    wheelZoom,
    doubleClickZoom,
    resetKey: current?.src,
    onSwipe: (direction) => goTo(index + direction),
    onZoomChange: (scale) => {
      if (contextRef.current) onZoomChange?.(scale, contextRef.current);
    },
  });

  const { active: isFullscreen, supported: fullscreenSupported, toggle: toggleFullscreen } =
    useFullscreen(rootRef);

  /* ---------- loading state ---------- */

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retryToken, setRetryToken] = useState(0);
  useEffect(() => {
    setStatus("loading");
  }, [current?.src, retryToken]);

  /* ---------- toast ---------- */

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /* ---------- slideshow ---------- */

  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || !open || visible.length < 2) return;
    const timer = window.setInterval(() => goTo(index + 1), slideshowInterval);
    return () => window.clearInterval(timer);
  }, [playing, open, visible.length, index, goTo, slideshowInterval]);

  // Zooming in is a deliberate look at one photo; advancing out from under the
  // user at that moment is the wrong call, so the slideshow yields.
  useEffect(() => {
    if (transform.isZoomed) setPlaying(false);
  }, [transform.isZoomed]);

  /* ---------- side effects ---------- */

  /** Whether there is actually an overlay in the document to act on. */
  const showing = open && mounted && images.length > 0 && Boolean(current) && Boolean(context);

  useStyles(injectStyles);
  useScrollLock(scrollLock && open);
  // `showing`, not `open`: the mount guard below makes the first render return
  // null, so on the pass where the trap's effect first runs there is no node
  // for rootRef to point at — and its deps do not change when the portal
  // arrives, so it would never run again. The overlay would then never take
  // focus, and a keyboard user would still be on the page behind it.
  useFocusTrap(rootRef, showing);
  usePreload(visible, index, open ? preload : 0);

  const openedRef = useRef(false);
  useEffect(() => {
    if (open && !openedRef.current && contextRef.current) {
      openedRef.current = true;
      onOpen?.(contextRef.current);
    }
    if (!open) openedRef.current = false;
  }, [open, onOpen]);

  const handleShare = useCallback(async () => {
    if (!contextRef.current) return;
    if (onShare) {
      await onShare(contextRef.current);
      return;
    }
    const result = await shareUrl(absoluteUrl(contextRef.current.image.src), contextRef.current.image.title);
    if (result === "copied") setToast(labels.copiedLink);
  }, [onShare, labels.copiedLink]);

  const handleDownload = useCallback(() => {
    if (!contextRef.current) return;
    if (onDownload) {
      onDownload(contextRef.current);
      return;
    }
    const image = contextRef.current.image;
    downloadFile(image.downloadUrl ?? image.src, image.title);
  }, [onDownload]);

  useEffect(() => {
    if (!keyboard || !open || typeof window === "undefined") return;

    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "ArrowRight": event.preventDefault(); next(); break;
        case "ArrowLeft": event.preventDefault(); previous(); break;
        case "Escape":
          if (closeOnEscape && !isFullscreen) { event.preventDefault(); onClose?.(); }
          break;
        case "+": case "=": if (zoom) { event.preventDefault(); transform.zoomIn(); } break;
        case "-": case "_": if (zoom) { event.preventDefault(); transform.zoomOut(); } break;
        case "0": if (zoom) { event.preventDefault(); transform.reset(); } break;
        case "r": case "R": if (rotate) { event.preventDefault(); transform.rotateBy(90); } break;
        case "f": case "F": if (fullscreen && fullscreenSupported) { event.preventDefault(); void toggleFullscreen(); } break;
        default: break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    keyboard, open, next, previous, closeOnEscape, onClose, isFullscreen,
    zoom, rotate, fullscreen, fullscreenSupported, toggleFullscreen, transform,
  ]);

  /* ---------- thumbnails ---------- */

  const [thumbsOpen, setThumbsOpen] = useState(defaultThumbnailsOpen);
  const showThumbnails = thumbnailsEnabled && visible.length > 1;

  /* ---------- render ---------- */

  // `current` and `context` are retested because a boolean does not narrow
  // them for TypeScript, not because `showing` could be wrong about them.
  if (!showing || !current || !context) return null;

  const atStart = !loop && index === 0;
  const atEnd = !loop && index === visible.length - 1;
  const showArrows = arrows && visible.length > 1;

  const imageStyle: CSSProperties = {
    transform: `translate3d(${transform.state.x}px, ${transform.state.y}px, 0) scale(${transform.state.scale}) rotate(${transform.state.rotation}deg)`,
  };

  const captionNode =
    typeof captionProp === "function" ? (
      captionProp(context)
    ) : captionProp ? (
      <>
        {formatTemplate(labels.caption, {
          group: current.group,
          index: index + 1,
          total: visible.length,
          title: undefined,
        })}
        {current.title ? <span className="riv-caption-title"> : {current.title}</span> : null}
      </>
    ) : null;

  const tools = toolbar ? (
    <div className="riv-toolbar">
      {zoom ? (
        <>
          <button type="button" className="riv-tool" onClick={transform.zoomIn} disabled={!transform.canZoomIn} title={labels.zoomIn} aria-label={labels.zoomIn}>
            <IconZoomIn />
          </button>
          <button type="button" className="riv-tool" onClick={transform.zoomOut} disabled={!transform.canZoomOut} title={labels.zoomOut} aria-label={labels.zoomOut}>
            <IconZoomOut />
          </button>
        </>
      ) : null}

      {rotate ? (
        <button type="button" className="riv-tool" onClick={() => transform.rotateBy(90)} title={labels.rotate} aria-label={labels.rotate}>
          <IconRotate />
        </button>
      ) : null}

      {slideshow && visible.length > 1 ? (
        <button type="button" className="riv-tool" aria-pressed={playing} onClick={() => setPlaying((value) => !value)} title={playing ? labels.pause : labels.play} aria-label={playing ? labels.pause : labels.play}>
          {playing ? <IconPause /> : <IconPlay />}
        </button>
      ) : null}

      {fullscreen && fullscreenSupported ? (
        <button type="button" className="riv-tool" aria-pressed={isFullscreen} onClick={() => void toggleFullscreen()} title={isFullscreen ? labels.exitFullscreen : labels.enterFullscreen} aria-label={isFullscreen ? labels.exitFullscreen : labels.enterFullscreen}>
          {isFullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
        </button>
      ) : null}

      {download ? (
        <button type="button" className="riv-tool" onClick={handleDownload} title={labels.download} aria-label={labels.download}>
          <IconDownload />
        </button>
      ) : null}

      {share ? (
        <button type="button" className="riv-tool" onClick={() => void handleShare()} title={labels.share} aria-label={labels.share}>
          <IconShare />
        </button>
      ) : null}
    </div>
  ) : null;

  const tree = (
    <div
      ref={rootRef}
      className={["riv-root", className].filter(Boolean).join(" ")}
      style={{ ...style, ["--riv-z" as string]: zIndex }}
      data-theme={theme}
      role="dialog"
      aria-modal="true"
      aria-label={current.alt ?? current.title ?? "Image viewer"}
      tabIndex={-1}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
      }}
    >
      <Header
        groups={groupNames}
        counts={counts}
        activeGroup={activeGroup}
        showGroups={showGroups}
        allGroupsTab={allGroupsTab}
        onGroupSelect={selectGroup}
        actions={actions}
        context={context}
        showClose={closeButton}
        onClose={() => onClose?.()}
        labels={labels}
        extra={headerExtra}
      />

      <div className="riv-body">
        {feedback ? (
          <Feedback
            question={feedbackQuestion ?? labels.feedbackQuestion}
            labels={labels}
            resetKey={current.src}
            onAnswer={(value: FeedbackValue) => contextRef.current && onFeedback?.(value, contextRef.current)}
          />
        ) : null}

        <div
          ref={stageRef}
          className="riv-stage"
          data-zoomed={transform.isZoomed ? "true" : "false"}
          data-panning={transform.panning ? "true" : "false"}
          data-toolbar={tools ? "true" : "false"}
          {...transform.handlers}
        >
          {status === "loading" ? <div className="riv-spinner" aria-hidden /> : null}

          {status === "error" ? (
            <div className="riv-error">
              <IconImageOff />
              <span>{labels.loadFailed}</span>
              <button type="button" onClick={() => setRetryToken((value) => value + 1)}>{labels.retry}</button>
            </div>
          ) : (
            <div className="riv-canvas">
              {renderImage ? (
                <div ref={imageRef as React.RefObject<HTMLDivElement>} className="riv-img" style={imageStyle} data-animate={transform.animate}>
                  {renderImage({ ...context, className: "riv-img" })}
                </div>
              ) : (
                <img
                  ref={imageRef as React.RefObject<HTMLImageElement>}
                  key={`${current.src}-${retryToken}`}
                  className="riv-img"
                  src={current.src}
                  alt={current.alt ?? current.title ?? ""}
                  width={current.width}
                  height={current.height}
                  style={{ ...imageStyle, visibility: status === "ready" ? "visible" : "hidden" }}
                  data-animate={transform.animate}
                  draggable={false}
                  decoding="async"
                  onLoad={() => setStatus("ready")}
                  onError={() => setStatus("error")}
                />
              )}
            </div>
          )}

          {showArrows ? (
            <>
              <button type="button" className="riv-arrow riv-arrow-prev" onClick={previous} disabled={atStart} title={labels.previous} aria-label={labels.previous}>
                <IconPrev />
              </button>
              <button type="button" className="riv-arrow riv-arrow-next" onClick={next} disabled={atEnd} title={labels.next} aria-label={labels.next}>
                <IconNext />
              </button>
            </>
          ) : null}

          {tools}

          {toast ? <div className="riv-toast" role="status">{toast}</div> : null}
        </div>

        {captionNode || counter || footerExtra ? (
          <div className="riv-caption">
            {captionNode}
            {counter ? (
              <span>{captionNode ? "  ·  " : null}{formatTemplate(labels.counter, { index: index + 1, total: visible.length })}</span>
            ) : null}
            {footerExtra}
          </div>
        ) : null}
      </div>

      {showThumbnails ? (
        <Thumbnails
          images={visible}
          index={index}
          open={thumbsOpen}
          collapsible={thumbnailsCollapsible}
          labels={labels}
          onSelect={goTo}
          onToggle={() => setThumbsOpen((value) => !value)}
          renderThumbnail={
            renderThumbnail
              ? (image, position, active) =>
                  renderThumbnail({
                    image,
                    index: position,
                    total: visible.length,
                    absoluteIndex: images.indexOf(image),
                    group: image.group,
                    active,
                  })
              : undefined
          }
        />
      ) : null}

      <div className="riv-sr" aria-live="polite">
        {formatTemplate(labels.counter, { index: index + 1, total: visible.length })}
      </div>
    </div>
  );

  if (portal === false) return tree;
  const host = portal === true ? document.body : portal;
  return createPortal(tree, host);
}
