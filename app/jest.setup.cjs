require('@testing-library/jest-dom');

// Definir NODE_ENV como test para que o supabaseClient use as variáveis corretas
process.env.NODE_ENV = 'test';

// Mock para import.meta.env necessário no ambiente de testes
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_USE_SUPABASE_MOCK: 'true',
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_LOGO_BUCKET: 'test-bucket',
        VITE_LOGO_PATH: 'test-path',
      },
    },
  },
  writable: true,
});

// Garante que os testes usem o cliente Supabase mockado.
if (!process.env.VITE_USE_SUPABASE_MOCK) {
  process.env.VITE_USE_SUPABASE_MOCK = 'true';
}

globalThis.__VITE_ENV__ = {
  ...(globalThis.__VITE_ENV__ ?? {}),
  VITE_USE_SUPABASE_MOCK: process.env.VITE_USE_SUPABASE_MOCK,
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
};
