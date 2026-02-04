export interface Business {
  id: string
  user_id: string
  cnpj: string
  business_name: string
  trade_name?: string
  description?: string
  category?: string
  email?: string
  phone?: string
  whatsapp?: string
  website?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  address_zipcode?: string
  is_active: boolean
  is_verified: boolean
  is_featured: boolean
  featured_until?: string
  created_at: string
  updated_at: string
}

export interface BusinessHours {
  id: string
  business_id: string
  day_of_week: number
  is_open: boolean
  open_time?: string
  close_time?: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  price?: number
  duration_minutes?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  business_id: string
  name: string
  description?: string
  price?: number
  stock_quantity: number
  sku?: string
  category?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  business_id: string
  name: string
  description?: string
  event_date: string
  start_time?: string
  end_time?: string
  location?: string
  target_audience?: string
  max_participants?: number
  registration_required: boolean
  registration_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  business_id: string
  title: string
  description: string
  requirements?: string
  responsibilities?: string
  employment_type?: string
  location?: string
  remote_option: boolean
  salary_min?: number
  salary_max?: number
  salary_currency: string
  application_email?: string
  application_url?: string
  application_deadline?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChatHistory {
  id: string
  user_identifier?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  business_context?: Record<string, any>
  intent?: string
  created_at: string
}

export interface ChatRating {
  id: string
  message_id: string
  rating: 'up' | 'down'
  user_identifier?: string
  feedback_text?: string
  created_at: string
}

export interface Promotion {
  id: string
  business_id: string
  title: string
  description: string
  discount_text?: string
  start_date: string
  end_date: string
  terms?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
