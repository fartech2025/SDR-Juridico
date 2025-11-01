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
  from(table: string) {
    const mockTables: Record<string, any[]> = {
      provas: [
        { id_prova: 1, nome: 'Prova Mock', ano: 2024, descricao: 'Simulado de exemplo', tempo_por_questao: 180 },
      ],
      questoes: [],
      alternativas: [],
      imagens: [],
      temas: [
        { id_tema: 1, nome_tema: 'Tema Mock', descricao: 'Descrição mock' },
      ],
    };

    const rows = Array.isArray(mockTables[table]) ? [...mockTables[table]] : [];

    class MockQueryBuilder<T = any> {
      private data: T[];
      private error: Error | null = null;

      constructor(initialRows: T[]) {
        this.data = initialRows;
      }

      private makeResponse<ResponseData = T[]>(
        overrideData?: ResponseData | null
      ) {
        const payload = overrideData ?? (Array.isArray(this.data) ? [...this.data] : this.data);
        return { data: payload as ResponseData, error: this.error };
      }

      select(): MockQueryBuilder<T> {
        return this;
      }

      eq(column: string, value: any): MockQueryBuilder<T> {
        this.data = this.data.filter((row: any) => row?.[column] === value);
        return this;
      }

      in(column: string, values: any[]): MockQueryBuilder<T> {
        const allowed = new Set(values);
        this.data = this.data.filter((row: any) => allowed.has(row?.[column]));
        return this;
      }

      order(column: string, options?: { ascending?: boolean }): MockQueryBuilder<T> {
        const ascending = options?.ascending !== false;
        this.data = [...this.data].sort((a: any, b: any) => {
          const aValue = a?.[column];
          const bValue = b?.[column];
          if (aValue === bValue) return 0;
          if (aValue === undefined || aValue === null) return ascending ? 1 : -1;
          if (bValue === undefined || bValue === null) return ascending ? -1 : 1;
          if (aValue > bValue) return ascending ? 1 : -1;
          if (aValue < bValue) return ascending ? -1 : 1;
          return 0;
        });
        return this;
      }

      range(): MockQueryBuilder<T> {
        return this;
      }

      limit(): MockQueryBuilder<T> {
        return this;
      }

      maybeSingle(): Promise<{ data: T | null; error: Error | null }> {
        const { data, error } = this.makeResponse<T | null>(this.data[0] ?? null);
        return Promise.resolve({ data, error });
      }

      single(): Promise<{ data: T | null; error: Error | null }> {
        return this.maybeSingle();
      }

      insert(payload: T | T[]) {
        const inserted = Array.isArray(payload) ? payload : [payload];
        this.data = [...this.data, ...inserted];
        return Promise.resolve(this.makeResponse(inserted));
      }

      update(payload: Partial<T>) {
        this.data = this.data.map((row) => ({ ...row, ...payload }));
        return Promise.resolve(this.makeResponse(payload));
      }

      delete() {
        this.data = [];
        return Promise.resolve(this.makeResponse(null));
      }

      then<TResult1 = any, TResult2 = never>(
        onFulfilled?: ((value: { data: T[]; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
        onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
      ) {
        return Promise.resolve(this.makeResponse())
          .then(onFulfilled as any, onRejected as any);
      }

      catch<TResult = never>(
        onRejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
      ) {
        return Promise.resolve(this.makeResponse()).catch(onRejected as any);
      }

      finally(onFinally?: (() => void) | null) {
        return Promise.resolve(this.makeResponse()).finally(onFinally ?? undefined);
      }
    }

    return new MockQueryBuilder(rows);
  },
} as unknown as any;
