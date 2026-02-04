'use client'

import { BusinessCard } from './business-card'

interface MessageContentProps {
  text: string
  businesses?: Record<string, any>
}

export function MessageContent({ text, businesses = {} }: MessageContentProps) {
  // Extract business IDs from text using pattern [BUSINESS_ID:uuid]
  const businessIdRegex = /\[BUSINESS_ID:([a-f0-9-]+)\]/g
  const matches = Array.from(text.matchAll(businessIdRegex))
  
  if (matches.length === 0) {
    return <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</div>
  }

  // Remove business ID markers from text
  const cleanText = text.replace(businessIdRegex, '').trim()
  
  // Extract unique business IDs
  const businessIds = Array.from(new Set(matches.map(m => m[1])))
  const relevantBusinesses = businessIds
    .map(id => ({ id, ...businesses[id] }))
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
