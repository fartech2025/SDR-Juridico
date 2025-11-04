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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const env = await loadEnvLocal();
  const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  assert(url, 'VITE_SUPABASE_URL não definido');
  assert(anon, 'VITE_SUPABASE_ANON_KEY não definido');
  const supabase = createClient(url, anon);

  const resProvas = await supabase.from('provas').select('id_prova, descricao, ano, cor_caderno').order('ano', { ascending: false }).limit(5);
  assert(!resProvas.error, 'Erro ao consultar provas: ' + (resProvas.error?.message || ''));
  const provas = resProvas.data || [];

  const resumo = { provas: provas.length, temas: 0, questoesDaPrimeiraProva: 0 };

  const resTemas = await supabase.from('temas').select('id_tema').limit(5);
  assert(!resTemas.error, 'Erro ao consultar temas: ' + (resTemas.error?.message || ''));
  resumo.temas = resTemas.data?.length || 0;

  if (provas.length) {
    const pid = provas[0].id_prova;
    const resQuestoes = await supabase
      .from('questoes')
      .select('id_questao')
      .eq('id_prova', pid)
      .limit(5);
    assert(!resQuestoes.error, 'Erro ao consultar questoes: ' + (resQuestoes.error?.message || ''));
    resumo.questoesDaPrimeiraProva = resQuestoes.data?.length || 0;
  }

  console.log(JSON.stringify({ ok: true, resumo, amostraProvas: provas }, null, 2));
}

main().catch((e) => {
  console.error('SMOKE_FAIL:', e?.message || e);
  process.exit(1);
});
