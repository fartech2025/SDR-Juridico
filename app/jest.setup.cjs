require('@testing-library/jest-dom');

// Garante que os testes usem o cliente Supabase mockado.
if (!process.env.VITE_USE_SUPABASE_MOCK) {
  process.env.VITE_USE_SUPABASE_MOCK = 'true';
}

globalThis.__VITE_ENV__ = {
  ...(globalThis.__VITE_ENV__ ?? {}),
  VITE_USE_SUPABASE_MOCK: process.env.VITE_USE_SUPABASE_MOCK,
};
