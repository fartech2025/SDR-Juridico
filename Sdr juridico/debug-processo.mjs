#!/usr/bin/env node

const numeroProcesso = '50392640420258130105';
const tribunal = 'tjmg';
const apiKey = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';

console.log('🔍 Buscando processo:', numeroProcesso);
console.log('📍 Tribunal:', tribunal);
console.log('');

fetch(`https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `APIKey ${apiKey}`
  },
  body: JSON.stringify({
    size: 1,
    query: {
      term: {
        'numeroProcesso': numeroProcesso
      }
    }
  })
})
.then(r => r.json())
.then(data => {
  if (data.hits?.hits?.[0]) {
    const processo = data.hits.hits[0]._source;
    console.log('✅ PROCESSO ENCONTRADO');
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('📋 ESTRUTURA COMPLETA DO PROCESSO:');
    console.log('═══════════════════════════════════════════');
    console.log(JSON.stringify(processo, null, 2));
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('📊 CAMPOS PRINCIPAIS:');
    console.log('═══════════════════════════════════════════');
    console.log('numeroProcesso:', processo.numeroProcesso);
    console.log('tribunal:', processo.tribunal);
    console.log('grau:', processo.grau);
    console.log('dataAjuizamento:', processo.dataAjuizamento);
    console.log('dadosBasicos?.dataAjuizamento:', processo.dadosBasicos?.dataAjuizamento);
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('🔄 MOVIMENTAÇÕES:');
    console.log('═══════════════════════════════════════════');
    console.log('Total:', processo.movimentacoes?.length || 0);
    if (processo.movimentacoes?.length > 0) {
      console.log('Primeira movimentação:', JSON.stringify(processo.movimentacoes[0], null, 2));
    }
  } else {
    console.log('❌ Processo não encontrado');
    console.log('Response:', JSON.stringify(data, null, 2));
  }
})
.catch(err => {
  console.error('❌ Erro:', err.message);
});
