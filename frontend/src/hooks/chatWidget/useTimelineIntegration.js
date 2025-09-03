import { useState } from "react";

export const useTimelineIntegration = () => {
  // Timeline states
  const [addingTimeline, setAddingTimeline] = useState(false);
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [messageCounter, setMessageCounter] = useState(0);
  const [allUserMessages, setAllUserMessages] = useState([]);
  const [storedVideosMap, setStoredVideosMap] = useState(() => {
    try {
      const stored = localStorage.getItem("project-store-selectedProject");
      if (stored) {
        const _project = JSON.parse(stored);
        return JSON.parse(localStorage.getItem(`project-store-videos`) || "{}");
      }
      return JSON.parse(localStorage.getItem("segmentVideos") || "{}");
    } catch (e) {
      console.error(e);
      return {};
    }
  });

  // Reset timeline states
  const resetTimelineStates = () => {
    setAddingTimeline(false);
    setCurrentUserMessage("");
    setMessageCounter(0);
    setAllUserMessages([]);
  };

  // Update stored videos map and persist to localStorage
  const updateStoredVideosMap = (videosMap, selectedProject) => {
    setStoredVideosMap((prev) => {
      const updatedMap = { ...prev, ...videosMap };

      // Save to localStorage for persistence
      if (selectedProject) {
        localStorage.setItem(
          `project-store-videos`,
          JSON.stringify(updatedMap),
        );
      } else {
        localStorage.setItem("segmentVideos", JSON.stringify(updatedMap));
      }
      return updatedMap;
    });
  };

  return {
    // States
    addingTimeline,
    currentUserMessage,
    messageCounter,
    allUserMessages,
    storedVideosMap,

    // Setters
    setAddingTimeline,
    setCurrentUserMessage,
    setMessageCounter,
    setAllUserMessages,
    setStoredVideosMap,

    // Actions
    resetTimelineStates,
    updateStoredVideosMap,
  };
};
