import { ReactiveController, ReactiveControllerHost } from "lit";
import EnLang from "../locale/en.json";
import KoLang from "../locale/ko.json";

export class ToastController implements ReactiveController {
  host: ReactiveControllerHost;

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
  }

  public show(message: string, delay: number) {
    document
      .querySelector("toast-box")
      .showToast({ message: message, delay: String(delay) });
  }

  hostConnected() {}
  hostDisconnected() {}
}
