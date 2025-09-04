import { create } from "zustand";

const storeImpl = (set, get) => ({
  // State
  segmentImages: (() => {
    try {
      const stored = localStorage.getItem("segmentImages");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading segment images from localStorage:', e);
      return {};
    }
  })(),
  segmentVideos: (() => {
    try {
      const stored = localStorage.getItem("segmentVideos");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading segment videos from localStorage:', e);
      return {};
    }
  })(),
  projectImages: (() => {
    try {
      const stored = localStorage.getItem("project-store-images");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading project images from localStorage:', e);
      return {};
    }
  })(),
  projectVideos: (() => {
    try {
      const stored = localStorage.getItem("project-store-videos");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading project videos from localStorage:', e);
      return {};
    }
  })(),

  // Actions
  setSegmentImage: (segmentId, imageUrl, isProject = false) => {
    const key = isProject ? 'projectImages' : 'segmentImages';
    const storageKey = isProject ? 'project-store-images' : 'segmentImages';
    
    set((state) => ({
      [key]: {
        ...state[key],
        [segmentId]: imageUrl
      }
    }));
    
    try {
      const newState = get()[key];
      localStorage.setItem(storageKey, JSON.stringify(newState));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  },

  setSegmentVideo: (segmentId, videoUrl, isProject = false) => {
    const key = isProject ? 'projectVideos' : 'segmentVideos';
    const storageKey = isProject ? 'project-store-videos' : 'segmentVideos';
    
    set((state) => ({
      [key]: {
        ...state[key],
        [segmentId]: videoUrl
      }
    }));
    
    try {
      const newState = get()[key];
      localStorage.setItem(storageKey, JSON.stringify(newState));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  },

  getSegmentImage: (segmentId, isProject = false) => {
    const key = isProject ? 'projectImages' : 'segmentImages';
    return get()[key][segmentId] || null;
  },

  getSegmentVideo: (segmentId, isProject = false) => {
    const key = isProject ? 'projectVideos' : 'segmentVideos';
    return get()[key][segmentId] || null;
  },

  // Batch operations
  setSegmentImages: (imagesMap, isProject = false) => {
    const key = isProject ? 'projectImages' : 'segmentImages';
    const storageKey = isProject ? 'project-store-images' : 'segmentImages';
    
    set({ [key]: imagesMap });
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(imagesMap));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  },

  setSegmentVideos: (videosMap, isProject = false) => {
    const key = isProject ? 'projectVideos' : 'segmentVideos';
    const storageKey = isProject ? 'project-store-videos' : 'segmentVideos';
    
    set({ [key]: videosMap });
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(videosMap));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  },

  // Clear operations
  clearSegmentImage: (segmentId, isProject = false) => {
    const key = isProject ? 'projectImages' : 'segmentImages';
    const storageKey = isProject ? 'project-store-images' : 'segmentImages';
    
    set((state) => {
      const newState = { ...state[key] };
      delete newState[segmentId];
      return { [key]: newState };
    });
    
    try {
      const newState = get()[key];
      localStorage.setItem(storageKey, JSON.stringify(newState));
    } catch (e) {
      console.error(`Error clearing ${key} from localStorage:`, e);
    }
  },

  clearSegmentVideo: (segmentId, isProject = false) => {
    const key = isProject ? 'projectVideos' : 'segmentVideos';
    const storageKey = isProject ? 'project-store-videos' : 'segmentVideos';
    
    set((state) => {
      const newState = { ...state[key] };
      delete newState[segmentId];
      return { [key]: newState };
    });
    
    try {
      const newState = get()[key];
      localStorage.setItem(storageKey, JSON.stringify(newState));
    } catch (e) {
      console.error(`Error clearing ${key} from localStorage:`, e);
    }
  },

  // Clear all data
  clearAllSegmentData: (isProject = false) => {
    const imageKey = isProject ? 'projectImages' : 'segmentImages';
    const videoKey = isProject ? 'projectVideos' : 'segmentVideos';
    const imageStorageKey = isProject ? 'project-store-images' : 'segmentImages';
    const videoStorageKey = isProject ? 'project-store-videos' : 'segmentVideos';
    
    set({
      [imageKey]: {},
      [videoKey]: {}
    });
    
    try {
      localStorage.setItem(imageStorageKey, JSON.stringify({}));
      localStorage.setItem(videoStorageKey, JSON.stringify({}));
    } catch (e) {
      console.error(`Error clearing segment data from localStorage:`, e);
    }
  },

  // Load from localStorage (useful for initialization)
  loadFromStorage: (isProject = false) => {
    try {
      const imageKey = isProject ? 'projectImages' : 'segmentImages';
      const videoKey = isProject ? 'projectVideos' : 'segmentVideos';
      const imageStorageKey = isProject ? 'project-store-images' : 'segmentImages';
      const videoStorageKey = isProject ? 'project-store-videos' : 'segmentVideos';
      
      const storedImages = localStorage.getItem(imageStorageKey);
      const storedVideos = localStorage.getItem(videoStorageKey);
      
      set({
        [imageKey]: storedImages ? JSON.parse(storedImages) : {},
        [videoKey]: storedVideos ? JSON.parse(storedVideos) : {}
      });
    } catch (e) {
      console.error('Error loading segment data from localStorage:', e);
    }
  }
});

export const useSegmentStore = create(storeImpl);
