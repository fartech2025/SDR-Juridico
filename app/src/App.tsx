import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import LayoutSimple from '@/components/LayoutSimple';
import Test from '@/pages/Test';
import HomeSimple from '@/pages/HomeSimple';
import HomeProduction from '@/pages/Home-production';
import HomeModern from '@/pages/HomeModern';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Cadastro from '@/pages/Cadastro';
import Provas from '@/pages/Provas';
import Ranking from '@/pages/Ranking';
import Estatisticas from '@/pages/Estatisticas';
import NotFound from '@/pages/NotFound';
import SimuladoProva from '@/pages/exam/SimuladoProva';
import ResolverProva from '@/pages/ResolverProva';

export default function App() {
  return (
    <Routes>
      <Route path="/test" element={<Test />} />
      
      {/* Landing Page sem Layout */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Rotas com LayoutSimple */}
      <Route element={<LayoutSimple />}>
        <Route path="/dashboard" element={<HomeModern />} />
        <Route path="/home" element={<HomeProduction />} />
        <Route path="/home-simple" element={<HomeSimple />} />
        <Route path="/provas" element={<Provas />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/estatisticas" element={<Estatisticas />} />
        <Route path="/simulado/:id_prova/:id_tema" element={<SimuladoProva />} />
        <Route path="/simulado" element={<SimuladoProva />} />
        <Route path="/provas/:ano" element={<ResolverProva />} />
        <Route path="/aluno" element={<div className="p-8"><h1 className="text-2xl text-white">Área do Aluno</h1><p className="text-gray-300">Em desenvolvimento...</p></div>} />
        <Route path="/aluno/selecionar-prova" element={<div className="p-8"><h1 className="text-2xl text-white">Selecionar Prova</h1><p className="text-gray-300">Em desenvolvimento...</p></div>} />
        <Route path="/aluno/resultado" element={<div className="p-8"><h1 className="text-2xl text-white">Resultado</h1><p className="text-gray-300">Em desenvolvimento...</p></div>} />
        <Route path="*" element={<NotFound />} />
      </Route>
      
      {/* Rotas sem Layout (Login/Cadastro) */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
    </Routes>
  );
}