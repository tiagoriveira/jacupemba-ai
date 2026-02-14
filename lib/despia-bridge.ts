/**
 * Despia Native Bridge
 * 
 * Este arquivo serve como ponte de comunicação entre o frontend (Next.js)
 * e as funcionalidades nativas injetadas pelo wrapper Despia (iOS/Android).
 * 
 * Atualmente é um esqueleto para futuras implementações como:
 * - Notificações Push
 * - Geolocalização Nativa
 * - Haptics
 * - Biometria
 */

interface DespiaNativeInterface {
  postMessage: (message: string) => void;
}

// Declaração global para evitar erros de TS
declare global {
  interface Window {
    DespiaNative?: DespiaNativeInterface;
    webkit?: {
      messageHandlers?: {
        DespiaNative?: DespiaNativeInterface;
      };
    };
  }
}

export const DespiaBridge = {
  /**
   * Verifica se o app está rodando dentro do wrapper Despia
   */
  isNative: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!(window.DespiaNative || window.webkit?.messageHandlers?.DespiaNative);
  },

  /**
   * Envia uma mensagem para o código nativo
   */
  sendMessage: (action: string, data: any = {}) => {
    const payload = JSON.stringify({ action, data });
    
    if (window.DespiaNative) {
      // Android / Generic
      window.DespiaNative.postMessage(payload);
    } else if (window.webkit?.messageHandlers?.DespiaNative) {
      // iOS
      window.webkit.messageHandlers.DespiaNative.postMessage(payload);
    } else {
      console.warn('Despia Bridge: Not running in native environment', { action, data });
    }
  },

  /**
   * Exemplo: Solicitar vibração (Haptic Feedback)
   */
  hapticFeedback: (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    DespiaBridge.sendMessage('haptic', { style });
  }
};
