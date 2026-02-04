-- =====================================================
-- JACUPEMBA AI - ADMIN PANEL DATABASE SCHEMA
-- =====================================================
-- This script creates all tables needed for the admin panel
-- Each business (CNPJ) has one admin user who manages their data
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- BUSINESSES TABLE
-- =====================================================
-- Stores company information (1 business = 1 CNPJ)
-- Each business is linked to one auth user
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  
  -- Contact Information
  email VARCHAR(255),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  website VARCHAR(255),
  
  -- Address
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zipcode VARCHAR(10),
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_cnpj CHECK (cnpj ~ '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$')
);

-- =====================================================
-- BUSINESS HOURS TABLE
-- =====================================================
-- Stores operating hours for each business
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  is_open BOOLEAN DEFAULT true,
  open_time TIME,
  close_time TIME,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id, day_of_week)
);

-- =====================================================
-- SERVICES TABLE
-- =====================================================
-- Stores services offered by businesses
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  duration_minutes INT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
-- Stores products/commerce items for businesses
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  stock_quantity INT DEFAULT 0,
  sku VARCHAR(100),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EVENTS TABLE
-- =====================================================
-- Stores events organized by businesses
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  target_audience VARCHAR(255),
  max_participants INT,
  registration_required BOOLEAN DEFAULT false,
  registration_url VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- JOBS TABLE
-- =====================================================
-- Stores job vacancies posted by businesses
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  
  -- Job Details
  employment_type VARCHAR(50), -- Full-time, Part-time, Contract, Freelance
  location VARCHAR(255),
  remote_option BOOLEAN DEFAULT false,
  salary_min DECIMAL(10, 2),
  salary_max DECIMAL(10, 2),
  salary_currency VARCHAR(3) DEFAULT 'BRL',
  
  -- Application
  application_email VARCHAR(255),
  application_url VARCHAR(255),
  application_deadline DATE,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHAT HISTORY TABLE
-- =====================================================
-- Stores all chat interactions from the assistant
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Information (can be null for anonymous users)
  user_identifier VARCHAR(255), -- Could be IP, session ID, or user ID
  
  -- Message Details
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Context Information
  business_context JSONB, -- Which businesses were relevant to this message
  intent VARCHAR(100), -- Detected intent (searching services, products, jobs, etc.)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast queries
  created_at_idx TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user ON public.chat_history(user_identifier);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_cnpj ON public.businesses(cnpj);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON public.businesses(is_active);

CREATE INDEX IF NOT EXISTS idx_services_business ON public.services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);

CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

CREATE INDEX IF NOT EXISTS idx_events_business ON public.events(business_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active);

CREATE INDEX IF NOT EXISTS idx_jobs_business ON public.jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON public.jobs(is_active);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
-- Automatically update updated_at timestamp

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at BEFORE UPDATE ON public.business_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
