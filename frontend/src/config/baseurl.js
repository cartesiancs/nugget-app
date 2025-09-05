// Base URL Configuration
// This file contains all the base URLs used throughout the application
// Replace these with your production URLs

export const BASE_URLS = {
  // Main API base URL
  // API_BASE_URL: "https://backend.usuals.ai",
  API_BASE_URL: "http://localhost:8080",
  // CloudFront CDN URL for media files
  CLOUDFRONT_URL: "https://ds0fghatf06yb.cloudfront.net",
  
  // CDN base URL (fallback)
  CDN_BASE_URL: "https://backend.usuals.ai/cdn"
};

// Individual exports for convenience
export const API_BASE_URL = BASE_URLS.API_BASE_URL;
export const CLOUDFRONT_URL = BASE_URLS.CLOUDFRONT_URL;
export const CDN_BASE_URL = BASE_URLS.CDN_BASE_URL;
