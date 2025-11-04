import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SimuladoRenderer } from '../components/QuestaoRenderer';
import BasePage from '../components/BasePage';
import { supabase } from '../lib/supabaseClient';

interface RespostaUsuario {
  questao_id: number;
  resposta: string;
  timestamp: number;
}

export default function ResolverSimulado() {
  const { id_simulado } = useParams<{ id_simulado: string }>();
  const [simuladoId, setSimuladoId] = useState<number | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // Buscar usuário atual
    const fetchUsuario = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('usuarios')
            .select('id_usuario')
            .eq('email', user.email)
            .single();
          setUsuario(data);
        }
      } catch (err) {
        console.error('Erro ao buscar usuário:', err);
      }
    };

    if (id_simulado) {
      setSimuladoId(parseInt(id_simulado, 10));
    }

    fetchUsuario();
  }, [id_simulado]);

  const handleSimuladoCompleto = async (respostas: RespostaUsuario[]) => {
    if (!usuario) {
      alert('Usuário não identificado');
      return;
    }

    try {
      setEnviando(true);

      // Buscar gabarito das questões
      const questoesIds = respostas.map((r) => r.questao_id);
      const { data: questoes } = await supabase
        .from('questoes')
        .select('id_questao, resposta_correta')
        .in('id_questao', questoesIds);

      if (!questoes) throw new Error('Erro ao buscar gabarito');

      // Calcular acertos
      let totalAcertos = 0;
      const respostasParaInserir = respostas.map((resposta) => {
        const questao = questoes.find((q: any) => q.id_questao === resposta.questao_id);
        const correta = questao?.resposta_correta === resposta.resposta;
        if (correta) totalAcertos++;

        return {
          id_usuario: usuario.id_usuario,
          id_questao: resposta.questao_id,
          resposta_usuario: resposta.resposta,
          correta,
          tempo_resposta_ms: resposta.timestamp,
          data_resposta: new Date().toISOString(),
        };
      });

      // Inserir respostas no banco
      const { error: erroInsert } = await supabase
        .from('respostas_usuarios')
        .insert(respostasParaInserir);

      if (erroInsert) throw erroInsert;

      // Mostrar resultado
      const percentualAcertos = Math.round((totalAcertos / respostas.length) * 100);
      alert(
        `✅ Simulado concluído!\n\nAcertos: ${totalAcertos}/${respostas.length}\nPercentual: ${percentualAcertos}%`
      );

      // Redirecionar para dashboard
      window.location.href = '/home';
    } catch (err) {
      console.error('Erro ao salvar respostas:', err);
      alert('Erro ao salvar respostas. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (!simuladoId) {
    return (
      <BasePage>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          Simulado não encontrado
        </div>
      </BasePage>
    );
  }

  return (
    <BasePage>
      <div className="max-w-4xl mx-auto">
        {simuladoId && (
          <SimuladoRenderer
            id_simulado={simuladoId}
            onSimuladoCompleto={handleSimuladoCompleto}
          />
        )}

        {enviando && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 p-8 rounded-lg space-y-4 text-center">
              <div className="animate-spin text-3xl">⏳</div>
              <p className="text-slate-100">Salvando suas respostas...</p>
            </div>
          </div>
        )}
      </div>
    </BasePage>
  );
}
