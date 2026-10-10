import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental:{serverActions:{bodySizeLimit:'6mb'}},
  distDir: process.env.ALVORADA_BUILD_DIR || '.next',
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ['genkit', '@genkit-ai/google-genai'],
  poweredByHeader: false,
  async headers(){return [{source:'/:path*',headers:[
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'X-Frame-Options',value:'DENY'},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    {key:'Permissions-Policy',value:'camera=(self), microphone=(), geolocation=()'},
    {key:'Content-Security-Policy',value:"base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'"},
    {key:'Content-Security-Policy-Report-Only',value:"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://placehold.co; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'"},
  ]}];},
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
