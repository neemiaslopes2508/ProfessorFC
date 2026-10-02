import type { Player, Position } from '../domain/players'
import { POSITIONS } from '../domain/players'
import { createMoneyFromCents, addMoney } from '../core/money'
import { calculatePlayerStrength } from '../simulation/strength'
import { humanTeam, playerAge } from './prototypeSession'
import type { PrototypeSession } from './prototypeSession'

/** Rating base ponderado por posição do motor, sem aplicar fitness/forma nem persistir overall. */
export function playerOverall(player: Player, position = player.primaryPosition): number {
  return Math.round(calculatePlayerStrength(player, position).attributeStrength)
}
export function positionFit(player: Player, position: Position): 'natural' | 'secondary' | 'improvised' {
  return player.primaryPosition === position ? 'natural' : player.secondaryPositions.includes(position) ? 'secondary' : 'improvised'
}
export function squadOverview(session: PrototypeSession) {
  const players = humanTeam(session).players
  return {
    count: players.length,
    averageAge: players.reduce((sum, player) => sum + playerAge(player, session.game.calendar.currentDate), 0) / players.length,
    averageOverall: players.reduce((sum, player) => sum + playerOverall(player), 0) / players.length,
    totalValue: players.reduce((sum, player) => addMoney(sum, player.marketValue), createMoneyFromCents(0)),
    available: players.filter(player => player.status === 'AVAILABLE').length,
    unavailable: players.filter(player => player.status !== 'AVAILABLE').length,
    positions: POSITIONS.map(position => ({ position, count: players.filter(player => player.primaryPosition === position).length })),
  }
}

export type SquadOrder = 'name' | 'overall' | 'fitness' | 'form' | 'age' | 'value'
export function recentForm(session: PrototypeSession): readonly ('V' | 'E' | 'D')[] {
  const view = session.game.competitions[0].league
  return view.fixtures.filter(match => [match.homeClubId, match.awayClubId].includes(session.game.humanClubId!))
    .flatMap(match => {
      const result = view.results.find(result => result.matchId === match.id)
      if (!result) return []
      const home = match.homeClubId === session.game.humanClubId
      const own = home ? result.score.homeGoals : result.score.awayGoals
      const opponent = home ? result.score.awayGoals : result.score.homeGoals
      return [own > opponent ? 'V' as const : own === opponent ? 'E' as const : 'D' as const]
    }).slice(-5)
}
export function querySquad(session: PrototypeSession, name: string, position: string, order: SquadOrder): readonly Player[] {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
  const query = normalize(name.trim())
  return humanTeam(session).players.filter(player => normalize(player.displayName).includes(query) && (position === 'ALL' || player.primaryPosition === position || player.secondaryPositions.includes(position as Position)))
    .sort((a, b) => {
      let difference = 0
      if (order === 'overall') difference = playerOverall(b) - playerOverall(a)
      if (order === 'fitness') difference = b.fitness - a.fitness
      if (order === 'form') difference = b.form - a.form
      if (order === 'age') difference = playerAge(a, session.game.calendar.currentDate) - playerAge(b, session.game.calendar.currentDate)
      if (order === 'value') difference = b.marketValue.cents - a.marketValue.cents
      return difference || a.displayName.localeCompare(b.displayName, 'pt-BR')
    })
}
