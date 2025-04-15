import { createStore } from "zustand/vanilla";
import { getLocationEnv } from "../../functions/getLocationEnv";
import { decompressFrames, parseGIF, type ParsedFrame } from "gifuct-js";
import type { VideoElementType } from "../../@types/timeline";
import { VideoFilterPipeline } from "../renderer/filter/videoPipeline";

type GifMetadata = {
  imageData: ImageData;
  parsedFrame: ParsedFrame;
};

export type VideoMetadataPerElement = {
  elementId: string;
  element: VideoElementType;
  path: string;
  canvas: HTMLCanvasElement;
  object: HTMLVideoElement;
  isPlay: boolean;
};

interface ILoadedAssetStore {
  // path, image
  loadedImage: Record<string, HTMLImageElement>;

  // path, gif
  loadedGif: Record<string, GifMetadata[]>;

  // elementId, video
  loadedElementVideo: Record<string, VideoMetadataPerElement>;

  gifCanvasCtx: CanvasRenderingContext2D;
  videoFilterCanvasCtx: WebGLRenderingContext;
  videoFilterPipeline: VideoFilterPipeline | null;

  loadImage: (localpath: string) => void;
  loadGif: (localpath: string) => void;
  loadElementVideo: (elementId: string, videoElement: VideoElementType) => void;

  startPlay: (timelineCursor: number) => void;
  stopPlay: (timelineCursor: number) => void;
}

export const loadedAssetStore = createStore<ILoadedAssetStore>((set, get) => ({
  loadedImage: {},
  loadedGif: {},
  loadedElementVideo: {},

  gifCanvasCtx: document
    .createElement("canvas")
    .getContext("2d") as CanvasRenderingContext2D,
  videoFilterCanvasCtx: document.createElement("canvas").getContext("webgl", {
    preserveDrawingBuffer: true,
    alpha: true,
  }) as WebGLRenderingContext,
  videoFilterPipeline: null,

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

  loadElementVideo(elementId, videoElement) {
    const video = document.createElement("video");
    video.playbackRate = videoElement.speed;

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.width;
    canvas.height = videoElement.height;

    this.loadedElementVideo[elementId] = {
      elementId,
      element: videoElement,
      path: getPath(videoElement.localpath),
      canvas: canvas,
      object: video,
      isPlay: false,
    };
    video.src = videoElement.localpath;

    video.addEventListener("loadeddata", () => {
      video.currentTime = 0;
    });
  },

  startPlay(timelineCursor: number) {
    const videoMetas = Object.values(get().loadedElementVideo);
    for (const meta of videoMetas) {
      meta.object.currentTime =
        (-(meta.element.startTime - timelineCursor) * meta.element.speed) /
        1000;
      meta.object.playbackRate = meta.element.speed;
      meta.object.muted = true;
      meta.isPlay = true;
      meta.object.play();
    }
  },

  stopPlay(timelineCursor: number) {
    const videoMetas = Object.values(get().loadedElementVideo);
    for (const meta of videoMetas) {
      meta.isPlay = false;
      meta.object.pause();
      meta.object.currentTime =
        (-(meta.element.startTime - timelineCursor) * meta.element.speed) /
        1000;
    }
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
