/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  async headers() {
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS, DELETE, PATCH' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, x-user-fingerprint' },
        ],
      },
      {
        // Stripe webhook precisa de acesso aberto
        source: '/api/stripe/webhook',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}

export default nextConfig