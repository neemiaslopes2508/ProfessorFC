export function assertNonEmptyString(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} deve ser um texto não vazio.`)
  }
}

export function assertIntegerRange(
  value: number,
  min: number,
  max: number,
  field: string,
): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${field} deve ser um inteiro entre ${min} e ${max}.`)
  }
}

export function assertOneOf<T extends string | number>(
  value: T,
  allowed: readonly T[],
  field: string,
): void {
  if (!allowed.includes(value)) {
    throw new Error(`${field} possui um valor inválido.`)
  }
}

export function assertUnique(values: readonly string[], field: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${field} não pode conter IDs repetidos.`)
  }
}

/** Data civil ISO YYYY-MM-DD; não depende do fuso ou relógio do ambiente. */
export function assertDate(value: string, field: string): void {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} deve usar YYYY-MM-DD.`)
  }
  const date = new Date(`${value}T00:00:00.000Z`)
  if (
    value.startsWith('0000-') ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`${field} deve ser uma data válida.`)
  }
}
