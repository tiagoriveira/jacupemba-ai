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

export const STRIPE_CONFIG = {
  priceId: 'price_1T1pQCRuGvoeEyYvbxRRMuiU',
  productId: 'prod_Tzp4rR5oif92KO',
  amount: 3000, // R$ 30,00 em centavos
  currency: 'brl',
} as const
