import type { Timeline } from "../../@types/timeline";
import type { RenderOptions } from "../../states/renderOptionStore";
import type { ILoadedAssetStore } from "../asset/loadedAssetStore";
import {
  renderTimelineAtTime,
  type TimelineRenderers,
} from "../renderer/timeline";

/**
 * Render timeline using canvas. Contains only rendering logic.
 * If you want to implement various export methods, use this as a building block.
 * @param assetStore Store for assets to load
 * @param options Options for rendering. Part of ExportOptions.
 * @param frameCallback Callback for frame processing.
 */
export async function renderTimeline(
  assetStore: ILoadedAssetStore,
  timeline: Timeline,
  elementRenderers: TimelineRenderers,
  options: RenderOptions,
  frameCallback: (
    currentFrameBuffer: ArrayBuffer,
    currentFrame: number,
    totalFrames: number,
  ) => void,
): Promise<void> {
  const {
    fps,
    duration,
    previewSize: { w: width, h: height },
    backgroundColor,
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx == null) {
    throw new Error("Failed to create canvas context");
  }

  await assetStore.loadEntireTimeline(timeline);

  const totalFrames = duration * fps;
  for (let currentFrame = 0; currentFrame < totalFrames; currentFrame++) {
    const timeInMs = (currentFrame / fps) * 1000;

    await assetStore.seek(timeline, timeInMs);

    renderTimelineAtTime(
      ctx,
      timeline,
      timeInMs,
      elementRenderers,
      backgroundColor,
      width,
      height,
    );

    const frameArrayBuffer = await canvasToArrayBuffer(canvas);
    frameCallback(frameArrayBuffer, currentFrame, totalFrames);
  }
}

async function canvasToArrayBuffer(
  canvas: HTMLCanvasElement,
): Promise<ArrayBuffer> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob == null) {
        reject("Failed to create blob from canvas.");
      } else {
        resolve(blob);
      }
    }, "image/png");
  });
  return blob.arrayBuffer();
}
