/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@wedding/shared'],
  output: 'standalone',
  async rewrites() {
    const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:5000';
    return [
      { source: '/api/:path*', destination: `${apiTarget}/api/:path*` },
      { source: '/uploads/:path*', destination: `${apiTarget}/uploads/:path*` },
    ];
  },
};

module.exports = nextConfig;
