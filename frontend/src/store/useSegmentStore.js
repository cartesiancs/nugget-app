import { create } from "zustand";

const storeImpl = (set, get) => ({
  // State
  segmentImages: {},
  segmentVideos: {},
  projectImages: {},
  projectVideos: {},

  // Actions
  setSegmentImage: (segmentId, imageUrl, isProject = false) => {
    const key = isProject ? 'projectImages' : 'segmentImages';
    
    set((state) => ({
      [key]: {
        ...state[key],
        [segmentId]: imageUrl
      }
    }));
  },

  setSegmentVideo: (segmentId, videoUrl, isProject = false) => {
    const key = isProject ? 'projectVideos' : 'segmentVideos';
    
    set((state) => ({
      [key]: {
        ...state[key],
        [segmentId]: videoUrl
      }
    }));
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
    set({ [key]: imagesMap });
  },

  setSegmentVideos: (videosMap, isProject = false) => {
    const key = isProject ? 'projectVideos' : 'segmentVideos';
    set({ [key]: videosMap });
  },

  // Clear operations
  clearSegmentImage: (segmentId, isProject = false) => {
    const key = isProject ? 'projectImages' : 'segmentImages';
    
    set((state) => {
      const newState = { ...state[key] };
      delete newState[segmentId];
      return { [key]: newState };
    });
  },

  clearSegmentVideo: (segmentId, isProject = false) => {
    const key = isProject ? 'projectVideos' : 'segmentVideos';
    
    set((state) => {
      const newState = { ...state[key] };
      delete newState[segmentId];
      return { [key]: newState };
    });
  },

  // Clear all data
  clearAllSegmentData: (isProject = false) => {
    const imageKey = isProject ? 'projectImages' : 'segmentImages';
    const videoKey = isProject ? 'projectVideos' : 'segmentVideos';
    
    set({
      [imageKey]: {},
      [videoKey]: {}
    });
  },

  
  loadFromStorage: (isProject = false) => {
 
    const { segmentImages, segmentVideos, projectImages, projectVideos } = get();
    return {
      segmentImages: isProject ? projectImages : segmentImages,
      segmentVideos: isProject ? projectVideos : segmentVideos
    };
  }
});

export const useSegmentStore = create(storeImpl);
