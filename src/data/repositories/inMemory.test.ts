import { describe, expect, expectTypeOf, it } from 'vitest'
import { createId } from '../../core/ids'
import type { PlayerId } from '../../core/ids'
import { createInMemoryRepository } from './inMemory'

describe('Repositórios de leitura in-memory', () => {
  it('consulta por ID tipado e lista sem compartilhar entrada ou resultados', () => {
    const id = createId('Player', 'test-player')
    const entities = [{ id, details: { label: 'original' } }]
    const repository = createInMemoryRepository(entities)
    entities[0].details.label = 'entrada alterada'
    entities.push({ id: createId('Player', 'extra'), details: { label: 'novo' } })

    const firstRead = repository.getById(id)!
    expect(firstRead.details.label).toBe('original')
    firstRead.details.label = 'consulta alterada'
    const list = repository.getAll()
    list[0].details.label = 'lista alterada'
    expect(repository.getById(id)?.details.label).toBe('original')
    expect(repository.getAll()).toHaveLength(1)
    expect(repository.getById(createId('Player', 'missing'))).toBeUndefined()
    expectTypeOf(repository.getById).parameter(0).toEqualTypeOf<PlayerId>()
  })

  it('rejeita duplicados em vez de sobrescrever uma entidade silenciosamente', () => {
    const id = createId('Club', 'duplicate')
    expect(() => createInMemoryRepository([{ id }, { id }])).toThrow(/ID duplicado/)
  })
})
