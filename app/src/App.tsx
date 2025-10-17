import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ExamProvider } from './contexts/ExamContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Login from './components/auth/Login';
import Cadastro from './components/auth/Cadastro';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Home from './pages/dashboard/Home';
import SimuladoProva from './pages/exam/SimuladoProva';
import Ranking from './pages/dashboard/Ranking';
import Estatisticas from './pages/dashboard/Estatisticas';

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <ExamProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/simulado/:id_prova/:id_tema" element={<ProtectedRoute><SimuladoProva /></ProtectedRoute>} />
            <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
            <Route path="/estatisticas" element={<ProtectedRoute><Estatisticas /></ProtectedRoute>} />
          </Routes>
        </Router>
      </ExamProvider>
    </ErrorBoundary>
  );
}
