// Mock do Supabase para desenvolvimento offline
interface MockUser {
  id: string;
  email: string;
  user_metadata?: {
    nome?: string;
  };
}

interface MockAuthResponse {
  data: {
    user: MockUser | null;
  };
  error: Error | null;
}

class MockSupabaseAuth {
  private currentUser: MockUser | null = null;

  async signInWithPassword({ email, password }: { email: string; password: string }): Promise<MockAuthResponse> {
    // Simula validação básica
    if (!email || !password) {
      return {
        data: { user: null },
        error: new Error('Email e senha são obrigatórios')
      };
    }

    // Usuário pré-definido para desenvolvimento
    const predefinedUser = {
      email: 'frpdias@icloud.com',
      password: '123456',
      nome: 'Fernando Dias'
    };

    // Verificar se é o usuário pré-definido
    if (email === predefinedUser.email && password === predefinedUser.password) {
      const mockUser: MockUser = {
        id: 'user_fernando_dias',
        email: predefinedUser.email,
        user_metadata: {
          nome: predefinedUser.nome
        }
      };

      this.currentUser = mockUser;
      localStorage.setItem('mock_user', JSON.stringify(mockUser));

      return {
        data: { user: mockUser },
        error: null
      };
    }

    // Para outros usuários, manter validação genérica
    if (password.length < 6) {
      return {
        data: { user: null },
        error: new Error('Senha deve ter pelo menos 6 caracteres')
      };
    }

    // Simula login bem-sucedido para qualquer outro usuário
    const mockUser: MockUser = {
      id: `user_${Date.now()}`,
      email,
      user_metadata: {}
    };

    this.currentUser = mockUser;
    localStorage.setItem('mock_user', JSON.stringify(mockUser));

    return {
      data: { user: mockUser },
      error: null
    };
  }

  async signUp({ 
    email, 
    password, 
    options 
  }: { 
    email: string; 
    password: string; 
    options?: { data?: { nome?: string } } 
  }): Promise<MockAuthResponse> {
    if (!email || !password) {
      return {
        data: { user: null },
        error: new Error('Email e senha são obrigatórios')
      };
    }

    // Usuário pré-definido para desenvolvimento  
    const predefinedUser = {
      email: 'frpdias@icloud.com',
      password: '123456',
      nome: 'Fernando Dias'
    };

    // Se tentar cadastrar o usuário pré-definido, tratar como login
    if (email === predefinedUser.email) {
      return this.signInWithPassword({ email, password });
    }

    if (password.length < 6) {
      return {
        data: { user: null },
        error: new Error('Senha deve ter pelo menos 6 caracteres')
      };
    }

    const mockUser: MockUser = {
      id: `user_${Date.now()}`,
      email,
      user_metadata: {
        nome: options?.data?.nome || 'Usuário'
      }
    };

    this.currentUser = mockUser;
    localStorage.setItem('mock_user', JSON.stringify(mockUser));

    return {
      data: { user: mockUser },
      error: null
    };
  }

  async getUser(): Promise<MockAuthResponse> {
    const storedUser = localStorage.getItem('mock_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.currentUser = user;
      return {
        data: { user },
        error: null
      };
    }

    return {
      data: { user: null },
      error: null
    };
  }

  async signOut(): Promise<{ error: Error | null }> {
    this.currentUser = null;
    localStorage.removeItem('mock_user');
    return { error: null };
  }
}

export const mockSupabaseAuth = new MockSupabaseAuth();

// Os dados usados no mock são definidos abaixo em `mockData`.

type MockRow = Record<string, any>;

