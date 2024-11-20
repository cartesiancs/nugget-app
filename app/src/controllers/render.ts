import { ReactiveController, ReactiveControllerHost } from "lit";

export class RenderController implements ReactiveController {
  private host: ReactiveControllerHost;

  public requestRender() {
    console.log("dsfsedf");
  }

  hostConnected() {}
  hostDisconnected() {}
}
