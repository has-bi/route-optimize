/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages that should not be bundled by webpack
  serverExternalPackages: [
    "@prisma/client",
    "googleapis",
    "google-auth-library",
    "bcryptjs",
  ],

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle these packages on the server side
      config.externals.push({
        "@prisma/client": "@prisma/client",
        googleapis: "googleapis",
        "google-auth-library": "google-auth-library",
      });
    }

    // Handle .node files
    config.module.rules.push({
      test: /\.node$/,
      use: "raw-loader",
    });

    return config;
  },

  // Environment variables to expose to the client
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Image optimization
  images: {
    domains: ["lh3.googleusercontent.com"], // For Google profile images
  },

  // Disable strict mode if needed (optional)
  reactStrictMode: true,

  // Experimental features (only include what you need)
  experimental: {
    // Remove the deprecated serverComponentsExternalPackages
    // It's now moved to serverExternalPackages above
  },

  // API routes configuration
  async rewrites() {
    return [
      // Add any URL rewrites if needed
    ];
  },

  // Headers configuration for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
