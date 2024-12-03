import { rendererModal } from "./utils/modal";

// window.electronAPI.res.auth.loginSuccess((evt, data) => {
//   console.log("AUTHDATA", data);
//   let token = data.split("/")[2];

//   //NOTE: URL 변경필요
//   fetch(`${NUGGET_WEBSITE}/api/auth/me`, {
//     headers: {
//       Accept: "application/json",
//       "x-access-token": token,
//     },
//   })
//     .then((response) => response.json())
//     .then((res) => {
//       console.log(res);
//       if (res.status == 0) {
//         return 0;
//       }

//       window.electronAPI.req.store.set("token", token).then((result) => {
//         if (result.status == 0) {
//           return 0;
//         }

//         console.log("login!");
//       });
//     });
// });

window.electronAPI.res.render.progressing((evt, prog) => {
  rendererModal.progressModal.show();
  document.querySelector("#progress").style.width = `${prog}%`;
  document.querySelector("#progress").innerHTML = `${Math.round(prog)}%`;
});

window.electronAPI.res.render.finish((evt) => {
  rendererModal.progressModal.hide();
  rendererModal.progressFinish.show();

  document.querySelector("#progress").style.width = `100%`;
  document.querySelector("#progress").innerHTML = `100%`;

  const projectFolder = document.querySelector("#projectFolder").value;

  window.electronAPI.req.filesystem.emptyDirSync(
    `${projectFolder}/renderAnimation`
  );
  window.electronAPI.req.filesystem.removeDirectory(
    `${projectFolder}/renderAnimation`
  );
});

window.electronAPI.res.render.error((evt, errormsg) => {
  rendererModal.progressModal.hide();
  rendererModal.progressError.show();

  document.querySelector("#progressErrorMsg").innerHTML = `${errormsg}`;
});

window.electronAPI.res.app.forceClose((evt) => {
  let isTimelineChange = document
    .querySelector("element-timeline")
    .isTimelineChange();
  if (isTimelineChange == true) {
    rendererModal.whenClose.show();
  } else {
    window.electronAPI.req.app.forceClose();
  }
});

window.electronAPI.res.shortcut.controlS((evt) => {
  NUGGET.project.save();
});

window.electronAPI.res.shortcut.controlO((evt) => {
  NUGGET.project.load();
});

window.electronAPI.res.timeline.get((event) => {
  let timeline = _.cloneDeep(
    document.querySelector("element-timeline").timeline
  );

  event.sender.send("return:timeline:get", timeline);
});

window.electronAPI.res.timeline.add(async (event, timeline) => {
  for (const timelineId in timeline) {
    if (Object.hasOwnProperty.call(timeline, timelineId)) {
      const element = timeline[timelineId];
      const elementTimeline = document.querySelector("element-timeline");

      Object.assign(elementTimeline.timeline, timeline);
      await elementTimeline.patchElementInTimeline({
        elementId: timelineId,
        element: element,
      });
    }
  }
});

window.addEventListener("load", (event) => {
  window.electronAPI.req.app.getAppInfo().then((result) => {
    document.querySelector(
      "p[ref='appVersion']"
    ).innerHTML = `Nugget v${result.data.version}`;
  });

  let toastElList = [].slice.call(document.querySelectorAll(".toast"));
  let toastList = toastElList.map(function (toastEl) {
    return new bootstrap.Toast(toastEl);
  });
});

window.onresize = async function (event) {
  const elementControlComponent = document.querySelector("element-control");

  await elementControlComponent.resizeEvent();
};

// HTMLCanvasElement.prototype.render = function () {
//     nugget.canvas.preview.render(this);
//   };

//   HTMLCanvasElement.prototype.clear = function () {
//     nugget.canvas.preview.clear(this);
//   };