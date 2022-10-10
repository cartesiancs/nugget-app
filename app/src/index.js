import element from './functions/element.js';
import canvas from './functions/canvas.js';
import asset from './functions/asset.js';
import directory from './functions/directory.js';
import mime from './functions/mime.js';
import project from './functions/project.js';



import { AssetList, AssetFile, AssetFolder } from './components/asset/assetList.js';
import { AssetBrowser } from './components/asset/assetBrowser.js';
import { ElementTimeline, ElementTimelineBar, ElementTimelineEditor } from './components/element/elementTimeline.js';
import { ElementBar } from './components/element/elementBar.js';
import { ElementControl, ElementControlAsset } from './components/element/elementControl.js';

import "./sass/style.scss";


customElements.define('asset-list', AssetList);
customElements.define('asset-file', AssetFile);
customElements.define('asset-folder', AssetFolder);
customElements.define('asset-browser', AssetBrowser);


customElements.define('element-timeline', ElementTimeline);
customElements.define('element-timeline-bar', ElementTimelineBar);
customElements.define('element-timeline-editor', ElementTimelineEditor);

customElements.define('element-bar', ElementBar);
customElements.define('element-control', ElementControl);
customElements.define('element-control-asset', ElementControlAsset);



export { element, canvas, asset, directory, mime, project }
