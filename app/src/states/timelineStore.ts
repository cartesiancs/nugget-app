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
      points: number[][];
      allpoints: number[][];
    };
    opacity: {
      isActivate: boolean;
      points: number[][];
      allpoints: number[][];
    };
  };
};

type VideoElementType = {
  priority: number;
  blob: Blob;
  startTime: number;
  duration: number;
  location: { x: number; y: number };
  trim: { startTime: number; endTime: number };
  rotation: number;
  width: number;
  height: number;
  localpath: string;
  isExistAudio: boolean;
  filetype: string;
  codec: { video: string; audio: string };
};

type TextElementType = {
  priority: number;
  startTime: number;
  duration: number;
  text: string;
  textcolor: string;
  fontsize: number;
  fontpath: string;
  fontname: string;
  fontweight: string;
  fonttype: string;
  location: { x: number; y: number };
  rotation: number;
  localpath: string;
  filetype: string;
  height: number;
  width: number;
  widthInner: number;
  animation: {
    position: {
      isActivate: boolean;
      points: number[][];
      allpoints: number[][];
    };
    opacity: {
      isActivate: boolean;
      points: number[][];
      allpoints: number[][];
    };
  };
};

type AudioElementType = {
  priority: number;
  blob: Blob;
  startTime: number;
  duration: number;
  location: { x: number; y: number };
  trim: { startTime: number; endTime: number };
  localpath: string;
  filetype: string;
};

export interface ITimelineStore {
  timeline:
    | ImageElementType
    | VideoElementType
    | TextElementType
    | AudioElementType;
  addTimeline: (
    timeline:
      | ImageElementType
      | VideoElementType
      | TextElementType
      | AudioElementType
  ) => void;
}

export const useTimelineStore = createStore((set) => ({
  timeline: [],

  addTimeline: (
    timeline:
      | ImageElementType
      | VideoElementType
      | TextElementType
      | AudioElementType
  ) => set((state) => ({ timeline: [...state.timeline, timeline] })),
}));
