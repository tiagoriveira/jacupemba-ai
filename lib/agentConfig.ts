/**
 * Sistema de Configuração do Agente IA
 * 
 * @description
 * Gerencia configurações personalizáveis do agente (modelo, nível de sarcasmo, instruções).
 * Atualmente usa localStorage. Futura migração para Supabase planejada.
 * 
 * @module agentConfig
 */

/**
 * Interface de configuração do agente
 * 
 * @interface AgentConfig
 * @property {string} model - Modelo xAI a ser usado (ex: "grok-4-1-fast-reasoning")
 * @property {number} sarcasm_level - Nível de sarcasmo de 0 (formal) a 10 (tóxico)
 * @property {string} instructions - Instruções customizadas adicionais para o agente
 */
export interface AgentConfig {
    model: string
    sarcasm_level: number
    instructions: string
}

/** Configuração padrão do agente */
const DEFAULT_CONFIG: AgentConfig = {
    model: 'grok-4-1-fast-reasoning',
    sarcasm_level: 5,
    instructions: ''
}

/** Chave para armazenar config no localStorage */
const STORAGE_KEY = 'jacupemba_agent_config'

/**
 * Salva configurações do agente no localStorage
 * 
 * @param {AgentConfig} config - Configurações a serem salvas
 * @throws {Error} Se falhar ao salvar (captura erro silenciosamente)
 * 
 * @example
 * ```typescript
 * saveAgentConfig({
 *   model: 'grok-4-1-fast-reasoning',
 *   sarcasm_level: 7,
 *   instructions: 'Seja mais direto'
 * })
 * ```
 */
export function saveAgentConfig(config: AgentConfig): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
        console.error('Error saving agent config:', error)
    }
}

/**
 * Lê configurações do agente do localStorage
 * 
 * @returns {AgentConfig} Configurações salvas ou DEFAULT_CONFIG se não existir
 * @throws {Error} Se falhar ao ler (retorna DEFAULT_CONFIG)
 * 
 * @example
 * ```typescript
 * const config = getAgentConfig()
 * console.log(config.sarcasm_level) // => 5 (padrão)
 * ```
 */
export function getAgentConfig(): AgentConfig {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return DEFAULT_CONFIG

        const config = JSON.parse(stored)
        return {
            ...DEFAULT_CONFIG,
            ...config
        }
    } catch (error) {
        console.error('Error reading agent config:', error)
        return DEFAULT_CONFIG
    }
}

/**
 * Aplica o nível de sarcasmo ao system prompt do agente
 * 
 * @param {string} basePrompt - Prompt base do agente
 * @param {number} level - Nível de sarcasmo (0-10)
 * @returns {string} Prompt com instrução de sarcasmo adicionada
 * 
 * @description
 * Escala de sarcasmo:
 * - 0: Extremamente educado e formal
 * - 5: Sarcasmo equilibrado (padrão)
 * - 10: Tóxico e sem filtros
 * 
 * @example
 * ```typescript
 * const prompt = applySarcasmToPrompt("Você é um assistente", 7)
 * // Adiciona: "Tom: Sarcasmo forte. Seja cínico..."
 * ```
 */
export function applySarcasmToPrompt(basePrompt: string, level: number): string {
    const sarcasmInstructions = {
        0: '\n\nTom: Seja extremamente educado, formal e cortês. Evite qualquer tipo de sarcasmo.',
        1: '\n\nTom: Seja gentil e amigável, mas pode usar um humor leve ocasionalmente.',
        2: '\n\nTom: Seja útil e direto, com toques ocasionais de personalidade.',
        3: '\n\nTom: Use humor moderado e seja conversacional, mas mantenha o profissionalismo.',
        4: '\n\nTom: Seja espirituoso e use ironia leve para tornar a conversa mais interessante.',
        5: '\n\nTom: Use sarcasmo de forma equilibrada. Seja sincero mas com bom humor.',
        6: '\n\nTom: Aumente o sarcasmo. Seja direto e não tenha medo de fazer observações ácidas sobre a realidade.',
        7: '\n\nTom: Sarcasmo forte. Seja cínico e não amenize problemas. Use comparações irônicas.',
        8: '\n\nTom: Muito sarcástico. Seja brutalmente honesto e use humor negro quando apropriado.',
        9: '\n\nTom: Extremamente sarcástico. Não poupe críticas e seja impiedoso com a verdade.',
        10: '\n\nTom: TÓXICO. Sarcasmo máximo, sem filtros. Seja implacável e excessivamente crítico.'
    }

    const sarcasmText = sarcasmInstructions[level as keyof typeof sarcasmInstructions] || sarcasmInstructions[5]
    return basePrompt + sarcasmText
}
