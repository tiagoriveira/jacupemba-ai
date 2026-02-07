// User fingerprint for anonymous identification
// Uses browser fingerprinting + random ID stored in localStorage

const FINGERPRINT_KEY = 'jacupemba_user_fp'

export function getUserFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server-side'
  }

  // Try to get existing fingerprint from localStorage
  let fingerprint = localStorage.getItem(FINGERPRINT_KEY)
  
  if (!fingerprint) {
    // Generate a new fingerprint based on browser characteristics
    const nav = navigator
    const screen = window.screen
    
    const data = [
      nav.userAgent,
      nav.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      // Add a random component to make it unique
      Math.random().toString(36).substring(2, 15)
    ].join('|')
    
    // Create a simple hash
    fingerprint = simpleHash(data)
    
    // Store it in localStorage for persistence
    localStorage.setItem(FINGERPRINT_KEY, fingerprint)
  }
  
  return fingerprint
}

// Simple hash function
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return 'fp_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36)
}
