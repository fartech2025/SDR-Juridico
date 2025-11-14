import DatabaseRelations from './pages/DatabaseRelations';
import DatabaseInspetor from './pages/DatabaseInspetor';
import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ErrorBoundary from './components/layout/ErrorBoundary';
import DebugAuth from './pages/DebugAuth';
import DocumentacaoRelacionamentos from './pages/DocumentacaoRelacionamentos';
// lazy-loaded heavy pages
const DashboardHome = React.lazy(() => import('./pages/dashboard/Home'))
const Ranking = React.lazy(() => import('./pages/dashboard/Ranking'))
const Estatisticas = React.lazy(() => import('./pages/dashboard/Estatisticas'))
const SimuladoProva = React.lazy(() => import('./pages/exam/SimuladoProva'))
const DashboardAluno = React.lazy(() => import('./components/DashboardAluno_dark_supabase'))
const DashboardGestor = React.lazy(() => import('./components/DashboardGestor_dark_supabase'))
const SecEducacao = React.lazy(() => import('./pages/SecEducacao'))
const UserLandingPage = React.lazy(() => import('./pages/UserLandingPage'))
const ResolverSimulado = React.lazy(() => import('./pages/ResolverSimuladoComImagens'))
const CentralOperacional = React.lazy(() => import('./pages/dashboard/CentralOperacional'))
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
            <Route path="/debug-auth" element={<DebugAuth />} />

            {/* Landing pública na raiz */}
            <Route path="/" element={<LandingPage />} />

            {/* Página pública de monitoramento/diagnóstico */}
            <Route path="/monitor" element={<Monitor />} />

            {/* Home protegida foi movida para /home */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="p-6">Carregando...</div>}>
                    <DashboardHome />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route path="/sec-educacao" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><SecEducacao /></Suspense>} />

            <Route
              path="/simulado/:id_prova/:id_tema"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="p-6">Carregando...</div>}>
                    <SimuladoProva />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/ranking"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="p-6">Carregando...</div>}>
                    <Ranking />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/estatisticas"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="p-6">Carregando...</div>}>
                    <Estatisticas />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/central-operacional"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="p-6">Carregando...</div>}>
                    <CentralOperacional />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/painel-aluno"
              element={
                <Suspense fallback={<div className="p-6">Carregando...</div>}>
                  <DashboardAluno />
                </Suspense>
              }
            />

            <Route
              path="/painel-gestor"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="p-6">Carregando...</div>}>
                    <DashboardGestor />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Landing autenticada do estudante */}
            <Route
              path="/inicio"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="p-6">Carregando...</div>}>
                    <UserLandingPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/resolver-simulado/:id_simulado"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="p-6">Carregando...</div>}>
                    <ResolverSimulado />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route path="/database-inspetor" element={<DatabaseInspetor />} />
            <Route path="/database-relations" element={<DatabaseRelations />} />
            <Route path="/documentacao-relacionamentos" element={<DocumentacaoRelacionamentos />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ExamProvider>
    </ErrorBoundary>
  );
}
