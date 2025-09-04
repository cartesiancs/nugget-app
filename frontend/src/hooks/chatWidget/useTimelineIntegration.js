import { useState } from "react";
import { useProjectStore } from "../../store/useProjectStore";

export const useTimelineIntegration = () => {
  // Get storedVideosMap from Zustand store
  const { storedVideosMap, setStoredVideosMap } = useProjectStore();
  
  // Timeline states
  const [addingTimeline, setAddingTimeline] = useState(false);
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [messageCounter, setMessageCounter] = useState(0);
  const [allUserMessages, setAllUserMessages] = useState([]);

  // Reset timeline states
  const resetTimelineStates = () => {
    setAddingTimeline(false);
    setCurrentUserMessage("");
    setMessageCounter(0);
    setAllUserMessages([]);
  };

  const updateStoredVideosMap = (videosMap, selectedProject) => {
    const updatedMap = { ...storedVideosMap, ...videosMap };
    setStoredVideosMap(updatedMap);
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
