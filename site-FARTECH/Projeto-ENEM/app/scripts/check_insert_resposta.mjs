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

  // buscar uma questao qualquer
  const qRes = await supabase.from('questoes').select('id_questao').limit(1).maybeSingle();
  if (qRes.error) throw new Error('Erro ao buscar questão: ' + qRes.error.message);
  const questaoId = qRes.data?.id_questao;
  assert(questaoId, 'Nenhuma questão encontrada para testar');

  // buscar um usuario ou criar temporário
  let userId = null;
  const uRes = await supabase.from('usuarios').select('id_usuario').limit(1).maybeSingle();
  if (uRes.error) throw new Error('Erro ao buscar usuario: ' + uRes.error.message);
  if (uRes.data && uRes.data.id_usuario) {
    userId = uRes.data.id_usuario;
  } else {
    // criar um usuario temporário
    const now = new Date().toISOString();
    // Criar um usuário temporário com campos mínimos (evitar colunas que podem não existir em esquemas diferentes)
    // Inserir usuário com campos mínimos conforme schema (email é NOT NULL)
    const upsert = await supabase.from('usuarios').insert({
      email: `test-script-${Date.now()}@example.com`,
      nome: 'test-script',
    }).select('id_usuario').maybeSingle();
    if (upsert.error) throw new Error('Erro ao criar usuario temporário: ' + upsert.error.message);
    userId = upsert.data?.id_usuario;
    assert(userId, 'Não foi possível criar usuario temporário');
  }

  // inserir resposta de teste
  // alternativa_marcada é CHAR(1) na schema; usar um único caractere de teste
  const altChar = 'A';
  const uniqueTimestamp = new Date().toISOString();
  const payload = [{
    id_usuario: userId,
    id_questao: questaoId,
    alternativa_marcada: altChar,
    correta: false,
    data_resposta: uniqueTimestamp,
    tempo_resposta_ms: null,
  }];

  const ins = await supabase.from('respostas_usuarios').insert(payload).select('*');
  if (ins.error) throw new Error('Erro ao inserir resposta de teste: ' + ins.error.message);
  console.log('Insert OK. Rows inserted:', ins.data?.length || 0);
  console.log('Inserted sample:', ins.data);

  // confirmar leitura
  const sel = await supabase.from('respostas_usuarios').select('*').eq('id_resposta', ins.data?.[0]?.id_resposta);
  if (sel.error) throw new Error('Erro ao buscar resposta inserida: ' + sel.error.message);
  console.log('Select found rows:', sel.data?.length || 0);

  // remover inserção de teste
  const del = await supabase.from('respostas_usuarios').delete().eq('id_resposta', ins.data?.[0]?.id_resposta);
  if (del.error) throw new Error('Erro ao remover resposta de teste: ' + del.error.message);
  console.log('Delete OK. Rows deleted:', del.data?.length || 0);

  // se criamos usuário temporário, remover também
  if (!uRes.data) {
    const delu = await supabase.from('usuarios').delete().eq('id_usuario', userId);
    if (delu.error) console.warn('Aviso: falha ao remover usuario temporário:', delu.error.message);
    else console.log('Usuario temporário removido.');
  }

  console.log('Smoke insert test completed successfully.');
}

main().catch((e) => {
  console.error('TEST_FAIL:', e?.message || e);
  process.exit(1);
});
