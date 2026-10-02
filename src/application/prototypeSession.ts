import type { ClubId, ContractId, MatchId, PlayerId } from '../core/ids'
import { createContract } from '../domain/contracts'
import { createMoneyFromCents } from '../core/money'
import { nextContractDate, processContractDate } from './contractLifecycle'
import type { WageTransaction } from './contractLifecycle'
import { createSeededRandomSource } from '../core/random'
import { assertDate } from '../core/validation'
import { assertIntegerRange } from '../core/validation'
import { prototypeMatchSeed } from './prototypeMatchSeed'
import { EMPTY_TRANSFER_MARKET } from '../transfers/types'
import type { TransferMarket } from '../transfers/types'
import { createDevelopmentFixture } from '../data/fixtures/development'
import { loadGameData } from '../data'
import { createLeagueSeason, createSeasonSchedule, getLeagueStandings, getLeagueRoundState } from '../competitions'
import { createLineup, createTactics, FORMATION_POSITIONS, validateTeamSelection } from '../domain/tactics'
import type { Tactics, Lineup, Formation } from '../domain/tactics'
import type { Club } from '../domain/clubs'
import type { Player } from '../domain/players'
import type { MatchSnapshot, MatchSimulationResult, SimulationTeam } from '../simulation'
import { advanceGameTo, completeHumanMatch, createTemporalGame, getPendingHumanActions, getScheduledMatch, previewHumanMatch } from './temporalGame'
import type { TemporalGame, MatchDayDependencies } from './temporalGame'

export interface PresentedMatch { readonly matchId: MatchId; readonly result: MatchSimulationResult }
export interface PrototypeSession {
  readonly careerSeed: number
  readonly market: TransferMarket
  readonly game: TemporalGame
  readonly teams: readonly SimulationTeam[]
  readonly freeAgents: readonly Player[]
  readonly financialTransactions: readonly WageTransaction[]
  readonly starterSlots?: readonly (PlayerId | undefined)[]
  readonly liveMatch?: MatchSnapshot
  readonly pendingMatch?: PresentedMatch
  readonly lastMatch?: PresentedMatch
}

function developmentData() {
  const loaded = loadGameData(createDevelopmentFixture(), 'development')
  if (!loaded.ok) throw new Error('Não foi possível carregar a base fictícia de desenvolvimento.')
  return loaded.repositories
}
export function getDevelopmentClubs(): readonly Club[] { return developmentData().clubs.getAll() }

/** Seleção inicial de desenvolvimento, por posição e ordem estável; não é LineupAI. */
function initialLineup(club: Club, players: readonly Player[], tactics: Tactics): Lineup {
  const available = players.filter(player => player.status === 'AVAILABLE' && club.playerIds.includes(player.id))
  const used = new Set<PlayerId>()
  const positions = FORMATION_POSITIONS[tactics.formation].map(position => {
    const candidates = available.filter(player => !used.has(player.id))
    const player = candidates.find(player => player.primaryPosition === position)
      ?? candidates.find(player => player.secondaryPositions.includes(position)) ?? candidates[0]
    if (!player) throw new Error('Elenco insuficiente para preencher a formação.')
    used.add(player.id)
    return { position, playerId: player.id }
  })
  return createLineup({ positions, startingPlayers: positions.map(slot => slot.playerId), bench: available.filter(player => !used.has(player.id)).map(player => player.id) })
}

