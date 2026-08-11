import type { NextConfig } from 'next';
const config: NextConfig = {
  transpilePackages: ['@joel-academy/contracts'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/:path*`,
      },
    ];
  },
};
export default config;
