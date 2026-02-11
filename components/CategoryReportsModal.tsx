'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquare, ChevronLeft, Heart, Send, Loader2, Clock, Trash2, Medal } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Report, ReportComment } from '@/lib/supabase'
import { getUserFingerprint } from '@/lib/fingerprint'

type ReportWithExtras = Report & {
    comments?: Array<{ id: string; text: string; created_at: string }>
    likes?: number
}

interface CategoryModalProps {
    category: string
    categoryLabel: string
    isOpen: boolean
    onClose: () => void
    period?: '60min' | '24h' | '7days'
}

/**
 * Modal para exibir relatos filtrados por categoria específica
 * Permite interações inline: comentários, likes e delete
 */
export function CategoryReportsModal({ category, categoryLabel, isOpen, onClose, period = '7days' }: CategoryModalProps) {
    const [reports, setReports] = useState<ReportWithExtras[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedReportId, setExpandedReportId] = useState<string | null>(null)

    // Estados de comentários
    const [comments, setComments] = useState<Record<string, ReportComment[]>>({})
    const [commentText, setCommentText] = useState<Record<string, string>>({})
    const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({})

    // Estados de likes
    const [userLikedReports, setUserLikedReports] = useState<Set<string>>(new Set())
    const [reportLikeCounts, setReportLikeCounts] = useState<Record<string, number>>({})
    const [userLikedComments, setUserLikedComments] = useState<Set<string>>(new Set())
    const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({})

    // Fingerprint
    const [userFingerprint, setUserFingerprint] = useState('')
    
    // Embaixadores
    const [ambassadorFingerprints, setAmbassadorFingerprints] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (isOpen && category) {
            fetchReportsByCategory()
            loadAmbassadors()
        }
    }, [isOpen, category])
    
    const loadAmbassadors = () => {
        try {
            const saved = localStorage.getItem('jacupemba-ambassadors')
            if (saved) {
                setAmbassadorFingerprints(new Set(JSON.parse(saved)))
            }
        } catch (error) {
            console.error('Error loading ambassadors:', error)
        }
    }

    const fetchReportsByCategory = async () => {
        try {
            setIsLoading(true)

            // Calcular cutoff time baseado no período
            const now = Date.now()
            const cutoffTime = period === '60min'
                ? new Date(now - 60 * 60 * 1000)
                : period === '24h'
                    ? new Date(now - 24 * 60 * 60 * 1000)
                    : new Date(now - 7 * 24 * 60 * 60 * 1000)

            // Buscar relatos da categoria específica
            const { data: reportsData, error } = await supabase
                .from('anonymous_reports')
                .select(`
          id,
          category,
          text,
          status,
          fingerprint,
          created_at
        `)
                .eq('category', category)
                .eq('status', 'aprovado')
                .gte('created_at', cutoffTime.toISOString())
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error

            console.log('🔍 CategoryModal Debug:', {
                category,
                period,
                cutoffTime: cutoffTime.toISOString(),
                totalReports: reportsData?.length || 0,
                reports: reportsData
            })

            // Buscar comentários e curtidas para cada relato
            const reportsWithExtras = await Promise.all(
                (reportsData || []).map(async (report) => {
                    const [commentsRes, likesRes] = await Promise.all([
                        supabase
                            .from('report_comments')
                            .select('id, text, created_at')
                            .eq('report_id', report.id)
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('report_likes')
                            .select('id')
                            .eq('report_id', report.id)
                    ])

                    return {
                        ...report,
                        comments: commentsRes.data || [],
                        likes: likesRes.data?.length || 0
                    }
                })
            )

            setReports(reportsWithExtras)
        } catch (error) {
            console.error('Error fetching category reports:', error)
            setReports([])
        } finally {
            setIsLoading(false)
        }
    }

    const formatTimeAgo = (dateString: string): string => {
        const now = new Date()
        const date = new Date(dateString)
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return 'Agora'
        if (diffMins < 60) return `${diffMins}min atrás`
        if (diffHours < 24) return `${diffHours}h atrás`
        if (diffDays === 1) return 'Ontem'
        if (diffDays < 7) return `${diffDays} dias atrás`
        return date.toLocaleDateString('pt-BR')
    }

    // Inicializar fingerprint
    useEffect(() => {
        const initFingerprint = async () => {
            const fp = await getUserFingerprint()
            setUserFingerprint(fp)
        }
        initFingerprint()
    }, [])

    // Expandir/Colapsar relato
    const handleReportClick = async (reportId: string) => {
        if (expandedReportId === reportId) {
            setExpandedReportId(null)
        } else {
            setExpandedReportId(reportId)
            await fetchCommentsAndLikes(reportId)
        }
    }

    // Buscar comentários e likes de um relato
    const fetchCommentsAndLikes = async (reportId: string) => {
        try {
            const [commentsRes, reportLikesRes, commentLikesRes] = await Promise.all([
                supabase.from('report_comments').select('*').eq('report_id', reportId).order('created_at', { ascending: true }),
                supabase.from('report_likes').select('*').eq('report_id', reportId),
                supabase.from('comment_likes').select('*')
            ])

            setComments(prev => ({ ...prev, [reportId]: commentsRes.data || [] }))
            setReportLikeCounts(prev => ({ ...prev, [reportId]: reportLikesRes.data?.length || 0 }))

            const userReportLikes = reportLikesRes.data?.filter(l => l.fingerprint === userFingerprint) || []
            const userCommentLikes = commentLikesRes.data?.filter(l => l.fingerprint === userFingerprint) || []

            setUserLikedReports(prev => {
                const newSet = new Set(prev)
                if (userReportLikes.length > 0) newSet.add(reportId)
                return newSet
            })

            setUserLikedComments(new Set(userCommentLikes.map(l => l.comment_id)))

            const commentCountsMap: Record<string, number> = {}
            commentLikesRes.data?.forEach(like => {
                commentCountsMap[like.comment_id] = (commentCountsMap[like.comment_id] || 0) + 1
            })
            setCommentLikeCounts(prev => ({ ...prev, ...commentCountsMap }))
        } catch (error) {
            console.error('Error fetching comments/likes:', error)
        }
    }

    // Toggle like em relato
    const toggleReportLike = async (reportId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const isLiked = userLikedReports.has(reportId)

        try {
            if (isLiked) {
                await supabase.from('report_likes').delete().eq('report_id', reportId).eq('fingerprint', userFingerprint)
                setUserLikedReports(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(reportId)
                    return newSet
                })
                setReportLikeCounts(prev => ({ ...prev, [reportId]: Math.max(0, (prev[reportId] || 0) - 1) }))
            } else {
                await supabase.from('report_likes').insert({ report_id: reportId, fingerprint: userFingerprint })
                setUserLikedReports(prev => new Set([...prev, reportId]))
                setReportLikeCounts(prev => ({ ...prev, [reportId]: (prev[reportId] || 0) + 1 }))
            }
        } catch (error) {
            console.error('Error toggling report like:', error)
        }
    }

    // Toggle like em comentário
    const toggleCommentLike = async (commentId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const isLiked = userLikedComments.has(commentId)

        try {
            if (isLiked) {
                await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('fingerprint', userFingerprint)
                setUserLikedComments(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(commentId)
                    return newSet
                })
                setCommentLikeCounts(prev => ({ ...prev, [commentId]: Math.max(0, (prev[commentId] || 0) - 1) }))
            } else {
                await supabase.from('comment_likes').insert({ comment_id: commentId, fingerprint: userFingerprint })
                setUserLikedComments(prev => new Set([...prev, commentId]))
                setCommentLikeCounts(prev => ({ ...prev, [commentId]: (prev[commentId] || 0) + 1 }))
            }
        } catch (error) {
            console.error('Error toggling comment like:', error)
        }
    }

    // Adicionar comentário
    const handleSubmitComment = async (reportId: string) => {
        const text = commentText[reportId]?.trim()
        if (!text) return

        try {
            setSubmittingComment(prev => ({ ...prev, [reportId]: true }))
            await supabase.from('report_comments').insert({ report_id: reportId, text, fingerprint: userFingerprint })

            setCommentText(prev => ({ ...prev, [reportId]: '' }))
            await fetchCommentsAndLikes(reportId)
        } catch (error) {
            console.error('Error submitting comment:', error)
        } finally {
            setSubmittingComment(prev => ({ ...prev, [reportId]: false }))
        }
    }

    // Deletar relato
    const deleteReport = async (reportId: string, reportFingerprint: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (reportFingerprint !== userFingerprint) return
        if (!confirm('Tem certeza que deseja deletar este relato?')) return

        try {
            await supabase.from('anonymous_reports').delete().eq('id', reportId).eq('fingerprint', userFingerprint)
            setReports(prev => prev.filter(r => r.id !== reportId))
            setExpandedReportId(null)
        } catch (error) {
            console.error('Error deleting report:', error)
        }
    }

    // Deletar comentário
    const deleteComment = async (commentId: string, commentFingerprint: string, reportId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (commentFingerprint !== userFingerprint) return
        if (!confirm('Tem certeza que deseja deletar este comentário?')) return

        try {
            await supabase.from('report_comments').delete().eq('id', commentId).eq('fingerprint', userFingerprint)
            await fetchCommentsAndLikes(reportId)
        } catch (error) {
            console.error('Error deleting comment:', error)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
            <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-4 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {categoryLabel}
                            </h2>
                            <p className="text-sm text-zinc-400">
                                {reports.length} {reports.length === 1 ? 'relato encontrado' : 'relatos encontrados'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-zinc-400"></div>
                                <p className="text-sm text-zinc-400">Carregando relatos...</p>
                            </div>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <MessageSquare className="h-12 w-12 text-zinc-600 mb-3" />
                            <h3 className="font-medium text-zinc-100 mb-1">
                                Nenhum relato ainda
                            </h3>
                            <p className="text-sm text-zinc-400">
                                Seja o primeiro a contribuir nesta categoria
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reports.map((report) => {
                                const isExpanded = expandedReportId === report.id
                                const reportComments = comments[report.id] || []
                                const isAmbassador = ambassadorFingerprints.has(report.fingerprint)

                                return (
                                    <div
                                        key={report.id}
                                        className={`rounded-lg border transition-all hover:border-zinc-600 ${
                                            isAmbassador 
                                                ? 'border-amber-500/50 bg-gradient-to-br from-amber-900/20 to-amber-800/10 shadow-lg'
                                                : 'border-zinc-700 bg-zinc-800'
                                        }`}
                                    >
                                        {/* Card principal - sempre visível */}
                                        <div
                                            onClick={() => handleReportClick(report.id)}
                                            className="p-4 cursor-pointer"
                                        >
                                            <p className="text-zinc-200 leading-relaxed mb-3">
                                                {report.text}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-xs text-zinc-400">
                                                    {isAmbassador && (
                                                        <span className="flex items-center gap-1 text-amber-400 font-medium">
                                                            <Medal className="h-3.5 w-3.5" />
                                                            Embaixador
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {formatTimeAgo(report.created_at)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        ❤️ {reportLikeCounts[report.id] || report.likes || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        💬 {reportComments.length || report.comments?.length || 0}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => toggleReportLike(report.id, e)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs ${userLikedReports.has(report.id)
                                                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                            : 'bg-zinc-700 text-zinc-400 border border-zinc-600 hover:border-red-500/30 hover:text-red-500'
                                                            }`}
                                                    >
                                                        <Heart className={`h-3.5 w-3.5 ${userLikedReports.has(report.id) ? 'fill-current' : ''}`} />
                                                    </button>

                                                    {report.fingerprint === userFingerprint && (
                                                        <button
                                                            onClick={(e) => deleteReport(report.id, report.fingerprint, e)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors bg-zinc-700 text-zinc-400 border border-zinc-600 hover:border-red-600/50 hover:text-red-600 text-xs"
                                                            title="Deletar relato"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Seção expandida - comentários */}
                                        {isExpanded && (
                                            <div className="border-t border-zinc-700 p-4 space-y-4 bg-zinc-850">
                                                <h4 className="text-sm font-semibold text-zinc-400">
                                                    Comentários ({reportComments.length})
                                                </h4>

                                                {reportComments.map((comment) => (
                                                    <div key={comment.id} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="text-xs text-zinc-500">
                                                                {formatTimeAgo(comment.created_at)}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => toggleCommentLike(comment.id, e)}
                                                                    className={`flex items-center gap-1 text-xs transition-colors ${userLikedComments.has(comment.id)
                                                                        ? 'text-red-500'
                                                                        : 'text-zinc-500 hover:text-red-500'
                                                                        }`}
                                                                >
                                                                    <Heart className={`h-3.5 w-3.5 ${userLikedComments.has(comment.id) ? 'fill-current' : ''}`} />
                                                                    <span className="font-medium">{commentLikeCounts[comment.id] || 0}</span>
                                                                </button>

                                                                {comment.fingerprint === userFingerprint && (
                                                                    <button
                                                                        onClick={(e) => deleteComment(comment.id, comment.fingerprint, report.id, e)}
                                                                        className="flex items-center gap-1 text-xs transition-colors text-zinc-500 hover:text-red-600"
                                                                        title="Deletar comentário"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-zinc-300 leading-relaxed">{comment.text}</p>
                                                    </div>
                                                ))}

                                                {/* Campo para novo comentário */}
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Adicione um comentário anônimo..."
                                                        value={commentText[report.id] || ''}
                                                        onChange={(e) => setCommentText(prev => ({ ...prev, [report.id]: e.target.value }))}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault()
                                                                handleSubmitComment(report.id)
                                                            }
                                                        }}
                                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                                                    />
                                                    <button
                                                        onClick={() => handleSubmitComment(report.id)}
                                                        disabled={!commentText[report.id]?.trim() || submittingComment[report.id]}
                                                        className="bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                                    >
                                                        {submittingComment[report.id] ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Send className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
