import type { ImageElementType } from "../../@types/timeline";
import type { ElementRenderFunction } from "./type";

import { loadedAssetStore } from "../asset/loadedAssetStore";

export const renderImage: ElementRenderFunction<ImageElementType> = (
  ctx,
  imageElement,
  timelineCursor,
) => {
  const { width, height } = imageElement;
  const loadedImage =
    loadedAssetStore.getState().loadedImage[imageElement.localpath];
  if (loadedImage == null) {
    loadedAssetStore.getState().loadImage(imageElement.localpath);
    return;
  }
  ctx.drawImage(loadedImage, 0, 0, width, height);
};
