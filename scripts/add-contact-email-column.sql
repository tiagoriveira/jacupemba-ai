-- Adicionar coluna contact_email à tabela vitrine_posts
-- Esta coluna armazena o email do usuário autenticado que criou o post

ALTER TABLE vitrine_posts 
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Criar índice para melhorar performance de busca por email
CREATE INDEX IF NOT EXISTS idx_vitrine_posts_contact_email 
ON vitrine_posts(contact_email);

-- Comentário descritivo
COMMENT ON COLUMN vitrine_posts.contact_email IS 'Email do usuário autenticado (Supabase Auth) que criou o post';
