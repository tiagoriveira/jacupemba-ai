-- Tabela de Relatos Anonimos
CREATE TABLE IF NOT EXISTS anonymous_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('comercio', 'seguranca', 'transito', 'convivencia', 'eventos', 'outro')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Empresas Locais
CREATE TABLE IF NOT EXISTS local_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  neighborhood TEXT DEFAULT 'Jacupemba',
  description TEXT,
  business_hours TEXT,
  is_verified BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Posts da Vitrine
CREATE TABLE IF NOT EXISTS vitrine_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_name TEXT NOT NULL,
  seller_phone TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  category TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Conversas (para o chat)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  has_image BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON anonymous_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_category ON anonymous_reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_status ON anonymous_reports(status);

CREATE INDEX IF NOT EXISTS idx_businesses_category ON local_businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_verified ON local_businesses(is_verified);

CREATE INDEX IF NOT EXISTS idx_vitrine_expires ON vitrine_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_vitrine_created ON vitrine_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON anonymous_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON local_businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vitrine_updated_at BEFORE UPDATE ON vitrine_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
