import { createStore } from "zustand/vanilla";

export interface IUIStore {
  resize: {
    vertical: {
      top: number;
      bottom: number;
    };
    horizontal: {
      panel: number;
      preview: number;
      option: number;
    };
    timelineVertical: {
      leftOption: number;
    };
  };
  topBarTitle: string;
  updateTimelineVertical: (px: number) => void;

  updateVertical: (criteria: number) => void;
  updateHorizontal: (criteria: number, panel: "panel" | "preview") => void;
  setTopBarTitle: (topBarTitle: string) => void;
}

export const uiStore = createStore<IUIStore>((set) => ({
  resize: {
    vertical: {
      top: 60,
      bottom: 40,
    },
    horizontal: {
      panel: 30,
      preview: 50,
      option: 20,
    },
    timelineVertical: {
      leftOption: 170,
    },
  },
  topBarTitle: "Nugget",

  setTopBarTitle: (topBarTitle) =>
    set((state) => ({
      topBarTitle: topBarTitle,
    })),

  updateTimelineVertical: (px) =>
    set((state) => ({
      resize: {
        vertical: { ...state.resize.vertical },
        horizontal: { ...state.resize.horizontal },
        timelineVertical: { leftOption: px },
      },
    })),

  updateVertical: (criteria) =>
    set((state) => ({
      resize: {
        vertical: { top: 100 - criteria, bottom: criteria },
        horizontal: { ...state.resize.horizontal },
        timelineVertical: { ...state.resize.timelineVertical },
      },
    })),

  updateHorizontal: (criteria, panel: "panel" | "preview") =>
    set((state) => {
      if (panel == "panel") {
        const optionPer = state.resize.horizontal.option;
        return {
          resize: {
            vertical: { ...state.resize.vertical },
            horizontal: {
              panel: criteria,
              preview: 100 - (optionPer + criteria),
              option: state.resize.horizontal.option,
            },
            timelineVertical: { ...state.resize.timelineVertical },
          },
        };
      }

      if (panel == "preview") {
        const optionPer = state.resize.horizontal.option;
        return {
          resize: {
            vertical: { ...state.resize.vertical },
            horizontal: {
              panel: state.resize.horizontal.panel,
              preview: criteria - state.resize.horizontal.panel,
              option: 100 - criteria,
            },
            timelineVertical: { ...state.resize.timelineVertical },
          },
        };
      }

      return {
        ...state,
      };
    }),
}));
