import type {
  AudioElementType,
  Timeline,
  VisualTimelineElement,
  VideoElementType,
} from "../../@types/timeline";
import { elementUtils } from "../../utils/element";

export function isTimeInRange(t: number, start: number, end: number): boolean {
  return t >= start && t < end;
}

export function isElementVisibleAtTime(
  timeInMs: number,
  timeline: Timeline,
  element: VisualTimelineElement,
): boolean {
  const startTime =
    element.startTime + getAdditionalStartTime(timeline, element);

  const realDuration =
    elementUtils.getElementType(element.filetype) === "dynamic"
      ? element.duration /
        (element as VideoElementType | AudioElementType).speed
      : element.duration;
  const endTime = startTime + realDuration;

  return isTimeInRange(timeInMs, startTime, endTime);
}

function getAdditionalStartTime(
  timeline: Timeline,
  element: VisualTimelineElement,
): number {
  let additionalStartTime = 0;
  if (element.filetype == "text") {
    if (element.parentKey != "standalone") {
      const parentStartTime = timeline[element.parentKey].startTime;
      additionalStartTime = parentStartTime;
    }
  }

  return additionalStartTime;
}
