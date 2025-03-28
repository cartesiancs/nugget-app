import directory from "./functions/directory";
import mime from "./functions/mime";
import project from "./functions/project";
import fonts from "./functions/fonts";
import { enableIpcWrapper } from "./functions/ipcWrapper";

enableIpcWrapper();

import "./App";

import "./features/preview/previewCanvas";

import "./features/asset/assetList";
import "./features/asset/assetBrowser";
import "./features/asset/assetUploader";

import "./features/element/elementTimelineLeftOption";

import "./features/element/elementTimeline";
import "./features/element/elementTimelineCanvas";

import "./features/element/elementTimelineRuler";
import "./features/element/elementTimelineCursor";
import "./features/element/elementControlAsset";
import "./features/element/elementTimelineRange";

import "./features/keyframe/keyframeEditor";
import "./features/menu/menuDropdown";

import "./features/animation/animationPanel";

import "./features/option/optionGroup";
import "./features/option/optionText";
import "./features/option/optionImage";
import "./features/option/optionVideo";
import "./features/option/optionAudio";
import "./features/option/optionShape";

import "./features/input/inputText";

import { Tutorial } from "./features/tutorial/tutorial";
import { TutorialPopover } from "./features/tutorial/tutorialPopover";

import { Toast } from "./features/toast/toast";
import { ToastBox } from "./features/toast/toastBox";
import "./context/timelineContext";

import "./sass/style.scss";

import "./ui/timeline/Timeline";
import "./ui/control/Control";
import "./ui/modal/Modal";
import "./ui/offcanvas/TimelineOptions";
import "./ui/toast/Toast";

import "./features/element/elementControl";
import "./features/font/selectFont";

import "./event";

customElements.define("tutorial-group", Tutorial);
customElements.define("tutorial-popover", TutorialPopover);

customElements.define("toast-item", Toast);
customElements.define("toast-box", ToastBox);

export { directory, mime, project, fonts };
