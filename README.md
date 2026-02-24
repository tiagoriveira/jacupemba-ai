# 🦜 Jacupemba AI — Assistente do Bairro

> Plataforma hiperlocal que conecta moradores através de um **chat com IA** e uma **vitrine digital** para comércios e serviços.

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Banco-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)

---

## O que é o Jacupemba AI?

O Jacupemba é um assistente virtual de bairro com personalidade de "fofoqueiro ético": ele sabe o que está acontecendo por aí, mas só conta o que tem base nos relatos reais dos moradores.

O app tem dois pilares principais:

### 💬 Chat com IA — gratuito, sem cadastro
- Qualquer pessoa conversa direto com o agente, sem precisar criar conta
- As respostas são baseadas nos **relatos reais dos moradores** e nos **anúncios da vitrine**
- Tom informal, direto, levemente irônico — mas sempre respeitoso e baseado em fatos
- O histório de conversa fica salvo no navegador (sem login necessário)

### 🏪 Vitrine Digital — anuncie sem complicação
- Qualquer pessoa pode criar um anúncio informando **nome e telefone** (sem cadastro)
- **Primeiro anúncio é grátis**; a partir do segundo, custa R$ 30,00 (pago via Stripe)
- Categorias: Produto, Serviço, Comunicado (pagos) e Vaga, Informativo (gratuitos)
- Todo anúncio fica visível por **48 horas** e precisa da aprovação do admin antes de ir ao ar
- Suporte a até **5 imagens** (JPG, PNG, WEBP, GIF — máx 5MB cada) e **1 vídeo** (MP4/WebM/MOV — máx 50MB)

---

## Quem precisa de conta?

| Ação | Precisa de conta? |
|------|------------------|
| Conversar com o chat | ❌ Não |
| Ver a vitrine e relatos | ❌ Não |
| Criar um anúncio na vitrine | ❌ Não (usa nome + telefone) |
| Gerenciar seus anúncios (republicar, excluir) | ✅ Sim — e-mail e senha |
| Acessar o painel admin | ✅ Sim — apenas o e-mail administrador definido nas variáveis |

> O painel do anunciante (`/painel-lojista`) exige login com **e-mail e senha** via Supabase Auth. O Google OAuth também está disponível no código.

---

## Como rodar localmente

### 1. Clone e instale
```bash
git clone <repo-url>
cd jacupemba-ai
npm install
```

### 2. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase (banco de dados)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui

# xAI (inteligência artificial)
XAI_API_KEY=sua_chave_xai_aqui

# Stripe (pagamentos)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# E-mail do administrador (único com acesso ao /admin)
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=seu@email.com

# URL do app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Rode
```bash
npm run dev
```
Acesse: **http://localhost:3000**

---

## Páginas do app

| Página | URL | Acesso |
|--------|-----|--------|
| Chat principal | `/` | Todos (sem login) |
| Vitrine (anúncios) | `/vitrine` | Todos (sem login) |
| Criar anúncio | `/vitrine/criar` | Todos (sem login) |
| Relatos do bairro | `/relatos` | Todos (sem login) |
| Painel do anunciante | `/painel-lojista` | Login com e-mail/senha |
| Admin | `/admin` | Apenas o e-mail administrador |

---

## Como funciona por dentro

### Inteligência Artificial
- **Modelo**: xAI Grok 4 (o modelo mais avançado da xAI)
- O agente tem 4 ferramentas: busca relatos, busca na vitrine, obtém estatísticas e analisa sentimento
- Respostas em tempo real (streaming)
- Personalidade fixa — não é configurável

### Identificação anônima (chat)
Usuários do chat são rastreados por um **fingerprint** gerado no navegador (combinação de informações técnicas do dispositivo). Isso permite salvar histórico de conversas e curtidas sem exigir cadastro.

### Criação de anúncios (vitrine)
O formulário de criação em `/vitrine/criar` pede **nome e telefone**. O telefone é usado como identificador do anunciante — o sistema verifica se é o primeiro post daquele número. **Não é login**: é apenas um campo de contato. Para gerenciar posts depois, é necessário criar uma conta.

### Banco de Dados (Supabase)
Tabelas principais:
- `anonymous_reports` — relatos dos moradores (inserção anônima, leitura só dos aprovados)
- `report_comments` e `anonymous_report_likes` — interações nos relatos
- `vitrine_posts` — anúncios da vitrine (expiram em 48h)
- `local_businesses` — cadastro de comércios locais
- `user_query_history` — histórico de perguntas ao chat

### Admin
Acesso ao painel admin exige login com o e-mail definido em `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`. Apenas esse e-mail tem acesso ao dashboard de moderação (aprovação/rejeição de relatos e anúncios).

---

## Problemas comuns

**Chat não responde**
→ Verifique se `XAI_API_KEY` está correto no `.env.local`

**Dados não aparecem na vitrine ou relatos**
→ O conteúdo precisa de aprovação. Acesse `/admin` e aprove o post.

**Erro ao rodar depois de atualizar o código**
→ Apague o cache e reinicie: delete a pasta `.next` e rode `npm run dev`

**Pagamentos não funcionam**
→ Verifique as chaves do Stripe e se o webhook está configurado apontando para `NEXT_PUBLIC_APP_URL/api/stripe/webhook`

**Não consigo acessar o admin**
→ Certifique-se de que o e-mail de login é exatamente o mesmo que está em `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`

---

## Deploy

O projeto usa **Vercel** para deploy automático:
1. Push para a branch `main`
2. Vercel faz o build e deploy automaticamente
3. Adicione todas as variáveis de ambiente no painel da Vercel

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15, React 19, TailwindCSS v4 |
| Componentes | shadcn/ui, Radix UI |
| Banco de dados | Supabase (PostgreSQL) com RLS |
| Autenticação | Supabase Auth (e-mail/senha + Google OAuth) |
| Pagamentos | Stripe (PIX, Cartão, Boleto) |
| IA | xAI Grok 4 via Vercel AI SDK |
| Deploy | Vercel |

---

**Desenvolvido com ❤️ para a comunidade de Jacupemba**
