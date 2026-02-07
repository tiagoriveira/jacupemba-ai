import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Status = 'pendente' | 'aprovado' | 'rejeitado'

export type ReportCategory = 
  | 'seguranca' 
  | 'emergencia' 
  | 'saude' 
  | 'transito' 
  | 'saneamento' 
  | 'iluminacao' 
  | 'convivencia' 
  | 'animais' 
  | 'eventos' 
  | 'comercio' 
  | 'transporte' 
  | 'outros'

export type Report = {
  id: string
  category: ReportCategory
  text: string
  status: Status
  created_at: string
}

export type ReportComment = {
  id: string
  report_id: string
  text: string
  created_at: string
}

export type ReportLike = {
  id: string
  report_id: string
  user_fingerprint: string
  created_at: string
}

export type CommentLike = {
  id: string
  comment_id: string
  user_fingerprint: string
  created_at: string
}

export type Business = {
  id: string
  name: string
  category: 'comercio' | 'servicos' | 'alimentacao' | 'saude' | 'educacao' | 'outro'
  description: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  hours: string | null
  verified: boolean
  status: Status
  created_at: string
}

export type VitrinePost = {
  id: string
  seller_name: string
  seller_phone: string
  title: string
  description: string | null
  price: number | null
  category: string
  media_url: string
  media_type: 'image' | 'video' | null
  expires_at: string
  views: number
  clicks: number
  status: Status
  created_at: string
}
