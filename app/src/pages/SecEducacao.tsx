import React from 'react';
import { useNavigate } from 'react-router-dom';
import BasePage from '../components/BasePage';

export default function SecEducacao() {
  const navigate = useNavigate();
  return (
    <BasePage>
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh]">
        <div className="glass-card p-8 max-w-lg w-full text-center">
          <h1 className="ds-heading mb-4">Secretaria de Educação</h1>
          <p className="ds-muted mb-6">Página reservada para conteúdo institucional.</p>
          <div className="flex justify-center">
            <button
              className="btn btn-ghost"
              onClick={() => navigate(-1)}
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </BasePage>
  );
}
