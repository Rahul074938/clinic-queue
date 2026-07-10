import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["./prisma/**/*"],
    },
  },
};

export default nextConfig;
