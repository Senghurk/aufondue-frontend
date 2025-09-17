// API Configuration for AU Fondue Web App

const config = {
  // Backend API URLs
  BACKEND_URLS: {
    // Your containerized backend (current production)
    CONTAINER: "https://aufondue-backend.kindisland-399ef298.southeastasia.azurecontainerapps.io/api",
    
    // Local backend (if you want to test with local backend later)
    LOCAL: "http://localhost:8080/api",
    
    // Alternative container URL (if needed for backup)
    CONTAINER_ALT: "https://aufonduebackend.kindisland-399ef298.southeastasia.azurecontainerapps.io/api"
  },
  
  // Environment configuration
  ENVIRONMENT: {
    // Set this to switch between different backend URLs
    // Options: 'CONTAINER', 'LOCAL', 'CONTAINER_ALT'
    CURRENT: 'LOCAL'  // Using Azure container backend for production testing
  }
};

// Get the current backend URL based on environment setting
export const getBackendUrl = () => {
  const environment = config.ENVIRONMENT.CURRENT;
  return config.BACKEND_URLS[environment] || config.BACKEND_URLS.CONTAINER;
};

// Export individual URLs for direct usage if needed
export const BACKEND_URLS = config.BACKEND_URLS;
export const CURRENT_BACKEND_URL = getBackendUrl();

// Default export
export default config;