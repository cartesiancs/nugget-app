import { createStore } from "zustand/vanilla";

export interface IChatLLMPanelStore {
  list: any[];
  isLoad: boolean;

  addList: (active: any) => void;
}

export const chatLLMStore = createStore<IChatLLMPanelStore>((set) => ({
  list: [],
  isLoad: false,

  addList: (list: any) => set((state) => ({ list: [...state.list, list] })),
}));
