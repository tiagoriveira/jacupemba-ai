-- Tabela de posts da vitrine
CREATE TABLE IF NOT EXISTS vitrine_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2),
  category TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  seller_phone TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  media_url TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscar posts ativos
CREATE INDEX IF NOT EXISTS idx_vitrine_active ON vitrine_posts(expires_at) WHERE expires_at > NOW();
