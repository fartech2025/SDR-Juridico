export type ProvaItem = {
  id_prova: number
  ano: number
  totalQuestoes: number
  respondidas: number
}

export type UsuarioResumo = {
  id_usuario: number
  nome: string
  total_questoes: number
  total_acertos: number
  total_erros: number
  percentual_acertos: number
  tempo_medio_resposta_ms: number
  pontosFortes: string[]
  pontosFracos: string[]
}

export type Questao = {
  id_questao: number
  id_prova: number
  enunciado: string
  dificuldade: string | null
  tem_imagem: boolean | null
  nr_questao: number
  alternativas: { id_alternativa: number; letra: string; texto: string | null }[]
}

export type RespostaLocal = {
  status: 'acerto' | 'erro' | 'pulo' | 'nao'
  alternativaId?: number
  tempoMs?: number
}

// Novos tipos adicionados
export type Prova = {
  id_prova: number
  ano: number
  titulo?: string
  descricao?: string
}

export type Tema = {
  id_tema: number
  nome_tema: string
  descricao?: string
}

export type User = {
  id: string
  email: string
  nome?: string
}

export interface AuthFormEvent extends React.FormEvent<HTMLFormElement> {}

export interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}