import type {
  AudioElementType,
  Timeline,
  TimelineElement,
  VideoElementType,
} from "../../@types/timeline";
import { elementUtils } from "../../utils/element";

export function isElementVisibleWhen(
  t: number,
  timeline: Timeline,
  element: TimelineElement,
): boolean {
  const startTime =
    element.startTime + getAdditionalStartTime(timeline, element);

  const realDuration =
    elementUtils.getElementType(element.filetype) === "dynamic"
      ? element.duration /
        (element as VideoElementType | AudioElementType).speed
      : element.duration;
  const endTime = startTime + realDuration;

  return t >= startTime && t < endTime;
}

function getAdditionalStartTime(
  timeline: Timeline,
  element: TimelineElement,
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
