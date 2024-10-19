import { createStore } from "zustand/vanilla";

export interface ITestStore {
  count: number;
  updateCount: () => void;
}

export const testStore = createStore<ITestStore>((set) => ({
  count: 0,

  updateCount: () => set((state) => ({ count: state.count + 1 })),
}));
