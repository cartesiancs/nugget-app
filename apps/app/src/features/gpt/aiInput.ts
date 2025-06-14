import { LitElement, PropertyValues, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { IUIStore, uiStore } from "../../states/uiStore";
import { chatLLMStore, IChatLLMPanelStore } from "../../states/chatLLM";
import { ToastController } from "../../controllers/toast";
import { actionParsor, parseCommands } from "./resultParser";
import { getLocationEnv } from "../../functions/getLocationEnv";
import {
  addTextElement,
  addShapeElement,
  renderNewImage,
} from "../../../reponseHandlers";

@customElement("ai-input")
export class AiInput extends LitElement {
  isEnter: boolean;
  constructor() {
    super();
    this.isEnter = false;
  }

  toast = new ToastController(this);

  @property()
  uiState: IUIStore = uiStore.getInitialState();
  chatLLMState: IChatLLMPanelStore = chatLLMStore.getInitialState();
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  createRenderRoot() {
    // const parser = parseCommands(
    //   `ADD VIDEO "/folder/day.mp4" x=0:y=0:w=1920:h=1080:t=0:d=30 ADD TEXT "Daily Vlog" x=50:y=50:w=300:t=1:d=3 ADD TEXT "이건텍스트임" x=0:y=0:w=200:t=5:d=2 ADD TEXT "이건텍스트임" x=0:y=0:w=200:t=8:d=2`,
    // );

    // console.log(parser);

    // actionParsor(parser);
    if (getLocationEnv() != "electron") {
      this.classList.add("d-none");
    }

    return this;
  }

  handleEnter(event) {
    if (event.key === "Enter" && !this.isEnter) {
      this.isEnter = true;
      event.preventDefault();
      const command = event.target.value.toLowerCase();
      if (command == "") {
        this.toast.show("Please enter a command", 2000);
        this.isEnter = false;
        return;
      } else {
        const timelineLatest = useTimelineStore.getState();
        const canvasLatestObject = document.querySelector("preview-canvas");
        const elementTimelineCanvasObject = document.querySelector(
          "element-timeline-canvas",
        );

        const context = {
          timeline: {
            cursor: timelineLatest.cursor / 1000,
            selected: elementTimelineCanvasObject.targetIdHistorical,
            selectedData: timelineLatest.timeline[elementTimelineCanvasObject.targetIdHistorical]
          },
          preview: {
            selected: canvasLatestObject.activeElementId,
            selectedData: timelineLatest.timeline[canvasLatestObject.activeElementId],
          },
        };

        try {
          if (window.electronAPI?.req?.quartz?.LLMResponse) {
            window.electronAPI.req.quartz
              .LLMResponse(command, context)
              .then((response) => {
                console.log(response);
                if (response.type == "text") {
                  addTextElement(response.data);
                  console.log("Received response from LLM.");
                } else if (response.type == "shape") {
                  addShapeElement(response.data);
                } else if (response.type == "video") {
                  console.log("Video response from LLM.");
                } else if (response.type == "sr") {
                  console.log(response.data);
                  renderNewImage(response.data);
                } else {
                  console.log("TODO Else");
                }
              })
              .catch((error) => {
                console.error("Error getting the response:", error);
                this.toast.show("Error getting the response", 2000);
              });
          } else {
            console.error("IPC method 'quartz.LLMResponse' is not available");
            this.toast.show("LLMResponse functionality not available", 2000);
          }
          // Clear the input field after sending the command
          if (event.target) {
            (event.target as HTMLInputElement).value = "";
          }
        } catch (error) {
          console.error("Error processing the command:", error);
          this.toast.show("Error processing the command", 2000);
        }
      }

      setTimeout(() => {
        this.isEnter = false;
      }, 100);
    }
  }

  executeFunction(value) {
    console.log("Entered value:", value);
    const lists = this.mapTimeline();
    console.log("Timeline lists:", lists);

    console.log(`${lists.join(" ")} \n ${value}`);

    const directory = document.querySelector("asset-list").nowDirectory;
    if (directory == "") {
      this.toast.show("Please specify a directory", 2000);
      return 0;
    }

    window.electronAPI.req.filesystem.getDirectory(directory).then((result) => {
      let fileLists = {};
      let resultList: any = [];
      console.log(directory, result);

      for (const key in result) {
        if (Object.hasOwnProperty.call(result, key)) {
          const element = result[key];
          if (!element.isDirectory) {
            fileLists[key] = element;
          }
        }
      }

      for (const file in fileLists) {
        if (Object.hasOwnProperty.call(fileLists, file)) {
          const element = fileLists[file];
          const path = directory + "/" + element.title;
          console.log(path);
          resultList.push(`EXIST "${path}"`);
        }
      }
    });
  }

  mapTimeline(): string[] {
    const list: any = [];
    const timeline = useTimelineStore.getState();
    for (const key in timeline.timeline) {
      if (Object.prototype.hasOwnProperty.call(timeline.timeline, key)) {
        const element = timeline.timeline[key];
        if (element.filetype == "text") {
          const options = [
            `x=${element.location?.x}`,
            `y=${element.location?.y}`,
            `w=${element.width}`,
            `h=${element.height}`,
            `t=${element.startTime}`,
            `d=${element.duration}`,
          ];
          list.push(`TEXT "${element.text}" ${options.join(":")}`);
        } else if (element.filetype == "image") {
          const options = [
            `x=${element.location?.x}`,
            `y=${element.location?.y}`,
            `w=${element.width}`,
            `h=${element.height}`,
            `t=${element.startTime}`,
            `d=${element.duration}`,
          ];
          list.push(`IMAGE "${key}" ${options.join(":")}`);
        } else if (element.filetype == "video") {
          const options = [
            `x=${element.location?.x}`,
            `y=${element.location?.y}`,
            `w=${element.width}`,
            `h=${element.height}`,
            `t=${element.startTime}`,
            `d=${element.duration}`,
          ];
          list.push(`VIDEO "${key}" ${options.join(":")}`);
        } else if (element.filetype == "audio") {
          const options = [`t=${element.startTime}`, `d=${element.duration}`];
          list.push(`AUDIO "${key}" ${options.join(":")}`);
        }
      }
    }

    return list;
  }

  handleClickInput() {
    this.timelineState.setCursorType("lockKeyboard");
  }

  panelOpen() {
    this.uiState.setChatSidebar(250);
  }

  render() {
    return html`
      <div class="input-group input-group-sm d-flex align-items-center gap-2">
        <input
          type="text"
          class="form-control bg-default text-light bg-darker"
          placeholder="Ask me anything..."
          value=""
          id="chatLLMInput"
          @keydown="${this.handleEnter}"
          @click=${this.handleClickInput}
        />
        <span
          @click=${this.panelOpen}
          class="material-symbols-outlined timeline-bottom-question-icon icon-sm  text-secondary"
          >right_panel_open</span
        >
      </div>
    `;
  }
}
