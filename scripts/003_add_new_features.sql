-- Add new fields to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Create ratings table
CREATE TABLE IF NOT EXISTS public.chat_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT NOT NULL,
  rating VARCHAR(10) NOT NULL CHECK (rating IN ('up', 'down')),
  user_identifier VARCHAR(255),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  discount_text VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  terms TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_ratings_message ON public.chat_ratings(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_ratings_created ON public.chat_ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_verified ON public.businesses(is_verified);
CREATE INDEX IF NOT EXISTS idx_businesses_featured ON public.businesses(is_featured, featured_until);
CREATE INDEX IF NOT EXISTS idx_promotions_business ON public.promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active);

-- Add trigger for promotions updated_at
CREATE TRIGGER update_promotions_updated_at 
  BEFORE UPDATE ON public.promotions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for new tables
ALTER TABLE public.chat_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_ratings
CREATE POLICY "chat_ratings_insert_all" ON public.chat_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_ratings_select_all" ON public.chat_ratings FOR SELECT USING (true);

-- RLS Policies for promotions
CREATE POLICY "promotions_select_own" ON public.promotions FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "promotions_insert_own" ON public.promotions FOR INSERT WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "promotions_update_own" ON public.promotions FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "promotions_delete_own" ON public.promotions FOR DELETE USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "promotions_select_public" ON public.promotions FOR SELECT USING (
  is_active = true 
  AND CURRENT_DATE BETWEEN start_date AND end_date
  AND business_id IN (SELECT id FROM public.businesses WHERE is_active = true)
);

-- Add comment for featured management
COMMENT ON COLUMN public.businesses.is_featured IS 'Only one business should be featured at a time. Managed manually by admin.';
COMMENT ON COLUMN public.businesses.featured_until IS 'Optional expiration date for featured status';
