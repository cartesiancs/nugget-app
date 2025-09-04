import { create } from "zustand";
import { projectApi } from "../services/project";
import { creditApi } from "../services/credit";

const storeImpl = (set, get) => ({
  projects: (() => {
    try {
      const stored = localStorage.getItem("project-store-projects");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading projects from localStorage:', e);
      return [];
    }
  })(),
  selectedProject: (() => {
    try {
      const stored = localStorage.getItem("project-store-selectedProject");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Error loading selected project from localStorage:', e);
      return null;
    }
  })(),
  storedVideosMap: (() => {
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
  })(),
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
    balance: false,
  },
  error: null,
  creditBalance: 0,

  setProjects: (projects) => {
    set({ projects });
    try {
      localStorage.setItem("project-store-projects", JSON.stringify(projects));
    } catch (e) {
      console.error('Error saving projects to localStorage:', e);
    }
  },
  setStoredVideosMap: (videosMap) => {
    const { selectedProject } = get();
    set({ storedVideosMap: videosMap });
    
    
    if (selectedProject) {
      localStorage.setItem(
        `project-store-videos`,
        JSON.stringify(videosMap),
      );
    } else {
      localStorage.setItem("segmentVideos", JSON.stringify(videosMap));
    }
  },
  setSelectedProject: (project) => {
    console.log('🏪 Store: Setting selected project:', project?.name);
    set({ selectedProject: project });
    
    // Update localStorage
    if (project) {
      localStorage.setItem("project-store-selectedProject", JSON.stringify(project));
    } else {
      localStorage.removeItem("project-store-selectedProject");
    }
    
    // Update storedVideosMap based on project selection
    const { setStoredVideosMap } = get();
    if (project) {
      const projectVideos = JSON.parse(localStorage.getItem(`project-store-videos`) || "{}");
      setStoredVideosMap(projectVideos);
    } else {
      const segmentVideos = JSON.parse(localStorage.getItem("segmentVideos") || "{}");
      setStoredVideosMap(segmentVideos);
    }
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('projectChanged', { 
      detail: { project } 
    }));
    
    if (project?.id) {
      get().fetchProjectEssentials(project.id);
    }
  },

  // Selected project management methods
  getSelectedProject: () => {
    const { selectedProject } = get();
    return selectedProject;
  },

  clearSelectedProject: () => {
    console.log('🏪 Store: Clearing selected project');
    set({ selectedProject: null });
    localStorage.removeItem("project-store-selectedProject");
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('projectChanged', { 
      detail: { project: null } 
    }));
  },

  loadSelectedProjectFromStorage: () => {
    try {
      const stored = localStorage.getItem("project-store-selectedProject");
      if (stored) {
        const project = JSON.parse(stored);
        set({ selectedProject: project });
        return project;
      }
      return null;
    } catch (error) {
      console.error('Error loading project from localStorage:', error);
      return null;
    }
  },

  saveSelectedProjectToStorage: (project) => {
    try {
      if (project) {
        localStorage.setItem("project-store-selectedProject", JSON.stringify(project));
        set({ selectedProject: project });
      } else {
        localStorage.removeItem("project-store-selectedProject");
        set({ selectedProject: null });
      }
      return true;
    } catch (error) {
      console.error('Error saving project to localStorage:', error);
      return false;
    }
  },

  hasProjectInStorage: () => {
    try {
      const stored = localStorage.getItem("project-store-selectedProject");
      return stored !== null;
    } catch (error) {
      console.error('Error checking project in localStorage:', error);
      return false;
    }
  },

  getProjectFromStorage: () => {
    try {
      const stored = localStorage.getItem("project-store-selectedProject");
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error getting project from localStorage:', error);
      return null;
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
  setCreditBalance: (balance) => set({ creditBalance: balance }),

  fetchProjects: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const data = await projectApi.getProjects({ page, limit });
      get().setProjects(data);
      set({ loading: false });
    } catch (e) {
      set({ error: e.message || "Failed to fetch projects", loading: false });
    }
  },

  // Project management methods
  addProject: (project) => {
    const { projects } = get();
    const updatedProjects = [...projects, project];
    get().setProjects(updatedProjects);
  },

  updateProject: (projectId, updates) => {
    const { projects } = get();
    const updatedProjects = projects.map(project => 
      project.id === projectId ? { ...project, ...updates } : project
    );
    get().setProjects(updatedProjects);
  },

  removeProject: (projectId) => {
    const { projects, selectedProject } = get();
    const updatedProjects = projects.filter(project => project.id !== projectId);
    get().setProjects(updatedProjects);
    
    // Clear selected project if it was removed
    if (selectedProject && selectedProject.id === projectId) {
      get().clearSelectedProject();
    }
  },

  clearProjects: () => {
    get().setProjects([]);
  },

  getProjectById: (projectId) => {
    const { projects } = get();
    return projects.find(project => project.id === projectId);
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

  // Credit related functions
  fetchBalance: async (userId) => {
    set((state) => ({
      loadingData: { ...state.loadingData, balance: true },
      error: null,
    }));
    try {
      const data = await creditApi.getBalance(userId);
      set((state) => ({
        creditBalance: data.credits || 0,
        loadingData: { ...state.loadingData, balance: false },
      }));
      return data;
    } catch (error) {
      set((state) => ({
        error: error.message || "Failed to fetch credit balance",
        loadingData: { ...state.loadingData, balance: false },
      }));
      throw error;
    }
  },

  addCredits: async ({ userId, amount, type, description }) => {
    set({ loading: true, error: null });
    try {
      const data = await creditApi.addCredits({
        userId,
        amount,
        type,
        description,
      });
      set((state) => ({
        creditBalance: state.creditBalance + amount,
        loading: false,
      }));
      return data;
    } catch (error) {
      set({
        error: error.message || "Failed to add credits",
        loading: false,
      });
      throw error;
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
    
    // Clear the selected project and projects list
    get().clearSelectedProject();
    get().clearProjects();
  },
});

export const useProjectStore =
  window.__MY_GLOBAL_PROJECT_STORE__ || create(storeImpl);

if (!window.__MY_GLOBAL_PROJECT_STORE__) {
  window.__MY_GLOBAL_PROJECT_STORE__ = useProjectStore;
  
  // Initialize projects and selected project from localStorage
  setTimeout(() => {
    const store = useProjectStore.getState();
    const project = store.loadSelectedProjectFromStorage();
    if (project) {
      console.log('✅ ProjectStore: Initialized with project from storage:', project.name);
    }
    console.log('✅ ProjectStore: Initialized with projects from storage:', store.projects.length);
  }, 0);
}
