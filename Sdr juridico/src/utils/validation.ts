// Security validation schemas using Zod
// Date: 2026-01-19

import { z } from 'zod'

// Organization Schema
export const organizationSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-Z0-9\s\-\_\.\,\&]+$/, 'Nome contém caracteres inválidos'),
  
  slug: z.string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(/^[a-z0-9\-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .optional(),
  
  cnpj: z.string()
    .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos')
    .optional(),
  
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email muito longo')
    .optional(),
  
  phone: z.string()
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos')
    .optional(),
})

// User Schema
export const userSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email muito longo'),
  
  full_name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-Z\s\'\-]+$/, 'Nome contém caracteres inválidos'),
  
  phone: z.string()
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos')
    .optional(),
  
  role: z.enum(['fartech_admin', 'org_admin', 'user'])
})

// Lead Schema
export const leadSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-Z\s\'\-]+$/, 'Nome contém caracteres inválidos'),
  
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email muito longo')
    .optional(),
  
  telefone: z.string()
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos')
    .optional(),
  
  origem: z.string()
    .max(50, 'Origem muito longa')
    .optional(),
  
  status: z.enum(['novo', 'em_atendimento', 'qualificado', 'convertido', 'descartado']).optional(),
})

// Case Schema
export const caseSchema = z.object({
  titulo: z.string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(200, 'Título muito longo'),
  
  numero_processo: z.string()
    .regex(/^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$/, 'Número de processo inválido (formato: 0000000-00.0000.0.00.0000)')
    .optional(),
  
  descricao: z.string()
    .max(5000, 'Descrição muito longa')
    .optional(),
  
  valor_causa: z.number()
    .min(0, 'Valor da causa deve ser positivo')
    .optional(),
  
  status: z.enum(['ativo', 'suspenso', 'encerrado', 'arquivado']).optional(),
  
  tipo: z.string()
    .max(50, 'Tipo muito longo')
    .optional(),
})

// Document Schema
export const documentSchema = z.object({
  titulo: z.string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(200, 'Título muito longo'),
  
  descricao: z.string()
    .max(1000, 'Descrição muito longa')
    .optional(),
  
  tipo: z.enum(['contrato', 'peticao', 'sentenca', 'acordo', 'procuracao', 'outro']).optional(),
  
  mime_type: z.string()
    .regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/, 'MIME type inválido')
    .optional(),
  
  arquivo_tamanho: z.number()
    .min(1, 'Arquivo vazio')
    .max(50 * 1024 * 1024, 'Arquivo muito grande (máx 50MB)')
    .optional(),
})

// Client Schema
export const clientSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-Z\s\'\-]+$/, 'Nome contém caracteres inválidos'),
  
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email muito longo')
    .optional(),
  
  telefone: z.string()
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos')
    .optional(),
  
  cpf: z.string()
    .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
    .optional(),
  
  cnpj: z.string()
    .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos')
    .optional(),
  
  tipo: z.enum(['fisica', 'juridica']).optional(),
})

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/javascript:|data:text\/html|vbscript:/gi, '') // Remove script URLs
    .replace(/onload=|onerror=|onclick=|onmouseover=/gi, '') // Remove event handlers
    .trim()
}

export const sanitizeHTML = (html: string): string => {
  // Remove all HTML tags except safe ones
  const safeTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'span']
  const tagRegex = /<(\/?[a-z][a-z0-9]*)\b[^>]*>/gi
  
  return html.replace(tagRegex, (match, tagName) => {
    const cleanTag = tagName.toLowerCase().replace('/', '')
    return safeTags.includes(cleanTag) ? match : ''
  })
}

// XSS Protection
export const escapeHTML = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// SQL Injection Protection Pattern Check
export const hasSQLInjectionPattern = (input: string): boolean => {
  const sqlPatterns = [
    /(\bunion\b.*\bselect\b)/gi,
    /(\bor\b.*\b=\b.*\bor\b)/gi,
    /(\bdrop\b.*\btable\b)/gi,
    /(\binsert\b.*\binto\b)/gi,
    /(\bdelete\b.*\bfrom\b)/gi,
    /(\bupdate\b.*\bset\b)/gi,
    /(;.*--)/gi,
    /(\bexec\b|\bexecute\b)/gi,
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

// Path Traversal Protection
export const hasPathTraversal = (input: string): boolean => {
  const pathPatterns = [
    /\.\.\//gi,
    /\.\.\\/gi,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
  ]
  
  return pathPatterns.some(pattern => pattern.test(input))
}

// Validation helper
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      }
    }
    return { success: false, errors: ['Erro de validação desconhecido'] }
  }
}

// Export all schemas
export const schemas = {
  organization: organizationSchema,
  user: userSchema,
  lead: leadSchema,
  case: caseSchema,
  document: documentSchema,
  client: clientSchema,
}
