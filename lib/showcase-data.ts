export interface ShowcasePost {
  id: string
  businessName: string
  businessType: string
  productName: string
  imageUrl: string
  whatsappNumber: string
  address: string
  hours: string
  postedAt: Date
}

export const SHOWCASE_POSTS: ShowcasePost[] = [
  {
    id: '1',
    businessName: 'Pizzaria Sabor da Massa',
    businessType: 'Pizzaria',
    productName: 'Pizza Margherita + Refrigerante',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=1200&fit=crop',
    whatsappNumber: '5511999887766',
    address: 'Rua das Flores, 123',
    hours: 'Seg-Dom: 18h-23h',
    postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '2',
    businessName: 'Elétrica Silva',
    businessType: 'Eletricista',
    productName: 'Instalação Elétrica Residencial',
    imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&h=1200&fit=crop',
    whatsappNumber: '5511988776655',
    address: 'Rua São João, 456',
    hours: 'Seg-Sex: 8h-18h, Sáb: 8h-12h',
    postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: '3',
    businessName: 'Salão Beleza Pura',
    businessType: 'Salão de Beleza',
    productName: 'Corte + Escova + Hidratação',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=1200&fit=crop',
    whatsappNumber: '5511977665544',
    address: 'Av. Principal, 789',
    hours: 'Ter-Sáb: 9h-19h',
    postedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
  },
  {
    id: '4',
    businessName: 'Mecânica do José',
    businessType: 'Mecânico',
    productName: 'Revisão Completa',
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=1200&fit=crop',
    whatsappNumber: '5511966554433',
    address: 'Rua do Comércio, 321',
    hours: 'Seg-Sex: 8h-18h, Sáb: 8h-13h',
    postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
  },
  {
    id: '5',
    businessName: 'Padaria Pão Quente',
    businessType: 'Padaria',
    productName: 'Pão Francês + Café',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=1200&fit=crop',
    whatsappNumber: '5511955443322',
    address: 'Rua Bela Vista, 654',
    hours: 'Todos os dias: 6h-20h',
    postedAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
  },
  {
    id: '6',
    businessName: 'Academia Corpo em Forma',
    businessType: 'Academia',
    productName: 'Matrícula Promocional',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1200&fit=crop',
    whatsappNumber: '5511944332211',
    address: 'Av. Saúde, 987',
    hours: 'Seg-Sex: 6h-22h, Sáb-Dom: 8h-14h',
    postedAt: new Date(Date.now() - 30 * 60 * 60 * 1000), // 30 hours ago
  },
]
