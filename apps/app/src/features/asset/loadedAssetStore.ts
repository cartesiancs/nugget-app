import { createStore } from "zustand/vanilla";
import { getLocationEnv } from "../../functions/getLocationEnv";
import { decompressFrames, parseGIF, type ParsedFrame } from "gifuct-js";

type GifMetadata = {
  imageData: ImageData;
  parsedFrame: ParsedFrame;
};

interface ILoadedAssetStore {
  loadedImage: Record<string, HTMLImageElement>;
  loadedGif: Record<string, GifMetadata[]>;
  gifCanvasCtx: CanvasRenderingContext2D;
  loadImage: (localpath: string) => void;
  loadGif: (localpath: string) => void;
}

export const loadedAssetStore = createStore<ILoadedAssetStore>((set) => ({
  loadedImage: {},
  loadedGif: {},

  gifCanvasCtx: document
    .createElement("canvas")
    .getContext("2d") as CanvasRenderingContext2D,

  loadImage(localpath) {
    const img = new Image();
    img.src = getPath(localpath);
    img.onload = () => {
      set((state) => ({
        loadedImage: { ...state.loadedImage, [localpath]: img },
      }));
    };
  },

  loadGif(localpath) {
    fetch(getPath(localpath))
      .then((resp) => resp.arrayBuffer())
      .then((buff) => {
        const gif = parseGIF(buff);
        const frames = decompressFrames(gif, true);
        const drawnFrames = frames.map((frame) => {
          const { width, height } = frame.dims;
          const imageData = this.gifCanvasCtx.createImageData(width, height);
          imageData.data.set(frame.patch);
          return {
            imageData,
            parsedFrame: frame,
          };
        });

        set((state) => ({
          loadedGif: { ...state.loadedGif, [localpath]: drawnFrames },
        }));
      });
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
