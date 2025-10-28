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

// Dados reais extraídos do banco Supabase
const mockData = {
  provas: [
    { id_prova: 1, ano: 2023, descricao: "ENEM 2023 - 1º Dia" },
    { id_prova: 2, ano: 2023, descricao: "ENEM 2023 - 2º Dia" },
    { id_prova: 3, ano: 2022, descricao: "ENEM 2022 - 1º Dia" },
    { id_prova: 4, ano: 2022, descricao: "ENEM 2022 - 2º Dia" },
    { id_prova: 5, ano: 2021, descricao: "ENEM 2021 - 1º Dia" }
  ],
  temas: [
    { id_tema: 1, nome_tema: "Matematica Basica", descricao: "Operacoes fundamentais e raciocinio logico" },
    { id_tema: 2, nome_tema: "Interpretacao de Texto", descricao: "Compreensao e analise de textos diversos" },
    { id_tema: 3, nome_tema: "Ciencias da Natureza", descricao: "Fisica, quimica e biologia basicas" }
  ],
  questoes: [
    // Questões reais do banco Supabase
    {
      id_questao: 1,
      id_tema: 1, // Matematica Basica
      enunciado: "Qual e o valor de 3 + 5?",
      alternativas: ["6", "7", "8", "9", "10"],
      resposta_correta: "8", // alternativa C
      alternativa_correta: "C",
      dificuldade: "FACIL",
      id_prova: 1
    },
    {
      id_questao: 2,
      id_tema: 1, // Matematica Basica
      enunciado: "Resolva: 2x = 14. Qual e o valor de x?",
      alternativas: ["5", "6", "7", "8", "9"],
      resposta_correta: "7", // alternativa C
      alternativa_correta: "C",
      dificuldade: "MEDIO",
      id_prova: 1
    },
    {
      id_questao: 3,
      id_tema: 2, // Interpretacao de Texto
      enunciado: "O que melhor resume a ideia principal de um texto argumentativo?",
      alternativas: [
        "Apresentar dados sem opiniao",
        "Convencer o leitor por meio de argumentos",
        "Narrar eventos em ordem cronologica",
        "Descrever detalhadamente um objeto",
        "Expressar sentimentos do autor"
      ],
      resposta_correta: "Convencer o leitor por meio de argumentos", // alternativa B
      alternativa_correta: "B",
      dificuldade: "MEDIO",
      id_prova: 1
    },
    {
      id_questao: 4,
      id_tema: 3, // Ciencias da Natureza
      enunciado: "Qual particula possui carga negativa?",
      alternativas: ["Proton", "Neutron", "Eletron", "Positron", "Ion"],
      resposta_correta: "Eletron", // alternativa C
      alternativa_correta: "C",
      dificuldade: "FACIL",
      id_prova: 2
    },
    {
      id_questao: 5,
      id_tema: 3, // Ciencias da Natureza
      enunciado: "A fotossintese ocorre principalmente em qual estrutura vegetal?",
      alternativas: ["Raiz", "Caule", "Flor", "Folha", "Fruto"],
      resposta_correta: "Folha", // alternativa D
      alternativa_correta: "D",
      dificuldade: "DIFICIL",
      id_prova: 2
    }
  ]
};

// Mock do cliente Supabase
export const mockSupabase = {
  auth: mockSupabaseAuth,
  from: (table: string) => ({
    select: (columns?: string) => {
      console.log(`🔍 Mock: Consultando tabela '${table}' colunas '${columns}'`);
      const data = mockData[table as keyof typeof mockData] || [];
      
      return {
        data,
        error: null,
        eq: (column: string, value: any) => {
          console.log(`🔍 Mock: Filtrando ${table} onde ${column} = ${value}`);
          const filteredData = data.filter((item: any) => {
            // Converter valores para comparação
            const itemValue = item[column];
            const compareValue = typeof itemValue === 'number' ? parseInt(value) : value;
            return itemValue === compareValue;
          });
          console.log(`🔍 Mock: Encontradas ${filteredData.length} registros`);
          return { data: filteredData, error: null };
        }
      };
    },
    insert: (values: any) => ({ data: [values], error: null }),
    update: (values: any) => ({ data: [values], error: null }),
    delete: () => ({ data: [], error: null })
  })
};