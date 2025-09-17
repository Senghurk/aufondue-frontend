/**
 * Centralized date formatting utility
 * Standard format: DD/MM/YYYY (e.g., 07/09/2025)
 */

/**
 * Format date to DD/MM/YYYY format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string or 'N/A' if invalid
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'N/A';
  }
};

/**
 * Format date with time to DD/MM/YYYY HH:MM format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date-time string or 'N/A' if invalid
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return 'N/A';
  }
};

/**
 * Get relative time (e.g., "2 days ago", "Just now")
 * @param {string|Date} date - The date to format
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    const now = new Date();
    const diffInMs = now - dateObj;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    // For older dates, return the formatted date
    return formatDate(date);
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return 'N/A';
  }
};