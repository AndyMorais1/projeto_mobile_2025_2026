import type { NextConfig } from "next";
import dotenv from "dotenv";
import fs from "fs";

// Detecta modo manual via variáveis dos scripts
const isCloud = process.env.NEXT_IGNORE_ENV_LOCAL === "true";
const isLocal = process.env.NEXT_FORCE_ENV_LOCAL === "true";

// Se for cloud → força .env
if (isCloud) {
  if (fs.existsSync(".env")) {
    dotenv.config({ path: ".env" });
    console.log("  Usando variáveis do arquivo .env (Supabase Cloud)");
  } else {
    console.warn("  Arquivo .env não encontrado!");
  }
}

//Se for local → força .env.local
else if (isLocal) {
  if (fs.existsSync(".env.local")) {
    dotenv.config({ path: ".env.local" });
    console.log("  Usando variáveis do arquivo .env.local (Supabase Local)");
  } else {
    console.warn("  Arquivo .env.local não encontrado!");
  }
}

// Configurações padrão do Next.js
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Descomenta se quiser ignorar erros de TS no build
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
