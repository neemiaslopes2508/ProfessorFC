import { describe, expect, it } from 'vitest'
import { createId } from '../../core/ids'
import { createCoach } from './coach'
import type { Coach } from './coach'

function coach(): Coach {
  return { id: createId('Coach', 'coach-test'), name: 'Treinador de teste', nationality: 'BR', reputation: 0, experience: 0, humanControlled: true }
}

describe('Coach', () => {
  it('representa treinador humano sem clube', () => {
    expect(createCoach(coach()).currentClubId).toBeUndefined()
  })
  it('usa o mesmo modelo para treinador da IA, sem implementar decisões', () => {
    expect(createCoach({ ...coach(), humanControlled: false, currentClubId: createId('Club', 'club-test') }).humanControlled).toBe(false)
  })
  it.each([-1, 101, NaN, 1.5])('rejeita reputação %s', reputation => {
    expect(() => createCoach({ ...coach(), reputation })).toThrow()
  })
  it.each([-1, 0.5, Infinity])('rejeita experiência %s', experience => {
    expect(() => createCoach({ ...coach(), experience })).toThrow()
  })
})
