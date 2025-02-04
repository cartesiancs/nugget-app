import { ReactiveController, ReactiveControllerHost } from "lit";
import { rendererModal } from "../utils/modal";
import { renderOptionStore } from "../states/renderOptionStore";
import { useTimelineStore } from "../states/timelineStore";
import { elementUtils } from "../utils/element";
import { decompressFrames, parseGIF } from "gifuct-js";

let loaded = {};
let canvas = document.createElement("canvas");

export class RenderController implements ReactiveController {
  private host: ReactiveControllerHost | undefined;
  timeline: any;
  loadedObjects: any;
  gifFrames: any;
  gifCanvas: any;
  gifTempCanvas: any;
  loadedVideos: any;
  nowShapeId: any;

  public requestRenderV2() {
    const renderOptionState = renderOptionStore.getState().options;
    const elementControlComponent = document.querySelector("element-control");

    const projectDuration = renderOptionState.duration;
    const projectFolder = document.querySelector("#projectFolder").value;
    const projectRatio = elementControlComponent.previewRatio;
    const previewSizeH = renderOptionState.previewSize.h;
    const previewSizeW = renderOptionState.previewSize.w;

    const videoBitrate = Number(document.querySelector("#videoBitrate").value);

    if (projectFolder == "") {
      document
        .querySelector("toast-box")
        .showToast({ message: "Select a project folder", delay: "4000" });

      return 0;
    }

    this.timeline = Object.fromEntries(
      Object.entries(useTimelineStore.getState().timeline).sort(
        ([, valueA]: any, [, valueB]: any) => valueA.priority - valueB.priority,
      ),
    );
    this.loadMedia();

    window.electronAPI.req.dialog.exportVideo().then((result) => {
      let videoDestination = result || `nonefile`;
      if (videoDestination == `nonefile`) {
        return 0;
      }

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

      canvas = document.createElement("canvas");
      canvas.width = options.previewSize.w;
      canvas.height = options.previewSize.h;

      window.electronAPI.req.render.v2.start(options, this.timeline);

      const fps = 60;
      const imageCount = fps * projectDuration;

      this.nextFrameRender(options, 0, imageCount);
    });
  }

