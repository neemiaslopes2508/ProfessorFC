import { drawRandom } from '../core/random'
import type { RandomSource } from '../core/random'
import type { PlayerId } from '../core/ids'
import { createMatchEvent } from '../domain/matches'
import type { MatchEvent } from '../domain/matches'
import { INJURY_CATALOG } from '../domain/players/injury'
import type { InjuryDefinition } from '../domain/players/injury'
import type { SimulationTeam } from './types'

export const MATCH_INJURY_CONFIG = Object.freeze({ perPlayerMinuteRate: 0.00004, fitnessRisk: 1, fatigueRisk: 0.6, physicalRisk: 0.3, pressingRisk: 1.15, attackingRisk: 1.05 })
export interface MatchInjuryOptions {
  readonly perPlayerMinuteRate?: number
  readonly catalog?: readonly InjuryDefinition[]
  /** Entrada explícita para QA; a aplicação só a fornece em cenário DEV. */
  readonly forced?: { readonly minute: number; readonly playerId: PlayerId; readonly definition: InjuryDefinition; readonly baseDays: number }
}
export function injuryEvent(minute: number, teams: readonly SimulationTeam[], injured: ReadonlySet<PlayerId>, random: RandomSource, options: MatchInjuryOptions = {}): MatchEvent | undefined {
  const candidates = teams.flatMap(team => team.lineup.startingPlayers.filter(id => !injured.has(id)).map(id => ({ team, player: team.players.find(player => player.id === id)! })))
  const forced = options.forced?.minute === minute ? options.forced : undefined
  const rate = options.perPlayerMinuteRate ?? MATCH_INJURY_CONFIG.perPlayerMinuteRate
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error('Taxa de lesão inválida.')
  const risks = candidates.map(({ team, player }) => rate * (1 + (100 - player.fitness) / 100 * MATCH_INJURY_CONFIG.fitnessRisk + minute / 90 * (1 - player.attributes.stamina / 200) * MATCH_INJURY_CONFIG.fatigueRisk + (200 - player.attributes.physical - player.attributes.stamina) / 200 * MATCH_INJURY_CONFIG.physicalRisk) * (team.tactics.style === 'PRESSING' ? MATCH_INJURY_CONFIG.pressingRisk : 1) * (team.tactics.mentality === 'ATTACKING' ? MATCH_INJURY_CONFIG.attackingRisk : 1))
  const total = risks.reduce((sum, risk) => sum + risk, 0)
  if (!forced && (total === 0 || drawRandom(random) >= Math.min(1, total))) return
  let selected = forced ? candidates.find(candidate => candidate.player.id === forced.playerId) : undefined
  if (!forced) {
    let target = drawRandom(random) * total
    selected = candidates.find((_, index) => { target -= risks[index]; return target < 0 }) ?? candidates.at(-1)
  }
  if (!selected) return
  const catalog = options.catalog ?? INJURY_CATALOG
  if (!catalog.length) throw new Error('Catálogo de lesões vazio.')
  const definition = forced?.definition ?? catalog[Math.floor(drawRandom(random) * catalog.length)]
  const baseDays = forced?.baseDays ?? definition.minDays + Math.floor(drawRandom(random) * (definition.maxDays - definition.minDays + 1))
  return createMatchEvent({ minute, type: 'INJURY', clubId: selected.team.club.id, playerId: selected.player.id,
    metadata: Object.freeze({ injuryType: definition.type, severity: definition.severity, label: definition.label, baseDays, canContinue: definition.severity === 'MINOR' }) })
}
