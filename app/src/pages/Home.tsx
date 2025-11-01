import React, { useEffect, useState } from 'react';
// import TopBar from '@/components/TopBar';
// import { supabase } from '@/lib/supabaseClient';
import { UsuarioResumo } from '@/types';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import BasePage from '../components/BasePage';

export default function Home() {
  const [resumo, setResumo] = useState<UsuarioResumo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dados demo fixos para visualização
  useEffect(() => {
    setResumo({
      id_usuario: 1,
      nome: 'Aluno(a) Demo',
      total_questoes: 95,
      total_acertos: 68,
      total_erros: 27,
      percentual_acertos: 71.6,
      tempo_medio_resposta_ms: 145000,
      pontosFortes: ['Literatura', 'Interpretação de texto', 'Gramática'],
      pontosFracos: ['Matemática', 'Física', 'Química']
    });
  }, []);

  const chartData = resumo ? [
    { name: 'Acertos', value: resumo.total_acertos },
    { name: 'Erros', value: resumo.total_erros }
  ] : [];

  return (
    <BasePage>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="glass-card p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-700 rounded-3xl mb-6 shadow-2xl">
              <span className="text-3xl">🎓</span>
            </div>
            <h1 className="ds-heading mb-2">Simulados ENEM</h1>
            <p className="ds-subtitle">Escolha a prova e como deseja resolver.</p>
          </div>
          {resumo ? (
            <>
              <div className="flex justify-center gap-2 mb-4">
                <button className="btn btn-ghost">🏆 Ranking</button>
                <button className="btn btn-ghost">📊 Estatísticas</button>
              </div>
              <div className="mb-4">
                <label className="ds-label block mb-2">Selecione uma prova</label>
                <select className="input-field w-full">
                  <option>Escolha...</option>
                  <option>ENEM 2024 - Linguagens</option>
                  <option>ENEM 2023 - Linguagens</option>
                </select>
              </div>
            </>
          ) : (
            <p className="text-sm ds-muted">Carregando...</p>
          )}
        </div>
      </div>
    </BasePage>
  );
}