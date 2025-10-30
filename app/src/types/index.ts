import type { ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
}

export interface Prova {
  id_prova: number;
  ano: number;
  nome: string;
  descricao: string | null;
  tempo_por_questao?: number | null;
}

export interface Tema {
  id_tema: number;
  nome_tema: string;
}

export interface QuestaoAlternativa {
  id_alternativa: number;
  letra: string;
  texto: string;
  correta: boolean;
  tem_imagem: boolean;
  imagens?: QuestaoImagem[];
}

export interface QuestaoImagem {
  id_imagem: number;
  caminho_arquivo: string;
  descricao?: string | null;
}

export interface Questao {
  id_questao: number;
  id_tema: number;
  id_prova: number;
  enunciado: string;
  dificuldade: string;
  tem_imagem: boolean;
  nr_questao?: number | null;
  peso_dificuldade?: number | null;
  imagens?: QuestaoImagem[];
  alternativas: QuestaoAlternativa[];
  alternativa_correta: string | null;
}

export interface ProtectedRouteProps {
  children: ReactNode;
}

export interface AuthFormEvent {
  preventDefault: () => void;
}

export interface Usuario {
  id_usuario: number;
  email: string;
  nome: string | null;
  auth_user_id: string;
  nivel: number;
  xp_total: number;
  streak_dias: number;
  ultima_resposta_em: string | null;
  created_at?: string;
  updated_at?: string;
}
