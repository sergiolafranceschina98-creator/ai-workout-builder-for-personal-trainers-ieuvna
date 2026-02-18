
// This file is kept for backward compatibility but no longer uses backend
// All data is now stored locally using AsyncStorage

console.log('[API] App is running in local-only mode - no backend required');

// Placeholder functions for any legacy code that might still reference these
export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  throw new Error('Backend API is disabled. Use local storage functions from utils/localStorage.ts');
};

export const apiPost = async <T = any>(endpoint: string, data: any): Promise<T> => {
  throw new Error('Backend API is disabled. Use local storage functions from utils/localStorage.ts');
};

export const apiPut = async <T = any>(endpoint: string, data: any): Promise<T> => {
  throw new Error('Backend API is disabled. Use local storage functions from utils/localStorage.ts');
};

export const apiDelete = async <T = any>(endpoint: string): Promise<T> => {
  throw new Error('Backend API is disabled. Use local storage functions from utils/localStorage.ts');
};

// Authenticated versions (same as above - no backend)
export const authenticatedGet = apiGet;
export const authenticatedPost = apiPost;
export const authenticatedPut = apiPut;
export const authenticatedDelete = apiDelete;
