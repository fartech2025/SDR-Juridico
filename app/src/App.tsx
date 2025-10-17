import { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
// NOVOS PAINÉIS
import DashboardAluno_dark from "./components/DashboardAluno_dark_supabase";
import DashboardGestor_dark from "./components/DashboardGestor_dark_supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =========================
// LOGIN
// =========================
function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro('Credenciais inválidas.');
    else navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
      <div className="bg-gray-900 p-10 rounded-3xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-400">Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 rounded bg-gray-800 text-gray-100" required />
          <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="p-3 rounded bg-gray-800 text-gray-100" required />
          <button type="submit" className="bg-blue-700 hover:bg-blue-600 p-3 rounded font-semibold">Entrar</button>
        </form>
        {erro && <p className="text-red-400 mt-3">{erro}</p>}
        <p className="mt-4 text-sm text-gray-400">Não tem uma conta? <Link to="/cadastro" className="text-blue-400 hover:underline">Criar Conta</Link></p>
      </div>
    </div>
  );
}

// =========================
// CADASTRO
// =========================
function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro('');
    const { error, data } = await supabase.auth.signUp({ email, password: senha, options: { data: { nome } } });
    if (error) setErro(error.message);
    else {
      const uid = data?.user?.id;
      await supabase.from('usuarios').upsert({ id_usuario: uid, nome, email });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
      <div className="bg-gray-900 p-10 rounded-3xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-400">Criar Conta</h1>
        <form onSubmit={handleCadastro} className="flex flex-col gap-4">
          <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} className="p-3 rounded bg-gray-800 text-gray-100" required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 rounded bg-gray-800 text-gray-100" required />
          <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="p-3 rounded bg-gray-800 text-gray-100" required />
          <button type="submit" className="bg-green-700 hover:bg-green-600 p-3 rounded font-semibold">Cadastrar</button>
        </form>
        {erro && <p className="text-red-400 mt-3">{erro}</p>}
        <p className="mt-4 text-sm text-gray-400">Já tem uma conta? <Link to="/login" className="text-blue-400 hover:underline">Fazer Login</Link></p>
      </div>
    </div>
  );
}

// =========================
// PROTECTED ROUTE
// =========================
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
    };
    load();
  }, []);
  if (loading) return <div className="text-center text-gray-400 p-10">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// =========================
