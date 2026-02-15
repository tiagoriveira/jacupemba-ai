'use client'

import { useState } from 'react'
import { X, Loader2, Mail, Lock, User as UserIcon, Chrome } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  redirectToOnboarding?: boolean
}

export function AuthModal({ isOpen, onClose, onSuccess, redirectToOnboarding = true }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log('[v0] AuthModal - Iniciando autenticação', { mode, email: formData.email })

    try {
      if (mode === 'signup') {
        console.log('[v0] AuthModal - Tentando criar conta', { 
          email: formData.email, 
          name: formData.name,
          hasPassword: !!formData.password 
        })
        
        const { error } = await signUp(formData.email, formData.password, {
          name: formData.name,
        })

        console.log('[v0] AuthModal - Resultado signup', { error: error?.message })

        if (error) {
          console.error('[v0] AuthModal - Erro no signup:', error)
          
          // Tratamento de erros específicos de cadastro
          if (error.message?.includes('already registered')) {
            toast.error('Este e-mail já está cadastrado. Tente fazer login.')
          } else {
            toast.error(error.message || 'Erro ao criar conta')
          }
        } else {
          // Mensagem clara sobre confirmação de email
          toast.success('Conta criada com sucesso!', { duration: 3000 })
          toast.info('Verifique seu e-mail e clique no link de confirmação para ativar sua conta.', { 
            duration: 8000 
          })
          
          // Limpar formulário
          setFormData({ name: '', email: '', password: '' })
          
          // Mudar para modo login após alguns segundos
          setTimeout(() => {
            setMode('login')
          }, 2000)
        }
      } else {
        console.log('[v0] AuthModal - Tentando fazer login', { email: formData.email })
        
        const { error } = await signIn(formData.email, formData.password)

        console.log('[v0] AuthModal - Resultado login', { error: error?.message })

        if (error) {
          console.error('[v0] AuthModal - Erro no login:', error)
          
          // Tratamento específico para email não confirmado
          if (error.message?.includes('Email not confirmed')) {
            toast.error('Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.', {
              duration: 5000,
            })
          } else if (error.message?.includes('Invalid login credentials')) {
            toast.error('E-mail ou senha incorretos')
          } else {
            toast.error(error.message || 'Erro ao fazer login')
          }
        } else {
          toast.success('Login realizado com sucesso!')
          onClose()
          
          console.log('[v0] AuthModal - Redirecionando para painel')
          setTimeout(() => {
            router.push('/painel-lojista')
          }, 500)
        }
      }
    } catch (error) {
      console.error('[v0] AuthModal - Erro inesperado:', error)
      toast.error('Erro ao processar solicitação')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    console.log('[v0] AuthModal - Iniciando login com Google')
    setLoading(true)
    try {
      const { error } = await signInWithGoogle()
      console.log('[v0] AuthModal - Resultado Google login', { error: error?.message })
      
      if (error) {
        console.error('[v0] AuthModal - Erro no Google login:', error)
        toast.error('Erro ao conectar com Google')
      } else {
        console.log('[v0] AuthModal - Google login iniciado com sucesso')
      }
    } catch (error) {
      console.error('[v0] AuthModal - Erro inesperado Google:', error)
      toast.error('Erro ao processar solicitação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in-0 duration-200 p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 z-10 rounded-full bg-zinc-100 dark:bg-zinc-800 p-2 text-zinc-600 dark:text-zinc-400 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-zinc-100">
              <UserIcon className="h-6 w-6 text-white dark:text-zinc-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {mode === 'login' ? 'Bem-vindo' : 'Criar Conta'}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Para anunciar na vitrine
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-5">
          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border-2 border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 shadow-sm"
          >
            <Chrome className="h-5 w-5" />
            Continuar com Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs font-medium uppercase tracking-wider">
              <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 dark:text-zinc-500">
                Ou com e-mail
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Nome do Negócio
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <UserIcon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Padaria do João"
                    required
                    disabled={loading}
                    className="w-full rounded-2xl border-2 border-zinc-200 bg-white pl-14 pr-4 py-3.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-900 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <Mail className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-zinc-200 bg-white pl-14 pr-4 py-3.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-900 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Senha
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <Lock className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-zinc-200 bg-white pl-14 pr-4 py-3.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-900 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
                />
              </div>
              {mode === 'signup' && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                  Mínimo de 6 caracteres
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg shadow-zinc-900/10 dark:shadow-zinc-100/10"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>{mode === 'login' ? 'Entrar na Conta' : 'Criar Minha Conta'}</>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              disabled={loading}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-50 transition-colors"
            >
              {mode === 'login' ? (
                <>
                  Não tem conta? <span className="font-bold underline underline-offset-2">Criar agora</span>
                </>
              ) : (
                <>
                  Já tem conta? <span className="font-bold underline underline-offset-2">Fazer login</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
