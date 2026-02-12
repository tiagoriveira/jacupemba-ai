/**
 * Sistema de logging inteligente para o Jacupemba AI
 * 
 * @description
 * - Em desenvolvimento: Mostra todos os logs
 * - Em produção: Mostra apenas erros críticos
 * - Melhora performance e segurança
 * 
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger'
 * 
 * logger.log('Usuário conectado')  // Só em dev
 * logger.error('Erro crítico')     // Sempre
 * logger.warn('Atenção')           // Só em dev
 * ```
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  /**
   * Log de informação (debug)
   * Apenas visível em ambiente de desenvolvimento
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args)
    }
  },

  /**
   * Log de erro crítico
   * Sempre visível (dev e produção)
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },

  /**
   * Log de aviso
   * Apenas visível em ambiente de desenvolvimento
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args)
    }
  },

  /**
   * Log de informação (alias para log)
   * Apenas visível em ambiente de desenvolvimento
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args)
    }
  },

  /**
   * Log de debug detalhado
   * Apenas visível em ambiente de desenvolvimento
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args)
    }
  }
}
