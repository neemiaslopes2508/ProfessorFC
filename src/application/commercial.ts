import { addGameDays, differenceInGameDays } from '../core/date'
import { createMoneyFromCents, addMoney } from '../core/money'
import { createSeededRandomSource, deriveSeed, drawRandom } from '../core/random'
import type { ClubId, CompetitionSeasonId } from '../core/ids'
import { financialHealth } from './financialHealth'
import { getLeagueStandings } from '../competitions'
import type { PrototypeSession } from './prototypeSession'
import { createClub } from '../domain/clubs'
import { paymentDates } from './contractLifecycle'
import { SPONSORSHIP_CONFIG, DEVELOPMENT_SPONSORS } from '../finance/sponsorship'
import type { CommercialState, SponsorObjective, SponsorOffer, SponsorshipContract } from '../finance/sponsorship'
import type { FinanceTransaction } from '../finance/types'

function currentLeague(session: Pick<PrototypeSession, 'game'>) {
  const entry = session.game.competitions[0]
  if (!entry) throw new Error('Sessão sem temporada para gerar propostas comerciais.')
  return entry
}

function makeOffers(session: Pick<PrototypeSession, 'careerSeed' | 'game'>, commercial: CommercialState, year: number): CommercialState {
  const clubId = session.game.humanClubId
  if (!clubId || commercial.contracts.some(contract => contract.clubId === clubId && contract.status === 'ACTIVE' && contract.endDate > session.game.calendar.currentDate)) return commercial
  if (commercial.offers.some(offer => offer.clubId === clubId && offer.seasonYear === year)) return commercial
  const entry = currentLeague(session)
  const { seasonStartDate, seasonEndDate } = entry.schedule
  const durationDays = differenceInGameDays(seasonStartDate, seasonEndDate) + 1
  const random = createSeededRandomSource(deriveSeed(session.careerSeed, `commercial:${clubId}:${year}`))
  const pool = [...commercial.sponsors]
  const offers: SponsorOffer[] = []
  for (let index = 0; index < Math.min(SPONSORSHIP_CONFIG.offerCount, pool.length); index++) {
    const sponsorIndex = Math.floor(drawRandom(random) * pool.length)
    const sponsor = pool.splice(sponsorIndex, 1)[0]
    const durationSeasons = ([1, 2, 3] as const)[Math.floor(drawRandom(random) * 3)]
    const objectiveBonusCents = SPONSORSHIP_CONFIG.objectiveBonusOptionsCents[Math.floor(drawRandom(random) * SPONSORSHIP_CONFIG.objectiveBonusOptionsCents.length)]
    const objective: SponsorObjective = drawRandom(random) < 0.5
      ? { type: 'FINISH_POSITION', target: 2 + Math.floor(drawRandom(random) * 3), bonusCents: objectiveBonusCents }
      : { type: 'WIN_COMPETITION', competitionSeasonId: entry.league.season.id, bonusCents: objectiveBonusCents }
    const endDate = addGameDays(seasonStartDate, durationDays * durationSeasons)
    offers.push(Object.freeze({
      id: `sponsor-offer-${clubId}-${year}-${index + 1}`, sponsorId: sponsor.id, clubId, seasonYear: year,
      startDate: seasonStartDate, endDate, durationSeasons,
      signingBonusCents: SPONSORSHIP_CONFIG.signingBonusOptionsCents[Math.floor(drawRandom(random) * SPONSORSHIP_CONFIG.signingBonusOptionsCents.length)],
      monthlyPaymentCents: SPONSORSHIP_CONFIG.monthlyPaymentBaseCents + sponsor.weight * SPONSORSHIP_CONFIG.monthlyPaymentStepCents + Math.floor(drawRandom(random) * SPONSORSHIP_CONFIG.monthlyPaymentStepCents),
      objective, status: 'OFFERED',
    }))
  }
  return Object.freeze({ ...commercial,
    offers: Object.freeze([...commercial.offers.map(offer => offer.clubId === clubId && offer.status === 'OFFERED' && offer.seasonYear !== year ? Object.freeze({ ...offer, status: 'EXPIRED' as const }) : offer), ...offers]),
  })
}

export function createCommercialState(session: Pick<PrototypeSession, 'careerSeed' | 'game'>): CommercialState {
  const empty: CommercialState = Object.freeze({ sponsors: DEVELOPMENT_SPONSORS, offers: Object.freeze([]), contracts: Object.freeze([]) })
  return makeOffers(session, empty, currentLeague(session).league.season.year)
}

