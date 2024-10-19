import { createStore } from "zustand/vanilla";

type ImageElementType = {
  priority: number;
  blob: Blob;
  startTime: number;
  duration: number;
  location: { x: number; y: number };
  rotation: 0;
  width: number;
  height: number;
  localpath: string;
  filetype: string;
  animation: {
    position: {
      isActivate: boolean;
      points: [[], []];
      allpoints: [[], []];
    };
    opacity: {
      isActivate: boolean;
      points: [[]];
      allpoints: [[]];
    };
  };
};

export const useTimelineStore = createStore((set) => ({
  timeline: [],

  updateTimeline: (timeline: ImageElementType) =>
    set((state) => ({ timeline: [...state.timeline, timeline] })),
}));
