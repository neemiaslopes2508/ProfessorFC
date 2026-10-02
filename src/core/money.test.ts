import { describe, expect, it } from 'vitest'
import { addMoney, createMoneyFromCents, subtractMoney } from './money'
import type { Money } from './money'

describe('Money', () => {
  it.each([0, 1, -1, 100000000, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER])(
    'cria centavos inteiros seguros: %s', cents => {
      expect(createMoneyFromCents(cents).cents).toBe(cents)
    },
  )

  it('soma em centavos sem arredondamento monetário', () => {
    expect(addMoney(createMoneyFromCents(10), createMoneyFromCents(20)).cents).toBe(30)
  })

  it('subtrai e permite saldo negativo', () => {
    expect(subtractMoney(createMoneyFromCents(10), createMoneyFromCents(20)).cents).toBe(-10)
  })

  it.each([0.1, -1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, Number.MIN_SAFE_INTEGER - 1])(
    'rejeita valor inválido: %s', cents => {
      expect(() => createMoneyFromCents(cents)).toThrow(/centavos inteiros seguros/)
    },
  )

  it('rejeita overflow na soma', () => {
    expect(() => addMoney(createMoneyFromCents(Number.MAX_SAFE_INTEGER), createMoneyFromCents(1))).toThrow()
  })

  it('rejeita underflow na subtração', () => {
    expect(() => subtractMoney(createMoneyFromCents(Number.MIN_SAFE_INTEGER), createMoneyFromCents(1))).toThrow()
  })

  it('valida operandos em runtime, inclusive valores adulterados', () => {
    const invalid = { cents: NaN } as Money
    expect(() => addMoney(invalid, createMoneyFromCents(0))).toThrow()
    expect(() => subtractMoney(createMoneyFromCents(0), invalid)).toThrow()
  })

  it('não altera os operandos e conserva centavos em JSON', () => {
    const original = createMoneyFromCents(125)
    addMoney(original, createMoneyFromCents(25))
    expect(original.cents).toBe(125)
    expect(Object.isFrozen(original)).toBe(true)
    expect(JSON.parse(JSON.stringify(original))).toEqual({ cents: 125 })
  })
})
