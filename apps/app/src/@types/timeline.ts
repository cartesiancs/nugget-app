import { ParsedFrame } from "gifuct-js";

export type CubicKeyframeType = {
  type: "cubic" | "linear";
  p: number[];
  cs: number[];
  ce: number[];
};

export type VideoFilterType = {
  name: "chromakey" | "blur" | "radialblur";
  value: string; //  if chromakey => r=0:g=0:b=0. 구분자는 : 로 구분합니다.
};

type TimelineElementType =
  | "video"
  | "image"
  | "gif"
  | "shape"
  | "text"
  | "audio";

type TimelinePlaced = {
  filetype: TimelineElementType;
  key: string;
  localpath: string;
  priority: number;
  blob: string;
  startTime: number;
  duration: number;
  location: { x: number; y: number };
  timelineOptions: {
    color: string;
  };
};

type Visual = {
  width: number;
  height: number;
  ratio: number;
  opacity: number;
  rotation: number;
};

// Shape는 opacity만 애니메이팅 가능하므로 다른 속성을 지원할 때 까지 임시 타입을 사용한다
type OpacityAnimatable = {
  animation: {
    opacity: {
      isActivate: boolean;
      x: CubicKeyframeType[];
      ax: number[][];
    };
  };
};

type Animatable = OpacityAnimatable & {
  animation: {
    position: {
      isActivate: boolean;
      x: CubicKeyframeType[];
      y: CubicKeyframeType[];

      ax: number[][];
      ay: number[][];
    };
    scale: {
      isActivate: boolean;
      x: CubicKeyframeType[];
      ax: number[][];
    };
    rotation: {
      isActivate: boolean;
      x: CubicKeyframeType[];
      ax: number[][];
    };
  };
};

export type ImageElementType = TimelinePlaced &
  Visual &
  Animatable & {
    filetype: "image";
  };

export type GifElementType = TimelinePlaced &
  Visual & {
    filetype: "gif";
  };

export type ShapeElementType = TimelinePlaced &
  Visual &
  OpacityAnimatable & {
    filetype: "shape";
    oWidth: number; // 원래 shape 사이즈
    oHeight: number;
    shape: number[][]; // [[x, y]...]
    option: {
      fillColor: string;
    };
  };

export type VideoElementType = TimelinePlaced &
  Visual &
  Animatable & {
    filetype: "video";
    trim: { startTime: number; endTime: number };
    isExistAudio: boolean;
    codec: { video: string; audio: string };
    speed: number;
    filter: {
      enable: boolean;
      list: VideoFilterType[];
    };
    origin: {
      width: number;
      height: number;
    };
  };

// parentKey must be 1 top depth
export type TextElementType = TimelinePlaced &
  Visual &
  Animatable & {
    filetype: "text";
    parentKey: string | "standalone";
    text: string;
    textcolor: string;
    fontsize: number;
    fontpath: string;
    fontname: string;
    fontweight: string;
    fonttype: string;
    letterSpacing: number;
    options: {
      isBold: boolean;
      isItalic: boolean;
      align: "left" | "center" | "right";
      outline: {
        enable: boolean;
        size: number;
        color: string;
      };
    };
    background: {
      enable: boolean;
      color: string;
    };
    widthInner: number;
  };

export type AudioElementType = TimelinePlaced & {
  filetype: "audio";
  trim: { startTime: number; endTime: number };
  speed: number;
};

export type TimelineElement =
  | VideoElementType
  | ImageElementType
  | GifElementType
  | ShapeElementType
  | TextElementType
  | AudioElementType;

export type VisualTimelineElement = Exclude<TimelineElement, AudioElementType>;

export function isVisualTimelineElement(
  element: TimelineElement,
): element is VisualTimelineElement {
  return element.filetype !== "audio";
}

export interface Timeline {
  [elementId: string]: TimelineElement;
}
