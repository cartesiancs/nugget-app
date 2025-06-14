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


export function addImageElement(data: { outpath: string }) {
  const elementControlComponent = document.querySelector("element-control") as any;
      
  if (!elementControlComponent) {
      console.error("Element control component not found. Make sure the component is loaded first.");
      return false;
  }
  const timelineLatest = useTimelineStore.getState();
  let startTime = timelineLatest.cursor;
  const AssetList = document.querySelector("asset-list");
  console.log(AssetList.map)
  // elementControlComponent.addImage()
}