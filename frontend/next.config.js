/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy all /api/* requests to the FastAPI backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

