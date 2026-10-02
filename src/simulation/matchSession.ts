import { createId, validateId } from '../core/ids'
import type { ClubId, MatchId } from '../core/ids'
import { createLineup, createTactics, validateTeamSelection } from '../domain/tactics'
import type { Lineup, Tactics } from '../domain/tactics'
import { createMatchEvent } from '../domain/matches'
import type { MatchEvent, MatchStatus } from '../domain/matches'
import { DEFAULT_MATCH_ENGINE_CONFIG, ENGINE_FACTORS, resolveMatchSessionRules } from './config'
import type { MatchSessionRules } from './config'
import { planSubstitutions, substitutionState } from './substitutions'
import type { MatchSubstitution, SubstitutionState } from './substitutions'
import { summarizeEvents } from './events'
import { prepareMatch, runMatchMinute } from './matchRules'
import type { MatchSimulationInput, MatchSimulationResult, SimulationTeam } from './types'

export type MatchPhase = 'PRE_MATCH' | 'FIRST_HALF' | 'HALF_TIME' | 'SECOND_HALF' | 'FULL_TIME'
export interface MatchSnapshot {
  readonly matchId: MatchId
  readonly homeClubId: ClubId
  readonly awayClubId: ClubId
  readonly currentMinute: number
  readonly phase: MatchPhase
  readonly status: MatchStatus
  readonly score: MatchSimulationResult['score']
  readonly statistics: MatchSimulationResult['statistics']
  readonly events: readonly MatchEvent[]
  readonly homeLineup: Lineup
  readonly awayLineup: Lineup
  readonly homeTactics: Tactics
  readonly awayTactics: Tactics
  readonly currentPossessionClubId?: ClubId
  readonly canAdvance: boolean
  readonly canChangeTactics: boolean
  readonly canMakeSubstitution: boolean
  readonly canStartSecondHalf: boolean
  readonly homeSubstitutions: SubstitutionState
  readonly awaySubstitutions: SubstitutionState
  readonly lastEvent?: MatchEvent
}
export interface MatchAdvance {
  readonly snapshot: MatchSnapshot
  readonly newEvents: readonly MatchEvent[]
}

/** Copia somente o contexto consumido pelo motor; alterações externas não afetam a partida. */
function captureTeam(team: SimulationTeam): SimulationTeam {
  return Object.freeze({
    ...team, club: Object.freeze({ ...team.club, playerIds: Object.freeze([...team.club.playerIds]) }),
    players: Object.freeze(team.players.map(player => Object.freeze({ ...player,
      attributes: Object.freeze({ ...player.attributes }), secondaryPositions: Object.freeze([...player.secondaryPositions]),
    }))),
    lineup: createLineup(team.lineup), tactics: createTactics(team.tactics),
  })
}

/** Tempo de jogo explícito. A fonte aleatória pertence exclusivamente a esta sessão. */
export class MatchSession {
  readonly #matchId: MatchId
  readonly #input: MatchSimulationInput
  #home: SimulationTeam
  #away: SimulationTeam
  #context: ReturnType<typeof prepareMatch>
  #minute = 0
  #phase: MatchPhase = 'PRE_MATCH'
  #events: MatchEvent[] = []
  #booked = new Set<string>()
  #homePossessionTicks = 0
  #possessionClubId?: ClubId
  readonly #rules: MatchSessionRules
  #homeChanges: readonly MatchSubstitution[] = []
  #awayChanges: readonly MatchSubstitution[] = []

  constructor(input: MatchSimulationInput & { readonly matchId: MatchId; readonly rules?: Partial<MatchSessionRules> }) {
    validateId(input.matchId, 'MatchId')
    this.#matchId = input.matchId
    this.#rules = resolveMatchSessionRules(input.rules)
    this.#context = prepareMatch(input)
    this.#home = captureTeam(input.home)
    this.#away = captureTeam(input.away)
    this.#input = { ...input, context: Object.freeze({ ...input.context }), config: this.#context.config }
  }

