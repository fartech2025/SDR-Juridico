import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder";
const hasValidCredentials = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!hasValidCredentials) {
  console.warn("\u26A0\uFE0F Supabase n\xE3o configurado. A app funcionar\xE1 em modo offline/mock.");
}
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: hasValidCredentials,
    autoRefreshToken: hasValidCredentials,
    detectSessionInUrl: hasValidCredentials
  }
});
const isSupabaseConfigured = hasValidCredentials;
export {
  isSupabaseConfigured,
  supabase
};