const mockData: Record<string, MockRow[]> = {
  provas: [
    { id_prova: 1, ano: 2023, descricao: "ENEM 2023 - 1º Dia", nome: "ENEM 2023 (Dia 1)", tempo_por_questao: 180 },
    { id_prova: 2, ano: 2023, descricao: "ENEM 2023 - 2º Dia", nome: "ENEM 2023 (Dia 2)", tempo_por_questao: 180 },
    { id_prova: 3, ano: 2022, descricao: "ENEM 2022 - 1º Dia", nome: "ENEM 2022 (Dia 1)", tempo_por_questao: 180 },
    { id_prova: 4, ano: 2022, descricao: "ENEM 2022 - 2º Dia", nome: "ENEM 2022 (Dia 2)", tempo_por_questao: 180 },
    { id_prova: 5, ano: 2021, descricao: "ENEM 2021 - 1º Dia", nome: "ENEM 2021 (Dia 1)", tempo_por_questao: 180 }
  ],
  temas: [
    { id_tema: 1, nome_tema: "Matematica Basica", descricao: "Operacoes fundamentais e raciocinio logico" },
    { id_tema: 2, nome_tema: "Interpretacao de Texto", descricao: "Compreensao e analise de textos diversos" },
    { id_tema: 3, nome_tema: "Ciencias da Natureza", descricao: "Fisica, quimica e biologia basicas" }
  ],
  questoes: [
    {
      id_questao: 1,
      id_tema: 1,
      enunciado: "Qual e o valor de 3 + 5?",
      alternativas: ["6", "7", "8", "9", "10"],
      resposta_correta: "8",
      alternativa_correta: "C",
      dificuldade: "FACIL",
      id_prova: 1
    },
    {
      id_questao: 2,
      id_tema: 1,
      enunciado: "Resolva: 2x = 14. Qual e o valor de x?",
      alternativas: ["5", "6", "7", "8", "9"],
      resposta_correta: "7",
      alternativa_correta: "C",
      dificuldade: "MEDIO",
      id_prova: 1
    },
    {
      id_questao: 3,
      id_tema: 2,
      enunciado: "O que melhor resume a ideia principal de um texto argumentativo?",
      alternativas: [
        "Apresentar dados sem opiniao",
        "Convencer o leitor por meio de argumentos",
        "Narrar eventos em ordem cronologica",
        "Descrever detalhadamente um objeto",
        "Expressar sentimentos do autor"
      ],
      resposta_correta: "Convencer o leitor por meio de argumentos",
      alternativa_correta: "B",
      dificuldade: "MEDIO",
      id_prova: 1
    },
    {
      id_questao: 4,
      id_tema: 3,
      enunciado: "Qual particula possui carga negativa?",
      alternativas: ["Proton", "Neutron", "Eletron", "Positron", "Ion"],
      resposta_correta: "Eletron",
      alternativa_correta: "C",
      dificuldade: "FACIL",
      id_prova: 2
    },
    {
      id_questao: 5,
      id_tema: 3,
      enunciado: "A fotossintese ocorre principalmente em qual estrutura vegetal?",
      alternativas: ["Raiz", "Caule", "Flor", "Folha", "Fruto"],
      resposta_correta: "Folha",
      alternativa_correta: "D",
      dificuldade: "DIFICIL",
      id_prova: 2
    }
  ]
};

type QueryResult = { data: any; error: Error | null };

class MockPostgrestQuery {
  private workingRows: MockRow[];
  private singleResult = false;

  constructor(private readonly table: string, private readonly rows: MockRow[]) {
    this.workingRows = [...rows];
  }

  private resetWorkingSet() {
    this.workingRows = Array.isArray(this.rows) ? [...this.rows] : [];
    this.singleResult = false;
  }

  select(columns?: string) {
    console.log(`🔍 Mock: Consultando tabela '${this.table}' colunas '${columns}'`);
    this.resetWorkingSet();
    return this;
  }

  eq(column: string, rawValue: any) {
    console.log(`🔍 Mock: Filtrando ${this.table} onde ${column} = ${rawValue}`);
    this.workingRows = this.workingRows.filter((item) => {
      const candidate = item[column];
      if (typeof candidate === "number") {
        return candidate === Number(rawValue);
      }
      return candidate === rawValue;
    });
    console.log(`🔍 Mock: Encontradas ${this.workingRows.length} registros`);
    return this;
  }

