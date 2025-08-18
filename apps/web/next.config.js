/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // reactCompiler: true,  // Disabled for now
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fakestoreapi.com',
        pathname: '/img/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8001',
        pathname: '/api/image-proxy**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle ONNX files for CLIP model
    config.module.rules.push({
      test: /\.onnx$/,
      use: 'file-loader',
    });

    // Handle WebAssembly files for WebLLM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Fallback for Node.js modules in client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
  // Enable headers for SharedArrayBuffer (required for WebLLM)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  env: {
    MCP_SERVER_URL: process.env.MCP_SERVER_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
