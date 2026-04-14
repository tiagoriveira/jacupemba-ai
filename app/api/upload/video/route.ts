import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('video') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Arquivo deve ser um vídeo' },
        { status: 400 }
      )
    }

    // Validar tamanho (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Vídeo muito grande. Máximo 50MB' },
        { status: 400 }
      )
    }

    // Upload para Vercel Blob
    const blob = await put(`videos/${Date.now()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    return NextResponse.json({
      success: true,
      videoUrl: blob.url,
      size: file.size,
    })
  } catch (error: any) {
    console.error('Erro no upload de vídeo:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer upload do vídeo' },
      { status: 500 }
    )
  }
}
