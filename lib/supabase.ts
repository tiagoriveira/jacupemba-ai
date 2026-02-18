/**
 * Cliente Supabase e Tipos TypeScript
 * 
 * @description
 * Configuração do cliente Supabase para acesso ao banco de dados PostgreSQL.
 * Inclui tipos TypeScript para todas as tabelas e seus relacionamentos.
 * 
 * @module supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy init — evita crash durante build estático do Next.js
let _supabase: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !key) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias')
      }
      _supabase = createClient(url, key)
    }
    return (_supabase as any)[prop]
  },
})

/**
 * Status possíveis para moderação de conteúdo
 * @typedef {'pendente' | 'aprovado' | 'rejeitado'} Status
 */
export type Status = 'pendente' | 'aprovado' | 'rejeitado'

/**
 * Categorias de relatos disponíveis
 * @typedef ReportCategory
 */
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

/**
 * Relato anônimo da comunidade
 * @interface Report
 */
export type Report = {
  id: string
  category: ReportCategory
  text: string
  status: Status
  fingerprint: string
  created_at: string
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

/**
 * Comércio ou serviço local verificado
 * @interface Business
 */
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

export type AgentFeedback = {
  id: string
  message_id: string
  user_id: string | null
  rating: number
  comment: string | null
  created_at: string
}

/**
 * Post da vitrine digital (expira em 48h)
 * @interface VitrinePost
 */
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
  approved_at: string | null
  status: Status
  created_at: string
  updated_at: string
  business_id: string | null
  repost_count: number
  max_reposts: number
  is_paid: boolean
  user_id: string | null
  stripe_payment_id: string | null
}
