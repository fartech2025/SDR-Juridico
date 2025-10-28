import type { ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
}

export interface Prova {
  id_prova: number;
  ano: number;
  descricao: string;
}

export interface Tema {
  id_tema: number;
  nome_tema: string;
}

export interface Alternativa {
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  alternativa_correta: string;
}

export interface Questao {
  id_questao: number;
  id_tema: number;
  enunciado: string;
  dificuldade: string;
  imagem_url?: string;
  created_at?: string;
  peso_dificuldade?: number;
  alternativas?: Alternativa[];
}

export interface ProtectedRouteProps {
  children: ReactNode;
}

export interface AuthFormEvent {
  preventDefault: () => void;
}

export interface ProvaItem {
  id_prova: number;
  ano: number;
  totalQuestoes: number;
  respondidas: number;
}

export interface UsuarioResumo {
  total_questoes: number;
  total_acertos: number;
  percentual_acertos: number;
}

export interface ResultadoPorTema {
  nome_tema: string;
  total_questoes: number;
  total_acertos: number;
  percentual_acertos: number;
}

export interface ResultadoPorDificuldade {
  dificuldade: string;
  total_questoes: number;
  total_acertos: number;
  percentual_acertos: number;
}

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  data_criacao?: string;
}

export interface RankingItem {
  pos: number;
  nome: string;
  percentual: number;
  acertos: number;
  total: number;
}