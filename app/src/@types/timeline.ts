export type ImageElementType = {
  key?: string;
  priority?: number;
  blob?: string;
  startTime?: number;
  duration?: number;
  opacity?: number;
  location?: { x: number; y: number };
  rotation?: number;
  width?: number;
  height?: number;
  localpath?: string;
  filetype?: string;
  animation?: {
    position?: {
      isActivate?: boolean;
      points?: number[][];
      allpoints?: number[][];
    };
    opacity?: {
      isActivate?: boolean;
      points?: number[][];
      allpoints?: number[][];
    };
  };
};

export type VideoElementType = {
  key?: string;

  priority?: number;
  blob?: string;
  startTime?: number;
  duration?: number;
  location?: { x: number; y: number };
  trim?: { startTime: number; endTime: number };
  rotation?: number;
  width?: number;
  height?: number;
  localpath?: string;
  isExistAudio?: boolean;
  filetype?: string;
  codec?: { video: string; audio: string };
};

export type TextElementType = {
  key?: string;
  blob?: string;

  priority?: number;
  startTime?: number;
  duration?: number;
  text?: string;
  textcolor?: string;
  fontsize?: number;
  fontpath?: string;
  fontname?: string;
  fontweight?: string;
  fonttype?: string;
  location?: { x: number; y: number };
  rotation?: number;
  localpath?: string;
  filetype?: string;
  height?: number;
  width?: number;
  widthInner?: number;
  animation?: {
    position?: {
      isActivate?: boolean;
      points?: number[][];
      allpoints?: number[][];
    };
    opacity?: {
      isActivate?: boolean;
      points?: number[][];
      allpoints?: number[][];
    };
  };
};

export type AudioElementType = {
  key?: string;

  priority?: number;
  startTime?: number;
  duration?: number;
  location?: { x: number; y: number };
  trim?: { startTime: number; endTime: number };
  localpath?: string;
  filetype?: string;
};

export interface Timeline {
  [elementId: string]: ImageElementType &
    VideoElementType &
    TextElementType &
    AudioElementType;
}
