import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Importação de autoescola (arquivo .json) na Plataforma.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
};

export default nextConfig;
