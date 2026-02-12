import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://okxsdipfepchalgyefqj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rc3hkaXBlcGNoYWxneWVmcWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNjc4MjI5MiwiZXhwIjoyMDUyMzU4MjkyfQ.7jlz3co'

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
  fingerprint: string
  created_at: string
  is_ambassador?: boolean
}

export type ReportComment = {
  id: string
  report_id: string
  parent_id: string | null
  text: string
  author_name: string
  fingerprint: string
  created_at: string
}

export type ReportLike = {
  id: string
  report_id: string
  fingerprint: string
  created_at: string
}

export type CommentLike = {
  id: string
  comment_id: string
  fingerprint: string
  created_at: string
}

export type Business = {
  id: string
  name: string
  category: string
  description: string | null
  phone: string | null
  address: string | null
  hours: string | null
  diferencial: string | null
  promocao: string | null
  tempo_entrega: string | null
  formas_pagamento: string | null
  link_social: string | null
  verified: boolean
  is_subscribed: boolean
  status: Status
  created_at: string
  updated_at: string
}

export type BusinessReview = {
  id: string
  business_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

export type AgentFeedback = {
  id: string
  message_id: string
  user_id: string | null
  rating: number
  comment: string | null
  created_at: string
}

export type VitrinePost = {
  id: string
  contact_name: string
  contact_phone: string
  title: string
  description: string | null
  price: number | null
  category: string
  image_url: string | null
  images: string[]
  video_url: string | null
  aspect_ratio: 'square' | 'vertical'
  expires_at: string
  status: Status
  created_at: string
  updated_at: string
}
