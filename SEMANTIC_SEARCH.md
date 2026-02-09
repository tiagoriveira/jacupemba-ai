# Busca Semântica - Jacupemba AI

## O que foi implementado

A **Busca Semântica (RAG)** permite que o agente Jacupemba entenda a **intenção** das perguntas, não apenas palavras-chave exatas.

### Exemplos práticos:

| Pergunta do usuário | Busca tradicional | Busca semântica |
|---------------------|-------------------|-----------------|
| "Onde posso comer algo rápido?" | ❌ Nada encontrado | ✅ Encontra lanchonetes, fast-food, padarias |
| "Problema com água na rua" | ❌ Só acha "água" exata | ✅ Encontra "falta de água", "vazamento", "saneamento" |
| "Lugar para comprar presente" | ❌ Só acha "presente" | ✅ Encontra lojas de presentes, papelarias, floriculturas |

---

## Como funciona

1. **Embeddings**: Cada relato e comercio é convertido em um vetor numérico (1536 dimensões)
2. **pgvector**: PostgreSQL + extensão vetorial armazena e busca por similaridade
3. **Tool `buscarSemantico`**: Agente usa busca semântica automaticamente
4. **Grok Embeddings**: Modelo de embeddings do xAI (sem custo extra)

---

## Passo a passo de configuração

### 1. Habilitar pgvector no Supabase

Execute o script SQL no Supabase Dashboard (SQL Editor):

\`\`\`bash
# No SQL Editor do Supabase, execute:
scripts/02-enable-pgvector.sql
\`\`\`

Ou via SystemAction (será solicitada permissão):

\`\`\`
Executar: scripts/02-enable-pgvector.sql
\`\`\`

### 2. Instalar dependências

\`\`\`bash
npm install
\`\`\`

### 3. Gerar embeddings dos dados existentes

Execute o script de geração (IMPORTANTE: só precisa rodar 1x):

\`\`\`bash
npm run generate-embeddings
\`\`\`

**O que esse script faz:**
- Busca todos os relatos aprovados
- Busca todos os comercios verificados
- Gera embeddings usando Grok
- Salva no banco (tabelas `report_embeddings` e `business_embeddings`)
- Pula registros que já têm embeddings

**Tempo estimado:** ~1-2 segundos por registro (com rate limiting de 100ms)

### 4. Testar no chat

Agora o agente automaticamente usa busca semântica quando necessário!

Teste com perguntas como:
- "Onde posso almoçar algo rápido?"
- "Problema com lixo acumulado"
- "Lugar para cortar cabelo"
- "Barulho de madrugada"

---

## Arquitetura técnica

\`\`\`
┌─────────────────────────────────────────────┐
│ 1. Usuário faz pergunta complexa           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 2. Agente decide usar buscarSemantico      │
│    (tool selection automática)              │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 3. Gera embedding da pergunta (Grok)       │
│    "lugar para comer rapido" → [vector]     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 4. Busca vetorial no PostgreSQL            │
│    SELECT * WHERE similarity > 0.7          │
│    ORDER BY cosine distance                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 5. Retorna resultados ordenados por        │
│    relevância (% similarity)                │
└─────────────────────────────────────────────┘
\`\`\`

---

## Novos dados: como manter embeddings atualizados

**Opção 1 (Recomendada):** Trigger automático no banco

Adicione este trigger no Supabase para gerar embeddings automaticamente:

\`\`\`sql
-- Será implementado na Fase 2
-- Por enquanto, rode manualmente o script após adicionar novos dados
\`\`\`

**Opção 2:** Executar script manualmente

Sempre que adicionar novos relatos/comercios:

\`\`\`bash
npm run generate-embeddings
\`\`\`

O script é idempotente (pula registros existentes).

---

## Performance e custos

| Métrica | Valor |
|---------|-------|
| **Dimensões do vetor** | 1536 |
| **Threshold de similaridade** | 0.7 (70%) |
| **Custo de embeddings** | ✅ Grátis (Grok) |
| **Tempo de busca** | ~50-100ms (com índice HNSW) |
| **Espaço em disco** | ~6KB por registro |

---

## Próximos passos (Fase 2 e 3)

- [ ] **Memória Persistente**: Histórico de conversas e preferências
- [ ] **Ações Proativas**: Sugestões inteligentes e notificações
- [ ] **Trigger automático**: Gerar embeddings ao criar novos registros
- [ ] **Busca híbrida**: Combinar keyword + semantic para melhor precisão

---

## Troubleshooting

### Erro: "função search_reports_semantic não existe"
**Solução:** Execute o script `02-enable-pgvector.sql` no Supabase

### Erro: "embedding model não encontrado"
**Solução:** Verifique se `XAI_API_KEY` está configurada corretamente

### Embeddings muito lentos
**Solução:** Ajuste o rate limiting em `generate-embeddings.ts` (linha 48, 100ms)

### Resultados irrelevantes
**Solução:** Aumente o threshold de 0.7 para 0.8 em `lib/embeddings.ts` (linhas 53, 84)

---

## Suporte

Dúvidas ou problemas? Entre em contato com a equipe de desenvolvimento.
