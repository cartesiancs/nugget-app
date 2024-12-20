import { ReactiveController, ReactiveControllerHost } from "lit";
import { rendererModal } from "../utils/modal";
import EnLang from "../locale/en.json";
import KoLang from "../locale/ko.json";
import { property, state } from "lit/decorators.js";

type AbleLanguage = "en" | "ko";

export class LocaleController implements ReactiveController {
  host: ReactiveControllerHost;

  value: AbleLanguage = "en";

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);

    window.electronAPI.req.store.get("LANG").then((item) => {
      this.value = item.value || "en";
    });
  }

  public t(target) {
    if (this.value == "en") {
      return this.getValueByPath(EnLang, target);
    }

    if (this.value == "ko") {
      return this.getValueByPath(KoLang, target);
    }
  }

  public changeLanguage(lang: AbleLanguage) {
    this.value = lang;
    window.electronAPI.req.store.set("LANG", lang);
  }

  private getValueByPath(json, path) {
    if (typeof path !== "string" || !path) {
      return "";
    }

    const keys = path.split(".");
    let current = json;

    for (const key of keys) {
      if (current && Object.prototype.hasOwnProperty.call(current, key)) {
        current = current[key];
      } else {
        return "";
      }
    }

    return current;
  }

  hostConnected() {
    window.electronAPI.req.store.get("LANG").then((item) => {
      this.value = item.value || "en";
      this.host.requestUpdate();
    });
  }
  hostDisconnected() {}
}
