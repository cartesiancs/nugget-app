import type {
  AudioElementType,
  Timeline,
  VisualTimelineElement,
  VideoElementType,
} from "../../@types/timeline";
import { elementUtils } from "../../utils/element";
import { isTimeInRange } from "../../utils/time";

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

  // Visibility depends ONLY on timeline position (startTime + duration)
  // NOT on trim values (which are source file positions for FFmpeg -ss seeking)
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
