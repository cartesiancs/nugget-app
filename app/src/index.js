import element from './js/element.js';
import canvas from './js/canvas.js';
import asset from './js/asset.js';
import directory from './js/directory.js';
import mime from './js/mime.js';



import { AssetList, AssetFile, AssetFolder } from './components/asset/assetList.js';
import { AssetBrowser } from './components/asset/assetBrowser.js';
import { ElementTimeline } from './components/element/elementTimeline.js';
import { ElementBar } from './components/element/elementBar.js';
import { ElementControl, ElementControlAsset } from './components/element/elementControl.js';


customElements.define('asset-list', AssetList);
customElements.define('asset-file', AssetFile);
customElements.define('asset-folder', AssetFolder);

customElements.define('asset-browser', AssetBrowser);


customElements.define('element-timeline', ElementTimeline);
customElements.define('element-bar', ElementBar);
customElements.define('element-control', ElementControl);
customElements.define('element-control-asset', ElementControlAsset);



export { element, canvas, asset, directory, mime }
