# Backend Implementation Spec - Jacupemba AI v0.2

> **Para**: Agente do Supabase  
> **Objetivo**: Implementar migrations, storage setup e otimizações necessárias para features de analytics, feedback e storage

---

## 📊 1. Analytics de Vitrine (Tracking de Cliques)

### Migration SQL

```sql
-- Criar tabela de analytics
CREATE TABLE IF NOT EXISTS vitrine_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES vitrine_posts(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'whatsapp_click', 'share')),
  user_fingerprint TEXT, -- Opcional para alguns eventos
  metadata JSONB DEFAULT '{}', -- Para dados adicionais
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX idx_vitrine_analytics_post_id ON vitrine_analytics(post_id);
CREATE INDEX idx_vitrine_analytics_created_at ON vitrine_analytics(created_at DESC);
CREATE INDEX idx_vitrine_analytics_action_type ON vitrine_analytics(action_type);

-- RLS Policies
ALTER TABLE vitrine_analytics ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode inserir eventos (anônimo)
CREATE POLICY "Anyone can insert analytics events"
  ON vitrine_analytics FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Apenas admins podem ler analytics
CREATE POLICY "Only admins can read analytics"
  ON vitrine_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- View para facilitar queries
CREATE OR REPLACE VIEW vitrine_post_stats AS
SELECT 
  vp.id as post_id,
  vp.title,
  vp.contact_name,
  COUNT(*) FILTER (WHERE va.action_type = 'view') as view_count,
  COUNT(*) FILTER (WHERE va.action_type = 'whatsapp_click') as whatsapp_click_count,
  COUNT(*) FILTER (WHERE va.action_type = 'share') as share_count,
  MAX(va.created_at) as last_interaction_at
FROM vitrine_posts vp
LEFT JOIN vitrine_analytics va ON va.post_id = vp.id
WHERE vp.status = 'aprovado'
GROUP BY vp.id, vp.title, vp.contact_name;
```

### API Route: `/api/analytics/track`

**Frontend já está preparado** com `console.log('[ANALYTICS]', ...)` nos pontos de tracking.

**Backend a implementar:**

```typescript
// app/api/analytics/track/route.ts
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { post_id, action_type, user_fingerprint, metadata } = await req.json()

  // Validação
  if (!post_id || !action_type) {
    return new Response('Missing required fields', { status: 400 })
  }

  if (!['view', 'whatsapp_click', 'share'].includes(action_type)) {
    return new Response('Invalid action_type', { status: 400 })
  }

  // Inserir evento
  const { error } = await supabase
    .from('vitrine_analytics')
    .insert({
      post_id,
      action_type,
      user_fingerprint: user_fingerprint || null,
      metadata: metadata || {}
    })

  if (error) {
    console.error('Analytics error:', error)
    return new Response('Error tracking event', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
```

