import { expect, it } from 'vitest'
import { createMoneyFromCents } from '../core/money'
import { getDevelopmentClubs, startPrototype } from './prototypeSession'
import { acceptSponsorOffer, createCommercialState, evaluateCommercialSeason, processCommercialDate, refreshCommercialOffers, rejectSponsorOffer } from './commercial'
import type { SponsorOffer } from '../finance/sponsorship'
import type { PrototypeSession } from './prototypeSession'

it('compara ofertas determinísticas e liquida assinatura, mês, meta e expiração sem duplicar receitas', () => {
  const clubId = getDevelopmentClubs()[0].id
  const original = startPrototype(clubId, 44002)
  expect(createCommercialState(original)).toEqual(original.commercial)
  expect(original.commercial.offers).toHaveLength(3)
  const rejected = rejectSponsorOffer(original, original.commercial.offers[0].id)
  expect(refreshCommercialOffers(rejected).commercial.offers).toHaveLength(3)

  const base = original.commercial.offers[0]
  const offer: SponsorOffer = Object.freeze({ ...base, startDate: '2026-04-01', endDate: '2026-04-02', durationSeasons: 1, signingBonusCents: 3_000_000, monthlyPaymentCents: 1_250_000, objective: { type: 'WIN_COMPETITION' as const, competitionSeasonId: original.game.competitions[0].league.season.id, bonusCents: 4_000_000 } })
  const prepared = Object.freeze({ ...original, commercial: Object.freeze({ ...original.commercial, offers: Object.freeze([offer, ...original.commercial.offers.slice(1)]) }) })
  const balance = original.teams.find(team => team.club.id === clubId)!.club.finances.cashBalance.cents
  const signed = acceptSponsorOffer(prepared, offer.id)
  expect(signed.teams.find(team => team.club.id === clubId)!.club.finances.cashBalance.cents).toBe(balance + offer.signingBonusCents)
  expect(signed.commercial.offers.filter(item => item.status === 'REJECTED')).toHaveLength(2)
  expect(signed.financialTransactions.filter(item => item.type === 'SPONSOR_SIGNING_BONUS')).toHaveLength(1)

  const april = processCommercialDate(signed, '2026-04-01')
  expect(april.financialTransactions.filter(item => item.type === 'SPONSORSHIP')).toHaveLength(1)
  expect(processCommercialDate(april, '2026-04-01').financialTransactions).toHaveLength(april.financialTransactions.length)
  const expired = processCommercialDate(april, '2026-04-02')
  expect(expired.commercial.contracts[0].status).toBe('FINISHED')
  expect(processCommercialDate(expired, '2026-04-03').financialTransactions.filter(item => item.type === 'SPONSORSHIP')).toHaveLength(1)

  const season = expired.game.competitions[0].league
  const finished = Object.freeze({ ...expired, game: Object.freeze({ ...expired.game, competitions: Object.freeze([{ ...expired.game.competitions[0], league: Object.freeze({ ...season, season: Object.freeze({ ...season.season, status: 'FINISHED' as const, championId: clubId }) }) }]) }) }) as PrototypeSession
  const rewarded = evaluateCommercialSeason(finished, season.season.id)
  expect(rewarded.financialTransactions.filter(item => item.type === 'SPONSOR_OBJECTIVE_BONUS')).toHaveLength(1)
  expect(evaluateCommercialSeason(rewarded, season.season.id).financialTransactions.filter(item => item.type === 'SPONSOR_OBJECTIVE_BONUS')).toHaveLength(1)
  expect(rewarded.financialTransactions.find(item => item.type === 'SPONSOR_OBJECTIVE_BONUS')?.amount).toEqual(createMoneyFromCents(offer.objective.bonusCents))
})
