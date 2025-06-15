import { getAuthHeaders } from './client-auth'

interface FetchOptions extends RequestInit {
  skipAuth?: boolean
}

/**
 * Wrapper around fetch that automatically adds authentication headers
 * and handles authentication errors gracefully
 */
export async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  try {
    const { skipAuth, ...fetchOptions } = options
    
    // Add auth headers unless explicitly skipped
    if (!skipAuth) {
      const authHeaders = await getAuthHeaders()
      fetchOptions.headers = {
        ...fetchOptions.headers,
        ...authHeaders
      }
    }
    
    const response = await fetch(url, fetchOptions)
    
    // Handle authentication errors silently
    if (response.status === 401 || response.status === 403) {
      console.log(`Authentication error for ${url}`)
      return {
        ok: false,
        status: response.status,
        json: async () => null,
        isAuthError: true
      }
    }
    
    return response
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error)
    throw error
  }
}