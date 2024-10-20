import asset from "./functions/asset";
import directory from "./functions/directory";
import mime from "./functions/mime";
import project from "./functions/project";
import renderAnimation from "./functions/renderAnimation";
import fonts from "./functions/fonts";

import "./App";

import {
  AssetList,
  AssetFile,
  AssetFolder,
} from "./components/asset/assetList";
import { AssetBrowser } from "./components/asset/assetBrowser";
import { AssetDropUploader } from "./components/asset/assetUploader";

import {
  ElementTimeline,
  ElementTimelineCursor,
  ElementTimelineRuler,
  ElementTimelineRange,
  ElementTimelineEnd,
  ElementTimelineScroll,
} from "./components/element/elementTimeline";
import { ElementBar } from "./components/element/elementBar";
import {
  ElementControl,
  DragAlignmentGuide,
} from "./components/element/elementControl";
import { ElementControlAsset } from "./components/element/elementControlAsset";

import { KeyframeEditor } from "./components/keyframe/keyframeEditor";
import {
  MenuDropdownBody,
  MenuDropdownItem,
} from "./components/menu/menuDropdown";

import {
  AnimationPanel,
  AnimationPanelItem,
} from "./components/animation/animationPanel";

import { OptionGroup } from "./components/option/optionGroup";
import { OptionText } from "./components/option/optionText";
import { OptionImage } from "./components/option/optionImage";
import { OptionVideo } from "./components/option/optionVideo";
import { OptionAudio } from "./components/option/optionAudio";

import { InputText } from "./components/input/inputText";

import { SelectFont } from "./components/font/selectFont";

import { Tutorial } from "./components/tutorial/tutorial";
import { TutorialPopover } from "./components/tutorial/tutorialPopover";

import { Toast } from "./components/toast/toast";
import { ToastBox } from "./components/toast/toastBox";

import "./sass/style.scss";

import { Timeline } from "./ui/Timeline";
import { Control } from "./ui/Control";
import { ModalList } from "./ui/Modal";

customElements.define("timeline-ui", Timeline);
customElements.define("control-ui", Control);
customElements.define("modal-list-ui", ModalList);

// customElements.define("app-root", App);

customElements.define("asset-list", AssetList);
customElements.define("asset-file", AssetFile);
customElements.define("asset-folder", AssetFolder);
customElements.define("asset-browser", AssetBrowser);
customElements.define("asset-upload-drop", AssetDropUploader);

customElements.define("element-timeline", ElementTimeline);
customElements.define("element-timeline-cursor", ElementTimelineCursor);
customElements.define("element-timeline-ruler", ElementTimelineRuler);
customElements.define("element-timeline-range", ElementTimelineRange);
customElements.define("element-timeline-end", ElementTimelineEnd);
customElements.define("element-timeline-scroll", ElementTimelineScroll);

customElements.define("element-bar", ElementBar);
customElements.define("element-control", ElementControl);
customElements.define("element-control-asset", ElementControlAsset);
customElements.define("drag-alignment-guide", DragAlignmentGuide);

customElements.define("keyframe-editor", KeyframeEditor);

customElements.define("menu-dropdown-body", MenuDropdownBody);
customElements.define("menu-dropdown-item", MenuDropdownItem);

customElements.define("animation-panel", AnimationPanel);
customElements.define("animation-panel-item", AnimationPanelItem);

customElements.define("option-group", OptionGroup);
customElements.define("option-text", OptionText);
customElements.define("option-image", OptionImage);
customElements.define("option-video", OptionVideo);
customElements.define("option-audio", OptionAudio);

customElements.define("input-text", InputText);
customElements.define("select-font", SelectFont);

customElements.define("tutorial-group", Tutorial);
customElements.define("tutorial-popover", TutorialPopover);

customElements.define("toast-item", Toast);
customElements.define("toast-box", ToastBox);

export { asset, directory, mime, project, fonts };
export { renderAnimation };
