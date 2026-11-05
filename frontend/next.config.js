/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Proxy all /api/* requests to the FastAPI backend
  async rewrites() {
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000';
    const apiUrl = rawUrl.replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

