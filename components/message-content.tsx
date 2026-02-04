'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BusinessCard } from './business-card'

interface MessageContentProps {
  text: string
  businesses?: Record<string, any>
}

export function MessageContent({ text, businesses = {} }: MessageContentProps) {
  const [loadedBusinesses, setLoadedBusinesses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  // Extract business IDs from text using pattern [BUSINESS_ID:uuid]
  const businessIdRegex = /\[BUSINESS_ID:([a-f0-9-]+)\]/g
  const matches = Array.from(text.matchAll(businessIdRegex))
  
  useEffect(() => {
    if (matches.length === 0) return

    const businessIds = Array.from(new Set(matches.map(m => m[1])))
    const missingIds = businessIds.filter(id => !businesses[id] && !loadedBusinesses[id])
    
    if (missingIds.length === 0) return

    async function fetchBusinesses() {
      setLoading(true)
      const supabase = createClient()
      
      try {
        const { data } = await supabase
          .from('businesses')
          .select('id, business_name, whatsapp, phone, is_verified')
          .in('id', missingIds)
        
        if (data) {
          const businessMap = data.reduce((acc: any, b: any) => {
            acc[b.id] = {
              name: b.business_name,
              whatsapp: b.whatsapp,
              phone: b.phone,
              is_verified: b.is_verified,
            }
            return acc
          }, {})
          setLoadedBusinesses(prev => ({ ...prev, ...businessMap }))
        }
      } catch (error) {
        console.error('Error loading businesses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [text])

  if (matches.length === 0) {
    return <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</div>
  }

  // Remove business ID markers from text
  const cleanText = text.replace(businessIdRegex, '').trim()
  
  // Extract unique business IDs
  const businessIds = Array.from(new Set(matches.map(m => m[1])))
  const allBusinesses = { ...businesses, ...loadedBusinesses }
  const relevantBusinesses = businessIds
    .map(id => ({ id, ...allBusinesses[id] }))
    .filter(b => b.name)

  return (
    <div>
      <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
        {cleanText}
      </div>
      {relevantBusinesses.length > 0 && (
        <div className="space-y-2">
          {relevantBusinesses.map((business) => (
            <BusinessCard
              key={business.id}
              businessId={business.id}
              name={business.name}
              whatsapp={business.whatsapp}
              phone={business.phone}
              isVerified={business.is_verified}
            />
          ))}
        </div>
      )}
    </div>
  )
}
