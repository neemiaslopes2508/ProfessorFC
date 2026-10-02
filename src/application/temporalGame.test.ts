import { describe, expect, it, vi } from 'vitest'
import { createId } from '../core/ids'
import { CalendarConflictError, validateMatchDateConflicts } from '../domain/calendar'
import { createLeagueSeason, createSeasonSchedule, getLeagueRoundState } from '../competitions'
import { createDevelopmentFixture } from '../data/fixtures/development'
import { createDevelopmentCalendarSetup, simulateDevelopmentCalendar } from '../../scripts/developmentCalendar'
import { advanceGameDay, advanceGameTo, advanceGameToNextEvent, createTemporalGame,
  getPendingHumanActions, getScheduledMatch, playHumanMatch, processCurrentDate } from './temporalGame'

describe('coordenação temporal', () => {
  it('agenda rodadas coerentes com intervalo configurado ou datas explícitas, sem jogos antes da temporada', () => {
    const setup = createDevelopmentCalendarSetup()
    const { league, schedule } = setup.game.competitions[0]
    expect(schedule).toMatchObject({ seasonStartDate: '2026-04-01', seasonEndDate: '2026-06-07' })
    expect(schedule.matches).toHaveLength(30)
    expect(schedule.events).toHaveLength(52)
    const explicit = createSeasonSchedule(league, { seasonStartDate: '2026-04-01', roundDates: [
      '2026-04-02', '2026-04-04', '2026-04-09', '2026-04-10', '2026-04-15', '2026-04-20', '2026-04-25', '2026-04-30', '2026-05-05', '2026-05-07',
    ].map((date, index) => ({ date, round: index + 1 })) })
    expect(explicit.seasonEndDate).toBe('2026-05-07')
    for (const config of [
      { seasonStartDate: '2026-04-01', firstRoundDate: '2026-03-31', daysBetweenRounds: 7 },
      { seasonStartDate: '2026-04-01', daysBetweenRounds: 0 },
      { seasonStartDate: '2026-04-01', roundDates: [{ round: 1, date: '2026-04-02' }] },
    ]) expect(() => createSeasonSchedule(league, config)).toThrow()
    const conflicting = { ...schedule, matches: schedule.matches.map((match, index) => ({ ...match, date: index === 0 ? '2026-04-06' : match.date })) }
    expect(() => createTemporalGame('2026-03-31', [{ league, schedule: conflicting }])).toThrow(/mesma data/)
  })

  it('detecta conflitos por clube/data entre competições e aceita agendas alternadas independentes', () => {
    const setup = createDevelopmentCalendarSetup(2026, false)
    const first = setup.game.competitions[0]
    const data = createDevelopmentFixture()
    const definition = { ...data.competitions[0], id: createId('Competition', 'second-league') }
    const edition = { ...data.competitionSeasons[0], competitionId: definition.id, id: createId('CompetitionSeason', 'second-edition') }
    const league = createLeagueSeason(definition, edition)
    const same = createSeasonSchedule(league, { seasonStartDate: '2026-04-01', firstRoundDate: '2026-04-05', daysBetweenRounds: 7 })
    const validation = validateMatchDateConflicts([...first.schedule.events, ...same.events])
    expect(validation.valid).toBe(false)
    expect(validation.errors[0]).toMatchObject({ code: 'CLUB_DATE_CONFLICT', date: '2026-04-05' })
    expect(validation.errors[0].matchIds).toHaveLength(2)
    expect(() => createTemporalGame('2026-03-31', [first, { league, schedule: same }])).toThrow(CalendarConflictError)
    const staggered = createSeasonSchedule(league, { seasonStartDate: '2026-04-01', firstRoundDate: '2026-04-06', daysBetweenRounds: 7 })
    const game = createTemporalGame('2026-03-31', [first, { league, schedule: staggered }])
    const sources = new Map(staggered.matches.map((match, index) => [match.matchId, first.league.fixtures[index].id]))
    const result = advanceGameTo(game, '2026-06-08', { ...setup.dependencies,
      randomForMatch: id => setup.dependencies.randomForMatch(sources.get(id) ?? id) })
    expect(result.simulatedMatchIds).toHaveLength(60)
    expect(result.game.competitions.map(entry => entry.league.season.status)).toEqual(['FINISHED', 'FINISHED'])
    expect(result.game.calendar.nextPendingEvent()).toBeUndefined()
  })

  it('inicia temporada sem campeão e processa somente CPU, mantendo partida humana e rodada pendentes', () => {
    const setup = createDevelopmentCalendarSetup()
    const started = advanceGameToNextEvent(setup.game, setup.dependencies)
    expect(started.newDate).toBe('2026-04-01')
    expect(started.game.competitions[0].league.season).toMatchObject({ status: 'IN_PROGRESS' })
    expect(started.game.competitions[0].league.season.championId).toBeUndefined()
    const getTeam = vi.fn(setup.dependencies.getTeam)
    const randomForMatch = vi.fn(setup.dependencies.randomForMatch)
    const day = advanceGameToNextEvent(started.game, { getTeam, randomForMatch })
    expect(day).toMatchObject({ status: 'BLOCKED', newDate: '2026-04-05' })
    expect(day.simulatedMatchIds).toHaveLength(2)
    expect(randomForMatch).toHaveBeenCalledTimes(2)
    expect(getTeam.mock.calls.every(([clubId]) => clubId !== setup.game.humanClubId)).toBe(true)
    expect(day.pendingHumanActions).toHaveLength(1)
    expect(day.blockedEvents.map(event => event.type)).toEqual(['MATCH', 'ROUND_END'])
    const action = day.pendingHumanActions[0]
    expect(getScheduledMatch(day.game, action.matchId).status).toBe('SCHEDULED')
    const round = getLeagueRoundState(day.game.competitions[0].league, day.game.competitions[0].schedule, day.newDate)
    expect(round.current).toMatchObject({ round: 1, finished: false })
    expect(round.current!.completed).toHaveLength(2)
    expect(round.current!.pending).toHaveLength(1)
    expect(round.next!.round).toBe(2)
    expect(setup.game.competitions[0].league.results).toHaveLength(0)
  })

  it('interrompe avanço distante ou de um dia na ação humana, resolvendo-a explicitamente sem repetição', () => {
    const setup = createDevelopmentCalendarSetup()
    const blocked = advanceGameTo(setup.game, '2026-12-31', setup.dependencies)
    expect(blocked.newDate).toBe('2026-04-05')
    expect(blocked.requestedDate).toBe('2026-12-31')
    const randomForMatch = vi.fn(setup.dependencies.randomForMatch)
    const dependencies = { ...setup.dependencies, randomForMatch }
    expect(advanceGameDay(blocked.game, dependencies).newDate).toBe('2026-04-05')
    expect(advanceGameToNextEvent(blocked.game, dependencies).status).toBe('BLOCKED')
    const again = processCurrentDate(blocked.game, dependencies)
    expect(again.processedEvents).toEqual([])
    expect(randomForMatch).not.toHaveBeenCalled()
    const action = blocked.pendingHumanActions[0]
    const played = playHumanMatch(blocked.game, action.matchId, dependencies)
    expect(randomForMatch).toHaveBeenCalledTimes(1)
    expect(played.pendingHumanActions).toEqual([])
    expect(played.processedEvents.map(event => event.type)).toEqual(['MATCH', 'ROUND_END'])
    expect(getScheduledMatch(played.game, action.matchId)).toMatchObject({ date: action.date, status: 'FINISHED' })
    expect(getLeagueRoundState(played.game.competitions[0].league, played.game.competitions[0].schedule, action.date).current!.finished).toBe(true)
    expect(() => playHumanMatch(played.game, action.matchId, dependencies)).toThrow(/não há/i)
    expect(processCurrentDate(played.game, dependencies).simulatedMatchIds).toEqual([])
    expect(advanceGameDay(played.game, dependencies).newDate).toBe('2026-04-06')
    expect(() => advanceGameTo(played.game, '2026-04-04', dependencies)).toThrow(/regredir/)
  })

  it('rejeita escalações de clubes errados e falha sem alterar o snapshot de entrada', () => {
    const setup = createDevelopmentCalendarSetup(2026, false)
    const before = advanceGameTo(setup.game, '2026-04-01', setup.dependencies).game
    const wrong = setup.dependencies.getTeam(before.competitions[0].league.fixtures[0].awayClubId,
      getScheduledMatch(before, before.competitions[0].league.fixtures[0].id))
    expect(() => advanceGameTo(before, '2026-04-05', { ...setup.dependencies, getTeam: () => wrong })).toThrow(/diferentes/)
    expect(before.calendar.currentDate).toBe('2026-04-01')
    expect(before.competitions[0].league.results).toHaveLength(0)
    expect(() => playHumanMatch(before, before.competitions[0].league.fixtures[0].id, setup.dependencies)).toThrow()
    const empty = createTemporalGame('2026-04-01', [])
    expect(advanceGameToNextEvent(empty, setup.dependencies).status).toBe('NO_EVENTS')
    expect(advanceGameDay(empty, setup.dependencies).newDate).toBe('2026-04-02')
  })

  it('reproduz temporada completa pelo fluxo temporal, sem encerrar antes da última ação humana', () => {
    const setup = createDevelopmentCalendarSetup()
    let game = setup.game
    while (true) {
      const result = advanceGameToNextEvent(game, setup.dependencies)
      game = result.game
      if (result.newDate === '2026-06-07') {
        expect(game.competitions[0].league.season.status).toBe('IN_PROGRESS')
        expect(game.competitions[0].league.results).toHaveLength(29)
        expect(game.competitions[0].league.season.championId).toBeUndefined()
        expect(result.blockedEvents.map(event => event.type)).toEqual(['MATCH', 'ROUND_END', 'SEASON_END'])
        break
      }
      for (const action of result.pendingHumanActions) game = playHumanMatch(game, action.matchId, setup.dependencies).game
    }
    game = playHumanMatch(game, getPendingHumanActions(game)[0].matchId, setup.dependencies).game
    expect(game.competitions[0].league.season.status).toBe('FINISHED')
    expect(game.calendar.nextPendingEvent()).toBeUndefined()
    const report = simulateDevelopmentCalendar()
    expect(report).toEqual(simulateDevelopmentCalendar())
    expect(report).toMatchObject({ matches: 30, completedRounds: 10, currentDate: '2026-06-07', season: { status: 'FINISHED', championId: report.standings[0].clubId } })
    expect(report.trace.filter(line => line.includes('Partida humana PENDENTE'))).toHaveLength(10)
    expect(report.operations.flatMap(operation => operation.simulated)).toHaveLength(30)
    expect(new Set(report.operations.flatMap(operation => operation.processed)).size).toBe(52)
  })
})
