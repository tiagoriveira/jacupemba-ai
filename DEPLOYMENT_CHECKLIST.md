# ✅ CHECKLIST DE DEPLOYMENT - Busca Semântica

Use este checklist para garantir que tudo está funcionando corretamente.

---

## 📋 PRÉ-DEPLOYMENT

### Banco de Dados
- [x] Extensão pgvector habilitada no Supabase
- [x] Tabelas `report_embeddings` e `business_embeddings` criadas
- [x] Índices HNSW criados
- [x] Funções SQL `search_reports_semantic` e `search_businesses_semantic` criadas

**Como verificar:**
```sql
-- No Supabase SQL Editor
SELECT COUNT(*) FROM report_embeddings;
SELECT COUNT(*) FROM business_embeddings;
```

---

### Código
- [x] Biblioteca `lib/embeddings.ts` criada
- [x] Configuração `lib/embedding-config.ts` criada
- [x] Tool `buscarSemantico` adicionada ao agente
- [x] API de teste `/api/test-semantic` criada
- [x] Script `generate-embeddings.ts` criado

**Como verificar:**
```bash
# Verificar se arquivos existem
ls -la lib/embeddings.ts
ls -la lib/embedding-config.ts
ls -la scripts/generate-embeddings.ts
```

---

### Dependências
- [x] Pacote `tsx` adicionado ao package.json
- [x] Script `generate-embeddings` adicionado ao package.json

**Como verificar:**
```bash
npm list tsx
npm run generate-embeddings --help
```

---

## 🚀 DEPLOYMENT

### 1. Instalar Dependências
```bash
npm install
```
- [ ] Executado sem erros
- [ ] `node_modules` atualizado

---

### 2. Gerar Embeddings Iniciais

```bash
npm run generate-embeddings
```

**O que esperar:**
- [ ] Console mostra "🔄 Gerando embeddings para relatos..."
- [ ] Progresso de processamento (ex: "✅ Relato 1/50 processado")
- [ ] Console mostra "🔄 Gerando embeddings para comercios..."
- [ ] Console mostra "🎉 Processo completo!"
- [ ] Sem erros críticos

**Tempo estimado:** 5-10 minutos (depende da quantidade de dados)

**Verificar no banco:**
```sql
-- Deve retornar > 0
SELECT COUNT(*) FROM report_embeddings;
SELECT COUNT(*) FROM business_embeddings;
```

---

### 3. Testar API de Busca Semântica

**Teste 1: Buscar comercios**
```bash
curl "http://localhost:3000/api/test-semantic?q=comida%20rapida&tipo=comercios"
```
- [ ] Retorna JSON com comercios
- [ ] Campo `total` > 0
- [ ] Campo `relevancia` presente nos resultados

**Teste 2: Buscar relatos**
```bash
curl "http://localhost:3000/api/test-semantic?q=problema%20agua&tipo=relatos"
```
- [ ] Retorna JSON com relatos
- [ ] Campo `total` > 0
- [ ] Campo `relevancia` presente nos resultados

**Teste 3: Buscar ambos**
```bash
curl "http://localhost:3000/api/test-semantic?q=seguranca&tipo=ambos"
```
- [ ] Retorna JSON com relatos E comercios
- [ ] Campo `total` > 0

---

### 4. Testar no Chat

**Teste 1: Busca simples**
- [ ] Perguntar: "Onde posso comer algo rápido?"
- [ ] Agente usa `buscarSemantico`
- [ ] Retorna comercios relevantes (lanchonetes, fast foods, etc.)
- [ ] Mostra score de relevância

**Teste 2: Sinônimos**
- [ ] Perguntar: "Preciso de uma refeição rápida"
- [ ] Agente encontra os mesmos comercios do teste 1
- [ ] Demonstra que entende sinônimos

**Teste 3: Conceitos abstratos**
- [ ] Perguntar: "Onde comprar um presente de aniversário?"
- [ ] Agente encontra lojas de presentes, brinquedos, flores, etc.
- [ ] Não se limita a lojas com "presente" no nome

