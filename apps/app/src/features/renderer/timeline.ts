import type { Timeline, VisualTimelineElement } from "../../@types/timeline";
import { isElementVisibleWhen } from "../element/time";
import { renderElement } from "./element";
import type { ElementRenderFunction } from "./type";

export type TimelineRenderers = {
  [K in VisualTimelineElement["filetype"]]: ElementRenderFunction<
    Extract<VisualTimelineElement, { filetype: K }>
  >;
};

type OutlineOption = {
  controlOutlineEnabled: boolean;
  activeElementId: string;
};

export function renderTimelineAtTime(
  ctx: CanvasRenderingContext2D,
  timeline: Timeline,
  t: number,
  renderers: TimelineRenderers,
  backgroundColor: string,
  width: number,
  height: number,
  outlineOptions: OutlineOption = {
    controlOutlineEnabled: false,
    activeElementId: "",
  },
  callbackPerElementRender?: (
    elementId: string,
    element: VisualTimelineElement,
  ) => void,
) {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // TODO: sorting on every render is inefficient, should be optimized
  const prioritySortedTimeline = Object.entries(timeline).sort(
    ([, a], [, b]) => a.priority - b.priority,
  );

  for (const [elementId, element] of prioritySortedTimeline) {
    if (element.filetype === "audio") {
      continue;
    }

    if (!isElementVisibleWhen(t, timeline, element)) {
      continue;
    }

    renderElement(
      ctx,
      elementId,
      element,
      t,
      outlineOptions.controlOutlineEnabled &&
        elementId === outlineOptions.activeElementId,
      renderers[element.filetype] as ElementRenderFunction<typeof element>,
    );

    callbackPerElementRender?.(elementId, element);
  }
}
