import React from 'react';
import BasePage from '../components/BasePage';

export default function HomeSimple() {
  return (
    <BasePage maxWidth="max-w-4xl">
      <div className="glass-card p-8 mt-12">
        <h1 className="ds-heading text-center mb-8">🎓 ENEM 2024 Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <h2 className="ds-heading text-lg mb-2">📊 Estatísticas</h2>
            <p className="ds-muted">Visualize seu desempenho</p>
          </div>
          <div className="glass-card p-6">
            <h2 className="ds-heading text-lg mb-2">📝 Provas</h2>
            <p className="ds-muted">Acesse as provas do ENEM</p>
          </div>
          <div className="glass-card p-6">
            <h2 className="ds-heading text-lg mb-2">🏆 Ranking</h2>
            <p className="ds-muted">Veja sua posição</p>
          </div>
        </div>
      </div>
    </BasePage>
  );
}