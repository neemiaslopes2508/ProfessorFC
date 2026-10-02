import { createDevelopmentLeagueSetup } from './developmentLeague'
import { createSeasonSchedule, getLeagueRoundState, getLeagueStandings } from '../src/competitions'
import { createTemporalGame, advanceGameToNextEvent, playHumanMatch } from '../src/application/temporalGame'
import type { MatchDayDependencies, TemporalOperationResult } from '../src/application/temporalGame'
import { createSeededRandomSource } from '../src/core/random'

export const DEVELOPMENT_CALENDAR_CONFIG = Object.freeze({ currentDate: '2026-03-31',
  seasonStartDate: '2026-04-01', firstRoundDate: '2026-04-05', daysBetweenRounds: 7 })

export function createDevelopmentCalendarSetup(baseSeed = 2026, human = true) {
  const { league, teams } = createDevelopmentLeagueSetup()
  if (!Number.isSafeInteger(baseSeed) || baseSeed < 0 || baseSeed > 0xffffffff - league.fixtures.length + 1) throw new Error('Seed-base inválida.')
  const schedule = createSeasonSchedule(league, DEVELOPMENT_CALENDAR_CONFIG)
  const humanClubId = human ? league.season.participantClubIds[0] : undefined
  const game = createTemporalGame(DEVELOPMENT_CALENDAR_CONFIG.currentDate, [{ league, schedule }], humanClubId)
  const seeds = new Map(league.fixtures.map((fixture, index) => [fixture.id, Math.imul(baseSeed + index, 2654435761) >>> 0]))
  const dependencies: MatchDayDependencies = {
    getTeam: clubId => {
      const team = teams.get(clubId)
      if (!team) throw new Error(`Clube sem escalação explícita: ${clubId}.`)
      return team
    },
    randomForMatch: matchId => {
      const seed = seeds.get(matchId)
      if (seed === undefined) throw new Error('Partida sem seed configurada.')
      return createSeededRandomSource(seed)
    },
  }
  return { game, dependencies, teams }
}

/** O script exerce a ação humana explicitamente; o avanço da aplicação nunca a assume. */
export function simulateDevelopmentCalendar(baseSeed = 2026) {
  const setup = createDevelopmentCalendarSetup(baseSeed)
  let game = setup.game
  const trace: string[] = []
  const operations: { date: string; status: string; processed: string[]; blocked: string[]; simulated: string[] }[] = []
  function record(result: TemporalOperationResult) {
    game = result.game
    operations.push({ date: result.newDate, status: result.status, processed: result.processedEvents.map(event => event.id),
      blocked: result.blockedEvents.map(event => event.id), simulated: [...result.simulatedMatchIds] })
    for (const event of result.processedEvents) {
      if (event.type === 'SEASON_START') trace.push(`${event.date} — Temporada iniciada`)
      if (event.type === 'ROUND_START') trace.push(`${event.date} — Rodada ${event.reference.round}`)
      if (event.type === 'ROUND_END') trace.push(`${event.date} — Rodada ${event.reference.round} concluída`)
      if (event.type === 'SEASON_END') trace.push(`${event.date} — Temporada concluída`)
    }
  }
  while (game.calendar.nextPendingEvent()) {
    const result = advanceGameToNextEvent(game, setup.dependencies)
    record(result)
    if (result.simulatedMatchIds.length) trace.push(`${result.newDate} — ${result.simulatedMatchIds.length} partidas CPU processadas`)
    for (const action of result.pendingHumanActions) {
      trace.push(`${action.date} — Partida humana PENDENTE: ${action.matchId}`)
      const played = playHumanMatch(game, action.matchId, setup.dependencies)
      trace.push(`${played.newDate} — Ação explícita PLAY_MATCH concluída`)
      record(played)
    }
    if (result.status === 'BLOCKED' && !result.pendingHumanActions.length) throw new Error('Demonstração bloqueada sem ação humana resolvível.')
  }
  const { league, schedule } = game.competitions[0]
  const champion = setup.teams.get(league.season.championId!)!.club.name
  trace.push(`Campeão: ${champion}`)
  const standings = getLeagueStandings(league).map(row => ({ ...row, club: setup.teams.get(row.clubId)!.club.name }))
  const roundState = getLeagueRoundState(league, schedule, game.calendar.currentDate)
  return { baseSeed, configuration: DEVELOPMENT_CALENDAR_CONFIG, currentDate: game.calendar.currentDate,
    season: league.season, matches: league.results.length, completedRounds: roundState.rounds.filter(round => round.finished).length,
    humanClub: setup.teams.get(game.humanClubId!)!.club.name, champion, standings, trace, operations }
}
