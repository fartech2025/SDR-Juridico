/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_USER_ID: string
  readonly VITE_DEV_MODE: string
  readonly VITE_LOGO_BUCKET: string
  readonly VITE_LOGO_PATH: string
  readonly VITE_LOGO_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}