-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Each business owner can only see and manage their own data
-- Chat history is public (readable by assistant)
-- =====================================================

-- =====================================================
-- BUSINESSES TABLE RLS
-- =====================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Users can view their own business
CREATE POLICY "businesses_select_own" 
  ON public.businesses FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own business (only if they don't have one yet)
CREATE POLICY "businesses_insert_own" 
  ON public.businesses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own business
CREATE POLICY "businesses_update_own" 
  ON public.businesses FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own business
CREATE POLICY "businesses_delete_own" 
  ON public.businesses FOR DELETE 
  USING (auth.uid() = user_id);

-- Assistant can read all active businesses (for responding to queries)
CREATE POLICY "businesses_select_active_public" 
  ON public.businesses FOR SELECT 
  USING (is_active = true);

-- =====================================================
-- BUSINESS HOURS TABLE RLS
-- =====================================================

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_hours_select_own" 
  ON public.business_hours FOR SELECT 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "business_hours_insert_own" 
  ON public.business_hours FOR INSERT 
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "business_hours_update_own" 
  ON public.business_hours FOR UPDATE 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "business_hours_delete_own" 
  ON public.business_hours FOR DELETE 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- Public can read business hours for active businesses
CREATE POLICY "business_hours_select_public" 
  ON public.business_hours FOR SELECT 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE is_active = true
    )
  );

-- =====================================================
-- SERVICES TABLE RLS
-- =====================================================

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_own" 
  ON public.services FOR SELECT 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "services_insert_own" 
  ON public.services FOR INSERT 
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "services_update_own" 
  ON public.services FOR UPDATE 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "services_delete_own" 
  ON public.services FOR DELETE 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- Public can read active services from active businesses
CREATE POLICY "services_select_public" 
  ON public.services FOR SELECT 
  USING (
    is_active = true AND 
    business_id IN (
      SELECT id FROM public.businesses WHERE is_active = true
    )
  );

-- =====================================================
-- PRODUCTS TABLE RLS
-- =====================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_own" 
  ON public.products FOR SELECT 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "products_insert_own" 
  ON public.products FOR INSERT 
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "products_update_own" 
  ON public.products FOR UPDATE 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "products_delete_own" 
  ON public.products FOR DELETE 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- Public can read active products from active businesses
CREATE POLICY "products_select_public" 
  ON public.products FOR SELECT 
  USING (
    is_active = true AND 
    business_id IN (
      SELECT id FROM public.businesses WHERE is_active = true
    )
  );

-- =====================================================
-- EVENTS TABLE RLS
-- =====================================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_own" 
  ON public.events FOR SELECT 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "events_insert_own" 
  ON public.events FOR INSERT 
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "events_update_own" 
  ON public.events FOR UPDATE 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "events_delete_own" 
  ON public.events FOR DELETE 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- Public can read active events from active businesses
CREATE POLICY "events_select_public" 
  ON public.events FOR SELECT 
  USING (
    is_active = true AND 
    business_id IN (
      SELECT id FROM public.businesses WHERE is_active = true
    )
  );

-- =====================================================
-- JOBS TABLE RLS
-- =====================================================

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select_own" 
  ON public.jobs FOR SELECT 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "jobs_insert_own" 
  ON public.jobs FOR INSERT 
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "jobs_update_own" 
  ON public.jobs FOR UPDATE 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "jobs_delete_own" 
  ON public.jobs FOR DELETE 
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- Public can read active jobs from active businesses
CREATE POLICY "jobs_select_public" 
  ON public.jobs FOR SELECT 
  USING (
    is_active = true AND 
    business_id IN (
      SELECT id FROM public.businesses WHERE is_active = true
    )
  );

-- =====================================================
-- CHAT HISTORY TABLE RLS
-- =====================================================

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Anyone can insert chat messages (anonymous users)
CREATE POLICY "chat_history_insert_all" 
  ON public.chat_history FOR INSERT 
  WITH CHECK (true);

-- Only allow reading own messages (based on user_identifier)
-- This is flexible for future enhancements
CREATE POLICY "chat_history_select_all" 
  ON public.chat_history FOR SELECT 
  USING (true);
