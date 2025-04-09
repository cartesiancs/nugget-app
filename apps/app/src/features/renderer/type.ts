import type { TimelineElement } from "../../@types/timeline";

export type ElementRenderFunction<T extends TimelineElement> = (
  ctx: CanvasRenderingContext2D,
  element: T,
  timelineCursor: number,
) => void;
