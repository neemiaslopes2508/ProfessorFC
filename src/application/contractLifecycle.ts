import type { PrototypeSession } from './prototypeSession'
import type { ClubId } from '../core/ids'
import { addGameDays, differenceInGameDays } from '../core/date'
import { assertDate, assertIntegerRange } from '../core/validation'
import { createMoneyFromCents, subtractMoney } from '../core/money'
import { createContract } from '../domain/contracts'
import { createClub } from '../domain/clubs'
import { createPlayer } from '../domain/players'
import type { Player } from '../domain/players'
import type { SimulationTeam } from '../simulation'

export const CONTRACT_TIME_CONFIG = Object.freeze({ paymentDay: 1, expiringDays: 180 })
export function activeContract(session: PrototypeSession, playerId: Player['id'], date = session.game.calendar.currentDate) {
  const contracts = session.market.contracts.filter(contract => contract.playerId === playerId && contract.status === 'ACTIVE' && contract.startDate <= date && date < contract.endDate)
  if (contracts.length > 1) throw new Error('Jogador possui contratos ativos incompatíveis.')
  return contracts[0]
}
export function clubPayroll(session: PrototypeSession, clubId: ClubId, date = session.game.calendar.currentDate) {
  const team = session.teams.find(team => team.club.id === clubId)
  if (!team) throw new Error('Clube inexistente.')
  const salaries = team.players.map(player => activeContract(session, player.id, date))
  for (const contract of salaries) if (contract && contract.clubId !== clubId) throw new Error('Contrato pertence a outro clube.')
  const current = createMoneyFromCents(salaries.reduce((sum, contract) => sum + (contract?.salary.cents ?? 0), 0)).cents
  return { current, budget: team.club.finances.wageBudget.cents, available: team.club.finances.wageBudget.cents - current, incomplete: salaries.some(contract => !contract) }
}
export function playerContractStatus(session: PrototypeSession, playerId: Player['id']) {
  if (session.freeAgents.some(player => player.id === playerId)) return 'FREE_AGENT'
  const contract = activeContract(session, playerId)
  if (!contract) return session.market.contracts.some(item => item.playerId === playerId && item.status === 'EXPIRED') ? 'EXPIRED' : 'NO_CONTRACT'
  return differenceInGameDays(session.game.calendar.currentDate, contract.endDate) <= CONTRACT_TIME_CONFIG.expiringDays ? 'EXPIRING' : 'ACTIVE'
}
export function paymentDates(start: string, end: string, day: number) {
  assertIntegerRange(day, 1, 28, 'Dia mensal de pagamento')
  const dates: string[] = []
  let month = `${start.slice(0, 7)}-01`
  while (month <= end) {
    const date = `${month.slice(0, 7)}-${String(day).padStart(2, '0')}`
    if (date >= start && date <= end) dates.push(date)
    month = addGameDays(month, 32).slice(0, 7) + '-01'
  }
  return dates
}
export function nextContractDate(session: PrototypeSession, paymentDay: number = CONTRACT_TIME_CONFIG.paymentDay) {
  const current = session.game.calendar.currentDate
  const end = addGameDays(current, 62)
  const payments = paymentDates(addGameDays(current, 1), end, paymentDay)
  const expiries = session.market.contracts.filter(contract => contract.status === 'ACTIVE' && contract.endDate > current).map(contract => contract.endDate)
  return [...payments, ...expiries].sort()[0]
}
/** Remoção preserva atletas e slots restantes, mesmo se o elenco ficar insuficiente. */
function releasePlayers(team: SimulationTeam, ids: ReadonlySet<Player['id']>): SimulationTeam {
  const players = team.players.filter(player => !ids.has(player.id))
  const used = new Set(team.lineup.startingPlayers.filter(id => !ids.has(id)))
  const positions = team.lineup.positions.flatMap(slot => {
    if (!ids.has(slot.playerId)) return [slot]
    const candidates = players.filter(player => !used.has(player.id) && player.status === 'AVAILABLE')
    const replacement = candidates.find(player => player.primaryPosition === slot.position) ?? candidates.find(player => player.secondaryPositions.includes(slot.position)) ?? (slot.position === 'GK' ? undefined : candidates.find(player => player.primaryPosition !== 'GK'))
    if (!replacement) return []
    used.add(replacement.id)
    return [{ ...slot, playerId: replacement.id }]
  })
  const starters = positions.map(slot => slot.playerId)
  return Object.freeze({ ...team, players: Object.freeze(players), club: createClub({ ...team.club, playerIds: players.map(player => player.id) }), lineup: Object.freeze({ positions: Object.freeze(positions), startingPlayers: Object.freeze(starters), bench: Object.freeze(team.lineup.bench.filter(id => !ids.has(id) && !starters.includes(id))) }) })
}
/** Processa datas relevantes em ordem; ledger impede cobrança repetida por clube/mês. */
export function processContractDate(session: PrototypeSession, target: string, paymentDay: number = CONTRACT_TIME_CONFIG.paymentDay): PrototypeSession {
  assertDate(target, 'Data de contratos')
  if (target < session.game.calendar.currentDate) throw new Error('Contratos não podem regredir no tempo.')
  const dates = [...new Set([target, ...paymentDates(session.game.calendar.currentDate, target, paymentDay), ...session.market.contracts.filter(contract => contract.status === 'ACTIVE' && contract.endDate <= target).map(contract => contract.endDate < session.game.calendar.currentDate ? session.game.calendar.currentDate : contract.endDate)])].sort()
  let next = session
  for (const date of dates) {
    const expired = next.market.contracts.filter(contract => contract.status === 'ACTIVE' && contract.endDate <= date)
    const contracts = next.market.contracts.map(contract => expired.includes(contract) ? createContract({ ...contract, status: 'EXPIRED' }) : contract)
    const release = new Set(expired.filter(contract => !contracts.some(other => other.playerId === contract.playerId && other.status === 'ACTIVE' && other.startDate <= date && other.endDate > date)).map(contract => contract.playerId))
    const released = next.teams.flatMap(team => team.players.filter(player => release.has(player.id)).map(player => createPlayer({ ...player, clubId: null })))
    next = Object.freeze({ ...next, market: Object.freeze({ ...next.market, contracts: Object.freeze(contracts), listedPlayerIds: Object.freeze(next.market.listedPlayerIds.filter(id => !release.has(id))), negotiations: Object.freeze(next.market.negotiations.map(item => release.has(item.playerId) && ['PENDING', 'COUNTERED', 'CLUB_ACCEPTED'].includes(item.status) ? Object.freeze({ ...item, status: 'CANCELLED' as const }) : item)) }), freeAgents: Object.freeze([...next.freeAgents, ...released]), teams: Object.freeze(next.teams.map(team => releasePlayers(team, release))), starterSlots: released.length ? undefined : next.starterSlots })
    if (Number(date.slice(8)) === paymentDay) {
      const transactions = [...next.financialTransactions]
      const teams = next.teams.map(team => {
        const month = date.slice(0, 7), id = `wages-${team.club.id}-${month}`
        if (transactions.some(item => item.id === id)) return team
        const amount = createMoneyFromCents(clubPayroll(next, team.club.id, date).current)
        transactions.push(Object.freeze({ id, type: 'PLAYER_WAGES', clubId: team.club.id, date, month, amount }))
        return Object.freeze({ ...team, club: createClub({ ...team.club, finances: { ...team.club.finances, cashBalance: subtractMoney(team.club.finances.cashBalance, amount) } }) })
      })
      next = Object.freeze({ ...next, teams: Object.freeze(teams), financialTransactions: Object.freeze(transactions) })
    }
  }
  return next
}
