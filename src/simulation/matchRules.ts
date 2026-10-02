import { drawRandom } from '../core/random'
import { assertUnique } from '../core/validation'
import { validateClub } from '../domain/clubs'
import { validatePlayer } from '../domain/players'
import { createMatchEvent } from '../domain/matches'
import type { MatchEvent } from '../domain/matches'
import { validateTeamSelection } from '../domain/tactics'
import type { TeamSelectionWarning } from '../domain/tactics'
import { ENGINE_FACTORS, resolveMatchEngineConfig } from './config'
import { chooseParticipant } from './events'
import { calculateTeamStrength } from './strength'
import type { MatchSimulationInput, SimulationTeam } from './types'

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

function validateTeam(team: SimulationTeam): readonly TeamSelectionWarning[] {
  validateClub(team.club)
  assertUnique(team.players.map(player => player.id), 'Jogadores do contexto')
  team.players.forEach(validatePlayer)
  const validation = validateTeamSelection(team.lineup, team.tactics, team)
  if (!validation.valid) {
    throw new Error(`Escalação inválida de "${team.club.id}": ${validation.errors.map(error => `${error.code}: ${error.message}`).join('; ')}`)
  }
  return validation.warnings
}


export function prepareMatch(input: MatchSimulationInput) {
  const config = resolveMatchEngineConfig(input.config)
  if (input.home.club.id === input.away.club.id) throw new Error('Clube não pode jogar contra ele mesmo.')
  if (typeof input.context.neutralVenue !== 'boolean') throw new Error('neutralVenue deve ser booleano.')
  const warnings = [...validateTeam(input.home), ...validateTeam(input.away)]
  assertUnique([
    ...input.home.lineup.startingPlayers, ...input.home.lineup.bench,
    ...input.away.lineup.startingPlayers, ...input.away.lineup.bench,
  ], 'Jogadores selecionados nos dois clubes')
  const home = calculateTeamStrength(input.home, input.context.neutralVenue ? 1 : 1 + config.homeAdvantage)
  const away = calculateTeamStrength(input.away, 1)
  const homePossessionProbability = clamp(home.midfield / (home.midfield + away.midfield), ENGINE_FACTORS.minPossession, ENGINE_FACTORS.maxPossession)
  return Object.freeze({ home, away, homePossessionProbability, config, warnings: Object.freeze(warnings) })
}

export function runMatchMinute(minute: number, context: ReturnType<typeof prepareMatch>, homeClubId: MatchEvent['clubId'], awayClubId: MatchEvent['clubId'], random: MatchSimulationInput['random'], booked: Set<string>) {
  const { home, away, config, homePossessionProbability } = context
  const events: MatchEvent[] = []
  const homeHasBall = drawRandom(random) < homePossessionProbability

  const attacking = homeHasBall ? home : away
  const defending = homeHasBall ? away : home
  const attackingClub = homeHasBall ? homeClubId : awayClubId
  const defendingClub = homeHasBall ? awayClubId : homeClubId
  const addEvent = (type: MatchEvent['type'], clubId: MatchEvent['clubId'], playerId: MatchEvent['playerId']) => {
    events.push(createMatchEvent({ minute, type, clubId, playerId }))
  }

  const foulRisk = defending.modifiers.formation.foulRisk * defending.modifiers.mentality.foulRisk * defending.modifiers.style.foulRisk
  if (drawRandom(random) < clamp(config.foulRate * foulRisk, 0, 1)) {
    const offender = chooseParticipant(defending.players, 'foulParticipation', random)
    addEvent('FOUL', defendingClub, offender.playerId)
    if (drawRandom(random) < config.cardRate && !booked.has(offender.playerId)) {
      addEvent('YELLOW_CARD', defendingClub, offender.playerId)
      booked.add(offender.playerId)
    }
    return { events, homeHasBall }
  }

  const chanceProbability = config.baseChanceRate === 0 ? 0 : clamp(
    config.baseChanceRate * (attacking.attack / defending.defense) ** ENGINE_FACTORS.strengthRatioExponent,
    ENGINE_FACTORS.minChance, ENGINE_FACTORS.maxChance,
  )
  if (drawRandom(random) >= chanceProbability) return { events, homeHasBall }
  const shooter = chooseParticipant(attacking.players, 'offensiveParticipation', random)
  addEvent('SHOT', attackingClub, shooter.playerId)
  const onTargetProbability = config.baseOnTargetRate === 0 ? 0 : clamp(
    config.baseOnTargetRate * shooter.strength / ENGINE_FACTORS.referenceStrength,
    ENGINE_FACTORS.minOnTarget, ENGINE_FACTORS.maxOnTarget,
  )
  let goal = false
  if (drawRandom(random) < onTargetProbability) {
    addEvent('SHOT_ON_TARGET', attackingClub, shooter.playerId)
    const conversionProbability = config.baseConversionRate === 0 ? 0 : clamp(
      config.baseConversionRate * (attacking.attack / defending.defense * shooter.strength / defending.goalkeeper.strength) ** ENGINE_FACTORS.strengthRatioExponent,
      ENGINE_FACTORS.minConversion, ENGINE_FACTORS.maxConversion,
    )
    goal = drawRandom(random) < conversionProbability
    if (goal) addEvent('GOAL', attackingClub, shooter.playerId)
    else addEvent('SAVE', defendingClub, defending.goalkeeper.playerId)
  }
  // Escanteios podem surgir de tentativa sem gol, inclusive defesa com rebote.
  if (!goal && drawRandom(random) < config.cornerRate) {
    const taker = chooseParticipant(attacking.players, 'offensiveParticipation', random)
    addEvent('CORNER', attackingClub, taker.playerId)
  }
  return { events, homeHasBall }
}


