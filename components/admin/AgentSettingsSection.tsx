'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Save, Loader2, MessageSquare, AlertTriangle, Cpu, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { saveAgentConfig } from '@/lib/agentConfig'

interface AgentConfig {
    model: string
    sarcasm_level: number
    instructions: string
}

interface ConfigItem {
    key: string
    value: string
}

export function AgentSettingsSection() {
    const [config, setConfig] = useState<AgentConfig>({
        model: 'grok-4-1-fast-reasoning',
        sarcasm_level: 2,
        instructions: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Preview simples baseado no nível de sarcasmo
    const getPreview = () => {
        const level = config.sarcasm_level
        if (level < 3) return "Olá! Claro, posso te ajudar com isso. O que você precisa saber sobre Jacupemba?"
        if (level < 7) return "Ah, Jacupemba... O lugar onde o vento faz a curva e o nada acontece. Mas diz aí, o que você quer?"
        return "Olha só quem apareceu. Espero que não seja outra pergunta óbvia sobre a previsão do tempo. Fala logo."
    }

    const fetchConfig = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('app_config')
                .select('*')

            if (error) {
                logger.error('Error fetching config:', error)
                toast.error('Erro ao carregar configurações')
                setLoading(false)
                return
            }

            if (data && data.length > 0) {
                const newConfig: AgentConfig = {
                    model: 'grok-4-1-fast-reasoning',
                    sarcasm_level: 2,
                    instructions: ''
                }

                data.forEach((item: ConfigItem) => {
                    if (item.key === 'agent_model') newConfig.model = item.value
                    if (item.key === 'agent_sarcasm_level') {
                        const level = parseInt(item.value, 10)
                        newConfig.sarcasm_level = isNaN(level) ? 2 : level
                    }
                    if (item.key === 'agent_instructions') newConfig.instructions = item.value || ''
                })

                setConfig(newConfig)
            }
        } catch (error) {
            logger.error('Unexpected error:', error)
            toast.error('Erro ao carregar')
        } finally {
            setLoading(false)
        }
    }, [])

    const handleSave = async () => {
        if (saving) return

        try {
            setSaving(true)

            saveAgentConfig({
                model: config.model,
                sarcasm_level: config.sarcasm_level,
                instructions: config.instructions
            })

            const updates = [
                { key: 'agent_model', value: config.model },
                { key: 'agent_sarcasm_level', value: config.sarcasm_level.toString() },
                { key: 'agent_instructions', value: config.instructions.trim() }
            ]

            const { error } = await supabase
                .from('app_config')
                .upsert(updates, { onConflict: 'key' })

            if (error) {
                logger.error('Error saving:', error)
                toast.error('Erro ao salvar')
                return
            }

            toast.success('Salvo com sucesso!')
        } catch (error) {
            logger.error('Error:', error)
            toast.error('Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        fetchConfig()
    }, [fetchConfig])

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        )
    }

    return (
        <div className="h-full bg-zinc-50 dark:bg-zinc-950 p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Configurações do Agente</h1>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Personalize o comportamento e a inteligência do Jacupemba AI
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left Column - Settings */}
                    <div className="space-y-6">
                        <div className="rounded-xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                            {/* Model Selection */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                    <Cpu className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Modelo de IA</h2>
                                </div>

                                {/* Single Grok Model Card */}
                                <div className="flex w-full items-center gap-4 rounded-xl border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black dark:bg-zinc-100">
                                        <Cpu className="h-6 w-6 text-white dark:text-zinc-900" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="font-medium text-zinc-900 dark:text-zinc-100">Grok 4.1</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Modelo avançado com raciocínio aprimorado</p>
                                    </div>
                                    <div className="badge-grok bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        ATIVO
                                    </div>
                                </div>
                            </div>

                            {/* Personality */}
                            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2 pb-2">
                                    <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Personalidade</h2>
                                </div>

                                <div>
                                    <div className="mb-4 flex items-center justify-between">
                                        <label className="font-medium text-zinc-700 dark:text-zinc-300">Nível de Sarcasmo</label>
                                        <span className={`badge-grok ${config.sarcasm_level > 7 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'}`}>
                                            {config.sarcasm_level}/10
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="1"
                                        value={config.sarcasm_level}
                                        onChange={(e) => setConfig(prev => ({ ...prev, sarcasm_level: parseInt(e.target.value, 10) }))}
                                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 dark:bg-zinc-700 accent-zinc-900 dark:accent-zinc-100"
                                    />
                                    <div className="mt-2 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                        <span>Educado</span>
                                        <span>Brincalhão</span>
                                        <span>Agressivo</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Preview & Instructions */}
                    <div className="space-y-6">
                        {/* Live Preview */}
                        <div className="rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-white shadow-lg">
                            <div className="flex items-center gap-2 mb-4 border-b border-zinc-700 pb-4">
                                <MessageSquare className="h-5 w-5 text-emerald-400" />
                                <h2 className="text-lg font-semibold">Live Preview</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                                        EU
                                    </div>
                                    <div className="rounded-2xl rounded-tl-none bg-white/10 p-3 text-sm text-zinc-200">
                                        Qual é a boa de hoje em Jacupemba?
                                    </div>
                                </div>

                                <div className="flex gap-3 flex-row-reverse">
                                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-zinc-900">
                                        AI
                                    </div>
                                    <div className="rounded-2xl rounded-tr-none bg-emerald-500/10 p-3 text-sm text-emerald-100 border border-emerald-500/20">
                                        {getPreview()}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-2 text-xs text-zinc-400">
                                <AlertTriangle className="h-3 w-3" />
                                <span>A resposta real pode variar dependendo do contexto.</span>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="rounded-xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <label className="mb-2 block font-medium text-zinc-700 dark:text-zinc-300">
                                Instruções do Sistema (System Prompt)
                            </label>
                            <textarea
                                value={config.instructions}
                                onChange={(e) => setConfig(prev => ({ ...prev, instructions: e.target.value }))}
                                placeholder="Defina regras específicas de comportamento, gírias obrigatórias ou tópicos proibidos..."
                                rows={6}
                                className="input-grok w-full"
                            />
                            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                                Essas instruções têm prioridade sobre a personalidade padrão.
                            </p>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-grok w-full flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-70 px-6 py-4"
                            >
                                {saving ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Save className="h-5 w-5" />
                                )}
                                Salvar Configurações
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
