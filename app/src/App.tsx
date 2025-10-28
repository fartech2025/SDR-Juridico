import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import HomeProduction from '@/pages/Home-production';
import Login from '@/pages/Login';
import Provas from '@/pages/Provas';
import ResolverProva from '@/pages/ResolverProva';
import Ranking from '@/pages/Ranking';
import Cadastro from '@/pages/Cadastro';
import Estatisticas from '@/pages/Estatisticas';
import HomeAluno from '@/pages/HomeAluno';
import SelecionarProva from '@/pages/SelecionarProva';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomeProduction />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/provas" element={<Provas />} />
        <Route path="/provas/:ano" element={<ResolverProva />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/estatisticas" element={<Estatisticas />} />
        <Route path="/aluno" element={<HomeAluno />} />
        <Route path="/aluno/selecionar-prova" element={<SelecionarProva />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}