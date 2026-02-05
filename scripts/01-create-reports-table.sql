-- Tabela de relatos anônimos
CREATE TABLE IF NOT EXISTS anonymous_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscar por categoria
CREATE INDEX IF NOT EXISTS idx_reports_category ON anonymous_reports(category);

-- Index para buscar por data
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON anonymous_reports(created_at DESC);
