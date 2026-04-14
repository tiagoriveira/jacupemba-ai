import Stripe from 'stripe'

// Lazy init to avoid build-time errors when env vars aren't available
let _stripe: Stripe | null = null

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    if (!_stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY não configurada nas variáveis de ambiente')
      }
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    }
    return (_stripe as any)[prop]
  },
})

// Preços por categoria - criar esses prices no Stripe Dashboard
export const STRIPE_PRICES = {
  produto: {
    priceId: process.env.STRIPE_PRICE_PRODUTO || 'price_produto_15',
    amount: 1500, // R$ 15,00
  },
  servico: {
    priceId: process.env.STRIPE_PRICE_SERVICO || 'price_servico_15',
    amount: 1500, // R$ 15,00
  },
  comunicado: {
    priceId: process.env.STRIPE_PRICE_COMUNICADO || 'price_comunicado_20',
    amount: 2000, // R$ 20,00
  },
} as const

// Fallback para compatibilidade (usar preço de produto)
export const STRIPE_CONFIG = {
  priceId: process.env.STRIPE_PRICE_DEFAULT || STRIPE_PRICES.produto.priceId,
  productId: process.env.STRIPE_PRODUCT_ID || 'prod_default',
  amount: 1500, // R$ 15,00 em centavos
  currency: 'brl',
} as const

export function getStripePriceForCategory(category: string): { priceId: string; amount: number } {
  switch (category) {
    case 'produto':
      return STRIPE_PRICES.produto
    case 'servico':
      return STRIPE_PRICES.servico
    case 'comunicado':
      return STRIPE_PRICES.comunicado
    default:
      return STRIPE_PRICES.produto
  }
}
