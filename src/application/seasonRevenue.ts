import type { PrototypeSession } from './prototypeSession'
import { addGameDays } from '../core/date'
import { assertDate, assertIntegerRange } from '../core/validation'
import { addMoney, createMoneyFromCents, assertNonNegativeMoney } from '../core/money'
import { createClub } from '../domain/clubs'
import { matchStadiumAttendance } from './stadiumManagement'
import { getLeagueStandings } from '../competitions'
import { paymentDates } from './contractLifecycle'
import type { FinanceTransaction } from '../finance/types'

function credit(session: PrototypeSession, transaction: FinanceTransaction): PrototypeSession {
  if (session.financialTransactions.some(item => item.id === transaction.id)) return session
  assertNonNegativeMoney(transaction.amount, 'Receita')
  if (!session.teams.some(team => team.club.id === transaction.clubId)) throw new Error('Clube da receita inexistente.')
  return Object.freeze({ ...session, teams: Object.freeze(session.teams.map(team => team.club.id === transaction.clubId ? Object.freeze({ ...team, club: createClub({ ...team.club, finances: { ...team.club.finances, cashBalance: addMoney(team.club.finances.cashBalance, transaction.amount) } }) }) : team)), financialTransactions: Object.freeze([...session.financialTransactions, Object.freeze(transaction)]) })
}
export function nextSponsorshipDate(session: PrototypeSession) {
  const date = session.game.calendar.currentDate
  const payments = session.seasonRevenue.sponsors.length ? paymentDates(addGameDays(date, 1), addGameDays(date, 62), session.seasonRevenue.sponsorshipDay) : []
  const expiries = session.commercial.contracts.filter(contract => contract.status === 'ACTIVE' && contract.endDate > date).map(contract => contract.endDate)
  return [...payments, ...expiries].sort()[0]
}
/** Credita o intervalo financeiro sem mover o GameCalendar. */
export function processSponsorship(session: PrototypeSession, target = session.game.calendar.currentDate): PrototypeSession {
  assertDate(target, 'Data de patrocínio')
  if (target < session.game.calendar.currentDate) throw new Error('Patrocínio não pode regredir no tempo.')
  let next = session
  for (const date of paymentDates(session.game.calendar.currentDate, target, session.seasonRevenue.sponsorshipDay)) {
    for (const sponsor of session.seasonRevenue.sponsors) {
      if (sponsor.clubId === session.game.humanClubId) continue
      next = credit(next, { id: `sponsor-${sponsor.clubId}-${date.slice(0, 7)}`, type: 'SPONSORSHIP', clubId: sponsor.clubId, date, month: date.slice(0, 7), amount: createMoneyFromCents(sponsor.monthlyCents), description: 'Patrocínio mensal' })
    }
  }
  return next
}
/** Somente resultados confirmados geram bilheteria; prêmio exige edição concluída. */
export function settleCompetitionRevenue(session: PrototypeSession): PrototypeSession {
  let next = session
  for (const { league, schedule } of session.game.competitions) {
    for (const result of league.results) {
      if (next.financialTransactions.some(item => item.id === `tickets-${result.matchId}`)) continue
      const fixture = league.fixtures.find(fixture => fixture.id === result.matchId)
      const scheduled = schedule.matches.find(match => match.matchId === result.matchId)
      if (!fixture || !scheduled) throw new Error('Receita de partida sem fixture ou data.')
      if (scheduled.date > session.game.calendar.currentDate) continue
      const home = next.teams.find(team => team.club.id === fixture.homeClubId)!
      const away = next.teams.find(team => team.club.id === fixture.awayClubId)!
      if (!home || !away) throw new Error('Clubes da bilheteria inexistentes.')
      const atmosphere = matchStadiumAttendance(next, fixture.id, true)
      assertIntegerRange(atmosphere.attendance, 0, atmosphere.capacity, 'Público da partida')
      next = credit(next, { id: `tickets-${fixture.id}`, type: 'MATCH_TICKETS', clubId: fixture.homeClubId, date: scheduled.date, matchId: fixture.id, competitionSeasonId: league.season.id, attendance: atmosphere.attendance, stadiumAttendance: atmosphere, amount: createMoneyFromCents(atmosphere.revenueCents), description: `Bilheteria — ${home.club.name} x ${away.club.name}` })
    }
    const rules = session.seasonRevenue.competitions.find(item => item.competitionId === league.season.competitionId)
    if (!rules || league.season.status !== 'FINISHED' || league.results.length !== league.fixtures.length || schedule.matches.some(match => match.date > session.game.calendar.currentDate)) continue
    for (const standing of getLeagueStandings(league)) {
      const cents = rules.prizeByPositionCents[standing.position - 1] ?? 0
      if (!cents) continue
      const date = schedule.matches.map(match => match.date).sort().at(-1)!
      next = credit(next, { id: `prize-${league.season.id}-${standing.clubId}`, type: 'COMPETITION_PRIZE', clubId: standing.clubId, date, competitionSeasonId: league.season.id, position: standing.position, amount: createMoneyFromCents(cents), description: `Premiação — ${standing.position}º lugar ${rules.name}` })
    }
  }
  return next
}
