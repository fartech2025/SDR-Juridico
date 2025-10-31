import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/auth/Login';
import Cadastro from './components/auth/Cadastro';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ErrorBoundary from './components/layout/ErrorBoundary';
import DashboardHome from './pages/dashboard/Home';
import Ranking from './pages/dashboard/Ranking';
import Estatisticas from './pages/dashboard/Estatisticas';
import SimuladoProva from './pages/exam/SimuladoProva';
import DashboardAluno from './components/DashboardAluno_dark_supabase';
import DashboardGestor from './components/DashboardGestor_dark_supabase';
import SelecionarProva from './pages/SelecionarProva';
import { ExamProvider } from './contexts/ExamContext';
import LandingPage from './pages/LandingPage';
import Monitor from './pages/Monitor';

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <ExamProvider>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Landing pública na raiz */}
            <Route path="/" element={<LandingPage />} />

            {/* Página pública de monitoramento/diagnóstico */}
            <Route path="/monitor" element={<Monitor />} />

            {/* Home protegida foi movida para /home */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <DashboardHome />
                </ProtectedRoute>
              }
            />

            <Route
              path="/selecionar-prova"
              element={
                <ProtectedRoute>
                  <SelecionarProva />
                </ProtectedRoute>
              }
            />

            <Route
              path="/simulado/:id_prova/:id_tema"
              element={
                <ProtectedRoute>
                  <SimuladoProva />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ranking"
              element={
                <ProtectedRoute>
                  <Ranking />
                </ProtectedRoute>
              }
            />

            <Route
              path="/estatisticas"
              element={
                <ProtectedRoute>
                  <Estatisticas />
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel-aluno"
              element={
                <ProtectedRoute>
                  <DashboardAluno />
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel-gestor"
              element={
                <ProtectedRoute>
                  <DashboardGestor />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ExamProvider>
    </ErrorBoundary>
  );
}
