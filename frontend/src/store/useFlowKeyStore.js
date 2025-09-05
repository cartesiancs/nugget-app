import { create } from "zustand";

/**
 * Zustand store for centralized memory operations in FlowWidget
 * Replaces scattered localStorage calls throughout the application
 */
export const useFlowKeyStore = create((set, get) => ({
  // In-memory storage
  memory: {},
  
  getItem: (key, defaultValue = null) => {
    try {
      return get().memory[key] !== undefined ? get().memory[key] : defaultValue;
    } catch (error) {
      console.error(`Error getting memory item ${key}:`, error);
      return defaultValue;
    }
  },

  setItem: (key, value) => {
    try {
      set((state) => ({
        memory: {
          ...state.memory,
          [key]: value
        }
      }));
      return true;
    } catch (error) {
      console.error(`Error setting memory item ${key}:`, error);
      return false;
    }
  },

  removeItem: (key) => {
    try {
      set((state) => {
        const newMemory = { ...state.memory };
        delete newMemory[key];
        return { memory: newMemory };
      });
      return true;
    } catch (error) {
      console.error(`Error removing memory item ${key}:`, error);
      return false;
    }
  },

  // Generation state operations
  getGenerationStateKey: (projectId, type) =>
    `generation-states-${projectId}-${type}`,

  saveGenerationState: (projectId, type, nodeId, data) => {
    const key = get().getGenerationStateKey(projectId, type);
    const existingStates = get().getItem(key, {});
    existingStates[nodeId] = {
      ...data,
      timestamp: Date.now(),
      status: data.status || "generating",
    };
    return get().setItem(key, existingStates);
  },

  removeGenerationState: (projectId, type, nodeId) => {
    const key = get().getGenerationStateKey(projectId, type);
    const existingStates = get().getItem(key, {});
    delete existingStates[nodeId];
    return get().setItem(key, existingStates);
  },

  getGenerationStates: (projectId, type) => {
    const key = get().getGenerationStateKey(projectId, type);
    const states = get().getItem(key, {});
    const now = Date.now();
    const cleanedStates = {};

    Object.entries(states).forEach(([nodeId, data]) => {
      const isGenerating = data.status === "generating";
      const maxAge = isGenerating ? 3600000 : 600000; // 1 hour for generating, 10 minutes for others
      if (now - data.timestamp < maxAge) {
        cleanedStates[nodeId] = data;
      }
    });

    get().setItem(key, cleanedStates);
    return cleanedStates;
  },

  // User node data operations
  getUserNodeDataKey: (projectId) => `userNodeData-${projectId}`,

  getUserNodeData: (projectId) => {
    const key = get().getUserNodeDataKey(projectId);
    return get().getItem(key, {});
  },

  setUserNodeData: (projectId, nodeId, data) => {
    const key = get().getUserNodeDataKey(projectId);
    const existingData = get().getUserNodeData(projectId);
    existingData[nodeId] = {
      projectId,
      ...data,
    };
    return get().setItem(key, existingData);
  },

  updateUserNodeData: (projectId, nodeId, updates) => {
    const key = get().getUserNodeDataKey(projectId);
    const existingData = get().getUserNodeData(projectId);
    if (existingData[nodeId]) {
      existingData[nodeId] = { ...existingData[nodeId], ...updates };
      return get().setItem(key, existingData);
    }
    return false;
  },

  markUserNodeAsProcessed: (projectId, message) => {
    const key = get().getUserNodeDataKey(projectId);
    const existingData = get().getUserNodeData(projectId);
    let updated = false;

    Object.keys(existingData).forEach((key) => {
      if (existingData[key].text === message) {
        existingData[key].processed = true;
        existingData[key].processedAt = Date.now();
        updated = true;
      }
    });

    if (updated) {
      return get().setItem(key, existingData);
    }
    return false;
  },

  // User concepts operations
  getUserConceptsKey: (projectId) => `user-concepts-${projectId || "default"}`,

  getUserConcepts: (projectId) => {
    const key = get().getUserConceptsKey(projectId);
    const concepts = get().getItem(key, {});
    return new Map(Object.entries(concepts));
  },

  setUserConcepts: (projectId, concepts) => {
    const key = get().getUserConceptsKey(projectId);
    const conceptsObj =
      concepts instanceof Map ? Object.fromEntries(concepts) : concepts;
    return get().setItem(key, conceptsObj);
  },

  // Generated videos operations
  getGeneratedVideosKey: (projectId) => `generated-videos-${projectId}`,

  getGeneratedVideos: (projectId) => {
    const key = get().getGeneratedVideosKey(projectId);
    return get().getItem(key, {});
  },

  setGeneratedVideos: (projectId, videos) => {
    const key = get().getGeneratedVideosKey(projectId);
    return get().setItem(key, videos);
  },

  addGeneratedVideo: (projectId, videoKey, videoData) => {
    const key = get().getGeneratedVideosKey(projectId);
    const existingVideos = get().getGeneratedVideos(projectId);
    existingVideos[videoKey] = {
      ...videoData,
      timestamp: Date.now(),
    };
    return get().setItem(key, existingVideos);
  },

  // Temporary data operations
  getTempDataKey: (projectId, type, nodeId) =>
    `temp-${type}-${projectId}-${nodeId}`,

  getTempData: (projectId, type, nodeId) => {
    const key = get().getTempDataKey(projectId, type, nodeId);
    return get().getItem(key, null);
  },

  setTempData: (projectId, type, nodeId, data) => {
    const key = get().getTempDataKey(projectId, type, nodeId);
    return get().setItem(key, {
      ...data,
      timestamp: Date.now(),
    });
  },

  removeTempData: (projectId, type, nodeId) => {
    const key = get().getTempDataKey(projectId, type, nodeId);
    return get().removeItem(key);
  },

  // Cleanup operations
  cleanupOldData: (projectId) => {
    try {
      const now = Date.now();
      const maxAge = 3600000; // 1 hour
      const maxVideos = 20;

      // Clean up old temporary data
      const memory = get().memory;
      Object.keys(memory).forEach(key => {
        try {
          // Clean up temp data
          if (key.startsWith(`temp-`) && key.includes(projectId)) {
            const data = memory[key];
            if (data && data.timestamp && now - data.timestamp > maxAge) {
              get().removeItem(key);
            }
          }

          // Clean up old videos (keep only recent ones)
          if (key.startsWith(`generated-videos-${projectId}`)) {
            const videos = memory[key] || {};
            const videoEntries = Object.entries(videos);
            if (videoEntries.length > maxVideos) {
              const sortedVideos = videoEntries.sort(
                (a, b) => b[1].timestamp - a[1].timestamp,
              );
              const videosToKeep = sortedVideos.slice(0, maxVideos);
              get().setItem(key, Object.fromEntries(videosToKeep));
            }
          }
        } catch (error) {
          console.error(`Error cleaning up memory key ${key}:`, error);
        }
      });

      // Clean up generation states
      ["concept", "script", "image", "video"].forEach((type) => {
        get().getGenerationStates(projectId, type);
      });

      return true;
    } catch (error) {
      console.error("Error during cleanup:", error);
      return false;
    }
  },

  // Clear all project data
  clearProjectData: (projectId) => {
    try {
      const keysToRemove = [
        get().getUserNodeDataKey(projectId),
        get().getUserConceptsKey(projectId),
        get().getGeneratedVideosKey(projectId),
        get().getGenerationStateKey(projectId, "concept"),
        get().getGenerationStateKey(projectId, "script"),
        get().getGenerationStateKey(projectId, "image"),
        get().getGenerationStateKey(projectId, "video"),
      ];

      keysToRemove.forEach((key) => get().removeItem(key));

      // Remove temp data
      const memory = get().memory;
      Object.keys(memory).forEach(key => {
        if (key.includes(projectId) && key.startsWith("temp-")) {
          get().removeItem(key);
        }
      });

      return true;
    } catch (error) {
      console.error("Error clearing project data:", error);
      return false;
    }
  },

  // Utility methods
  hasProjectData: (projectId) => {
    const userNodeData = get().getUserNodeData(projectId);
    const userConcepts = get().getUserConcepts(projectId);
    const generatedVideos = get().getGeneratedVideos(projectId);

    return (
      Object.keys(userNodeData).length > 0 ||
      userConcepts.size > 0 ||
      Object.keys(generatedVideos).length > 0
    );
  },

  getProjectDataSize: (projectId) => {
    let size = 0;
    const keys = [
      get().getUserNodeDataKey(projectId),
      get().getUserConceptsKey(projectId),
      get().getGeneratedVideosKey(projectId),
      get().getGenerationStateKey(projectId, "concept"),
      get().getGenerationStateKey(projectId, "script"),
      get().getGenerationStateKey(projectId, "image"),
      get().getGenerationStateKey(projectId, "video"),
    ];

    keys.forEach((key) => {
      const data = get().getItem(key, null);
      if (data) {
        size += JSON.stringify(data).length;
      }
    });

    return size;
  },

  // Debug methods
  getAllProjectKeys: (projectId) => {
    const memory = get().memory;
    return Object.keys(memory).filter(key => key.includes(projectId));
  },

  migrateOldKeys: (projectId) => {
    console.log(
      "Migration helper - no migration needed for current implementation",
    );
    return true;
  },
}));

export default useFlowKeyStore;
