import { ReactiveController, ReactiveControllerHost } from "lit";
import { rendererModal } from "../utils/modal";
import { renderOptionStore } from "../states/renderOptionStore";
import { useTimelineStore } from "../states/timelineStore";
import { elementUtils } from "../utils/element";
import { decompressFrames, parseGIF } from "gifuct-js";

let loaded = {};
let canvas = document.createElement("canvas");

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("셰이더 컴파일 에러:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export class RenderController implements ReactiveController {
  private host: ReactiveControllerHost | undefined;
  timeline: any;
  loadedObjects: any;
  gifFrames: any;
  gifCanvas: any;
  gifTempCanvas: any;
  loadedVideos: any;
  nowShapeId: any;
  renderTime: any;

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

    window.electronAPI.req.dialog.exportVideo().then(async (result) => {
      let videoDestination = result || `nonefile`;
      if (videoDestination == `nonefile`) {
        return 0;
      }

      const isExistFile = await window.electronAPI.req.filesystem.existFile(
        videoDestination,
      );

      if (isExistFile) {
        await window.electronAPI.req.filesystem.removeFile(videoDestination);
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

      this.renderTime = [];

      this.nextFrameRender(options, 0, imageCount);
    });
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  nextFrameRender(options, frame, totalFrame) {
    const pers = (frame / totalFrame) * 100;
    rendererModal.progressModal.show();
    document.querySelector("#progress").style.width = `${pers}%`;
    document.querySelector("#progress").innerHTML = `${Math.round(pers)}%`;

    this.renderTime.push(new Date());

    if (this.renderTime.length > 2) {
      this.renderTime.shift();
      const rm = (this.renderTime[1] - this.renderTime[0]) / 100;
      document.querySelector("#remainingTime").innerHTML = `${this.formatTime(
        Math.round(rm * (100 - pers)),
      )} left`;
    }

    const fps = 60;
    let needsToDelay = 0;
    let delayCount = 0; // Video와 같은 개체의 경우 프레임 정확성을 보장하기 위해 이벤트 리스너를 사용합니다.
    // 이때 이벤트가 달린 딜레이가 필요한 개체를 카운트 해주고 해당 카운트가 needsToDelay와 같아질때 랜더링합니다.

    const ctx = canvas.getContext("2d") as any;
    if (ctx) {
      canvas.width = options.previewSize.w;
      canvas.height = options.previewSize.h;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const sortedTimeline = Object.fromEntries(
        Object.entries(this.timeline).sort(
          ([, valueA]: any, [, valueB]: any) =>
            valueA.priority - valueB.priority,
        ),
      );

      const layers: string[] = [];

      for (const key in sortedTimeline) {
        if (Object.prototype.hasOwnProperty.call(sortedTimeline, key)) {
          const fileType = this.timeline[key].filetype;
          let additionalStartTime = 0;

          if (fileType != "audio") {
            layers.push(key);
          }

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
          const rotation = this.timeline[elementId].rotation * (Math.PI / 180);

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

              ctx.globalAlpha = this.zeroIfNegative(ax / 100);
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

          const centerX = x + scaleW / 2;
          const centerY = y + scaleH / 2;

          ctx.translate(centerX, centerY);
          ctx.rotate(rotation);

          ctx.drawImage(
            loaded[elementId],
            -scaleW / 2,
            -scaleH / 2,
            scaleW,
            scaleH,
          );
          ctx.rotate(-rotation);
          ctx.translate(-centerX, -centerY);

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
          let scaleW = w;
          let scaleH = h;
          let tx = x;
          let ty = y;
          let fontSize = this.timeline[elementId].fontsize;
          let compare = 1;

          try {
            ctx.globalAlpha = 1;

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

                ctx.globalAlpha = this.zeroIfNegative(ax / 100);
              } catch (error) {}
            }

            if (
              this.timeline[elementId].animation["scale"].isActivate == true
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
                  this.timeline[elementId].animation["scale"].ax,
                  (frame / fps) * 1000 - this.timeline[elementId].startTime,
                ) as any;

                fontSize = this.timeline[elementId].fontsize * (ax / 10);
              } catch (error) {}
            }

            ctx.fillStyle = this.timeline[elementId].textcolor as string;
            ctx.lineWidth = 0;
            ctx.letterSpacing = `${this.timeline[elementId].letterSpacing}px`;

            ctx.font = `${
              this.timeline[elementId].options.isItalic ? "italic" : ""
            } ${
              this.timeline[elementId].options.isBold ? "bold" : ""
            } ${fontSize}px ${this.timeline[elementId].fontname}`;

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

            this.drawTextBackground(ctx, elementId, tx, ty, scaleW, scaleH);

            ctx.fillStyle = this.timeline[elementId].textcolor as string;

            if (this.timeline[elementId].options.align == "left") {
              const textSplited = this.timeline[elementId].text.split(" ");
              let line = "";
              let textY = ty + (this.timeline[elementId].fontsize || 0);
              let lineHeight = h;

              for (let index = 0; index < textSplited.length; index++) {
                const testLine = line + textSplited[index] + " ";
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;

                if (testWidth < w) {
                  line = testLine;
                } else {
                  this.drawTextStroke(
                    ctx,
                    elementId,
                    line,
                    tx,
                    textY,
                    fontSize,
                  );
                  ctx.fillText(line, tx, textY);
                  line = textSplited[index] + " ";
                  textY += lineHeight;
                }
              }

              this.drawTextStroke(ctx, elementId, line, tx, textY, fontSize);
              ctx.fillText(line, tx, textY);
            } else if (this.timeline[elementId].options.align == "center") {
              const textSplited = this.timeline[elementId].text.split(" ");
              let line = "";
              let textY = ty + (this.timeline[elementId].fontsize || 0);
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
                    tx + w / 2 - wordWidth / 2,
                    textY,
                    fontSize,
                  );
                  ctx.fillText(line, tx + w / 2 - wordWidth / 2, textY);
                  line = textSplited[index] + " ";
                  textY += lineHeight;
                }
              }

              const lastWordWidth = ctx.measureText(line).width;

              this.drawTextStroke(
                ctx,
                elementId,
                line,
                tx + w / 2 - lastWordWidth / 2,
                textY,
                fontSize,
              );
              ctx.fillText(line, tx + w / 2 - lastWordWidth / 2, textY);
            } else if (this.timeline[elementId].options.align == "right") {
              const textSplited = this.timeline[elementId].text.split(" ");
              let line = "";
              let textY = ty + (this.timeline[elementId].fontsize || 0);
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
                    tx + w - wordWidth,
                    textY,
                    fontSize,
                  );
                  ctx.fillText(line, tx + w - wordWidth, textY);
                  line = textSplited[index] + " ";
                  textY += lineHeight;
                }
              }

              const lastWordWidth = ctx.measureText(line).width;

              this.drawTextStroke(
                ctx,
                elementId,
                line,
                tx + w - lastWordWidth,
                textY,
                fontSize,
              );
              ctx.fillText(line, tx + w - lastWordWidth, textY);
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
          let scaleW = w;
          let scaleH = h;
          let scaleX = x;
          let scaleY = y;
          let compare = 1;

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

            const video = {
              object: loaded[elementId],
            };

            let source = loaded[elementId];

            if (
              this.timeline[elementId].filter.enable &&
              this.timeline[elementId].filter.list.length > 0
            ) {
              if (this.timeline[elementId].filter.list[0].name == "chromakey") {
                source = this.applyChromaKey(
                  ctx,
                  video,
                  videoElement,
                  w,
                  h,
                  scaleX,
                  scaleY,
                  scaleW,
                  scaleH,
                );
              }

              if (this.timeline[elementId].filter.list[0].name == "blur") {
                source = this.applyBlur(
                  ctx,
                  video,
                  videoElement,
                  w,
                  h,
                  scaleX,
                  scaleY,
                  scaleW,
                  scaleH,
                );
              }

              if (
                this.timeline[elementId].filter.list[0].name == "radialblur"
              ) {
                source = this.applyRadialBlur(
                  ctx,
                  video,
                  videoElement,
                  w,
                  h,
                  scaleX,
                  scaleY,
                  scaleW,
                  scaleH,
                );
              }
            }

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

                ctx.globalAlpha = this.zeroIfNegative(ax / 100);
              } catch (error) {}
            }

            if (videoElement.animation["scale"].isActivate == true) {
              let index = Math.round(((frame / fps) * 1000) / 16);
              let indexToMs = index * 20;
              let startTime = Number(this.timeline[elementId].startTime);
              let indexPoint = Math.round((indexToMs - startTime) / 20);

              try {
                if (indexPoint < 0) {
                  return false;
                }

                const ax = this.findNearestY(
                  videoElement.animation["scale"].ax,
                  (frame / fps) * 1000 - videoElement.startTime,
                ) as any;

                scaleW = w * ax;
                scaleH = h * ax;
                compare = scaleW - w;

                scaleX = x - compare / 2;
                scaleY = y - compare / 2;
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

                ctx.drawImage(
                  source,
                  ax - compare / 2,
                  ay - compare / 2,
                  scaleW,
                  scaleH,
                );

                drawLayer(layerIndex + 1);
                return;
              } catch (error) {}
            }

            ctx.drawImage(source, scaleX, scaleY, scaleW, scaleH);
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

  applyChromaKey(
    ctx,
    video,
    videoElement,
    w,
    h,
    scaleX,
    scaleY,
    scaleW,
    scaleH,
  ) {
    if (!video.glCanvas) {
      video.glCanvas = document.createElement("canvas");
      video.glCanvas.width = w;
      video.glCanvas.height = h;
      video.gl = video.glCanvas.getContext("webgl", {
        preserveDrawingBuffer: true,
        alpha: true,
      });
      if (!video.gl) {
        console.error("WebGL을 지원하지 않습니다.");
        ctx.drawImage(video.object, scaleX, scaleY, scaleW, scaleH);
        return;
      }
      const gl = video.gl;

      const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `;
      const fragmentShaderSource = `
        precision mediump float;
        uniform sampler2D u_video;
        uniform vec3 u_keyColor;
        uniform float u_threshold;
        varying vec2 v_texCoord;
        void main() {
          vec4 color = texture2D(u_video, v_texCoord);
          float diff = distance(color.rgb, u_keyColor);
          if(diff < u_threshold) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          } else {
            gl_FragColor = color;
          }
        }
      `;

      const vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        vertexShaderSource,
      );
      const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource,
      );
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("R:", gl.getProgramInfoLog(program));
        return;
      }
      gl.useProgram(program);
      video.glProgram = program;

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = new Float32Array([
        -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      const a_position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

      const texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
      const a_texCoord = gl.getAttribLocation(program, "a_texCoord");
      gl.enableVertexAttribArray(a_texCoord);
      gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

      const videoTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, videoTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      video.glTexture = videoTexture;

      const u_keyColor = gl.getUniformLocation(program, "u_keyColor");
      const u_threshold = gl.getUniformLocation(program, "u_threshold");
      let keyColor = [0.0, 1.0, 0.0]; // Green
      if (videoElement.filter.list && videoElement.filter.list.length > 0) {
        const targetRgb = videoElement.filter.list[0].value;
        const parsedRgb = this.parseRGBString(targetRgb);
        keyColor = [parsedRgb.r / 255, parsedRgb.g / 255, parsedRgb.b / 255];
      }

      console.log(keyColor);
      gl.uniform3fv(u_keyColor, keyColor);
      gl.uniform1f(u_threshold, 0.5);

      const u_video = gl.getUniformLocation(program, "u_video");
      gl.uniform1i(u_video, 0);
    }

    const gl = video.gl;
    const glCanvas = video.glCanvas;
    gl.bindTexture(gl.TEXTURE_2D, video.glTexture);
    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video.object,
      );
    } catch (e) {}
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return glCanvas;
  }

  applyBlur(ctx, video, videoElement, w, h, scaleX, scaleY, scaleW, scaleH) {
    console.log("BLUR filter");
    if (!video.glCanvas) {
      video.glCanvas = document.createElement("canvas");
      video.glCanvas.width = w;
      video.glCanvas.height = h;
      video.gl = video.glCanvas.getContext("webgl", {
        preserveDrawingBuffer: true,
        alpha: true,
      });
      if (!video.gl) {
        console.error("WebGL을 지원하지 않습니다.");
        ctx.drawImage(video.object, scaleX, scaleY, scaleW, scaleH);
        return;
      }
      const gl = video.gl;

      const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `;

      const fragmentShaderSource = `
        precision mediump float;
        uniform sampler2D u_video;
        uniform vec2 u_texelSize; 
        uniform float u_blurFactor; 
        varying vec2 v_texCoord;
        void main() {
          vec4 sum = vec4(0.0);
          for (int i = -1; i <= 1; i++) {
            for (int j = -1; j <= 1; j++) {
              vec2 offset = vec2(float(i), float(j)) * u_texelSize * u_blurFactor;
              sum += texture2D(u_video, v_texCoord + offset);
            }
          }
          gl_FragColor = sum / 9.0;
        }
      `;

      const vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        vertexShaderSource,
      );
      const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource,
      );
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("셰이더 링크 에러:", gl.getProgramInfoLog(program));
        return;
      }
      gl.useProgram(program);
      video.glProgram = program;

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = new Float32Array([
        -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      const a_position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

      const texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
      const a_texCoord = gl.getAttribLocation(program, "a_texCoord");
      gl.enableVertexAttribArray(a_texCoord);
      gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

      const videoTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, videoTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      video.glTexture = videoTexture;

      const u_texelSize = gl.getUniformLocation(program, "u_texelSize");
      gl.uniform2fv(u_texelSize, [1.0 / w, 1.0 / h]);

      const blurFactor = this.parseBlurString(
        videoElement.filter.list[0].value,
      );
      const u_blurFactor = gl.getUniformLocation(program, "u_blurFactor");
      gl.uniform1f(u_blurFactor, blurFactor.f);

      const u_video = gl.getUniformLocation(program, "u_video");
      gl.uniform1i(u_video, 0);
    }

    const gl = video.gl;
    const glCanvas = video.glCanvas;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, video.glTexture);
    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video.object,
      );
    } catch (e) {
      console.error("텍스처 업데이트 오류:", e);
    }
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return glCanvas;
  }

  applyRadialBlur(
    ctx,
    video,
    videoElement,
    w,
    h,
    scaleX,
    scaleY,
    scaleW,
    scaleH,
  ) {
    if (!video.glCanvas) {
      video.glCanvas = document.createElement("canvas");
      video.glCanvas.width = w;
      video.glCanvas.height = h;
      video.gl = video.glCanvas.getContext("webgl", {
        preserveDrawingBuffer: true,
        alpha: true,
      });
      if (!video.gl) {
        ctx.drawImage(video.object, scaleX, scaleY, scaleW, scaleH);
        return;
      }
      const gl = video.gl;

      const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

      const fragmentShaderSource = `
      precision mediump float;
      uniform sampler2D u_video;
      uniform float u_power;
      uniform vec2 u_mouse;
      varying vec2 v_texCoord;
      
      const int samples = 66;
      
      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }
      
      vec4 sample(vec2 uv) {
        return texture2D(u_video, uv);
      }
      
      vec4 frag(vec2 uv) {
        float rotateDir = sin(length(uv - u_mouse) / (0.005 + u_power * 5.0));
        rotateDir = smoothstep(-0.3, 0.3, rotateDir) - 0.5;
        vec2 shiftDir = (uv - u_mouse) * vec2(-1.0, -1.0);
        vec4 color = vec4(0.0);
        for (int i = 0; i < samples; i++) {
          uv += float(i) / float(samples) * shiftDir * 0.01;
          uv -= u_mouse;
          uv *= rotate2d(rotateDir * u_power * float(i));
          uv += u_mouse;
          color += sample(uv) / float(samples + i);
        }
        return color * 1.5;
      }
      
      void main() {
        gl_FragColor = frag(v_texCoord);
      }
    `;

      const vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        vertexShaderSource,
      );
      const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource,
      );
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return;
      }
      gl.useProgram(program);
      video.glProgram = program;

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = new Float32Array([
        -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      const a_position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

      const texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
      const a_texCoord = gl.getAttribLocation(program, "a_texCoord");
      gl.enableVertexAttribArray(a_texCoord);
      gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

      const videoTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, videoTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      video.glTexture = videoTexture;

      const u_video = gl.getUniformLocation(program, "u_video");
      gl.uniform1i(u_video, 0);

      const blurFactor = this.parseBlurString(
        videoElement.filter.list[0].value,
      );
      const u_power = gl.getUniformLocation(program, "u_power");
      gl.uniform1f(u_power, blurFactor.f);

      const u_mouse = gl.getUniformLocation(program, "u_mouse");
      gl.uniform2fv(u_mouse, [0.5, 0.5]);
    }

    const gl = video.gl;
    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video.object,
      );
    } catch (e) {
      console.error("텍스처 업데이트 오류:", e);
    }
    gl.viewport(0, 0, video.glCanvas.width, video.glCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return video.glCanvas;
  }

  parseBlurString(str) {
    const parts = str.split(":");

    let f = 0;

    parts.forEach((item) => {
      const [key, value] = item.split("=");
      const numValue = parseInt(value, 10);

      switch (key) {
        case "f":
          f = numValue;
          break;
        default:
          break;
      }
    });

    return { f };
  }

  zeroIfNegative(num) {
    if (num > 0) {
      return num;
    } else {
      return 0;
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

  drawTextStroke(ctx, elementId, text, x, y, fontSize) {
    if (this.timeline[elementId].options.outline.enable) {
      ctx.font = `${
        this.timeline[elementId].options.isItalic ? "italic" : ""
      } ${
        this.timeline[elementId].options.isBold ? "bold" : ""
      } ${fontSize}px ${this.timeline[elementId].fontname}`;

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
