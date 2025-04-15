import type {
  TimelineElement,
  VisualTimelineElement,
} from "../../@types/timeline";

export type ElementRenderFunction<T extends VisualTimelineElement> = (
  ctx: CanvasRenderingContext2D,
  elementId: string,
  element: T,
  timelineCursor: number,
) => void;
