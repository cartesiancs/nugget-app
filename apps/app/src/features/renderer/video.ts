import type { VideoElementType } from "../../@types/timeline";
import { loadedAssetStore } from "../asset/loadedAssetStore";
import { isVideoElementVisibleAtTime } from "../element/time";
import { VideoFilterPipeline } from "./filter/videoPipeline";
import type { ElementRenderFunction } from "./type";
import { useTimelineStore } from "../../states/timelineStore";

// ---------------------------------------------------------------
// Debug helper – toggle this to `false` to silence verbose logs.
// ---------------------------------------------------------------
const DEBUG_RENDER = false;
function dbg(...args: any[]) {
  if (DEBUG_RENDER) console.log("[VideoRenderer]", ...args);
}

export const renderVideoWithoutWait: ElementRenderFunction<VideoElementType> = (
  ctx,
  elementId,
  videoElement,
  timelineCursor,
) => {
  _renderVideo(ctx, elementId, videoElement, timelineCursor, false);
};

export const renderVideoWithWait: ElementRenderFunction<VideoElementType> = (
  ctx,
  elementId,
  videoElement,
  timelineCursor,
) => {
  _renderVideo(ctx, elementId, videoElement, timelineCursor, true);
};

const _renderVideo = (
  ctx: CanvasRenderingContext2D,
  elementId: string,
  videoElement: VideoElementType,
  timelineCursor: number,
  waitFilter: boolean,
) => {
  const store = loadedAssetStore.getState();
  const loadedVideo = store.getElementVideo(elementId);
  if (loadedVideo == null) {
    dbg("NO ASSET YET – skipping", elementId);
    return; // Can render skeleton here
  }

  if (store.videoFilterPipeline == null) {
    store.videoFilterPipeline = new VideoFilterPipeline(
      store.videoFilterCanvasCtx,
    );
  }

  const isVisible = isVideoElementVisibleAtTime(
    timelineCursor,
    videoElement,
  );

  if (!isVisible) {
    loadedVideo.object.muted = true;
    dbg("INVISIBLE – muted", elementId);
    return;
  }
  loadedVideo.object.muted = false;

  // ------------------------------------------------------------------
  // Ensure newly-visible videos start playing while the timeline itself
  // is currently in the "playing" state.  If the element was loaded
  // *after* playback began then `startPlay()` would not have been able
  // to mark it as playing, leaving the <video> frozen on its first
  // decoded frame.  Here we detect that situation and kick off playback
  // at the correct offset so the preview continues smoothly across
  // clip boundaries.
  // ------------------------------------------------------------------
  const { control } = useTimelineStore.getState();
  if (control.isPlay && !loadedVideo.isPlay) {
    const offsetSec = (-(videoElement.startTime - timelineCursor) * videoElement.speed) / 1000;
    dbg("Auto-starting clip", elementId, {
      offsetSec,
      timelineCursor,
      startTime: videoElement.startTime,
      speed: videoElement.speed,
    });
    loadedVideo.object.currentTime = offsetSec;
    loadedVideo.object.playbackRate = videoElement.speed;
    loadedVideo.isPlay = true;
    const playPromise = loadedVideo.object.play();
    if (playPromise?.catch) {
      playPromise.catch((err) => {
        console.warn("[Canvas] autoplay blocked (late start)", elementId, err);
      });
    }
  }

  // Some loaders briefly pause the element after decoding the first GOP to
  // grab a clean thumbnail (see loadElementVideo's `handleFirstFrame`).  That
  // can leave `loadedVideo.object.paused === true` even though we already
  // flagged it as playing.  Detect that situation and immediately resume.
  if (control.isPlay && loadedVideo.isPlay && loadedVideo.object.paused) {
    dbg("Resuming unexpectedly paused clip", elementId, {
      currentTime: loadedVideo.object.currentTime.toFixed(3),
    });
    const playPromise = loadedVideo.object.play();
    if (playPromise?.catch) {
      playPromise.catch((err) => {
        console.warn("[Canvas] resume play blocked", elementId, err);
      });
    }
  }

  if (loadedVideo.object.readyState < 2) {
    dbg("READY<2 – using cached frame", elementId, "readyState=", loadedVideo.object.readyState);
    ctx.drawImage(
      loadedVideo.canvas,
      0,
      0,
      videoElement.width,
      videoElement.height,
    );
    return;
  }

  // Guarantee full opacity every frame – prevents momentary blackouts if some
  // other part of the UI sets element.opacity to 0.
  if (videoElement.opacity !== 100) {
    videoElement.opacity = 100;
  }

  if (videoElement.filter.enable) {
    store.videoFilterPipeline.render(
      ctx,
      videoElement,
      loadedVideo,
      waitFilter,
    );
  } else {
    dbg(
      "DRAW",
      elementId,
      {
        tMs: timelineCursor,
        currentTime: loadedVideo.object.currentTime.toFixed(3),
        readyState: loadedVideo.object.readyState,
        isPlay: loadedVideo.isPlay,
      },
    );
    ctx.drawImage(
      loadedVideo.object,
      0,
      0,
      videoElement.width,
      videoElement.height,
    );
    // Update cached canvas with latest frame
    try {
      const cacheCtx = loadedVideo.canvas.getContext("2d");
      cacheCtx?.drawImage(
        loadedVideo.object,
        0,
        0,
        videoElement.width,
        videoElement.height,
      );
    } catch {}
  }
};
