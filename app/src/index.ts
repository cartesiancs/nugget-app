import asset from "./functions/asset";
import directory from "./functions/directory";
import mime from "./functions/mime";
import project from "./functions/project";
import renderAnimation from "./functions/renderAnimation";
import fonts from "./functions/fonts";

import "./App";

import "./components/asset/assetList";
import "./components/asset/assetBrowser";
import "./components/asset/assetUploader";

import "./components/element/elementTimeline";
import "./components/element/elementTimelineCanvas";

import "./components/element/elementTimelineRuler";
import "./components/element/elementTimelineCursor";
import "./components/element/elementControlAsset";

import "./components/keyframe/keyframeEditor";
import "./components/menu/menuDropdown";

import "./components/animation/animationPanel";

import "./components/option/optionGroup";
import "./components/option/optionText";
import "./components/option/optionImage";
import "./components/option/optionVideo";
import "./components/option/optionAudio";

import "./components/input/inputText";

import { Tutorial } from "./components/tutorial/tutorial";
import { TutorialPopover } from "./components/tutorial/tutorialPopover";

import { Toast } from "./components/toast/toast";
import { ToastBox } from "./components/toast/toastBox";
import "./context/timelineContext";

import "./sass/style.scss";

import "./ui/timeline/Timeline";
import "./ui/control/Control";
import "./ui/modal/Modal";

import "./components/element/elementControl";
import "./components/preview/previewCanvas";
import "./components/font/selectFont";

customElements.define("tutorial-group", Tutorial);
customElements.define("tutorial-popover", TutorialPopover);

customElements.define("toast-item", Toast);
customElements.define("toast-box", ToastBox);

export { asset, directory, mime, project, fonts };
export { renderAnimation };
