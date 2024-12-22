import { createStore } from "zustand/vanilla";
import { millisecondsToPx, pxToMilliseconds } from "../utils/time";
import { Timeline } from "../@types/timeline";

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
  decreaseCursor: (dt: number) => void;
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

  decreaseCursor: (dt: number) =>
    set((state) => ({ cursor: state.cursor - dt })),
}));