**Pontos no Frontend para trocar `console.log` por [fetch](file:///c:/Users/tiago/jacupemba-ai/components/VitrineGrid.tsx#51-76):**
- [components/VitrineGrid.tsx](file:///c:/Users/tiago/jacupemba-ai/components/VitrineGrid.tsx) linha ~87: [handleWhatsAppClick](file:///c:/Users/tiago/jacupemba-ai/components/VitrineGrid.tsx#82-98)
- Adicionar tracking de `view` ao abrir o modal de detalhes
- Adicionar tracking de `share` na função [handleShare](file:///c:/Users/tiago/jacupemba-ai/components/VitrineGrid.tsx#99-105)

---

## 👍 2. Feedback de Chat

### Migration SQL

```sql
-- Criar tabela de feedback
CREATE TABLE IF NOT EXISTS chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL, -- ID da mensagem do useChat
  is_positive BOOLEAN NOT NULL, -- true = thumbs up, false = thumbs down
  comment TEXT, -- Opcional: usuário pode deixar um comentário escrito
  user_fingerprint TEXT, -- Para evitar spam
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_chat_feedback_message_id ON chat_feedback(message_id);
CREATE INDEX idx_chat_feedback_created_at ON chat_feedback(created_at DESC);

-- RLS
ALTER TABLE chat_feedback ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode enviar feedback (anônimo)
CREATE POLICY "Anyone can insert feedback"
  ON chat_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Apenas admins podem ler feedback
CREATE POLICY "Only admins can read feedback"
  ON chat_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- View para dashboard de feedback
CREATE OR REPLACE VIEW chat_feedback_summary AS
SELECT 
  DATE(created_at) as feedback_date,
  COUNT(*) FILTER (WHERE is_positive = true) as positive_count,
  COUNT(*) FILTER (WHERE is_positive = false) as negative_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE is_positive = true) / NULLIF(COUNT(*), 0),
    2
  ) as positive_percentage
FROM chat_feedback
GROUP BY DATE(created_at)
ORDER BY feedback_date DESC;
```

### API Route: `/api/feedback`

```typescript
// app/api/feedback/route.ts
import { supabase } from '@/lib/supabase'
import { getUserFingerprint } from '@/lib/fingerprint'

export async function POST(req: Request) {
  const { message_id, is_positive, comment } = await req.json()

  // Validação
  if (!message_id || typeof is_positive !== 'boolean') {
    return new Response('Missing required fields', { status: 400 })
  }

  // Evitar spam: checar se já tem feedback deste user para esta mensagem
  const fingerprint = getUserFingerprint() // Assumindo que essa função existe
  
  const { data: existing } = await supabase
    .from('chat_feedback')
    .select('id')
    .eq('message_id', message_id)
    .eq('user_fingerprint', fingerprint)
    .single()

  if (existing) {
    // Atualizar feedback existente ao invés de duplicar
    const { error } = await supabase
      .from('chat_feedback')
      .update({ is_positive, comment: comment || null })
      .eq('id', existing.id)

    if (error) {
      console.error('Feedback update error:', error)
      return new Response('Error updating feedback', { status: 500 })
    }

    return new Response('Feedback updated', { status: 200 })
  }

  // Inserir novo feedback
  const { error } = await supabase
    .from('chat_feedback')
    .insert({
      message_id,
      is_positive,
      comment: comment || null,
      user_fingerprint: fingerprint
    })

  if (error) {
    console.error('Feedback error:', error)
    return new Response('Error saving feedback', { status: 500 })
  }

  return new Response('Feedback saved', { status: 201 })
}
```

**Ponto no Frontend para trocar `console.log` por [fetch](file:///c:/Users/tiago/jacupemba-ai/components/VitrineGrid.tsx#51-76):**
- [app/page.tsx](file:///c:/Users/tiago/jacupemba-ai/app/page.tsx) linha ~258: função [handleMessageFeedback](file:///c:/Users/tiago/jacupemba-ai/app/page.tsx#256-270)

---

## 🗂️ 3. Supabase Storage (Migração de Base64)

### Setup do Storage Bucket

```sql
-- Criar bucket público para imagens da vitrine
INSERT INTO storage.buckets (id, name, public)
VALUES ('vitrine', 'vitrine', true)
ON CONFLICT DO NOTHING;

-- Política: Qualquer um pode ler
CREATE POLICY "Public can read vitrine images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'vitrine');

-- Política: Apenas authenticated podem fazer upload
CREATE POLICY "Authenticated can upload vitrine images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vitrine');

-- Criar bucket privado para comprovantes PIX
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT DO NOTHING;

-- Política: Apenas admins podem ler comprovantes
CREATE POLICY "Only admins can read payment proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Política: Authenticated podem fazer upload de comprovantes
CREATE POLICY "Authenticated can upload payment proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs');
```

### Helper Functions para Upload

**Criar arquivo: `lib/uploadImage.ts`**

```typescript
import { supabase } from './supabase'

export async function uploadImageToStorage(
  file: File,
  bucket: 'vitrine' | 'payment-proofs'
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    // Retornar URL público
    if (bucket === 'vitrine') {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
      return data.publicUrl
    } else {
      // Para payment-proofs, retornar path (não URL público)
      return filePath
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}

export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Signed URL error:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error getting signed URL:', error)
    return null
  }
}
```

### Migração de Base64 para Storage

**Script de migração** (rodar uma vez para limpar base64 existente):

```typescript
// scripts/migrate-images-to-storage.ts
import { supabase } from '@/lib/supabase'

async function migrateImagesToStorage() {
  // Buscar posts com image_url em base64
  const { data: posts, error } = await supabase
    .from('vitrine_posts')
    .select('id, image_url, payment_proof_url')
    .or('image_url.like.data:image%,payment_proof_url.like.data:image%')

  if (error) {
    console.error('Error fetching posts:', error)
    return
  }

  console.log(`Found ${posts.length} posts with base64 images`)

  for (const post of posts) {
    // Migrar image_url
    if (post.image_url?.startsWith('data:image')) {
      const newUrl = await uploadBase64ToStorage(post.image_url, 'vitrine', post.id)
      if (newUrl) {
        await supabase
          .from('vitrine_posts')
          .update({ image_url: newUrl })
          .eq('id', post.id)
        console.log(`Migrated image for post ${post.id}`)
      }
    }

    // Migrar payment_proof_url
    if (post.payment_proof_url?.startsWith('data:image')) {
      const newPath = await uploadBase64ToStorage(post.payment_proof_url, 'payment-proofs', post.id)
      if (newPath) {
        await supabase
          .from('vitrine_posts')
          .update({ payment_proof_url: newPath })
          .eq('id', post.id)
        console.log(`Migrated payment proof for post ${post.id}`)
      }
    }
  }

  console.log('Migration complete!')
}

async function uploadBase64ToStorage(base64: string, bucket: string, postId: string): Promise<string | null> {
  try {
    // Extrair tipo e dados do base64
    const matches = base64.match(/^data:(.+);base64,(.+)$/)
    if (!matches) return null

    const mimeType = matches[1]
    const data = matches[2]
    
    // Converter base64 para Blob
    const byteString = atob(data)
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    const blob = new Blob([ab], { type: mimeType })

    // Upload
    const ext = mimeType.split('/')[1]
    const fileName = `${postId}-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob)

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    if (bucket === 'vitrine') {
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      return data.publicUrl
    } else {
      return fileName
    }
  } catch (error) {
    console.error('Error converting base64:', error)
    return null
  }
}

// Rodar migração
migrateImagesToStorage()
```

**Modificações no Frontend:**

1. **[VitrineUploadModal.tsx](file:///c:/Users/tiago/jacupemba-ai/components/admin/VitrineUploadModal.tsx)**: Trocar preview base64 por upload real antes de salvar
2. **[VitrineSection.tsx](file:///c:/Users/tiago/jacupemba-ai/components/admin/VitrineSection.tsx)**: Usar `getSignedUrl` para exibir payment_proof

---

## 🚀 4. Otimizações de Query (Feed Relatos)

### View Otimizada

```sql
-- View para trazer relatos com contadores agregados
CREATE OR REPLACE VIEW reports_with_stats AS
SELECT 
  ar.id,
  ar.category,
  ar.text,
  ar.status,
  ar.created_at,
  COUNT(DISTINCT rc.id) as comment_count,
  COUNT(DISTINCT rl.id) as like_count
FROM anonymous_reports ar
LEFT JOIN report_comments rc ON rc.report_id = ar.id
LEFT JOIN report_likes rl ON rl.report_id = ar.id
WHERE ar.status = 'aprovado'
GROUP BY ar.id, ar.category, ar.text, ar.status, ar.created_at;
```

**Modificação no Frontend:**

[FeedRelatos.tsx](file:///c:/Users/tiago/jacupemba-ai/components/FeedRelatos.tsx) linha ~95: trocar a query atual por:

```typescript
const { data, error } = await supabase
  .from('reports_with_stats')
  .select('*')
  .gte('created_at', cutoffTime.toISOString())
  .order('created_at', { ascending: false })
```

Isso elimina as 3 queries extras (comments, likes, user_likes).

---

## ✅ Checklist de Implementação

- [ ] Executar migration de `vitrine_analytics`
- [ ] Executar migration de `chat_feedback`
- [ ] Criar buckets de Storage (`vitrine` e `payment-proofs`)
- [ ] Implementar API `/api/analytics/track`
- [ ] Implementar API `/api/feedback`
- [ ] Criar helper `uploadImage.ts`
- [ ] Rodar script de migração de base64
- [ ] Atualizar frontend para usar upload real (substituir TODOs)
- [ ] Criar view `reports_with_stats`
- [ ] Atualizar [FeedRelatos.tsx](file:///c:/Users/tiago/jacupemba-ai/components/FeedRelatos.tsx) para usar view otimizada
- [ ] Testar RLS policies
- [ ] Verificar performance de queries

---

## 📝 Notas Técnicas

- **Analytics**: Dados anônimos, sem PII. Servem apenas para mostrar "popularidade" do post para a empresa.
- **Feedback**: Fingerprint é usado apenas para evitar spam, não identifica usuário real.
- **Storage**: Buckets separados (público vs privado) garantem segurança do comprovante PIX.
- **Migration de Base64**: É única (one-time). Depois disso, SEMPRE usar Storage.

**Após implementação backend**, fazer refactoring do frontend para:
1. Substituir `console.log('[ANALYTICS]', ...)` por chamadas API
2. Substituir `console.log('[FEEDBACK]', ...)` por chamadas API
3. Atualizar [VitrineUploadModal](file:///c:/Users/tiago/jacupemba-ai/components/admin/VitrineUploadModal.tsx#24-491) para usar `uploadImageToStorage` ao invés de base64
