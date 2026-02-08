'use client'

import { useState, useEffect } from 'react'
import { Save, Bot, Sparkles, Cpu, Loader2, MessageSquare, Zap, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface AgentConfig {
    model: string
    sarcasm_level: number
    instructions: string
}

export function AgentSettingsSection() {
    const [config, setConfig] = useState<AgentConfig>({
        model: 'gpt-4o',
        sarcasm_level: 2,
        instructions: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [preview, setPreview] = useState('')

    const models = [
        {
            id: 'gpt-4o',
            name: 'GPT-4o',
            desc: 'Mais inteligente e capaz',
            icon: Zap
        },
        {
            id: 'claude-3-5-sonnet',
            name: 'Claude 3.5 Sonnet',
            desc: 'Equilibrado e natural',
            icon: Bot
        },
        {
            id: 'gpt-5-preview',
            name: 'GPT-5 (Preview)',
            desc: 'Máxima inteligência (Beta)',
            icon: Sparkles
        },
        {
            id: 'grok-4-1',
            name: 'Grok 4.1',
            desc: 'Sem filtros, humor ácido',
            icon: Cpu
        }
    ]

    useEffect(() => {
        fetchConfig()
    }, [])

    useEffect(() => {
        generatePreview()
    }, [config])

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
        } finally {
            setLoading(false)
        }
    }

    const generatePreview = () => {
        const level = config.sarcasm_level
        let text = ''

        if (level < 3) {
            text = "Olá! Claro, posso te ajudar com isso. O que você precisa saber sobre Jacupemba?"
        } else if (level < 7) {
            text = "Ah, Jacupemba... O lugar onde o vento faz a curva e o nada acontece. Mas diz aí, o que você quer?"
        } else {
            text = "Olha só quem apareceu. Espero que não seja outra pergunta óbvia sobre a previsão do tempo. Fala logo."
        }

        if (config.model === 'grok-4-1') {
            text += " (E não me venha com choramingos.)"
        }

        if (config.instructions.length > 0) {
            text += ` [Incluindo contexto personalizado: "${config.instructions.substring(0, 20)}..."]`
        }

        setPreview(text)
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
            <div className="mx-auto max-w-5xl space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Configurações do Agente</h1>
                    <p className="mt-1 text-sm text-zinc-600">
                        Personalize o comportamento e a inteligência do Jacupemba AI
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left Column - Settings */}
                    <div className="space-y-6">
                        <div className="rounded-xl bg-white p-6 border border-zinc-200 shadow-sm space-y-6">
                            {/* Model Selection */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                                    <Cpu className="h-5 w-5 text-purple-600" />
                                    <h2 className="text-lg font-semibold text-zinc-900">Modelo de IA</h2>
                                </div>

                                <div className="space-y-3">
                                    {models.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setConfig({ ...config, model: m.id })}
                                            className={`flex w-full items-center gap-4 rounded-xl border p-4 transition-all ${config.model === m.id
                                                ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                                                : 'border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
                                                }`}
                                        >
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.model === m.id ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                                                }`}>
                                                <m.icon className="h-5 w-5" />
                                            </div>
                                            <div className="text-left flex-1">
                                                <p className="font-medium text-zinc-900">{m.name}</p>
                                                <p className="text-xs text-zinc-500">{m.desc}</p>
                                            </div>
                                            <div className={`h-4 w-4 rounded-full border ${config.model === m.id ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
                                                }`}>
                                                {config.model === m.id && <div className="m-1 h-1.5 w-1.5 rounded-full bg-white" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Personality */}
                            <div className="space-y-4 pt-4 border-t border-zinc-100">
                                <div className="flex items-center gap-2 pb-2">
                                    <Sparkles className="h-5 w-5 text-yellow-600" />
                                    <h2 className="text-lg font-semibold text-zinc-900">Personalidade</h2>
                                </div>

                                <div>
                                    <div className="mb-4 flex items-center justify-between">
                                        <label className="font-medium text-zinc-700">Nível de Sarcasmo</label>
                                        <span className={`rounded-full px-3 py-1 text-sm font-bold ${config.sarcasm_level > 7 ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-900'
                                            }`}>
                                            {config.sarcasm_level > 9 ? 'TÓXICO' : `${config.sarcasm_level}/10`}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="1"
                                        value={config.sarcasm_level}
                                        onChange={(e) => setConfig({ ...config, sarcasm_level: parseInt(e.target.value) })}
                                        className={`h-2 w-full cursor-pointer appearance-none rounded-lg accent-zinc-900 ${config.sarcasm_level > 7 ? 'bg-red-200' : 'bg-zinc-200'}`}
                                    />
                                    <div className="mt-2 flex justify-between text-xs text-zinc-500">
                                        <span>Educado</span>
                                        <span>Brincalhão</span>
                                        <span className={config.sarcasm_level > 7 ? 'text-red-500 font-bold' : ''}>Agressivo</span>
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
                                        {preview}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-2 text-xs text-zinc-400">
                                <AlertTriangle className="h-3 w-3" />
                                <span>A resposta real pode variar dependendo do contexto.</span>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="rounded-xl bg-white p-6 border border-zinc-200 shadow-sm">
                            <label className="mb-2 block font-medium text-zinc-700">
                                Instruções do Sistema (System Prompt)
                            </label>
                            <textarea
                                value={config.instructions}
                                onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
                                placeholder="Defina regras específicas de comportamento, gírias obrigatórias ou tópicos proibidos..."
                                rows={6}
                                className="w-full rounded-lg border border-zinc-300 p-3 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                            <p className="mt-2 text-xs text-zinc-500">
                                Essas instruções têm prioridade sobre a personalidade padrão.
                            </p>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-4 font-bold text-white transition-all hover:bg-zinc-800 disabled:opacity-70 hover:scale-[1.02] active:scale-[0.98]"
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
