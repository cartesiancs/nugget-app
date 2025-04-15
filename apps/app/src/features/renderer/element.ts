import type { VisualTimelineElement } from "../../@types/timeline";
import { interpolate } from "../animation/interpolation";
import { toRadian } from "../math/geom";
import { renderControlOutline } from "./controlOutline";
import type { ElementRenderFunction } from "./type";

export function renderElement<T extends VisualTimelineElement>(
  ctx: CanvasRenderingContext2D,
  elementId: string,
  element: T,
  timelineCursor: number,
  controlOutlineEnabled: boolean,
  renderFunction: ElementRenderFunction<T>,
): void {
  ctx.save();

  let {
    width,
    height,
    rotation: rotationInDegrees,
    opacity,
    startTime,
  } = element;

  // TODO: 회전, 스케일 중심을 사용자가 지정할 수 있도록 수정
  const rotationCenter = {
    x: width / 2,
    y: height / 2,
  };

  const scaleCenter = {
    x: width / 2,
    y: height / 2,
  };

  const canAnimate = "animation" in element;

  // Position
  let { x, y } = element.location;
  if (canAnimate && "position" in element.animation) {
    x = interpolate(
      x,
      element.animation.position.ax,
      startTime,
      timelineCursor,
    );
    y = interpolate(
      y,
      element.animation.position.ay,
      startTime,
      timelineCursor,
    );
  }
  ctx.translate(x, y);

  // Rotation
  ctx.translate(rotationCenter.x, rotationCenter.y);
  if (
    canAnimate &&
    "rotation" in element.animation &&
    element.animation.rotation.isActivate
  ) {
    rotationInDegrees = interpolate(
      rotationInDegrees,
      element.animation.rotation.ax,
      startTime,
      timelineCursor,
    );
  }
  ctx.rotate(toRadian(rotationInDegrees));
  ctx.translate(-rotationCenter.x, -rotationCenter.y);

  // Scale
  ctx.translate(scaleCenter.x, scaleCenter.y);
  let scale = 1;
  if (
    canAnimate &&
    "scale" in element.animation &&
    element.animation.scale.isActivate
  ) {
    scale =
      interpolate(10, element.animation.scale.ax, startTime, timelineCursor) /
      10;
  }
  ctx.scale(scale, scale); // TODO: x, y 스케일을 다르게 지정할 수 있도록 수정
  ctx.translate(-scaleCenter.x, -scaleCenter.y);

  // Opacity
  let opacityScaledBy100 = opacity;
  if (
    canAnimate &&
    "opacity" in element.animation &&
    element.animation.opacity.isActivate
  ) {
    opacityScaledBy100 = interpolate(
      opacity,
      element.animation.opacity.ax,
      startTime,
      timelineCursor,
    );
  }
  ctx.globalAlpha *= opacityScaledBy100 / 100;

  renderFunction(ctx, elementId, element, timelineCursor);

  if (controlOutlineEnabled) {
    renderControlOutline(ctx, 0, 0, width, height);
  }

  ctx.restore();
}
