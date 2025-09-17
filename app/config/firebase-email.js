// Firebase Email Action Settings Configuration
// This file configures custom URLs for Firebase Auth email actions

// Get the production URL from environment or use default
const getProductionUrl = () => {
  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    // Use your production domain
    // Update this with your actual production URL
    return process.env.NEXT_PUBLIC_APP_URL || 'https://aufondue.vercel.app';
  }
  // Use localhost for development
  return 'http://localhost:3000';
};

// Action code settings for password reset emails
export const getPasswordResetActionCodeSettings = () => {
  const baseUrl = getProductionUrl();
  
  return {
    // URL where the user will be redirected after the password reset is complete
    // This is the "continue URL" - where to go AFTER reset, not the reset page itself
    url: `${baseUrl}/Log-in`,
    // IMPORTANT: Do NOT use handleCodeInApp for password reset
    // handleCodeInApp: false means Firebase handles the reset page
    handleCodeInApp: false,
  };
};

// Action code settings for email verification (if needed)
export const getEmailVerificationActionCodeSettings = () => {
  const baseUrl = getProductionUrl();
  
  return {
    url: `${baseUrl}/verify-email`,
    handleCodeInApp: true,
  };
};