export function renderControlOutline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();

  ctx.globalAlpha = 1;

  const padding = 10;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.rect(x - padding, y - padding, padding * 2, padding * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.rect(x + w - padding, y - padding, padding * 2, padding * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.rect(x + w - padding, y + h - padding, padding * 2, padding * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.rect(x - padding, y + h - padding, padding * 2, padding * 2);
  ctx.fill();

  //draw control rotation

  ctx.beginPath();
  ctx.arc(x + w / 2, y - 50, 15, 0, 2 * Math.PI);
  ctx.fill();

  ctx.restore();
}