export function startPrototype(clubId: ClubId, careerSeed = 2026): PrototypeSession {
  assertIntegerRange(careerSeed, 0, 0xffffffff, 'Seed da carreira')
  const data = developmentData()
  const clubs = data.clubs.getAll()
  if (!clubs.some(club => club.id === clubId)) throw new Error('Escolha um dos clubes de desenvolvimento.')
  const tactics = createTactics({ formation: '4-3-3', mentality: 'BALANCED', style: 'BALANCED' })
  const teams = clubs.map(club => {
    const players = data.players.getAll().filter(player => player.clubId === club.id)
    return Object.freeze({ club, players, tactics, lineup: initialLineup(club, players, tactics) })
  })
  const league = createLeagueSeason(data.competitions.getAll()[0], data.competitionSeasons.getAll()[0])
  const schedule = createSeasonSchedule(league, { seasonStartDate: '2026-04-01', firstRoundDate: '2026-04-05', daysBetweenRounds: 7 })
  const contracts = teams.flatMap(team => team.players.map((player, index) => createContract({ id: `dev-contract-${player.id}` as ContractId, playerId: player.id, clubId: team.club.id, startDate: '2026-01-01', endDate: player.id === team.lineup.bench.at(-1) ? '2026-04-02' : '2027-04-01', salary: createMoneyFromCents(300000 + index * 10000), squadRole: 'ROTATION', status: 'ACTIVE' })))
  return Object.freeze({ careerSeed, market: Object.freeze({ ...EMPTY_TRANSFER_MARKET, contracts: Object.freeze(contracts) }), game: createTemporalGame('2026-03-31', [{ league, schedule }], clubId), teams: Object.freeze(teams), freeAgents: Object.freeze([]), financialTransactions: Object.freeze([]) })
}
export function humanTeam(session: PrototypeSession): SimulationTeam {
  const team = session.teams.find(team => team.club.id === session.game.humanClubId)
  if (!team) throw new Error('Sessão sem clube humano.')
  return team
}
export function selectionValidation(session: PrototypeSession) {
  const team = humanTeam(session)
  return validateTeamSelection(team.lineup, team.tactics, team)
}
function editTeam(session: PrototypeSession, change: (team: SimulationTeam) => SimulationTeam): PrototypeSession {
  if (session.liveMatch) throw new Error('Use os controles táticos da partida em andamento.')
  if (session.pendingMatch) throw new Error('Continue o resultado antes de alterar a equipe.')
  if (session.game.competitions[0].league.season.status === 'FINISHED') throw new Error('Esta temporada já terminou.')
  return Object.freeze({ ...session, teams: Object.freeze(session.teams.map(team => team.club.id === session.game.humanClubId ? Object.freeze(change(team)) : team)) })
}
export function setPrototypeTactics(session: PrototypeSession, input: Tactics): PrototypeSession {
  const tactics = createTactics(input)
  const changed = tactics.formation !== humanTeam(session).tactics.formation
  const slots = changed ? reorganizeStarters(session, tactics.formation) : starterSlots(session)
  return Object.freeze({ ...editTeam(session, team => ({ ...team, tactics, lineup: changed ? lineupFromSlots(slots, tactics.formation, team.lineup.bench) : team.lineup })), starterSlots: changed ? Object.freeze(slots) : session.starterSlots })
}

/** Mantém os mesmos atletas escolhidos; encaixa posições naturais, secundárias e depois improvisações. */
function reorganizeStarters(session: PrototypeSession, formation: Formation): (PlayerId | undefined)[] {
  const team = humanTeam(session)
  const positions = FORMATION_POSITIONS[formation]
  const remaining = new Set(starterSlots(session).filter((id): id is PlayerId => id !== undefined))
  const slots: (PlayerId | undefined)[] = Array.from({ length: positions.length })
  for (const secondary of [false, true]) {
    positions.forEach((position, index) => {
      if (slots[index]) return
      const player = team.players.find(player => remaining.has(player.id) && (secondary ? player.secondaryPositions.includes(position) : player.primaryPosition === position))
      if (player) { slots[index] = player.id; remaining.delete(player.id) }
    })
  }
  positions.forEach((_, index) => {
    if (slots[index]) return
    const id = remaining.values().next().value
    if (id) { slots[index] = id; remaining.delete(id) }
  })
  return slots
}
function lineupFromSlots(slots: readonly (PlayerId | undefined)[], formation: Formation, bench: readonly PlayerId[]): Lineup {
  const positions = FORMATION_POSITIONS[formation].flatMap((position, index) => {
    const playerId = slots[index]
    return playerId ? [Object.freeze({ position, playerId })] : []
  })
  return Object.freeze({ positions: Object.freeze(positions), startingPlayers: Object.freeze(positions.map(slot => slot.playerId)), bench: Object.freeze([...bench]) })
}

