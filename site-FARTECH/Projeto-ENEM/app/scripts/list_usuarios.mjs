import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  const content = await fs.readFile(envPath, 'utf8').catch(() => '');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[key] = value;
  }
  return env;
}
(async () => {
  const env = await loadEnvLocal();
  const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) { console.error('envs missing'); process.exit(1); }
  const supabase = createClient(url, anon);
  const { data, error } = await supabase.from('usuarios').select('*').limit(5);
  if (error) { console.error('error', error); process.exit(1); }
  console.log('Found users count:', (data||[]).length);
  console.log(JSON.stringify(data, null, 2));
})();
