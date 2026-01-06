// ProtectedRoute desabilitado temporariamente até configurar Supabase
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Permitir acesso sem autenticação enquanto Supabase não está configurado
  return <>{children}</>
}
