import { createStore } from "zustand/vanilla";

export interface IProjectStore {
  nowDirectory: string;
  updateDirectory: (nowDirectory: string) => void;
}

export const projectStore = createStore<IProjectStore>((set) => ({
  nowDirectory: "",

  updateDirectory: (nowDirectory: string) =>
    set((state) => ({ nowDirectory: nowDirectory })),
}));
