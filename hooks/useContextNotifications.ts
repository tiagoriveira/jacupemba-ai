import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { notificationManager } from '@/lib/notificationManager'

interface UserPreferences {
  categoriasInteresse: string[]
  notificacoesAtivas: boolean
}

/**
 * Hook que monitora novos relatos e notifica o usuário quando há conteúdo relevante
 * baseado nas preferências salvas e nas buscas recentes
 */
export function useContextNotifications() {
  const lastCheckRef = useRef<Date>(new Date())
  const hasShownWelcomeRef = useRef(false)

  useEffect(() => {
    // Show welcome notification once
    if (!hasShownWelcomeRef.current) {
      hasShownWelcomeRef.current = true
      
      const preferences = localStorage.getItem('user-preferences')
      if (preferences) {
        const parsed = JSON.parse(preferences) as UserPreferences
        if (parsed.notificacoesAtivas) {
          notificationManager.info(
            'Memória ativa',
            'Suas preferências e histórico estão sendo usados para personalizar as respostas.',
            { duration: 4000 }
          )
        }
      }
    }

    // Check for new relevant content every 2 minutes
    const checkForNewContent = async () => {
      try {
        const prefsData = localStorage.getItem('user-preferences')
        if (!prefsData) return

        const preferences = JSON.parse(prefsData) as UserPreferences
        if (!preferences.notificacoesAtivas || preferences.categoriasInteresse.length === 0) {
          return
        }

        // Check for new reports in user's interested categories
        const { data: newReports, error } = await supabase
          .from('anonymous_reports')
          .select('id, text, category, created_at')
          .in('category', preferences.categoriasInteresse)
          .eq('status', 'aprovado')
          .gte('created_at', lastCheckRef.current.toISOString())
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) {
          console.error('[v0] Error checking for new content:', error)
          return
        }

        if (newReports && newReports.length > 0) {
          lastCheckRef.current = new Date()
          
          // Show notification for new relevant content
          const categories = [...new Set(newReports.map(r => r.category))]
          const categoryLabels: Record<string, string> = {
            'comercio': 'comércios',
            'seguranca': 'segurança',
            'eventos': 'eventos',
            'transito': 'trânsito',
            'infraestrutura': 'infraestrutura',
            'saude': 'saúde',
            'educacao': 'educação',
            'lazer': 'lazer',
          }
          
          const categoryNames = categories
            .map(c => categoryLabels[c] || c)
            .slice(0, 2)
            .join(' e ')

          notificationManager.info(
            `${newReports.length} ${newReports.length === 1 ? 'novo relato' : 'novos relatos'}`,
            `Há novidades sobre ${categoryNames} no seu bairro.`,
            {
              duration: 6000,
              action: {
                label: 'Ver agora',
                onClick: () => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }
            }
          )
        }
      } catch (error) {
        console.error('[v0] Error in context notifications:', error)
      }
    }

    // Check immediately and then every 2 minutes
    checkForNewContent()
    const interval = setInterval(checkForNewContent, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])
}
