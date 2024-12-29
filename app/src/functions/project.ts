import JSZip from "jszip";
import { useTimelineStore } from "../states/timelineStore";
import { rendererModal } from "../utils/modal";
import { uiStore } from "../states/uiStore";

const arrayBufferToBase64 = (buffer) => {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const timelineStore = useTimelineStore.getState();
const uiState = uiStore.getState();

const project = {
  save: function () {
    const projectFile = document.querySelector("#projectFile").value;

    if (projectFile != "") {
      project.saveProjectFile({ projectDestination: projectFile });
      return 0;
    } else {
      window.electronAPI.req.project.save().then((result) => {
        let projectDestination = result || `nonefile`;
        if (projectDestination == `nonefile`) {
          return 0;
        }

        project.saveProjectFile({ projectDestination: projectDestination });
      });
    }
  },

  load: function () {
    const elementTimeline = document.querySelector("element-timeline");
    const isTimelineChange = elementTimeline.isTimelineChange();
    if (isTimelineChange == true) {
      rendererModal.whenTimelineChanged.show();
      document.querySelector(
        "#whenTimelineChangedMsg",
      ).innerHTML = `새 프로젝트 파일을 볼러오려면 에디터를 닫고 재실행해 주세요.`;
      return 0;
    }

    window.electronAPI.req.dialog.openFile([".ngt"]).then((path) => {
      console.log("saved!", path);

      timelineStore.clearTimeline();

      let filepath = path;

      window.electronAPI.req.filesystem.readFile(filepath).then((data) => {
        JSZip.loadAsync(data).then(function (zip: any) {
          zip
            .file("timeline.json")
            .async("string")
            .then(async (result) => {
              let timeline = JSON.parse(result);

              timelineStore.patchTimeline(timeline);

              project.changeProjectFileValue({ projectDestination: filepath });
            });
        });
      });
    });

    const upload = document.createElement("input");
    upload.setAttribute("type", "file");
    upload.setAttribute("accept", ".ngt");
  },

  saveProjectFile: function ({ projectDestination }) {
    const elementTimeline = document.querySelector("element-timeline");
    const timeline = document.querySelector("element-timeline").timeline;
    const projectDuration = Number(
      document.querySelector("#projectDuration").value,
    );
    const projectRatio = document.querySelector("element-control").previewRatio;

    const zip = new JSZip();

    const options = {
      videoDuration: projectDuration,
      previewRatio: projectRatio,
      videoDestination: projectDestination,
    };

    zip.file("timeline.json", JSON.stringify(timeline));
    zip.file("renderOptions.json", JSON.stringify(options));

    zip.generateAsync({ type: "blob" }).then(async function (content) {
      const buffer = arrayBufferToBase64(await content.arrayBuffer());

      window.electronAPI.req.filesystem
        .writeFile(projectDestination, buffer, "base64")
        .then((isCompleted) => {
          console.log("saved!");
          document
            .querySelector("toast-box")
            .showToast({ message: "프로젝트 저장 완료", delay: "2000" });

          elementTimeline.appendCheckpointInHashTable();
          project.changeProjectFileValue({
            projectDestination: projectDestination,
          });
          //fs.writeFile( projectDestination , buffer, () => {
        });
      //saveAs(content, `${projectFolder}/aaa.zip`);
    });
  },

  changeProjectFileValue: function ({ projectDestination }) {
    document.querySelector("#projectFile").value = projectDestination;
    uiState.setTopBarTitle(`Nugget - ${projectDestination}`);
  },
};

export default project;
