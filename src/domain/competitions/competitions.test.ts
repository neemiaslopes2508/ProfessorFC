import { describe, expect, it } from 'vitest'
import { createId } from '../../core/ids'
import { COMPETITION_TYPES, createCompetition } from './competition'
import type { Competition } from './competition'
import { COMPETITION_SEASON_STATUSES, createCompetitionSeason } from './season'
import type { CompetitionSeason } from './season'

function competition(): Competition {
  return { id: createId('Competition', 'test-cup'), name: 'Competição de teste', country: 'XX', type: 'LEAGUE', format: { legs: 2 } }
}
function season(): CompetitionSeason {
  return { id: createId('CompetitionSeason', 'test-edition'), competitionId: competition().id, year: 2026, participantClubIds: [createId('Club', 'participant')], status: 'SCHEDULED' }
}

describe('Competition e CompetitionSeason', () => {
  it.each(COMPETITION_TYPES)('representa tipo %s sem regras específicas de país', type => {
    expect(createCompetition({ ...competition(), type }).type).toBe(type)
  })
  it('separa definição de edição', () => {
    const definition = createCompetition(competition())
    const edition = createCompetitionSeason(season())
    expect(edition.competitionId).toBe(definition.id)
    expect(definition).not.toHaveProperty('year')
    expect(edition.year).toBe(2026)
  })
  it.each(COMPETITION_SEASON_STATUSES)('representa edição %s', status => {
    expect(createCompetitionSeason({ ...season(), status }).status).toBe(status)
  })
  it('rejeita participantes repetidos', () => {
    const input = season()
    expect(() => createCompetitionSeason({ ...input, participantClubIds: [input.participantClubIds[0], input.participantClubIds[0]] })).toThrow()
  })
  it('aceita campeão participante', () => {
    const input = season()
    expect(createCompetitionSeason({ ...input, status: 'FINISHED', championId: input.participantClubIds[0] }).championId).toBe(input.participantClubIds[0])
  })
  it('rejeita campeão fora dos participantes', () => {
    expect(() => createCompetitionSeason({ ...season(), championId: createId('Club', 'outsider') })).toThrow()
  })
  it('rejeita formato e ano inválidos', () => {
    expect(() => createCompetition({ ...competition(), format: { legs: 2, groupCount: 0 } })).toThrow()
    expect(() => createCompetitionSeason({ ...season(), year: 2026.5 })).toThrow()
  })
})
