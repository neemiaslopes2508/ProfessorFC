import { expect, it } from 'vitest'
import { getDevelopmentClubs, humanTeam, startPrototype } from './prototypeSession'
import { completeTransfer, listTransferPlayer, marketAskingFee, refreshTransferMarket, respondTransfer, sendTransferOffer, offerPlayerContract, playerContractExpectations } from './transferMarket'

it('negocia compra e venda, move um único jogador e atualiza elencos, contratos e dinheiro', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const seller = original.teams[1]
  const player = seller.players.find(player => seller.lineup.startingPlayers.includes(player.id))!
  const value = player.marketValue.cents
  let session = sendTransferOffer(original, player.id, value)
  const offer = session.market.negotiations[0]
  expect(offer.status).toBe('COUNTERED')
  const fee = marketAskingFee(session, player.id).cents
  session = respondTransfer(session, offer.negotiationId, 'accept')
  session = offerPlayerContract(session, offer.negotiationId, playerContractExpectations(session, player.id, humanTeam(session).club.id))
  session = completeTransfer(session, offer.negotiationId)
  expect(humanTeam(session).players.find(item => item.id === player.id)?.clubId).toBe(humanTeam(session).club.id)
  expect(session.teams[1].club.playerIds).not.toContain(player.id)
  expect(session.teams[1].lineup.startingPlayers).not.toContain(player.id)
  expect(session.teams[1].players).toHaveLength(seller.players.length - 1)
  expect(session.teams.flatMap(team => team.players).filter(item => item.id === player.id)).toHaveLength(1)
  expect(humanTeam(session).club.finances.transferBudget.cents).toBe(humanTeam(original).club.finances.transferBudget.cents - fee)
  expect(session.teams[1].club.finances.cashBalance.cents).toBe(seller.club.finances.cashBalance.cents + fee)
  expect(session.market.contracts.find(contract => contract.playerId === player.id && contract.status === 'ACTIVE')).toMatchObject({ playerId: player.id, clubId: humanTeam(session).club.id, status: 'ACTIVE' })
  expect(session.market.history[0]).toMatchObject({ playerId: player.id, fromClubId: seller.club.id, toClubId: humanTeam(session).club.id, date: original.game.calendar.currentDate })
  expect(original.teams[1].club.playerIds).toContain(player.id)

  session = refreshTransferMarket(listTransferPlayer(session, player.id))
  const received = session.market.negotiations.at(-1)!
  const beforeSale = humanTeam(session).club.finances.transferBudget.cents
  session = completeTransfer(respondTransfer(session, received.negotiationId, 'accept'), received.negotiationId)
  expect(humanTeam(session).players.some(item => item.id === player.id)).toBe(false)
  expect(humanTeam(session).club.finances.transferBudget.cents).toBe(beforeSale + received.offeredFee.cents)
  expect(session.market.listedPlayerIds).not.toContain(player.id)
  expect(session.market.history).toHaveLength(2)
  expect(session.market.contracts.filter(item => item.playerId === player.id && item.status === 'ACTIVE')).toHaveLength(1)
})

it('bloqueia compra própria, dinheiro inválido/insuficiente e conclusão duplicada ou sem orçamento', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const player = original.teams[1].players[0]
  expect(() => sendTransferOffer(original, humanTeam(original).players[0].id, 1)).toThrow('próprio jogador')
  expect(() => sendTransferOffer(original, player.id, -1)).toThrow('negativo')
  expect(() => sendTransferOffer(original, player.id, 1.5)).toThrow('centavos inteiros')
  expect(() => sendTransferOffer(original, player.id, humanTeam(original).club.finances.transferBudget.cents + 1)).toThrow('insuficiente')
  const clubAccepted = sendTransferOffer(original, player.id, marketAskingFee(original, player.id).cents)
  const pending = offerPlayerContract(clubAccepted, clubAccepted.market.negotiations[0].negotiationId, playerContractExpectations(clubAccepted, player.id, humanTeam(clubAccepted).club.id))
  const id = pending.market.negotiations[0].negotiationId
  const unavailable = { ...pending, teams: pending.teams.map(team => team.club.id === original.game.humanClubId ? { ...team, club: { ...team.club, finances: { ...team.club.finances, transferBudget: { cents: 0 as typeof team.club.finances.transferBudget.cents } } } } : team) }
  expect(() => completeTransfer(unavailable, id)).toThrow('insuficiente')
  expect(pending.market.history).toHaveLength(0)
  expect(pending.teams[1].club.playerIds).toContain(player.id)
  const completed = completeTransfer(pending, id)
  expect(() => completeTransfer(completed, id)).toThrow('encerrada')
  expect(completed.market.history).toHaveLength(1)
})
