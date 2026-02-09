/**
 * Configurações centralizadas para busca semântica
 * Ajuste estes valores conforme necessário
 */

export const EMBEDDING_CONFIG = {
  // Modelo de embedding (OpenAI via AI Gateway)
  model: 'openai/text-embedding-3-small',
  
  // Dimensão do vetor (1536 para text-embedding-3-small)
  dimension: 1536,
  
  // Threshold de similaridade (0-1, quanto maior mais restritivo)
  // 0.9 = muito similar, 0.5 = moderadamente similar
  defaultThreshold: 0.7,
  
  // Threshold reduzido para testes (mais permissivo)
  testThreshold: 0.6,
  
  // Limites de resultados
  defaultLimit: 10,
  maxLimit: 50,
  
  // Rate limiting (ms entre chamadas à API de embedding)
  rateLimitDelay: 100,
  
  // Batch size para processamento em lote
  batchSize: 20,
}

/**
 * Categorias de relatos para melhor contexto
 */
export const REPORT_CATEGORIES = [
  'seguranca',
  'transito',
  'saude',
  'infraestrutura',
  'educacao',
  'meio-ambiente',
  'eventos',
  'comercio',
  'servicos',
  'outro',
] as const

/**
 * Categorias de comercios para melhor contexto
 */
export const BUSINESS_CATEGORIES = [
  'alimentacao',
  'saude',
  'educacao',
  'servicos',
  'comercio',
  'lazer',
  'beleza',
  'automotivo',
  'construcao',
  'tecnologia',
  'outro',
] as const

/**
 * Exemplos de queries semânticas para cada categoria
 */
export const SEMANTIC_EXAMPLES = {
  alimentacao: [
    'comida rápida',
    'refeição',
    'lanche',
    'jantar',
    'café da manhã',
    'delivery',
  ],
  saude: [
    'consulta médica',
    'remédio',
    'emergência',
    'dentista',
    'exame',
  ],
  seguranca: [
    'roubo',
    'assalto',
    'perigo',
    'iluminação ruim',
    'vigilância',
  ],
  transito: [
    'congestionamento',
    'buraco na rua',
    'acidente',
    'obras na via',
  ],
} as const
