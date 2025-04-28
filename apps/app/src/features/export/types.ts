import type { RenderOptions } from "../../states/renderOptionStore";

export type ExportOptions = RenderOptions & {
  // renderOptionStore.options has `duration` but for legacy code, we need this field.
  // TODO: Remove this field in the future.
  videoDestination: string;

  videoDuration: number;
  videoBitrate: number;
};
