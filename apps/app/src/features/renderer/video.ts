import type { VideoElementType } from "../../@types/timeline";
import { loadedAssetStore } from "../asset/loadedAssetStore";
import { isTimeInRange } from "../element/time";
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

  if (
    !isTimeInRange(
      timelineCursor,
      videoElement.trim.startTime,
      videoElement.trim.endTime,
    )
  ) {
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
