import { create } from 'zustand';

const useFlowWidgetStore = create((set, get) => ({
  // Get the selected project from localStorage
  getSelectedProject: () => {
    try {
      const storedProject = localStorage.getItem("project-store-selectedProject");
      return storedProject ? JSON.parse(storedProject) : null;
    } catch (error) {
      console.error("Error parsing project from localStorage:", error);
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
