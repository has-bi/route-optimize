/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  // Fix for Prisma edge runtime issues
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
