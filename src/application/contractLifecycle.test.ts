import { expect, it } from 'vitest'
import { getDevelopmentClubs, humanTeam, startPrototype, advancePrototype } from './prototypeSession'
import { activeContract, clubPayroll, processContractDate, playerContractStatus } from './contractLifecycle'
import { marketContract, playerContractExpectations, renewPlayerContract, signFreeAgent } from './transferMarket'

it('expira, preserva o jogador como agente livre e permite novo vínculo sem taxa; renovação impede saída', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const player = humanTeam(original).players.find(player => marketContract(original, player.id)?.endDate === '2026-04-02')!
  const originalContract = marketContract(original, player.id)!
  expect(playerContractStatus(original, player.id)).toBe('EXPIRING')
  const renewed = renewPlayerContract(original, player.id, playerContractExpectations(original, player.id, humanTeam(original).club.id))
  const protectedSession = processContractDate(renewed, '2026-04-02')
  expect(protectedSession.freeAgents.some(item => item.id === player.id)).toBe(false)
  const expired = advancePrototype(advancePrototype(original))
  expect(expired.game.calendar.currentDate).toBe('2026-04-02')
  expect(expired.market.contracts.find(contract => contract.id === originalContract.id)?.status).toBe('EXPIRED')
  expect(activeContract(expired, player.id)).toBeUndefined()
  expect(playerContractStatus(expired, player.id)).toBe('FREE_AGENT')
  expect(expired.freeAgents.find(item => item.id === player.id)?.clubId).toBeNull()
  expect(expired.teams.every(team => !team.club.playerIds.includes(player.id) && !team.lineup.startingPlayers.includes(player.id) && !team.lineup.bench.includes(player.id))).toBe(true)
  expect(clubPayroll(expired, humanTeam(expired).club.id).current).toBe(clubPayroll(original, humanTeam(original).club.id).current - originalContract.salary.cents)
  const finances = humanTeam(expired).club.finances
  const signed = signFreeAgent(expired, player.id, playerContractExpectations(expired, player.id, humanTeam(expired).club.id))
  expect(signed.freeAgents.some(item => item.id === player.id)).toBe(false)
  expect(marketContract(signed, player.id)?.clubId).toBe(humanTeam(signed).club.id)
  expect(signed.teams.flatMap(team => team.players).filter(item => item.id === player.id)).toHaveLength(1)
  expect(humanTeam(signed).club.finances).toEqual(finances)
  expect(() => signFreeAgent(signed, player.id, playerContractExpectations(signed, player.id, humanTeam(signed).club.id))).toThrow('disponível')
})

it('cobra folha ativa uma vez por clube/mês, respeitando expiração e data configurada', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const club = humanTeam(original).club
  const wages = clubPayroll(original, club.id).current
  const april = advancePrototype(original)
  expect(april.game.calendar.currentDate).toBe('2026-04-01')
  expect(humanTeam(april).club.finances.cashBalance.cents).toBe(club.finances.cashBalance.cents - wages)
  const again = processContractDate(april, '2026-04-01')
  expect(again.financialTransactions).toEqual(april.financialTransactions)
  expect(humanTeam(again).club.finances).toEqual(humanTeam(april).club.finances)
  const may = processContractDate(april, '2026-05-01')
  const mayWages = clubPayroll(may, club.id, '2026-05-01').current
  expect(humanTeam(may).club.finances.cashBalance.cents).toBe(club.finances.cashBalance.cents - wages - mayWages)
  expect(may.financialTransactions.filter(item => item.clubId === club.id)).toHaveLength(2)
  const custom = processContractDate(original, '2026-04-03', 3)
  expect(custom.financialTransactions.find(item => item.clubId === club.id)?.amount.cents).toBe(clubPayroll(custom, club.id, '2026-04-03').current)
  expect(custom.financialTransactions[0].date).toBe('2026-04-03')
})
