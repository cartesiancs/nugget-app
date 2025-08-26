import axios from "axios";

export const API_BASE_URL = "https://backend.usuals.ai";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});
