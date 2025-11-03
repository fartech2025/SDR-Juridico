import { createClient, type SupabaseClient } from "@supabase/supabase-js";
// Mocks foram movidos para `./_mocks/mockSupabase` para separar código de desenvolvimento.
import { mockSupabase } from "./_mocks/mockSupabase";

type SupabaseEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_USE_SUPABASE_MOCK?: string;
  NODE_ENV?: string;
  [key: string]: string | undefined;
};

type GlobalWithViteEnv = typeof globalThis & {
  __VITE_ENV__?: SupabaseEnv;
};

function readViteEnv(): SupabaseEnv | undefined {
  const globalEnv = (globalThis as GlobalWithViteEnv).__VITE_ENV__;
  if (globalEnv && typeof globalEnv === "object") {
    return globalEnv;
  }

  return undefined;
}

function resolveRuntimeEnv(): SupabaseEnv {
  const nodeEnv =
    typeof process !== "undefined" && process?.env ? (process.env as SupabaseEnv) : undefined;

  if (
    nodeEnv &&
    (nodeEnv.VITE_SUPABASE_URL ||
      nodeEnv.VITE_SUPABASE_ANON_KEY ||
      nodeEnv.VITE_USE_SUPABASE_MOCK ||
      nodeEnv.NODE_ENV === "test")
  ) {
    return nodeEnv;
  }

  const viteEnv = readViteEnv();
  if (viteEnv) return viteEnv;

  return {};
}

const runtimeEnv = resolveRuntimeEnv();
const nodeEnv = typeof process !== "undefined" && process?.env ? process.env : {};

// Função auxiliar para acessar variáveis de ambiente de forma compatível com Jest
function getEnvVar(key: string): string | undefined {
  // Em testes (Jest), usar apenas process.env ou runtimeEnv
  if (typeof process !== "undefined" && process?.env?.NODE_ENV === "test") {
    return runtimeEnv[key] || nodeEnv[key];
  }
  
  // Em ambiente de desenvolvimento/produção, tentar acessar import.meta.env com segurança
  let viteEnvValue: string | undefined;
  try {
    // Acesso seguro ao import.meta.env via globalThis
    const globalWithImport = globalThis as any;
    viteEnvValue = globalWithImport.import?.meta?.env?.[key];
  } catch {
    // Ignorar erro silenciosamente
  }
  
  return viteEnvValue || runtimeEnv[key];
}

// Sempre usar as variáveis de ambiente definidas
const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY");
// Use mock apenas se a variável VITE_USE_SUPABASE_MOCK estiver explicitamente definida como "true".
// Removemos a detecção automática por NODE_ENV === 'test' para evitar usar dados fictícios em dev.
const useMock = runtimeEnv.VITE_USE_SUPABASE_MOCK === "true";

function createSupabaseClient(): SupabaseClient {
  if (useMock) {
    console.warn("⚠️  Usando mock do Supabase (VITE_USE_SUPABASE_MOCK=true)");
    return mockSupabase as unknown as SupabaseClient;
  }

  if (!supabaseUrl) {
    throw new Error(
      "Supabase URL ausente. Defina VITE_SUPABASE_URL no arquivo .env."
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Chave anon do Supabase ausente. Defina VITE_SUPABASE_ANON_KEY no arquivo .env."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();
