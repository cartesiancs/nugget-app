import { createStore } from "zustand/vanilla";

export type RenderOptions = {
  previewSize: {
    w: number;
    h: number;
  };
  fps: number;
  duration: number;
  backgroundColor: string;
};

export interface IRenderOptionStore {
  options: RenderOptions;
  updateOptions: (options: RenderOptions) => void;
}

export const renderOptionStore = createStore<IRenderOptionStore>((set) => ({
  options: {
    previewSize: {
      w: 1920,
      h: 1080,
    },
    fps: 60,
    duration: 10,
    backgroundColor: "#000000",
  },

  updateOptions: (options: RenderOptions) =>
    set((state) => ({ options: { ...options } })),
}));
