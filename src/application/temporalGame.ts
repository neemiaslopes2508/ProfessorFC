import type { MatchInjuryOptions } from '../simulation/injuries'
import { addGameDays, compareGameDates } from '../core/date'
import type { GameDate } from '../core/date'
import { validateId } from '../core/ids'
import type { ClubId, CompetitionSeasonId, MatchId } from '../core/ids'
import { assertDate, assertUnique } from '../core/validation'
import { CalendarConflictError, GameCalendar, validateMatchDateConflicts } from '../domain/calendar'
import type { FootballCalendarEvent } from '../domain/calendar'
import { createMatch } from '../domain/matches'
import type { Match } from '../domain/matches'
import { beginLeagueSeason, createSeasonSchedule } from '../competitions'
import type { LeagueSeason, SeasonSchedule } from '../competitions'
import { MatchSession, simulateMatch } from '../simulation'
import type { SimulationTeam, MatchSimulationResult } from '../simulation'
import type { MatchEngineConfig } from '../simulation/config'
import type { RandomSource } from '../core/random'
import { registerLeagueMatchResult } from './registerLeagueMatchResult'

export interface ScheduledLeague {
  readonly league: LeagueSeason
  readonly schedule: SeasonSchedule
}
export interface TemporalGame {
  readonly calendar: GameCalendar<FootballCalendarEvent>
  readonly competitions: readonly ScheduledLeague[]
  readonly humanClubId?: ClubId
}
export interface PendingHumanAction {
  readonly type: 'PLAY_MATCH'
  readonly date: GameDate
  readonly matchId: MatchId
  readonly competitionSeasonId: CompetitionSeasonId
  readonly clubId: ClubId
}
export interface MatchDayDependencies {
  /** Snapshot explícito com escalação/tática; não há seleção automática nesta camada. */
  readonly getTeam: (clubId: ClubId, match: Match) => SimulationTeam
  /** Uma fonte nova por partida, reproduzível pelo ID; não compartilhar RNG global. */
  readonly randomForMatch: (matchId: MatchId) => RandomSource
  readonly engineConfig?: Partial<MatchEngineConfig>
  readonly matchInjuryOptions?: MatchInjuryOptions
}
export interface TemporalOperationResult {
  readonly game: TemporalGame
  readonly status: 'PROCESSED' | 'ADVANCED' | 'BLOCKED' | 'NO_EVENTS'
  readonly newDate: GameDate
  readonly requestedDate?: GameDate
  readonly pendingEvents: readonly FootballCalendarEvent[]
  readonly processedEvents: readonly FootballCalendarEvent[]
  readonly blockedEvents: readonly FootballCalendarEvent[]
  readonly pendingHumanActions: readonly PendingHumanAction[]
  readonly simulatedMatchIds: readonly MatchId[]
}

