import { createContext, provide } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

type TimelinePanelOptionsType = {
  elementId: string;
  activeAnimation: boolean;
};

export type TimelineContentObject = {
  canvasVerticalScroll: number;
  panelOptions: TimelinePanelOptionsType[];
};

export const timelineContext =
  createContext<TimelineContentObject>("timelineCanvas");
