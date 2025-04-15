import type { ShapeElementType } from "../../@types/timeline";
import type { ElementRenderFunction } from "./type";

export const renderShape: ElementRenderFunction<ShapeElementType> = (
  ctx,
  elementId,
  shapeElement,
  timelineCursor,
) => {
  const { width, oWidth: originalWidth, shape, option } = shapeElement;
  ctx.beginPath();

  const ratio = originalWidth / width;

  for (let index = 0; index < shape.length; index++) {
    const point = shape[index];
    const x = point[0] / ratio;
    const y = point[1] / ratio;

    ctx.fillStyle = option.fillColor;
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();
};