/** Instala ligas novas e valida a agenda conjunta, inclusive conflitos entre competições. */
export function createTemporalGame(currentDate: GameDate, competitions: readonly ScheduledLeague[], humanClubId?: ClubId): TemporalGame {
  assertDate(currentDate, 'Data corrente')
  if (humanClubId !== undefined) validateId(humanClubId, 'Clube humano')
  assertUnique(competitions.map(entry => entry.league.season.id), 'Edições agendadas')
  assertUnique(competitions.flatMap(entry => entry.league.fixtures.map(fixture => fixture.id)), 'Partidas agendadas')
  const scheduled = competitions.map(({ league, schedule }) => {
    if (league.season.status !== 'SCHEDULED' || league.results.length) throw new Error('Instalação temporal requer edição nova, sem resultados.')
    if (schedule.competitionSeasonId !== league.season.id) throw new Error('Agenda pertence a outra edição.')
    assertUnique(schedule.matches.map(match => match.matchId), 'Partidas na agenda')
    if (schedule.matches.length !== league.fixtures.length) throw new Error('Agenda deve conter todas as partidas da liga.')
    const byId = new Map(league.fixtures.map(fixture => [fixture.id, fixture]))
    const dates = new Map<number, GameDate>()
    for (const match of schedule.matches) {
      const fixture = byId.get(match.matchId)
      if (!fixture) throw new Error('Partida desconhecida na agenda.')
      assertDate(match.date, 'Data da partida')
      const previous = dates.get(fixture.round)
      if (previous && previous !== match.date) throw new Error('Partidas de uma rodada devem ter a mesma data nesta versão.')
      dates.set(fixture.round, match.date)
    }
    // Reconstitui eventos canônicos das datas: não aceita referências soltas/inconsistentes.
    const canonical = createSeasonSchedule(league, { seasonStartDate: schedule.seasonStartDate,
      roundDates: [...dates].map(([round, date]) => ({ round, date })) })
    if (canonical.seasonEndDate !== schedule.seasonEndDate) throw new Error('Fim da temporada incompatível com as partidas.')
    return Object.freeze({ league, schedule: canonical })
  })
  const events = scheduled.flatMap(entry => [...entry.schedule.events])
  const validation = validateMatchDateConflicts(events)
  if (!validation.valid) throw new CalendarConflictError(validation)
  return Object.freeze({ calendar: GameCalendar.create(currentDate, events), competitions: Object.freeze(scheduled), humanClubId })
}

function findSeason(game: TemporalGame, id: CompetitionSeasonId): ScheduledLeague {
  const entry = game.competitions.find(entry => entry.league.season.id === id)
  if (!entry) throw new Error(`Edição desconhecida: ${id}.`)
  return entry
}

function replaceLeague(game: TemporalGame, league: LeagueSeason): TemporalGame {
  return Object.freeze({ ...game, competitions: Object.freeze(game.competitions.map(entry =>
    entry.league.season.id === league.season.id ? Object.freeze({ ...entry, league }) : entry)) })
}

/** Projeção do Match existente, sem duplicar placares/status no estado temporal. */
export function getScheduledMatch(game: TemporalGame, matchId: MatchId): Match {
  const entry = game.competitions.find(entry => entry.league.fixtures.some(fixture => fixture.id === matchId))
  if (!entry) throw new Error('Partida desconhecida no estado temporal.')
  const fixture = entry.league.fixtures.find(fixture => fixture.id === matchId)!
  const date = entry.schedule.matches.find(match => match.matchId === matchId)!.date
  const result = entry.league.results.find(result => result.matchId === matchId)
  return createMatch({ ...fixture, date, status: result ? 'FINISHED' : 'SCHEDULED', events: result?.events ?? [],
    result: result?.score, statistics: result?.statistics })
}

export function getPendingHumanActions(game: TemporalGame): readonly PendingHumanAction[] {
  if (game.humanClubId === undefined) return Object.freeze([])
  return Object.freeze(game.calendar.pendingOn(game.calendar.currentDate).flatMap(event => {
    if (event.type !== 'MATCH' || (event.reference.homeClubId !== game.humanClubId && event.reference.awayClubId !== game.humanClubId)) return []
    if (getScheduledMatch(game, event.reference.id).status === 'FINISHED') return []
    return [Object.freeze({ type: 'PLAY_MATCH' as const, date: event.date, matchId: event.reference.id,
      competitionSeasonId: event.reference.competitionSeasonId, clubId: game.humanClubId! })]
  }))
}

function scheduledMatchInput(game: TemporalGame, matchId: MatchId, dependencies: MatchDayDependencies) {
  const match = getScheduledMatch(game, matchId)
  if (match.status === 'FINISHED') throw new Error('Partida já concluída.')
  if (match.date !== game.calendar.currentDate) throw new Error('Partida não é da data corrente.')
  const home = dependencies.getTeam(match.homeClubId, match)
  const away = dependencies.getTeam(match.awayClubId, match)
  if (home.club.id !== match.homeClubId || away.club.id !== match.awayClubId) throw new Error('Escalações pertencem a clubes diferentes do confronto.')
  return { home, away, random: dependencies.randomForMatch(matchId),
    context: { neutralVenue: false }, config: dependencies.engineConfig, injuries: dependencies.matchInjuryOptions }
}

