import { assertIntegerRange } from './validation'

export interface RandomSource {
  /** Valor finito no intervalo [0, 1). */
  next(): number
}

/** PRNG simples de 32 bits para simulação reproduzível, não para criptografia. */
export function createSeededRandomSource(seed: number): RandomSource {
  assertIntegerRange(seed, 0, 0xffffffff, 'Seed')
  let state = seed >>> 0
  return {
    next(): number {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0
      return state / 0x100000000
    },
  }
}

export function drawRandom(source: RandomSource): number {
  const value = source.next()
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error('RandomSource deve retornar um valor finito em [0, 1).')
  }
  return value
}
