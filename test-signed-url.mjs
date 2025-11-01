import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('./app/.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local não encontrado em app/.env.local');
  process.exit(2);
}
const env = fs.readFileSync(envPath,'utf8').split(/\n/).reduce((acc,line)=>{
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) acc[m[1]] = m[2];
  return acc;
},{})

const url = env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const key = env.VITE_SUPABASE_ANON_KEY;
if (!key) {
  console.error('VITE_SUPABASE_ANON_KEY não encontrado em .env.local');
  process.exit(2);
}
const supabase = createClient(url, key);

(async ()=>{
  try {
    const resp = await supabase.storage.from('Imagens_Geral').createSignedUrl('LOGO/LOGO4.png', 60*60);
    console.log('createSignedUrl response:', JSON.stringify(resp, null, 2));
  } catch (e) {
    console.error('Erro:', e);
  }
})();
