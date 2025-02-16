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
      x: parseFloat(x),
      y: parseFloat(y),
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

    if (["opacity", "scale"].includes(animationType)) {
      if (
        this.timeline[elementId].animation[animationType][lineToAlpha].length ==
        0
      ) {
        this.timeline[elementId].animation[animationType][lineToAlpha].push({
          type: "cubic",
          p: [x, y],
          cs: [x, y],
          ce: [x, y],
        });
        return 0;
      }
    } else {
      if (
        this.timeline[elementId].animation[animationType][lineToAlpha].length ==
        0
      ) {
        this.timeline[elementId].animation[animationType][lineToAlpha].push({
          type: "cubic",
          p: [x, y],
          cs: [x, y],
          ce: [x, y],
        });
        return 0;
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

    let isFirstPoint = true;

    for (
      let index = 0;
      index <
      this.timeline[elementId].animation[animationType][lineToAlpha].length;
      index++
    ) {
      if (
        this.timeline[elementId].animation[animationType][lineToAlpha][index]
          .p[0] == x
      ) {
        this.timeline[elementId].animation[animationType][lineToAlpha][index] =
          {
            type: "cubic",
            p: [x, y],
            cs: [x - subDots, y],
            ce: [x + subDots, y],
          };
        return false;
      }
      if (
        this.timeline[elementId].animation[animationType][lineToAlpha][index]
          .p[0] < x
      ) {
        isFirstPoint = false;
      }
    }

    if (isFirstPoint) {
      this.timeline[elementId].animation[animationType][lineToAlpha].unshift({
        type: "cubic",
        p: [x, y],
        cs: [x - subDots, y],
        ce: [x + subDots, y],
      });
      return false;
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
        // 마지막 index 일때
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

    // point가 하나일때
    if (array.length == 1) {
      const t =
        this.timeline[elementId].animation[animationType][lineToAlpha][0].p[0];
      const x =
        this.timeline[elementId].animation[animationType][lineToAlpha][0].p[1];

      this.timeline[elementId].animation[animationType][lineToAllAlpha] = [
        [t, x],
      ];
      return false;
    }

    const interpolationArray: any = [];

    for (let ic = 0; ic < array.length - 1; ic++) {
      const interval = array[ic + 1].p[0] - array[ic].p[0];
      if (interval > 5) {
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
