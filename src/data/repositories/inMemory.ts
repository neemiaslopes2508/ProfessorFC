import { validateId } from '../../core/ids'

export interface InMemoryRepository<T extends { readonly id: string }> {
  getById(id: T['id']): T | undefined
  getAll(): readonly T[]
}

/** Snapshot de leitura: nenhuma referência mutável à base é exposta. */
export function createInMemoryRepository<T extends { readonly id: string }>(
  entities: readonly T[],
): InMemoryRepository<T> {
  const entries = new Map<T['id'], T>()
  for (const entity of entities) {
    validateId(entity.id)
    if (entries.has(entity.id)) throw new Error(`ID duplicado no repositório: "${entity.id}".`)
    entries.set(entity.id, structuredClone(entity))
  }
  return Object.freeze({
    getById(id: T['id']): T | undefined {
      const entity = entries.get(id)
      return entity === undefined ? undefined : structuredClone(entity)
    },
    getAll(): readonly T[] {
      return structuredClone([...entries.values()])
    },
  })
}
