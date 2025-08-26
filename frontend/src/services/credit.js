import { axiosInstance } from "../lib/axiosInstance";
import { getAuthHeaders } from "./api";

/**
 * Credit API service
 *
 * Backend CreditTransactionType enum values:
 * - DEDUCTION: For deducting credits from operations
 * - REFUND: For refunding credits
 * - PURCHASE: For purchasing/adding credits
 */

export const creditApi = {
  // Get user's current credit balance
  getBalance: async (userId) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(`/credits/balance/${userId}`, {
        headers,
      });
      console.log("Credit balance response:", data);
      return data;
    } catch (error) {
      console.error("Error in getBalance:", error);
      throw error;
    }
  },

  // Get comprehensive credit statistics
  getStats: async (userId) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(`/credits/stats/${userId}`, {
        headers,
      });
      console.log("Credit stats response:", data);
      return data;
    } catch (error) {
      console.error("Error in getStats:", error);
      throw error;
    }
  },

  // Get paginated credit transaction history
  getHistory: async (userId, page = 1, limit = 20) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(`/credits/history/${userId}`, {
        headers,
        params: { page, limit },
      });
      console.log("Credit history response:", data);
      return data;
    } catch (error) {
      console.error("Error in getHistory:", error);
      throw error;
    }
  },

  // Check if user has sufficient credits for an operation
  checkCredits: async (
    userId,
    operationType,
    modelName,
    isEditCall = false,
  ) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(
        `/credits/check/${userId}/${operationType}/${modelName}`,
        {
          headers,
          params: { isEditCall },
        },
      );
      console.log("Credit check response:", data);
      return data;
    } catch (error) {
      console.error("Error in checkCredits:", error);
      throw error;
    }
  },

  // Deduct credits for an operation
  deductCredits: async ({
    userId,
    operationType,
    modelName,
    operationId,
    isEditCall = false,
    description,
  }) => {
    try {
      const payload = {
        userId,
        operationType,
        modelName,
        operationId,
        isEditCall,
        description,
      };
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post("/credits/deduct", payload, {
        headers,
      });
      console.log("Credit deduction response:", data);
      return data;
    } catch (error) {
      console.error("Error in deductCredits:", error);
      throw error;
    }
  },

  // Add credits to user account
  addCredits: async ({ userId, amount, type, description }) => {
    try {
      const payload = { userId, amount, type, description };
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post("/credits/add", payload, {
        headers,
      });
      console.log("Credit addition response:", data);
      return data;
    } catch (error) {
      console.error("Error in addCredits:", error);
      throw error;
    }
  },

  // Get current operation pricing
  getPricing: async () => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get("/credits/pricing", {
        headers,
      });
      console.log("Credit pricing response:", data);
      return data;
    } catch (error) {
      console.error("Error in getPricing:", error);
      throw error;
    }
  },
};
