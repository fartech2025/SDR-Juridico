// Mock do Supabase para desenvolvimento offline (movido para _mocks)
// Este arquivo contém implementações mínimas usadas apenas para desenvolvimento local
// e testes rápidos. Para ativar o mock defina VITE_USE_SUPABASE_MOCK=true.

interface MockUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

interface MockAuthResponse {
  user: MockUser | null;
}

class MockSupabaseAuth {
  private currentUser: MockUser | null = null;

  async signInWithPassword({ email }: { email: string; password?: string }): Promise<MockAuthResponse> {
    const mockUser: MockUser = {
      id: 'mock-1',
      email,
      user_metadata: { name: 'Usuário Mock' },
    };
    this.currentUser = mockUser;
    try { localStorage.setItem('mock_user', JSON.stringify(mockUser)); } catch {}
    return { user: mockUser };
  }

  async getUser(): Promise<{ data: { user: MockUser | null } }> {
    try {
      const raw = localStorage.getItem('mock_user');
      if (raw) {
        this.currentUser = JSON.parse(raw) as MockUser;
      }
    } catch {}
    return { data: { user: this.currentUser } };
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    try { localStorage.removeItem('mock_user'); } catch {}
  }
}

export const mockSupabase = {
  auth: new MockSupabaseAuth(),
  from() {
    // implementação mínima para usos básicos em scripts de teste
    return {
      select: async () => ({ data: [], error: null }),
      insert: async (payload: any) => ({ data: payload, error: null }),
      delete: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      in: async () => ({ data: [], error: null }),
    };
  },
} as unknown as any;
