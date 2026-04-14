# Guia de Migração - Correções Críticas

## ⚠️ AÇÃO NECESSÁRIA NO SUPABASE

Execute o seguinte SQL diretamente no Supabase SQL Editor:

```sql
-- Adicionar coluna contact_email à tabela vitrine_posts
ALTER TABLE vitrine_posts 
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Criar índice para melhorar performance de buscas por email
CREATE INDEX IF NOT EXISTS idx_vitrine_posts_contact_email 
ON vitrine_posts(contact_email);

-- Comentário na coluna
COMMENT ON COLUMN vitrine_posts.contact_email IS 'Email de contato do usuário (opcional, usado para vincular posts a usuários autenticados)';
```

## 📋 Problemas Corrigidos

### 1. ✅ Segurança em Repost API
- **PROBLEMA**: API aceitava qualquer `user_id` sem autenticação
- **CORREÇÃO**: Agora valida token de autenticação e verifica ownership do post
- **ARQUIVO**: `app/api/vitrine/repost/route.ts`

### 2. ✅ Inconsistência de Preços
- **PROBLEMA**: Preço fixo de R$ 30 em todos endpoints, mas README dizia preços diferentes
- **CORREÇÃO**: Implementado sistema de preços por categoria:
  - Produto: R$ 15,00
  - Serviço: R$ 15,00
  - Comunicado: R$ 20,00
  - Vaga: Grátis
  - Informativo: Grátis
- **ARQUIVOS**: 
  - `app/api/vitrine/create/route.ts`
  - `app/api/vitrine/repost/route.ts`
  - `app/api/vitrine/check-first-post/route.ts`

### 3. ✅ Campo contact_email Faltante
- **PROBLEMA**: API my-posts buscava por `contact_email` mas coluna não existia
- **CORREÇÃO**: 
  - Adicionado tipo `contact_email` em `VitrinePost`
  - Incluído no insert de create API
  - Incluído no webhook do Stripe
- **ARQUIVOS**:
  - `lib/supabase.ts`
  - `app/api/vitrine/create/route.ts`
  - `app/api/stripe/webhook/route.ts`

### 4. ✅ user_id não Vinculado
- **PROBLEMA**: Posts criados sem vincular ao usuário autenticado
- **CORREÇÃO**: Create API agora busca user_id do token de autenticação
- **ARQUIVO**: `app/api/vitrine/create/route.ts`

## 🔍 Próximos Passos Recomendados

### Segurança Adicional
1. Implementar rate limiting nas APIs públicas
2. Adicionar CSRF protection
3. Validar e sanitizar inputs em todos os endpoints

### Melhorias de UX
1. Mostrar preço por categoria no frontend antes do usuário criar post
2. Adicionar loading states durante criação/republicação
3. Melhorar mensagens de erro para usuário final

### Performance
1. Adicionar cache para check-first-post (Redis/Upstash)
2. Implementar paginação na listagem de posts
3. Otimizar queries com índices adicionais

## 📝 Notas Importantes

- Primeiro post sempre é GRÁTIS independente da categoria
- Categorias "vaga" e "informativo" são sempre gratuitas
- Posts gratuitos têm limite de 3 republicações
- Posts pagos têm limite de 999 republicações
- Republicação de posts pagos exige novo pagamento
