import { createStore } from "zustand/vanilla";

type ActiveStringType =
  | "record"
  | ""
  | "audioRecord"
  | "automaticCaption"
  | "ytDownload";

export interface IControlPanelStore {
  active: ActiveStringType[];
  nowActive: ActiveStringType;

  updatePanel: (active: ActiveStringType[]) => void;
  setActivePanel: (nowActive: ActiveStringType) => void;
}

export const controlPanelStore = createStore<IControlPanelStore>((set) => ({
  active: [],
  nowActive: "",

  updatePanel: (active: ActiveStringType[]) =>
    set((state) => ({ active: active })),

  setActivePanel: (nowActive: ActiveStringType) =>
    set((state) => ({ nowActive: nowActive })),
}));
