# 📋 Documento de Handoff - Jacupemba AI

**Data**: Janeiro 2025  
**Versão**: 1.0  
**Status**: Em produção (Vercel)

---

## 🎯 Visão Geral do Projeto

### O que é?

Jacupemba AI é uma plataforma hiperlocal para o bairro de Jacupemba (RJ) que conecta moradores através de:
- **Chat IA**: Assistente conversacional que conhece o bairro
- **Feed de Relatos**: Sistema anônimo para reportar problemas
- **Vitrine Digital**: Anúncios efêmeros (48h) de produtos/serviços
- **Diretório**: Comércios e serviços locais verificados

### Problema que Resolve

- Falta de comunicação organizada entre moradores
- Dificuldade em encontrar comércios locais
- Ausência de canal para relatar problemas do bairro
- Necessidade de marketplace local sem custos fixos

---

## 🏗️ Arquitetura Técnica

### Stack

```
Frontend:  Next.js 15 + React 19 + TailwindCSS v4
Backend:   Next.js API Routes + Vercel Edge
Database:  Supabase (PostgreSQL)
AI:        xAI Grok via Vercel AI SDK 6
Auth:      FingerprintJS (anônimo)
Deploy:    Vercel
```

### Diagrama de Fluxo

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │
       v
┌─────────────────────────────────┐
│      Next.js Frontend           │
│  - page.tsx (Chat + Hero)       │
│  - vitrine/page.tsx (Grid)      │
│  - relatos/page.tsx (Feed)      │
│  - admin/page.tsx (Moderação)   │
└────────┬────────────────────────┘
         │
         ├──────> /api/chat ──────> xAI Grok (IA)
         │                            │
         └──────> Supabase ───────────┘
                  (PostgreSQL)
                  ├─ anonymous_reports
                  ├─ local_businesses
                  ├─ vitrine_posts
                  └─ report_comments
```

---

## 📦 Estrutura de Dados

### Tabelas Principais

#### `anonymous_reports`
Sistema de relatos anônimos com moderação.

```sql
CREATE TABLE anonymous_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL,
  category TEXT NOT NULL,  -- seguranca, transito, infraestrutura, convivencia, etc
  text TEXT NOT NULL,
  status TEXT DEFAULT 'pendente',  -- pendente, aprovado, rejeitado
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Índices**:
- `idx_reports_status` em `status`
- `idx_reports_category` em `category`

**RLS**: Inserção anônima, leitura apenas aprovados.

#### `anonymous_report_likes`
Sistema de likes (1 por fingerprint).

```sql
CREATE TABLE anonymous_report_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES anonymous_reports(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(report_id, fingerprint)
);
```

#### `report_comments`
Comentários com suporte a threads (respostas aninhadas).

```sql
CREATE TABLE report_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES anonymous_reports(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES report_comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author_name TEXT DEFAULT 'Anônimo',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Índices**:
- `idx_comments_report` em `report_id`
- `idx_comments_parent` em `parent_id`

#### `local_businesses`
Diretório de empresas e serviços locais.

```sql
CREATE TABLE local_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  address TEXT,
  hours TEXT,
  diferencial TEXT,           -- Novo: O que torna especial
  promocao TEXT,              -- Novo: Ofertas
  tempo_entrega TEXT,         -- Novo: Tempo de entrega
  formas_pagamento TEXT,      -- Novo: Métodos de pagamento
  link_social TEXT,           -- Novo: Instagram/Facebook
  verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Categorias**: Alimentação, Restaurante, Mercado, Farmácia, Padaria, Serviços, Beleza, Saúde, Educação, Construção e Reparos, Automotivo, Pets, Tecnologia, Outro.

#### `vitrine_posts`
Posts efêmeros (48h) com carrossel de imagens.

```sql
CREATE TABLE vitrine_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  category TEXT NOT NULL,  -- vaga, informativo, servico, produto, comunicado
  image_url TEXT,          -- Deprecated: usar images
  images JSONB DEFAULT '[]'::jsonb,  -- Array de URLs ["url1", "url2"]
  video_url TEXT,
  aspect_ratio TEXT DEFAULT 'square',  -- square (1:1) ou vertical (9:16)
  expires_at TIMESTAMP NOT NULL,       -- NOW() + 48h
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Limpeza automática**: Posts com `expires_at` anterior ao momento atual não aparecem.

---

## 🎨 Design System

### Paleta de Cores (Tokens no globals.css)

```css
/* Light Mode */
--background: #ffffff
--foreground: #09090b
--card: #ffffff
--primary: #18181b
--accent: #f4f4f5

