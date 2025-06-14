import { useTimelineStore } from "../src/states/timelineStore";

export function renderNewImage(absolute_path: string): boolean {
  const previewCanvas = document.querySelector("preview-canvas");

  const ide = previewCanvas.activeElementId;

  console.log(ide);
  console.log(absolute_path);

  let timelineState = useTimelineStore.getState();
  let timeline = timelineState.timeline;
  console.log(timeline);
  timeline[ide].localpath = absolute_path;
  timelineState.patchTimeline(timeline);

  previewCanvas.drawCanvas();

  return false;
}
