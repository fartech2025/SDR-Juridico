// scripts/dou/types.ts

export interface DOUHit {
  title: string
  urlTitle: string
  content: string
  pubDate: string
  pubName: string
  artType: string
  artCategory: string
  numberPage: string
  editionNumber: string
  hierarchyList?: string[]
  classPK?: string
  identifica?: string
}

export interface DOUMatchResult {
  matched: boolean
  score: number
  matchType: 'numero_processo' | 'nome_parte' | 'oab' | 'custom'
}

export interface DOUTermo {
  termo: string
  tipo: 'numero_processo' | 'nome_parte' | 'oab' | 'custom'
  caso_id?: string
  org_id?: string
}

export type DOUTipoPublicacao = 'intimacao' | 'citacao' | 'edital' | 'despacho' | 'sentenca' | 'outro'
