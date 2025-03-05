"use client"

export const auth = {
  logout: () => {
    // Clear any auth tokens/session data
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    // Redirect to login page
    window.location.href = '/auth/login';
  }
};