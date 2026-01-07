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
    console.log('📊 TODOS OS CAMPOS DISPONÍVEIS:');
    console.log('═══════════════════════════════════════════');
    Object.keys(processo).forEach(campo => {
      const valor = processo[campo];
      if (Array.isArray(valor)) {
        console.log(`${campo}: Array[${valor.length}]`);
      } else if (typeof valor === 'object' && valor !== null) {
        console.log(`${campo}:`, JSON.stringify(valor, null, 2));
      } else {
        console.log(`${campo}:`, valor);
      }
    });
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('🔄 MOVIMENTOS:');
    console.log('═══════════════════════════════════════════');
    console.log('Total:', processo.movimentos?.length || 0);
    if (processo.movimentos?.length > 0) {
      console.log('Primeiro movimento:', JSON.stringify(processo.movimentos[0], null, 2));
      console.log('Último movimento:', JSON.stringify(processo.movimentos[processo.movimentos.length - 1], null, 2));
    }
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('📝 ASSUNTOS:');
    console.log('═══════════════════════════════════════════');
    if (processo.assuntos?.length > 0) {
      processo.assuntos.forEach(a => console.log(`- ${a.nome} (${a.codigo})`));
    }
  } else {
    console.log('❌ Processo não encontrado');
    console.log('Response:', JSON.stringify(data, null, 2));
  }
})
.catch(err => {
  console.error('❌ Erro:', err.message);
});
