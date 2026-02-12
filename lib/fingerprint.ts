/**
 * Sistema de Fingerprinting Anônimo
 * 
 * @description
 * Gera um identificador único para o usuário baseado em características do navegador.
 * Usado para rastreamento anônimo de likes, comentários e histórico sem necessidade de login.
 * 
 * @module fingerprint
 */

/** Chave para armazenar fingerprint no localStorage */
const FINGERPRINT_KEY = 'jacupemba_user_fp'

/**
 * Obtém ou gera um fingerprint único para o usuário
 * 
 * @description
 * - Tenta recuperar fingerprint existente do localStorage
 * - Se não existir, gera novo baseado em: userAgent, idioma, resolução, timezone + random
 * - Persiste no localStorage para manter consistência entre sessões
 * 
 * @returns {string} Fingerprint único no formato "fp_[hash]_[timestamp]"
 * 
 * @example
 * ```typescript
 * const userId = getUserFingerprint()
 * // => "fp_a1b2c3_1k2j3h4"
 * ```
 */
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

/**
 * Gera um hash simples de uma string
 * 
 * @param {string} str - String para gerar hash
 * @returns {string} Hash no formato "fp_[hash]_[timestamp]"
 * @private
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return 'fp_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36)
}
