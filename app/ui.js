const elementControlComponent = document.querySelector("element-control");
let preview = document.getElementById("preview");
let control = document.getElementById("control-inner");
let video = document.getElementById("video");
let exportVideoModal = new bootstrap.Modal(
  document.getElementById("exportVideoModal"),
  {
    keyboard: false,
  }
);

let valueEvent = {
  splitBottom: false,
  splitColumns: false,
  splitColumnsTarget: 1,
  moveElement: false,
  mouse: {
    x: 0,
    y: 0,
  },
  elementBar: {
    isDrag: false,
    isResize: false,
    resizeLocation: "left",
    resizeRangeLeft: 0,
    resizeRangeRight: 0,
    e: undefined,
    blob: "",
    criteria: { x: 0, y: 0, duration: 1000 },
    criteriaResize: { x: 0, y: 0 },
  },
  element: {
    isDrag: false,
    e: undefined,
    initial: { x: 0, y: 0 },
  },
};

const page = {
  split: {
    bottom: function (percent) {
      document.getElementById(
        "split_top"
      ).style.height = `calc(${percent}% + 0.5rem)`;
      document.getElementById("split_bottom").style.height = `calc(${
        100 - percent
      }% - 0.5rem)`;
      document.getElementById(`option_bottom`).style.height = `calc(${
        100 - percent
      }% - 3.5rem)`; // 옵션 오프캔버스
    },
    columns: function (percent) {
      if (valueEvent.splitColumnsTarget == 1) {
        let otherCol = Number(
          document.getElementById(`split_col_3`).style.width.split("%")[0]
        );
        document.getElementById(`split_col_1`).style.width = `${percent}%`;
        document.getElementById(`split_col_2`).style.width = `${
          100 - percent - otherCol
        }%`;
      } else if (valueEvent.splitColumnsTarget == 2) {
        let otherCol = Number(
          document.getElementById(`split_col_1`).style.width.split("%")[0]
        );
        document.getElementById(`split_col_2`).style.width = `${
          percent - otherCol
        }%`;
        document.getElementById(`split_col_3`).style.width = `${
          100 - percent
        }%`;
      }
    },
  },
  minWidth: 20,
  minHeight: 20,
};

let toastElList = [].slice.call(document.querySelectorAll(".toast"));
let toastList = toastElList.map(function (toastEl) {
  return new bootstrap.Toast(toastEl);
});

HTMLCanvasElement.prototype.render = function () {
  nugget.canvas.preview.render(this);
};

HTMLCanvasElement.prototype.clear = function () {
  nugget.canvas.preview.clear(this);
};

window.onresize = async function (event) {
  await elementControlComponent.resizeEvent();
};

window.addEventListener("load", (event) => {
  auth.checkLogin();
  window.electronAPI.req.app.getAppInfo().then((result) => {
    document.querySelector(
      "p[ref='appVersion']"
    ).innerHTML = `Nugget v${result.data.version}`;
  });
});

document.addEventListener("mousemove", (e) => {
  valueEvent.mouse.x = e.pageX;
  valueEvent.mouse.y = e.pageY;

  if (valueEvent.splitBottom) {
    let videoboxHeightPer = (videobox.offsetHeight / window.innerHeight) * 100;
    let per =
      (e.pageY / document.body.offsetHeight) * 100 <= page.minHeight
        ? page.minHeight
        : (e.pageY / document.body.offsetHeight) * 100;
    page.split.bottom(per);
    elementControlComponent.resizeEvent();
  }

  if (valueEvent.splitColumns) {
    let per =
      (e.pageX / document.body.offsetWidth) * 100 <= page.minWidth
        ? page.minWidth
        : (e.pageX / document.body.offsetWidth) * 100;
    page.split.columns(per);
    elementControlComponent.resizeEvent();
  }
});

document.addEventListener("mouseup", (e) => {
  valueEvent.splitBottom = false;
  valueEvent.splitColumns = false;
});

// document.getElementById("split_inner_bottom").addEventListener("mousedown", (e) => {
//     e.stopPropagation();
// })

function startSplitColumns(colNumber) {
  valueEvent.splitColumns = true;
  valueEvent.splitColumnsTarget = colNumber;
}

function startSplitBottom() {
  valueEvent.splitBottom = true;
}
