/**
 * API Client utility for making HTTP requests
 * Provides consistent error handling, request formatting and response parsing
 */

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com';

export async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Handle specific error status codes
      switch (response.status) {
        case 401:
          // Handle unauthorized
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        default:
          // Handle other errors
      }

      const errorText = await response.text();
      let errorMessage;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || 'Unknown error occurred';
      } catch {
        errorMessage = errorText || `HTTP error ${response.status}`;
      }

      return {
        data: null,
        error: errorMessage,
        status: response.status,
      };
    }

    // Check if the response is empty
    const contentType = response.headers.get('content-type');
    
    if (!contentType || contentType.indexOf('application/json') === -1) {
      return {
        data: null,
        error: null,
        status: response.status,
      };
    }

    const data = await response.json();
    
    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    console.error('API Client Error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 0,
    };
  }
}

// API client with common HTTP methods
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, data: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    
  put: <T>(endpoint: string, data: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    
  patch: <T>(endpoint: string, data: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    
  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
};