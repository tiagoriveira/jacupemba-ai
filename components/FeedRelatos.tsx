'use client'

// Feed de relatos do bairro com sistema de comentarios anonimos
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Report, ReportComment } from '@/lib/supabase'
import { getUserFingerprint } from '@/lib/fingerprint'
import { logger } from '@/lib/logger'
import { getApiUrl } from '@/lib/api-config'
import { CategoryReportsModal } from './CategoryReportsModal'
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
  Share2,
  Trash2,
  Medal
} from 'lucide-react'

type TimePeriod = '60min' | '24h' | '7days'

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
  const [reports, setReports] = useState<Report[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [comments, setComments] = useState<ReportComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  // Likes state
  const [reportLikeCounts, setReportLikeCounts] = useState<Record<string, number>>({})
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({})
  const [userLikedReports, setUserLikedReports] = useState<Set<string>>(new Set())
  const [userLikedComments, setUserLikedComments] = useState<Set<string>>(new Set())
  const [userFingerprint, setUserFingerprint] = useState<string>('')

  // Modal de categoria dedicado
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryModalData, setCategoryModalData] = useState<{ category: string; categoryLabel: string } | null>(null)
  
  // Embaixadores
  const [ambassadorFingerprints, setAmbassadorFingerprints] = useState<Set<string>>(new Set())

  const getCatInfo = (cat: string) => CATEGORY_INFO[cat as keyof typeof CATEGORY_INFO] || CATEGORY_INFO.outros

  useEffect(() => {
    // Initialize user fingerprint
    setUserFingerprint(getUserFingerprint())
    loadAmbassadors()
  }, [])
  
  const loadAmbassadors = async () => {
    try {
      const response = await fetch(getApiUrl('/api/ambassadors?status=active'))
      const result = await response.json()
      
      if (result.success && result.data) {
        const fingerprints = new Set<string>(result.data.map((amb: any) => amb.fingerprint as string))
        setAmbassadorFingerprints(fingerprints)
      }
    } catch (error) {
      logger.error('Error loading ambassadors from API:', error)
      // Fallback to localStorage if API fails
      try {
        const saved = localStorage.getItem('jacupemba-ambassadors')
        if (saved) {
          setAmbassadorFingerprints(new Set(JSON.parse(saved)))
        }
      } catch {}
    }
  }

  useEffect(() => {
    if (userFingerprint) {
      fetchReports()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, userFingerprint, ambassadorFingerprints])

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

      const { data, error } = await query

      if (!error && data) {
        // Aplicar ordenacao com boost para embaixadores (24h)
        const sortedData = data.sort((a, b) => {
          const isAmbassadorA = ambassadorFingerprints.has(a.fingerprint)
          const isAmbassadorB = ambassadorFingerprints.has(b.fingerprint)
          
          const createdAtA = new Date(a.created_at).getTime()
          const createdAtB = new Date(b.created_at).getTime()
          const now = Date.now()
          const twentyFourHours = 24 * 60 * 60 * 1000
          
          const isRecentA = (now - createdAtA) < twentyFourHours
          const isRecentB = (now - createdAtB) < twentyFourHours
          
          // Embaixadores recentes (menos de 24h) no topo
          if (isAmbassadorA && isRecentA && !(isAmbassadorB && isRecentB)) return -1
          if (isAmbassadorB && isRecentB && !(isAmbassadorA && isRecentA)) return 1
          
          // Depois, ordenar por data normalmente
          return createdAtB - createdAtA
        })
        
        setReports(sortedData)

        const counts: Record<string, number> = {}
        Object.keys(CATEGORY_INFO).forEach(cat => counts[cat] = 0)
        sortedData.forEach(report => {
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
      logger.error('Erro ao buscar relatos:', err)
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
      logger.error('Error toggling report like:', error)
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
      logger.error('Error toggling comment like:', error)
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
      logger.error('Erro ao adicionar comentario:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const deleteReport = async (reportId: string, reportFingerprint: string) => {
    if (reportFingerprint !== userFingerprint) {
      logger.warn('Você só pode deletar seus próprios relatos')
      return
    }

    if (!confirm('Tem certeza que deseja deletar este relato?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('anonymous_reports')
        .delete()
        .eq('id', reportId)
        .eq('fingerprint', userFingerprint)

      if (!error) {
        setSelectedReport(null)
        fetchReports() // Atualizar lista
      }
    } catch (error) {
      logger.error('Erro ao deletar relato:', error)
    }
  }

  const deleteComment = async (commentId: string, commentFingerprint: string) => {
    if (commentFingerprint !== userFingerprint) {
      logger.warn('Você só pode deletar seus próprios comentários')
      return
    }

    if (!confirm('Tem certeza que deseja deletar este comentário?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('report_comments')
        .delete()
        .eq('id', commentId)
        .eq('fingerprint', userFingerprint)

      if (!error && selectedReport) {
        // Atualizar lista de comentários
        const { data } = await supabase
          .from('report_comments')
          .select('*')
          .eq('report_id', selectedReport.id)
          .order('created_at', { ascending: true })

        setComments(data || [])
        setCommentCounts(prev => ({
          ...prev,
          [selectedReport.id]: Math.max(0, (prev[selectedReport.id] || 0) - 1)
        }))
      }
    } catch (error) {
      logger.error('Erro ao deletar comentário:', error)
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
    { value: '7days', label: 'Ultimos 7 Dias' }
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
                  setCategoryModalData({ category: key, categoryLabel: info.label })
                  setCategoryModalOpen(true)
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-200 border-zinc-200 bg-white hover:border-zinc-400 hover:shadow-md`}
              >
                <div className="text-center">
                  <Icon className="h-7 w-7 mx-auto mb-2" />
                  <div className="text-xs font-semibold mb-2">{info.label}</div>
                  <div className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                    {categoryCounts[key] || 0}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>


      {/* Modal de Categoria */}
      {categoryModalData && (
        <CategoryReportsModal
          category={categoryModalData.category}
          categoryLabel={categoryModalData.categoryLabel}
          isOpen={categoryModalOpen}
          period={period}
          onClose={() => {
            setCategoryModalOpen(false)
            setCategoryModalData(null)
          }}
        />
      )}
    </div>
  )
}

