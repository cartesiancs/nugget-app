import { createContext, provide } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

export type TimelineContentObject = {
  range: number;
};

export const timelinerContext =
  createContext<TimelineContentObject>("timelineOptions");

@customElement("timeline-context")
export class MyApp extends LitElement {
  @provide({ context: timelinerContext })
  timelineOptions = { range: 0.9 };

  createRenderRoot() {
    return this;
  }

  render() {
    return html``;
  }
}
