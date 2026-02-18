# ✅ Checklist de Validação Pós-Correções

Use este checklist para validar que todas as correções estão funcionando corretamente.

---

## 🗄️ 1. Banco de Dados

### Migration SQL
- [ ] Executar script no Supabase SQL Editor:
  ```sql
  ALTER TABLE vitrine_posts ADD COLUMN IF NOT EXISTS contact_email TEXT;
  CREATE INDEX IF NOT EXISTS idx_vitrine_posts_contact_email ON vitrine_posts(contact_email);
  ```
- [ ] Verificar que coluna `contact_email` existe:
  ```sql
  SELECT column_name, data_type FROM information_schema.columns 
  WHERE table_name = 'vitrine_posts' AND column_name = 'contact_email';
  ```
- [ ] Resultado esperado: `contact_email | text`

---

## 🔐 2. Autenticação e Segurança

### Criar Post (Usuário Autenticado)
- [ ] Fazer login no sistema
- [ ] Criar um novo post
- [ ] Verificar no banco que `user_id` está preenchido:
  ```sql
  SELECT id, user_id, contact_email FROM vitrine_posts ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] `user_id` deve ter valor UUID
- [ ] `contact_email` deve ter o email do usuário logado

### Criar Post (Usuário Anônimo)
- [ ] Fazer logout
- [ ] Criar um post sem estar logado
- [ ] Verificar no banco:
  ```sql
  SELECT id, user_id, contact_email FROM vitrine_posts ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] `user_id` deve ser `null`
- [ ] `contact_email` deve ser `null` (exceto se preenchido manualmente)

### Repost - Validação de Ownership
- [ ] Tentar republicar post de outro usuário
- [ ] Deve retornar erro 403: "Você não tem permissão para republicar este post"
- [ ] Republicar post próprio
- [ ] Deve funcionar normalmente

### Repost - Autenticação Obrigatória
- [ ] Fazer logout
- [ ] Tentar republicar qualquer post via API:
  ```bash
  curl -X POST https://seu-dominio.com/api/vitrine/repost \
    -H "Content-Type: application/json" \
    -d '{"post_id": "uuid-aqui"}'
  ```
- [ ] Deve retornar erro 401: "Autenticação necessária"

---

## 💰 3. Sistema de Preços

### Check First Post API
- [ ] Verificar preços por categoria:
  ```bash
  curl "https://seu-dominio.com/api/vitrine/check-first-post?phone=11999999999&category=produto"
  ```
- [ ] Resposta deve incluir:
  ```json
  {
    "is_first_post": true/false,
    "price": 15.00,
    "is_free": true/false,
    "prices": {
      "produto": 15.00,
      "servico": 15.00,
      "comunicado": 20.00,
      "vaga": 0,
      "informativo": 0
    }
  }
  ```

### Criar Post - Primeiro Grátis
- [ ] Criar primeiro post com telefone novo
- [ ] Não deve exigir pagamento
- [ ] Post deve ter `is_paid = false`

### Criar Post - Categorias Pagas
- [ ] Criar segundo post categoria "produto"
- [ ] Deve exigir pagamento de R$ 15,00
- [ ] Criar post categoria "comunicado"
- [ ] Deve exigir pagamento de R$ 20,00

### Criar Post - Categorias Gratuitas
- [ ] Criar post categoria "vaga" (não primeiro post)
- [ ] NÃO deve exigir pagamento
- [ ] Criar post categoria "informativo"
- [ ] NÃO deve exigir pagamento

### Repost - Preços Corretos
- [ ] Republicar post pago de "produto"
- [ ] Deve pedir R$ 15,00
- [ ] Republicar post pago de "comunicado"
- [ ] Deve pedir R$ 20,00
- [ ] Republicar post gratuito (dentro do limite)
- [ ] Não deve pedir pagamento

---

## 📧 4. Captura de Email

### Frontend Auto-Preenchimento
- [ ] Fazer login
- [ ] Acessar página criar post
- [ ] Campo de email deve estar preenchido automaticamente

### API Create - Email no Payload
- [ ] Criar post com usuário logado
- [ ] Verificar Network tab do DevTools
- [ ] Payload deve incluir `contact_email`
- [ ] Header deve incluir `Authorization: Bearer <token>`

### Webhook Stripe - Email Persistido
- [ ] Fazer pagamento via Stripe (modo test)
- [ ] Webhook deve criar post automaticamente
- [ ] Verificar no banco que `contact_email` foi salvo

---

