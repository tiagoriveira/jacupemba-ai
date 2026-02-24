# 🦜 Jacupemba AI — Assistente do Bairro

> Plataforma hiperlocal que conecta moradores através de um **chat com IA** e uma **vitrine digital** para comércios e serviços.

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Banco-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)

---

## O que é o Jacupemba AI?

O Jacupemba é um assistente virtual de bairro. Pense nele como o "fofoqueiro ético" da sua rua: ele sabe o que está acontecendo por aí, mas só conta o que é verdade e com responsabilidade.

Ele tem dois pilares:

### 💬 Chat com IA (gratuito para todos)
- Qualquer pessoa pode conversar com o agente sem precisar criar conta
- Ele responde com base nos **relatos reais dos moradores**
- Tom informal, direto e levemente sarcástico — mas respeitoso
- Sem inventar informações: tudo baseado em dados reais do bairro

### 🏪 Vitrine Digital (para quem quer anunciar)
- Posts de **48 horas** com foto, descrição e contato
- Categorias: Produto, Serviço, Comunicado (pagos via Stripe) e Vagas/Informativos (gratuitos)
- Criação de conta necessaria
- Posts precisam de aprovação do admin antes de aparecer

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

# Admin (e-mail do super administrador)
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=seu@email.com

# URL do app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Rode
```bash
npm run dev
```
Acesse: **link do vercel**

---

## Páginas do app

| Página | URL | Quem acessa |
|--------|-----|-------------|
| Chat principal | `/` | Todos |
| Vitrine (anúncios) | `/vitrine` | Todos |
| Criar anúncio | `/vitrine/criar` | Quem quer anunciar |
| Relatos do bairro | `/relatos` | Todos |
| Painel do anunciante | `/painel-lojista` | Anunciantes |
| Admin | `/admin` | Administrador |

---

## Como funciona por dentro

### Inteligência Artificial
- **Modelo**: xAI Grok 4 (o mais avançado da xAI)
- **Ferramentas do agente**: busca relatos, busca na vitrine, obtém estatísticas, analisa sentimento
- Respostas em tempo real (streaming)

### Banco de Dados (Supabase)
Principais tabelas:
- `anonymous_reports` — relatos dos moradores
- `report_comments` e `report_likes` — interações nos relatos
- `vitrine_posts` — anúncios da vitrine (expiram em 48h)
- `vitrine_payments` — controle de pagamentos dos anúncios
- `local_businesses` — cadastro de comércios locais
- `user_query_history` — histórico de perguntas ao chat

### Identificação sem login
Usuários anônimos são rastreados por um **fingerprint** gerado no navegador (combinação de informações técnicas do dispositivo). Isso permite salvar histórico de conversas e curtidas sem exigir cadastro.

### Admin
O acesso ao painel admin é controlado pelo e-mail definido em `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`. Apenas esse e-mail tem acesso à moderação.

---

## Problemas comuns

**Chat não responde**
→ Verifique se `XAI_API_KEY` está correto no `.env.local`

**Dados não aparecem na vitrine ou relatos**
→ O conteúdo precisa estar com `status = 'aprovado'` no banco. Acesse `/admin` para aprovar.

**Erro ao rodar depois de atualizar o código**
→ Apague a pasta `.next` e reinicie: `npx rimraf .next && npm run dev`

**Pagamentos não funcionam**
→ Verifique as chaves do Stripe e se o webhook está configurado corretamente.

---

## Deploy

O projeto usa **Vercel** para deploy automático:
1. Push para a branch `main`
2. Vercel faz o build e deploy automaticamente
3. Configure todas as variáveis de ambiente no painel da Vercel

---

## Tecnologias usadas

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15, React 19, TailwindCSS v4 |
| Componentes | shadcn/ui, Radix UI |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Pagamentos | Stripe (PIX, Cartão, Boleto) |
| IA | xAI Grok 4 via Vercel AI SDK |
| Deploy | Vercel |

---

**Desenvolvido para a comunidade de Jacupemba**
