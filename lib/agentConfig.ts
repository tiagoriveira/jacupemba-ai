// Gerenciamento de configurações do agente via localStorage
// Este arquivo será a ponte até migrarmos para Supabase

export interface AgentConfig {
    model: string
    sarcasm_level: number
    instructions: string
}

const DEFAULT_CONFIG: AgentConfig = {
    model: 'grok-3-mini-fast',
    sarcasm_level: 5,
    instructions: ''
}

const STORAGE_KEY = 'jacupemba_agent_config'

/**
 * Salva configurações do agente no localStorage
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
 * Aplica o nível de sarcasmo ao system prompt
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
