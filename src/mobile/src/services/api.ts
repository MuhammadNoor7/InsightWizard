import axios from 'axios';
import { Platform } from 'react-native';

// Dynamic development URL resolution
// iOS Simulator / Web uses localhost, Android Emulator uses 10.0.2.2 loopback IP.
const getDevUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

export const API_BASE_URL = getDevUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Error-normalization interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let normalizedMessage = 'An unexpected server error occurred.';
    
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      const data = error.response.data;
      if (data && typeof data === 'object') {
        if (data.detail) {
          if (typeof data.detail === 'string') {
            normalizedMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            // FastAPI validation error format
            normalizedMessage = data.detail.map((err: any) => `${err.loc?.join('.') || 'val'}: ${err.msg}`).join('\n');
          } else if (data.detail.error) {
            normalizedMessage = data.detail.error;
          }
        } else if (data.error) {
          normalizedMessage = data.error;
        }
      } else if (typeof data === 'string' && data.length < 100) {
        normalizedMessage = data;
      }
    } else if (error.request) {
      // The request was made but no response was received
      normalizedMessage = 'Gateway unreachable. Verify the FastAPI server is running on port 8000.';
    } else {
      // Something happened in setting up the request that triggered an Error
      normalizedMessage = error.message;
    }
    
    return Promise.reject(new Error(normalizedMessage));
  }
);

export default api;
