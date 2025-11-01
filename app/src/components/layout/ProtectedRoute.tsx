import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ensureUsuarioRegistro } from '../../services/supabaseService';
import type { ProtectedRouteProps } from '../../types';

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [preparandoPerfil, setPreparandoPerfil] = useState(true);

  useEffect(() => {
    let ativo = true;
    async function preparar() {
      if (!user) {
        setPreparandoPerfil(false);
        return;
      }
      try {
        await ensureUsuarioRegistro(user);
      } catch (error) {
        console.error('Falha ao inicializar perfil do usuário', error);
      } finally {
        if (ativo) {
          setPreparandoPerfil(false);
        }
      }
    }
    preparar();
    return () => {
      ativo = false;
    };
  }, [user]);

  if (loading || preparandoPerfil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  return <>{children}</>;
}
