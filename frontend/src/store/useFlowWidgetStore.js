import { create } from 'zustand';

const useFlowWidgetStore = create((set, get) => ({
  // Get the selected project from the project store
  getSelectedProject: () => {
    try {
      // Import the project store dynamically to avoid circular dependencies
      const projectStore = window.__MY_GLOBAL_PROJECT_STORE__;
      if (projectStore) {
        const selectedProject = projectStore.getState().selectedProject;
        console.log('🔍 FlowWidgetStore: Getting selected project:', selectedProject);
        return selectedProject;
      }
      console.log('⚠️ FlowWidgetStore: Project store not available, waiting for initialization...');
      return null;
    } catch (error) {
      console.error("Error getting project from store:", error);
      return null;
    }
  },

  // Get project ID specifically
  getProjectId: () => {
    const project = get().getSelectedProject();
    return project?.id || null;
  },

  // Get project name specifically
  getProjectName: () => {
    const project = get().getSelectedProject();
    return project?.name || project?.title || "Untitled";
  },

  // Check if a project is selected
  hasSelectedProject: () => {
    const project = get().getSelectedProject();
    return project !== null;
  },

  // Get project with fallback values
  getProjectWithFallback: (fallbackId = null, fallbackName = "Untitled") => {
    const project = get().getSelectedProject();
    return {
      id: project?.id || fallbackId,
      name: project?.name || project?.title || fallbackName,
      ...project
    };
  }
}));

export default useFlowWidgetStore;
