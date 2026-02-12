/**
 * Sistema de Triagem Inteligente para Moderação
 * 
 * @description
 * Analisa relatos automaticamente identificando nível de risco baseado em:
 * - Palavras sensíveis (crime, violência)
 * - Categoria do relato
 * - Características do texto (CAPS, pontuação, URLs)
 * 
 * @module moderacao-triagem
 */

/**
 * Níveis de risco possíveis
 * @typedef {'baixo' | 'medio' | 'alto'} NivelRisco
 */
export type NivelRisco = 'baixo' | 'medio' | 'alto'

/**
 * Resultado da análise de triagem
 * 
 * @interface ResultadoTriagem
 * @property {NivelRisco} nivelRisco - Classificação de risco
 * @property {number} score - Score de 0-100 (quanto maior, mais sensível)
 * @property {string[]} alertas - Lista de alertas identificados
 * @property {number} prioridade - Prioridade 1 (baixo) a 3 (alto)
 */
export interface ResultadoTriagem {
  nivelRisco: NivelRisco
  score: number
  alertas: string[]
  prioridade: number
}

// Palavras que indicam situações sensíveis
const PALAVRAS_ALTO_RISCO = [
  'assalto', 'roubo', 'furto', 'arma', 'faca', 'tiro', 'bala',
  'violência', 'violencia', 'agressão', 'agressao', 'briga', 'morte', 'morto',
  'droga', 'tráfico', 'trafico', 'facção', 'faccao', 'crime',
  'estupro', 'abuso', 'racismo', 'preconceito', 'ameaça', 'ameaca'
]

const PALAVRAS_MEDIO_RISCO = [
  'perigo', 'perigoso', 'suspeito', 'sujeito', 'medo', 'inseguro',
  'cuidado', 'atenção', 'atencao', 'policia', 'polícia', 'pm',
  'barulho', 'briga', 'confusão', 'confusao', 'discussão', 'discussao'
]

/**
 * Analisa um relato e determina seu nível de risco
 * 
 * @param {string} texto - Texto do relato a ser analisado
 * @param {string} categoria - Categoria do relato (seguranca, transito, etc.)
 * @returns {ResultadoTriagem} Resultado da análise com nível de risco e alertas
 * 
 * @description
 * Sistema de pontuação:
 * - Palavras de alto risco: +40 pontos
 * - Palavras de médio risco: +20 pontos
 * - Categoria "segurança": +25 pontos
 * - Texto muito curto (<20 chars): +15 pontos
 * - CAPS LOCK excessivo: +15 pontos
 * - URLs/telefones: +5 pontos
 * 
 * Classificação:
 * - Score >= 50: Alto risco (prioridade 3)
 * - Score >= 25: Médio risco (prioridade 2)
 * - Score < 25: Baixo risco (prioridade 1)
 * 
 * @example
 * ```typescript
 * const resultado = analisarRelato("Teve um assalto na rua X", "seguranca")
 * // => { nivelRisco: 'alto', score: 65, alertas: [...], prioridade: 3 }
 * ```
 */
export function analisarRelato(texto: string, categoria: string): ResultadoTriagem {
  const textoLower = texto.toLowerCase()
  let score = 0
  const alertas: string[] = []

  // 1. Verificar palavras sensíveis (peso alto)
  const temPalavraAltoRisco = PALAVRAS_ALTO_RISCO.some(palavra => textoLower.includes(palavra))
  if (temPalavraAltoRisco) {
    score += 40
    alertas.push('Contém termos sensíveis relacionados a crime/violência')
  }

  const temPalavraMedioRisco = PALAVRAS_MEDIO_RISCO.some(palavra => textoLower.includes(palavra))
  if (temPalavraMedioRisco && !temPalavraAltoRisco) {
    score += 20
    alertas.push('Menciona situação de possível risco')
  }

  // 2. Categoria sensível (peso médio)
  if (categoria === 'seguranca') {
    score += 25
    alertas.push('Categoria: Segurança - requer atenção especial')
  } else if (categoria === 'convivencia') {
    score += 10
  }

  // 3. Tamanho anormal
  if (texto.length < 20) {
    score += 15
    alertas.push('Relato muito curto - pode ser spam')
  }
  if (texto.length > 400) {
    score += 10
    alertas.push('Relato extenso - verificar conteúdo')
  }

  // 4. CAPS LOCK excessivo (indica urgência/emotividade)
  const capsCount = (texto.match(/[A-Z]/g) || []).length
  const capsRatio = capsCount / texto.length
  if (capsRatio > 0.3 && texto.length > 20) {
    score += 15
    alertas.push('Texto em CAPS LOCK - possível urgência/emotividade')
  }

  // 5. Pontuação excessiva (!!!, ???)
  const excessivePunctuation = /[!?]{3,}/.test(texto)
  if (excessivePunctuation) {
    score += 10
    alertas.push('Pontuação excessiva - possível tom alterado')
  }

  // 6. URLs ou telefones (pode ser spam comercial)
  const hasUrl = /https?:\/\/|www\./i.test(texto)
  const hasPhone = /\d{8,}/g.test(texto)
  if (hasUrl || hasPhone) {
    score += 5
    alertas.push('Contém URL ou telefone - verificar spam')
  }

  // Determinar nível de risco baseado no score
  let nivelRisco: NivelRisco
  let prioridade: number

  if (score >= 50) {
    nivelRisco = 'alto'
    prioridade = 3
  } else if (score >= 25) {
    nivelRisco = 'medio'
    prioridade = 2
  } else {
    nivelRisco = 'baixo'
    prioridade = 1
  }

  // Se não tem alertas, é baixo risco
  if (alertas.length === 0) {
    alertas.push('Relato padrão - sem indicadores de risco')
  }

  return {
    nivelRisco,
    score: Math.min(score, 100), // cap at 100
    alertas,
    prioridade
  }
}

// Cores e labels para UI
export const NIVEL_CONFIG = {
  baixo: {
    cor: 'bg-green-100 text-green-800 border-green-200',
    label: 'Baixo Risco',
    icon: '✓'
  },
  medio: {
    cor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Atenção',
    icon: '⚠'
  },
  alto: {
    cor: 'bg-red-100 text-red-800 border-red-200',
    label: 'Alto Risco',
    icon: '🚨'
  }
}
