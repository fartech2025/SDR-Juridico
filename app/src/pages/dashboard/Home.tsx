import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { fetchProvas, fetchTemas } from '../../services/supabaseService';
import DevBanner from '../../components/layout/DevBanner';
import type { Prova, Tema } from '../../types';

export default function Home() {
  const navigate = useNavigate();
  const [provas, setProvas] = useState<Prova[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [provaSelecionada, setProvaSelecionada] = useState('');

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    const carregarDados = async () => {
      const { data: provasData } = await fetchProvas();
      const { data: temasData } = await fetchTemas();
      
      setProvas(provasData || []);
      setTemas(temasData || []);
    };
    carregarDados();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <DevBanner />
      <div className="flex-1 flex items-center justify-center p-2 sm:p-10">
        <div className="bg-gray-900 p-4 sm:p-10 rounded-3xl shadow-xl w-full max-w-2xl text-center relative transition-all">
          <button 
            onClick={logout} 
            className="absolute top-4 right-4 text-sm bg-red-600 hover:bg-red-500 px-3 py-1 rounded-md focus:ring-2 focus:ring-red-400 focus:outline-none"
          >
            Sair
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-blue-400">🎓 Simulados ENEM</h1>
          <p className="text-gray-400 mb-6">Escolha a prova e como deseja resolver.</p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
            <Link 
              to="/ranking" 
              className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              🏆 Ranking
            </Link>
            <Link 
              to="/estatisticas" 
              className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              📊 Estatísticas
            </Link>
          </div>

          <h2 className="text-lg mb-3">Selecione uma prova</h2>
          <select 
            onChange={(e) => setProvaSelecionada(e.target.value)} 
            className="p-3 rounded-lg bg-gray-800 text-gray-100 mb-6 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={provaSelecionada}
            aria-label="Selecionar prova"
          >
            <option value="">Escolha...</option>
            {provas.map((p) => (
              <option key={p.id_prova} value={p.id_prova}>
                {p.ano} - {p.descricao}
              </option>
            ))}
          </select>

          {provaSelecionada && (
            <div>
              <h3 className="text-lg mb-3">Selecione um tema</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link 
                  to={`/simulado/${provaSelecionada}/completa`} 
                  className="bg-blue-700 hover:bg-blue-600 py-3 rounded-xl font-semibold text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  tabIndex={0}
                  aria-label="Prova completa"
                >
                  Prova Completa
                </Link>
                {temas.map((t) => (
                  <Link 
                    key={t.id_tema} 
                    to={`/simulado/${provaSelecionada}/${t.id_tema}`} 
                    className="bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    tabIndex={0}
                    aria-label={`Tema ${t.nome_tema}`}
                  >
                    {t.nome_tema}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}