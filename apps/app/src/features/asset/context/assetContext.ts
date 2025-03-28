import { createContext, provide } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

export type AssetObject = {
  showType: string;
};

export const assetContext = createContext<AssetObject>("asset");
