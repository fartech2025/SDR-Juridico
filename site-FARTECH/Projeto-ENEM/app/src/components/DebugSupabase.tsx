import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { testarConexaoBanco, verificarDadosSimulados } from '../services/testeBanco';
import { analisarProvasEQuestoes, verificarEstruturaBanco } from '../services/analisarProvas';
import { verificarColunasTabelas } from '../services/verificarEstrutura';
import { verificarIdProva } from '../services/verificarIdProva';
import { testeSimplesDados } from '../services/testeSimplesDados';
import { SimuladosService } from '../services/simuladosService';

export default function DebugSupabase() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'Erro desconhecido';
    }
  };

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

  const testMock = async () => {
    addLog("🧪 Testando configuração atual...");
    
    try {
      // Verificar se estamos usando mock ou banco real
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const useMock = import.meta.env.VITE_USE_SUPABASE_MOCK;
      
      addLog(`🌐 URL Supabase: ${supabaseUrl}`);
      addLog(`🔧 Usando Mock: ${useMock || 'false'}`);
      
      if (useMock === 'true') {
        addLog("📞 Testando login mock...");
        const result = await supabase.auth.signInWithPassword({
          email: "test@example.com", 
          password: "123456"
        });
        
        if (result.data?.user) {
          addLog("✅ Mock funcionando! Usuário encontrado.");
        } else if (result.error) {
          addLog(`❌ Erro no mock: ${result.error.message}`);
        }
      } else {
        addLog("🏦 Configurado para banco real - sem teste de login");
        addLog("✅ Configuração válida para acessar dados reais");
        
        // Testar apenas uma consulta simples sem autenticação
        try {
          const { data, error } = await supabase.from('questoes').select('id_questao').limit(1);
          if (!error && data) {
            addLog(`✅ Acesso ao banco real funcionando - ${data.length} questão(ões) encontrada(s)`);
          } else {
            addLog(`⚠️ Erro ao acessar questões: ${getErrorMessage(error)}`);
          }
        } catch (err) {
          addLog(`⚠️ Erro na consulta: ${getErrorMessage(err)}`);
        }
      }
      
    } catch (error) {
      addLog(`💥 Erro na verificação: ${getErrorMessage(error)}`);
    }
  };

  const testBancoReal = async () => {
    addLog("🏦 Testando conexão com banco real...");
    
    try {
      const resultado = await testarConexaoBanco();
      addLog(`📊 Resultado do teste: ${JSON.stringify(resultado, null, 2)}`);
      
      if (resultado.sucesso) {
        addLog("✅ Conexão com banco real bem-sucedida!");
        
        // Testar dados de simulados
        addLog("🎯 Verificando dados de simulados...");
        const simulados = await verificarDadosSimulados();
        addLog(`📋 Simulados encontrados: ${simulados.simulados.length}`);
        
        const simuladosEncontrados = Array.isArray(simulados.simulados) ? simulados.simulados : [];
        simuladosEncontrados.forEach((sim) => {
          if (!isRecord(sim)) {
            return;
          }
          const nome = typeof sim.nome === 'string' ? sim.nome : 'Simulado sem nome';
          const idSimulado = sim.id_simulado != null ? String(sim.id_simulado) : 'n/d';
          addLog(`📝 ${nome} (ID: ${idSimulado})`);
        });
      } else {
        addLog(`❌ Falha na conexão: ${resultado.erro}`);
      }
    } catch (error) {
      addLog(`💥 Erro ao testar banco: ${getErrorMessage(error)}`);
    }
  };

  const testarSimuladosService = async () => {
    addLog("🎓 Testando SimuladosService...");
    
    try {
      const simulados = await SimuladosService.listarSimulados();
      addLog(`📚 Simulados encontrados via service: ${simulados.length}`);
      
      simulados.forEach((sim) => {
        const nome = typeof sim.nome === 'string' ? sim.nome : 'Simulado sem nome';
        const totalQuestoes = typeof sim.total_questoes === 'number' ? sim.total_questoes : Number(sim.total_questoes ?? 0);
        const idProva = sim.id_prova != null ? String(sim.id_prova) : 'n/d';
        addLog(`📖 ${nome}: ${totalQuestoes} questões (Prova ID: ${idProva})`);
      });
      
      // Testar estatísticas
      const stats = await SimuladosService.buscarEstatisticasSimulados();
      addLog(`📊 Estatísticas: ${stats.simuladosDisponiveis} simulados, ${stats.totalQuestoes} questões total`);
      addLog(`🎯 Provas: ${stats.provasDisponiveis.join(', ')}`);
      
    } catch (error) {
      addLog(`💥 Erro no SimuladosService: ${getErrorMessage(error)}`);
    }
  };

  const analisarProvas = async () => {
    addLog("🏛️ Analisando tabela provas e correlação com questões...");
    
    try {
      // Primeiro verificar estrutura
      const estrutura = await verificarEstruturaBanco();
      addLog(`📊 Estrutura do banco: ${JSON.stringify(estrutura.estrutura, null, 2)}`);
      
      // Depois analisar provas e questões
      const analise = await analisarProvasEQuestoes();
      
      if (analise.sucesso) {
        addLog(`✅ Análise concluída! Encontradas ${analise.simulados.length} provas com questões`);
        
        analise.simulados.forEach(simulado => {
          addLog(`🏛️ Prova ${simulado.id_prova}: ${simulado.nome}`);
          addLog(`   📝 ${simulado.total_questoes} questões`);
          addLog(`   📑 Áreas: ${simulado.areas_conhecimento.join(', ')}`);
          addLog(`   📚 Disciplinas: ${simulado.disciplinas.join(', ')}`);
          if (simulado.ano) addLog(`   📅 Ano: ${simulado.ano}`);
        });
        
      } else {
        addLog(`❌ Falha na análise: ${analise.erro}`);
      }
    } catch (error) {
      addLog(`💥 Erro ao analisar provas: ${getErrorMessage(error)}`);
    }
  };

  const verificarEstrutura = async () => {
    addLog("🔍 Verificando estrutura detalhada das tabelas...");
    
    try {
      const verificacao = await verificarColunasTabelas();
      
      if (verificacao.sucesso) {
        addLog("✅ Verificação de estrutura concluída!");
        
        Object.keys(verificacao.estrutura).forEach(tabela => {
          const info = verificacao.estrutura[tabela];
          if (info.existe) {
            addLog(`📋 Tabela ${tabela}:`);
            addLog(`   📂 Colunas: ${info.colunas?.join(', ')}`);
            addLog(`   🔗 Tem id_prova: ${info.tem_id_prova ? 'SIM' : 'NÃO'}`);
          } else {
            addLog(`❌ Tabela ${tabela}: ${info.erro || 'Não existe'}`);
          }
        });

        if (verificacao.estrutura.analise) {
          const analise = verificacao.estrutura.analise;
          addLog("🔍 Análise de colunas relevantes:");
          addLog(`   🔗 ID Prova: ${analise.possui_id_prova ? 'SIM' : 'NÃO'}`);
          addLog(`   📅 Ano: ${analise.possui_ano ? 'SIM' : 'NÃO'}`);
          addLog(`   📖 Prova: ${analise.possui_prova ? 'SIM' : 'NÃO'}`);
          addLog(`   📚 Caderno: ${analise.possui_caderno ? 'SIM' : 'NÃO'}`);
          addLog(`   🏷️ Colunas relevantes: ${analise.colunas_relevantes.join(', ')}`);
        }
        
      } else {
        addLog(`❌ Falha na verificação: ${verificacao.erro}`);
      }
    } catch (error) {
      addLog(`💥 Erro ao verificar estrutura: ${getErrorMessage(error)}`);
    }
  };

  const testarIdProva = async () => {
    addLog("🧾 Testando especificamente a coluna id_prova...");
    
    try {
      const verificacao = await verificarIdProva();
      
      if (verificacao.sucesso) {
        const resultado = verificacao.resultado;
        
        addLog("✅ Verificação de id_prova concluída!");
        
        // Questões
        if (resultado.questoes) {
          if (resultado.questoes.tem_id_prova) {
            addLog(`✅ Tabela questões TEM a coluna id_prova`);
            addLog(`   📊 Total com id_prova: ${resultado.questoes.total_com_id_prova}`);
            addLog(`   📋 Valores exemplo: ${resultado.questoes.valores_exemplo?.join(', ')}`);
          } else {
            addLog(`❌ Tabela questões NÃO TEM a coluna id_prova`);
            addLog(`   ⚠️ Erro: ${resultado.questoes.erro}`);
          }
        }
        
        // Provas
        if (resultado.provas) {
          if (resultado.provas.existe) {
            addLog(`✅ Tabela provas existe com ${resultado.provas.total} registros`);
            const exemplosDeProvas = Array.isArray(resultado.provas?.exemplos) ? resultado.provas.exemplos : [];
            exemplosDeProvas.forEach((prova) => {
              if (!isRecord(prova)) {
                return;
              }
              const idProva = prova.id_prova != null ? String(prova.id_prova) : 'n/d';
              const descricao = typeof prova.descricao === 'string' ? prova.descricao : 'Sem descrição';
              const ano = prova.ano != null ? String(prova.ano) : 'Sem ano';
              addLog(`   🏛️ Prova ${idProva}: ${descricao} (${ano})`);
            });
          } else {
            addLog(`❌ Tabela provas não existe ou está vazia`);
            addLog(`   ⚠️ Erro: ${resultado.provas.erro}`);
          }
        }
        
        // Correlação
        if (resultado.correlacao) {
          if (resultado.correlacao.funciona) {
            addLog(`✅ Correlação entre questões e provas FUNCIONA!`);
            const exemplosCorrelacao = Array.isArray(resultado.correlacao?.exemplos) ? resultado.correlacao.exemplos : [];
            exemplosCorrelacao.forEach((item) => {
              if (!isRecord(item)) {
                return;
              }
              const idProva = item.id_prova != null ? String(item.id_prova) : 'n/d';
              const descricaoProva = isRecord(item.provas) && typeof item.provas.descricao === 'string' ? item.provas.descricao : 'Sem descrição';
              addLog(`   🔗 Questão id_prova ${idProva} → Prova: ${descricaoProva}`);
            });
          } else {
            addLog(`❌ Correlação entre questões e provas NÃO FUNCIONA`);
            addLog(`   ⚠️ Erro: ${resultado.correlacao.erro}`);
          }
        }
        
        // Estrutura
        if (resultado.estrutura_questao) {
          addLog("📋 Estrutura completa da tabela questões:");
          addLog(`   🔧 Colunas: ${resultado.estrutura_questao.todas_colunas?.join(', ')}`);
        }
        
      } else {
        addLog(`❌ Falha na verificação: ${verificacao.erro}`);
      }
    } catch (error) {
      addLog(`💥 Erro ao testar id_prova: ${getErrorMessage(error)}`);
    }
  };

  const testSession = async () => {
    addLog("🔍 Testando getSession...");
    
    try {
      const session = await supabase.auth.getSession();
      addLog(`📋 Sessão: ${JSON.stringify(session, null, 2)}`);
    } catch (error) {
      addLog(`💥 Erro ao buscar sessão: ${getErrorMessage(error)}`);
    }
  };

  const testarDadosSimples = async () => {
    addLog("📊 Testando dados básicos das tabelas...");
    
    try {
      const resultado = await testeSimplesDados();
      
      if (resultado.erro) {
        addLog(`❌ Erro: ${resultado.erro}`);
        return;
      }
      
      addLog("✅ Teste concluído!");
      
      // Provas
      addLog(`📚 Provas na tabela: ${resultado.provas?.total || 0}`);
      if (resultado.provas?.erro) {
        addLog(`   ❌ Erro nas provas: ${resultado.provas.erro}`);
      }
      
      // Questões  
      addLog(`📝 Questões na tabela: ${resultado.questoes?.total || 0}`);
      if (resultado.questoes?.erro) {
        addLog(`   ❌ Erro nas questões: ${resultado.questoes.erro}`);
      }
      
      // Amostras de provas
      if (resultado.amostrasProvas?.length > 0) {
        addLog("📋 Amostras de provas:");
        const amostrasProvas = Array.isArray(resultado.amostrasProvas) ? resultado.amostrasProvas : [];
        amostrasProvas.forEach((prova) => {
          if (!isRecord(prova)) {
            return;
          }
          const id = prova.id_prova != null ? String(prova.id_prova) : 'n/d';
          const ano = prova.ano != null ? String(prova.ano) : 'n/d';
          const descricao = typeof prova.descricao === 'string' ? prova.descricao : 'Sem descrição';
          addLog(`   🏛️ ID ${id}: ${ano} - ${descricao}`);
        });
      }
      
      // Amostras de questões
      if (resultado.amostrasQuestoes?.length > 0) {
        addLog("📋 Amostras de questões:");
        const amostrasQuestoes = Array.isArray(resultado.amostrasQuestoes) ? resultado.amostrasQuestoes : [];
        amostrasQuestoes.forEach((questao) => {
          if (!isRecord(questao)) {
            return;
          }
          const idQuestao = questao.id_questao != null ? String(questao.id_questao) : 'n/d';
          const idProva = questao.id_prova != null ? String(questao.id_prova) : 'n/d';
          const numero = questao.nr_questao != null ? String(questao.nr_questao) : 'n/d';
          addLog(`   📝 Questão ${idQuestao} (Prova ID: ${idProva}) - Nr: ${numero}`);
        });
      }
      
      // IDs de prova únicos
      if (resultado.idsProvaUnicos?.length > 0) {
        addLog(`🔗 IDs de prova únicos: ${resultado.idsProvaUnicos.join(', ')}`);
      }
      
    } catch (error) {
      addLog(`💥 Erro ao testar dados: ${getErrorMessage(error)}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl mb-4">🔧 Debug Supabase Mock</h2>
      
      <div className="space-x-2 mb-6 flex flex-wrap">
        <button 
          onClick={testMock}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          🔧 Config
        </button>
        
        <button 
          onClick={testBancoReal}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
        >
          🏦 Banco Real
        </button>
        
        <button 
          onClick={verificarEstrutura}
          className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
        >
          🔍 Estrutura
        </button>
        
        <button 
          onClick={testarIdProva}
          className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm"
        >
          🧾 ID Prova
        </button>
        
        <button 
          onClick={analisarProvas}
          className="px-3 py-2 bg-pink-600 hover:bg-pink-700 rounded text-sm"
        >
          🏛️ Provas
        </button>
        
        <button 
          onClick={testarSimuladosService}
          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
        >
          🎓 Service
        </button>
        
        <button 
          onClick={testarDadosSimples}
          className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
        >
          📊 Dados
        </button>
        
        <button 
          onClick={testSession}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
        >
          🔍 Sessão
        </button>
        
        <button 
          onClick={clearLogs}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
        >
          🗑️ Limpar Logs
        </button>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg h-96 overflow-y-auto">
        <h3 className="text-lg mb-2">📝 Logs:</h3>
        {logs.length === 0 ? (
          <p className="text-gray-400">Nenhum log ainda...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-2 text-sm font-mono">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