function previewScheduledMatch(game: TemporalGame, matchId: MatchId, dependencies: MatchDayDependencies): MatchSimulationResult {
  return simulateMatch(scheduledMatchInput(game, matchId, dependencies))
}

/** Inicia em zero, sem consumir RNG ou confirmar a ação no calendário. */
export function startHumanMatchSession(game: TemporalGame, matchId: MatchId, dependencies: MatchDayDependencies): MatchSession {
  if (!getPendingHumanActions(game).some(action => action.matchId === matchId)) throw new Error('Não há partida humana pendente nesta data.')
  return new MatchSession({ ...scheduledMatchInput(game, matchId, dependencies), matchId })
}

function simulateScheduledMatch(game: TemporalGame, matchId: MatchId, dependencies: MatchDayDependencies): TemporalGame {
  const match = getScheduledMatch(game, matchId)
  const result = previewScheduledMatch(game, matchId, dependencies)
  const entry = findSeason(game, match.competitionSeasonId)
  return replaceLeague(game, registerLeagueMatchResult(entry.league, matchId, result).league)
}

function operation(game: TemporalGame, status: TemporalOperationResult['status'], pendingEvents: readonly FootballCalendarEvent[],
  processedEvents: readonly FootballCalendarEvent[], blockedEvents: readonly FootballCalendarEvent[], simulatedMatchIds: readonly MatchId[], requestedDate?: GameDate): TemporalOperationResult {
  return Object.freeze({ game, status, newDate: game.calendar.currentDate, requestedDate,
    pendingEvents: Object.freeze([...pendingEvents]), processedEvents: Object.freeze([...processedEvents]),
    blockedEvents: Object.freeze([...blockedEvents]), pendingHumanActions: getPendingHumanActions(game), simulatedMatchIds: Object.freeze([...simulatedMatchIds]) })
}

/** Coordena a data inteira. Partida humana e seus encerramentos permanecem pendentes. */
export function processCurrentDate(input: TemporalGame, dependencies: MatchDayDependencies): TemporalOperationResult {
  let game = input
  const pending = game.calendar.pendingOn(game.calendar.currentDate)
  const processed: FootballCalendarEvent[] = []
  const blocked: FootballCalendarEvent[] = []
  const simulated: MatchId[] = []
  for (const event of pending) {
    const seasonId = event.type === 'MATCH' ? event.reference.competitionSeasonId : event.reference.id
    const entry = findSeason(game, seasonId)
    if (event.type === 'SEASON_START') game = replaceLeague(game, beginLeagueSeason(entry.league))
    else if (event.type === 'MATCH') {
      const match = getScheduledMatch(game, event.reference.id)
      if (match.status !== 'FINISHED') {
        if (game.humanClubId !== undefined && [match.homeClubId, match.awayClubId].includes(game.humanClubId)) {
          blocked.push(event)
          continue
        }
        game = simulateScheduledMatch(game, match.id, dependencies)
        simulated.push(match.id)
      }
    } else if (event.type === 'ROUND_END') {
      const finished = new Set(entry.league.results.map(result => result.matchId))
      if (entry.league.fixtures.some(fixture => fixture.round === event.reference.round && !finished.has(fixture.id))) {
        blocked.push(event)
        continue
      }
    } else if (event.type === 'SEASON_END') {
      if (entry.league.season.status !== 'FINISHED') { blocked.push(event); continue }
    } else if (event.type !== 'ROUND_START') throw new Error('Evento temporal sem processador.')
    processed.push(event)
  }
  game = Object.freeze({ ...game, calendar: game.calendar.markProcessed(processed.map(event => event.id)) })
  return operation(game, blocked.length ? 'BLOCKED' : 'PROCESSED', pending, processed, blocked, simulated)
}

