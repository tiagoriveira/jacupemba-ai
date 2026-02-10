# Funcionalidades de Memória e Personalização - Frontend

Este documento descreve as novas funcionalidades de memória contextual e personalização implementadas no front-end do Jacupemba AI.

## Funcionalidades Implementadas

### 1. Sistema de Notificações Inteligentes

**Localização:** `/components/NotificationSystem.tsx` + `/lib/notificationManager.ts`

**Descrição:**
- Sistema de toast notifications com 4 tipos: info, success, warning, error
- Posicionamento fixo no canto inferior direito
- Auto-dismiss configurável
- Suporte a ações (botões clicáveis)
- Animações suaves de entrada/saída
- Gerenciador singleton para controle centralizado

**Uso:**
```typescript
import { notificationManager } from '@/lib/notificationManager'

// Notificação de sucesso
notificationManager.success('Título', 'Mensagem de sucesso')

// Notificação com ação
notificationManager.info('Novo conteúdo', 'Há novidades relevantes', {
  duration: 6000,
  action: {
    label: 'Ver agora',
    onClick: () => { /* ação */ }
  }
})
```

---

### 2. Painel de Preferências do Usuário

**Localização:** `/app/preferencias/page.tsx`

**Descrição:**
Página completa para personalização da experiência do usuário com:

#### Categorias de Interesse
- 8 categorias selecionáveis: Comércios, Segurança, Eventos, Trânsito, Infraestrutura, Saúde, Educação, Lazer
- Interface visual com ícones
- Multi-seleção de categorias
- Salvo em `localStorage` como `user-preferences`

#### Tom de Resposta
- 3 opções de tom:
  - **Informal e amigável**: Respostas descontraídas e próximas
  - **Formal e profissional**: Respostas diretas e objetivas
  - **Detalhado e explicativo**: Respostas completas com contexto
- Seleção via radio buttons customizados

#### Controle de Notificações
- Toggle para ativar/desativar notificações contextuais
- Quando ativado, usuário recebe alertas sobre novos relatos nas categorias de interesse

#### Bairro Favorito
- Campo opcional para definir bairro principal
- Usado para personalização futura

**Estrutura de Dados:**
```typescript
interface UserPreferences {
  categoriasInteresse: string[]
  notificacoesAtivas: boolean
  tomResposta: string
  bairroFavorito: string
}
```

---

### 3. Notificações Contextuais Automáticas

**Localização:** `/hooks/useContextNotifications.ts`

**Descrição:**
Hook React que monitora automaticamente novos relatos relevantes:

**Funcionalidades:**
- Verifica novos relatos a cada 2 minutos
- Filtra por categorias de interesse do usuário
- Mostra notificação quando há conteúdo novo
- Respeita preferência `notificacoesAtivas`
- Evita duplicatas com controle de timestamp
- Mostra até 3 novos relatos por verificação

**Comportamento:**
1. Ao carregar página, mostra "Memória ativa" se há preferências salvas
2. Busca relatos aprovados nas últimas 2 minutos
3. Filtra por categorias de interesse
4. Notifica usuário com ação "Ver agora"

---

### 4. Indicador de Memória Ativa

**Localização:** Header em `/app/page.tsx`

**Descrição:**
Badge visual no topo da página mostrando:
- Ícone de cérebro (Brain)
- Contador de mensagens lembradas
- Texto: "X mensagens lembradas"
- Aparece apenas quando há contexto ativo (messages.length > 0)

**Design:**
- Fundo azul claro (blue-50 / blue-950)
- Texto azul escuro (blue-600 / blue-300)
- Posicionado à esquerda no header

---

### 5. Badge de Personalização

**Localização:** Empty state em `/app/page.tsx`

**Descrição:**
Badge exibido na tela inicial quando usuário tem preferências ativas:
- Ícone Sparkles
- Texto: "Personalizado para X categorias"
- Aparece apenas se `categoriasInteresse.length > 0`
- Animação de fade-in suave

---

### 6. Histórico Aprimorado

**Localização:** `/app/historico/page.tsx`

**Melhorias:**
- Contador de conversas salvas
- Cards redesenhados com mais espaço
- Ícone MessageSquare para cada conversa
- Badge "Arquivada" em cada item
- Border superior para separar metadados
- Textos truncados em 180 caracteres (antes: 150)

---

