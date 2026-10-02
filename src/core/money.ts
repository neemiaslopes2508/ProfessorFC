declare const centsBrand: unique symbol

type Cents = number & { readonly [centsBrand]: 'Cents' }

/** Valor assinado em centavos inteiros seguros, sem moeda/formatação visual. */
export interface Money {
  readonly cents: Cents
}

export function validateMoney(value: Money): void {
  if (!value || !Number.isSafeInteger(value.cents)) {
    throw new Error('Dinheiro deve conter centavos inteiros seguros.')
  }
}

export function createMoneyFromCents(cents: number): Money {
  if (!Number.isSafeInteger(cents)) {
    throw new Error('Dinheiro deve conter centavos inteiros seguros.')
  }
  return Object.freeze({ cents: cents as Cents })
}

export function addMoney(left: Money, right: Money): Money {
  validateMoney(left)
  validateMoney(right)
  return createMoneyFromCents(left.cents + right.cents)
}

export function subtractMoney(left: Money, right: Money): Money {
  validateMoney(left)
  validateMoney(right)
  return createMoneyFromCents(left.cents - right.cents)
}

export function assertNonNegativeMoney(value: Money, field: string): void {
  validateMoney(value)
  if (value.cents < 0) {
    throw new Error(`${field} não pode ser negativo.`)
  }
}
