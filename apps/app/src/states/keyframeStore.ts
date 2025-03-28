import { createStore } from "zustand/vanilla";

type TargetObjectType = {
  elementId: string;
  animationType: string;
  isShow: boolean;
};

export interface IKeyframeStore {
  target: TargetObjectType;
  update: (target: TargetObjectType) => void;
}

export const keyframeStore = createStore<IKeyframeStore>((set) => ({
  target: {
    elementId: "",
    animationType: "position",
    isShow: false,
  },

  update: (target: TargetObjectType) => set((state) => ({ target: target })),
}));