  nextFrameRender(options, frame, totalFrame) {
    rendererModal.progressModal.show();
    document.querySelector("#progress").style.width = `${
      (frame / totalFrame) * 100
    }%`;
    document.querySelector("#progress").innerHTML = `${Math.round(
      (frame / totalFrame) * 100,
    )}%`;

    const fps = 60;
    let needsToDelay = 0;
    let delayCount = 0; // Video와 같은 개체의 경우 프레임 정확성을 보장하기 위해 이벤트 리스너를 사용합니다.
    // 이때 이벤트가 달린 딜레이가 필요한 개체를 카운트 해주고 해당 카운트가 needsToDelay와 같아질때 랜더링합니다.

    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvas.width = options.previewSize.w;
      canvas.height = options.previewSize.h;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const sortedTimeline = this.timeline;

      const layers: string[] = [];

      for (const key in sortedTimeline) {
        if (Object.prototype.hasOwnProperty.call(sortedTimeline, key)) {
          layers.push(key);
          const fileType = this.timeline[key].filetype;
          let additionalStartTime = 0;

          if (fileType == "text") {
            if (this.timeline[key].parentKey != "standalone") {
              const parentStartTime =
                this.timeline[this.timeline[key].parentKey].startTime;
              additionalStartTime = parentStartTime;
            }
          }

          const startTime =
            (this.timeline[key].startTime as number) + additionalStartTime;
          const duration = this.timeline[key].duration as number;

          const elementType = elementUtils.getElementType(fileType);

          if (elementType == "static") {
            if (
              !(
                (frame / fps) * 1000 >= startTime &&
                (frame / fps) * 1000 < startTime + duration
              )
            ) {
              continue;
            }
          } else {
            if (
              !(
                (frame / fps) * 1000 >= startTime &&
                (frame / fps) * 1000 <
                  startTime + duration / this.timeline[key].speed
              )
            ) {
              continue;
            }
          }

          const element = sortedTimeline[key] as any;
          if (element.filetype == "video") {
            if (
              !(
                (frame / fps) * 1000 >=
                  startTime + this.timeline[key].trim.startTime &&
                (frame / fps) * 1000 <
                  startTime + this.timeline[key].trim.endTime
              )
            ) {
              continue;
            }

            needsToDelay += 1; // 영상은 딜레이가 필요합니다.
          }
        }
      }

      const drawLayer = async (layerIndex) => {
        if (layers.length <= layerIndex) {
          // 마지막 레이어 다음
          canvas.toBlob(async (blob) => {
            if (blob) {
              const arrayBuffer = await blob.arrayBuffer();
              window.electronAPI.req.render.v2.sendFrame(arrayBuffer);
              if (frame == totalFrame - 1) {
                window.electronAPI.req.render.v2.finishStream();
              } else {
                this.nextFrameRender(options, frame + 1, totalFrame);
              }
            }
          }, "image/png");
          return;
        }
        const elementId = layers[layerIndex];

        const x = this.timeline[elementId].location?.x as number;
        const y = this.timeline[elementId].location?.y as number;
        const w = this.timeline[elementId].width as number;
        const h = this.timeline[elementId].height as number;
        const fileType = this.timeline[elementId].filetype;
        let additionalStartTime = 0;

        if (fileType == "text") {
          if (this.timeline[elementId].parentKey != "standalone") {
            const parentStartTime =
              this.timeline[this.timeline[elementId].parentKey].startTime;
            additionalStartTime = parentStartTime;
          }
        }

        const startTime =
          (this.timeline[elementId].startTime as number) + additionalStartTime;
        const duration = this.timeline[elementId].duration as number;

        const elementType = elementUtils.getElementType(fileType);

        if (elementType == "static") {
          if (
            !(
              (frame / fps) * 1000 >= startTime &&
              (frame / fps) * 1000 < startTime + duration
            )
          ) {
            drawLayer(layerIndex + 1);
            return;
          }
        } else {
          if (
            !(
              (frame / fps) * 1000 >= startTime &&
              (frame / fps) * 1000 <
                startTime + duration / this.timeline[elementId].speed
            )
          ) {
            drawLayer(layerIndex + 1);
            return;
          }
        }

        if (fileType == "image") {
          const imageElement = this.timeline[elementId] as any;
          let scaleW = w;
          let scaleH = h;
          let scaleX = x;
          let scaleY = y;
          let compare = 1;

          ctx.globalAlpha = imageElement.opacity / 100;

          if (imageElement.animation["opacity"].isActivate == true) {
            let index = Math.round(((frame / fps) * 1000) / 16);
            let indexToMs = index * 20;
            let startTime = Number(this.timeline[elementId].startTime);
            let indexPoint = Math.round((indexToMs - startTime) / 20);

            try {
              if (indexPoint < 0) {
                return false;
              }

              const ax = this.findNearestY(
                imageElement.animation["opacity"].ax,
                (frame / fps) * 1000 - imageElement.startTime,
              ) as any;

              console.log("EEERRR", ax / 100);

              ctx.globalAlpha = ax / 100;
            } catch (error) {}
          }

          if (imageElement.animation["scale"].isActivate == true) {
            let index = Math.round(((frame / fps) * 1000) / 16);
            let indexToMs = index * 20;
            let startTime = Number(this.timeline[elementId].startTime);
            let indexPoint = Math.round((indexToMs - startTime) / 20);

            try {
              if (indexPoint < 0) {
                return false;
              }

              const ax = this.findNearestY(
                imageElement.animation["scale"].ax,
                (frame / fps) * 1000 - imageElement.startTime,
              ) as any;

              scaleW = w * ax;
              scaleH = h * ax;
              compare = scaleW - w;

              scaleX = x - compare / 2;
              scaleY = y - compare / 2;
            } catch (error) {}
          }

          let animationType = "position";

          if (imageElement.animation[animationType].isActivate == true) {
            let index = Math.round(((frame / fps) * 1000) / 16);
            let indexToMs = index * 20;
            let startTime = Number(this.timeline[elementId].startTime);
            let indexPoint = Math.round((indexToMs - startTime) / 20);

            try {
              if (indexPoint < 0) {
                return false;
              }

              const ax = this.findNearestY(
                imageElement.animation[animationType].ax,
                (frame / fps) * 1000 - imageElement.startTime,
              ) as any;

              const ay = this.findNearestY(
                imageElement.animation[animationType].ay,
                (frame / fps) * 1000 - imageElement.startTime,
              ) as any;

              ctx.drawImage(
                loaded[elementId],
                ax - compare / 2,
                ay - compare / 2,
                scaleW,
                scaleH,
              );

              drawLayer(layerIndex + 1);
              return;
            } catch (error) {}
          }

          ctx.drawImage(loaded[elementId], scaleX, scaleY, scaleW, scaleH);

          ctx.globalAlpha = 1;

          drawLayer(layerIndex + 1);
          return;
        }

        // NOTE: gif 랜더링 구현 필요
        if (fileType == "gif") {
          const imageElement = this.timeline[elementId] as any;

          const gifTempCanvas = document.createElement("canvas");
          const gifTempCanvasCtx = gifTempCanvas.getContext("2d") as any;

          const imageIndex = loaded[elementId].findIndex((item) => {
            return item.key == elementId;
          });
          const delay = loaded[elementId][0].delay;

          const index =
            Math.round(((frame / fps) * 1000) / delay) %
            loaded[elementId].length;
          const firstFrame = loaded[elementId][index];

          let dims = firstFrame.dims;
          let frameImageData: any = null;
          gifTempCanvas.width = dims.width;
          gifTempCanvas.height = dims.height;

          frameImageData = gifTempCanvasCtx.createImageData(
            dims.width,
            dims.height,
          );

          frameImageData.data.set(firstFrame.patch);

          gifTempCanvasCtx.putImageData(frameImageData, 0, 0);

          ctx.drawImage(gifTempCanvas, x, y, w, h);

          drawLayer(layerIndex + 1);
          return;
        }

        if (fileType == "text") {
          try {
            ctx.globalAlpha = 1;

            ctx.fillStyle = this.timeline[elementId].textcolor as string;
            ctx.lineWidth = 0;
            ctx.letterSpacing = `${this.timeline[elementId].letterSpacing}px`;

            ctx.font = `${
              this.timeline[elementId].options.isItalic ? "italic" : ""
            } ${this.timeline[elementId].options.isBold ? "bold" : ""} ${
              this.timeline[elementId].fontsize
            }px ${this.timeline[elementId].fontname}`;

            let tx = x;
            let ty = y;

            if (
              this.timeline[elementId].animation["opacity"].isActivate == true
            ) {
              let index = Math.round(((frame / fps) * 1000) / 16);
              let indexToMs = index * 20;
              let startTime = Number(this.timeline[elementId].startTime);
              let indexPoint = Math.round((indexToMs - startTime) / 20);

              try {
                if (indexPoint < 0) {
                  return false;
                }

                const ax = this.findNearestY(
                  this.timeline[elementId].animation["opacity"].ax,
                  (frame / fps) * 1000 - this.timeline[elementId].startTime,
                ) as any;

                ctx.globalAlpha = ax / 100;
              } catch (error) {}
            }

            let animationType = "position";

            if (
              this.timeline[elementId].animation[animationType].isActivate ==
              true
            ) {
              let index = Math.round(((frame / fps) * 1000) / 16);
              let indexToMs = index * 20;
              let startTime = Number(this.timeline[elementId].startTime);
              let indexPoint = Math.round((indexToMs - startTime) / 20);

              try {
                if (indexPoint < 0) {
                  return false;
                }

                const ax = this.findNearestY(
                  this.timeline[elementId].animation[animationType].ax,
                  (frame / fps) * 1000 - this.timeline[elementId].startTime,
                ) as any;

                const ay = this.findNearestY(
                  this.timeline[elementId].animation[animationType].ay,
                  (frame / fps) * 1000 - this.timeline[elementId].startTime,
                ) as any;

                tx = ax;
                ty = ay;
              } catch (error) {}
            }

            this.drawTextBackground(ctx, elementId, x, y, w, h);

            ctx.fillStyle = this.timeline[elementId].textcolor as string;

            if (this.timeline[elementId].options.align == "left") {
              const textSplited = this.timeline[elementId].text.split(" ");
              let line = "";
              let textY = y + (this.timeline[elementId].fontsize || 0);
              let lineHeight = h;

              for (let index = 0; index < textSplited.length; index++) {
                const testLine = line + textSplited[index] + " ";
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;

                if (testWidth < w) {
                  line = testLine;
                } else {
                  this.drawTextStroke(ctx, elementId, line, x, textY);
                  ctx.fillText(line, x, textY);
                  line = textSplited[index] + " ";
                  textY += lineHeight;
                }
              }

              this.drawTextStroke(ctx, elementId, line, x, textY);
              ctx.fillText(line, x, textY);
            } else if (this.timeline[elementId].options.align == "center") {
              const textSplited = this.timeline[elementId].text.split(" ");
              let line = "";
              let textY = y + (this.timeline[elementId].fontsize || 0);
              let lineHeight = h;

              for (let index = 0; index < textSplited.length; index++) {
                const testLine = line + textSplited[index] + " ";
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;

                if (testWidth < w) {
                  line = testLine;
                } else {
                  const wordWidth = ctx.measureText(line).width;
                  this.drawTextStroke(
                    ctx,
                    elementId,
                    line,
                    x + w / 2 - wordWidth / 2,
                    textY,
                  );
                  ctx.fillText(line, x + w / 2 - wordWidth / 2, textY);
                  line = textSplited[index] + " ";
                  textY += lineHeight;
                }
              }

              const lastWordWidth = ctx.measureText(line).width;

              this.drawTextStroke(
                ctx,
                elementId,
                line,
                x + w / 2 - lastWordWidth / 2,
                textY,
              );
              ctx.fillText(line, x + w / 2 - lastWordWidth / 2, textY);
            } else if (this.timeline[elementId].options.align == "right") {
              const textSplited = this.timeline[elementId].text.split(" ");
              let line = "";
              let textY = y + (this.timeline[elementId].fontsize || 0);
              let lineHeight = h;

              for (let index = 0; index < textSplited.length; index++) {
                const testLine = line + textSplited[index] + " ";
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;

                if (testWidth < w) {
                  line = testLine;
                } else {
                  const wordWidth = ctx.measureText(line).width;
                  this.drawTextStroke(
                    ctx,
                    elementId,
                    line,
                    x + w - wordWidth,
                    textY,
                  );
                  ctx.fillText(line, x + w - wordWidth, textY);
                  line = textSplited[index] + " ";
                  textY += lineHeight;
                }
              }

              const lastWordWidth = ctx.measureText(line).width;

              this.drawTextStroke(
                ctx,
                elementId,
                line,
                x + w - lastWordWidth,
                textY,
              );
              ctx.fillText(line, x + w - lastWordWidth, textY);
            }

            ctx.globalAlpha = 1;

            drawLayer(layerIndex + 1);
            return;
          } catch (error) {}
        }

        if (fileType == "shape") {
          this.drawShape(canvas, elementId);
          drawLayer(layerIndex + 1);
          return;
        }

        if (fileType == "video") {
          const videoElement = this.timeline[elementId] as any;

          if (
            !(
              (frame / fps) * 1000 >=
                startTime + this.timeline[elementId].trim.startTime &&
              (frame / fps) * 1000 <
                startTime + this.timeline[elementId].trim.endTime
            )
          ) {
            drawLayer(layerIndex + 1);
            return;
          }

          const onSeeked = () => {
            loaded[elementId].removeEventListener("seeked", onSeeked);

            if (videoElement.animation["opacity"].isActivate == true) {
              let index = Math.round(((frame / fps) * 1000) / 16);
              let indexToMs = index * 20;
              let startTime = Number(this.timeline[elementId].startTime);
              let indexPoint = Math.round((indexToMs - startTime) / 20);

              try {
                if (indexPoint < 0) {
                  return false;
                }

                const ax = this.findNearestY(
                  videoElement.animation["opacity"].ax,
                  (frame / fps) * 1000 - videoElement.startTime,
                ) as any;

                ctx.globalAlpha = ax / 100;
              } catch (error) {}
            }

            let animationType = "position";

            if (videoElement.animation[animationType].isActivate == true) {
              let index = Math.round(((frame / fps) * 1000) / 16);
              let indexToMs = index * 20;
              let startTime = Number(this.timeline[elementId].startTime);
              let indexPoint = Math.round((indexToMs - startTime) / 20);

              try {
                if (indexPoint < 0) {
                  return false;
                }

                const ax = this.findNearestY(
                  videoElement.animation[animationType].ax,
                  (frame / fps) * 1000 - videoElement.startTime,
                ) as any;

                const ay = this.findNearestY(
                  videoElement.animation[animationType].ay,
                  (frame / fps) * 1000 - videoElement.startTime,
                ) as any;

                ctx.drawImage(loaded[elementId], ax, ay, w, h);

                drawLayer(layerIndex + 1);
                return;
              } catch (error) {}
            }

            ctx.drawImage(loaded[elementId], x, y, w, h);
            ctx.globalAlpha = 1;

            delayCount += 1;

            drawLayer(layerIndex + 1);
          };

          loaded[elementId].addEventListener("seeked", onSeeked);

          loaded[elementId].currentTime =
            (-(this.timeline[elementId].startTime - (frame / fps) * 1000) *
              this.timeline[elementId].speed) /
            1000;
        }
      };

      drawLayer(0);
    }
  }

  loadMedia() {
    this.timeline = useTimelineStore.getState().timeline;

    for (const key in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, key)) {
        const element = this.timeline[key];

        if (element.filetype == "image") {
          let img = new Image();
          img.onload = () => {
            loaded[key] = img;
          };
          img.src = element.localpath;
        }

        if (element.filetype == "video") {
          const video = document.createElement("video");
          video.playbackRate = this.timeline[key].speed;
          video.src = this.timeline[key].localpath;

          video.addEventListener("loadeddata", () => {
            video.currentTime = 0;
            loaded[key] = video;
          });
        }

        if (element.filetype == "gif") {
          fetch(this.timeline[key].localpath)
            .then((resp) => resp.arrayBuffer())
            .then((buff) => {
              let gif = parseGIF(buff);
              let frames = decompressFrames(gif, true);

              loaded[key] = frames;
            });
        }
      }
    }
  }

  findNearestY(pairs, a): number | null {
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
  }

  drawTextStroke(ctx, elementId, text, x, y) {
    if (this.timeline[elementId].options.outline.enable) {
      ctx.font = `${
        this.timeline[elementId].options.isItalic ? "italic" : ""
      } ${this.timeline[elementId].options.isBold ? "bold" : ""} ${
        this.timeline[elementId].fontsize
      }px ${this.timeline[elementId].fontname}`;

      ctx.lineWidth = parseInt(this.timeline[elementId].options.outline.size);
      ctx.strokeStyle = this.timeline[elementId].options.outline.color;
      ctx.strokeText(text, x, y);
    }
  }

  drawTextBackground(ctx, elementId, x, y, w, h) {
    if (this.timeline[elementId].background.enable) {
      const backgroundPadding = 12;
      let backgroundX = x;
      let backgroundW = w;
      if (this.timeline[elementId].options.align == "left") {
        const textSplited = this.timeline[elementId].text.split(" ");
        let line = "";
        let textY = y;
        let lineHeight = h;

        for (let index = 0; index < textSplited.length; index++) {
          const testLine = line + textSplited[index] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth < w) {
            line = testLine;
          } else {
            const wordWidth = ctx.measureText(line).width;

            backgroundX = x - backgroundPadding;
            backgroundW = wordWidth + backgroundPadding;

            ctx.fillStyle = this.timeline[elementId].background.color;
            ctx.fillRect(backgroundX, textY, backgroundW, h);

            line = textSplited[index] + " ";
            textY += lineHeight;
          }
        }

        const wordWidth = ctx.measureText(line).width;
        backgroundW = wordWidth + backgroundPadding;

        ctx.fillStyle = this.timeline[elementId].background.color;
        ctx.fillRect(backgroundX, textY, backgroundW, h);
      } else if (this.timeline[elementId].options.align == "center") {
        const textSplited = this.timeline[elementId].text.split(" ");
        let line = "";
        let textY = y;
        let lineHeight = h;

        for (let index = 0; index < textSplited.length; index++) {
          const testLine = line + textSplited[index] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth < w) {
            line = testLine;
          } else {
            const wordWidth = ctx.measureText(line).width;

            backgroundX = x + w / 2 - wordWidth / 2 - backgroundPadding;
            backgroundW = wordWidth + backgroundPadding;

            ctx.fillStyle = this.timeline[elementId].background.color;
            ctx.fillRect(backgroundX, textY, backgroundW, h);

            line = textSplited[index] + " ";
            textY += lineHeight;
          }
        }

        const wordWidth = ctx.measureText(line).width;
        backgroundX = x + w / 2 - wordWidth / 2 - backgroundPadding;
        backgroundW = wordWidth + backgroundPadding;

        ctx.fillStyle = this.timeline[elementId].background.color;
        ctx.fillRect(backgroundX, textY, backgroundW, h);
      } else if (this.timeline[elementId].options.align == "right") {
        const textSplited = this.timeline[elementId].text.split(" ");
        let line = "";
        let textY = y;
        let lineHeight = h;

        for (let index = 0; index < textSplited.length; index++) {
          const testLine = line + textSplited[index] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth < w) {
            line = testLine;
          } else {
            const wordWidth = ctx.measureText(line).width;

            backgroundX = x + w - wordWidth - backgroundPadding;
            backgroundW = wordWidth + backgroundPadding;

            ctx.fillStyle = this.timeline[elementId].background.color;
            ctx.fillRect(backgroundX, textY, backgroundW, h);

            line = textSplited[index] + " ";
            textY += lineHeight;
          }
        }

        const wordWidth = ctx.measureText(line).width;
        backgroundX = x + w - wordWidth - backgroundPadding;
        backgroundW = wordWidth + backgroundPadding;

        ctx.fillStyle = this.timeline[elementId].background.color;
        ctx.fillRect(backgroundX, textY, backgroundW, h);
      }
    }
  }

  drawShape(canvas, elementId) {
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    const target = this.timeline[elementId];

    ctx.beginPath();

    const ratio = target.oWidth / target.width;

    for (let index = 0; index < target.shape.length; index++) {
      const element = target.shape[index];
      const x = element[0] / ratio + target.location.x;
      const y = element[1] / ratio + target.location.y;

      ctx.fillStyle = target.option.fillColor;

      ctx.lineTo(x, y);
    }

    ctx.closePath();

    ctx.fill();
  }

  parseRGBString(str) {
    const parts = str.split(":");

    let r = 0,
      g = 0,
      b = 0;

    parts.forEach((item) => {
      const [key, value] = item.split("=");
      const numValue = parseInt(value, 10);

      switch (key) {
        case "r":
          r = numValue;
          break;
        case "g":
          g = numValue;
          break;
        case "b":
          b = numValue;
          break;
        default:
          break;
      }
    });

    return { r, g, b };
  }

  public requestRender() {
    const renderOptionState = renderOptionStore.getState().options;
    const elementControlComponent = document.querySelector("element-control");

    const projectDuration = renderOptionState.duration;
    const projectFolder = document.querySelector("#projectFolder").value;
    const projectRatio = elementControlComponent.previewRatio;
    const previewSizeH = renderOptionState.previewSize.h;
    const previewSizeW = renderOptionState.previewSize.w;

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

      // parent 타임라인 starttime 반영. 나중에 수정 필요.
      for (const key in timeline) {
        if (Object.prototype.hasOwnProperty.call(timeline, key)) {
          const element = timeline[key];
          let additionalStartTime = 0;

          if (element.filetype == "text") {
            if (element.parentKey != "standalone") {
              const parentStartTime =
                timeline[timeline[key].parentKey].startTime;
              additionalStartTime = parentStartTime;

              element.startTime += additionalStartTime;
            }
          }
        }
      }

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
    const renderOptionState = renderOptionStore.getState().options;

    const projectDuration = renderOptionState.duration;
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

  drawTextBackground(ctx, elements, x, y, w, h) {
    if (elements.background.enable) {
      const backgroundPadding = 12;
      let backgroundX = x;
      let backgroundW = w;
      if (elements.options.align == "left") {
        const textSplited = elements.text.split(" ");
        let line = "";
        let textY = y;
        let lineHeight = h;

        for (let index = 0; index < textSplited.length; index++) {
          const testLine = line + textSplited[index] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth < w) {
            line = testLine;
          } else {
            const wordWidth = ctx.measureText(line).width;

            backgroundX = x - backgroundPadding;
            backgroundW = wordWidth + backgroundPadding;

            ctx.fillStyle = elements.background.color;
            ctx.fillRect(backgroundX, textY, backgroundW, h);

            line = textSplited[index] + " ";
            textY += lineHeight;
          }
        }

        const wordWidth = ctx.measureText(line).width;
        backgroundW = wordWidth + backgroundPadding;

        ctx.fillStyle = elements.background.color;
        ctx.fillRect(backgroundX, textY, backgroundW, h);
      } else if (elements.options.align == "center") {
        const textSplited = elements.text.split(" ");
        let line = "";
        let textY = y;
        let lineHeight = h;

        for (let index = 0; index < textSplited.length; index++) {
          const testLine = line + textSplited[index] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth < w) {
            line = testLine;
          } else {
            const wordWidth = ctx.measureText(line).width;

            backgroundX = x + w / 2 - wordWidth / 2 - backgroundPadding;
            backgroundW = wordWidth + backgroundPadding;

            ctx.fillStyle = elements.background.color;
            ctx.fillRect(backgroundX, textY, backgroundW, h);

            line = textSplited[index] + " ";
            textY += lineHeight;
          }
        }

        const wordWidth = ctx.measureText(line).width;
        backgroundX = x + w / 2 - wordWidth / 2 - backgroundPadding;
        backgroundW = wordWidth + backgroundPadding;

        ctx.fillStyle = elements.background.color;
        ctx.fillRect(backgroundX, textY, backgroundW, h);
      } else if (elements.options.align == "right") {
        const textSplited = elements.text.split(" ");
        let line = "";
        let textY = y;
        let lineHeight = h;

        for (let index = 0; index < textSplited.length; index++) {
          const testLine = line + textSplited[index] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth < w) {
            line = testLine;
          } else {
            const wordWidth = ctx.measureText(line).width;

            backgroundX = x + w - wordWidth - backgroundPadding;
            backgroundW = wordWidth + backgroundPadding;

            ctx.fillStyle = elements.background.color;
            ctx.fillRect(backgroundX, textY, backgroundW, h);

            line = textSplited[index] + " ";
            textY += lineHeight;
          }
        }

        const wordWidth = ctx.measureText(line).width;
        backgroundX = x + w - wordWidth - backgroundPadding;
        backgroundW = wordWidth + backgroundPadding;

        ctx.fillStyle = elements.background.color;
        ctx.fillRect(backgroundX, textY, backgroundW, h);
      }
    }
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

    prerender.drawTextBackground(
      context,
      elements,
      elements.location.x,
      elements.location.y,
      elements.width,
      elements.height,
    );

    context.fillStyle = elements.textcolor;

    if (elements.options.align == "left") {
      const textSplited = elements.text.split(" ");
      let line = "";
      let textY = elements.location.y + elements.fontsize;
      let lineHeight = elements.height;

      for (let index = 0; index < textSplited.length; index++) {
        const testLine = line + textSplited[index] + " ";
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth < elements.width) {
          line = testLine;
        } else {
          if (elements.options.outline.enable) {
            context.lineWidth = parseInt(elements.options.outline.size);
            context.strokeStyle = elements.options.outline.color;
            context.strokeText(line, elements.location.x, textY);
          }
          context.fillText(line, elements.location.x, textY);

          line = textSplited[index] + " ";
          textY += lineHeight;
        }
      }

      if (elements.options.outline.enable) {
        context.lineWidth = parseInt(elements.options.outline.size);
        context.strokeStyle = elements.options.outline.color;
        context.strokeText(line, elements.location.x, textY);
      }
      context.fillText(line, elements.location.x, textY);
    } else if (elements.options.align == "center") {
      const textSplited = elements.text.split(" ");
      let line = "";
      let textY = elements.location.y + elements.fontsize;
      let lineHeight = elements.height;

      for (let index = 0; index < textSplited.length; index++) {
        const testLine = line + textSplited[index] + " ";
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth < elements.width) {
          line = testLine;
        } else {
          const wordWidth = context.measureText(line).width;

          if (elements.options.outline.enable) {
            context.lineWidth = parseInt(elements.options.outline.size);
            context.strokeStyle = elements.options.outline.color;
            context.strokeText(
              line,
              elements.location.x + elements.width / 2 - wordWidth / 2,
              textY,
            );
          }
          context.fillText(
            line,
            elements.location.x + elements.width / 2 - wordWidth / 2,
            textY,
          );

          line = textSplited[index] + " ";
          textY += lineHeight;
        }
      }

      const lastWordWidth = context.measureText(line).width;

      if (elements.options.outline.enable) {
        context.lineWidth = parseInt(elements.options.outline.size);
        context.strokeStyle = elements.options.outline.color;
        context.strokeText(
          line,
          elements.location.x + elements.width / 2 - lastWordWidth / 2,
          textY,
        );
      }
      context.fillText(
        line,
        elements.location.x + elements.width / 2 - lastWordWidth / 2,
        textY,
      );
    } else if (elements.options.align == "right") {
      const textSplited = elements.text.split(" ");
      let line = "";
      let textY = elements.location.y + elements.fontsize;
      let lineHeight = elements.height;

      for (let index = 0; index < textSplited.length; index++) {
        const testLine = line + textSplited[index] + " ";
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth < elements.width) {
          line = testLine;
        } else {
          const wordWidth = context.measureText(line).width;

          if (elements.options.outline.enable) {
            context.lineWidth = parseInt(elements.options.outline.size);
            context.strokeStyle = elements.options.outline.color;
            context.strokeText(
              line,
              elements.location.x + elements.width - wordWidth,
              textY,
            );
          }
          context.fillText(
            line,
            elements.location.x + elements.width - wordWidth,
            textY,
          );

          line = textSplited[index] + " ";
          textY += lineHeight;
        }
      }

      const lastWordWidth = context.measureText(line).width;

      if (elements.options.outline.enable) {
        context.lineWidth = parseInt(elements.options.outline.size);
        context.strokeStyle = elements.options.outline.color;
        context.strokeText(
          line,
          elements.location.x + elements.width - lastWordWidth,
          textY,
        );
      }
      context.fillText(
        line,
        elements.location.x + elements.width - lastWordWidth,
        textY,
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
