'use client'

import { useState } from 'react'
import { X, CreditCard, QrCode, FileText, Loader2, CheckCircle2, Copy, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  category: string
  amount: number
  postData: Record<string, any>
  onSuccess?: (paymentId: string) => void
}

type PaymentMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD'

const CATEGORY_LABELS: Record<string, string> = {
  produto: 'Produto',
  servico: 'Serviço',
  comunicado: 'Comunicado',
}

export function PaymentModal({ isOpen, onClose, category, amount, postData, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('PIX')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form')
  const [customerData, setCustomerData] = useState({
    name: postData.contact_name || '',
    email: '',
  })

  if (!isOpen) return null

  const handlePayment = async () => {
    if (!customerData.name.trim() || !customerData.email.trim()) {
      toast.error('Preencha nome e email para continuar')
      return
    }

    // Validar email básico
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      toast.error('Informe um email válido')
      return
    }

    setIsProcessing(true)

    try {
      // 1. Criar pagamento via Asaas
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: postData.contact_phone || 'anonymous',
          user_email: customerData.email,
          user_name: customerData.name,
          category,
          billingType: selectedMethod,
          post_data: postData,
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar pagamento')
      }

      setPaymentData(result.payment)
      setStep('payment')
      toast.success('Pagamento gerado com sucesso!')

      if (onSuccess) {
        onSuccess(result.payment.id)
      }

    } catch (error: any) {
      console.error('[Payment] Erro:', error)
      toast.error(error.message || 'Erro ao processar pagamento')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreatePostAfterPayment = async () => {
    if (!paymentData?.id) return

    setIsProcessing(true)
    try {
      // Criar o post com payment_id
      const response = await fetch('/api/vitrine/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...postData,
          payment_id: paymentData.id,
        })
      })

      const result = await response.json()

      if (result.success) {
        setStep('success')
        toast.success('Post criado com sucesso!')
      } else {
        toast.error(result.error || 'Erro ao criar post')
      }
    } catch (error: any) {
      console.error('[Post] Erro:', error)
      toast.error('Erro ao criar post')
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Código PIX copiado!')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleClose = () => {
    if (step === 'success') {
      // Redirecionar para painel após sucesso
      window.location.href = '/painel-lojista'
      return
    }
    if (step === 'payment' && !confirm('O pagamento já foi gerado. Tem certeza que deseja sair?')) {
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-5">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {step === 'success' ? 'Post Enviado! ✅' : step === 'payment' ? 'Dados de Pagamento' : 'Pagamento para Anunciar'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {step === 'success' ? 'Aguardando confirmação de pagamento' : `Categoria: ${CATEGORY_LABELS[category] || category}`}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {step === 'form' && (
            <>
              {/* Amount Display */}
              <div className="rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 p-5 text-center">
                <p className="text-sm text-zinc-400">Valor do anúncio</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(amount)}
                </p>
                <p className="text-xs text-zinc-400 mt-2">
                  Seu anúncio ficará ativo por 48h após aprovação
                </p>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Método de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedMethod('PIX')}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${selectedMethod === 'PIX'
                        ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800 ring-2 ring-zinc-900/10 dark:ring-zinc-100/10'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                  >
                    <QrCode className="h-5 w-5" />
                    <span className="text-xs font-semibold">PIX</span>
                  </button>
                  <button
                    onClick={() => setSelectedMethod('BOLETO')}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${selectedMethod === 'BOLETO'
                        ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800 ring-2 ring-zinc-900/10 dark:ring-zinc-100/10'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-xs font-semibold">Boleto</span>
                  </button>
                  <button
                    onClick={() => setSelectedMethod('CREDIT_CARD')}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${selectedMethod === 'CREDIT_CARD'
                        ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800 ring-2 ring-zinc-900/10 dark:ring-zinc-100/10'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs font-semibold">Cartão</span>
                  </button>
                </div>
              </div>

              {/* Customer Data Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                    placeholder="Email"
                  />
                </div>
              </div>

              {/* Generate Payment Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-3.5 text-sm font-semibold text-white dark:text-zinc-900 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Gerar Pagamento — {formatCurrency(amount)}
                  </>
                )}
              </button>

              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
                Após o pagamento, seu anúncio será enviado para aprovação.
              </p>
            </>
          )}

          {step === 'payment' && paymentData && (
            <>
              {/* Payment Generated */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                    Pagamento Gerado!
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    ID: {paymentData.id}
                  </p>
                </div>

                {/* PIX QR Code */}
                {selectedMethod === 'PIX' && paymentData.pixQrCodeUrl && (
                  <div className="space-y-3">
                    <img
                      src={paymentData.pixQrCodeUrl}
                      alt="QR Code PIX"
                      className="mx-auto w-48 h-48 border rounded-xl"
                    />
                    {paymentData.pixCode && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={paymentData.pixCode}
                          readOnly
                          className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs"
                        />
                        <button
                          onClick={() => copyToClipboard(paymentData.pixCode)}
                          className="rounded-xl bg-zinc-900 dark:bg-zinc-100 p-2.5 text-white dark:text-zinc-900 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Boleto Link */}
                {selectedMethod === 'BOLETO' && paymentData.bankSlipUrl && (
                  <a
                    href={paymentData.bankSlipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm font-semibold text-white dark:text-zinc-900 text-center transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200"
                  >
                    Abrir Boleto
                  </a>
                )}

                {/* Invoice Link */}
                {paymentData.invoiceUrl && (
                  <a
                    href={paymentData.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
                  >
                    Ver fatura completa →
                  </a>
                )}

                {/* Create Post Button */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                    Após efetuar o pagamento, clique abaixo para enviar seu anúncio:
                  </p>
              <button
                onClick={handleWhatsAppContact}
                disabled={!payment.payment_url}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-3.5 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:shadow-md disabled:opacity-50 active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                Contato via WhatsApp
              </button>
                </div>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Anúncio Enviado!
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-xs mx-auto">
                  Seu anúncio foi enviado para aprovação. Após a confirmação do pagamento e aprovação do administrador, ele ficará visível na vitrine por 48 horas.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-3.5 text-sm font-semibold text-white dark:text-zinc-900 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98]"
              >
                <ShoppingBag className="h-4 w-4" />
                Ver Meus Posts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
