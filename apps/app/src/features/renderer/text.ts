import type { TextElementType } from "../../@types/timeline";
import { interpolate } from "../animation/interpolation";
import { renderControlOutline } from "./controlOutline";
import type { ElementRenderFunction } from "./type";

function getWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
) {
  const textSplited = text.split(" ");
  const lines: {
    line: string;
    width: number;
    ascent: number;
    descent: number;
  }[] = [];
  let currentLine = textSplited[0];

  for (let i = 1; i < textSplited.length; i++) {
    const word = textSplited[i];
    const candidate = `${currentLine} ${word}`;
    const candidateMetrics = ctx.measureText(candidate);

    if (candidateMetrics.width < width) {
      currentLine += " " + word;
    } else {
      const currentLineMetrics = ctx.measureText(currentLine);
      lines.push({
        line: currentLine,
        width: currentLineMetrics.width,
        ascent: currentLineMetrics.actualBoundingBoxAscent,
        descent: currentLineMetrics.actualBoundingBoxDescent,
      });
      currentLine = word;
    }
  }

  const lineMetrics = ctx.measureText(currentLine);
  lines.push({
    line: currentLine,
    width: lineMetrics.width,
    ascent: lineMetrics.actualBoundingBoxAscent,
    descent: lineMetrics.actualBoundingBoxDescent,
  });
  return lines;
}

export const renderText: ElementRenderFunction<TextElementType> = (
  ctx,
  textElement,
  timelineCursor,
  controlOutlineEnabled,
) => {
  let { width: scaleW, height: scaleH, fontsize: fontSize } = textElement;
  let { x, y } = textElement.location;

  // Common
  ctx.fillStyle = textElement.textcolor;
  ctx.lineWidth = 0;
  ctx.letterSpacing = `${textElement.letterSpacing}px`;

  ctx.font = `${textElement.options.isItalic ? "italic" : ""} ${
    textElement.options.isBold ? "bold" : ""
  } ${fontSize}px ${textElement.fontname}`;

  // Opacity
  const opacityAnimation = textElement.animation["opacity"];
  const opacityScaledBy100 = opacityAnimation.isActivate
    ? interpolate(
        textElement.opacity,
        opacityAnimation.ax,
        textElement.startTime,
        timelineCursor,
      )
    : textElement.opacity;
  ctx.globalAlpha = opacityScaledBy100 / 100;

  // Scale
  const scaleAnimation = textElement.animation["scale"];
  const scale = scaleAnimation.isActivate
    ? interpolate(
        10,
        scaleAnimation.ax,
        textElement.startTime,
        timelineCursor,
      ) / 10
    : 1;
  fontSize = textElement.fontsize * scale;

  // Position
  const positionAnimation = textElement.animation["position"];
  let tx = positionAnimation.isActivate
    ? interpolate(
        x,
        positionAnimation.ax,
        textElement.startTime,
        timelineCursor,
      )
    : x;
  let ty = positionAnimation.isActivate
    ? interpolate(
        y,
        positionAnimation.ay,
        textElement.startTime,
        timelineCursor,
      )
    : y;

  // Rotation
  const rotationAnimation = textElement.animation["rotation"];
  const rotationInDegree = rotationAnimation.isActivate
    ? interpolate(
        textElement.rotation,
        rotationAnimation.ax,
        textElement.startTime,
        timelineCursor,
      )
    : textElement.rotation;
  const radian = rotationInDegree * (Math.PI / 180);

  const centerX = tx + scaleW / 2;
  const centerY = ty + scaleH / 2;

  ctx.translate(centerX, centerY);
  ctx.rotate(radian);

  tx = -scaleW / 2;
  ty = -scaleH / 2;

  // Actual Rendering
  const textAlignOrigin = ctx.textAlign;
  let textY = ty + (textElement.fontsize ?? 0);
  for (const {
    line,
    width: lineWidth,
    ascent: lineAscent,
    descent: lineDescent,
  } of getWrappedLines(ctx, textElement.text, scaleW)) {
    const backgroundPadding = 12;
    let textX = tx;
    let backgroundX = tx - backgroundPadding;
    if (textElement.options.align == "left") {
      textX = tx;
      backgroundX = tx - backgroundPadding;
    } else if (textElement.options.align == "center") {
      textX = tx + scaleW / 2;
      backgroundX = textX - lineWidth / 2 - backgroundPadding;
    } else if (textElement.options.align == "right") {
      textX = tx + scaleW;
      backgroundX = textX - lineWidth - backgroundPadding;
    }
    ctx.textAlign = textElement.options.align;

    if (textElement.background.enable) {
      ctx.fillStyle = textElement.background.color;
      ctx.fillRect(
        backgroundX,
        textY - lineAscent - backgroundPadding,
        lineWidth + backgroundPadding * 2,
        lineAscent + lineDescent + backgroundPadding * 2,
      );
    }

    if (textElement.options.outline.enable) {
      ctx.lineWidth = textElement.options.outline.size;
      ctx.strokeStyle = textElement.options.outline.color;
      ctx.strokeText(line, textX, textY);
    }

    ctx.fillStyle = textElement.textcolor;
    ctx.fillText(line, textX, textY);
    textY += scaleH;
  }
  ctx.textAlign = textAlignOrigin;

  // Control Outline
  ctx.globalAlpha = 1;
  if (controlOutlineEnabled) {
    renderControlOutline(ctx, -scaleW / 2, -scaleH / 2, scaleW, scaleH, radian);
  }

  ctx.rotate(-radian);
  ctx.translate(-centerX, -centerY);
};
