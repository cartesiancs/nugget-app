import { create } from "zustand";
import { projectApi } from "../services/project";

const storeImpl = (set, get) => ({
  projects: [],
  selectedProject: null,
  conversations: [],
  concepts: [],
  images: [],
  videos: [],
  voiceovers: [],
  segmentations: [],
  summaries: [],
  research: [],
  loading: false,
  loadingData: {
    conversations: false,
    concepts: false,
    images: false,
    videos: false,
    voiceovers: false,
    segmentations: false,
    summaries: false,
    research: false,
  },
  error: null,
  setProjects: (projects) => set({ projects }),
  setSelectedProject: (project) => {
    set({ selectedProject: project });
    if (project?.id) {
      get().fetchProjectEssentials(project.id);
    }
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setConversations: (conversations) => set({ conversations }),
  setConcepts: (concepts) => set({ concepts }),
  setImages: (images) => set({ images }),
  setVideos: (videos) => set({ videos }),
  setVoiceovers: (voiceovers) => set({ voiceovers }),
  setSegmentations: (segmentations) => set({ segmentations }),
  setSummaries: (summaries) => set({ summaries }),
  setResearch: (research) => set({ research }),
  fetchProjects: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const data = await projectApi.getProjects({ page, limit });
      set({ projects: data, loading: false });
    } catch (e) {
      set({ error: e.message || "Failed to fetch projects", loading: false });
    }
  },
  fetchProjectEssentials: async (projectId) => {
    const { setSegmentations, setImages, setVideos } = get();
    try {
      const [segmentationsRes, imagesRes, videosRes] = await Promise.all([
        projectApi.getProjectSegmentations(projectId, { page: 1, limit: 50 }),
        projectApi.getProjectImages(projectId, { page: 1, limit: 100 }),
        projectApi.getProjectVideos(projectId, { page: 1, limit: 100 }),
      ]);
      setSegmentations(segmentationsRes.data || []);
      setImages(imagesRes.data || []);
      setVideos(videosRes.data || []);
    } catch (error) {
      console.error("Failed to fetch project essentials:", error);
      set({ error: error.message || "Failed to fetch project data" });
    }
  },
  fetchConversations: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, conversations: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectConversations(projectId, {
        page,
        limit,
      });
      set((state) => ({
        conversations: data.data || [],
        loadingData: { ...state.loadingData, conversations: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch conversations",
        loadingData: { ...state.loadingData, conversations: false },
      }));
      throw e;
    }
  },
  fetchConcepts: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, concepts: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectConcepts(projectId, {
        page,
        limit,
      });
      set((state) => ({
        concepts: data.data || [],
        loadingData: { ...state.loadingData, concepts: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch concepts",
        loadingData: { ...state.loadingData, concepts: false },
      }));
      throw e;
    }
  },
  fetchImages: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, images: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectImages(projectId, {
        page,
        limit,
      });
      set((state) => ({
        images: data.data || [],
        loadingData: { ...state.loadingData, images: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch images",
        loadingData: { ...state.loadingData, images: false },
      }));
      throw e;
    }
  },
  fetchVideos: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, videos: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectVideos(projectId, {
        page,
        limit,
      });
      set((state) => ({
        videos: data.data || [],
        loadingData: { ...state.loadingData, videos: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch videos",
        loadingData: { ...state.loadingData, videos: false },
      }));
      throw e;
    }
  },
  fetchVoiceovers: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, voiceovers: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectVoiceovers(projectId, {
        page,
        limit,
      });
      set((state) => ({
        voiceovers: data.data || [],
        loadingData: { ...state.loadingData, voiceovers: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch voiceovers",
        loadingData: { ...state.loadingData, voiceovers: false },
      }));
      throw e;
    }
  },
  fetchSegmentations: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, segmentations: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectSegmentations(projectId, {
        page,
        limit,
      });
      set((state) => ({
        segmentations: data.data || [],
        loadingData: { ...state.loadingData, segmentations: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch segmentations",
        loadingData: { ...state.loadingData, segmentations: false },
      }));
      throw e;
    }
  },
  fetchSummaries: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, summaries: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectSummaries(projectId, {
        page,
        limit,
      });
      set((state) => ({
        summaries: data.data || [],
        loadingData: { ...state.loadingData, summaries: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch summaries",
        loadingData: { ...state.loadingData, summaries: false },
      }));
      throw e;
    }
  },
  fetchResearch: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, research: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectResearch(projectId, {
        page,
        limit,
      });
      set((state) => ({
        research: data.data || [],
        loadingData: { ...state.loadingData, research: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch research",
        loadingData: { ...state.loadingData, research: false },
      }));
      throw e;
    }
  },
  refreshSelectedProjectData: async () => {
    const { selectedProject } = get();
    if (selectedProject?.id) {
      await get().fetchProjectEssentials(selectedProject.id);
    }
  },
  clearProjectData: () => {
    set({
      conversations: [],
      concepts: [],
      images: [],
      videos: [],
      voiceovers: [],
      segmentations: [],
      summaries: [],
      research: [],
      selectedProject: null,
    });
  },
});

export const useProjectStore =
  window.__MY_GLOBAL_PROJECT_STORE__ || create(storeImpl);

if (!window.__MY_GLOBAL_PROJECT_STORE__) {
  window.__MY_GLOBAL_PROJECT_STORE__ = useProjectStore;
}
