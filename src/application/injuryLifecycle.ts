import type { PrototypeSession } from './prototypeSession'
import type { ClubId, MatchId, PlayerId } from '../core/ids'
import { differenceInGameDays } from '../core/date'
import { createPlayer } from '../domain/players'
import type { MatchEvent } from '../domain/matches'
import { createInjury, INJURY_CATALOG } from '../domain/players/injury'
import type { Injury } from '../domain/players/injury'
import { assertDate } from '../core/validation'

export function currentPlayerInjury(session: PrototypeSession, playerId: PlayerId): Injury | undefined {
  return [...session.injuries].reverse().find(injury => injury.playerId === playerId && injury.status !== 'HEALED')
}
export function injuryOverview(injury: Injury, date: string) {
  return { ...injury, label: INJURY_CATALOG.find(item => item.type === injury.injuryType)!.label, remainingDays: Math.max(0, differenceInGameDays(date, injury.availableAt)) }
}
export function medicalLevel(session: PrototypeSession, clubId: ClubId): number {
  return session.facilities.find(item => item.clubId === clubId && item.type === 'MEDICAL')?.level ?? 1
}
/** Chave de origem estável: snapshots repetidos e confirmação não duplicam a lesão. */
export function registerMatchInjuries(session: PrototypeSession, matchId: MatchId, events: readonly MatchEvent[], date: string): PrototypeSession {
  const injuries = [...session.injuries]
  for (const event of events) {
    if (event.type !== 'INJURY' || !event.playerId) continue
    const id = 'injury-' + matchId + '-' + event.minute + '-' + event.playerId
    if (injuries.some(injury => injury.id === id)) continue
    const definition = INJURY_CATALOG.find(item => item.type === event.metadata?.injuryType)
    const player = [...session.teams.flatMap(team => team.players), ...session.freeAgents].find(player => player.id === event.playerId)
    if (!definition || !player || !session.teams.some(team => team.club.id === event.clubId && team.players.some(player => player.id === event.playerId))) throw new Error('Evento de lesão possui referência inválida.')
    const baseDays = event.metadata?.baseDays
    if (typeof baseDays !== 'number' || event.metadata?.severity !== definition.severity) throw new Error('Dados de lesão inválidos.')
    injuries.push(createInjury({ id, playerId: player.id, injuryType: definition.type, severity: definition.severity, occurredAt: date, baseDays, medicalLevel: medicalLevel(session, event.clubId) }))
  }
  if (injuries.length === session.injuries.length) return session
  return projectInjuryStatuses(Object.freeze({ ...session, injuries: Object.freeze(injuries) }))
}
function projectInjuryStatuses(session: PrototypeSession): PrototypeSession {
  const update = (player: PrototypeSession['freeAgents'][number]) => {
    const injury = [...session.injuries].reverse().find(item => item.playerId === player.id)
    if (!injury) return player
    const status = injury.status === 'HEALED' ? (player.status === 'INJURED' || player.status === 'RECOVERING' ? 'AVAILABLE' : player.status) : injury.status
    return player.status === status ? player : createPlayer({ ...player, status })
  }
  return Object.freeze({ ...session, freeAgents: Object.freeze(session.freeAgents.map(update)), teams: Object.freeze(session.teams.map(team => {
    const players = Object.freeze(team.players.map(update))
    const available = new Set(players.filter(player => player.status === 'AVAILABLE').map(player => player.id))
    return Object.freeze({ ...team, players, lineup: Object.freeze({ ...team.lineup, bench: Object.freeze(team.lineup.bench.filter(id => available.has(id))) }) })
  })) })
}
export function processInjuryDate(session: PrototypeSession, date = session.game.calendar.currentDate): PrototypeSession {
  assertDate(date, 'Data de recuperação')
  if (date < session.game.calendar.currentDate) throw new Error('Recuperação não pode regredir no tempo.')
  const injuries = session.injuries.map(injury => {
    const status = date >= injury.availableAt ? 'HEALED' : date >= injury.expectedRecoveryDate ? 'RECOVERING' : 'INJURED'
    return injury.status === 'HEALED' || injury.status === status ? injury : Object.freeze({ ...injury, status } as Injury)
  })
  if (injuries.every((injury, index) => injury === session.injuries[index])) return session
  return projectInjuryStatuses(Object.freeze({ ...session, injuries: Object.freeze(injuries) }))
}
export function nextInjuryDate(session: PrototypeSession): string | undefined {
  return session.injuries.filter(injury => injury.status !== 'HEALED').map(injury => injury.status === 'INJURED' ? injury.expectedRecoveryDate : injury.availableAt).filter(date => date > session.game.calendar.currentDate).sort()[0]
}
/** Inclui resultados CPU já confirmados e conserva o histórico da carreira. */
export function collectCompetitionInjuries(session: PrototypeSession): PrototypeSession {
  let next = session
  for (const { league, schedule } of session.game.competitions) {
    for (const result of league.results) {
      const date = schedule.matches.find(match => match.matchId === result.matchId)!.date
      next = registerMatchInjuries(next, result.matchId, result.events, date)
    }
  }
  return processInjuryDate(next)
}
