import { createContext, provide } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

export type TimelineContentObject = {
  canvasVerticalScroll: number;
};

export const timelineContext =
  createContext<TimelineContentObject>("timelineCanvas");
