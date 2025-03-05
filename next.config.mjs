let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Disable heavy optimizations that cause performance issues
  experimental: {
    webpackBuildWorker: false, // Disable worker to reduce memory usage
    optimizeCss: false, // Disable CSS optimization which might cause freezes
    serverComponentsExternalPackages: [],
    largePageDataBytes: 128 * 1000, // Reduce page data transfer size
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Performance improvements
  reactStrictMode: false, // Disable strict mode to reduce double-rendering
  swcMinify: true,
  output: 'standalone',
  poweredByHeader: false,
  webpack: (config) => {
    // Avoid Node.js polyfills for browser-only code
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      module: false,
      path: false,
      os: false,
      crypto: false,
      punycode: false, // Avoid the deprecated punycode module
    };
    return config;
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
