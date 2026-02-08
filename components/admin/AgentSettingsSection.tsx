'use client'

import { useState, useEffect } from 'react'
import { Save, Bot, Sparkles, Cpu, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface AgentConfig {
    model: string
    sarcasm_level: number
    instructions: string
}

export function AgentSettingsSection() {
    const [config, setConfig] = useState<AgentConfig>({
        model: 'gpt-4o-mini',
        sarcasm_level: 5,
        instructions: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('app_config')
                .select('*')

            if (error) throw error

            if (data) {
                const newConfig = { ...config }
                data.forEach((item: any) => {
                    if (item.key === 'agent_model') newConfig.model = item.value
                    if (item.key === 'agent_sarcasm_level') newConfig.sarcasm_level = parseInt(item.value)
                    if (item.key === 'agent_instructions') newConfig.instructions = item.value
                })
                setConfig(newConfig)
            }
        } catch (error) {
            console.error('Error fetching config:', error)
            // toast.error('Erro ao carregar configurações') // Suppress for now as table might not exist
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            const updates = [
                { key: 'agent_model', value: config.model },
                { key: 'agent_sarcasm_level', value: config.sarcasm_level.toString() },
                { key: 'agent_instructions', value: config.instructions }
            ]

            const { error } = await supabase
                .from('app_config')
                .upsert(updates)

            if (error) throw error

            toast.success('Configurações salvas com sucesso!')
        } catch (error) {
            console.error('Error saving config:', error)
            toast.error('Erro ao salvar configurações')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        )
    }

    return (
        <div className="h-full bg-zinc-50 p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Configurações do Agente</h1>
                    <p className="mt-1 text-sm text-zinc-600">
                        Personalize o comportamento e a inteligência do Jacupemba AI
                    </p>
                </div>

                <div className="grid gap-6 rounded-xl bg-white p-6 border border-zinc-200 shadow-sm">

                    {/* Model Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                            <Cpu className="h-5 w-5 text-purple-600" />
                            <h2 className="text-lg font-semibold text-zinc-900">Modelo de IA</h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {['gpt-4o', 'gpt-4o-mini', 'grok-3-mini-fast'].map((model) => (
                                <button
                                    key={model}
                                    onClick={() => setConfig({ ...config, model })}
                                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${config.model === model
                                            ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                                            : 'border-zinc-200 hover:bg-zinc-50'
                                        }`}
                                >
                                    <div className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${config.model === model ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
                                        }`}>
                                        {config.model === model && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                    </div>
                                    <div>
                                        <span className="block font-medium text-zinc-900">{model}</span>
                                        <span className="text-xs text-zinc-500">
                                            {model === 'gpt-4o' ? 'Mais inteligente e capaz' : model === 'gpt-4o-mini' ? 'Rápido e eficiente' : 'Experimental'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Personality */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                            <Sparkles className="h-5 w-5 text-yellow-600" />
                            <h2 className="text-lg font-semibold text-zinc-900">Personalidade</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <label className="font-medium text-zinc-700">Nível de Sarcasmo</label>
                                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-bold text-zinc-900">
                                        {config.sarcasm_level}/10
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={config.sarcasm_level}
                                    onChange={(e) => setConfig({ ...config, sarcasm_level: parseInt(e.target.value) })}
                                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-zinc-900"
                                />
                                <div className="mt-2 flex justify-between text-xs text-zinc-500">
                                    <span>Neutro (0)</span>
                                    <span>Extremamente Sarcástico (10)</span>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block font-medium text-zinc-700">
                                    Instruções Adicionais (System Prompt)
                                </label>
                                <textarea
                                    value={config.instructions}
                                    onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
                                    placeholder="Ex: Responda sempre com gírias locais..."
                                    rows={4}
                                    className="w-full rounded-lg border border-zinc-300 p-3 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                />
                                <p className="mt-1 text-xs text-zinc-500">
                                    Essas instruções serão adicionadas ao prompt do sistema do agente.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-70"
                        >
                            {saving ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5" />
                            )}
                            Salvar Alterações
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
