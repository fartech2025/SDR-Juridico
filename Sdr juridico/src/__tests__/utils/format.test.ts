import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatPhone,
} from '@/utils/format'

// ─── formatCurrency ───────────────────────────────────────────

describe('formatCurrency', () => {
  it('formata valor em BRL', () => {
    const result = formatCurrency(1234.56)
    // pt-BR BRL: R$ 1.234,56
    expect(result).toContain('1.234')
    expect(result).toContain('56')
    expect(result).toContain('R$')
  })

  it('formata zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
    expect(result).toContain('R$')
  })

  it('formata valor negativo', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500')
  })
})

// ─── formatNumber ─────────────────────────────────────────────

describe('formatNumber', () => {
  it('formata numero com separador de milhar', () => {
    const result = formatNumber(1234567)
    expect(result).toContain('1.234.567')
  })

  it('formata numero pequeno', () => {
    expect(formatNumber(42)).toBe('42')
  })
})

// ─── formatDate ───────────────────────────────────────────────

describe('formatDate', () => {
  it('formata Date object', () => {
    const date = new Date('2026-01-15T10:00:00Z')
    const result = formatDate(date)
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })

  it('formata string ISO', () => {
    const result = formatDate('2026-06-20T14:30:00Z')
    expect(result).toContain('20')
    expect(result).toContain('2026')
  })
})

// ─── formatDateTime ───────────────────────────────────────────

describe('formatDateTime', () => {
  it('inclui hora e minuto', () => {
    const date = new Date('2026-01-15T14:30:00Z')
    const result = formatDateTime(date)
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })

  it('formata string ISO com horario', () => {
    const result = formatDateTime('2026-03-10T09:15:00Z')
    expect(result).toContain('10')
    expect(result).toContain('2026')
  })
})

// ─── formatPhone ──────────────────────────────────────────────

describe('formatPhone', () => {
  it('formata celular (11 digitos)', () => {
    expect(formatPhone('11999887766')).toBe('(11) 99988-7766')
  })

  it('formata fixo (10 digitos)', () => {
    expect(formatPhone('1133445566')).toBe('(11) 3344-5566')
  })

  it('remove caracteres nao numericos', () => {
    expect(formatPhone('(11) 99988-7766')).toBe('(11) 99988-7766')
    expect(formatPhone('+55 11 99988-7766')).toBe('(11) 99988-7766')
  })

  it('retorna valor original se muito curto', () => {
    expect(formatPhone('123')).toBe('123')
  })
})
