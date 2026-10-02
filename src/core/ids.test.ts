import { describe, expect, expectTypeOf, it } from 'vitest'
import { createId, ENTITY_KINDS } from './ids'
import type { ClubId, CoachId, CompetitionId, CompetitionSeasonId, ContractId, MatchId, PlayerId } from './ids'

describe('IDs tipados', () => {
  it.each(ENTITY_KINDS)('preserva o ID externo de %s como string serializável', kind => {
    const id = createId(kind, 'id-123')
    expect(id).toBe('id-123')
    expect(JSON.stringify(id)).toBe('"id-123"')
  })

  it.each(['', '   ', ' id', 'id '])('rejeita ID inválido %j', value => {
    expect(() => createId('Player', value)).toThrow()
  })

  it('mantém categorias distintas no sistema de tipos', () => {
    expectTypeOf(createId('Player', 'p-1')).toEqualTypeOf<PlayerId>()
    expectTypeOf<PlayerId>().not.toMatchTypeOf<ClubId>()
    expectTypeOf<PlayerId>().not.toMatchTypeOf<CoachId>()
    expectTypeOf<PlayerId>().not.toMatchTypeOf<CompetitionId>()
    expectTypeOf<PlayerId>().not.toMatchTypeOf<CompetitionSeasonId>()
    expectTypeOf<PlayerId>().not.toMatchTypeOf<MatchId>()
    expectTypeOf<PlayerId>().not.toMatchTypeOf<ContractId>()
    expectTypeOf<string>().not.toMatchTypeOf<PlayerId>()
  })
})
