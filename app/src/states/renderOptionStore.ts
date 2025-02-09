import { createStore } from "zustand/vanilla";

type Options = {
  previewSize: {
    w: number;
    h: number;
  };
  fps: number;
  duration: number;
};

export interface IRenderOptionStore {
  options: Options;
  updateOptions: (options: Options) => void;
}

export const renderOptionStore = createStore<IRenderOptionStore>((set) => ({
  options: {
    previewSize: {
      w: 1920,
      h: 1080,
    },
    fps: 60,
    duration: 10,
  },

  updateOptions: (options: Options) =>
    set((state) => ({ options: { ...options } })),
}));
