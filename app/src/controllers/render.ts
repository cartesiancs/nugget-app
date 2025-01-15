import { ReactiveController, ReactiveControllerHost } from "lit";
import { rendererModal } from "../utils/modal";

export class RenderController implements ReactiveController {
  private host: ReactiveControllerHost | undefined;

  public requestRender() {
    const elementControlComponent = document.querySelector("element-control");

    const projectDuration = Number(
      document.querySelector("#projectDuration").value,
    );
    const projectFolder = document.querySelector("#projectFolder").value;
    const projectRatio = elementControlComponent.previewRatio;
    const previewSizeH = document.querySelector("#previewSizeH").value;
    const previewSizeW = document.querySelector("#previewSizeW").value;

    const videoBitrate = Number(document.querySelector("#videoBitrate").value);

    if (projectFolder == "") {
      document
        .querySelector("toast-box")
        .showToast({ message: "Select a project folder", delay: "4000" });

      return 0;
    }

    window.electronAPI.req.dialog.exportVideo().then((result) => {
      let videoDestination = result || `nonefile`;
      if (videoDestination == `nonefile`) {
        return 0;
      }

      let timeline = _.cloneDeep(
        document.querySelector("element-timeline").timeline,
      );

      timeline = Object.fromEntries(
        Object.entries(timeline).sort(
          ([, valueA]: any, [, valueB]: any) =>
            valueA.priority - valueB.priority,
        ),
      );

      let options = {
        videoDuration: projectDuration,
        videoDestination: result || `${projectFolder}/result.mp4`,
        videoDestinationFolder: projectFolder,
        videoBitrate: videoBitrate,
        previewRatio: projectRatio,
        previewSize: {
          w: previewSizeW,
          h: previewSizeH,
        },
      };

      prerender.render(timeline, options);
    });
  }

  hostConnected() {}
  hostDisconnected() {}
}

const rendererUtil = {
  hmsToSeconds(hms) {
    let splitHMS = hms.split(":");
    let seconds = +splitHMS[0] * 60 * 60 + +splitHMS[1] * 60 + +splitHMS[2];

    return seconds;
  },

  secondsToProgress(seconds) {
    const projectDuration = Number(
      document.querySelector("#projectDuration").value,
    );
    return (seconds / projectDuration) * 100;
  },

  showProgressModal() {
    rendererModal.progressModal.show();
  },
};

//NOTE: 성능 최적화 개판입니다.

const renderProgress = {
  show: function (prog) {
    rendererUtil.showProgressModal();
    document.querySelector("#progress").style.width = `${prog}%`;
    document.querySelector("#progress").innerHTML = `${Math.round(prog)}%`;
  },
};

