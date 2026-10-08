import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: process.env.ALVORADA_BUILD_DIR || '.next',
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ['genkit', '@genkit-ai/googleai'],
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