function credit(session: PrototypeSession, transaction: FinanceTransaction): PrototypeSession {
  if (session.financialTransactions.some(item => item.id === transaction.id)) return session
  const team = session.teams.find(item => item.club.id === transaction.clubId)
  if (!team) throw new Error('Clube da receita comercial inexistente.')
  return Object.freeze({ ...session,
    teams: Object.freeze(session.teams.map(item => item.club.id === transaction.clubId ? Object.freeze({ ...item, club: createClub({ ...item.club, finances: { ...item.club.finances, cashBalance: addMoney(item.club.finances.cashBalance, transaction.amount) } }) }) : item)),
    financialTransactions: Object.freeze([...session.financialTransactions, Object.freeze(transaction)]),
  })
}

export function acceptSponsorOffer(session: PrototypeSession, offerId: string): PrototypeSession {
  if (session.liveMatch || session.pendingMatch) throw new Error('Finalize a partida antes de negociar patrocínio.')
  const offer = session.commercial.offers.find(item => item.id === offerId)
  if (!offer || offer.status !== 'OFFERED') throw new Error('Esta proposta não está mais disponível.')
  if (offer.clubId !== session.game.humanClubId) throw new Error('Proposta pertence a outro clube.')
  if (session.game.calendar.currentDate >= offer.endDate) throw new Error('Esta proposta expirou.')
  if (session.commercial.contracts.some(contract => contract.clubId === offer.clubId && contract.status === 'ACTIVE' && contract.endDate > session.game.calendar.currentDate)) throw new Error('O clube já possui patrocinador principal ativo.')
  const sponsor = session.commercial.sponsors.find(item => item.id === offer.sponsorId)
  if (!sponsor) throw new Error('Patrocinador da proposta não existe.')
  const contractId = `sponsor-contract-${offer.id}`
  const contract: SponsorshipContract = Object.freeze({ id: contractId, sponsorId: sponsor.id, clubId: offer.clubId, startDate: offer.startDate,
    endDate: offer.endDate, durationSeasons: offer.durationSeasons, signingBonusCents: offer.signingBonusCents,
    monthlyPaymentCents: offer.monthlyPaymentCents, objective: offer.objective, objectiveStatus: 'PENDING', status: 'ACTIVE' })
  let next: PrototypeSession = Object.freeze({ ...session, commercial: Object.freeze({ ...session.commercial,
    offers: Object.freeze(session.commercial.offers.map(item => item.clubId === offer.clubId && item.status === 'OFFERED' ? Object.freeze({ ...item, status: item.id === offer.id ? 'ACCEPTED' as const : 'REJECTED' as const }) : item)),
    contracts: Object.freeze([...session.commercial.contracts, contract]),
  }) })
  if (offer.signingBonusCents > 0) next = credit(next, { id: `sponsor-signing-${contract.id}`, type: 'SPONSOR_SIGNING_BONUS', clubId: offer.clubId, date: session.game.calendar.currentDate, amount: createMoneyFromCents(offer.signingBonusCents), description: `Bônus de assinatura — ${sponsor.name}` })
  return next
}

export function rejectSponsorOffer(session: PrototypeSession, offerId: string): PrototypeSession {
  const offer = session.commercial.offers.find(item => item.id === offerId)
  if (!offer || offer.status !== 'OFFERED') throw new Error('Esta proposta não está mais disponível.')
  if (offer.clubId !== session.game.humanClubId) throw new Error('Proposta pertence a outro clube.')
  return Object.freeze({ ...session, commercial: Object.freeze({ ...session.commercial, offers: Object.freeze(session.commercial.offers.map(item => item.id === offerId ? Object.freeze({ ...item, status: 'REJECTED' as const }) : item)) }) })
}

