-- Habilitar extensão pgvector para busca semântica
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de embeddings para relatos
CREATE TABLE IF NOT EXISTS report_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES anonymous_reports(id) ON DELETE CASCADE,
  embedding vector(1536), -- dimensão padrão do text-embedding-3-small
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(report_id)
);

-- Tabela de embeddings para comercios
CREATE TABLE IF NOT EXISTS business_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES local_businesses(id) ON DELETE CASCADE,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id)
);

-- Índices para busca vetorial eficiente (HNSW = Hierarchical Navigable Small World)
CREATE INDEX IF NOT EXISTS report_embeddings_idx ON report_embeddings 
USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS business_embeddings_idx ON business_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Função auxiliar para busca semântica em relatos
CREATE OR REPLACE FUNCTION search_reports_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  text text,
  category text,
  status text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.text,
    r.category,
    r.status,
    r.created_at,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM report_embeddings e
  JOIN anonymous_reports r ON r.id = e.report_id
  WHERE 
    r.status = 'aprovado'
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Função auxiliar para busca semântica em comercios
CREATE OR REPLACE FUNCTION search_businesses_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  description text,
  phone text,
  address text,
  hours text,
  verified boolean,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.category,
    b.description,
    b.phone,
    b.address,
    b.hours,
    b.verified,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM business_embeddings e
  JOIN local_businesses b ON b.id = e.business_id
  WHERE 
    b.status = 'aprovado'
    AND b.verified = true
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
