"use client";

/**
 * Helper function to add authentication headers to API requests
 */
export function getAuthHeaders() {
  // Get user from localStorage or context
  const userStr = localStorage.getItem('user');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      
      // Add user type header
      if (user.userType) {
        headers['X-User-Type'] = user.userType;
      }
      
      // Add user ID header
      if (user.userId) {
        headers['X-User-Id'] = user.userId.toString();
      }
      
      // Add token if available
      if (user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error('Failed to parse user data:', e);
    }
  }
  
  return headers;
}

/**
 * Make authenticated fetch request
 */
export async function authenticatedFetch(url, options = {}) {
  const authHeaders = getAuthHeaders();
  
  const mergedOptions = {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {})
    }
  };
  
  return fetch(url, mergedOptions);
}