/** Processa mensalidades e expiração no mesmo intervalo temporal do GameCalendar. */
export function processCommercialDate(session: PrototypeSession, target = session.game.calendar.currentDate): PrototypeSession {
  if (target < session.game.calendar.currentDate) throw new Error('Comercial não pode regredir no tempo.')
  let next = session
  for (const original of session.commercial.contracts) {
    const dueDates = paymentDates(original.startDate > session.game.calendar.currentDate ? original.startDate : session.game.calendar.currentDate, target, SPONSORSHIP_CONFIG.monthlyPaymentDay)
    for (const date of dueDates) {
      if (date >= original.endDate || original.status !== 'ACTIVE') continue
      next = credit(next, { id: `sponsor-payment-${original.id}-${date.slice(0, 7)}`, type: 'SPONSORSHIP', clubId: original.clubId, date, month: date.slice(0, 7), amount: createMoneyFromCents(original.monthlyPaymentCents), description: `Patrocínio mensal — ${next.commercial.sponsors.find(item => item.id === original.sponsorId)?.name ?? original.sponsorId}` })
    }
  }
  const contracts = next.commercial.contracts.map(contract => contract.status === 'ACTIVE' && contract.endDate <= target ? Object.freeze({ ...contract, status: 'FINISHED' as const }) : contract)
  if (contracts.some((contract, index) => contract !== next.commercial.contracts[index])) next = Object.freeze({ ...next, commercial: Object.freeze({ ...next.commercial, contracts: Object.freeze(contracts) }) })
  for (const contract of next.commercial.contracts) {
    if (contract.status !== 'FINISHED' || contract.endDate > target || contract.objectiveStatus !== 'PENDING' || contract.objective.type !== 'FINANCIAL_HEALTH') continue
    const achieved = ['EXCELLENT', 'HEALTHY'].includes(financialHealth(next, contract.clubId).status)
    if (achieved && contract.objective.bonusCents > 0) next = credit(next, { id: `sponsor-objective-${contract.id}-financial-period`, type: 'SPONSOR_OBJECTIVE_BONUS', clubId: contract.clubId, date: contract.endDate, amount: createMoneyFromCents(contract.objective.bonusCents), description: `Bônus por saúde financeira — ${next.commercial.sponsors.find(item => item.id === contract.sponsorId)?.name ?? contract.sponsorId}` })
    next = Object.freeze({ ...next, commercial: Object.freeze({ ...next.commercial, contracts: Object.freeze(next.commercial.contracts.map(item => item.id === contract.id ? Object.freeze({ ...item, objectiveStatus: achieved ? 'ACHIEVED' as const : 'MISSED' as const }) : item)) }) })
  }
  return next
}

export function evaluateCommercialSeason(session: PrototypeSession, seasonId: CompetitionSeasonId): PrototypeSession {
  const entry = session.game.competitions.find(item => item.league.season.id === seasonId)
  if (!entry || entry.league.season.status !== 'FINISHED') return session
  const standings = getLeagueStandings(entry.league)
  let next = session
  const contracts = session.commercial.contracts.map(contract => {
    if (contract.clubId !== session.game.humanClubId || contract.objectiveStatus !== 'PENDING' || contract.objective.type === 'FINANCIAL_HEALTH') return contract
    const objective = contract.objective
    const achieved = objective.type === 'FINISH_POSITION'
      ? (standings.find(row => row.clubId === contract.clubId)?.position ?? Infinity) <= objective.target
      : objective.type === 'WIN_COMPETITION'
        ? objective.competitionSeasonId === seasonId && entry.league.season.championId === contract.clubId
        : ['EXCELLENT', 'HEALTHY'].includes(financialHealth(next, contract.clubId).status)
    if (achieved && objective.bonusCents > 0) next = credit(next, { id: `sponsor-objective-${contract.id}-${seasonId}`, type: 'SPONSOR_OBJECTIVE_BONUS', clubId: contract.clubId, date: entry.schedule.seasonEndDate, competitionSeasonId: seasonId, amount: createMoneyFromCents(objective.bonusCents), description: `Bônus por objetivo — ${next.commercial.sponsors.find(item => item.id === contract.sponsorId)?.name ?? contract.sponsorId}` })
    return Object.freeze({ ...contract, objectiveStatus: achieved ? 'ACHIEVED' as const : 'MISSED' as const })
  })
  if (contracts.some((contract, index) => contract !== next.commercial.contracts[index])) next = Object.freeze({ ...next, commercial: Object.freeze({ ...next.commercial, contracts: Object.freeze(contracts) }) })
  return next
}

export function refreshCommercialOffers(session: PrototypeSession): PrototypeSession {
  return Object.freeze({ ...session, commercial: makeOffers(session, session.commercial, currentLeague(session).league.season.year) })
}

export function activeSponsorship(session: PrototypeSession, clubId: ClubId = session.game.humanClubId!) {
  return session.commercial.contracts.find(contract => contract.clubId === clubId && contract.status === 'ACTIVE' && contract.startDate <= session.game.calendar.currentDate && session.game.calendar.currentDate < contract.endDate)
}
