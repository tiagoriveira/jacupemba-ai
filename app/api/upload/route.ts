import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const BUCKET = 'vitrine-images'

// Rate limit simples: max 10 uploads por IP por minuto
const uploadLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkUploadLimit(ip: string): boolean {
  const now = Date.now()
  const entry = uploadLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    uploadLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkUploadLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Muitos uploads. Aguarde um minuto.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhuma imagem enviada' },
        { status: 400 }
      )
    }

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato não permitido. Use: JPG, PNG, WEBP ou GIF' },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Imagem muito grande. Máximo: 5MB' },
        { status: 400 }
      )
    }

    // Gerar nome único
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${timestamp}-${randomStr}.${ext}`

    // Upload para Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao salvar imagem' },
        { status: 500 }
      )
    }

    // URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename)

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      message: 'Imagem enviada com sucesso'
    })

  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { error: 'Erro ao processar upload' },
      { status: 500 }
    )
  }
}
