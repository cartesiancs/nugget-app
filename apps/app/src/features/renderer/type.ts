import type { TimelineElement } from "../../@types/timeline";

export type ElementRenderFunction<T extends TimelineElement> = (
  ctx: CanvasRenderingContext2D,
  elementId: string,
  element: T,
  timelineCursor: number,
) => void;
