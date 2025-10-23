import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const hasSupabase = Boolean(url && key)
export const supabase = hasSupabase ? createClient(url!, key!) : (null as any)

export const CURRENT_USER_ID = Number(import.meta.env.VITE_USER_ID ?? 1)

export const provaDurationSeconds = 5.5 * 60 * 60; // 5h30