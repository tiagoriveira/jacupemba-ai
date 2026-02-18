import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] // quicktime = .mov
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
const IMAGE_BUCKET = 'vitrine-images'
const VIDEO_BUCKET = 'vitrine-videos'

// Rate limiting em serverless não funciona com Map em memória.
// Para produção real, usar Vercel KV, Upstash Redis ou Supabase.

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = (formData.get('image') || formData.get('video')) as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Detectar se é imagem ou vídeo
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Formato não permitido. Use: JPG, PNG, WEBP, GIF (imagens) ou MP4, WebM, MOV (vídeos)' },
        { status: 400 }
      )
    }

    // Validar tamanho
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
    if (file.size > maxSize) {
      const maxSizeMB = isImage ? '5MB' : '50MB'
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: ${maxSizeMB}` },
        { status: 400 }
      )
    }

    // Selecionar bucket correto
    const bucket = isImage ? IMAGE_BUCKET : VIDEO_BUCKET

    // Gerar nome único
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const ext = file.name.split('.').pop()?.toLowerCase() || (isImage ? 'jpg' : 'mp4')
    const filename = `${timestamp}-${randomStr}.${ext}`

    // Upload para Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao salvar arquivo' },
        { status: 500 }
      )
    }

    // URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename)

    return NextResponse.json({
      success: true,
      [isImage ? 'imageUrl' : 'videoUrl']: publicUrl,
      type: isImage ? 'image' : 'video',
      message: `${isImage ? 'Imagem' : 'Vídeo'} enviado com sucesso`
    })

  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { error: 'Erro ao processar upload' },
      { status: 500 }
    )
  }
}
