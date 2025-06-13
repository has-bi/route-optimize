/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },

  // Ensure API routes use Node.js runtime by default
  api: {
    runtime: "nodejs",
  },

  // Configure webpack to handle Prisma properly
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("@prisma/client");
    }
    return config;
  },
};

export default nextConfig;
