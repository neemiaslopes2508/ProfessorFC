import { assertIntegerRange } from './validation'

export interface RandomSource {
  /** Valor finito no intervalo [0, 1). */
  next(): number
  /** Novo fluxo independente e reproduzível quando a fonte conhece sua seed. */
  fork?(domain: string): RandomSource
}

const SEED_HASH_OFFSET = 2166136261
const SEED_HASH_PRIME = 16777619

/** Deriva uma seed uint32 estável para um domínio, sem consumir a fonte original. */
export function deriveSeed(seed: number, domain: string): number {
  assertIntegerRange(seed, 0, 0xffffffff, 'Seed')
  if (!domain.trim()) throw new Error('Domínio da seed não pode ser vazio.')
  let hash = SEED_HASH_OFFSET
  for (const character of JSON.stringify([seed, domain])) {
    hash = Math.imul(hash ^ character.charCodeAt(0), SEED_HASH_PRIME) >>> 0
  }
  return hash
}

/** Hash estável para contextos sem uma seed exposta pela fonte aleatória recebida. */
export function seedFromString(value: string): number {
  if (!value.trim()) throw new Error('Texto para derivar seed não pode ser vazio.')
  let hash = SEED_HASH_OFFSET
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), SEED_HASH_PRIME) >>> 0
  return hash
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
    fork(domain: string): RandomSource {
      return createSeededRandomSource(deriveSeed(seed, domain))
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
