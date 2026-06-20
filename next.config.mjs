/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['jspdf', 'jspdf-autotable'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'supabase.co' },
    ],
  },
  experimental: {
    // Disable the client-side router cache so every navigation fetches fresh
    // server data (fixes "updates only show after manual refresh").
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
}

export default nextConfig
