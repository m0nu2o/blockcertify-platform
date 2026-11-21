
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  generateEtags: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', 'date-fns', 'ethers'],
  },
  async redirects() {
    return [
      {
        source: '/dashboard/students',
        destination: '/dashboard/student',
        permanent: false,
      },
      {
        source: '/students',
        destination: '/dashboard/student',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
