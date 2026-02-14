'use client'

import { useState } from 'react'
import { X, CreditCard, QrCode, FileText, Loader2, CheckCircle2, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  description: string
  onSuccess?: (paymentId: string) => void
}

type PaymentMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD'

export function PaymentModal({ isOpen, onClose, amount, description, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('PIX')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: ''
  })

  if (!isOpen) return null

  const handlePayment = async () => {
    if (!customerData.name || !customerData.email) {
      toast.error('Preencha nome e email')
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customerData,
          billingType: selectedMethod,
          value: amount,
          description
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar pagamento')
      }

      setPaymentData(result.payment)
      toast.success('Pagamento gerado com sucesso!')
      
      if (onSuccess) {
        onSuccess(result.payment.id)
      }

    } catch (error: any) {
      console.error('[v0] Payment error:', error)
      toast.error(error.message || 'Erro ao processar pagamento')
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Pagamento
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!paymentData ? (
            <>
              {/* Amount Display */}
              <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4 text-center">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Valor</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(amount)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{description}</p>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Método de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedMethod('PIX')}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                      selectedMethod === 'PIX'
                        ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800'
                        : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <QrCode className="h-5 w-5" />
                    <span className="text-xs font-medium">PIX</span>
                  </button>
                  <button
                    onClick={() => setSelectedMethod('BOLETO')}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                      selectedMethod === 'BOLETO'
                        ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800'
                        : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-xs font-medium">Boleto</span>
                  </button>
                  <button
                    onClick={() => setSelectedMethod('CREDIT_CARD')}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                      selectedMethod === 'CREDIT_CARD'
                        ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800'
                        : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs font-medium">Cartão</span>
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
                    className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                    placeholder="Seu nome"
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
                    className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    CPF/CNPJ
                  </label>
                  <input
                    type="text"
                    value={customerData.cpfCnpj}
                    onChange={(e) => setCustomerData({ ...customerData, cpfCnpj: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              {/* Generate Payment Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm font-medium text-white dark:text-zinc-900 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>Gerar Pagamento</>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Payment Success */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Pagamento Gerado!
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    ID: {paymentData.id}
                  </p>
                </div>

                {/* PIX QR Code */}
                {selectedMethod === 'PIX' && paymentData.pixQrCodeUrl && (
                  <div className="space-y-2">
                    <img
                      src={paymentData.pixQrCodeUrl}
                      alt="QR Code PIX"
                      className="mx-auto w-48 h-48 border rounded-lg"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={paymentData.pixCode}
                        readOnly
                        className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs"
                      />
                      <button
                        onClick={() => copyToClipboard(paymentData.pixCode)}
                        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 p-2 text-white dark:text-zinc-900"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Boleto Link */}
                {selectedMethod === 'BOLETO' && paymentData.bankSlipUrl && (
                  <a
                    href={paymentData.bankSlipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm font-medium text-white dark:text-zinc-900 text-center"
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
                    className="block text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
                  >
                    Ver fatura completa
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
