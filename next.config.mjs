/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTA: output: 'export' será habilitado apenas para build mobile via Capacitor
  // Para desenvolvimento e deploy Vercel, mantemos o build normal com APIs funcionando
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    unoptimized: true, // ✅ Necessário para export estático
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // NOTA: headers() não funciona com output: 'export'
  // CORS será tratado pelo Vercel na API online
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS, DELETE, PATCH' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

export default nextConfig