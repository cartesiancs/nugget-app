
import { AssetController } from "../src/controllers/asset";

export function addElement(data) {
    const elementControlComponent = document.querySelector("element-control") as any;
    if (!elementControlComponent) {
        console.error("Element control component not found. Make sure the component is loaded first.");
        return false;
    }
    try {
        const AssetList = document.querySelector("asset-list")
        const current_directory = AssetList.current_directory
        const assetController = new AssetController();
        const filePath = current_directory + "/" + data.file_url;
        assetController.add(filePath);
    }
    catch {
        return false
    }
    return true;
}


export function addImageSlide(filepath) {
    const elementControlComponent = document.querySelector("element-control") as any;
    if (!elementControlComponent) {
        console.error("Element control component not found. Make sure the component is loaded first.");
        return false;
    }
    try {
        const assetController = new AssetController();
        assetController.add(filepath);
    }
    catch {
        return false
    }
    return true;
}