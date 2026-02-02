import { describe, it, expect } from 'vitest'
import {
  sanitizeString,
  sanitizeHTML,
  escapeHTML,
  hasSQLInjectionPattern,
  hasPathTraversal,
  validateInput,
  loginSchema,
  leadSchema,
  clientSchema,
  caseSchema,
  documentSchema,
  organizationSchema,
  userSchema,
  inviteAdminSchema,
  datajudSearchSchema,
} from '@/utils/validation'

// ─── sanitizeString ───────────────────────────────────────────

describe('sanitizeString', () => {
  it('remove script tags', () => {
    const input = '<script>alert("xss")</script>Texto seguro'
    expect(sanitizeString(input)).not.toContain('<script')
    expect(sanitizeString(input)).toContain('Texto seguro')
  })

  it('remove javascript: protocol', () => {
    expect(sanitizeString('javascript:alert(1)')).not.toContain('javascript:')
  })

  it('remove event handlers', () => {
    expect(sanitizeString('onload=alert(1)')).not.toContain('onload=')
    expect(sanitizeString('onerror=alert(1)')).not.toContain('onerror=')
    expect(sanitizeString('onclick=alert(1)')).not.toContain('onclick=')
  })

  it('preserva texto normal', () => {
    expect(sanitizeString('  João da Silva  ')).toBe('João da Silva')
  })

  it('faz trim do resultado', () => {
    expect(sanitizeString('  texto  ')).toBe('texto')
  })

  it('remove data:text/html', () => {
    expect(sanitizeString('data:text/html,<h1>XSS</h1>')).not.toContain('data:text/html')
  })
})

// ─── sanitizeHTML ─────────────────────────────────────────────

describe('sanitizeHTML', () => {
  it('mantém tags seguras', () => {
    expect(sanitizeHTML('<b>negrito</b>')).toContain('<b>')
    expect(sanitizeHTML('<i>italico</i>')).toContain('<i>')
    expect(sanitizeHTML('<strong>forte</strong>')).toContain('<strong>')
    expect(sanitizeHTML('<em>enfase</em>')).toContain('<em>')
    expect(sanitizeHTML('<br>')).toContain('<br>')
    expect(sanitizeHTML('<p>paragrafo</p>')).toContain('<p>')
  })

  it('remove tags perigosas', () => {
    expect(sanitizeHTML('<script>alert(1)</script>')).not.toContain('<script>')
    expect(sanitizeHTML('<iframe src="evil"></iframe>')).not.toContain('<iframe')
    expect(sanitizeHTML('<div>conteudo</div>')).not.toContain('<div>')
  })
})

// ─── escapeHTML ───────────────────────────────────────────────

