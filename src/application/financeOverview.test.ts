import { facilityMonthlyTotals } from './clubFacilities'
import { expect, it } from 'vitest'
import { advancePrototype, getDevelopmentClubs, humanTeam, startPrototype } from './prototypeSession'
import { completeTransfer, listTransferPlayer, marketAskingFee, offerPlayerContract, playerContractExpectations, refreshTransferMarket, respondTransfer, sendTransferOffer } from './transferMarket'
import { financeOverview } from './financeOverview'
import { processContractDate } from './contractLifecycle'

it('deriva balanço e filtros do ledger de compra, venda e folha, sem duplicar lançamentos', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  expect(financeOverview(original).balanceStatus).toBe('NEUTRAL')
  const player = original.teams[1].players[10]
  const purchaseFee = marketAskingFee(original, player.id).cents
  let session = sendTransferOffer(original, player.id, purchaseFee)
  const id = session.market.negotiations[0].negotiationId
  expect(session.financialTransactions).toHaveLength(0)
  session = completeTransfer(offerPlayerContract(session, id, playerContractExpectations(session, player.id, humanTeam(session).club.id)), id)
  expect(financeOverview(session)).toMatchObject({ income: 0, expenses: purchaseFee, balance: -purchaseFee, purchases: purchaseFee, sales: 0, balanceStatus: 'NEGATIVE' })
  expect(financeOverview(session).transactions).toHaveLength(1)
  expect(() => completeTransfer(session, id)).toThrow('encerrada')
  session = refreshTransferMarket(listTransferPlayer(session, player.id))
  const received = session.market.negotiations.at(-1)!
  session = completeTransfer(respondTransfer(session, received.negotiationId, 'accept'), received.negotiationId)
  const march = financeOverview(session)
  expect(march).toMatchObject({ income: received.offeredFee.cents, expenses: purchaseFee, balance: received.offeredFee.cents - purchaseFee, purchases: purchaseFee, sales: received.offeredFee.cents })
  expect(march.club.finances.cashBalance.cents).toBe(humanTeam(original).club.finances.cashBalance.cents + march.balance)
  expect(march.transactions.map(item => item.type).sort()).toEqual(['PLAYER_PURCHASE', 'PLAYER_SALE'])
  expect(financeOverview(session, 'MONTH', 'INCOME').transactions.map(item => item.type)).toEqual(['PLAYER_SALE'])
  expect(financeOverview(session, 'MONTH', 'EXPENSE').transactions.map(item => item.type)).toEqual(['PLAYER_PURCHASE'])
  const payroll = march.payroll.current
  session = advancePrototype(session)
  const april = financeOverview(session)
  const sponsorship = session.seasonRevenue.sponsors.find(item => item.clubId === april.club.id)!.monthlyCents
  const structure = facilityMonthlyTotals(session, april.club.id)
  expect(april).toMatchObject({ income: sponsorship + structure.income, expenses: payroll + structure.maintenance, balance: sponsorship + structure.income - payroll - structure.maintenance, seasonIncome: sponsorship + structure.income + received.offeredFee.cents })
  expect(april.transactions.map(item => item.type)).toEqual(['FACILITY_MAINTENANCE', 'MERCHANDISING', 'SPONSORSHIP', 'PLAYER_WAGES'])
  expect(financeOverview(session, 'SEASON').transactions).toHaveLength(6)
  expect(processContractDate(session, session.game.calendar.currentDate).financialTransactions).toEqual(session.financialTransactions)
  expect(new Set(session.financialTransactions.map(item => item.id)).size).toBe(session.financialTransactions.length)
})
