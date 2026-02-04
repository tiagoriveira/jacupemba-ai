import { consumeStream, convertToModelMessages, streamText, UIMessage } from 'ai'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getBusinessData() {
  // Fetch all active businesses with their related data
  const { data: businesses } = await supabase
    .from('businesses')
    .select(`
      *,
      business_hours(*),
      services(*),
      products(*),
      events(*),
      jobs(*)
    `)
    .eq('is_active', true)

  return businesses || []
}

function formatBusinessData(businesses: any[]): string {
  if (!businesses || businesses.length === 0) {
    return 'Nenhum negócio cadastrado no momento.'
  }

  let context = 'DADOS DOS NEGÓCIOS LOCAIS:\n\n'

  businesses.forEach((business) => {
    context += `**${business.business_name}**\n`
    if (business.trade_name) context += `Nome Fantasia: ${business.trade_name}\n`
    if (business.category) context += `Categoria: ${business.category}\n`
    if (business.description) context += `Descrição: ${business.description}\n`
    if (business.phone) context += `Telefone: ${business.phone}\n`
    if (business.whatsapp) context += `WhatsApp: ${business.whatsapp}\n`
    if (business.email) context += `Email: ${business.email}\n`
    
    // Address
    if (business.address_street) {
      context += `Endereço: ${business.address_street}`
      if (business.address_number) context += `, ${business.address_number}`
      if (business.address_complement) context += ` - ${business.address_complement}`
      if (business.address_neighborhood) context += `, ${business.address_neighborhood}`
      if (business.address_city && business.address_state) {
        context += `, ${business.address_city}/${business.address_state}`
      }
      context += '\n'
    }

    // Hours
    if (business.business_hours && business.business_hours.length > 0) {
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      context += 'Horários:\n'
      business.business_hours
        .sort((a: any, b: any) => a.day_of_week - b.day_of_week)
        .forEach((hour: any) => {
          const day = days[hour.day_of_week]
          if (hour.is_open) {
            context += `  ${day}: ${hour.open_time} às ${hour.close_time}\n`
          } else {
            context += `  ${day}: Fechado\n`
          }
        })
    }

    // Services
    if (business.services && business.services.filter((s: any) => s.is_active).length > 0) {
      context += 'Serviços:\n'
      business.services
        .filter((s: any) => s.is_active)
        .forEach((service: any) => {
          context += `  - ${service.name}`
          if (service.price) context += ` (R$ ${service.price.toFixed(2)})`
          if (service.duration_minutes) context += ` - ${service.duration_minutes} min`
          if (service.description) context += `: ${service.description}`
          context += '\n'
        })
    }

    // Products
    if (business.products && business.products.filter((p: any) => p.is_active).length > 0) {
      context += 'Produtos:\n'
      business.products
        .filter((p: any) => p.is_active)
        .forEach((product: any) => {
          context += `  - ${product.name}`
          if (product.price) context += ` (R$ ${product.price.toFixed(2)})`
          if (product.stock_quantity > 0) context += ` - Estoque: ${product.stock_quantity}`
          if (product.description) context += `: ${product.description}`
          context += '\n'
        })
    }

    // Events
    if (business.events && business.events.filter((e: any) => e.is_active).length > 0) {
      context += 'Eventos:\n'
      business.events
        .filter((e: any) => e.is_active)
        .forEach((event: any) => {
          context += `  - ${event.name} em ${new Date(event.event_date).toLocaleDateString('pt-BR')}`
          if (event.start_time) context += ` às ${event.start_time}`
          if (event.location) context += ` - Local: ${event.location}`
          if (event.description) context += `: ${event.description}`
          context += '\n'
        })
    }

    // Jobs
    if (business.jobs && business.jobs.filter((j: any) => j.is_active).length > 0) {
      context += 'Vagas:\n'
      business.jobs
        .filter((j: any) => j.is_active)
        .forEach((job: any) => {
          context += `  - ${job.title}`
          if (job.employment_type) context += ` (${job.employment_type})`
          if (job.location) context += ` - ${job.location}`
          if (job.salary_min || job.salary_max) {
            context += ` - Salário: `
            if (job.salary_min) context += `R$ ${job.salary_min.toFixed(2)}`
            if (job.salary_min && job.salary_max) context += ' a '
            if (job.salary_max) context += `R$ ${job.salary_max.toFixed(2)}`
          }
          context += '\n'
        })
    }

    context += '\n---\n\n'
  })

  return context
}

async function saveChatHistory(userMessage: string, assistantResponse: string) {
  try {
    await supabase.from('chat_history').insert([
      {
        role: 'user',
        content: userMessage,
        user_identifier: 'anonymous',
      },
      {
        role: 'assistant',
        content: assistantResponse,
        user_identifier: 'anonymous',
      },
    ])
  } catch (error) {
    console.error('Error saving chat history:', error)
  }
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  // Fetch business data from Supabase
  const businesses = await getBusinessData()
  const businessContext = formatBusinessData(businesses)

  const result = streamText({
    model: 'xai/grok-beta',
    system: `Você é o Assistente Local, um assistente conversacional que ajuda moradores do bairro a encontrar serviços, comércios, vagas de emprego e eventos locais.

INSTRUÇÕES IMPORTANTES:
- Sempre responda em português brasileiro de forma natural e amigável
- Use APENAS os dados reais fornecidos abaixo - NUNCA invente informações
- Se não houver dados relevantes para a pergunta, informe educadamente que não há informações cadastradas no momento
- Quando listar estabelecimentos ou profissionais, organize as informações de forma clara
- Para cada negócio recomendado, inclua ao final da descrição: [BUSINESS_ID:uuid_do_negocio]
- Se o usuário perguntar sobre algo que não existe nos dados, sugira categorias similares que existem

ANÁLISE DE IMAGENS:
- Quando o usuário enviar uma imagem, analise-a cuidadosamente para identificar produtos, objetos ou situações
- Infira qual serviço ou produto está relacionado à imagem
- Recomende APENAS estabelecimentos dos dados abaixo que oferecem o que foi identificado
- Se não houver dados relevantes, informe que não há estabelecimentos cadastrados para aquela necessidade

${businessContext}

Use estas informações para responder as perguntas dos usuários de forma precisa e útil.`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
    onFinish: async ({ text }) => {
      // Save the conversation to database
      const lastUserMessage = messages[messages.length - 1]
      const userText = lastUserMessage.parts
        ?.filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join(' ') || ''
      
      if (userText && text) {
        await saveChatHistory(userText, text)
      }
    },
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
