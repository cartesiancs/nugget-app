import type { VideoElementType } from "../../@types/timeline";
import { loadedAssetStore } from "../asset/loadedAssetStore";
import { isVideoElementVisibleAtTime } from "../element/time";
import { VideoFilterPipeline } from "./filter/videoPipeline";
import type { ElementRenderFunction } from "./type";

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
    // Can render skeleton here
    return;
  }

  if (store.videoFilterPipeline == null) {
    store.videoFilterPipeline = new VideoFilterPipeline(
      store.videoFilterCanvasCtx,
    );
  }

  if (!isVideoElementVisibleAtTime(timelineCursor, videoElement)) {
    loadedVideo.object.muted = true;
    return;
  }
  loadedVideo.object.muted = false;

  if (loadedVideo.object.readyState < 2) {
    // Frame not available yet – paint last cached frame to avoid black flicker
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

  console.log("[Canvas] drawVideo", elementId, "t(ms)=", timelineCursor, "currentTime=", loadedVideo.object.currentTime.toFixed(3), "readyState=", loadedVideo.object.readyState, "filter=", videoElement.filter.enable);
  if (videoElement.filter.enable) {
    store.videoFilterPipeline.render(
      ctx,
      videoElement,
      loadedVideo,
      waitFilter,
    );
  } else {
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
