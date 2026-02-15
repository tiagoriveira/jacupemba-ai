// Gerenciador de conversas em threads (estilo ChatGPT)

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  title: string
  messages: ConversationMessage[]
  created_at: string
  updated_at: string
}

const STORAGE_KEY = 'jacupemba-conversations'
const MAX_CONVERSATIONS = 30

function getConversations(): Conversation[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveConversations(conversations: Conversation[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
}

export function listConversations(): Conversation[] {
  return getConversations().sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
}

export function getConversation(id: string): Conversation | null {
  return getConversations().find(c => c.id === id) || null
}

export function createConversation(firstUserMessage: string, firstAssistantMessage: string): Conversation {
  const now = new Date().toISOString()
  const title = firstUserMessage.length > 60
    ? firstUserMessage.substring(0, 60) + '...'
    : firstUserMessage

  const conversation: Conversation = {
    id: `conv-${Date.now()}`,
    title,
    messages: [
      {
        id: `msg-${Date.now()}-1`,
        role: 'user',
        content: firstUserMessage,
        timestamp: now,
      },
      {
        id: `msg-${Date.now()}-2`,
        role: 'assistant',
        content: firstAssistantMessage,
        timestamp: now,
      },
    ],
    created_at: now,
    updated_at: now,
  }

  const conversations = getConversations()
  conversations.unshift(conversation)

  // Limitar a MAX_CONVERSATIONS
  if (conversations.length > MAX_CONVERSATIONS) {
    conversations.splice(MAX_CONVERSATIONS)
  }

  saveConversations(conversations)
  return conversation
}

export function addMessageToConversation(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Conversation | null {
  const conversations = getConversations()
  const index = conversations.findIndex(c => c.id === conversationId)
  if (index === -1) return null

  const now = new Date().toISOString()
  conversations[index].messages.push({
    id: `msg-${Date.now()}`,
    role,
    content,
    timestamp: now,
  })
  conversations[index].updated_at = now

  saveConversations(conversations)
  return conversations[index]
}

export function deleteConversation(id: string) {
  const conversations = getConversations().filter(c => c.id !== id)
  saveConversations(conversations)
}

export function clearAllConversations() {
  saveConversations([])
}

// Migrar histórico antigo (flat Q&A) para novo formato
export function migrateOldHistory() {
  if (typeof window === 'undefined') return

  const oldHistory = localStorage.getItem('chat-history')
  if (!oldHistory) return

  try {
    const items = JSON.parse(oldHistory)
    if (!Array.isArray(items) || items.length === 0) return

    const existingConversations = getConversations()
    if (existingConversations.length > 0) return // Já migrado

    const newConversations: Conversation[] = items.map((item: any) => ({
      id: `conv-migrated-${item.id || Date.now()}`,
      title: (item.question || '').substring(0, 60) || 'Conversa migrada',
      messages: [
        {
          id: `msg-${item.id}-1`,
          role: 'user' as const,
          content: item.question || '',
          timestamp: item.timestamp || new Date().toISOString(),
        },
        {
          id: `msg-${item.id}-2`,
          role: 'assistant' as const,
          content: item.answer || '',
          timestamp: item.timestamp || new Date().toISOString(),
        },
      ],
      created_at: item.timestamp || new Date().toISOString(),
      updated_at: item.timestamp || new Date().toISOString(),
    }))

    saveConversations(newConversations.slice(0, MAX_CONVERSATIONS))
    // Remover histórico antigo após migração
    localStorage.removeItem('chat-history')
  } catch {
    // Falha silenciosa na migração
  }
}
