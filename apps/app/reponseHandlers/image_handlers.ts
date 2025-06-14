import { useTimelineStore } from "../src/states/timelineStore";

export function renderNewImage(data: { outpath: string }): boolean {
  const previewCanvas = document.querySelector("preview-canvas");

  const ide = previewCanvas.activeElementId;

  console.log(ide);
  console.log(data.outpath);

  let timelineState = useTimelineStore.getState();
  let timeline = timelineState.timeline;
  console.log(timeline);
  timeline[ide].localpath = data.outpath;
  timelineState.patchTimeline(timeline);

  previewCanvas.drawCanvas();

  return false;
}
