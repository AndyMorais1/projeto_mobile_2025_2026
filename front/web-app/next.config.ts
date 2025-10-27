import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Não falha o build por erros de ESLint
    ignoreDuringBuilds: true,
  },
  // ⚠️ Só ativa isto se for mesmo necessário:
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
};

export default nextConfig;