  in(column: string, values: any[]) {
    const normalized = new Set(
      values.map((value) => (typeof value === "number" ? value : Number.isNaN(Number(value)) ? value : Number(value)))
    );
    this.workingRows = this.workingRows.filter((item) => normalized.has(item[column]));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const ascending = options?.ascending ?? true;
    this.workingRows = [...this.workingRows].sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];
      if (aValue === bValue) return 0;
      if (aValue == null) return ascending ? -1 : 1;
      if (bValue == null) return ascending ? 1 : -1;
      if (typeof aValue === "string" && typeof bValue === "string") {
        return ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return ascending ? (aValue < bValue ? -1 : 1) : (aValue < bValue ? 1 : -1);
    });
    return this;
  }

  limit(count: number) {
    this.workingRows = this.workingRows.slice(0, count);
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  maybeSingle() {
    return Promise.resolve<QueryResult>({ data: this.workingRows[0] ?? null, error: null });
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    const payload = this.singleResult ? this.workingRows[0] ?? null : this.workingRows;
    return Promise.resolve({ data: payload, error: null }).then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<QueryResult | TResult> {
    const payload = this.singleResult ? this.workingRows[0] ?? null : this.workingRows;
    return Promise.resolve({ data: payload, error: null }).catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<QueryResult> {
    return Promise.resolve({ data: this.singleResult ? this.workingRows[0] ?? null : this.workingRows, error: null }).finally(
      onfinally ?? undefined
    );
  }
}

function ensureTable(table: string): MockRow[] {
  if (!mockData[table]) {
    mockData[table] = [];
  }
  return mockData[table];
}

// Mock do cliente Supabase
export const mockSupabase = {
  auth: mockSupabaseAuth,
  from: (table: string) => {
    const rows = ensureTable(table);
    return {
      select: (columns?: string) => new MockPostgrestQuery(table, rows).select(columns),
      insert: (values: MockRow | MockRow[]) => {
        const payloads = Array.isArray(values) ? values : [values];
        rows.push(...payloads.map((item) => ({ ...item })));
        return Promise.resolve<QueryResult>({ data: payloads, error: null });
      },
      update: (values: MockRow) => {
        const index = values?.id
          ? rows.findIndex((row) => row.id === values.id)
          : rows.findIndex((row) => row.id_prova === values.id_prova);
        if (index >= 0) {
          rows[index] = { ...rows[index], ...values };
          return Promise.resolve<QueryResult>({ data: [rows[index]], error: null });
        }
        return Promise.resolve<QueryResult>({ data: [], error: null });
      },
      delete: () => {
        rows.length = 0;
        return Promise.resolve<QueryResult>({ data: [], error: null });
      },
      upsert: (payload: MockRow | MockRow[], options?: { onConflict?: string; ignoreDuplicates?: boolean }) => {
        const payloads = Array.isArray(payload) ? payload : [payload];
        let lastUpsert: MockRow | null = null;

        for (const entry of payloads) {
          lastUpsert = entry;
          if (options?.onConflict) {
            const key = options.onConflict;
            const existingIndex = rows.findIndex((row) => row[key] === entry[key]);
            if (existingIndex >= 0) {
              rows[existingIndex] = { ...rows[existingIndex], ...entry };
              continue;
            }
          }
          if (!options?.ignoreDuplicates) {
            rows.push({ ...entry });
          }
        }

        const locateResult = () => {
          if (!lastUpsert) return null;
          if (options?.onConflict) {
            return rows.find((row) => row[options.onConflict!] === lastUpsert![options.onConflict!]) ?? null;
          }
          return lastUpsert;
        };

        return {
          select: (columns?: string) => {
            const result = locateResult();
            if (!result) {
              return new MockPostgrestQuery(table, rows).select(columns);
            }
            const query = new MockPostgrestQuery(table, rows).select(columns);
            return {
              maybeSingle: () => Promise.resolve<QueryResult>({ data: result, error: null })
            };
          },
          maybeSingle: () => Promise.resolve<QueryResult>({ data: locateResult(), error: null })
        };
      }
    };
  }
};
