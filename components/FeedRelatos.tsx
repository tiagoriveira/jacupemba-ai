'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Report, ReportComment } from '@/lib/supabase'
import { MessageSquare, Clock, X, Send, Loader2 } from 'lucide-react'

type TimePeriod = '60min' | '24h' | '7d'

const CATEGORY_INFO: Record<string, { label: string; color: string }> = {
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

  useEffect(() => {
    fetchReports()
  }, [period, selectedCategory])

  const fetchReports = async () => {
    setLoading(true)
    try {
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

          const cMap: Record<string, number> = {}
          commentsData?.forEach(c => {
            cMap[c.report_id] = (cMap[c.report_id] || 0) + 1
          })
          setCommentCounts(cMap)
        }
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (reportId: string) => {
    const { data } = await supabase
      .from('report_comments')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  const handleReportClick = (report: Report) => {
    setSelectedReport(report)
    fetchComments(report.id)
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !selectedReport) return
    setSubmittingComment(true)
    try {
      const { error } = await supabase
        .from('report_comments')
        .insert([{ report_id: selectedReport.id, text: commentText.trim() }])
      if (!error) {
        setCommentText('')
        fetchComments(selectedReport.id)
      }
    } finally {
      setSubmittingComment(false)
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    if (minutes < 60) return `${minutes}min atras`
    if (hours < 24) return `${hours}h atras`
    return `${Math.floor(hours / 24)}d atras`
  }

  const getCatInfo = (cat: string) => CATEGORY_INFO[cat] || { label: cat, color: 'bg-zinc-100 text-zinc-800' }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header com Tabs de Periodo */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-zinc-900">Pulso do Bairro</h2>
        <div className="flex gap-2">
          {[
            { key: '60min' as TimePeriod, label: 'Ultima Hora' },
            { key: '24h' as TimePeriod, label: 'Hoje' },
            { key: '7d' as TimePeriod, label: 'Ultimos 7 Dias' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                period === tab.key
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Object.entries(CATEGORY_INFO).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
            className={`relative p-3 rounded-lg border-2 transition-all ${
              selectedCategory === key
                ? 'border-zinc-900 bg-zinc-50 shadow-sm'
                : 'border-zinc-200 hover:border-zinc-400'
            }`}
          >
            <div className="text-sm font-medium text-zinc-900 mb-1">{info.label}</div>
            <div className="text-2xl font-bold text-zinc-900">{categoryCounts[key] || 0}</div>
          </button>
        ))}
      </div>

      {/* Feed de Relatos */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando relatos...
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            Nenhum relato encontrado neste periodo.
          </div>
        ) : (
          reports.map(report => (
            <button
              key={report.id}
              onClick={() => handleReportClick(report)}
              className="w-full p-4 bg-white rounded-lg border border-zinc-200 hover:border-zinc-400 transition-all text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getCatInfo(report.category).color}`}>
                      {getCatInfo(report.category).label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      {getTimeAgo(report.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-900 line-clamp-2">{report.text}</p>
                </div>
                <div className="flex items-center gap-1 text-zinc-500">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">{commentCounts[report.id] || 0}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Modal de Comentarios */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-zinc-900">Relato</h2>
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getCatInfo(selectedReport.category).color}`}>
                  {getCatInfo(selectedReport.category).label}
                </span>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 rounded-lg hover:bg-zinc-100 transition-colors">
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-4 bg-zinc-50 rounded-lg">
                <p className="text-sm text-zinc-900">{selectedReport.text}</p>
                <p className="text-xs text-zinc-500 mt-2">{getTimeAgo(selectedReport.created_at)}</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Comentarios ({comments.length})
                </h3>
                {comments.map(comment => (
                  <div key={comment.id} className="p-3 bg-zinc-50 rounded-lg">
                    <p className="text-sm text-zinc-900">{comment.text}</p>
                    <p className="text-xs text-zinc-500 mt-1">{getTimeAgo(comment.created_at)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Adicione um comentario anonimo..."
                  className="w-full min-h-[80px] p-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingComment ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Comentar</>
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
