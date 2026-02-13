/**
 * API Configuration for Mobile/Web
 * 
 * Handles absolute URLs for API calls when app is built as static export.
 * In development, uses relative URLs. In production mobile app, uses full domain.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

/**
 * Get full API URL for fetch calls
 * 
 * @param endpoint - API endpoint path (e.g., '/api/chat')
 * @returns Full URL for the endpoint
 * 
 * @example
 * ```typescript
 * fetch(getApiUrl('/api/chat'), { method: 'POST', ... })
 * ```
 */
export function getApiUrl(endpoint: string): string {
  // Server-side: use relative URLs
  if (typeof window === 'undefined') {
    return endpoint
  }
  
  // Client-side with base URL configured (production mobile)
  if (API_BASE_URL) {
    return `${API_BASE_URL}${endpoint}`
  }
  
  // Client-side without base URL (development web)
  return endpoint
}
