'use client'

// Feed de relatos do bairro com sistema de comentarios anonimos
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Report, ReportComment } from '@/lib/supabase'
import { getUserFingerprint } from '@/lib/fingerprint'
import {
  MessageSquare,
  Clock,
  X,
  Send,
  Loader2,
  Shield,
  AlertCircle,
  Activity,
  TrafficCone,
  Droplets,
  Lightbulb,
  Users,
  PawPrint,
  CalendarDays,
  Store,
  Bus,
  MapPin,
  Heart,
  Share2
} from 'lucide-react'

type TimePeriod = '60min' | '24h' | '7d'

const CATEGORY_INFO = {
  'seguranca': { label: 'Seguranca', icon: Shield, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  'emergencia': { label: 'Emergencia', icon: AlertCircle, color: 'bg-red-50 text-red-700 border-red-200' },
  'saude': { label: 'Saude', icon: Activity, color: 'bg-sky-50 text-sky-700 border-sky-200' },
  'transito': { label: 'Transito', icon: TrafficCone, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'saneamento': { label: 'Saneamento', icon: Droplets, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'iluminacao': { label: 'Iluminacao', icon: Lightbulb, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  'convivencia': { label: 'Comunidade', icon: Users, color: 'bg-violet-50 text-violet-700 border-violet-200' },
  'animais': { label: 'Animais', icon: PawPrint, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'eventos': { label: 'Eventos', icon: CalendarDays, color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  'comercio': { label: 'Comercio', icon: Store, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'transporte': { label: 'Transporte', icon: Bus, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  'outros': { label: 'Outros', icon: MapPin, color: 'bg-slate-50 text-slate-700 border-slate-200' },
}

export function FeedRelatos() {
  const [period, setPeriod] = useState<TimePeriod>('24h')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [comments, setComments] = useState<ReportComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const reportsListRef = useRef<HTMLDivElement>(null)

  // Likes state
  const [reportLikeCounts, setReportLikeCounts] = useState<Record<string, number>>({})
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({})
  const [userLikedReports, setUserLikedReports] = useState<Set<string>>(new Set())
  const [userLikedComments, setUserLikedComments] = useState<Set<string>>(new Set())
  const [userFingerprint, setUserFingerprint] = useState<string>('')

  const getCatInfo = (cat: string) => CATEGORY_INFO[cat as keyof typeof CATEGORY_INFO] || CATEGORY_INFO.outros

  useEffect(() => {
    // Initialize user fingerprint
    setUserFingerprint(getUserFingerprint())
  }, [])

  useEffect(() => {
    if (userFingerprint) {
      fetchReports()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedCategory, userFingerprint])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const now = Date.now()
      const cutoffTime = period === '60min'
        ? new Date(now - 60 * 60 * 1000)
        : period === '24h'
          ? new Date(now - 24 * 60 * 60 * 1000)
          : new Date(now - 7 * 24 * 60 * 60 * 1000)

      let query = supabase
        .from('anonymous_reports')
        .select('*')
        .eq('status', 'aprovado')
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false })

      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (!error && data) {
        setReports(data)

        const counts: Record<string, number> = {}
        Object.keys(CATEGORY_INFO).forEach(cat => counts[cat] = 0)
        data.forEach(report => {
          counts[report.category] = (counts[report.category] || 0) + 1
        })
        setCategoryCounts(counts)

        const reportIds = data.map(r => r.id)
        if (reportIds.length > 0) {
          // Fetch comment counts
          const { data: commentsData } = await supabase
            .from('report_comments')
            .select('report_id')
            .in('report_id', reportIds)

          const commentCountsMap: Record<string, number> = {}
          commentsData?.forEach(comment => {
            commentCountsMap[comment.report_id] = (commentCountsMap[comment.report_id] || 0) + 1
          })
          setCommentCounts(commentCountsMap)

          // Fetch like counts for reports
          const { data: likesData } = await supabase
            .from('report_likes')
            .select('report_id')
            .in('report_id', reportIds)

          const likeCountsMap: Record<string, number> = {}
          likesData?.forEach(like => {
            likeCountsMap[like.report_id] = (likeCountsMap[like.report_id] || 0) + 1
          })
          setReportLikeCounts(likeCountsMap)

          // Fetch user's liked reports
          if (userFingerprint) {
            const { data: userLikesData } = await supabase
              .from('report_likes')
              .select('report_id')
              .in('report_id', reportIds)
              .eq('fingerprint', userFingerprint)

            setUserLikedReports(new Set(userLikesData?.map(l => l.report_id) || []))
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar relatos:', err)
    } finally {
      setLoading(false)
    }
  }

  const openReportModal = async (report: Report) => {
    setSelectedReport(report)
    setCommentText('')

    const { data } = await supabase
      .from('report_comments')
      .select('*')
      .eq('report_id', report.id)
      .order('created_at', { ascending: true })

    setComments(data || [])

    // Fetch comment likes
    if (data && data.length > 0) {
      const commentIds = data.map(c => c.id)

      // Fetch like counts for comments
      const { data: commentLikesData } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .in('comment_id', commentIds)

      const commentLikeCountsMap: Record<string, number> = {}
      commentLikesData?.forEach(like => {
        commentLikeCountsMap[like.comment_id] = (commentLikeCountsMap[like.comment_id] || 0) + 1
      })
      setCommentLikeCounts(commentLikeCountsMap)

      // Fetch user's liked comments
      if (userFingerprint) {
        const { data: userCommentLikesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .in('comment_id', commentIds)
          .eq('fingerprint', userFingerprint)

        setUserLikedComments(new Set(userCommentLikesData?.map(l => l.comment_id) || []))
      }
    }
  }

  const toggleReportLike = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!userFingerprint) return

    const isLiked = userLikedReports.has(reportId)

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('report_likes')
          .delete()
          .eq('report_id', reportId)
          .eq('fingerprint', userFingerprint)

        setUserLikedReports(prev => {
          const newSet = new Set(prev)
          newSet.delete(reportId)
          return newSet
        })
        setReportLikeCounts(prev => ({
          ...prev,
          [reportId]: Math.max(0, (prev[reportId] || 0) - 1)
        }))
      } else {
        // Like
        await supabase
          .from('report_likes')
          .insert({
            report_id: reportId,
            fingerprint: userFingerprint
          })

        setUserLikedReports(prev => new Set([...prev, reportId]))
        setReportLikeCounts(prev => ({
          ...prev,
          [reportId]: (prev[reportId] || 0) + 1
        }))
      }
    } catch (error) {
      console.error('Error toggling report like:', error)
    }
  }

  const toggleCommentLike = async (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!userFingerprint) return

    const isLiked = userLikedComments.has(commentId)

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('fingerprint', userFingerprint)

        setUserLikedComments(prev => {
          const newSet = new Set(prev)
          newSet.delete(commentId)
          return newSet
        })
        setCommentLikeCounts(prev => ({
          ...prev,
          [commentId]: Math.max(0, (prev[commentId] || 0) - 1)
        }))
      } else {
        // Like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            fingerprint: userFingerprint
          })

        setUserLikedComments(prev => new Set([...prev, commentId]))
        setCommentLikeCounts(prev => ({
          ...prev,
          [commentId]: (prev[commentId] || 0) + 1
        }))
      }
    } catch (error) {
      console.error('Error toggling comment like:', error)
    }
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !selectedReport) return

    try {
      setSubmittingComment(true)
      const { error } = await supabase
        .from('report_comments')
        .insert({
          report_id: selectedReport.id,
          text: commentText.trim()
        })

      if (!error) {
        setCommentText('')
        const { data } = await supabase
          .from('report_comments')
          .select('*')
          .eq('report_id', selectedReport.id)
          .order('created_at', { ascending: true })

        setComments(data || [])
        setCommentCounts(prev => ({
          ...prev,
          [selectedReport.id]: (prev[selectedReport.id] || 0) + 1
        }))

        // Reset comment likes for new comments
        if (data && data.length > 0) {
          const commentIds = data.map(c => c.id)

          const { data: commentLikesData } = await supabase
            .from('comment_likes')
            .select('comment_id')
            .in('comment_id', commentIds)

          const commentLikeCountsMap: Record<string, number> = {}
          commentLikesData?.forEach(like => {
            commentLikeCountsMap[like.comment_id] = (commentLikeCountsMap[like.comment_id] || 0) + 1
          })
          setCommentLikeCounts(commentLikeCountsMap)

          if (userFingerprint) {
            const { data: userCommentLikesData } = await supabase
              .from('comment_likes')
              .select('comment_id')
              .in('comment_id', commentIds)
              .eq('fingerprint', userFingerprint)

            setUserLikedComments(new Set(userCommentLikesData?.map(l => l.comment_id) || []))
          }
        }
      }
    } catch (err) {
      console.error('Erro ao adicionar comentario:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d atras`
    if (hours > 0) return `${hours}h atras`
    return `${minutes}m atras`
  }

  const handleShareReport = (report: Report, e: React.MouseEvent) => {
    e.stopPropagation()
    const catLabel = getCatInfo(report.category).label
    const text = `[Relato - ${catLabel}]\n${report.text}\n\nVia Assistente Local Jacupemba`
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  const periods: { value: TimePeriod; label: string }[] = [
    { value: '60min', label: 'Ultima Hora' },
    { value: '24h', label: 'Hoje' },
    { value: '7d', label: 'Ultimos 7 Dias' }
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">Pulso do Bairro</h2>
          <div className="flex gap-2">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${period === p.value
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {Object.entries(CATEGORY_INFO).map(([key, info]) => {
            const Icon = info.icon
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedCategory(selectedCategory === key ? null : key)
                  if (reportsListRef.current) {
                    reportsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${selectedCategory === key
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg scale-105'
                  : 'border-zinc-200 bg-white hover:border-zinc-400 hover:shadow-md'
                  }`}
              >
                <div className="text-center">
                  <Icon className="h-7 w-7 mx-auto mb-2" />
                  <div className="text-xs font-semibold mb-2">{info.label}</div>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedCategory === key ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-700'
                    }`}>
                    {categoryCounts[key] || 0}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto" ref={reportsListRef}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            Nenhum relato encontrado neste periodo
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => {
              const Icon = getCatInfo(report.category).icon
              return (
                <div
                  key={report.id}
                  onClick={() => openReportModal(report)}
                  className="bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-400 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getCatInfo(report.category).color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {getCatInfo(report.category).label}
                    </span>
                    <div className="flex items-center gap-1 text-zinc-400 text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{getTimeAgo(report.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-zinc-700 leading-relaxed mb-3">{report.text}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-zinc-500">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm font-medium">{commentCounts[report.id] || 0}</span>
                    </div>
                    <button
                      onClick={(e) => toggleReportLike(report.id, e)}
                      className={`flex items-center gap-1 transition-colors ${userLikedReports.has(report.id)
                        ? 'text-red-500'
                        : 'text-zinc-500 hover:text-red-500'
                        }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${userLikedReports.has(report.id) ? 'fill-current' : ''}`}
                      />
                      <span className="text-sm font-medium">{reportLikeCounts[report.id] || 0}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
          <div className="bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-zinc-900 p-5 border-b border-zinc-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">Relato</h2>
                {(() => {
                  const Icon = getCatInfo(selectedReport.category).icon
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getCatInfo(selectedReport.category).color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {getCatInfo(selectedReport.category).label}
                    </span>
                  )
                })()}
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors duration-200"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="pb-5 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Clock className="h-4 w-4" />
                    <span>{getTimeAgo(selectedReport.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleReportLike(selectedReport.id, e)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${userLikedReports.has(selectedReport.id)
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-red-500/30 hover:text-red-500'
                        }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${userLikedReports.has(selectedReport.id) ? 'fill-current' : ''}`}
                      />
                      <span className="text-sm font-semibold">{reportLikeCounts[selectedReport.id] || 0}</span>
                    </button>
                  </div>
                </div>
                <p className="text-zinc-300 leading-relaxed text-lg">{selectedReport.text}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400">
                  Comentarios ({comments.length})
                </h3>
                {comments.map(comment => (
                  <div key={comment.id} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800 transition-colors duration-200 hover:bg-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-zinc-500">
                        {getTimeAgo(comment.created_at)}
                      </div>
                      <button
                        onClick={(e) => toggleCommentLike(comment.id, e)}
                        className={`flex items-center gap-1 text-xs transition-colors ${userLikedComments.has(comment.id)
                          ? 'text-red-500'
                          : 'text-zinc-500 hover:text-red-500'
                          }`}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${userLikedComments.has(comment.id) ? 'fill-current' : ''}`}
                        />
                        <span className="font-medium">{commentLikeCounts[comment.id] || 0}</span>
                      </button>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{comment.text}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Adicione um comentario anonimo..."
                  className="w-full min-h-[80px] p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent resize-none transition-all duration-200 text-sm"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-zinc-900 font-semibold rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {submittingComment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Comentar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

