import { ReactiveController, ReactiveControllerHost } from "lit";

// NOTE:  deprecated

export class TimelineController implements ReactiveController {
  private host: ReactiveControllerHost;

  value = 0;

  changeValue(value) {
    console.log(value);
    this.value += value;
  }

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
  }

  hostConnected() {}
  hostDisconnected() {}
}