describe('escapeHTML', () => {
  it('escapa caracteres especiais HTML', () => {
    expect(escapeHTML('&')).toBe('&amp;')
    expect(escapeHTML('<')).toBe('&lt;')
    expect(escapeHTML('>')).toBe('&gt;')
    expect(escapeHTML('"')).toBe('&quot;')
    expect(escapeHTML("'")).toBe('&#039;')
  })

  it('escapa string completa', () => {
    expect(escapeHTML('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('preserva texto sem caracteres especiais', () => {
    expect(escapeHTML('Texto normal')).toBe('Texto normal')
  })
})

// ─── hasSQLInjectionPattern ───────────────────────────────────

describe('hasSQLInjectionPattern', () => {
  it('detecta UNION SELECT', () => {
    expect(hasSQLInjectionPattern('1 UNION SELECT * FROM users')).toBe(true)
  })

  it('detecta DROP TABLE', () => {
    expect(hasSQLInjectionPattern("'; DROP TABLE users; --")).toBe(true)
  })

  it('detecta INSERT INTO', () => {
    expect(hasSQLInjectionPattern("INSERT INTO users VALUES ('hacker')")).toBe(true)
  })

  it('detecta DELETE FROM', () => {
    expect(hasSQLInjectionPattern('DELETE FROM usuarios')).toBe(true)
  })

  it('detecta UPDATE SET', () => {
    expect(hasSQLInjectionPattern("UPDATE users SET admin = true")).toBe(true)
  })

  it('detecta comment injection (;--)', () => {
    expect(hasSQLInjectionPattern("admin'; -- comment")).toBe(true)
  })

  it('detecta EXEC', () => {
    expect(hasSQLInjectionPattern('EXEC xp_cmdshell')).toBe(true)
  })

  it('permite texto normal', () => {
    expect(hasSQLInjectionPattern('Maria Santos')).toBe(false)
    expect(hasSQLInjectionPattern('Escritório de Advocacia')).toBe(false)
    expect(hasSQLInjectionPattern('user@email.com')).toBe(false)
  })
})

// ─── hasPathTraversal ─────────────────────────────────────────

describe('hasPathTraversal', () => {
  it('detecta ../', () => {
    expect(hasPathTraversal('../../etc/passwd')).toBe(true)
  })

  it('detecta ..\\', () => {
    expect(hasPathTraversal('..\\windows\\system32')).toBe(true)
  })

  it('detecta URL encoded ../', () => {
    expect(hasPathTraversal('%2e%2e%2fetc%2fpasswd')).toBe(true)
  })

  it('detecta URL encoded ..\\', () => {
    expect(hasPathTraversal('%2e%2e%5cwindows')).toBe(true)
  })

  it('permite caminhos normais', () => {
    expect(hasPathTraversal('documentos/contrato.pdf')).toBe(false)
    expect(hasPathTraversal('foto_perfil.jpg')).toBe(false)
  })
})

// ─── loginSchema ──────────────────────────────────────────────

describe('loginSchema', () => {
  it('valida login correto', () => {
    const result = validateInput(loginSchema, {
      email: 'user@example.com',
      password: '12345678',
    })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ email: 'user@example.com', password: '12345678' })
  })

  it('rejeita email invalido', () => {
    const result = validateInput(loginSchema, {
      email: 'invalid-email',
      password: '12345678',
    })
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('rejeita senha curta (< 8 chars)', () => {
    const result = validateInput(loginSchema, {
      email: 'user@example.com',
      password: '1234567',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita senha muito longa (> 128 chars)', () => {
    const result = validateInput(loginSchema, {
      email: 'user@example.com',
      password: 'a'.repeat(129),
    })
    expect(result.success).toBe(false)
  })
})

// ─── leadSchema ───────────────────────────────────────────────

describe('leadSchema', () => {
  it('valida lead com dados minimos', () => {
    const result = validateInput(leadSchema, { nome: 'Jose Silva' })
    expect(result.success).toBe(true)
  })

  it('valida lead com todos os campos', () => {
    const result = validateInput(leadSchema, {
      nome: 'Jose Silva',
      email: 'joao@email.com',
      telefone: '11999998888',
      origem: 'site',
      status: 'novo',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita nome muito curto', () => {
    const result = validateInput(leadSchema, { nome: 'Jo' })
    expect(result.success).toBe(false)
  })

  it('rejeita telefone invalido', () => {
    const result = validateInput(leadSchema, {
      nome: 'João Silva',
      telefone: '123',
    })
    expect(result.success).toBe(false)
  })
})

// ─── clientSchema ─────────────────────────────────────────────

describe('clientSchema', () => {
  it('valida cliente pessoa fisica', () => {
    const result = validateInput(clientSchema, {
      nome: 'Maria Santos',
      cpf: '12345678901',
      tipo: 'fisica',
    })
    expect(result.success).toBe(true)
  })

  it('valida cliente pessoa juridica', () => {
    const result = validateInput(clientSchema, {
      nome: 'Empresa LTDA',
      cnpj: '12345678000190',
      tipo: 'juridica',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita CPF com tamanho errado', () => {
    const result = validateInput(clientSchema, {
      nome: 'Maria Santos',
      cpf: '123',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita CNPJ com tamanho errado', () => {
    const result = validateInput(clientSchema, {
      nome: 'Empresa LTDA',
      cnpj: '123',
    })
    expect(result.success).toBe(false)
  })
})

// ─── caseSchema ───────────────────────────────────────────────

describe('caseSchema', () => {
  it('valida caso com dados minimos', () => {
    const result = validateInput(caseSchema, { titulo: 'Caso Trabalhista' })
    expect(result.success).toBe(true)
  })

  it('valida numero de processo no formato CNJ', () => {
    const result = validateInput(caseSchema, {
      titulo: 'Caso Civil',
      numero_processo: '0000001-23.2024.8.13.0001',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita numero de processo invalido', () => {
    const result = validateInput(caseSchema, {
      titulo: 'Caso Civil',
      numero_processo: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita valor de causa negativo', () => {
    const result = validateInput(caseSchema, {
      titulo: 'Caso Civil',
      valor_causa: -100,
    })
    expect(result.success).toBe(false)
  })
})

// ─── documentSchema ──────────────────────────────────────────

describe('documentSchema', () => {
  it('valida documento com dados minimos', () => {
    const result = validateInput(documentSchema, { titulo: 'Contrato de Prestação' })
    expect(result.success).toBe(true)
  })

  it('valida tipo de documento', () => {
    const result = validateInput(documentSchema, {
      titulo: 'Petição Inicial',
      tipo: 'peticao',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita arquivo muito grande (> 50MB)', () => {
    const result = validateInput(documentSchema, {
      titulo: 'Arquivo Grande',
      arquivo_tamanho: 51 * 1024 * 1024,
    })
    expect(result.success).toBe(false)
  })

  it('rejeita arquivo vazio', () => {
    const result = validateInput(documentSchema, {
      titulo: 'Arquivo Vazio',
      arquivo_tamanho: 0,
    })
    expect(result.success).toBe(false)
  })
})

// ─── organizationSchema ──────────────────────────────────────

describe('organizationSchema', () => {
  it('valida organizacao com dados minimos', () => {
    const result = validateInput(organizationSchema, { name: 'Escritorio ABC' })
    expect(result.success).toBe(true)
  })

  it('valida slug correto', () => {
    const result = validateInput(organizationSchema, {
      name: 'Escritorio ABC',
      slug: 'escritorio-abc',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita nome com acentos (regex nao suporta)', () => {
    const result = validateInput(organizationSchema, { name: 'Escritório ABC' })
    expect(result.success).toBe(false)
  })

  it('rejeita slug com maiusculas', () => {
    const result = validateInput(organizationSchema, {
      name: 'Escritorio ABC',
      slug: 'Escritorio-ABC',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita nome muito curto', () => {
    const result = validateInput(organizationSchema, { name: 'AB' })
    expect(result.success).toBe(false)
  })
})

// ─── userSchema ───────────────────────────────────────────────

describe('userSchema', () => {
  it('valida usuario completo', () => {
    const result = validateInput(userSchema, {
      email: 'admin@org.com',
      full_name: 'Admin User',
      role: 'org_admin',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita role invalida', () => {
    const result = validateInput(userSchema, {
      email: 'user@org.com',
      full_name: 'User Test',
      role: 'super_admin' as any,
    })
    expect(result.success).toBe(false)
  })
})

// ─── validateInput helper ─────────────────────────────────────

describe('validateInput', () => {
  it('retorna data quando sucesso', () => {
    const result = validateInput(loginSchema, {
      email: 'test@test.com',
      password: '12345678',
    })
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.errors).toBeUndefined()
  })

  it('retorna errors quando falha', () => {
    const result = validateInput(loginSchema, {
      email: '',
      password: '',
    })
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors!.length).toBeGreaterThan(0)
  })

  it('trata erro desconhecido', () => {
    // Schema que lança erro nao-Zod
    const badSchema = {
      parse: () => { throw new Error('unexpected') },
    } as any
    const result = validateInput(badSchema, {})
    expect(result.success).toBe(false)
    expect(result.errors).toContain('Erro de validação desconhecido')
  })
})
