import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import BasePage from '../components/BasePage';

type Row = { pos: number, nome: string, percentual: number, acertos: number, total: number }

const Ranking: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
  // if (!supabase) throw new Error('Supabase não configurado (.env)')
        const { data: ru, error: e1 } = await supabase
          .from('resultados_usuarios')
          .select('id_usuario,total_questoes,total_acertos,percentual_acertos')
          .order('percentual_acertos', { ascending: false })
          .limit(20)
        if (e1) throw e1

        const ids = (ru ?? []).map(r => r.id_usuario)
        let nomes = new Map<number, string>()
        if (ids.length) {
          const { data: us, error: e2 } = await supabase
            .from('usuarios')
            .select('id_usuario,nome')
            .in('id_usuario', ids as any)
          if (e2) throw e2
          us?.forEach(u => nomes.set(u.id_usuario, u.nome))
        }

        const combined: Row[] = (ru ?? []).map((r, idx) => ({
          pos: idx + 1,
          nome: nomes.get(r.id_usuario) ?? `Usuário ${r.id_usuario}`,
          percentual: Number(r.percentual_acertos ?? 0),
          acertos: r.total_acertos ?? 0,
          total: r.total_questoes ?? 0,
        }))
        setRows(combined)
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar ranking')
      }
    })()
  }, [])

  return (
    <BasePage maxWidth="max-w-6xl">
      <div className="relative container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-3">
            <span className="text-4xl">🏆</span>
            Ranking
          </h1>
          <p className="text-slate-300 text-lg">Os melhores desempenhos do ENEM 2024</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm glass-card">
            <p className="text-red-400 text-center">⚠️ Falha ao carregar ranking: {error}</p>
          </div>
        )}

        <div className="glass-card overflow-hidden">
          {/* Podium Top 3 */}
          {rows.length >= 3 && (
            <div className="p-8 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">🥇 Top 3 Estudantes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rows.slice(0, 3).map((student, index) => (
                  <div key={student.pos} className={`relative p-6 rounded-2xl backdrop-blur-sm border ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/30' :
                    index === 1 ? 'bg-gradient-to-br from-gray-400/20 to-slate-500/20 border-gray-400/30' :
                    'bg-gradient-to-br from-amber-600/20 to-orange-600/20 border-amber-600/30'
                  } hover:scale-105 transition-all duration-300`}>
                    <div className="text-center">
                      <div className={`text-6xl mb-3 ${
                        index === 0 ? 'animate-pulse-glow' : ''
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">#{student.pos}</div>
                      <div className="text-lg font-semibold text-slate-200 mb-3">{student.nome}</div>
                      <div className={`text-3xl font-bold mb-2 ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        'text-amber-400'
                      }`}>
                        {student.percentual.toFixed(1)}%
                      </div>
                      <div className="text-slate-300 text-sm">
                        {student.acertos}/{student.total} acertos
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabela Completa */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200">Posição</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200">Estudante</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200">Aproveitamento</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200">Acertos</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200">Total</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((student, index) => (
                  <tr key={student.pos} className={`border-t border-white/10 hover:bg-white/5 transition-colors duration-200 ${
                    index < 3 ? 'bg-gradient-to-r from-amber-500/5 to-yellow-500/5' : ''
                  }`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl ${
                          index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎓'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎓'}
                        </span>
                        <span className="text-white font-semibold">#{student.pos}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{student.nome}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-xl font-bold ${
                        student.percentual >= 80 ? 'text-emerald-400' :
                        student.percentual >= 60 ? 'text-yellow-400' :
                        student.percentual >= 40 ? 'text-orange-400' :
                        'text-red-400'
                      }`}>
                        {student.percentual.toFixed(1)}%
                      </div>
                      <div className="w-20 h-2 bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            student.percentual >= 80 ? 'bg-emerald-500' :
                            student.percentual >= 60 ? 'bg-yellow-500' :
                            student.percentual >= 40 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${student.percentual}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-400 font-semibold">{student.acertos}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300">{student.total}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        student.percentual >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        student.percentual >= 60 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        student.percentual >= 40 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {student.percentual >= 80 ? 'Excelente' :
                         student.percentual >= 60 ? 'Bom' :
                         student.percentual >= 40 ? 'Regular' :
                         'Precisa Melhorar'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BasePage>
  );
}

export default Ranking;