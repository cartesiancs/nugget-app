import type { Timeline } from "../../@types/timeline";
import { loadedAssetStore } from "../asset/loadedAssetStore";
import type { TimelineRenderers } from "../renderer/timeline";
import { renderTimeline } from "./renderTimeline";
import type { ExportOptions } from "./types";

export async function requestIPCVideoExport(
  timeline: Timeline,
  elementRenderers: TimelineRenderers,
  options: ExportOptions,
  progressCallback: (currentFrame: number, totalFrames: number) => void,
): Promise<void> {
  const assetStore = loadedAssetStore.getState();

  window.electronAPI.req.render.v2.start(options, timeline);

  await renderTimeline(
    assetStore,
    timeline,
    elementRenderers,
    options,
    (currentFrameBuffer, currentFrame, totalFrames) => {
      progressCallback(currentFrame, totalFrames);
      window.electronAPI.req.render.v2.sendFrame(currentFrameBuffer);
      if (currentFrame === totalFrames - 1) {
        window.electronAPI.req.render.v2.finishStream();
      }
    },
  );
}
