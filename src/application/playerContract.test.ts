import { expect, it } from 'vitest'
import { getDevelopmentClubs, humanTeam, startPrototype } from './prototypeSession'
import { completeTransfer, marketAskingFee, marketContract, offerPlayerContract, playerContractExpectations, previewPlayerContract, renewPlayerContract, sendTransferOffer } from './transferMarket'
import { contractEndDate } from '../transfers/playerContract'

it('exige aceite do jogador e mantém elencos/dinheiro intactos ao rejeitar ou contrapropor', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const player = original.teams[1].players[10]
  let session = sendTransferOffer(original, player.id, marketAskingFee(original, player.id).cents)
  const id = session.market.negotiations[0].negotiationId
  const terms = playerContractExpectations(session, player.id, humanTeam(session).club.id)
  expect(session.market.negotiations[0].status).toBe('CLUB_ACCEPTED')
  expect(() => completeTransfer(session, id)).toThrow('jogador devem aceitar')
  session = offerPlayerContract(session, id, { ...terms, salaryCents: 0 })
  expect(session.market.negotiations[0].contractOffer?.status).toBe('REJECTED')
  session = offerPlayerContract(session, id, { ...terms, salaryCents: Math.floor(terms.salaryCents * .8), years: 5, squadRole: 'PROSPECT' })
  const response = session.market.negotiations[0].contractOffer!
  expect(response.status).toBe('COUNTERED')
  expect(response.counter).toEqual(terms)
  expect(() => completeTransfer(session, id)).toThrow('jogador devem aceitar')
  expect(session.teams).toEqual(original.teams)
  expect(session.market.history).toHaveLength(0)
  session = offerPlayerContract(session, id, response.counter!)
  expect(session.market.negotiations[0].contractOffer?.status).toBe('ACCEPTED')
  const poor = { ...session, teams: session.teams.map(team => team.club.id === humanTeam(session).club.id ? { ...team, club: { ...team.club, finances: { ...team.club.finances, wageBudget: { cents: 0 as typeof team.club.finances.wageBudget.cents } } } } : team) }
  expect(() => completeTransfer(poor, id)).toThrow('Orçamento salarial insuficiente')
})

it('assina vínculo correto e renova sem duplicar contrato ativo ou cobrar outra transferência', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const player = original.teams[1].players[10]
  let session = sendTransferOffer(original, player.id, marketAskingFee(original, player.id).cents)
  const id = session.market.negotiations[0].negotiationId
  const expected = playerContractExpectations(session, player.id, humanTeam(session).club.id)
  session = completeTransfer(offerPlayerContract(session, id, expected), id)
  const contract = marketContract(session, player.id)!
  expect(contract).toMatchObject({ playerId: player.id, clubId: humanTeam(session).club.id, squadRole: expected.squadRole, salary: { cents: expected.salaryCents }, startDate: original.game.calendar.currentDate, endDate: contractEndDate(original.game.calendar.currentDate, expected.years) })
  expect(session.teams.flatMap(team => team.players).filter(item => item.id === player.id)).toHaveLength(1)
  expect(() => completeTransfer(session, id)).toThrow('encerrada')
  const before = humanTeam(session).club.finances
  const terms = playerContractExpectations(session, player.id, humanTeam(session).club.id)
  expect(previewPlayerContract(session, player.id, humanTeam(session).club.id, terms).status).toBe('ACCEPTED')
  session = renewPlayerContract(session, player.id, terms)
  expect(session.market.contracts.filter(item => item.playerId === player.id && item.status === 'ACTIVE')).toHaveLength(1)
  expect(session.market.contracts.find(item => item.id === contract.id)?.status).toBe('TERMINATED')
  expect(humanTeam(session).club.finances).toEqual(before)
  expect(session.market.history).toHaveLength(1)
  expect(() => renewPlayerContract(session, player.id, { ...terms, years: 6 })).toThrow()
  expect(contractEndDate('2028-02-29', 1)).toBe('2029-02-28')
})
