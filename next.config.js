/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    CUSTOM_KEY: process.env.NODE_ENV || 'development',
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY || ''
  },
  images: {
    domains: ['api.dexscreener.com']
  }
}

module.exports = nextConfig
