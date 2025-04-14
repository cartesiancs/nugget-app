import type { VideoElementType } from "../../@types/timeline";
import { loadedAssetStore } from "../asset/loadedAssetStore";
import { VideoFilterPipeline } from "./filter/videoPipeline";
import type { ElementRenderFunction } from "./type";

export const renderVideoWithoutWait: ElementRenderFunction<VideoElementType> = (
  ctx,
  elementId,
  videoElement,
  timelineCursor,
) => {
  const store = loadedAssetStore.getState();
  const loadedVideo = store.loadedElementVideo[elementId];
  if (loadedVideo == null) {
    store.loadElementVideo(elementId, videoElement);
    return;
  }

  if (store.videoFilterPipeline == null) {
    store.videoFilterPipeline = new VideoFilterPipeline(
      store.videoFilterCanvasCtx,
    );
  }

  const timeInRange =
    timelineCursor >= videoElement.trim.startTime &&
    timelineCursor < videoElement.trim.endTime;
  if (!timeInRange) {
    loadedVideo.object.muted = true;
    return;
  }
  loadedVideo.object.muted = false;

  if (videoElement.filter.enable) {
    store.videoFilterPipeline.render(ctx, videoElement, loadedVideo);
  } else {
    ctx.drawImage(
      loadedVideo.object,
      0,
      0,
      videoElement.width,
      videoElement.height,
    );
  }
};
