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

  if (element.filetype === "video") {
    return isVideoElementVisibleAtTime(timeInMs, element);
  }

  return isTimeInRange(timeInMs, startTime, endTime);
}

export function isVideoElementVisibleAtTime(
  timeInMs: number,
  videoElement: VideoElementType,
) {
  const visible = isTimeInRange(
    timeInMs,
    videoElement.startTime + videoElement.trim.startTime,
    videoElement.startTime + videoElement.trim.endTime,
  );
  if (!visible) {
    console.log("[Visibility] skip", videoElement.key, "cursor", timeInMs, "window", videoElement.startTime + videoElement.trim.startTime, videoElement.startTime + videoElement.trim.endTime);
  }
  return visible;
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
