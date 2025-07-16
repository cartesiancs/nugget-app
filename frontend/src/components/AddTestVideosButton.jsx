import React from "react";

// Hard-coded sample clips for quick testing
const HARDCODED_VIDEOS = [
  { id: 1, url: "https://www.sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4" },
  // { id: 2, url: "https://ds0fghatf06yb.cloudfront.net/seg-2/videos/7b97b594-cffe-4dfa-8e50-f5a4a4d1ea2b.mp4" },
  // { id: 3, url: "https://ds0fghatf06yb.cloudfront.net/seg-3/videos/cdda1171-c218-4b39-9a1e-215f66a43737.mp4" },
  // { id: 4, url: "https://ds0fghatf06yb.cloudfront.net/seg-4/videos/28429fb0-9bb2-434f-95a9-e87569bc64b4.mp4" },
  // { id: 5, url: "https://ds0fghatf06yb.cloudfront.net/seg-5/videos/1b6fcbfd-85a0-4f22-af45-a6c0c670874f.mp4" },
];

/**
 * Button that pushes the hard-coded sample videos into the timeline via the
 * `window.api.ext.timeline.addByUrl` bridge (or IPC fallback in dev).
 *
 * Props:
 *  - addChatMessage?: (msgObj) => void  // optional, for ChatWidget feedback
 */
function AddTestVideosButton({ addChatMessage }) {
  const handleClick = async () => {
    let success = false;

    try {
      const addByUrlWithDir = window?.api?.ext?.timeline?.addByUrlWithDir;
      const addByUrlFn = window?.api?.ext?.timeline?.addByUrl;
      if (addByUrlWithDir) {
        await addByUrlWithDir(HARDCODED_VIDEOS);
        success = true;
      } else if (addByUrlFn) {
        await addByUrlFn(HARDCODED_VIDEOS);
        success = true;
      } else if (window.require) {
        // Fallback
        const { ipcRenderer } = window.require("electron");
        await ipcRenderer.invoke("extension:timeline:addByUrlWithDir", HARDCODED_VIDEOS);
        success = true;
      }
    } catch (err) {
      console.error("timeline add failed", err);
    }

    if (typeof addChatMessage === "function") {
      addChatMessage({
        type: "assistant",
        content: success
          ? "✅ Hard-coded videos added to timeline!"
          : "❌ Failed to add hard-coded videos to timeline",
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-md font-medium"
    >
      🧪 Add Test Videos
    </button>
  );
}

export default AddTestVideosButton; 