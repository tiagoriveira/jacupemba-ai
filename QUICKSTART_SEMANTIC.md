# 🚀 GUIA RÁPIDO - Busca Semântica Jacupemba AI

## ✅ O que já está pronto

1. **Banco de dados configurado** - pgvector habilitado ✅
2. **Tabelas criadas** - `report_embeddings` e `business_embeddings` ✅  
3. **Funções SQL** - `search_reports_semantic` e `search_businesses_semantic` ✅
4. **API atualizada** - Nova tool `buscarSemantico` disponível ✅
5. **Código de embeddings** - Usando OpenAI via AI Gateway (zero config) ✅

---

## 🎯 PRÓXIMO PASSO: Gerar Embeddings

Você precisa gerar os embeddings uma única vez para os dados existentes.

### Opção 1: Executar localmente (recomendado para teste)

```bash
# Instalar dependências
npm install

# Executar script de geração
npm run generate-embeddings
```

Isso irá:
- Buscar todos os relatos aprovados
- Buscar todos os comercios verificados
- Gerar embeddings para cada um
- Salvar no banco de dados

**Tempo estimado:** ~5-10 minutos (dependendo da quantidade de dados)

### Opção 2: Executar no servidor

Você pode adaptar o script para rodar como API Route ou cron job no Vercel.

---

## 🧪 TESTAR A BUSCA SEMÂNTICA

### 1. Via API de Teste

```bash
# Buscar comercios
curl "https://seu-dominio.vercel.app/api/test-semantic?q=comida%20rapida&tipo=comercios"

# Buscar relatos
curl "https://seu-dominio.vercel.app/api/test-semantic?q=problema%20com%20agua&tipo=relatos"

# Buscar ambos
curl "https://seu-dominio.vercel.app/api/test-semantic?q=presente%20aniversario&tipo=ambos"
```

### 2. Via Chat (depois de gerar embeddings)

Pergunte ao Jacupemba:
- "Onde posso comer algo rápido?" (usa busca semântica)
- "Tem algum relato sobre problemas de água?" (usa busca semântica)
- "Preciso comprar um presente, onde posso ir?" (usa busca semântica)

---

## 🎨 COMO FUNCIONA

### Antes (Busca por palavras-chave)
```
Usuário: "Onde posso comer algo rápido?"
Sistema: Busca por "comer" e "rápido" → Pode não encontrar "lanchonete" ou "fast food"
```

### Depois (Busca semântica)
```
Usuário: "Onde posso comer algo rápido?"
Sistema: Entende a intenção → Encontra "lanchonete", "fast food", "comida rápida", etc.
```

### Exemplos de melhorias

| Pergunta | Busca tradicional | Busca semântica |
|----------|-------------------|-----------------|
| "Comida rápida" | Encontra apenas "comida rápida" | Encontra lanchonete, fast food, snack bar |
| "Problema com água" | Só relatos com "água" | Encontra: falta d'água, encanamento, vazamento |
| "Comprar presente" | Só "presente" | Encontra: loja de presentes, brinquedos, flores |

---

## 📊 MONITORAMENTO

### Verificar se embeddings foram criados

```sql
-- Contar embeddings de relatos
SELECT COUNT(*) FROM report_embeddings;

-- Contar embeddings de comercios
SELECT COUNT(*) FROM business_embeddings;

-- Ver últimos embeddings criados
SELECT * FROM report_embeddings ORDER BY created_at DESC LIMIT 5;
```

### Logs de depuração

O código já inclui `console.log("[v0] ...")` para debug. Veja os logs no terminal/Vercel.

---

## 🔧 TROUBLESHOOTING

### Erro: "Nenhum embedding encontrado"
**Solução:** Execute `npm run generate-embeddings` primeiro

### Erro: "Error generating embedding"
**Solução:** Verifique se o AI Gateway está funcionando (OpenAI precisa estar disponível via Gateway)

### Erro: "relation 'report_embeddings' does not exist"
**Solução:** Execute novamente a migration do pgvector

### Busca retorna poucos resultados
**Solução:** Reduza o `threshold` de 0.7 para 0.5 ou 0.6 no código

---

## 🚀 PRÓXIMAS FASES

Depois que a busca semântica estiver funcionando:

### FASE 2: Memória Persistente (próxima)
- Histórico de conversas por usuário
- Extração automática de preferências
- Contexto dinâmico baseado em histórico

### FASE 3: Ações Proativas
- Sugestões de próximos passos
- Notificações de novos relatos relevantes
- Recomendações contextuais

---

## 📚 RECURSOS ADICIONAIS

- `lib/embeddings.ts` - Código principal de embeddings
- `scripts/generate-embeddings.ts` - Script de geração
- `scripts/02-enable-pgvector.sql` - Schema do banco
- `SEMANTIC_SEARCH.md` - Documentação técnica completa
