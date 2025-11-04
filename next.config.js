/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['undici'],
  },
  webpack: (config, { isServer }) => {
    // Exclude undici from client-side bundle (it's Node.js only)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
      }
    }

    // Ignore undici in webpack processing
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push('undici')
    }

    return config
  },
}

module.exports = nextConfig