  snapshot(): MatchSnapshot {
    const precision = ENGINE_FACTORS.possessionPrecision
    const possession = this.#minute === 0 ? 50 : Math.round(this.#homePossessionTicks / this.#minute * 100 * precision) / precision
    return Object.freeze({
      matchId: this.#matchId, homeClubId: this.#home.club.id, awayClubId: this.#away.club.id,
      currentMinute: this.#minute, phase: this.#phase,
      status: this.#phase === 'FULL_TIME' ? 'FINISHED' : this.#phase === 'PRE_MATCH' ? 'SCHEDULED' : 'IN_PROGRESS',
      ...summarizeEvents(this.#events, this.#home.club.id, possession), events: Object.freeze([...this.#events]),
      homeLineup: this.#home.lineup, awayLineup: this.#away.lineup,
      homeTactics: this.#home.tactics, awayTactics: this.#away.tactics,
      currentPossessionClubId: this.#possessionClubId,
      canAdvance: this.#phase !== 'HALF_TIME' && this.#phase !== 'FULL_TIME',
      canChangeTactics: this.#phase !== 'FULL_TIME',
      canStartSecondHalf: this.#phase === 'HALF_TIME',
      canMakeSubstitution: this.#phase !== 'FULL_TIME' && (
        (this.#homeChanges.length < this.#rules.maxSubstitutions && this.#home.lineup.bench.length > 0)
        || (this.#awayChanges.length < this.#rules.maxSubstitutions && this.#away.lineup.bench.length > 0)),
      homeSubstitutions: substitutionState(this.#rules.maxSubstitutions, this.#homeChanges),
      awaySubstitutions: substitutionState(this.#rules.maxSubstitutions, this.#awayChanges),
      lastEvent: this.#events.at(-1),
    })
  }

  advance(minutes: number): MatchAdvance {
    if (!Number.isSafeInteger(minutes) || minutes < 0) throw new Error('Avanço deve ser um número inteiro não negativo de minutos.')
    const from = this.#events.length
    const duration = this.#context.config.minutes
    const halfTime = Math.ceil(duration / 2)
    for (let step = 0; step < minutes && this.#phase !== 'HALF_TIME' && this.#phase !== 'FULL_TIME'; step++) {
      if (this.#phase === 'PRE_MATCH') this.#phase = 'FIRST_HALF'
      const minute = this.#minute + 1
      const tick = runMatchMinute(minute, this.#context, this.#home.club.id, this.#away.club.id, this.#input.random, this.#booked)
      this.#minute = minute
      this.#events.push(...tick.events)
      if (tick.homeHasBall) this.#homePossessionTicks++
      this.#possessionClubId = tick.homeHasBall ? this.#home.club.id : this.#away.club.id
      if (this.#minute === duration) this.#phase = 'FULL_TIME'
      else if (this.#minute === halfTime) this.#phase = 'HALF_TIME'
    }
    return Object.freeze({ snapshot: this.snapshot(), newEvents: Object.freeze(this.#events.slice(from)) })
  }

  startSecondHalf(): MatchSnapshot {
    if (this.#phase !== 'HALF_TIME') throw new Error('O segundo tempo só pode iniciar no intervalo.')
    this.#phase = 'SECOND_HALF'
    return this.snapshot()
  }

  applyTactics(clubId: ClubId, input: Tactics): MatchSnapshot {
    const team = clubId === this.#home.club.id ? this.#home : this.#away
    return this.applyTeamSelection(clubId, team.lineup, input)
  }

  /** Valida o conjunto inteiro antes de alterar lineup, tática, histórico ou forças. */
  applyTeamSelection(clubId: ClubId, input: Lineup, tacticalInput: Tactics): MatchSnapshot {
    if (this.#phase === 'FULL_TIME') throw new Error('A partida já terminou.')
    if (clubId !== this.#home.club.id && clubId !== this.#away.club.id) throw new Error('Clube não participa desta partida.')
    const tactics = createTactics(tacticalInput)
    const lineup = createLineup(input)
    const team = clubId === this.#home.club.id ? this.#home : this.#away
    const validation = validateTeamSelection(lineup, tactics, team)
    if (!validation.valid) throw new Error(`Tática incompatível com a escalação: ${validation.errors.map(error => error.message).join('; ')}`)
    const history = clubId === this.#home.club.id ? this.#homeChanges : this.#awayChanges
    const changes = planSubstitutions(team.lineup, lineup, substitutionState(this.#rules.maxSubstitutions, history), this.#minute)
    const updated = Object.freeze({ ...team, tactics, lineup })
    const home = clubId === this.#home.club.id ? updated : this.#home
    const away = clubId === this.#away.club.id ? updated : this.#away
    const context = prepareMatch({ ...this.#input, home, away })
    this.#home = home
    this.#away = away
    this.#context = context
    if (clubId === this.#home.club.id) this.#homeChanges = Object.freeze([...history, ...changes])
    else this.#awayChanges = Object.freeze([...history, ...changes])
    this.#events.push(...changes.map(change => createMatchEvent({ minute: change.minute, type: 'SUBSTITUTION',
      clubId, playerId: change.playerInId, secondaryPlayerId: change.playerOutId,
      playerInId: change.playerInId, playerOutId: change.playerOutId,
    })))
    return this.snapshot()
  }

  toResult(): MatchSimulationResult {
    if (this.#phase !== 'FULL_TIME') throw new Error('Resultado final disponível apenas em FULL_TIME.')
    const { score, statistics, events } = this.snapshot()
    return Object.freeze({ score, statistics, events, debug: this.#context })
  }
}

/** API de lote preservada: mesmas regras, RNG e ordem de sorteios, sem apresentação. */
export function simulateMatch(input: MatchSimulationInput): MatchSimulationResult {
  const session = new MatchSession({ ...input, matchId: createId('Match', 'standalone-simulation') })
  const minutes = input.config?.minutes ?? DEFAULT_MATCH_ENGINE_CONFIG.minutes
  session.advance(minutes)
  if (session.snapshot().phase === 'HALF_TIME') { session.startSecondHalf(); session.advance(minutes) }
  return session.toResult()
}
