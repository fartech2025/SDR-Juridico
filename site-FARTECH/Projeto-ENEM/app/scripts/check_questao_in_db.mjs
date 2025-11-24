import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function readEnv(filePath) {
  const txt = fs.readFileSync(filePath, 'utf8');
  const lines = txt.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

async function main() {
  const envPath = path.resolve(process.cwd(), 'app', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found at app/.env.local');
    process.exit(2);
  }
  const env = readEnv(envPath);
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing in app/.env.local');
    process.exit(2);
  }

  const supabase = createClient(url, key);

  const search = '3 + 5';
  console.log('Querying questoes where enunciado ILIKE %3 + 5%');
  const { data, error } = await supabase.from('questoes').select('*').ilike('enunciado', `%${search}%`);
  if (error) {
    console.error('Error querying questoes:', error);
    process.exit(1);
  }
  console.log('Found rows:', (data || []).length);
  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
