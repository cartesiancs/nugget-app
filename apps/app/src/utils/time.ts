export function millisecondsToPx(ms: number, timelineRange: number) {
  const timeMagnification = timelineRange / 4;
  const convertPixel = (ms / 5) * timeMagnification;
  const result = Number(convertPixel.toFixed(0));
  if (result <= 0) {
    return 0;
  }

  return result;
}

export function pxToMilliseconds(px: number, timelineRange: number) {
  const timeMagnification = timelineRange / 4;
  const convertMs = (px * 5) / timeMagnification;
  return Number(convertMs.toFixed(0));
}

export function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function isTimeInRange(t: number, start: number, end: number): boolean {
  return t >= start && t < end;
}
