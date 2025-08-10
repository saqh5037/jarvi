// Hook to get dynamic API URLs based on current host
import { useMemo } from 'react';

export const useApiUrl = () => {
  const baseUrl = useMemo(() => {
    const hostname = window.location.hostname;
    // If accessing from localhost, use localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost';
    }
    // Otherwise use the actual hostname/IP
    return `http://${hostname}`;
  }, []);

  const getApiUrl = (port, path = '') => {
    return `${baseUrl}:${port}${path}`;
  };

  const getSocketUrl = (port) => {
    return `${baseUrl}:${port}`;
  };

  return {
    baseUrl,
    getApiUrl,
    getSocketUrl,
    // Predefined endpoints
    voiceNotesApi: `${baseUrl}:3001`,
    meetingsApi: `${baseUrl}:3002`,
    tasksApi: `${baseUrl}:3003`,
    voiceServerApi: `${baseUrl}:3004`,
  };
};

export default useApiUrl;