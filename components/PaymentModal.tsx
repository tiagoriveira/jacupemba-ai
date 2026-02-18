'use client'

import { useState, useCallback } from 'react'
import { X, Loader2, CheckCircle, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  postData: Record<string, any>
  onPaymentComplete?: () => void
}

export function PaymentModal({ isOpen, onClose, amount, postData, onPaymentComplete }: PaymentModalProps) {
  const [isComplete, setIsComplete] = useState(false)

  const fetchClientSecret = useCallback(async () => {
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_phone: postData.contact_phone,
        post_data: postData,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao criar checkout')
    }

    return result.client_secret
  }, [postData])

  if (!isOpen) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleComplete = () => {
    setIsComplete(true)
    toast.success('Pagamento confirmado! Seu anúncio foi enviado para aprovação.')
    onPaymentComplete?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {isComplete ? 'Pagamento Confirmado' : 'Pagamento do Anúncio'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isComplete ? 'Seu anúncio foi enviado para aprovação' : `${formatCurrency(amount)} • Pagamento seguro via Stripe`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {!stripePromise ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Pagamento indisponível</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  O sistema de pagamento não está configurado. Entre em contato com o suporte.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm font-semibold text-white dark:text-zinc-900 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98]"
              >
                Fechar
              </button>
            </div>
          ) : isComplete ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Tudo certo!</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Seu anúncio foi enviado para aprovação e ficará ativo por 48h após aprovado.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm font-semibold text-white dark:text-zinc-900 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98]"
              >
                Fechar
              </button>
            </div>
          ) : (
            <div id="checkout" className="min-h-[400px]">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret, onComplete: handleComplete }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}

          {!isComplete && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Pagamento processado com segurança pelo Stripe</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
