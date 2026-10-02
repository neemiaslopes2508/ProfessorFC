import { describe, expect, it } from 'vitest'
import { createId } from '../../core/ids'
import { createMoneyFromCents } from '../../core/money'
import { createClub } from './club'
import type { Club } from './club'
import { createClubFinances } from './finances'
import { CLUB_PROFILE_FIELDS, createClubProfile } from './profile'
import type { ClubProfile } from './profile'

function profile(): ClubProfile {
  return { youthPreference: 50, transferAggressiveness: 50, sellingPreference: 50, financialRisk: 50, experiencedPlayerPreference: 50 }
}
function club(): Club {
  return {
    id: createId('Club', 'test-club'), name: 'Clube de teste', shortName: 'CT', country: 'BR',
    reputation: 50, playerIds: [createId('Player', 'test-player')], profile: profile(),
    finances: { cashBalance: createMoneyFromCents(100), transferBudget: createMoneyFromCents(50), wageBudget: createMoneyFromCents(50) },
  }
}

describe('Club e ClubProfile', () => {
  it('representa elenco e finanças sem força fixa', () => {
    expect(createClub(club()).playerIds).toHaveLength(1)
    expect(createClub(club())).not.toHaveProperty('strength')
  })
  it('aceita opcionais de estádio e treinador', () => {
    expect(createClub({ ...club(), stadiumId: 'stadium-test', coachId: createId('Coach', 'coach-test') }).stadiumId).toBe('stadium-test')
  })
  it.each(CLUB_PROFILE_FIELDS)('valida tendência independente %s', field => {
    expect(createClubProfile({ ...profile(), [field]: 0 })[field]).toBe(0)
    expect(createClubProfile({ ...profile(), [field]: 100 })[field]).toBe(100)
    for (const value of [-1, 101, 0.5, NaN]) {
      expect(() => createClubProfile({ ...profile(), [field]: value })).toThrow()
    }
  })
  it('rejeita IDs de jogadores duplicados no elenco', () => {
    const id = createId('Player', 'duplicate')
    expect(() => createClub({ ...club(), playerIds: [id, id] })).toThrow()
  })
  it('valida reputação', () => {
    expect(() => createClub({ ...club(), reputation: 101 })).toThrow()
  })
  it('copia o elenco recebido', () => {
    const playerIds = [createId('Player', 'p-1')]
    const value = createClub({ ...club(), playerIds })
    playerIds.push(createId('Player', 'p-2'))
    expect(value.playerIds).toHaveLength(1)
  })
})

describe('ClubFinances', () => {
  it('permite saldo negativo, sem exigir orçamento menor que saldo', () => {
    const value = createClubFinances({ ...club().finances, cashBalance: createMoneyFromCents(-100) })
    expect(value.cashBalance.cents).toBe(-100)
  })
  it.each(['transferBudget', 'wageBudget'] as const)('rejeita %s negativo', field => {
    expect(() => createClubFinances({ ...club().finances, [field]: createMoneyFromCents(-1) })).toThrow()
  })
})
