/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@wedding/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
