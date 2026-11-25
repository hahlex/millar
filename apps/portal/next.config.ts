import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/millar",
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    "@hahlex/millar-tokens",
    "@hahlex/millar-ui",
    "@hahlex/millar-marketing",
    "@hahlex/millar-domain-education",
  ],
  webpack(config) {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
