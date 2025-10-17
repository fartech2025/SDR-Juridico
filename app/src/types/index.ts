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