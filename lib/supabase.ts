import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Report = {
  id: string
  category: 'comercio' | 'seguranca' | 'transito' | 'convivencia' | 'eventos' | 'outro'
  text: string
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
  created_at: string
}
