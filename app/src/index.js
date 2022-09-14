import element from './js/element.js';
import canvas from './js/canvas.js';
import asset from './js/asset.js';



import { AssetList, AssetFile, AssetFolder } from './components/asset/assetList.js';
import { AssetBrowser } from './components/asset/assetBrowser.js';


customElements.define('asset-list', AssetList);
customElements.define('asset-file', AssetFile);
customElements.define('asset-folder', AssetFolder);

customElements.define('asset-browser', AssetBrowser);


export { element, canvas, asset }
