function findNearestAnimationPointValue(
  animationPoints: number[][],
  a: number,
): number | null {
  let closestY: number | null = null;
  let closestDiff = Infinity;

  for (const [time, value] of animationPoints) {
    const diff = Math.abs(time - a);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestY = value;
    }
  }

  return closestY;
}

export function interpolate(
  initialValue: number,
  animationPoints: number[][],
  elementStartTime: number,
  timelineCursor: number,
): number {
  let index = Math.round(timelineCursor / 16);
  let indexToMs = index * 20;
  let startTime = elementStartTime;
  let indexPoint = Math.round((indexToMs - startTime) / 20);

  if (indexPoint < 0) {
    return initialValue;
  }

  const elapsedAfterStart = timelineCursor - elementStartTime;
  const nearest = findNearestAnimationPointValue(
    animationPoints,
    elapsedAfterStart,
  );
  return nearest ?? initialValue;
}
