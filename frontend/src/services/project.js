import { getAuthHeaders } from "./api";
import { axiosInstance } from "../lib/axiosInstance";

// Project API wrapper
export const projectApi = {
  // Create new project
  createProject: async ({ name, description }) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post(
        "/projects",
        { name, description },
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in createProject:", error);
      throw error;
    }
  },

  // Get all user projects (paginated)
  getProjects: async ({ page = 1, limit = 10 } = {}) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(
        `/projects?page=${page}&limit=${limit}`,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in getProjects:", error);
      throw error;
    }
  },

  // Get specific project with statistics
  getProjectById: async (projectId) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(`/projects/${projectId}`, {
        headers,
      });
      return data;
    } catch (error) {
      console.error("Error in getProjectById:", error);
      throw error;
    }
  },

  // Update project
  updateProject: async (projectId, { name, description }) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.patch(
        `/projects/${projectId}`,
        { name, description },
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in updateProject:", error);
      throw error;
    }
  },

  // Delete project
  deleteProject: async (projectId) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.delete(`/projects/${projectId}`, {
        headers,
      });
      return data;
    } catch (error) {
      console.error("Error in deleteProject:", error);
      throw error;
    }
  },

  // Get paginated conversations for a project
  getProjectConversations: async (projectId, { page = 1, limit = 10 } = {}) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(
        `/projects/${projectId}/conversations?page=${page}&limit=${limit}`,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in getProjectConversations:", error);
      throw error;
    }
  },

  // Get paginated concepts for a project
  getProjectConcepts: async (projectId, { page = 1, limit = 10 } = {}) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(
        `/projects/${projectId}/concepts?page=${page}&limit=${limit}`,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in getProjectConcepts:", error);
      throw error;
    }
  },

  // Get paginated images for a project
  getProjectImages: async (projectId, { page = 1, limit = 10 } = {}) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(
        `/projects/${projectId}/images?page=${page}&limit=${limit}`,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in getProjectImages:", error);
      throw error;
    }
  },

  // Get paginated videos for a project
  getProjectVideos: async (projectId, { page = 1, limit = 10 } = {}) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(
        `/projects/${projectId}/videos?page=${page}&limit=${limit}`,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in getProjectVideos:", error);
      throw error;
    }
  },

  // Get paginated voiceovers for a project
  getProjectVoiceovers: async (projectId, { page = 1, limit = 10 } = {}) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(
        `/projects/${projectId}/voiceovers?page=${page}&limit=${limit}`,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in getProjectVoiceovers:", error);
      throw error;
    }
  },

  // Get paginated segmentations for a project
  getProjectSegmentations: async (projectId, { page = 1, limit = 10 } = {}) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(
        `/projects/${projectId}/segmentations?page=${page}&limit=${limit}`,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in getProjectSegmentations:", error);
      throw error;
    }
  },

  // Get paginated summaries for a project
  getProjectSummaries: async (projectId, { page = 1, limit = 10 } = {}) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(
        `/projects/${projectId}/summaries?page=${page}&limit=${limit}`,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in getProjectSummaries:", error);
      throw error;
    }
  },

  // Get paginated web research for a project
  getProjectResearch: async (projectId, { page = 1, limit = 10 } = {}) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(
        `/projects/${projectId}/research?page=${page}&limit=${limit}`,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in getProjectResearch:", error);
      throw error;
    }
  },
};
