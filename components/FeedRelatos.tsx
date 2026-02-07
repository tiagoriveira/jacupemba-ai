'use client'

// Feed de relatos do bairro com sistema de comentarios anonimos
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Report, ReportComment } from '@/lib/supabase'
import { MessageSquare, Clock, X, Send, Loader2 } from 'lucide-react'

type TimePeriod = '60min' | '24h' | '7d'

const CATEGORY_INFO = {
  'seguranca': { label: '🚨 Seguranca', color: 'bg-red-100 text-red-800' },
  'emergencia': { label: '🆘 Emergencia', color: 'bg-red-200 text-red-900' },
  'saude': { label: '🏥 Saude', color: 'bg-blue-100 text-blue-800' },
  'transito': { label: '🚦 Transito', color: 'bg-yellow-100 text-yellow-800' },
  'saneamento': { label: '💧 Saneamento', color: 'bg-cyan-100 text-cyan-800' },
  'iluminacao': { label: '💡 Iluminacao', color: 'bg-amber-100 text-amber-800' },
  'convivencia': { label: '🤝 Comunidade', color: 'bg-purple-100 text-purple-800' },
  'animais': { label: '🐕 Animais', color: 'bg-green-100 text-green-800' },
  'eventos': { label: '🎪 Eventos', color: 'bg-pink-100 text-pink-800' },
  'comercio': { label: '🏬 Comercio', color: 'bg-indigo-100 text-indigo-800' },
  'transporte': { label: '🚌 Transporte', color: 'bg-orange-100 text-orange-800' },
  'outros': { label: '📍 Outros', color: 'bg-zinc-100 text-zinc-800' },
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

  const getCatInfo = (cat: string) => CATEGORY_INFO[cat as keyof typeof CATEGORY_INFO] || CATEGORY_INFO.outros

  useEffect(() => {
    fetchReports()
  }, [period, selectedCategory])

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
          const { data: commentsData } = await supabase
            .from('report_comments')
            .select('report_id')
            .in('report_id', reportIds)
          
          const commentCountsMap: Record<string, number> = {}
          commentsData?.forEach(comment => {
            commentCountsMap[comment.report_id] = (commentCountsMap[comment.report_id] || 0) + 1
          })
          setCommentCounts(commentCountsMap)
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

  const periods: { value: TimePeriod; label: string }[] = [
    { value: '60min', label: 'Ultima Hora' },
    { value: '24h', label: 'Hoje' },
    { value: '7d', label: 'Ultimos 7 Dias' }
  ]

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">Pulso do Bairro</h2>
          <div className="flex gap-2">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  period === p.value
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
          {Object.entries(CATEGORY_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedCategory === key
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg scale-105'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{info.label.split(' ')[0]}</div>
                <div className="text-xs font-medium mb-1">{info.label.split(' ').slice(1).join(' ')}</div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  selectedCategory === key ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {categoryCounts[key] || 0}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
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
            {reports.map(report => (
              <div
                key={report.id}
                onClick={() => openReportModal(report)}
                className="bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getCatInfo(report.category).color}`}>
                    {getCatInfo(report.category).label}
                  </span>
                  <div className="flex items-center gap-1 text-zinc-400 text-sm">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{getTimeAgo(report.created_at)}</span>
                  </div>
                </div>
                <p className="text-zinc-700 mb-3">{report.text}</p>
                <div className="flex items-center gap-1 text-zinc-500">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">{commentCounts[report.id] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-zinc-900">Relato</h2>
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getCatInfo(selectedReport.category).color}`}>
                  {getCatInfo(selectedReport.category).label}
                </span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="pb-4 border-b border-zinc-200">
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                  <Clock className="h-4 w-4" />
                  <span>{getTimeAgo(selectedReport.created_at)}</span>
                </div>
                <p className="text-zinc-800">{selectedReport.text}</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-700">
                  Comentarios ({comments.length})
                </h3>
                {comments.map(comment => (
                  <div key={comment.id} className="bg-zinc-50 rounded-lg p-3">
                    <div className="text-xs text-zinc-500 mb-1">
                      {getTimeAgo(comment.created_at)}
                    </div>
                    <p className="text-sm text-zinc-700">{comment.text}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Adicione um comentario anonimo..."
                  className="w-full min-h-[80px] p-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
