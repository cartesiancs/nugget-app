import { ReactiveController, ReactiveControllerHost } from "lit";
import { property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../states/timelineStore";

export class KeyframeController implements ReactiveController {
  private host: ReactiveControllerHost;

  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  timeline: any = this.timelineState.timeline;

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);

    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
    });
  }

  // 가장 처음에 추가할때 0번 point는 새로 추가한 point와 일치해야 함
  addPoint({ x, y, line, elementId, animationType }) {
    this.insertPointInMiddle({
      x: Math.round(x),
      y: Math.round(y),
      line: line,
      elementId: elementId,
      animationType: animationType,
    });

    this.interpolate(line, elementId, animationType);

    this.timeline[elementId].animation[animationType].isActivate = true;

    this.timelineState.patchTimeline(this.timeline);
  }

  insertPointInMiddle({ x, y, line, elementId, animationType }) {
    const lineToAlpha = line == 0 ? "x" : "y";
    const subDots = 100;

    console.log(this.timeline[elementId], elementId);

    if (animationType == "opacity") {
      if (
        this.timeline[elementId].animation[animationType]["x"].length - 1 ==
        0
      ) {
        this.timeline[elementId].animation[animationType].x[0].p = [
          0,
          this.timeline[elementId].location.x,
        ];
        this.timeline[elementId].animation[animationType].x[0].cs = [
          0,
          this.timeline[elementId].location.x,
        ];
        this.timeline[elementId].animation[animationType].x[0].ce = [
          0,
          this.timeline[elementId].location.x,
        ];
      }
    } else {
      if (
        this.timeline[elementId].animation[animationType]["x"].length - 1 ==
        0
      ) {
        this.timeline[elementId].animation[animationType].x[0].p = [
          0,
          this.timeline[elementId].location.x,
        ];
        this.timeline[elementId].animation[animationType].x[0].cs = [
          0,
          this.timeline[elementId].location.x,
        ];
        this.timeline[elementId].animation[animationType].x[0].ce = [
          0,
          this.timeline[elementId].location.x,
        ];
      }

      if (
        this.timeline[elementId].animation[animationType]["y"].length - 1 ==
        0
      ) {
        this.timeline[elementId].animation[animationType].y[0].p = [
          0,
          this.timeline[elementId].location.y,
        ];
        this.timeline[elementId].animation[animationType].y[0].cs = [
          0,
          this.timeline[elementId].location.y,
        ];
        this.timeline[elementId].animation[animationType].y[0].ce = [
          0,
          this.timeline[elementId].location.y,
        ];
      }
    }

    if (
      this.timeline[elementId].animation[animationType][lineToAlpha].length -
        1 ==
      0
    ) {
      this.timeline[elementId].animation[animationType][lineToAlpha].push({
        type: "cubic",
        p: [x, y],
        cs: [x - subDots, y],
        ce: [x + subDots, y],
      });
      return 0;
    }

    for (
      let index = 0;
      index <
      this.timeline[elementId].animation[animationType][lineToAlpha].length;
      index++
    ) {
      if (
        this.timeline[elementId].animation[animationType][lineToAlpha].length -
          1 ==
        index
      ) {
        this.timeline[elementId].animation[animationType][lineToAlpha].splice(
          index + 1,
          0,
          {
            type: "cubic",
            p: [x, y],
            cs: [x - subDots, y],
            ce: [x + subDots, y],
          },
        );
        return 0;
      } else if (
        this.timeline[elementId].animation[animationType][lineToAlpha][index]
          .p[0] < x &&
        this.timeline[elementId].animation[animationType][lineToAlpha][
          index + 1
        ].p[0] > x
      ) {
        this.timeline[elementId].animation[animationType][lineToAlpha].splice(
          index + 1,
          0,
          {
            type: "cubic",
            p: [x, y],
            cs: [x - subDots, y],
            ce: [x + subDots, y],
          },
        );
        return 0;
      }
    }
  }

  interpolate(line, elementId, animationType) {
    const lineToAlpha = line == 0 ? "x" : "y";
    const lineToAllAlpha = line == 0 ? "ax" : "ay";

    const array =
      this.timeline[elementId].animation[animationType][lineToAlpha];

    const interpolationArray: any = [];

    for (let ic = 0; ic < array.length - 1; ic++) {
      const interval = array[ic + 1].p[0] - array[ic].p[0];
      const intervalFrames = Math.round(interval / (1000 / 60)); // 60은 fps

      const interpolation = this.cubic(
        array[ic],
        array[ic + 1],
        intervalFrames,
      );

      for (let index = 0; index < interpolation.length; index++) {
        const element = interpolation[index];

        interpolationArray.push(element);
      }
    }

    this.timeline[elementId].animation[animationType][lineToAllAlpha] =
      interpolationArray;
  }

  cubic(d0, d1, iteration = 30) {
    let result: number[][] = [];

    for (let t = 0; t <= 1; t = t + 1 / iteration) {
      const x =
        Math.pow(1 - t, 3) * d0.p[0] +
        3 * Math.pow(1 - t, 2) * t * d0.ce[0] +
        3 * (1 - t) * Math.pow(t, 2) * d1.cs[0] +
        Math.pow(t, 3) * d1.p[0];
      const y =
        Math.pow(1 - t, 3) * d0.p[1] +
        3 * Math.pow(1 - t, 2) * t * d0.ce[1] +
        3 * (1 - t) * Math.pow(t, 2) * d1.cs[1] +
        Math.pow(t, 3) * d1.p[1];
      result.push([x, y]);
    }

    return result;
  }

  hostConnected() {}

  hostDisconnected() {}
}
