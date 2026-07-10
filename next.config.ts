import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/:path*": ["./prisma/**/*"],
  },
};

export default nextConfig;