/** Ação explícita do jogador; simula somente após autorização por chamada deste use case. */
export function playHumanMatch(game: TemporalGame, matchId: MatchId, dependencies: MatchDayDependencies): TemporalOperationResult {
  return completeHumanMatch(game, matchId, previewHumanMatch(game, matchId, dependencies), dependencies)
}

/** Simulação para apresentação; não registra pontos nem confirma o evento. */
export function previewHumanMatch(game: TemporalGame, matchId: MatchId, dependencies: MatchDayDependencies): MatchSimulationResult {
  if (!getPendingHumanActions(game).some(action => action.matchId === matchId)) throw new Error('Não há partida humana pendente nesta data.')
  return previewScheduledMatch(game, matchId, dependencies)
}

/** Confirma o resultado apresentado, sem voltar a simular a partida humana. */
export function completeHumanMatch(game: TemporalGame, matchId: MatchId, result: MatchSimulationResult, dependencies: MatchDayDependencies): TemporalOperationResult {
  const action = getPendingHumanActions(game).find(action => action.matchId === matchId)
  if (!action) throw new Error('Não há PLAY_MATCH pendente para esta partida na data corrente.')
  const pending = game.calendar.pendingOn(game.calendar.currentDate)
  const event = pending.find(event => event.type === 'MATCH' && event.reference.id === matchId)!
  const match = getScheduledMatch(game, matchId)
  const entry = findSeason(game, match.competitionSeasonId)
  const updated = replaceLeague(game, registerLeagueMatchResult(entry.league, matchId, result).league)
  const acknowledged = Object.freeze({ ...updated, calendar: updated.calendar.markProcessed([event.id]) })
  const remainder = processCurrentDate(acknowledged, dependencies)
  return operation(remainder.game, remainder.status, pending, [event, ...remainder.processedEvents], remainder.blockedEvents,
    [matchId, ...remainder.simulatedMatchIds])
}

/** Visita datas relevantes até o alvo, interrompendo no primeiro evento bloqueado. */
export function advanceGameTo(input: TemporalGame, target: GameDate, dependencies: MatchDayDependencies): TemporalOperationResult {
  if (compareGameDates(target, input.calendar.currentDate) < 0) throw new Error('Avanço temporal não pode regredir.')
  let game = input
  const pending: FootballCalendarEvent[] = []
  const processed: FootballCalendarEvent[] = []
  const simulated: MatchId[] = []
  while (true) {
    const day = processCurrentDate(game, dependencies)
    game = day.game
    pending.push(...day.pendingEvents)
    processed.push(...day.processedEvents)
    simulated.push(...day.simulatedMatchIds)
    if (day.blockedEvents.length) return operation(game, 'BLOCKED', pending, processed, day.blockedEvents, simulated, target)
    const next = game.calendar.nextPendingEvent()
    if (!next || compareGameDates(next.date, target) > 0) {
      game = Object.freeze({ ...game, calendar: game.calendar.advanceTo(target).calendar })
      return operation(game, 'ADVANCED', pending, processed, [], simulated, target)
    }
    game = Object.freeze({ ...game, calendar: game.calendar.advanceTo(next.date).calendar })
  }
}

export function advanceGameDay(game: TemporalGame, dependencies: MatchDayDependencies) {
  return advanceGameTo(game, addGameDays(game.calendar.currentDate, 1), dependencies)
}

export function advanceGameToNextEvent(game: TemporalGame, dependencies: MatchDayDependencies): TemporalOperationResult {
  const next = game.calendar.nextPendingEvent()
  if (!next) return operation(game, 'NO_EVENTS', [], [], [], [])
  return advanceGameTo(game, next.date, dependencies)
}
