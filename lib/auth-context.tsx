'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata?: { name?: string }) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('[v0] auth-context - signIn chamado', { email })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      console.log('[v0] auth-context - signIn resultado', { 
        error: error?.message, 
        userId: data?.user?.id 
      })
      return { error }
    } catch (error) {
      console.error('[v0] auth-context - signIn exception:', error)
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
    console.log('[v0] auth-context - signUp chamado', { email, metadata })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })
      console.log('[v0] auth-context - signUp resultado', { 
        error: error?.message, 
        userId: data?.user?.id,
        needsConfirmation: !data?.session 
      })
      return { error }
    } catch (error) {
      console.error('[v0] auth-context - signUp exception:', error)
      return { error: error as Error }
    }
  }

  const signInWithGoogle = async () => {
    console.log('[v0] auth-context - signInWithGoogle chamado')
    try {
      const redirectUrl = `${window.location.origin}/painel-lojista`
      console.log('[v0] auth-context - Redirect URL:', redirectUrl)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })
      
      console.log('[v0] auth-context - signInWithGoogle resultado', { 
        error: error?.message,
        hasData: !!data,
        url: data?.url
      })
      
      return { error }
    } catch (error) {
      console.error('[v0] auth-context - signInWithGoogle exception:', error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
