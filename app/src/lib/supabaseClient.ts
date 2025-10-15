import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const DEFAULT_LOCAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYwOTI1MDM2NSwiZXhwIjoxOTI0NjA3MDM2fQ.C0V-2lt3nMtk0iDdi8m-7Y4Y5E0sJY9Z3rroWAt4EVI";

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
      "Chave anon invalida detectada.",
      "A chave configurada corresponde ao valor padrao do Supabase CLI (apenas ambientes locais).",
      "Acesse o painel do Supabase -> Settings -> API e copie a Project anon key para VITE_SUPABASE_ANON_KEY.",
    ].join(" ")
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
