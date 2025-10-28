import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import HomeProduction from '@/pages/Home-production';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomeProduction />} />
        <Route path="/provas" element={<div className="p-8"><h1 className="text-2xl text-white">Provas ENEM</h1><p className="text-gray-300">Em desenvolvimento...</p></div>} />
        <Route path="/ranking" element={<div className="p-8"><h1 className="text-2xl text-white">Ranking</h1><p className="text-gray-300">Em desenvolvimento...</p></div>} />
        <Route path="/estatisticas" element={<div className="p-8"><h1 className="text-2xl text-white">Estatísticas</h1><p className="text-gray-300">Em desenvolvimento...</p></div>} />
        <Route path="/aluno" element={<div className="p-8"><h1 className="text-2xl text-white">Área do Aluno</h1><p className="text-gray-300">Em desenvolvimento...</p></div>} />
        <Route path="/aluno/selecionar-prova" element={<div className="p-8"><h1 className="text-2xl text-white">Selecionar Prova</h1><p className="text-gray-300">Em desenvolvimento...</p></div>} />
        <Route path="/aluno/resultado" element={<div className="p-8"><h1 className="text-2xl text-white">Resultado</h1><p className="text-gray-300">Em desenvolvimento...</p></div>} />
        <Route path="*" element={<div className="p-8"><h1 className="text-2xl text-white">404 - Página não encontrada</h1><p className="text-gray-300">A página que você procura não existe.</p></div>} />
      </Route>
    </Routes>
  );
}