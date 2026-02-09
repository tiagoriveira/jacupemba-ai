'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, Building2, Store, MessageSquare, Share2, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ReportSummaryModalProps {
    isOpen: boolean
    onClose: () => void
}

interface MonthlyStats {
    totalReports: number
    totalBusinesses: number
    totalVitrinePosts: number
    topCategories: Array<{ category: string; count: number }>
    reportsGrowth: number
}

/**
 * Modal para exibir relatório mensal do bairro
 * Estatísticas para compartilhamento público e transparência
 */
export function ReportSummaryModal({ isOpen, onClose }: ReportSummaryModalProps) {
    const [stats, setStats] = useState<MonthlyStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (isOpen) {
            fetchMonthlyStats()
        }
    }, [isOpen])

    const fetchMonthlyStats = async () => {
        try {
            setIsLoading(true)

            // Data range: últimos 30 dias
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

            // Data range: 30-60 dias atrás (para comparação)
            const sixtyDaysAgo = new Date()
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
            const sixtyDaysAgoISO = sixtyDaysAgo.toISOString()

            // Buscar relatos (últimos 30 dias)
            const { data: recentReports, error: reportsError } = await supabase
                .from('anonymous_reports')
                .select('category, created_at')
                .eq('status', 'aprovado')
                .gte('created_at', thirtyDaysAgoISO)

            if (reportsError) throw reportsError

            // Buscar relatos (30-60 dias atrás para comparação)
            const { data: previousReports } = await supabase
                .from('anonymous_reports')
                .select('id')
                .eq('status', 'aprovado')
                .gte('created_at', sixtyDaysAgoISO)
                .lt('created_at', thirtyDaysAgoISO)

            // Calcular top categorias
            const categoryCounts: Record<string, number> = {}
            recentReports?.forEach((report) => {
                if (report.category) {
                    categoryCounts[report.category] = (categoryCounts[report.category] || 0) + 1
                }
            })

            const topCategories = Object.entries(categoryCounts)
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)

            // Buscar total de empresas
            const { data: businesses, error: businessError } = await supabase
                .from('local_businesses')
                .select('id')
                .eq('status', 'aprovado')

            if (businessError) throw businessError

            // Buscar posts da vitrine aprovados
            const { data: vitrinePosts, error: vitrineError } = await supabase
                .from('vitrine_posts')
                .select('id')
                .eq('status', 'aprovado')

            if (vitrineError) throw vitrineError

            // Calcular crescimento
            const currentCount = recentReports?.length || 0
            const previousCount = previousReports?.length || 0
            const growth = previousCount > 0
                ? Math.round(((currentCount - previousCount) / previousCount) * 100)
                : 100

            setStats({
                totalReports: currentCount,
                totalBusinesses: businesses?.length || 0,
                totalVitrinePosts: vitrinePosts?.length || 0,
                topCategories,
                reportsGrowth: growth
            })
        } catch (error) {
            console.error('Error fetching monthly stats:', error)
            toast.error('Erro ao carregar estatísticas')
        } finally {
            setIsLoading(false)
        }
    }

    const handleShare = () => {
        if (!stats) return

        const text = `📊 Relatório Mensal - Jacupemba AI

📝 ${stats.totalReports} relatos da comunidade
🏢 ${stats.totalBusinesses} empresas cadastradas
🛍️ ${stats.totalVitrinePosts} anúncios ativos

📈 Top Categorias:
${stats.topCategories.map((cat, idx) => `${idx + 1}. ${cat.category}: ${cat.count} relatos`).join('\n')}

${stats.reportsGrowth > 0 ? `📈 Crescimento de ${stats.reportsGrowth}% vs mês anterior` : stats.reportsGrowth < 0 ? `📉 Queda de ${Math.abs(stats.reportsGrowth)}% vs mês anterior` : '➡️ Sem mudança vs mês anterior'}

Acesse: https://jacupemba-ai.vercel.app`

        navigator.clipboard.writeText(text)
        toast.success('Relatório copiado para área de transferência!')
    }

    const getCategoryLabel = (category: string): string => {
        const labels: Record<string, string> = {
            'seguranca': 'Segurança',
            'emergencia': 'Emergência',
            'saude': 'Saúde',
            'transito': 'Trânsito',
            'saneamento': 'Saneamento',
            'iluminacao': 'Iluminação',
            'convivencia': 'Comunidade',
            'animais': 'Animais',
            'eventos': 'Eventos',
            'comercio': 'Comércio',
            'transporte': 'Transporte',
            'outros': 'Outros',
        }
        return labels[category] || category
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
            <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            📊 Relatório Mensal
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Últimos 30 dias de atividade
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900"></div>
                                <p className="text-sm text-zinc-500">Gerando relatório...</p>
                            </div>
                        </div>
                    ) : stats ? (
                        <div className="space-y-6">
                            {/* KPIs */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-5 border border-blue-200 dark:border-blue-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                        {stats.reportsGrowth !== 0 && (
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stats.reportsGrowth > 0
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {stats.reportsGrowth > 0 ? '+' : ''}{stats.reportsGrowth}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                                        {stats.totalReports}
                                    </div>
                                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        Relatos da Comunidade
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-700">
                                    <Building2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                                    <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                                        {stats.totalBusinesses}
                                    </div>
                                    <div className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                                        Empresas Cadastradas
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-5 border border-purple-200 dark:border-purple-700">
                                    <Store className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                                        {stats.totalVitrinePosts}
                                    </div>
                                    <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                                        Anúncios Aprovados
                                    </div>
                                </div>
                            </div>

                            {/* Top Categorias - Gráfico CSS */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                        Top 5 Categorias
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {stats.topCategories.map((cat, idx) => {
                                        const maxCount = stats.topCategories[0]?.count || 1
                                        const percentage = (cat.count / maxCount) * 100

                                        return (
                                            <div key={cat.category} className="group">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                            {getCategoryLabel(cat.category)}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                        {cat.count}
                                                    </span>
                                                </div>
                                                <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-zinc-700 to-zinc-900 dark:from-zinc-300 dark:to-zinc-100 rounded-full transition-all duration-500 group-hover:from-zinc-900 group-hover:to-black dark:group-hover:from-zinc-100 dark:group-hover:to-white"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Insights */}
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
                                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
                                    💡 Insight
                                </h3>
                                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                                    {stats.totalReports === 0
                                        ? 'Nenhum relato registrado neste mês. Incentive a comunidade a compartilhar informações!'
                                        : stats.topCategories[0]
                                            ? `A categoria "${getCategoryLabel(stats.topCategories[0].category)}" concentra ${Math.round((stats.topCategories[0].count / stats.totalReports) * 100)}% dos relatos este mês. Isso pode indicar uma demanda por ações nesta área.`
                                            : 'Dados insuficientes para gerar insights.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-zinc-500">
                            Erro ao carregar estatísticas
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                            Fechar
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={!stats}
                            className="flex-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-medium text-white dark:text-zinc-900 transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Share2 className="h-4 w-4" />
                            Compartilhar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
