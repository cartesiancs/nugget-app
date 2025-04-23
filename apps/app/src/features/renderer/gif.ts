import type { GifElementType } from "../../@types/timeline";
import { loadedAssetStore } from "../asset/loadedAssetStore";
import type { ElementRenderFunction } from "./type";

// We need this because 'putImageData' ignores the transformation matrix.
// First draw here, then draw this to the main canvas.
const tempCanvas = document.createElement("canvas");
const tempCtx = tempCanvas.getContext("2d") as CanvasRenderingContext2D;

export const renderGif: ElementRenderFunction<GifElementType> = (
  ctx,
  elementId,
  gifElement,
  timelineCursor,
) => {
  const loadedGif = loadedAssetStore.getState().getGif(gifElement.localpath);
  if (loadedGif == null) {
    // Can render skeleton here
    return;
  }
  const delay = loadedGif[0].parsedFrame.delay;

  const currentGifTime = timelineCursor - gifElement.startTime;
  const imageIndex = Math.floor(currentGifTime / delay) % loadedGif.length;
  const { imageData, parsedFrame } = loadedGif[imageIndex];

  tempCanvas.width = parsedFrame.dims.width;
  tempCanvas.height = parsedFrame.dims.height;
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(tempCanvas, 0, 0, gifElement.width, gifElement.height);
};
