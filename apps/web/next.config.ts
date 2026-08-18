import type { NextConfig } from 'next';

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1')
  .trim()
  .replace(/\/+$/, '');
const apiBase = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

const config: NextConfig = {
  transpilePackages: ['@joel-academy/contracts'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};
export default config;
