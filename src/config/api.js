// API Configuration - Dynamic URL based on current host

const getBaseUrl = () => {
  // If we're in development mode on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost';
  }
  
  // For any other access (IP or domain), use the current hostname
  return `http://${window.location.hostname}`;
};

const BASE_URL = getBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  VOICE_NOTES: `${BASE_URL}:3001/api/voice-notes`,
  ENHANCED_NOTES: `${BASE_URL}:3001`,
  MEETINGS: `${BASE_URL}:3002`,
  TASKS: `${BASE_URL}:3003`,
  VOICE_NOTES_SERVER: `${BASE_URL}:3004`,
};

// WebSocket URLs
export const SOCKET_URLS = {
  ENHANCED_NOTES: `${BASE_URL}:3001`,
  MEETINGS: `${BASE_URL}:3002`,
  TASKS: `${BASE_URL}:3003`,
  VOICE_NOTES: `${BASE_URL}:3004`,
};

// Helper function to get API URL
export const getApiUrl = (port, path = '') => {
  return `${BASE_URL}:${port}${path}`;
};

// Helper function to get WebSocket URL
export const getSocketUrl = (port) => {
  return `${BASE_URL}:${port}`;
};

export default {
  API_ENDPOINTS,
  SOCKET_URLS,
  getApiUrl,
  getSocketUrl,
  BASE_URL
};