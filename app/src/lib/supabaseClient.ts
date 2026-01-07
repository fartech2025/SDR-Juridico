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

// Em ambiente de produção/desenvolvimento, usar import.meta.env diretamente
// Em testes, usar as variáveis do runtimeEnv
const supabaseUrl = (typeof process !== "undefined" && process?.env?.NODE_ENV === "test") 
  ? runtimeEnv.VITE_SUPABASE_URL 
  : import.meta.env.VITE_SUPABASE_URL || runtimeEnv.VITE_SUPABASE_URL;

const supabaseAnonKey = (typeof process !== "undefined" && process?.env?.NODE_ENV === "test")
  ? runtimeEnv.VITE_SUPABASE_ANON_KEY
  : import.meta.env.VITE_SUPABASE_ANON_KEY || runtimeEnv.VITE_SUPABASE_ANON_KEY;

// Use mock apenas se a variável VITE_USE_SUPABASE_MOCK estiver explicitamente definida como "true".
// Removemos a detecção automática por NODE_ENV === 'test' para evitar usar dados fictícios em dev.
const useMock = runtimeEnv.VITE_USE_SUPABASE_MOCK === "true";

// Singleton para evitar múltiplas instâncias
let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (useMock) {
    console.warn("⚠️  Usando mock do Supabase (VITE_USE_SUPABASE_MOCK=true)");
    supabaseInstance = mockSupabase as unknown as SupabaseClient;
    return supabaseInstance;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase env ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Usando mock para evitar tela branca."
    );
    supabaseInstance = mockSupabase as unknown as SupabaseClient;
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

export const supabase = createSupabaseClient();
