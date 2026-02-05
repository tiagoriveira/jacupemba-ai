-- Tabela de empresas locais
CREATE TABLE IF NOT EXISTS local_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  description TEXT,
  opening_hours TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscar por categoria
CREATE INDEX IF NOT EXISTS idx_businesses_category ON local_businesses(category);
