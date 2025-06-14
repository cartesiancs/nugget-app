import { createStore } from "zustand/vanilla";

export interface IChatLLMPanelStore {
  list: any[];
  isLoad: boolean;

  addList: (active: any) => void;
}

export const chatLLMStore = createStore<IChatLLMPanelStore>((set) => ({
  list: [
    {
      from: "agent",
      text: "Hello, how can I help you today?",
      timestamp: new Date().toISOString(),
    },
    {
      from: "user",
      text: "I'm doing well, thank you for asking!",
      timestamp: new Date().toISOString(),
    },
  ],
  isLoad: false,

  addList: (list: any) => set((state) => ({ list: [...state.list, list] })),
}));