// HOME
// =========================
function Home() {
  const navigate = useNavigate();
  const [provas, setProvas] = useState([]);
  const [temas, setTemas] = useState([]);
  const [provaSelecionada, setProvaSelecionada] = useState('');

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    const carregarDados = async () => {
      const { data: provasData } = await supabase.from('provas').select('id_prova, ano, descricao');
      const { data: temasData } = await supabase.from('temas').select('id_tema, nome_tema');
      setProvas(provasData || []);
      setTemas(temasData || []);
    };
    carregarDados();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 p-10">
      <div className="bg-gray-900 p-10 rounded-3xl shadow-xl w-full max-w-2xl text-center relative">
        <button onClick={logout} className="absolute top-4 right-4 text-sm bg-red-600 hover:bg-red-500 px-3 py-1 rounded-md">Sair</button>
        <h1 className="text-3xl font-bold mb-2 text-blue-400">🎓 Simulados ENEM</h1>
        <p className="text-gray-400 mb-6">Escolha a prova e como deseja resolver.</p>

      <div className="flex items-center gap-3 mb-4 flex-wrap justify-center">
        <Link to="/ranking" className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-md">🏆 Ranking</Link>
        <Link to="/estatisticas" className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-md">📊 Estatísticas</Link>
        <Link to="/painel-aluno" className="text-sm bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded-md">🎓 Painel do Aluno</Link>
        <Link to="/painel-gestor" className="text-sm bg-green-700 hover:bg-green-600 px-3 py-1 rounded-md">🧑‍🏫 Painel do Gestor</Link>
      </div>

        <h2 className="text-lg mb-3">Selecione uma prova</h2>
        <select onChange={(e) => setProvaSelecionada(e.target.value)} className="p-3 rounded-lg bg-gray-800 text-gray-100 mb-6 w-full">
          <option value="">Escolha...</option>
          {provas.map((p) => (
            <option key={p.id_prova} value={p.id_prova}>{p.ano} - {p.descricao}</option>
          ))}
        </select>

        {provaSelecionada && (
          <div>
            <h3 className="text-lg mb-3">Selecione um tema</h3>
            <div className="grid grid-cols-1 gap-3">
              <Link to={`/simulado/${provaSelecionada}/completa`} className="bg-blue-700 hover:bg-blue-600 py-3 rounded-xl font-semibold">Prova Completa</Link>
              {temas.map((t) => (
                <Link key={t.id_tema} to={`/simulado/${provaSelecionada}/${t.id_tema}`} className="bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold">{t.nome_tema}</Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================
// SIMULADO PROVA (com imagens inline no enunciado e alternativas)
// =========================
function SimuladoProva() {
  const { id_prova, id_tema } = useParams();
  const navigate = useNavigate();
  const [questoes, setQuestoes] = useState([]);
  const [atual, setAtual] = useState(0);
  const [resposta, setResposta] = useState(null);
  const [respondendo, setRespondendo] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(4 * 60 * 60);
  const [acertos, setAcertos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [resumo, setResumo] = useState(null);
  const inicioProvaRef = useRef(Date.now());
  const inicioQuestaoRef = useRef(Date.now());

  // carregar questões
  useEffect(() => {
    const carregarQuestoes = async () => {
      try {
        let query = supabase
          .from('questoes')
          .select(`
            id_questao,
            enunciado,
            id_tema,
            id_prova,
            alternativas(id_alternativa, letra, texto),
            solucoes_questoes(alternativa_correta)
          `)
          .eq('id_prova', id_prova)
          .order('id_questao', { ascending: true });

        if (id_tema !== 'completa' && !isNaN(parseInt(id_tema))) {
          query = query.eq('id_tema', parseInt(id_tema));
        }

        const { data, error } = await query;
        if (error) throw error;

        const idsQuestoes = data.map((q) => q.id_questao);
        let imagensQuestoes = [];
        if (idsQuestoes.length) {
          const { data: imgQ } = await supabase
            .from('imagens')
            .select('id_entidade, caminho_arquivo, tipo_entidade, descricao')
            .eq('tipo_entidade', 'questao')
            .in('id_entidade', idsQuestoes);
          imagensQuestoes = imgQ || [];
        }

        const formatadas = data.map((q) => ({
          ...q,
          imagensQuestao: imagensQuestoes.filter((img) => img.id_entidade === q.id_questao),
          correta: q.solucoes_questoes?.[0]?.alternativa_correta || null,
        }));

        setQuestoes(formatadas);
      } catch (err) {
        console.error('Erro ao carregar questões:', err);
      }
    };
    carregarQuestoes();
  }, [id_prova, id_tema]);

  const renderizarTextoComImagens = (texto) => {
    const partes = texto.split(/(https?:\/\/\S+\.(?:png|jpe?g|gif|webp))/gi);
    return partes.map((parte, i) => {
      if (/^https?:\/\/\S+\.(png|jpe?g|gif|webp)$/i.test(parte)) {
        return <img key={i} src={parte} alt="imagem" className="mx-auto my-4 max-h-96 rounded-lg shadow" />;
      }
      return <span key={i}>{parte}</span>;
    });
  };

  const handleAnterior = () => atual > 0 && setAtual(atual - 1);
  const handleProxima = () => atual < questoes.length - 1 && setAtual(atual + 1);
  const handleFinalizar = () => window.confirm('Finalizar a prova?') && finalizarProva();

  const responder = async (letra) => {
    if (respondendo || !questoes[atual]) return;
    setRespondendo(true);
    setResposta(letra);

    const questao = questoes[atual];
    const correta = letra === questao.correta;
    if (correta) setAcertos((a) => a + 1);

    const tempoMs = Date.now() - inicioQuestaoRef.current;
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user) {
        const alt = questao.alternativas.find((a) => a.letra === letra);
        await supabase.from('respostas_usuarios').insert({
          id_usuario: user.id,
          id_questao: questao.id_questao,
          id_alternativa: alt?.id_alternativa || null,
          alternativa_marcada: letra,
          correta,
          tempo_resposta_ms: tempoMs,
          data_resposta: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Erro ao salvar resposta:', err);
    }

    setTimeout(() => {
      setResposta(null);
      setRespondendo(false);
      inicioQuestaoRef.current = Date.now();
      if (atual + 1 < questoes.length) setAtual(atual + 1);
      else finalizarProva();
    }, 1000);
  };

  const finalizarProva = async () => {
    if (finalizado) return;
    const total = questoes.length;
    const erros = total - acertos;
    const percentual = total ? (acertos / total) * 100 : 0;
    const tempoTotalSeg = Math.floor((Date.now() - inicioProvaRef.current) / 1000);

    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user) {
        await supabase.from('resultados_usuarios').upsert({
          id_usuario: user.id,
          total_questoes: total,
          total_acertos: acertos,
          total_erros: erros,
          percentual_acertos: percentual,
          data_ultima_atualizacao: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Erro ao salvar resultado:', e);
    }

    setResumo({ total, acertos, erros, percentual: percentual.toFixed(2), tempoTotalSeg });
    setFinalizado(true);
  };

  if (!questoes.length)
    return <div className="text-center text-gray-400 p-10">Carregando questões...</div>;

  if (finalizado && resumo) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-10">
        <div className="bg-gray-900 p-10 rounded-3xl max-w-lg w-full text-center">
          <h1 className="text-3xl font-bold text-green-400 mb-4">🎯 Prova Finalizada!</h1>
          <p>Total: {resumo.total}</p>
          <p className="text-green-400">Acertos: {resumo.acertos}</p>
          <p className="text-red-400">Erros: {resumo.erros}</p>
          <p>Aproveitamento: {resumo.percentual}%</p>
          <button onClick={() => navigate('/')} className="bg-blue-700 hover:bg-blue-600 px-6 py-3 mt-6 rounded-xl">Voltar</button>
        </div>
      </div>
    );
  }

  const questao = questoes[atual];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-10">
      <div className="bg-gray-900 p-8 rounded-3xl max-w-3xl w-full shadow-2xl">
        <div className="flex justify-between mb-6 text-sm text-gray-400">
          <span>Questão {atual + 1} / {questoes.length}</span>
        </div>

        <div className="text-lg text-gray-200 mb-4 whitespace-pre-line">
          {renderizarTextoComImagens(questao.enunciado)}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {questao.alternativas.map((alt) => (
            <button
              key={alt.id_alternativa}
              onClick={() => responder(alt.letra)}
              disabled={respondendo}
              className={`p-3 rounded-xl font-semibold transition-all ${
                resposta
                  ? alt.letra === questao.correta
                    ? 'bg-green-700'
                    : alt.letra === resposta
                    ? 'bg-red-700'
                    : 'bg-gray-800'
                  : 'bg-blue-700 hover:bg-blue-600'
              }`}
            >
              {renderizarTextoComImagens(`${alt.letra}. ${alt.texto}`)}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <button onClick={handleAnterior} disabled={atual === 0} className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl disabled:opacity-50">⬅ Anterior</button>
          <button onClick={handleProxima} disabled={atual === questoes.length - 1} className="bg-blue-700 hover:bg-blue-600 px-6 py-3 rounded-xl disabled:opacity-50">Próxima ➡</button>
          <button onClick={handleFinalizar} className="bg-green-700 hover:bg-green-600 px-6 py-3 rounded-xl">✅ Finalizar Prova</button>
        </div>
      </div>
    </div>
  );
}

// =========================
// RANKING
// =========================
function Ranking() {
  const [ranking, setRanking] = useState([]);
  useEffect(() => {
    const carregarRanking = async () => {
      const { data } = await supabase
        .from('resultados_usuarios')
        .select('id_usuario, percentual_acertos, total_questoes')
        .order('percentual_acertos', { ascending: false })
        .limit(10);
      setRanking(data || []);
    };
    carregarRanking();
  }, []);
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center p-10">
      <h1 className="text-3xl text-blue-400 font-bold mb-6">🏆 Ranking de Usuários</h1>
      <table className="w-full max-w-2xl text-left border border-gray-700 rounded-xl overflow-hidden">
        <thead className="bg-gray-800 text-gray-300">
          <tr><th className="p-3">Usuário</th><th className="p-3">Percentual</th><th className="p-3">Questões</th></tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={i} className="border-t border-gray-700">
              <td className="p-3">Usuário #{r.id_usuario}</td>
              <td className="p-3">{Number(r.percentual_acertos)?.toFixed(2)}%</td>
              <td className="p-3">{r.total_questoes}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link to="/" className="mt-6 bg-blue-700 hover:bg-blue-600 px-6 py-3 rounded-xl">Voltar</Link>
    </div>
  );
}

// =========================
// ESTATÍSTICAS
// =========================
function Estatisticas() {
  const [dados, setDados] = useState({ temas: [], dificuldade: [], horas: [] });
  useEffect(() => {
    const carregarEstatisticas = async () => {
      const { data: temaData } = await supabase.from('resultados_por_tema').select('id_tema, percentual');
      const { data: difData } = await supabase.from('resultados_por_dificuldade').select('dificuldade, percentual');
      const { data: horaData } = await supabase.from('resultados_por_hora').select('hora, percentual');
      setDados({ temas: temaData || [], dificuldade: difData || [], horas: horaData || [] });
    };
    carregarEstatisticas();
  }, []);
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center p-10">
      <h1 className="text-3xl text-blue-400 font-bold mb-6">📊 Estatísticas de Desempenho</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl">
        <div className="bg-gray-900 p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg mb-3">Desempenho por Tema</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dados.temas}><XAxis dataKey="id_tema" /><YAxis /><Tooltip /><Legend /><Bar dataKey="percentual" fill="#3b82f6" /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-900 p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg mb-3">Por Dificuldade</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={dados.dificuldade} dataKey="percentual" nameKey="dificuldade" cx="50%" cy="50%" outerRadius={100}>
                {dados.dificuldade.map((_, i) => <Cell key={i} fill={["#22c55e", "#eab308", "#ef4444"][i % 3]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-2 bg-gray-900 p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg mb-3">Desempenho por Hora</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dados.horas}><XAxis dataKey="hora" /><YAxis /><Tooltip /><Legend /><Bar dataKey="percentual" fill="#6366f1" /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <Link to="/" className="mt-8 bg-blue-700 hover:bg-blue-600 px-6 py-3 rounded-xl">Voltar</Link>
    </div>
  );
}

// =========================
// ROUTER
// =========================
export default function AppWrapper() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/simulado/:id_prova/:id_tema" element={<ProtectedRoute><SimuladoProva /></ProtectedRoute>} />
        <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
        <Route path="/estatisticas" element={<ProtectedRoute><Estatisticas /></ProtectedRoute>} />
        {/* NOVAS ROTAS DE PAINÉIS */}
        <Route path="/painel-aluno" element={<ProtectedRoute><DashboardAluno_dark /></ProtectedRoute>} />
        <Route path="/painel-gestor" element={<ProtectedRoute><DashboardGestor_dark /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
