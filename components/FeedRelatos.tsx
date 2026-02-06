'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Report, ReportComment } from '@/lib/supabase'
import { MessageSquare, Clock, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

type TimePeriod = '60min' | '24h' | '48h'

const CATEGORY_INFO = {
  'seguranca': { label: '🚨 Segurança', color: 'bg-red-100 text-red-800' },
  'emergencia': { label: '🚑 Emergência', color: 'bg-red-200 text-red-900' },
  'saude': { label: '🏥 Saúde', color: 'bg-blue-100 text-blue-800' },
  'transito': { label: '🚗 Trânsito', color: 'bg-yellow-100 text-yellow-800' },
  'saneamento': { label: '💧 Saneamento', color: 'bg-cyan-100 text-cyan-800' },
  'iluminacao': { label: '💡 Iluminação', color: 'bg-amber-100 text-amber-800' },
  'convivencia': { label: '👥 Convivência', color: 'bg-purple-100 text-purple-800' },
  'animais': { label: '🐾 Animais', color: 'bg-green-100 text-green-800' },
  'eventos': { label: '🎉 Eventos', color: 'bg-pink-100 text-pink-800' },
  'comercio': { label: '🏪 Comércio', color: 'bg-indigo-100 text-indigo-800' },
  'transporte': { label: '🚌 Transporte', color: 'bg-orange-100 text-orange-800' },
  'outros': { label: '📌 Outros', color: 'bg-zinc-100 text-zinc-800' },
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

  // Fetch reports baseado no periodo e categoria
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
        : new Date(now - 48 * 60 * 60 * 1000)

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
        
        // Calcular contagens por categoria
        const counts: Record<string, number> = {}
        Object.keys(CATEGORY_INFO).forEach(cat => counts[cat] = 0)
        data.forEach(report => {
          counts[report.category] = (counts[report.category] || 0) + 1
        })
        setCategoryCounts(counts)
        
        // Buscar contagem de comentarios para cada relato
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
      console.error('[v0] Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('report_comments')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setComments(data)
      }
    } catch (err) {
      console.error('[v0] Error fetching comments:', err)
    }
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
        .insert([{
          report_id: selectedReport.id,
          text: commentText.trim()
        }])

      if (!error) {
        setCommentText('')
        fetchComments(selectedReport.id)
      }
    } catch (err) {
      console.error('[v0] Error submitting comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now()
    const created = new Date(timestamp).getTime()
    const diff = now - created
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    if (minutes < 60) return `${minutes}min atrás`
    if (hours < 24) return `${hours}h atrás`
    return `${Math.floor(hours / 24)}d atrás`
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header com Tabs de Período */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-zinc-900">Pulso do Bairro</h2>
        <div className="flex gap-2">
          <Button
            variant={period === '60min' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('60min')}
          >
            Última Hora
          </Button>
          <Button
            variant={period === '24h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('24h')}
          >
            Hoje
          </Button>
          <Button
            variant={period === '48h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('48h')}
          >
            Esta Semana
          </Button>
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
            <div className="text-sm font-medium text-zinc-900 mb-1">
              {info.label}
            </div>
            <div className="text-2xl font-bold text-zinc-900">
              {categoryCounts[key] || 0}
            </div>
          </button>
        ))}
      </div>

      {/* Feed de Relatos */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Carregando relatos...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            Nenhum relato {selectedCategory && `em ${CATEGORY_INFO[selectedCategory as keyof typeof CATEGORY_INFO]?.label}`} {period === '60min' ? 'na última hora' : period === '24h' ? 'hoje' : 'esta semana'}.
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
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${CATEGORY_INFO[report.category as keyof typeof CATEGORY_INFO]?.color}`}>
                      {CATEGORY_INFO[report.category as keyof typeof CATEGORY_INFO]?.label}
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

      {/* Modal de Comentários */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReport && (
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${CATEGORY_INFO[selectedReport.category as keyof typeof CATEGORY_INFO]?.color}`}>
                  {CATEGORY_INFO[selectedReport.category as keyof typeof CATEGORY_INFO]?.label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              {/* Relato Original */}
              <div className="p-4 bg-zinc-50 rounded-lg">
                <p className="text-sm text-zinc-900">{selectedReport.text}</p>
                <p className="text-xs text-zinc-500 mt-2">
                  {getTimeAgo(selectedReport.created_at)}
                </p>
              </div>

              {/* Comentários */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Comentários ({comments.length})
                </h3>
                
                {comments.map(comment => (
                  <div key={comment.id} className="p-3 bg-zinc-50 rounded-lg">
                    <p className="text-sm text-zinc-900">{comment.text}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {getTimeAgo(comment.created_at)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Adicionar Comentário */}
              <div className="space-y-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Adicione um comentário anônimo..."
                  className="min-h-[80px]"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submittingComment ? 'Enviando...' : 'Comentar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
