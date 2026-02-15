# 🏘️ Jacupemba AI - Assistente Local Inteligente

> **Versão Lucrativa & Simplificada** - Plataforma hiperlocal focada em **Chat de Fofocas** (relatos comunitários) e **Vitrine Monetizada** (anúncios pagos de 48h).

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Asaas](https://img.shields.io/badge/Pagamentos-Asaas-00A859?style=flat-square)](https://asaas.com)

---

## 🎯 Visão Geral

Jacupemba AI conecta moradores do bairro através de dois pilares:

### 1. **Chat de Fofocas** (Gratuito)
- Relatos anônimos da comunidade (segurança, trânsito, eventos, etc.)
- Agente IA sarcástico que responde perguntas sobre o bairro
- Sistema de likes e comentários
- Moderação pelo Super Admin

### 2. **Vitrine Digital** (Monetizado)
- **Posts de 48h** em categorias pagas (Produto R$ 15, Serviço R$ 15, Comunicado R$ 20) ou grátis (Vagas/Informativos)
- **Sistema de Republicação**: Posts pagos podem ser republicados infinitamente mediante pagamento; posts grátis têm limite de 3 republicações
- **Pagamentos via Asaas** (PIX/Boleto/Cartão)
- **Autenticação obrigatória** (Google OAuth ou Email/Senha) para anunciar

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, TailwindCSS v4 |
| **UI Components** | shadcn/ui, Radix UI, Sonner (toasts) |
| **Backend** | Next.js API Routes (Server Actions) |
| **Banco de Dados** | Supabase (PostgreSQL) com RLS |
| **Autenticação** | Supabase Auth (Google OAuth + Email/Senha) |
| **Pagamentos** | Asaas (PIX, Boleto, Cartão) |
| **IA** | xAI Grok-4 via Vercel AI SDK |
| **Deploy** | Vercel + Supabase | Vercel Analytics |
| **Auth** | Fingerprinting anônimo (FingerprintJS) |

---

## ✨ Funcionalidades Principais

### 💬 Chat de Fofocas (Usuário Final)
- Agente IA **sarcástico** com personalidade local
- Busca em relatos comunitários via ferramentas (tools)
- Histórico de conversas salvo
- Sugestões contextuais inteligentes
- **Sem necessidade de login**

### 🏪 Vitrine Digital (Lojistas)
- **Painel do Lojista** (requer autenticação)
- Criação de posts com imagens/vídeos
- **Validade de 48 horas** para todos os posts
- **Republicação controlada**:
  - Posts Pagos: Republicação infinita (R$ 15-20 por republicação)
  - Posts Grátis: Máximo 3 republicações, depois novo post
- Status em tempo real: Ativo/Expirado/Pendente Aprovação
- Integração com checkout Asaas

### 🛡️ Painel Super Admin
- **Moderação de Relatos**: Aprovar/Rejeitar/Deletar em massa
- **Moderação de Vitrine**: Aprovar posts antes de irem ao ar
- **Configurações do Agente IA**: Modelo, nível de sarcasmo, instruções
- Sistema de triagem automática (alto/médio/baixo risco)
- Moderação obrigatória antes de publicação

### 3. Vitrine Digital (Explorar)

- Grid estilo Instagram Explorar (imagens coladas, sem gaps)
- Carrossel de até 5 imagens por post
- Suporte a vídeos (sem autoplay)
- Indicador "1/5" nos posts com múltiplas imagens
- Modal com navegação por setas e dots
- Filtros: Todos, Vagas, Informativos, Serviços, Produtos, Comunicados
- Posts expiram automaticamente em 48h
- Aspect ratio: quadrado (1:1) ou vertical (9:16)

### 4. Diretório de Empresas

- Cadastro de comércios e serviços locais
- Campos: nome, categoria, descrição, telefone, endereço, horário
- Novos campos: diferencial, promoção, tempo de entrega, formas de pagamento, link social
- Categorias: Alimentação, Restaurante, Mercado, Farmácia, Construção, Automotivo, Pets, Tecnologia, etc.

### 5. Painel Administrativo

- Sistema de moderação para relatos, empresas e posts da vitrine
- Estatísticas em tempo real
- Filtros e busca avançada
- Rejeição com motivo

---

## Estrutura do Projeto

```
jacupemba-ai/
├── app/
│   ├── page.tsx              # Home com chat IA + hero centralizado
│   ├── vitrine/page.tsx      # Grid visual estilo Instagram
│   ├── relatos/page.tsx      # Feed de relatos com filtros
│   ├── admin/page.tsx        # Painel de moderação
│   ├── api/
│   │   └── chat/route.ts     # API do agente com tools
│   ├── globals.css           # Estilos globais + tokens de design
│   └── layout.tsx            # Layout raiz com theme provider
│
├── components/
│   ├── FeedRelatos.tsx       # Feed de relatos com comentários
│   ├── VitrineGrid.tsx       # Grid + carrossel de imagens
│   ├── AdminDashboard.tsx    # Dashboard de moderação
│   ├── AdminLogin.tsx        # Autenticação do admin
│   ├── ThemeToggle.tsx       # Alternador dark/light mode
│   └── admin/
│       ├── RelatosSection.tsx        # Moderação de relatos
│       ├── EmpresasSection.tsx       # Moderação de empresas
│       ├── EmpresaModal.tsx          # Form de cadastro de empresa
│       ├── VitrineSection.tsx        # Moderação da vitrine
│       └── VitrineUploadModal.tsx    # Form de post na vitrine
│
├── lib/
│   ├── supabase.ts           # Cliente Supabase + tipos TypeScript
│   ├── fingerprint.ts        # Sistema de fingerprinting anônimo
│   └── moderacao-triagem.ts  # Lógica de moderação (placeholder)
│
├── public/
│   ├── avatar_jacupemba_v1.png   # Avatar do papagaio
│   └── vitrine/                  # Imagens de exemplo da vitrine
│
├── HANDOFF.md                # Documento de handoff (leia este!)
└── README.md                 # Este arquivo
```

---

## Setup Rápido

### 1. Clonar e Instalar

```bash
git clone <repo-url>
cd jacupemba-ai
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie `.env.local`:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://okxsdipfepchalgyefqj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui

# xAI Grok (obrigatório)
XAI_API_KEY=sua_chave_xai_aqui

# Admin (opcional - padrão: admin@jacupemba.com / admin123)
NEXT_PUBLIC_ADMIN_EMAIL=admin@jacupemba.com
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
```

### 3. Rodar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Banco de Dados (Supabase)

### Tabelas Principais

**anonymous_reports** - Relatos anônimos
- `id`, `fingerprint`, `category`, `text`, `status`, `created_at`
- RLS: Inserção anônima + leitura apenas de aprovados

**anonymous_report_likes** - Sistema de likes (1 por fingerprint)
- `id`, `report_id`, `fingerprint`, `created_at`

**report_comments** - Comentários com threads
- `id`, `report_id`, `parent_id`, `text`, `author_name`, `created_at`

**local_businesses** - Empresas e serviços locais
- `id`, `name`, `category`, `description`, `phone`, `address`, `hours`
- Novos: `diferencial`, `promocao`, `tempo_entrega`, `formas_pagamento`, `link_social`

**vitrine_posts** - Posts efêmeros (48h)
- `id`, `title`, `description`, `price`, `category`, `images` (JSONB), `video_url`, `aspect_ratio`
- `contact_name`, `contact_phone`, `expires_at`, `status`

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado:
- **Inserção**: Qualquer usuário anônimo (anonymous)
- **Leitura**: Apenas status = 'aprovado'
- **Update/Delete**: Apenas service_role (admin)

---

## Agente de IA

### Personalidade

- Tom informal e carioca ("mano", "véi", "massa")
- Levemente irônico quando de bom humor
- Respostas curtas (2-4 frases)
- Empático com problemas do bairro

### Tools Disponíveis

1. **buscarRelatos**: Busca relatos aprovados por categoria
2. **buscarEmpresas**: Busca comércios locais com filtros
3. **obterEstatisticas**: Gera estatísticas agregadas (24h, 7d, 30d)

### Modelo

- **Modelo**: xAI Grok Beta
- **Streaming**: Respostas em tempo real via SSE
- **Custo estimado**: ~$0.001 por mensagem

---

## Deploy

O projeto está configurado para deploy automático na Vercel:

1. Push para a branch `main` ou `v0/*`
2. Vercel builda e deploya automaticamente
3. Configure as variáveis de ambiente no painel da Vercel

---

## Próximos Passos (Roadmap)

### Curto Prazo
- [ ] Implementar upload de múltiplas imagens no admin da vitrine
- [ ] Adicionar paginação no feed de relatos
- [ ] Melhorar sistema de busca no admin

### Médio Prazo
- [ ] Sistema de notificações push (opcional)
- [ ] Gamificação com reputação de usuários
- [ ] RAG avançado com embeddings (pgvector)
- [ ] Analytics e métricas de uso

### Longo Prazo
- [ ] App mobile nativo (React Native)
- [ ] Sistema de eventos da comunidade
- [ ] Marketplace completo com checkout

---

## Contribuindo

### Estrutura de Commits

```
feat: adiciona busca por CEP
fix: corrige bug no carrossel de imagens
docs: atualiza README com novos campos
style: ajusta padding do header
refactor: extrai lógica de moderação
```

### Adicionando Novos Tools ao Agente

1. Definir schema com Zod em `/app/api/chat/route.ts`
2. Implementar função `execute`
3. Adicionar ao objeto `tools` do agente
4. Atualizar instruções do agente se necessário

---

## Troubleshooting

**Chat não responde:**
- Verifique `XAI_API_KEY` no `.env.local`
- Veja logs do console: `[v0] Erro no agente`

**Dados não aparecem:**
- Confirme se o conteúdo está aprovado no `/admin`
- Verifique RLS no Supabase (anonymous read apenas status = 'aprovado')

**Erro CORS em imagens:**
- Normal em dev - imagens do Unsplash têm CORS
- Em produção, use Vercel Blob ou CDN própria

**Carrossel não funciona:**
- Verifique se coluna `images` existe no Supabase (tipo JSONB)
- Confirme que os dados estão no formato array: `["url1", "url2"]`

---

## Licença

MIT

---

## Contato

Dúvidas ou sugestões? Abra uma issue ou entre em contato.

**Desenvolvido com ❤️ para a comunidade de Jacupemba**
