'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2, ArrowRight, Sparkles, CheckCircle2, ShoppingBag, BarChart3, Zap } from 'lucide-react'
import Link from 'next/link'

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'produto'
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleContinue = () => {
    if (step === 1) {
      if (!formData.businessName.trim()) {
        alert('Por favor, informe o nome do negócio')
        return
      }
      setStep(2)
    } else {
      router.push('/vitrine/criar')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-zinc-900/5 dark:bg-zinc-100/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-zinc-900/5 dark:bg-zinc-100/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className={`h-2 w-2 rounded-full transition-all ${step >= 1 ? 'bg-zinc-900 dark:bg-zinc-100 w-8' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
            <div className={`h-2 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
            <div className={`h-2 w-2 rounded-full transition-all ${step >= 3 ? 'bg-zinc-900 dark:bg-zinc-100 w-8' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Step 1: Welcome */}
            {step === 1 && (
              <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <div className="p-8 sm:p-12">
                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200">
                      <Sparkles className="h-8 w-8 text-white dark:text-zinc-900" />
                    </div>
                  </div>

                  <h1 className="mb-3 text-center text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    Bem-vindo à Vitrine!
                  </h1>
                  <p className="mb-8 text-center text-lg text-zinc-600 dark:text-zinc-400">
                    Vamos preparar seu negócio para aparecer na vitrine e alcançar mais clientes.
                  </p>

                  {/* Benefits */}
                  <div className="mb-8 space-y-4">
                    {[
                      { icon: ShoppingBag, title: 'Anuncie Produtos', desc: 'Mostre seus produtos e serviços' },
                      { icon: BarChart3, title: 'Controle Total', desc: 'Gerencie todos os seus anúncios' },
                      { icon: Zap, title: 'Rápido e Fácil', desc: 'Comece agora em poucos minutos' }
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-start gap-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-100 dark:border-zinc-800">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 flex-shrink-0">
                          <benefit.icon className="h-5 w-5 text-white dark:text-zinc-900" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{benefit.title}</h3>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">{benefit.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Form */}
                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block mb-2">
                        Nome do seu Negócio
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder="Ex: Padaria do João"
                        className="w-full rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Confirmation */}
            {step === 2 && (
              <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <div className="p-8 sm:p-12">
                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-green-500">
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  <h1 className="mb-3 text-center text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    Perfeito!
                  </h1>
                  <p className="mb-8 text-center text-lg text-zinc-600 dark:text-zinc-400">
                    Seu negócio está pronto para começar
                  </p>

                  {/* Summary */}
                  <div className="mb-8 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-6 border border-zinc-100 dark:border-zinc-800">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Nome do Negócio:</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formData.businessName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">E-mail:</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <p className="mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    Agora você pode criar seu primeiro anúncio e aparecer na vitrine!
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-8 py-4 sm:px-12 sm:py-6 flex gap-3">
              {step === 2 && (
                <Link
                  href="/painel-lojista"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98]"
                >
                  Ir para Painel
                </Link>
              )}
              <button
                onClick={handleContinue}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-5 py-3 text-sm font-semibold text-white dark:text-zinc-900 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] ${step === 2 ? 'flex' : 'flex'}`}
              >
                {step === 1 ? (
                  <>
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Criar Primeiro Anúncio
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Skip Link */}
          <div className="mt-6 text-center">
            <Link
              href="/painel-lojista"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Pular para o painel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
