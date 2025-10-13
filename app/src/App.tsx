import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { Bar, BarChart, Tooltip, XAxis, YAxis } from "recharts";

import { supabase } from "./lib/supabaseClient";
import LegendCompat from "./components/LegendCompat";
import { ExamProvider, useExam } from "./contexts/ExamContext";
import SelecionarProva from "./pages/SelecionarProva";
import "./App.css";

type MaybeSession = Session | null;

type Questao = {
  id_questao: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  alternativa_correta: string;
};

function Navbar({ onLogout }: { onLogout: () => Promise<void> | void }) {
  const { selectedExam } = useExam();

  return (
    <nav className="bg-blue-700 text-white p-4 flex flex-wrap gap-4 items-center justify-between rounded-b-2xl">
      <h1 className="font-bold text-xl">ENEM App</h1>
      <div className="flex flex-wrap gap-4 items-center">
        {selectedExam ? (
          <span className="text-sm bg-blue-500/70 px-3 py-1 rounded-full">
            Prova: {selectedExam.nome}
          </span>
        ) : null}
        <Link to="/provas" className="hover:underline">
          Selecionar Prova
        </Link>
        <Link to="/questoes" className="hover:underline">
          Questoes
        </Link>
        <Link to="/resultado" className="hover:underline">
          Resultado
        </Link>
        <Link to="/solucionario" className="hover:underline">
          Solucionario
        </Link>
        <button
          onClick={onLogout}
          className="bg-white text-blue-700 px-3 py-1 rounded-md font-semibold hover:bg-blue-100 transition"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}

function Login({ session }: { session: MaybeSession }) {
  const navigate = useNavigate();
  const { selectedExam, clearExam } = useExam();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (session?.user) {
      navigate(selectedExam ? "/questoes" : "/provas", { replace: true });
    }
  }, [session, selectedExam, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Informe e-mail e senha para continuar.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      clearExam();
      navigate("/provas", { replace: true });
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert("Informe o e-mail para receber o link de recuperacao.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Um link de recuperacao foi enviado para o e-mail informado.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center w-96">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Entrar no Sistema ENEM</h2>
        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Digite seu e-mail"
            className="border p-3 w-full rounded"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              className="border p-3 w-full rounded pr-12"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-2 flex items-center text-sm text-blue-600 hover:underline"
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <button
            onClick={handleLogin}
            className="bg-blue-700 text-white w-full py-2 rounded hover:bg-blue-800 transition disabled:bg-blue-300"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <button
            type="button"
            onClick={handleResetPassword}
            className="text-blue-600 hover:underline"
          >
            Esqueci minha senha
          </button>
        </div>
      </div>
    </div>
  );
}

function Questoes() {
  const navigate = useNavigate();
  const { selectedExam } = useExam();
  const tempoPadrao = selectedExam?.tempo_por_questao ?? 60;

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(tempoPadrao);
  const [isFinished, setIsFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questionStart, setQuestionStart] = useState<number>(Date.now());
  const timeoutHandledRef = useRef(false);

  useEffect(() => {
    if (!selectedExam) return;
    const examId = selectedExam.id_prova;
    let cancelled = false;

    async function fetchQuestoes() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("questoes")
        .select("*")
        .eq("id_prova", examId)
        .order("id_questao", { ascending: true });

      if (!cancelled) {
        if (fetchError) {
          console.error(fetchError);
          setError("Nao foi possivel carregar as questoes da prova selecionada.");
        } else {
          setQuestoes((data ?? []) as Questao[]);
          setCurrentIndex(0);
          setSelectedOption(null);
          setTimeLeft(tempoPadrao);
          setQuestionStart(Date.now());
          setIsFinished(false);
        }
        setLoading(false);
      }
    }

    fetchQuestoes();

    return () => {
      cancelled = true;
    };
  }, [selectedExam?.id_prova, tempoPadrao]);

  const currentQuestion = questoes[currentIndex];

  useEffect(() => {
    timeoutHandledRef.current = false;
    setTimeLeft(tempoPadrao);
    setSelectedOption(null);
    setQuestionStart(Date.now());
  }, [currentQuestion?.id_questao, tempoPadrao]);

  useEffect(() => {
    if (!currentQuestion || isFinished) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : prev));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [currentQuestion?.id_questao, isFinished]);

  const goToNextQuestion = useCallback(() => {
    if (currentIndex + 1 >= questoes.length) {
      setIsFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
    setTimeLeft(tempoPadrao);
    setSelectedOption(null);
    setQuestionStart(Date.now());
    timeoutHandledRef.current = false;
  }, [currentIndex, questoes.length, tempoPadrao]);

  useEffect(() => {
    if (!currentQuestion || isFinished) return;
    if (timeLeft === 0 && !timeoutHandledRef.current) {
      timeoutHandledRef.current = true;
      goToNextQuestion();
    }
  }, [timeLeft, currentQuestion, isFinished, goToNextQuestion]);

  const saveAnswer = useCallback(
    async (alternative: string | null) => {
      if (!currentQuestion || !alternative) return;
      setSaving(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) {
          alert("Sessao expirada. Entre novamente.");
          return;
        }
        const tempoRespostaMs = Date.now() - questionStart;
        await supabase.from("respostas_usuarios").insert({
          id_usuario: user.id,
          id_questao: currentQuestion.id_questao,
          alternativa_marcada: alternative,
          correta: alternative === currentQuestion.alternativa_correta,
          tempo_resposta_ms: Math.max(tempoRespostaMs, 0),
        });
      } catch (err) {
        console.error(err);
        alert("Nao foi possivel salvar sua resposta. Tente novamente.");
      } finally {
        setSaving(false);
      }
    },
    [currentQuestion, questionStart]
  );

  const handleConfirm = async () => {
    if (!selectedOption) {
      alert("Selecione uma alternativa para continuar.");
      return;
    }
    await saveAnswer(selectedOption);
    goToNextQuestion();
  };

  const handleSkip = () => {
    goToNextQuestion();
  };

  const handleFinish = () => {
    setIsFinished(true);
  };

  if (loading) {
    return <p className="p-6">Carregando questoes...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  if (questoes.length === 0) {
    return <div className="p-6 text-gray-600">Nao ha questoes cadastradas para esta prova.</div>;
  }

  if (!currentQuestion || isFinished) {
    return (
      <div className="p-6 flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold text-blue-700">Prova concluida!</h2>
        <p className="text-gray-600">Parabens por finalizar a prova selecionada.</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/resultado")}
            className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
          >
            Ver desempenho
          </button>
          <button
            onClick={() => navigate("/provas")}
            className="bg-gray-200 text-blue-700 px-4 py-2 rounded hover:bg-gray-300 transition"
          >
            Escolher outra prova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">
          Questao {currentIndex + 1} de {questoes.length}
        </span>
        <span className="text-sm font-semibold text-blue-700">
          Tempo restante: {timeLeft}s
        </span>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="font-semibold mb-4 text-lg">{currentQuestion.enunciado}</p>
        <div className="space-y-3">
          {["A", "B", "C", "D", "E"].map((alt) => (
            <label
              key={alt}
              className="flex items-center gap-3 border border-gray-200 rounded-lg p-3 hover:border-blue-400 transition"
            >
              <input
                type="radio"
                name={`questao-${currentQuestion.id_questao}`}
                value={alt}
                checked={selectedOption === alt}
                onChange={() => setSelectedOption(alt)}
              />
              <span className="text-gray-700 font-medium">{alt})</span>
              <span className="text-gray-700">
                {currentQuestion[`alternativa_${alt.toLowerCase() as "a" | "b" | "c" | "d" | "e"}`]}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            disabled={saving}
          >
            Pular
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="px-4 py-2 rounded border border-amber-500 text-amber-600 hover:bg-amber-50 transition"
          >
            Finalizar prova
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800 transition disabled:bg-blue-400"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Confirmar resposta"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Resultado() {
  const [dados, setDados] = useState<any[]>([]);

  useEffect(() => {
    carregarResultados();
  }, []);

  async function carregarResultados() {
    const usuario = (await supabase.auth.getUser()).data.user;
    if (!usuario) return;
    const { data } = await supabase
      .from("vw_resultados_calculados")
      .select("*")
      .eq("id_usuario", usuario.id);
    setDados(data ?? []);
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Desempenho do Usuario</h2>
      {dados.length > 0 ? (
        <BarChart width={500} height={300} data={dados} className="bg-white rounded-xl shadow-md p-4">
          <XAxis dataKey="id_usuario" />
          <YAxis />
          <Tooltip />
          <LegendCompat />
          <Bar dataKey="total_acertos" fill="#22c55e" name="Acertos" />
          <Bar dataKey="total_erros" fill="#ef4444" name="Erros" />
        </BarChart>
      ) : (
        <p>Nenhum resultado disponivel ainda.</p>
      )}
    </div>
  );
}

function Solucionario() {
  const [solucoes, setSolucoes] = useState<any[]>([]);

  useEffect(() => {
    carregarSolucoes();
  }, []);

  async function carregarSolucoes() {
    const { data } = await supabase.from("solucoes_questoes").select("*, questoes(enunciado)");
    setSolucoes(data ?? []);
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Solucionario</h2>
      {solucoes.map((s: any) => (
        <div key={s.id_solucao} className="bg-white p-4 rounded-xl shadow-md mb-4">
          <h3 className="font-semibold mb-2">{s.questoes?.enunciado}</h3>
          <p>{s.texto_solucao}</p>
        </div>
      ))}
    </div>
  );
}

function ProtectedRoute({
  isAuthenticated,
  requireExam = false,
  children,
}: {
  isAuthenticated: boolean;
  requireExam?: boolean;
  children: ReactElement;
}) {
  const { selectedExam } = useExam();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireExam && !selectedExam) {
    return <Navigate to="/provas" replace />;
  }

  return children;
}

function AppInner() {
  const [session, setSession] = useState<MaybeSession>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const { clearExam, selectedExam } = useExam();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    clearExam();
    if (error) {
      alert(error.message);
    }
  };

  const isAuthenticated = useMemo(() => !!session?.user, [session]);

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-50 text-blue-700 font-semibold">
        Carregando...
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <Navbar onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={<Login session={session} />} />
        <Route
          path="/provas"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <SelecionarProva />
            </ProtectedRoute>
          }
        />
        <Route
          path="/questoes"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requireExam>
              <Questoes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resultado"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Resultado />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solucionario"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Solucionario />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to={isAuthenticated ? (selectedExam ? "/questoes" : "/provas") : "/"}
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ExamProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </ExamProvider>
  );
}

