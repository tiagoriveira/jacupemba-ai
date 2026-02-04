import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { messageId, rating, feedbackText } = await req.json()

    if (!messageId || !rating) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['up', 'down'].includes(rating)) {
      return Response.json({ error: 'Invalid rating' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('chat_ratings')
      .insert({
        message_id: messageId,
        rating,
        feedback_text: feedbackText,
        user_identifier: 'anonymous',
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving rating:', error)
      return Response.json({ error: 'Failed to save rating' }, { status: 500 })
    }

    return Response.json({ success: true, data })
  } catch (error) {
    console.error('Error in rate API:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