## 🔄 5. Republicação (Repost)

### Posts Gratuitos - Limite de 3
- [ ] Criar post grátis (primeiro post)
- [ ] Republicar 1x → sucesso (repost_count = 1)
- [ ] Republicar 2x → sucesso (repost_count = 2)
- [ ] Republicar 3x → sucesso (repost_count = 3)
- [ ] Tentar republicar 4x → erro: "Limite de republicações atingido"

### Posts Pagos - Sempre Permite (com pagamento)
- [ ] Criar post pago
- [ ] Republicar → deve pedir pagamento
- [ ] Após pagar, republicar novamente → sucesso
- [ ] Não deve ter limite de republicações

### Categorias Gratuitas - Sempre Permite
- [ ] Criar post categoria "vaga"
- [ ] Republicar múltiplas vezes
- [ ] Nunca deve pedir pagamento (desde que categoria seja gratuita)

---

## 🎨 6. Frontend

### Página Criar Post
- [ ] Carrega normalmente
- [ ] Campos obrigatórios validados
- [ ] Upload de imagens funciona
- [ ] Mensagem de "primeiro post grátis" aparece
- [ ] Modal de pagamento abre quando necessário

### Painel Lojista
- [ ] Lista posts do usuário autenticado
- [ ] Mostra posts por email (se logado)
- [ ] Fallback para busca por telefone funciona
- [ ] Botão republicar habilitado quando apropriado

---

## 🧪 7. Testes de Integração

### Fluxo Completo - Novo Usuário
1. [ ] Registrar novo usuário
2. [ ] Criar primeiro post → grátis
3. [ ] Aguardar aprovação admin
4. [ ] Republicar post → grátis (dentro do limite)
5. [ ] Criar segundo post → pagar R$ 15/20
6. [ ] Republicar post pago → pagar novamente

### Fluxo Completo - Usuário Existente
1. [ ] Login com conta existente
2. [ ] Acessar painel
3. [ ] Ver lista de posts próprios
4. [ ] Republicar post expirado
5. [ ] Verificar ownership

---

## 🐛 8. Casos de Erro

### Tokens Inválidos
- [ ] Tentar repost com token expirado → 401
- [ ] Tentar repost sem token → 401
- [ ] Tentar repost com token inválido → 401

### Dados Inválidos
- [ ] Criar post sem título → erro validação
- [ ] Criar post sem telefone → erro validação
- [ ] Telefone com menos de 11 dígitos → erro

### Posts Inexistentes
- [ ] Republicar post com ID falso → 404
- [ ] Buscar posts com telefone inexistente → lista vazia

---

## 📊 9. Verificações no Banco

### Consistência de Dados
```sql
-- Posts sem contact_email mas com user_id (esperado para posts antigos)
SELECT COUNT(*) FROM vitrine_posts WHERE user_id IS NOT NULL AND contact_email IS NULL;

-- Posts pagos sem stripe_payment_id (não deve existir)
SELECT COUNT(*) FROM vitrine_posts WHERE is_paid = true AND stripe_payment_id IS NULL;

-- Repost_count maior que max_reposts em posts grátis (não deve existir)
SELECT COUNT(*) FROM vitrine_posts WHERE is_paid = false AND repost_count > max_reposts;
```

### Índices Criados
```sql
-- Verificar índices na tabela
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'vitrine_posts';
```
- [ ] Deve existir índice em `contact_email`

---

## ✅ Validação Final

- [ ] Todos os testes acima passaram
- [ ] Não há erros no console do navegador
- [ ] Não há erros nos logs do Vercel
- [ ] Não há erros nos logs do Supabase
- [ ] Performance está normal (sem queries lentas)

---

## 📝 Notas de Problemas Encontrados

Use este espaço para anotar problemas durante a validação:

```
Data: _____/_____/_____
Problema: 
Severidade: [ ] Baixa [ ] Média [ ] Alta [ ] Crítica
Detalhes:


Solução:

```

---

## 🎉 Próxima Ação

Após completar este checklist:

1. ✅ Se todos os itens passaram → **Sistema validado e pronto para produção**
2. ⚠️ Se encontrou problemas → Registrar na seção "Notas" e corrigir
3. 📧 Notificar equipe sobre status da validação
4. 🚀 Deploy para produção (se aprovado)

---

**Data da Validação:** _____/_____/_____  
**Validado por:** _____________________  
**Status:** [ ] ✅ Aprovado [ ] ⚠️ Com ressalvas [ ] ❌ Reprovado
