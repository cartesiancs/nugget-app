import { createStore } from "zustand/vanilla";

type ImageElementType = {
  key: string;
  priority?: number;
  blob?: string;
  startTime?: number;
  duration?: number;
  location?: { x: number; y: number };
  rotation?: 0;
  width?: number;
  height?: number;
  localpath?: string;
  filetype?: string;
  animation?: {
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
  key: string;

  priority?: number;
  blob?: string;
  startTime?: number;
  duration?: number;
  location?: { x: number; y: number };
  trim?: { startTime: number; endTime: number };
  rotation?: number;
  width?: number;
  height?: number;
  localpath?: string;
  isExistAudio?: boolean;
  filetype?: string;
  codec?: { video: string; audio: string };
};

type TextElementType = {
  key: string;
  blob?: string;

  priority?: number;
  startTime?: number;
  duration?: number;
  text?: string;
  textcolor?: string;
  fontsize?: number;
  fontpath?: string;
  fontname?: string;
  fontweight?: string;
  fonttype?: string;
  location?: { x: number; y: number };
  rotation?: number;
  localpath?: string;
  filetype?: string;
  height?: number;
  width?: number;
  widthInner?: number;
  animation?: {
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
  key: string;

  priority?: number;
  startTime?: number;
  duration?: number;
  location?: { x: number; y: number };
  trim?: { startTime: number; endTime: number };
  localpath?: string;
  filetype?: string;
};

type TimelineArrayType =
  | ImageElementType
  | VideoElementType
  | TextElementType
  | AudioElementType;

export interface ITimelineStore {
  timeline: Object;
  addTimeline: (key: string, timeline: never) => void;
  clearTimeline: () => void;
}

export const useTimelineStore = createStore<ITimelineStore>((set) => ({
  timeline: {},

  addTimeline: (key: string, timeline: never) =>
    set((state) => ({ timeline: { ...state.timeline, [key]: timeline } })),

  clearTimeline: () =>
    set((state) => ({
      timeline: {},
    })),
}));
