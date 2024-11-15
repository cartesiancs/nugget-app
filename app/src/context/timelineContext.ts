import { createContext, provide } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

export type TimelineContentObject = {
  range: number;
};

export const timelinerContext =
  createContext<TimelineContentObject>("timelineOptions");