/* Dark Mode */
--background: #09090b
--foreground: #fafafa
--card: #18181b
--primary: #fafafa
--accent: #27272a
```

### Tipografia

- **Sans**: Geist Sans (variável)
- **Mono**: Geist Mono (variável)
- Escala: text-sm (14px), text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px)

### Componentes UI (shadcn/ui)

Todos os componentes shadcn estão em `/components/ui/`:
- Button, Card, Input, Textarea, Select, Modal, etc.

---

## 🤖 Agente de IA

### Personalidade

```
Tom: Informal, carioca, levemente irônico
Gírias: "mano", "véi", "massa", "ó só"
Respostas: Curtas (2-4 frases), diretas
Empatia: Demonstra preocupação com problemas do bairro
```

### Tools (Ferramentas)

#### 1. buscarRelatos

Busca relatos aprovados filtrados por categoria.

```typescript
buscarRelatos({
  categoria?: 'seguranca' | 'transito' | 'infraestrutura' | 'convivencia'
  limite?: number
})
```

#### 2. buscarEmpresas

Busca comércios locais verificados.

```typescript
buscarEmpresas({
  categoria?: string,
  termo?: string,
  limite?: number
})
```

#### 3. obterEstatisticas

Gera estatísticas agregadas do bairro.

```typescript
obterEstatisticas({
  periodo: '24h' | '7d' | '30d'
})
```

### Implementação

Código em `/app/api/chat/route.ts`:
- Usa `streamText` do AI SDK 6
- Modelo: `xai/grok-beta` via Vercel AI Gateway
- Loop limit: 10 steps
- Streaming: Server-Sent Events (SSE)

---

## 🔐 Autenticação e Segurança

### Sistema de Fingerprinting

**Localização**: `/lib/fingerprint.ts`

Usa FingerprintJS para gerar ID único anônimo baseado em:
- User Agent
- Canvas fingerprint
- WebGL fingerprint
- Timezone
- Resolução de tela

**Uso**: Prevenir spam de likes/comentários sem exigir login.

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado:

```sql
-- Inserção: qualquer usuário anônimo
CREATE POLICY "anonymous_insert" ON anonymous_reports
  FOR INSERT TO anon
  WITH CHECK (true);

-- Leitura: apenas status = 'aprovado'
CREATE POLICY "read_approved" ON anonymous_reports
  FOR SELECT TO anon
  USING (status = 'aprovado');

