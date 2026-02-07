# Jacupemba AI - Agente Conversacional

## Visão Geral

O Jacupemba AI é um agente conversacional inteligente implementado internamente usando **AI SDK 6** da Vercel. Ele atua como assistente virtual do bairro, respondendo perguntas sobre relatos, empresas locais e estatísticas.

## Características

### Personalidade
- **Tom**: Amigável, informal e levemente sarcástico
- **Linguagem**: Uso de gírias cariocas ("mano", "véi", "massa")
- **Estilo**: Respostas curtas, diretas e práticas (2-4 frases)
- **Empatia**: Demonstra preocupação com problemas do bairro

### Capacidades Técnicas

#### 1. Tools (Ferramentas)

O agente possui 3 ferramentas principais:

**buscarRelatos**
- Busca relatos aprovados no bairro
- Filtra por categoria (segurança, trânsito, etc.)
- Retorna dados reais do Supabase
- Útil para: "O que está acontecendo?", "Algum problema de segurança?"

**buscarEmpresas**
- Busca comércios e serviços locais aprovados
- Filtra por categoria ou termo de busca
- Retorna nome, descrição, contato e horário
- Útil para: "Onde compro X?", "Quais restaurantes tem?"

**obterEstatisticas**
- Gera estatísticas agregadas do bairro
- Períodos: 24h, 7d, 30d
- Mostra tendências e categorias mais reportadas
- Útil para: "Mostre estatísticas", "Qual o problema mais comum?"

#### 2. Modelo de IA

- **Modelo**: xAI Grok Beta (via Vercel AI Gateway)
- **Configuração**: Zero-config (usa credenciais do projeto)
- **Loop Limit**: Máximo 10 passos para resolução
- **Streaming**: Respostas em tempo real

#### 3. Arquitetura

```
Cliente (Next.js)          API Route             Supabase
┌─────────────┐          ┌──────────┐          ┌──────────┐
│             │          │          │          │          │
│  useChat    ├─────────►│  Agent   ├─────────►│  Tables  │
│  (AI SDK)   │◄─────────┤  (Grok)  │◄─────────┤  (Data)  │
│             │          │          │          │          │
└─────────────┘          └──────────┘          └──────────┘
     ^                        │
     │                        ▼
     │                   ┌──────────┐
     │                   │  Tools   │
     └───────────────────┤  Execute │
                         └──────────┘
```

## Estrutura de Arquivos

```
app/
├── api/
│   └── agent/
│       └── route.ts         # API Route do agente com tools
└── chat/
    └── page.tsx             # Interface de chat (useChat)

components/
└── (sem componentes dedicados, interface inline)
```

## Como Funciona

### Fluxo de Conversa

1. **Usuário envia mensagem** → `useChat` hook
2. **POST /api/agent** → Mensagens enviadas via DefaultChatTransport
3. **ToolLoopAgent processa** → Analisa intenção e decide quais tools usar
4. **Tools executam** → Buscam dados reais do Supabase
5. **Resposta gerada** → Grok combina dados com personalidade
6. **Stream retorna** → UI atualiza em tempo real via SSE

### Exemplo de Interação

```
Usuário: "Algum problema de segurança recente?"

[Agent Decision] → Usar buscarRelatos(categoria: "seguranca")
[Tool Execution] → Query Supabase → 3 relatos encontrados
[Response Generation] → "Opa! Achei 3 relatos de segurança recentes..."

Usuário: "Quais restaurantes tem?"

[Agent Decision] → Usar buscarEmpresas(categoria: "restaurante")
[Tool Execution] → Query Supabase → 5 empresas encontradas
[Response Generation] → "Olha só, tem uns lugares massa aqui..."
```

## Diferenças vs. Flowise (Externo)

| Aspecto | Implementação Atual (AI SDK) | Flowise |
|---------|------------------------------|---------|
| **Hosting** | Tudo no Next.js | Precisa servidor separado |
| **Latência** | Baixa (~200ms) | Alta (+500ms, 2 hops) |
| **Controle** | Total sobre lógica | Limitado ao GUI |
| **Manutenção** | 1 aplicação | 2 aplicações |
| **Embeddings/RAG** | Manual com AI SDK | Interface visual pronta |
| **Custo** | Apenas APIs | Hosting + APIs |

## Próximos Passos (Opcional)

### RAG com Embeddings (Futuro)

Para busca semântica mais avançada:

```typescript
import { embed } from 'ai'

// Gerar embeddings dos relatos
const embedding = await embed({
  model: 'openai/text-embedding-3-small',
  value: 'texto do relato'
})

// Armazenar no Supabase com pgvector
// Buscar por similaridade semântica
```

### Memória de Conversa (Futuro)

Persistir histórico por usuário:

```typescript
// Salvar mensagens no Supabase
await supabase.from('chat_history').insert({
  user_id: fingerprint,
  messages: JSON.stringify(messages)
})
```

### Análise de Sentimento (Futuro)

Detectar urgência em relatos:

```typescript
const urgenciaTool = tool({
  description: 'Analisa urgência de uma situação',
  inputSchema: z.object({ texto: z.string() }),
  execute: async ({ texto }) => {
    const resultado = await generateText({
      model: 'xai/grok-beta',
      prompt: `Classifique a urgência: ${texto}`
    })
    return { nivel: resultado.text }
  }
})
```

## Monitoramento

### Logs Úteis

```bash
# Buscar erros do agente
grep "[v0] Erro" logs

# Ver chamadas de tools
grep "buscarRelatos\|buscarEmpresas" logs
```

### Métricas Recomendadas

- Latência média de resposta
- Taxa de uso de cada tool
- Mensagens por sessão
- Taxa de erro

## Custos Estimados

**Modelo**: xAI Grok Beta
- ~$0.001 por mensagem (estimativa)
- Custo mensal (1000 msgs/dia): ~$30

**Comparação**:
- OpenAI GPT-4: ~$0.03 por mensagem
- OpenAI GPT-3.5: ~$0.002 por mensagem
- Grok Beta: ~$0.001 por mensagem ✅

## Limitações Atuais

1. **Sem RAG avançado** - Busca direta, não semântica
2. **Sem memória persistente** - Cada sessão é independente
3. **Sem multimodal** - Apenas texto (sem imagens)
4. **Sem analytics** - Não rastreia métricas de uso

## Troubleshooting

### Agente não responde
- Verificar XAI_API_KEY nas variáveis de ambiente
- Verificar logs do console: `[v0] Erro no agente`
- Testar conexão Supabase

### Tools não executam
- Verificar permissões RLS no Supabase
- Verificar se tabelas existem (anonymous_reports, local_businesses)
- Ver logs: `[v0] Erro ao buscar relatos`

### Respostas genéricas
- Agente não está usando tools corretamente
- Revisar `instructions` na definição do agente
- Melhorar descrições dos tools

## Contribuindo

Para adicionar novos tools:

1. Definir schema com Zod
2. Implementar função execute
3. Adicionar ao objeto `tools` do agente
4. Atualizar instruções do agente

Exemplo:
```typescript
const novaTool = tool({
  description: 'O que esta tool faz',
  inputSchema: z.object({ param: z.string() }),
  execute: async ({ param }) => {
    // Lógica aqui
    return { resultado: 'dados' }
  }
})
```

---

**Desenvolvido com AI SDK 6 + Vercel AI Gateway + Supabase**
