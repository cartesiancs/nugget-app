import type { ImageElementType } from "../../@types/timeline";
import type { ElementRenderFunction } from "./type";

import { loadedAssetStore } from "../asset/loadedAssetStore";

export const renderImage: ElementRenderFunction<ImageElementType> = (
  ctx,
  elementId,
  imageElement,
  timelineCursor,
) => {
  const { width, height } = imageElement;
  const loadedImage = loadedAssetStore
    .getState()
    .getImage(imageElement.localpath);

  if (loadedImage == null) {
    // Can render skeleton here
    return;
  }
  ctx.drawImage(loadedImage, 0, 0, width, height);
};
