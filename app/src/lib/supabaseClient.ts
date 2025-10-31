import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mockSupabase } from "./mockSupabase";

type SupabaseEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_USE_SUPABASE_MOCK?: string;
  NODE_ENV?: string;
  [key: string]: string | undefined;
};

function readViteEnv(): SupabaseEnv | undefined {
  try {
    // Em ambientes Vite, estas chaves são injetadas em build time.
    // No navegador (produção), import.meta.env é um objeto estático.
    // No Node (test), pode não existir, por isso o try/catch.
    return (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) as SupabaseEnv;
  } catch {
    return undefined;
  }
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
const DEFAULT_LOCAL_URL = "http://localhost:54321";
const DEFAULT_LOCAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYwOTI1MDM2NSwiZXhwIjoxOTI0NjA3MDM2fQ.C0V-2lt3nMtk0iDdi8m-7Y4Y5E0sJY9Z3rroWAt4EVI";

const isLocalEnv =
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname ?? "");

const supabaseUrl = runtimeEnv.VITE_SUPABASE_URL || (isLocalEnv ? DEFAULT_LOCAL_URL : undefined);
const supabaseAnonKey =
  runtimeEnv.VITE_SUPABASE_ANON_KEY || (isLocalEnv ? DEFAULT_LOCAL_ANON_KEY : undefined);
const useMock =
  runtimeEnv.VITE_USE_SUPABASE_MOCK === "true" ||
  (typeof nodeEnv.NODE_ENV === "string" && nodeEnv.NODE_ENV === "test");

function createSupabaseClient(): SupabaseClient {
  if (useMock) {
    console.warn("⚠️  Usando mock do Supabase (VITE_USE_SUPABASE_MOCK=true)");
    return mockSupabase as unknown as SupabaseClient;
  }

  if (!supabaseUrl) {
    throw new Error(
      "Supabase URL ausente. Defina VITE_SUPABASE_URL no arquivo .env.local."
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Chave anon do Supabase ausente. Defina VITE_SUPABASE_ANON_KEY no arquivo .env.local."
    );
  }

  if (
    supabaseUrl.includes(".supabase.co") &&
    supabaseAnonKey === DEFAULT_LOCAL_ANON_KEY
  ) {
    throw new Error(
      [
        "Chave anon inválida detectada.",
        "A chave configurada corresponde ao valor padrão do Supabase CLI (apenas ambientes locais).",
        "Acesse o painel do Supabase -> Settings -> API e copie a Project anon key para VITE_SUPABASE_ANON_KEY.",
      ].join(" ")
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();
