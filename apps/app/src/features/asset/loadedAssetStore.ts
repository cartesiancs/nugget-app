import { createStore } from "zustand/vanilla";
import { getLocationEnv } from "../../functions/getLocationEnv";

interface ILoadedAssetStore {
  loadedImage: Record<string, HTMLImageElement>;
  loadImage: (localpath: string) => void;
}

export const loadedAssetStore = createStore<ILoadedAssetStore>((set) => ({
  loadedImage: {},

  loadImage: (localpath: string) => {
    const img = new Image();
    img.src = getPath(localpath);
    img.onload = () => {
      set((state) => ({
        loadedImage: { ...state.loadedImage, [localpath]: img },
      }));
    };
  },
}));

function getPath(path: string) {
  const nowEnv = getLocationEnv();
  let filepath = path;
  if (nowEnv == "electron") {
    filepath = path;
  } else if (nowEnv == "web") {
    filepath = `/api/file?path=${path}`;
  } else {
    filepath = path;
  }

  return filepath;
}
