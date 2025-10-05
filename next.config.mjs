/** @type {import('next').NextConfig} */
const nextConfig = {
  // basePath: '/booking-web',
  // assetPrefix: '/booking-web',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["*"],
}

export default nextConfig
