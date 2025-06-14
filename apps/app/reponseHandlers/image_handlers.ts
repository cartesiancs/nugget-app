import { useTimelineStore } from "../src/states/timelineStore";

export function renderNewImage(absolute_path: string, superRes?: boolean): boolean {
  const previewCanvas = document.querySelector("preview-canvas");

  const ide = previewCanvas.activeElementId;

  console.log(ide);
  console.log(absolute_path);

  let timelineState = useTimelineStore.getState();
  let timeline = timelineState.timeline;
  console.log(timeline);
  timeline[ide].localpath = absolute_path;
  
  // Only scale dimensions if superRes is true
  if (superRes) {
    const element = timeline[ide];
    if ('width' in element && 'height' in element) {
      const oldwidth = element.width;
      const oldheight = element.height;
      element.width = oldwidth * 4;
      element.height = oldheight * 4;
    }
  }
  
  timelineState.patchTimeline(timeline);

  previewCanvas.drawCanvas();

  return false;
}

