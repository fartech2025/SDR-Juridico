// Verifica conexao e permissoes basicas por usuario em tabelas-chave.
// Usa credenciais de teste via .env ou valores padrao.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const loadEnv = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
};

const env = loadEnv(path.join(repoRoot, '.env'));
const getEnv = (key, fallback) => process.env[key] ?? env[key] ?? fallback;

const supabaseUrl =
  getEnv('VITE_SUPABASE_URL') ??
  getEnv('SUPABASE_URL');
const supabaseAnonKey =
  getEnv('VITE_SUPABASE_ANON_KEY') ??
  getEnv('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or anon key in .env or process.env.');
  process.exit(1);
}

const users = [
  {
    label: 'fartech_admin',
    email: getEnv('TEST_ADMIN_EMAIL', 'admin@fartech.com.br'),
    password: getEnv('TEST_ADMIN_PASSWORD', 'Fartech@2024'),
  },
  {
    label: 'org_admin',
    email: getEnv('TEST_ORG_ADMIN_EMAIL', 'gestor@demo.local'),
    password: getEnv('TEST_ORG_ADMIN_PASSWORD', 'Demo@2024'),
  },
  {
    label: 'user',
    email: getEnv('TEST_USER_EMAIL', 'user@demo.local'),
    password: getEnv('TEST_USER_PASSWORD', 'Demo@2024'),
  },
];

const extraEmail = getEnv('TEST_EXTRA_EMAIL');
const extraPassword = getEnv('TEST_EXTRA_PASSWORD');
if (extraEmail && extraPassword) {
  users.push({
    label: 'extra',
    email: extraEmail,
    password: extraPassword,
  });
}

const checks = [
  { table: 'orgs', select: 'id' },
  { table: 'org_members', select: 'id' },
  { table: 'leads', select: 'id' },
  { table: 'clientes', select: 'id' },
  { table: 'casos', select: 'id' },
  { table: 'documentos', select: 'id' },
];

const run = async () => {
  for (const user of users) {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: authError } = await client.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    if (authError) {
      console.log(`[${user.label}] auth: FAIL (${authError.message})`);
      continue;
    }

    console.log(`[${user.label}] auth: OK`);

    for (const check of checks) {
      const { error } = await client
        .from(check.table)
        .select(check.select, { count: 'exact' })
        .limit(1);

      if (error) {
        console.log(`  - ${check.table}: FAIL (${error.message})`);
      } else {
        console.log(`  - ${check.table}: OK`);
      }
    }

    await client.auth.signOut();
  }
};

run().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