**Teste 4: Problemas do bairro**
- [ ] Perguntar: "Tem problema com água no bairro?"
- [ ] Agente encontra relatos sobre vazamento, falta d'água, etc.
- [ ] Entende contexto de "problema com água"

---

### 5. Monitorar Logs

**No terminal (dev) ou Vercel Dashboard (produção):**
- [ ] Logs mostram `[v0] Busca semantica em relatos: "..."`
- [ ] Logs mostram `[v0] X relatos encontrados`
- [ ] Logs mostram `[v0] X comercios encontrados`
- [ ] Sem erros de embedding ou database

---

## 🐛 TROUBLESHOOTING

### Problema: "Nenhum resultado encontrado"
**Checklist de diagnóstico:**
- [ ] Embeddings foram gerados? (`SELECT COUNT(*) FROM report_embeddings`)
- [ ] API de teste funciona? (`curl /api/test-semantic`)
- [ ] Threshold muito alto? (ajustar em `lib/embedding-config.ts`)

**Solução:**
```bash
# Regenerar embeddings
npm run generate-embeddings
```

---

### Problema: "Error generating embedding"
**Checklist de diagnóstico:**
- [ ] Variável `XAI_API_KEY` está configurada?
- [ ] Vercel AI Gateway está funcionando?
- [ ] Internet/conectividade OK?

**Solução:**
```bash
# Verificar env vars
echo $XAI_API_KEY

# Verificar integração
# No v0: Settings > Integrations > Vercel AI Gateway
```

---

### Problema: Resultados irrelevantes
**Checklist de diagnóstico:**
- [ ] Threshold atual? (padrão: 0.7)
- [ ] Query muito genérica?
- [ ] Embeddings de qualidade?

**Solução:**
```typescript
// Aumentar threshold em lib/embedding-config.ts
defaultThreshold: 0.75, // ou 0.8
```

---

## 📊 VALIDAÇÃO FINAL

### Métricas de Sucesso

**Busca Semântica Funcionando:**
- [ ] >= 80% dos relatos têm embeddings
- [ ] >= 80% dos comercios têm embeddings
- [ ] API de teste retorna resultados em < 2 segundos
- [ ] Relevância dos resultados >= 70% (manualmente validado)

**Agente Usando Corretamente:**
- [ ] Agente escolhe `buscarSemantico` para perguntas complexas
- [ ] Agente usa ferramentas tradicionais quando apropriado
- [ ] Respostas são relevantes e contextuais

**Performance:**
- [ ] Geração de embeddings < 15 minutos (dados iniciais)
- [ ] Busca semântica < 2 segundos por query
- [ ] Sem erros de rate limiting

---

## 🎉 DEPLOYMENT COMPLETO

Quando TODOS os itens acima estiverem marcados:

✅ **FASE 1: Busca Semântica está COMPLETA e DEPLOYADA!**

---

## 📈 PRÓXIMOS PASSOS

Depois de validar tudo:

1. **Monitorar uso real**
   - Acompanhar logs de busca semântica
   - Coletar feedback dos usuários
   - Ajustar threshold conforme necessário

2. **Embeddings incrementais**
   - Criar trigger/cron para novos relatos/comercios
   - Gerar embedding automaticamente ao criar novo item

3. **Começar FASE 2: Memória Persistente**
   - Histórico de conversas
   - Preferências do usuário
   - Contexto dinâmico

---

## 📝 NOTAS

**Data de implementação:** [Preencher após deployment]  
**Versão:** 1.0.0 (Busca Semântica)  
**Responsável:** [Seu nome]  
**Ambiente:** [Production/Staging]

---

**Dúvidas?** Consulte:
- `QUICKSTART_SEMANTIC.md` - Guia rápido
- `SEMANTIC_SEARCH.md` - Documentação técnica
- `IMPLEMENTATION_SUMMARY.md` - Resumo da implementação