-- Update/Delete: apenas service_role (admin via API)
```

### Admin

**Credenciais padrão** (configurável via ENV):
- Email: `admin@jacupemba.com`
- Senha: `admin123`

**Autenticação**: Client-side simples (sem JWT). Para produção, migrar para Supabase Auth.

---

## 🎭 Funcionalidades Principais

### 1. Home com Hero Centralizado

**Arquivo**: `/app/page.tsx`

- Hero de 85vh com avatar do papagaio centralizado
- Título: "Olá! Sou seu assistente local"
- Subtítulo irônico sobre o bairro
- Sugestões de perguntas abaixo
- Animações: fade-in no avatar, slide-in nos textos

### 2. Vitrine Digital (Instagram Style)

**Arquivo**: `/components/VitrineGrid.tsx`

**Features**:
- Grid masonry sem espaçamento (gap-0)
- Carrossel de até 5 imagens por post
- Indicador "1/5" no canto superior direito
- Modal com setas de navegação (← →)
- Dots indicadores de posição
- Suporte a vídeo (ícone play, sem autoplay)
- Aspect ratio: square ou vertical (9:16)

**Filtros**: Todos, Vagas, Informativos, Serviços, Produtos, Comunicados

**Expiração automática**: Posts com `expires_at < NOW()` não aparecem

### 3. Feed de Relatos

**Arquivo**: `/components/FeedRelatos.tsx`

**Features**:
- Cards com categoria, texto, timestamp
- Sistema de likes (1 por fingerprint)
- Comentários com threads (respostas aninhadas)
- Modal de detalhes em tela cheia
- Filtros por categoria e período
- Botão de compartilhar no WhatsApp

**Estado dos likes**: Salvo em localStorage + sincronizado com DB.

### 4. Painel Admin

**Arquivo**: `/components/AdminDashboard.tsx`

**Seções**:
- **Relatos**: Aprovar/rejeitar com motivo
- **Empresas**: Aprovar/editar cadastros
- **Vitrine**: Aprovar posts efêmeros
- **Estatísticas**: Resumo em tempo real

**Busca**: Campo de busca por texto em cada seção.

---

## 🚀 Deploy e CI/CD

### Vercel

**Branch strategy**:
- `main`: Produção
- `v0/*`: Branches automáticas do v0.dev

**Variáveis de ambiente necessárias**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://okxsdipfepchalgyefqj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
XAI_API_KEY=<xai_key>
NEXT_PUBLIC_ADMIN_EMAIL=admin@jacupemba.com
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
```

**Deploy automático**: Push para branch → Vercel builda → Live em ~2min

### Supabase

**Projeto ID**: `okxsdipfepchalgyefqj`  
**Região**: East US (Virginia)

**Conexão**:
- Anon Key: Usado pelo frontend
- Service Role Key: Usado apenas por APIs internas (não expor!)

---

## 📊 Métricas e Analytics

### Dados Disponíveis

**Em tempo real no Admin**:
- Total de relatos/empresas/posts
- Relatos por categoria
- Status de moderação (pendente/aprovado/rejeitado)

**Faltando (TODO)**:
- Google Analytics ou Vercel Analytics
- Métricas de uso do agente (mensagens, tools chamados)
- Tempo médio de resposta
- Taxa de rejeição no admin

---

## 🐛 Problemas Conhecidos e Limitações

### Limitações Atuais

1. **Admin sem auth real**: Sistema simplificado client-side. Migrar para Supabase Auth.
2. **Sem upload direto de imagens**: Admin precisa de URL externa. Integrar Vercel Blob.
3. **Sem paginação no feed**: Carrega todos os relatos. Adicionar lazy loading.
4. **Carrossel não salva múltiplas imagens no admin**: Form só salva 1 imagem. Implementar upload múltiplo.
5. **Sem notificações**: Push não implementado (item de backlog).

### Bugs Conhecidos

- **CORS em imagens externas** (dev): Unsplash pode dar erro CORS localmente. Normal.
- **Fingerprint inconsistente**: Se usuário limpar cookies, gera novo fingerprint.

---

## 📝 Tarefas Pendentes (TODO)

### Prioridade Alta

- [ ] Implementar upload múltiplo de imagens no VitrineUploadModal
- [ ] Adicionar paginação no FeedRelatos
- [ ] Migrar autenticação admin para Supabase Auth
- [ ] Integrar Vercel Blob para upload de imagens

### Prioridade Média

- [ ] Adicionar analytics (Vercel Analytics ou GA4)
- [ ] Implementar busca por CEP no cadastro de empresas
- [ ] Melhorar sistema de moderação com bulk actions
- [ ] Adicionar filtro de data range no admin

### Prioridade Baixa (Backlog)

- [ ] Notificações push (Web Push API)
- [ ] Gamificação com reputação de usuários
- [ ] RAG avançado com embeddings (pgvector)
- [ ] App mobile (React Native ou PWA)
- [ ] Sistema de eventos da comunidade
- [ ] Marketplace com checkout

---

## 🔧 Como Debugar

### Logs Úteis

**Console do navegador**:
```javascript
console.log("[v0] <mensagem>")
```

**Supabase logs**:
- Dashboard → Logs → API Logs
- Filtrar por status 4xx/5xx

**Vercel logs**:
- Dashboard do projeto → Logs
- Real-time streaming

### Comandos Úteis

```bash
# Verificar erros de tipo
npm run build

# Rodar localmente
npm run dev

# Limpar cache do Next.js
rm -rf .next

# Revalidar cache do Supabase
# (no código, usar revalidatePath ou revalidateTag)
```

---

## 📚 Documentação de Referência

### Tecnologias

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Vercel AI SDK 6](https://sdk.vercel.ai/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS v4](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

### Arquivos Importantes

- `README.md`: Visão geral e setup rápido
- `AGENTE_JACUPEMBA_AI.md`: Detalhes técnicos do agente
- `SETUP_LOCAL.md`: Setup passo a passo
- `USER_FLOW.md`: Fluxo de usuário e arquitetura

---

## 🤝 Contato e Suporte

**Desenvolvedor original**: Tiago Riveira  
**Repositório**: [GitHub](https://github.com/tiagoriveira/jacupemba-ai)  
**Deploy**: [Vercel](https://vercel.com/jet67048-9003s-projects/v0-modern-ai-chatbot-interface-tem)

**Para dúvidas**:
1. Abra uma issue no GitHub
2. Consulte os docs de referência acima
3. Entre em contato via email/slack

---

## ✅ Checklist de Handoff

- [x] Código limpo e documentado
- [x] README atualizado
- [x] Variáveis de ambiente documentadas
- [x] Banco de dados com schema completo
- [x] RLS habilitado em todas as tabelas
- [x] Deploy funcionando na Vercel
- [x] Componentes não utilizados removidos
- [x] TODO list documentada
- [x] Problemas conhecidos listados
- [x] Guia de debug incluído

---

**Última atualização**: Janeiro 2025  
**Próxima revisão**: Após implementação do upload múltiplo

**Boa sorte e bom código! 🚀**
