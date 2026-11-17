import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['mongodb', 'redis', 'express', 'express-async-errors', 'serverless-http'],
};
export default nextConfig;
