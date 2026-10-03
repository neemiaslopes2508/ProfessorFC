import { expect, it } from 'vitest'
import { advancePrototype, continuePrototypeMatch, getDevelopmentClubs, humanTeam, playPrototypeMatch, startPrototype } from './prototypeSession'
import type { PrototypeSession } from './prototypeSession'
import { nextSponsorshipDate, processSponsorship, settleCompetitionRevenue } from './seasonRevenue'
import { matchDayOverview } from './matchDayOverview'
import { GameCalendar } from '../domain/calendar'
import { getLeagueStandings } from '../competitions'

it('confirma bilheteria do mandante uma única vez, usando o público do Match Day e conciliando o caixa', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const ready = advancePrototype(advancePrototype(advancePrototype(original)))
  const pending = playPrototypeMatch(ready)
  const id = pending.pendingMatch!.matchId
  const view = matchDayOverview(pending, id)
  expect(view.home.team.club.id).toBe(humanTeam(ready).club.id)
  expect(pending.financialTransactions.some(item => item.matchId === id)).toBe(false)
  const confirmed = continuePrototypeMatch(pending)
  const tickets = confirmed.financialTransactions.filter(item => item.matchId === id)
  expect(tickets).toHaveLength(1)
  expect(tickets[0]).toMatchObject({ type: 'MATCH_TICKETS', clubId: view.home.team.club.id, attendance: view.atmosphere.attendance, amount: { cents: view.atmosphere.revenueCents } })
  expect(humanTeam(confirmed).club.finances.cashBalance.cents).toBe(humanTeam(ready).club.finances.cashBalance.cents + tickets[0].amount.cents)
  expect(humanTeam(confirmed).club.finances.transferBudget).toEqual(humanTeam(ready).club.finances.transferBudget)
  expect(settleCompetitionRevenue(confirmed)).toBe(confirmed)
  expect(continuePrototypeMatch(confirmed)).toBe(confirmed)
})

it('paga patrocínio mensal e prêmio por colocação uma única vez, com histórico conciliado', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const custom = { ...original, seasonRevenue: { ...original.seasonRevenue, sponsorshipDay: 3 } }
  expect(nextSponsorshipDate(custom)).toBe('2026-04-03')
  expect(processSponsorship(custom, '2026-04-02')).toBe(custom)
  const sponsored = processSponsorship(original, '2026-04-01')
  expect(sponsored.financialTransactions).toHaveLength(5)
  expect(processSponsorship(sponsored, '2026-04-01')).toBe(sponsored)
  for (const team of sponsored.teams) {
    const before = original.teams.find(item => item.club.id === team.club.id)!
    const income = team.club.id === original.game.humanClubId ? 0 : original.seasonRevenue.sponsors.find(item => item.clubId === team.club.id)!.monthlyCents
    expect(team.club.finances.cashBalance.cents).toBe(before.club.finances.cashBalance.cents + income)
  }
  // Snapshot encerrado de teste: não executa uma temporada nem simula 30 partidas.
  const entry = sponsored.game.competitions[0]
  const count = { home: 0, away: 0 }
  const statistics = { possession: { home: 50, away: 50 }, shots: count, shotsOnTarget: count, corners: count, fouls: count, yellowCards: count, redCards: count }
  const results = entry.league.fixtures.map(fixture => ({ matchId: fixture.id, score: { homeGoals: 0, awayGoals: 0 }, events: [], statistics }))
  const league = { ...entry.league, results }
  const standings = getLeagueStandings(league)
  const finished: PrototypeSession = { ...sponsored, game: { ...sponsored.game, calendar: GameCalendar.create('2026-06-07', []), competitions: [{ ...entry, league: { ...league, season: { ...league.season, status: 'FINISHED', championId: standings[0].clubId } } }] } }
  const settled = settleCompetitionRevenue(finished)
  const prizes = settled.financialTransactions.filter(item => item.type === 'COMPETITION_PRIZE')
  expect(prizes).toHaveLength(6)
  for (const row of standings) expect(prizes.find(item => item.clubId === row.clubId)).toMatchObject({ position: row.position, amount: { cents: original.seasonRevenue.competitions[0].prizeByPositionCents[row.position - 1] } })
  for (const team of settled.teams) {
    const income = settled.financialTransactions.filter(item => item.clubId === team.club.id).reduce((sum, item) => sum + item.amount.cents, 0)
    expect(team.club.finances.cashBalance.cents).toBe(original.teams.find(item => item.club.id === team.club.id)!.club.finances.cashBalance.cents + income)
  }
  expect(settleCompetitionRevenue(settled)).toBe(settled)
  expect(settleCompetitionRevenue({ ...finished, seasonRevenue: { ...finished.seasonRevenue, competitions: [] } }).financialTransactions.some(item => item.type === 'COMPETITION_PRIZE')).toBe(false)
})
