import { expect, it } from 'vitest'
import { getDevelopmentClubs, humanTeam, startPrototype } from './prototypeSession'
import { financialHealth } from './financialHealth'
import { developmentFinanceScenario } from './developmentFinanceScenario'
import { completeTransfer, marketAskingFee, offerPlayerContract, playerContractExpectations, previewPlayerContract, renewPlayerContract, sendTransferOffer } from './transferMarket'
import { createMoneyFromCents } from '../core/money'

it('restringe compras em caixa crítico ou sem reserva, sem alterar caixa, contratos ou ledger', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const critical = developmentFinanceScenario(original, 'critical')
  const club = humanTeam(critical).club
  const player = original.teams[1].players[10]
  const health = financialHealth(critical, club.id)
  expect(health.status).toBe('CRITICAL')
  expect(health.availableTransferBudget).toBe(0)
  expect(health.cash).toBe(50000)
  expect(health.projection3).toBeLessThan(0)
  expect(health.alerts.join(' ')).toContain('Situação financeira crítica')
  expect(() => sendTransferOffer(critical, player.id, marketAskingFee(critical, player.id).cents)).toThrow('Orçamento disponível insuficiente')
  let accepted = sendTransferOffer(original, player.id, marketAskingFee(original, player.id).cents)
  const id = accepted.market.negotiations[0].negotiationId
  accepted = offerPlayerContract(accepted, id, playerContractExpectations(accepted, player.id, humanTeam(accepted).club.id))
  expect(() => completeTransfer(developmentFinanceScenario(accepted, 'critical'), id)).toThrow('crítica')
  const own = humanTeam(critical).players[0]
  expect(() => renewPlayerContract(critical, own.id, playerContractExpectations(critical, own.id, club.id))).toThrow('crítica')
  const limited = { ...original, teams: original.teams.map(team => team.club.id === club.id ? { ...team, club: { ...team.club, finances: { ...team.club.finances, cashBalance: createMoneyFromCents(30000000) } } } : team) }
  expect(financialHealth(limited, club.id)).toMatchObject({ status: 'WARNING', reserve: 7900000, availableTransferBudget: 22100000 })
  expect(() => sendTransferOffer(limited, player.id, 22100001)).toThrow('Orçamento disponível insuficiente')
  expect(humanTeam(critical).club.finances.cashBalance.cents).toBe(50000)
  expect(critical.market).toBe(original.market)
  expect(critical.financialTransactions).toBe(original.financialTransactions)
})

it('bloqueia aumento de folha acima do teto, inclusive assinatura após aceite, sem criar vínculo', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const over = developmentFinanceScenario(original, 'payroll')
  const club = humanTeam(over).club
  const own = humanTeam(over).players[0]
  expect(financialHealth(over, club.id).status).toBe('WARNING')
  expect(financialHealth(over, club.id).alerts.join(' ')).toContain('Folha salarial acima do limite')
  const terms = playerContractExpectations(over, own.id, club.id)
  expect(() => renewPlayerContract(over, own.id, terms)).toThrow('Não há espaço suficiente na folha salarial')
  expect(() => previewPlayerContract(over, own.id, club.id, { ...terms, salaryCents: original.market.contracts.find(item => item.playerId === own.id)!.salary.cents })).not.toThrow()
  const player = original.teams[1].players[10]
  let pending = sendTransferOffer(original, player.id, marketAskingFee(original, player.id).cents)
  const id = pending.market.negotiations[0].negotiationId
  const expected = playerContractExpectations(pending, player.id, club.id)
  expect(() => offerPlayerContract(developmentFinanceScenario(pending, 'payroll'), id, expected)).toThrow('folha salarial')
  pending = offerPlayerContract(pending, id, expected)
  const blocked = developmentFinanceScenario(pending, 'payroll')
  expect(() => completeTransfer(blocked, id)).toThrow('folha salarial')
  expect(blocked.market.contracts).toBe(pending.market.contracts)
  expect(blocked.financialTransactions).toHaveLength(0)
  expect(humanTeam(blocked).players.some(item => item.id === player.id)).toBe(false)
  expect(over.market.contracts).toBe(original.market.contracts)
})
