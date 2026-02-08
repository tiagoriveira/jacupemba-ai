# 🚀 Setup Local - Jacupemba AI

## Dependências

```bash
Node.js 18+ 
npm ou pnpm
```

## Instalação

```bash
npm install
```

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase (obrigatorio)
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui

# xAI Grok (obrigatorio)
XAI_API_KEY=sua_chave_xai_aqui

# Admin (opcional - padrão: admin@jacupemba.com / admin123)
NEXT_PUBLIC_ADMIN_EMAIL=seu_email_admin
NEXT_PUBLIC_ADMIN_PASSWORD=sua_senha_admin
```

### Como obter as chaves Supabase:

1. Acesse https://supabase.com/dashboard
2. Selecione o projeto: `ypuzwiqjfsqhttevljtv`
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Rodar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

## Estrutura do Banco de Dados

Tabelas principais (já criadas no Supabase):
- `anonymous_reports` - Relatos anônimos com status (pendente/aprovado/rejeitado)
- `local_businesses` - Comércios e serviços locais
- `vitrine_posts` - Anúncios da vitrine (válidos 48h)

## Rotas Principais

- `/` - Home com chat IA
- `/vitrine` - Vitrine de anúncios
- `/historico` - Histórico de conversas
- `/admin` - Painel administrativo (moderação)

## Sistema de Moderação

Todo conteúdo enviado fica **pendente** até aprovação no painel `/admin`:
1. Usuário envia relato/anúncio/empresa
2. Admin acessa `/admin`
3. Admin aprova ou rejeita
4. Conteúdo aprovado aparece no app

## Troubleshooting

**Chat não responde:**
- Verifique se `XAI_API_KEY` está configurada no `.env.local`

**Dados não aparecem:**
- Verifique se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretas
- Confirme se o conteúdo está **aprovado** no painel admin

**Erro de CORS/imagens:**
- Imagens do Unsplash podem ter CORS - normal em desenvolvimento
