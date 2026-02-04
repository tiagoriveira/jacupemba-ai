import { Business } from '@/components/business-card'

export interface Promotion {
  id: string
  business: Business
  title: string
  description: string
  validUntil: string
}

export interface LocalEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  organizer?: string
}

// Mock businesses sorted by proximity and recency
export const mockBusinesses: Business[] = [
  {
    id: '1',
    name: 'Padaria Central',
    phone: '(27) 99876-5432',
    address: 'Rua das Flores, 123 - Centro',
    hours: 'Seg a Sáb: 6h às 20h',
    category: 'Alimentação',
    verified: true,
    sponsored: true,
  },
  {
    id: '2',
    name: 'Eletricista Silva',
    phone: '(27) 98765-4321',
    address: 'Atende todo o bairro',
    hours: 'Seg a Sex: 8h às 18h',
    info: '15 anos de experiência',
    category: 'Serviços',
    verified: true,
  },
  {
    id: '3',
    name: 'Mercadinho do João',
    phone: '(27) 99234-5678',
    address: 'Av. Principal, 456',
    hours: 'Todos os dias: 7h às 22h',
    category: 'Comércio',
  },
  {
    id: '4',
    name: 'Auto Mecânica Reis',
    phone: '(27) 98123-4567',
    address: 'Rua Industrial, 789',
    hours: 'Seg a Sex: 8h às 18h, Sáb: 8h às 12h',
    category: 'Serviços Automotivos',
    verified: true,
  },
  {
    id: '5',
    name: 'Salão Beleza Total',
    phone: '(27) 99345-6789',
    address: 'Rua das Palmeiras, 234',
    hours: 'Ter a Sáb: 9h às 19h',
    category: 'Beleza',
  },
]

export const mockPromotions: Promotion[] = [
  {
    id: 'p1',
    business: mockBusinesses[0],
    title: 'Café da Manhã Completo',
    description: 'Pão francês + café + suco por apenas R$ 8,90',
    validUntil: '2026-02-28',
  },
  {
    id: 'p2',
    business: mockBusinesses[2],
    title: 'Feira de Hortifruti',
    description: 'Toda sexta-feira com 20% de desconto em frutas e verduras',
    validUntil: '2026-03-31',
  },
  {
    id: 'p3',
    business: mockBusinesses[4],
    title: 'Corte + Escova',
    description: 'Pacote especial por R$ 45,00',
    validUntil: '2026-02-15',
  },
]

export const mockEvents: LocalEvent[] = [
  {
    id: 'e1',
    title: 'Feira de Artesanato',
    description: 'Produtos artesanais locais, música ao vivo e gastronomia',
    date: '2026-02-08',
    time: '10h às 18h',
    location: 'Praça Central',
    organizer: 'Associação de Artesãos',
  },
  {
    id: 'e2',
    title: 'Campeonato de Futebol de Rua',
    description: 'Inscrições abertas para todas as idades',
    date: '2026-02-15',
    time: '14h',
    location: 'Quadra do Bairro',
  },
  {
    id: 'e3',
    title: 'Cinema na Praça',
    description: 'Sessão gratuita de cinema ao ar livre',
    date: '2026-02-20',
    time: '19h',
    location: 'Praça da Igreja',
    organizer: 'Prefeitura',
  },
  {
    id: 'e4',
    title: 'Aula de Yoga Gratuita',
    description: 'Venha relaxar e cuidar da saúde',
    date: '2026-02-06',
    time: '7h',
    location: 'Parque Municipal',
  },
]
