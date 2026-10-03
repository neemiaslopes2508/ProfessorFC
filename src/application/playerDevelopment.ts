import type { ClubId, PlayerId } from '../core/ids'
import { addGameDays } from '../core/date'
import { deriveSeed, createSeededRandomSource } from '../core/random'
import { assertDate } from '../core/validation'
import { createPlayer } from '../domain/players'
import type { Player } from '../domain/players'
import { TRAINING_ATTRIBUTES, TRAINING_CONFIG } from '../domain/players/development'
import type { TrainableAttribute, TrainingFocus } from '../domain/players/development'
import { calculatePlayerStrength } from '../simulation/strength'
import type { PrototypeSession } from './prototypeSession'

export interface TrainingPlan { readonly clubId: ClubId; readonly focus: TrainingFocus }
export interface TrainingChange { readonly playerId: PlayerId; readonly clubId: ClubId; readonly date: string; readonly attribute: TrainableAttribute; readonly before: number; readonly after: number }
export interface TrainingCycle { readonly month: string; readonly date: string; readonly clubChanges: Readonly<Record<string, number>>; readonly changes: readonly TrainingChange[] }

export function trainingFocus(session: PrototypeSession, clubId: ClubId): TrainingFocus {
  return session.trainingPlans.find(plan => plan.clubId === clubId)?.focus ?? 'BALANCED'
}
export function setTrainingFocus(session: PrototypeSession, clubId: ClubId, focus: TrainingFocus): PrototypeSession {
  if (session.liveMatch || session.pendingMatch) throw new Error('Conclua a partida antes de alterar o treinamento.')
  if (!session.teams.some(team => team.club.id === clubId)) throw new Error('Clube inexistente para o treinamento.')
  const plans = session.trainingPlans.filter(plan => plan.clubId !== clubId)
  return Object.freeze({ ...session, trainingPlans: Object.freeze([...plans, Object.freeze({ clubId, focus })]) })
}
export function latestTrainingCycle(session: PrototypeSession, clubId: ClubId) {
  return [...session.trainingCycles].reverse().find(cycle => clubId in cycle.clubChanges)
}
export function recentPlayerDevelopment(session: PrototypeSession, playerId: PlayerId): readonly TrainingChange[] {
  const months = new Set(session.trainingCycles.slice(-6).map(cycle => cycle.month))
  return Object.freeze(session.trainingHistory.filter(change => change.playerId === playerId && months.has(change.date.slice(0, 7)))
  )
}
function playerOverall(player: Player): number { return Math.round(calculatePlayerStrength(player, player.primaryPosition).attributeStrength) }
function playerAge(player: Player, date: string): number {
  return Number(date.slice(0, 4)) - Number(player.birthDate.slice(0, 4)) - (date.slice(5) < player.birthDate.slice(5) ? 1 : 0)
}
export function nextTrainingDate(session: PrototypeSession): string {
  const current = session.game.calendar.currentDate
  const monthStart = current.slice(0, 7) + '-01'
  return current < monthStart ? monthStart : addGameDays(monthStart, 32).slice(0, 7) + '-01'
}
function weightedAttribute(random: ReturnType<typeof createSeededRandomSource>, attributes: readonly TrainableAttribute[], player: Player): TrainableAttribute {
  const weights = attributes.map(attribute => attribute === 'finishing' && ['ST', 'RW', 'LW'].includes(player.primaryPosition) ? 1.5 : 1)
  let target = random.next() * weights.reduce((sum, weight) => sum + weight, 0)
  return attributes.find((_, index) => { target -= weights[index]; return target < 0 }) ?? attributes.at(-1)!
}
function ageGrowthBonus(age: number): number { return TRAINING_CONFIG.ageGrowth.find(curve => age <= curve.through)?.bonus ?? 0 }
function activityFactor(player: Player): number {
  const availability = player.status === 'INJURED' ? TRAINING_CONFIG.injuredActivity : player.status === 'RECOVERING' ? TRAINING_CONFIG.recoveringActivity : 1
  return availability * (TRAINING_CONFIG.fitnessFloor + player.fitness / 100 * (1 - TRAINING_CONFIG.fitnessFloor))
}
function applyAttributeChange(player: Player, attribute: TrainableAttribute, delta: 1 | -1): Player | undefined {
  const value = player.attributes[attribute] + delta
  if (value < 1 || value > 100) return
  const changed = createPlayer({ ...player, attributes: { ...player.attributes, [attribute]: value } })
  return delta > 0 && playerOverall(changed) > player.potential ? undefined : changed
}
function processPlayer(player: Player, clubId: ClubId, focus: TrainingFocus, date: string, careerSeed: number, facilityLevel: number, facilityBonusPerLevel: number = TRAINING_CONFIG.trainingCenterChancePerLevel, randomDomain = 'training') {
  const random = createSeededRandomSource(deriveSeed(careerSeed, `${randomDomain}:${date.slice(0, 7)}:${player.id}`))
  const age = playerAge(player, date)
  const overall = playerOverall(player)
  const gap = Math.max(0, player.potential - overall)
  const youthBonus = focus === 'YOUTH' && age <= 23 ? 0.08 : 0
  const chance = Math.min(TRAINING_CONFIG.maxGrowthChance, Math.max(0,
    (TRAINING_CONFIG.baseGrowthChance + ageGrowthBonus(age) + gap * TRAINING_CONFIG.potentialGapScale + (player.form - 50) * TRAINING_CONFIG.formScale + youthBonus)
      * activityFactor(player) * (1 + (facilityLevel - 1) * facilityBonusPerLevel)))
  const decline = age >= TRAINING_CONFIG.declineStartAge
    ? Math.min(TRAINING_CONFIG.maxDeclineChance, TRAINING_CONFIG.declineBaseChance + (age - TRAINING_CONFIG.declineStartAge) * TRAINING_CONFIG.declinePerYear)
    : 0
  let attribute: TrainableAttribute | undefined
  let delta: 1 | -1 | undefined
  if (random.next() < decline) {
    const candidates = (['pace', 'stamina', 'physical'] as const).filter(name => player.attributes[name] > 1)
    if (candidates.length) { attribute = weightedAttribute(random, candidates, player); delta = -1 }
  } else if (random.next() < chance && overall < player.potential) {
    const candidates = TRAINING_ATTRIBUTES[focus].filter(name => player.attributes[name] < 100 && !!applyAttributeChange(player, name, 1))
    if (candidates.length) { attribute = weightedAttribute(random, candidates, player); delta = 1 }
  }
  if (!attribute || !delta) return { player, changes: [] as TrainingChange[] }
  const next = applyAttributeChange(player, attribute, delta)
  if (!next) return { player, changes: [] as TrainingChange[] }
  return { player: next, changes: [Object.freeze({ playerId: player.id, clubId, date, attribute, before: player.attributes[attribute], after: next.attributes[attribute] })] }
}