const prerender: any = {
  state: {
    animateElements: {},
    elements: undefined,
    options: undefined,
    numberOfRenderingRequired: 0,
    renderingCount: 0,
    renderingProgress: 0,
  },

  initAnimateElementState: function (elementId) {
    let canvas = document.createElement("canvas");
    canvas.classList.add("d-none");
    canvas.setAttribute("width", prerender.state.options.previewSize.w);
    canvas.setAttribute("height", prerender.state.options.previewSize.h);

    let context = canvas.getContext("2d");

    prerender.state.animateElements[elementId] = {
      renderFrameLength: 0,
      savedFrameCount: 0,
      isCombineFrames: false,
      canvas: canvas,
      context: context,
    };
  },

  render: function (elements, options) {
    console.log(elements);
    prerender.state.elements = elements;
    prerender.state.options = options;
    prerender.state.numberOfRenderingRequired = 0;

    let path = `${options.videoDestinationFolder}/renderAnimation`;

    window.electronAPI.req.filesystem
      .mkdir(path, { recursive: true })
      .then((isCompleted) => {
        renderProgress.show(0);

        window.electronAPI.req.filesystem.emptyDirSync(path);

        for (const elementId in elements) {
          if (Object.hasOwnProperty.call(elements, elementId)) {
            const element = elements[elementId];

            if (element.filetype == "text") {
              prerender.initAnimateElementState(elementId);
              prerender.state.numberOfRenderingRequired += 1;

              let frame = prerender.renderText({
                elementId: elementId,
                elements: element,
              });

              prerender.saveTextImage({
                elementId: elementId,
                data: frame,
                outputDir: path,
                frame: 0,
              });
            }

            if (element.filetype == "shape") {
              prerender.initAnimateElementState(elementId);
              prerender.state.numberOfRenderingRequired += 1;

              let frame = prerender.renderShape({
                elementId: elementId,
                elements: element,
              });

              prerender.saveShapeImage({
                elementId: elementId,
                data: frame,
                outputDir: path,
                frame: 0,
              });
            }

            if (element.hasOwnProperty("animation") == false) {
              continue;
            }

            if (element.filetype == "image") {
              if (element.animation["position"].isActivate == true) {
                prerender.initAnimateElementState(elementId);
                prerender.state.numberOfRenderingRequired += 1;

                let frames = prerender.renderFrame({
                  elementId: elementId,
                  elements: element,
                });

                for (let index = 0; index < frames.length; index++) {
                  prerender.saveFrame({
                    elementId: elementId,
                    data: frames[index],
                    outputDir: path,
                    frame: index,
                  });
                }
              }
            }
          }
        }

        if (prerender.state.numberOfRenderingRequired == 0) {
          prerender.renderOutput();
        }
      });
  },

  findNearestY(pairs, a) {
    let closestY = null;
    let closestDiff = Infinity;

    for (const [x, y] of pairs) {
      const diff = Math.abs(x - a);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestY = y;
      }
    }

    return closestY;
  },

  renderText: function ({ elementId, elements }) {
    let canvas = prerender.state.animateElements[elementId].canvas;
    let context = prerender.state.animateElements[elementId].context;

    prerender.state.animateElements[elementId].renderFrameLength = 1;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = elements.textcolor;
    context.lineWidth = 0;
    context.letterSpacing = `${elements.letterSpacing}px`;

    context.font = `${elements.options.isItalic ? "italic" : ""} ${
      elements.options.isBold ? "bold" : ""
    } ${elements.fontsize}px ${elements.fontname}`;

    const fontBoxWidth = context.measureText(elements.text).width;

    if (elements.options.align == "left") {
      context.fillText(
        elements.text,
        elements.location.x,
        elements.location.y + elements.fontsize,
      );
    } else if (elements.options.align == "center") {
      context.fillText(
        elements.text,
        elements.location.x + elements.width / 2 - fontBoxWidth / 2,
        elements.location.y + elements.fontsize,
      );
    } else if (elements.options.align == "right") {
      context.fillText(
        elements.text,
        elements.location.x + elements.width - fontBoxWidth,
        elements.location.y + elements.fontsize,
      );
    }

    return canvas.toDataURL("image/png");
  },

  renderShape: function ({ elementId, elements }) {
    let canvas = prerender.state.animateElements[elementId].canvas;
    let context = prerender.state.animateElements[elementId].context;
    context.clearRect(0, 0, canvas.width, canvas.height);

    prerender.state.animateElements[elementId].renderFrameLength = 1;

    context.beginPath();

    const ratio = elements.oWidth / elements.width;

    for (let index = 0; index < elements.shape.length; index++) {
      const element = elements.shape[index];
      const x = element[0] / ratio + elements.location.x;
      const y = element[1] / ratio + elements.location.y;

      context.fillStyle = elements.option.fillColor;
      context.lineTo(x, y);
    }

    context.closePath();
    context.fill();

    return canvas.toDataURL("image/png");
  },

  renderFrame: function ({ elementId, elements }) {
    let canvas: HTMLCanvasElement =
      prerender.state.animateElements[elementId].canvas;
    let context = prerender.state.animateElements[elementId].context;

    let ax = elements.animation["position"].ax;
    let ay = elements.animation["position"].ay;

    const maxLength = ax.length > ay.length ? ax.length : ay.length;

    let canvasImage: string[] = [];
    prerender.state.animateElements[elementId].renderFrameLength = maxLength;

    for (let index = 0; index < maxLength; index++) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      let point = {
        x: prerender.findNearestY(ax, index * (1000 / 60)),
        y: prerender.findNearestY(ay, index * (1000 / 60)),
      };

      prerender.drawImage(elementId, context, point);
      context.stroke();
      canvasImage.push(canvas.toDataURL("image/png"));
    }

    return canvasImage;
  },

  drawImage: function (elementId, context, point) {
    let elementBody = document
      .querySelector(`element-control-asset[elementid='${elementId}']`)
      .querySelector("img");

    let x = 0 + point.x;
    let y = point.y;
    let w = prerender.state.elements[elementId].width;
    let h = prerender.state.elements[elementId].height;

    context.drawImage(elementBody, x, y, w, h);
  },

  saveFrame: function ({ data, outputDir, frame, elementId }) {
    const frameLength = 4;
    const base64Data = data.substring("data:image/png;base64,".length);
    const fileName =
      `${outputDir}/` +
      `frame-${elementId}-${String(frame + 1).padStart(frameLength, "0")}.png`;

    window.electronAPI.req.filesystem
      .writeFile(fileName, base64Data, "base64")
      .then((isCompleted) => {
        prerender.state.animateElements[elementId].savedFrameCount += 1;

        if (
          prerender.state.animateElements[elementId].savedFrameCount >=
            prerender.state.animateElements[elementId].renderFrameLength &&
          prerender.state.animateElements[elementId].isCombineFrames == false
        ) {
          prerender.state.animateElements[elementId].isCombineFrames == true;
          prerender.combineFrame({
            elementId: elementId,
            outputDir: outputDir,
          });
        }
      });
  },

  saveTextImage: function ({ data, outputDir, frame, elementId }) {
    const frameLength = 4;
    const base64Data = data.substring("data:image/png;base64,".length);
    const fileName = `${outputDir}/` + `prerender-${elementId}.png`;

    window.electronAPI.req.filesystem
      .writeFile(fileName, base64Data, "base64")
      .then((isCompleted) => {
        prerender.state.animateElements[elementId].savedFrameCount += 1;

        prerender.state.elements[elementId].filetype = "image";
        prerender.state.elements[elementId].opacity = 100;
        prerender.state.elements[elementId].location.x = 0;
        prerender.state.elements[elementId].location.y = 0;
        prerender.state.elements[elementId].width = parseInt(
          prerender.state.options.previewSize.w,
        );
        prerender.state.elements[elementId].height = parseInt(
          prerender.state.options.previewSize.h,
        );
        prerender.state.elements[elementId].localpath = fileName;

        prerender.state.renderingCount += 1;

        if (
          prerender.state.renderingCount >=
          prerender.state.numberOfRenderingRequired
        ) {
          prerender.renderOutput();
        }
      });
  },

  saveShapeImage: function ({ data, outputDir, frame, elementId }) {
    const frameLength = 4;
    const base64Data = data.substring("data:image/png;base64,".length);
    const fileName = `${outputDir}/` + `prerender-${elementId}.png`;

    window.electronAPI.req.filesystem
      .writeFile(fileName, base64Data, "base64")
      .then((isCompleted) => {
        prerender.state.animateElements[elementId].savedFrameCount += 1;

        prerender.state.elements[elementId].filetype = "image";
        prerender.state.elements[elementId].opacity = 100;
        prerender.state.elements[elementId].localpath = fileName;

        prerender.state.renderingCount += 1;

        if (
          prerender.state.renderingCount >=
          prerender.state.numberOfRenderingRequired
        ) {
          prerender.renderOutput();
        }
      });
  },

  combineFrame: function ({ elementId, outputDir }) {
    let outputVideoPath = `${outputDir}/${elementId}.webm`;

    window.electronAPI.req.ffmpeg.combineFrame(outputDir, elementId);

    window.electronAPI.res.render.finishCombineFrame(
      (evt, combinedElementId) => {
        if (combinedElementId != elementId) {
          return 0;
        }

        prerender.state.elements[elementId].filetype = "video";
        prerender.state.elements[elementId].isExistAudio = false;
        prerender.state.elements[elementId].localpath = outputVideoPath;
        prerender.state.elements[elementId].trim = {
          startTime: 0,
          endTime: prerender.state.elements[elementId].duration,
        };
        prerender.state.elements[elementId].height = parseInt(
          prerender.state.options.previewSize.h,
        );
        prerender.state.elements[elementId].width = parseInt(
          prerender.state.options.previewSize.w,
        );
        prerender.state.elements[elementId].location = { x: 0, y: 0 };
        prerender.state.elements[elementId].codec = {
          video: "libvpx-vp9",
          audio: "default",
        };

        prerender.state.renderingCount += 1;
        prerender.state.renderingProgress =
          (prerender.state.renderingCount /
            prerender.state.numberOfRenderingRequired) *
          100;

        renderProgress.show(prerender.state.renderingProgress);

        if (
          prerender.state.renderingCount >=
          prerender.state.numberOfRenderingRequired
        ) {
          prerender.renderOutput();
        }
      },
    );
  },

  renderOutput: function () {
    console.log("REND processing");

    //ipcRenderer.send('RENDER', renderAnimation.state.elements, renderAnimation.state.options)

    window.electronAPI.req.render.outputVideo(
      prerender.state.elements,
      prerender.state.options,
    );
  },
};
