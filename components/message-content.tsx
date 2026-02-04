'use client'

interface MessageContentProps {
  text: string
  businesses?: Record<string, any>
}

export function MessageContent({ text }: MessageContentProps) {
  // Remove business ID markers from text for clean display
  const cleanText = text.replace(/\[BUSINESS_ID:[a-f0-9-]+\]/g, '').trim()

  return (
    <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
      {cleanText}
    </div>
  )
}