/** Processa somente no dia configurado; mês registrado antes da projeção para impedir duplicação. */
export function processTrainingDate(session: PrototypeSession, date = session.game.calendar.currentDate): PrototypeSession {
  assertDate(date, 'Data de treinamento')
  if (date < session.game.calendar.currentDate) throw new Error('Treinamento não pode regredir no calendário.')
  if (Number(date.slice(8)) !== TRAINING_CONFIG.processingDay) return session
  const month = date.slice(0, 7)
  if (session.trainingCycles.some(cycle => cycle.month === month)) return session
  const changes: TrainingChange[] = []
  const youthLevel = session.facilities.find(facility => facility.clubId === session.game.humanClubId && facility.type === 'YOUTH')?.level ?? 1
  const academy = session.academy.map(record => {
    if (record.status !== 'ACADEMY' || record.academyClubId !== session.game.humanClubId) return record
    const outcome = processPlayer(record.player, record.academyClubId, 'YOUTH', date, session.careerSeed, youthLevel, TRAINING_CONFIG.youthFacilityChancePerLevel, 'academy-training')
    changes.push(...outcome.changes)
    return outcome.player === record.player ? record : Object.freeze({ ...record, player: outcome.player })
  })
  const teams = session.teams.map(team => {
    const focus = trainingFocus(session, team.club.id)
    const centerLevel = session.facilities.find(facility => facility.clubId === team.club.id && facility.type === 'TRAINING')?.level ?? 1
    const players = team.players.map(player => {
      const outcome = processPlayer(player, team.club.id, focus, date, session.careerSeed, centerLevel)
      changes.push(...outcome.changes)
      return outcome.player
    })
    return Object.freeze({ ...team, players: Object.freeze(players) })
  })
  const clubChanges = Object.freeze(Object.fromEntries(session.teams.map(team => [team.club.id, changes.filter(change => change.clubId === team.club.id).length])))
  const cycle = Object.freeze({ month, date, clubChanges, changes: Object.freeze(changes) })
  return Object.freeze({ ...session, teams: Object.freeze(teams), academy: Object.freeze(academy), trainingCycles: Object.freeze([...session.trainingCycles, cycle]), trainingHistory: Object.freeze([...session.trainingHistory, ...changes]) })
}
