import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.REMOTE_URL;
  const key = process.env.REMOTE_KEY;
  if (!url || !key) {
    console.error('Usage: set REMOTE_URL and REMOTE_KEY env vars');
    process.exit(2);
  }

  const supabase = createClient(url, key);
  try {
    console.log('Querying /provas (limit 1) to validate credentials...');
    const { data, error } = await supabase.from('provas').select('id_prova,nome').limit(1);
    if (error) {
      console.error('Error from Supabase:', error);
      process.exit(1);
    }
    console.log('Success. Sample rows:', JSON.stringify(data, null, 2));
    // Also check whether the example question exists
    const search = '3 + 5';
    const { data: qdata, error: qerr } = await supabase.from('questoes').select('*').ilike('enunciado', `%${search}%`).limit(5);
    if (qerr) {
      console.error('Error querying questoes:', qerr);
      process.exit(1);
    }
    console.log('Questao search rows:', (qdata||[]).length);
    console.log(JSON.stringify(qdata, null, 2));
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main();