### 7. Feedback Visual em Relatos

**Localização:** Modal de relato em `/app/page.tsx`

**Descrição:**
Quando usuário envia relato com sucesso:
- Notificação toast verde aparece
- Título: "Relato enviado com sucesso!"
- Mensagem: "Seu relato será revisado e publicado em breve. Obrigado por contribuir!"
- Auto-dismiss em 5 segundos

---

## Botão de Preferências no Header

**Localização:** Header em `/app/page.tsx`

Novo botão de configurações (ícone de engrenagem) no header:
- Link direto para `/preferencias`
- Tooltip: "Preferências"
- Responsivo: apenas ícone em mobile

---

## Fluxo de Uso

### Primeira Visita
1. Usuário acessa o site
2. Vê interface padrão sem personalizações
3. Clica no botão de configurações (engrenagem)
4. Define suas preferências (categorias, tom, notificações)
5. Salva preferências

### Visitas Subsequentes
1. Badge "Personalizado para X categorias" aparece na home
2. Badge "Memória ativa" aparece quando há conversa ativa
3. Sistema monitora novos relatos nas categorias de interesse
4. Notificações automáticas aparecem quando há conteúdo relevante
5. Histórico mostra conversas anteriores

---

## Armazenamento Local

Todos os dados são salvos em `localStorage`:

```javascript
// Preferências do usuário
localStorage.getItem('user-preferences')
// Estrutura: { categoriasInteresse, notificacoesAtivas, tomResposta, bairroFavorito }

// Histórico de conversas
localStorage.getItem('chat-history')
// Array de: { id, question, answer, timestamp }

// Feedback de mensagens
localStorage.getItem('message-feedback')
// Object: { [messageId]: 'positive' | 'negative' }
```

---

## Próximos Passos (Backend)

Para funcionalidade completa, será necessário:

1. **Tabela `user_preferences` no Supabase**
   - Migrar dados de localStorage para BD
   - Associar por fingerprint ou user_id

2. **Tabela `conversation_history` no Supabase**
   - Persistir histórico de conversas
   - Sync bidirecional com localStorage

3. **Tabela `user_notifications` no Supabase**
   - Log de notificações enviadas
   - Controle de duplicatas

4. **Vector Embeddings (pgvector)**
   - Busca semântica avançada
   - RAG real com embeddings

5. **RLS Policies**
   - Row Level Security para dados por usuário
   - Segurança anônima baseada em fingerprint

---

## Design System

### Cores Usadas
- Info: `blue-50`, `blue-600`, `blue-950`
- Success: `green-50`, `green-600`, `green-950`
- Warning: `amber-50`, `amber-600`, `amber-950`
- Error: `red-50`, `red-600`, `red-950`
- Preferências: `purple-100`, `purple-600`, `purple-950`

### Animações
- Fade in: `animate-in fade-in-0 duration-150`
- Slide in: `animate-in slide-in-from-bottom-4 duration-500`
- Zoom in: `animate-in zoom-in-95 duration-150`
- Hover scale: `hover:scale-[1.02]`
- Active scale: `active:scale-[0.98]`

### Espaçamento
- Cards: `p-5` ou `p-6`
- Gaps: `gap-2`, `gap-3`, `gap-4`
- Rounded: `rounded-xl` (padrão), `rounded-2xl` (destaque)

---

## Compatibilidade

- ✅ React 18+
- ✅ Next.js 14+ (App Router)
- ✅ TypeScript
- ✅ Tailwind CSS v4
- ✅ Dark mode
- ✅ Responsivo (mobile, tablet, desktop)
- ✅ localStorage disponível
- ✅ Supabase client-side

---

## Considerações de Performance

- **Notificações**: Máximo 3 por verificação, interval de 2 minutos
- **localStorage**: Dados leves (<50KB estimado)
- **Animações**: CSS-only, 60fps
- **Reatividade**: useEffect com cleanup adequado
- **Memória**: Singleton pattern para notificationManager

---

## Acessibilidade

- ✅ Títulos semânticos (h1, h2, h3)
- ✅ Labels em formulários
- ✅ Botões com aria-label implícito
- ✅ Contraste WCAG AA
- ✅ Keyboard navigation
- ✅ Focus states visíveis

---

Implementado por: v0.dev
Data: 2025-02-10
Status: ✅ Pronto para produção (frontend only)
