import { createStore } from "zustand/vanilla";
import { millisecondsToPx, pxToMilliseconds } from "../utils/time";

export type ImageElementType = {
  key?: string;
  priority?: number;
  blob?: string;
  startTime?: number;
  duration?: number;
  opacity?: number;
  location?: { x: number; y: number };
  rotation?: number;
  width?: number;
  height?: number;
  localpath?: string;
  filetype?: string;
  animation?: {
    position?: {
      isActivate?: boolean;
      points?: number[][];
      allpoints?: number[][];
    };
    opacity?: {
      isActivate?: boolean;
      points?: number[][];
      allpoints?: number[][];
    };
  };
};

type VideoElementType = {
  key?: string;

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
  key?: string;
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
    position?: {
      isActivate?: boolean;
      points?: number[][];
      allpoints?: number[][];
    };
    opacity?: {
      isActivate?: boolean;
      points?: number[][];
      allpoints?: number[][];
    };
  };
};

type AudioElementType = {
  key?: string;

  priority?: number;
  startTime?: number;
  duration?: number;
  location?: { x: number; y: number };
  trim?: { startTime: number; endTime: number };
  localpath?: string;
  filetype?: string;
};

interface Timeline {
  [elementId: string]: ImageElementType &
    VideoElementType &
    TextElementType &
    AudioElementType;
}

export interface ITimelineStore {
  timeline: Timeline;
  range: number;
  scroll: number;
  cursor: number;
  canvasWidth: number;

  addTimeline: (key: string, timeline: any) => void;
  clearTimeline: () => void;
  removeTimeline: (targetId: string) => void;
  patchTimeline: (timeline: any) => void;
  setRange: (range: number) => void;
  setScroll: (scroll: number) => void;
  setCursor: (cursor: number) => void;
  setCanvasWidth: (canvasWidth: number) => void;

  increaseCursor: (dt: number) => void;
}

export const useTimelineStore = createStore<ITimelineStore>((set) => ({
  timeline: {},
  range: 0.9,
  scroll: 0,
  cursor: 0,
  canvasWidth: 500,

  addTimeline: (key: string, timeline: any) =>
    set((state) => ({ timeline: { ...state.timeline, [key]: timeline } })),

  clearTimeline: () =>
    set((state) => ({
      timeline: {},
    })),

  removeTimeline: (targetId: string) =>
    set((state) => {
      delete state.timeline[targetId];
      return { timeline: { ...state.timeline } };
    }),

  patchTimeline: (timeline: any) =>
    set((state) => ({ timeline: { ...timeline } })),

  setRange: (range: number) =>
    set((state) => ({
      range: range,
      scroll:
        (state.cursor / 5) * (range / 4) - state.canvasWidth / 2 <= 0
          ? 0
          : (state.cursor / 5) * (range / 4) - state.canvasWidth / 2,
    })),
  setScroll: (scroll: number) => set((state) => ({ scroll: scroll })),
  setCursor: (cursor: number) => set((state) => ({ cursor: cursor })),
  setCanvasWidth: (canvasWidth: number) =>
    set((state) => ({ canvasWidth: canvasWidth })),

  increaseCursor: (dt: number) =>
    set((state) => ({ cursor: state.cursor + dt })),
}));
