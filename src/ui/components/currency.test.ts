import { expect, it } from 'vitest'
import { formatCurrencyBRL, formatCurrencyInputBRL, parseCurrencyBRL } from './currency'

it('apresenta reais brasileiros e converte entradas em centavos sem ocultar frações', () => {
  expect(formatCurrencyBRL(50900000).replaceAll('\u00a0', ' ')).toBe('R$ 509.000')
  expect(formatCurrencyInputBRL(50900025)).toBe('509.000,25')
  expect(formatCurrencyBRL(50900025).replaceAll('\u00a0', ' ')).toBe('R$ 509.000,25')
  for (const value of ['509000,25', '509.000,25', 'R$ 509.000,25']) expect(parseCurrencyBRL(value)).toBe(50900025)
  expect(parseCurrencyBRL('509.000')).toBe(50900000)
  for (const value of ['509000.00', '50.90', '-1', '1,234', '9999999999999999999']) expect(() => parseCurrencyBRL(value)).toThrow()
})
