import { createStore } from "zustand/vanilla";
import { getLocationEnv } from "../../functions/getLocationEnv";
import { decompressFrames, parseGIF, type ParsedFrame } from "gifuct-js";
import type {
  Timeline,
  VideoElementType,
  VisualTimelineElement,
} from "../../@types/timeline";
import { VideoFilterPipeline } from "../renderer/filter/videoPipeline";
import { isElementVisibleAtTime } from "../element/time";

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
  _loadedImage: Record<string, HTMLImageElement>;

  // path, gif
  _loadedGif: Record<string, GifMetadata[]>;

  // elementId, video
  _loadedElementVideo: Record<string, VideoMetadataPerElement>;

  gifCanvasCtx: CanvasRenderingContext2D;
  videoFilterCanvasCtx: WebGLRenderingContext;
  videoFilterPipeline: VideoFilterPipeline | null;

  loadImage: (localpath: string) => Promise<void>;
  getImage: (localpath: string) => HTMLImageElement | null;

  loadGif: (localpath: string) => Promise<void>;
  getGif: (localpath: string) => GifMetadata[] | null;

  loadElementVideo: (
    elementId: string,
    videoElement: VideoElementType,
  ) => Promise<void>;
  getElementVideo: (elementId: string) => VideoMetadataPerElement | null;

  loadAssetsNeededAtTime: (t: number, timeline: Timeline) => Promise<void>;

  startPlay: (timelineCursor: number) => void;
  stopPlay: (timelineCursor: number) => void;
}

export const loadedAssetStore = createStore<ILoadedAssetStore>((set, get) => ({
  _loadedImage: {},
  _loadedGif: {},
  _loadedElementVideo: {},

  gifCanvasCtx: document
    .createElement("canvas")
    .getContext("2d") as CanvasRenderingContext2D,
  videoFilterCanvasCtx: document.createElement("canvas").getContext("webgl", {
    preserveDrawingBuffer: true,
    alpha: true,
  }) as WebGLRenderingContext,
  videoFilterPipeline: null,

  loadImage(localpath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = getPath(localpath);
      img.onload = () => {
        set((state) => ({
          _loadedImage: { ...state._loadedImage, [localpath]: img },
        }));
        img.onload = null;
        img.onerror = null;
        resolve();
      };
      img.onerror = (e) => {
        console.error("Failed to load image:", e);
        img.onload = null;
        img.onerror = null;
        reject(e);
      };
    });
  },
  getImage(localpath) {
    return get()._loadedImage[localpath] ?? null;
  },

  async loadGif(localpath) {
    const response = await fetch(getPath(localpath));
    const buffer = await response.arrayBuffer();

    const gif = parseGIF(buffer);
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
      _loadedGif: { ...state._loadedGif, [localpath]: drawnFrames },
    }));
  },
  getGif(localpath) {
    return get()._loadedGif[localpath] ?? null;
  },

  async loadElementVideo(elementId, videoElement) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.playbackRate = videoElement.speed;

      const canvas = document.createElement("canvas");
      canvas.width = videoElement.width;
      canvas.height = videoElement.height;

      video.src = videoElement.localpath;

      video.onloadeddata = () => {
        video.currentTime = 0;
        this._loadedElementVideo[elementId] = {
          elementId,
          element: videoElement,
          path: getPath(videoElement.localpath),
          canvas: canvas,
          object: video,
          isPlay: false,
        };
        video.onloadeddata = null;
        video.onerror = null;
        resolve();
      };
      video.onerror = (e) => {
        console.error("Failed to load video:", e);
        video.onloadeddata = null;
        video.onerror = null;
        reject(e);
      };
    });
  },
  getElementVideo(elementId) {
    return get()._loadedElementVideo[elementId] ?? null;
  },

  async loadAssetsNeededAtTime(t: number, timeline: Timeline) {
    const idElementPairs = Object.entries(timeline);
    const visibleElements = idElementPairs.filter(
      (x): x is [string, VisualTimelineElement] => {
        return (
          x[1].filetype !== "audio" && isElementVisibleAtTime(t, timeline, x[1])
        );
      },
    );

    const store = get();
    const loadPromises = visibleElements.map(([elementId, element]) => {
      switch (element.filetype) {
        case "image":
          if (store._loadedImage[element.localpath] == null) {
            return store.loadImage(element.localpath);
          }
          break;
        case "gif":
          if (store._loadedGif[element.localpath] == null) {
            return store.loadGif(element.localpath);
          }
          break;
        case "video":
          if (store._loadedElementVideo[elementId] == null) {
            return store.loadElementVideo(elementId, element);
          }
          break;
      }

      return null;
    });
    await Promise.all(loadPromises.filter((x) => x != null));
  },

  startPlay(timelineCursor: number) {
    const videoMetas = Object.values(get()._loadedElementVideo);
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
    const videoMetas = Object.values(get()._loadedElementVideo);
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