/** Troca atômica banco→titular ou titular→titular. Alertas válidos são preservados. */
export function moveTeamPlayer(session: PrototypeSession, playerId: PlayerId, targetSlot: number): PrototypeSession {
  const team = humanTeam(session)
  const slots = [...starterSlots(session)]
  if (!Number.isInteger(targetSlot) || targetSlot < 0 || targetSlot >= slots.length) throw new Error('Destino de escalação inválido.')
  const sourceSlot = slots.indexOf(playerId)
  if (sourceSlot === targetSlot) return session
  if (sourceSlot < 0 && !team.lineup.bench.includes(playerId)) throw new Error('Escolha um titular ou jogador do banco.')
  const displaced = slots[targetSlot]
  slots[targetSlot] = playerId
  let bench = [...team.lineup.bench]
  if (sourceSlot >= 0) slots[sourceSlot] = displaced
  else bench = bench.flatMap(id => id === playerId ? displaced ? [displaced] : [] : [id])
  const lineup = lineupFromSlots(slots, team.tactics.formation, bench)
  const validation = validateTeamSelection(lineup, team.tactics, team)
  if (!validation.valid) throw new Error(`Troca não permitida: ${validation.errors.map(error => error.message).join(' ')}`)
  return Object.freeze({ ...editTeam(session, current => ({ ...current, lineup })), starterSlots: Object.freeze(slots) })
}
export function starterSlots(session: PrototypeSession): readonly (PlayerId | undefined)[] {
  return session.starterSlots ?? humanTeam(session).lineup.positions.map(slot => slot.playerId)
}
/** Rascunho editável: estados incompletos/duplicados são apresentados pelo validador do domínio. */
export function setStarter(session: PrototypeSession, slot: number, playerId?: PlayerId): PrototypeSession {
  const chosen = [...starterSlots(session)]
  chosen[slot] = playerId
  const updated = editTeam(session, team => {
    const slots = FORMATION_POSITIONS[team.tactics.formation]
    if (!Number.isInteger(slot) || slot < 0 || slot >= slots.length) throw new Error('Posição de escalação inválida.')
    const positions = slots.flatMap((position, index) => { const id = chosen[index]; return id ? [{ position, playerId: id }] : [] })
    const starters = positions.map(entry => entry.playerId)
    const old = starterSlots(session)[slot]
    const bench = [...team.lineup.bench.filter(id => !starters.includes(id)), ...(old && !starters.includes(old) && !team.lineup.bench.includes(old) ? [old] : [])]
    const draft = { startingPlayers: starters, bench, positions }
    return { ...team, lineup: draft }
  })
  return Object.freeze({ ...updated, starterSlots: Object.freeze(chosen) })
}
export function setBench(session: PrototypeSession, ids: readonly PlayerId[]): PrototypeSession {
  return editTeam(session, team => ({ ...team, lineup: { ...team.lineup, bench: [...ids] } }))
}
export function prototypeMatchDependencies(session: PrototypeSession): MatchDayDependencies {
  return {
    getTeam: clubId => {
      const team = session.teams.find(team => team.club.id === clubId)
      if (!team) throw new Error('Clube sem escalação nesta sessão.')
      return team
    },
    randomForMatch: matchId => {
      const edition = session.game.competitions.find(({ league }) => league.fixtures.some(fixture => fixture.id === matchId))
      const fixture = edition?.league.fixtures.find(fixture => fixture.id === matchId)
      if (!edition || !fixture) throw new Error('Partida desconhecida.')
      return createSeededRandomSource(prototypeMatchSeed(session.careerSeed, edition.league.season.id, fixture.id, fixture.homeClubId, fixture.awayClubId))
    },
  }
}
export function advancePrototype(session: PrototypeSession): PrototypeSession {
  if (session.liveMatch) throw new Error('Conclua a partida em andamento antes de avançar o calendário.')
  if (session.pendingMatch) throw new Error('Clique em Continuar para confirmar o resultado antes de avançar.')
  const processed = processContractDate(session, session.game.calendar.currentDate)
  const current = advanceGameTo(processed.game, processed.game.calendar.currentDate, prototypeMatchDependencies(processed))
  const base = Object.freeze({ ...processed, game: current.game })
  if (current.blockedEvents.length) return base
  const date = [base.game.calendar.nextPendingEvent()?.date, nextContractDate(base)].filter((date): date is string => !!date).sort()[0]
  if (!date) return base
  const evolved = processContractDate(base, date)
  return Object.freeze({ ...evolved, game: advanceGameTo(base.game, date, prototypeMatchDependencies(evolved)).game })
}
export function playPrototypeMatch(session: PrototypeSession): PrototypeSession {
  if (session.liveMatch) throw new Error('A partida já está em andamento; use seus controles de avanço.')
  if (session.pendingMatch) return session
  const validation = selectionValidation(session)
  if (!validation.valid) throw new Error(`Corrija a escalação: ${validation.errors.map(error => error.message).join(' ')}`)
  const action = getPendingHumanActions(session.game)[0]
  if (!action) throw new Error('Avance o calendário até sua próxima partida.')
  const result = previewHumanMatch(session.game, action.matchId, prototypeMatchDependencies(session))
  return Object.freeze({ ...session, pendingMatch: Object.freeze({ matchId: action.matchId, result }) })
}
export function continuePrototypeMatch(session: PrototypeSession): PrototypeSession {
  if (!session.pendingMatch) return session
  const { matchId, result } = session.pendingMatch
  const game = completeHumanMatch(session.game, matchId, result, prototypeMatchDependencies(session)).game
  return Object.freeze({ ...session, game, lastMatch: session.pendingMatch, pendingMatch: undefined })
}
export function prototypeView(session: PrototypeSession) {
  const { league, schedule } = session.game.competitions[0]
  const standings = getLeagueStandings(league)
  const matches = league.fixtures.map(fixture => getScheduledMatch(session.game, fixture.id))
  const club = humanTeam(session).club
  return { league, standings, matches, club, rounds: getLeagueRoundState(league, schedule, session.game.calendar.currentDate),
    humanStanding: standings.find(row => row.clubId === club.id)!, pendingActions: getPendingHumanActions(session.game),
    nextMatch: matches.find(match => match.status !== 'FINISHED' && [match.homeClubId, match.awayClubId].includes(club.id)),
    champion: session.teams.find(team => team.club.id === league.season.championId)?.club }
}
export function playerAge(player: Player, date: string): number {
  assertDate(date, 'Data de referência')
  return Number(date.slice(0, 4)) - Number(player.birthDate.slice(0, 4)) - (date.slice(5) < player.birthDate.slice(5) ? 1 : 0)
}
