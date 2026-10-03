import type { ClubId, ContractId, PlayerId } from '../core/ids'
import { createMoneyFromCents, addMoney, subtractMoney, assertNonNegativeMoney } from '../core/money'
import { contractEndDate, contractExpectations, evaluateContract } from '../transfers/playerContract'
import type { ContractTerms } from '../transfers/playerContract'
import { createClub } from '../domain/clubs'
import { createPlayer } from '../domain/players'
import { createContract } from '../domain/contracts'
import { createLineup, validateTeamSelection } from '../domain/tactics'
import type { SimulationTeam } from '../simulation'
import { askingFee, evaluateOffer, TRANSFER_CONFIG } from '../transfers/valuation'
import type { TransferMarket, TransferNegotiation } from '../transfers/types'
import { humanTeam, playerAge } from './prototypeSession'
import type { PrototypeSession } from './prototypeSession'
import { playerOverall } from './teamOverview'
import { activeContract, clubPayroll } from './contractLifecycle'
import { financialHealth } from './financialHealth'

function update(session: PrototypeSession, market: TransferMarket): PrototypeSession {
  return Object.freeze({ ...session, market: Object.freeze({ listedPlayerIds: Object.freeze([...market.listedPlayerIds]), negotiations: Object.freeze([...market.negotiations]), history: Object.freeze([...market.history]), contracts: Object.freeze([...market.contracts]) }) })
}
function lookup(session: PrototypeSession, playerId: PlayerId) {
  const seller = session.teams.find(team => team.players.some(player => player.id === playerId))
  const player = seller?.players.find(player => player.id === playerId)
  if (!seller || !player || player.clubId !== seller.club.id || !seller.club.playerIds.includes(playerId)) throw new Error('Jogador ou clube vendedor inexistente/inconsistente.')
  return { seller, player }
}
function budget(session: PrototypeSession, clubId: ClubId, cents: number, projectedPayroll?: number) {
  const fee = createMoneyFromCents(cents)
  assertNonNegativeMoney(fee, 'Proposta')
  const team = session.teams.find(team => team.club.id === clubId)
  if (!team) throw new Error('Clube comprador inexistente.')
  if (fee.cents > team.club.finances.transferBudget.cents) throw new Error('Orçamento de transferências insuficiente.')
  if (fee.cents > financialHealth(session, clubId, projectedPayroll).availableTransferBudget) throw new Error('Orçamento disponível insuficiente: o caixa deve preservar a reserva salarial; compras são bloqueadas em situação crítica.')
  return fee
}
function negotiation(session: PrototypeSession, id: string) {
  const value = session.market.negotiations.find(item => item.negotiationId === id)
  if (!value) throw new Error('Negociação inexistente.')
  if (['COMPLETED', 'CANCELLED'].includes(value.status)) throw new Error('Negociação já encerrada.')
  return value
}
function replace(session: PrototypeSession, value: TransferNegotiation) {
  return update(session, { ...session.market, negotiations: session.market.negotiations.map(item => item.negotiationId === value.negotiationId ? Object.freeze(value) : item) })
}
export function marketContract(session: PrototypeSession, playerId: PlayerId) {
  return activeContract(session, playerId)
}
export function playerContractExpectations(session: PrototypeSession, playerId: PlayerId, destinationId: ClubId) {
  const destination = session.teams.find(team => team.club.id === destinationId)
  if (!destination) throw new Error('Clube de destino inexistente.')
  const free = session.freeAgents.find(player => player.id === playerId)
  const owned = free ? undefined : lookup(session, playerId)
  const player = free ?? owned!.player
  const current = marketContract(session, playerId)
  return contractExpectations({ overall: playerOverall(player), age: playerAge(player, session.game.calendar.currentDate), marketValueCents: player.marketValue.cents, currentSalaryCents: current?.salary.cents, currentRole: current?.squadRole, originReputation: owned?.seller.club.reputation ?? destination.club.reputation, destinationReputation: destination.club.reputation })
}
export function contractPayroll(session: PrototypeSession, playerId: PlayerId, clubId: ClubId, salaryCents: number) {
  const team = session.teams.find(team => team.club.id === clubId)
  if (!team) throw new Error('Clube inexistente.')
  const current = clubPayroll(session, clubId).current
  const previous = team.club.playerIds.includes(playerId) ? marketContract(session, playerId)?.salary.cents ?? 0 : 0
  const total = current - previous + salaryCents
  if (!Number.isSafeInteger(total)) throw new Error('Folha salarial fora do limite seguro.')
  return { current, previous, delta: salaryCents - previous, total, budget: team.club.finances.wageBudget.cents, incomplete: team.players.some(player => !marketContract(session, player.id)) }
}
function validateContractPayroll(session: PrototypeSession, playerId: PlayerId, clubId: ClubId, salaryCents: number) {
  assertNonNegativeMoney(createMoneyFromCents(salaryCents), 'Salário')
  const payroll = contractPayroll(session, playerId, clubId, salaryCents)
  if (payroll.delta > 0 && payroll.total > payroll.budget) throw new Error('Orçamento salarial insuficiente. Não há espaço suficiente na folha salarial.')
  if (payroll.delta > 0 && financialHealth(session, clubId, payroll.total).status === 'CRITICAL') throw new Error('Situação financeira crítica: não é possível aumentar a folha salarial.')
}
export function offerPlayerContract(session: PrototypeSession, id: string, terms: ContractTerms): PrototypeSession {
  const value = negotiation(session, id)
  if (value.status !== 'CLUB_ACCEPTED' || value.buyingClubId !== session.game.humanClubId) throw new Error('Negociação de contrato indisponível.')
  const { seller } = lookup(session, value.playerId)
  if (seller.club.id !== value.sellingClubId) throw new Error('Jogador já mudou de clube.')
  const response = evaluateContract(terms, playerContractExpectations(session, value.playerId, value.buyingClubId))
  validateContractPayroll(session, value.playerId, value.buyingClubId, terms.salaryCents)
  return replace(session, { ...value, contractOffer: response })
}
export function previewPlayerContract(session: PrototypeSession, playerId: PlayerId, clubId: ClubId, terms: ContractTerms) {
  const response = evaluateContract(terms, playerContractExpectations(session, playerId, clubId))
  validateContractPayroll(session, playerId, clubId, terms.salaryCents)
  return response
}
export function renewPlayerContract(session: PrototypeSession, playerId: PlayerId, terms: ContractTerms): PrototypeSession {
  if (session.liveMatch || session.pendingMatch) throw new Error('Conclua a partida antes de assinar o contrato.')
  const { seller } = lookup(session, playerId)
  if (seller.club.id !== session.game.humanClubId) throw new Error('Só é possível renovar com jogador do próprio clube.')
  if (evaluateContract(terms, playerContractExpectations(session, playerId, seller.club.id)).status !== 'ACCEPTED') throw new Error('O jogador ainda não aceitou os termos.')
  validateContractPayroll(session, playerId, seller.club.id, terms.salaryCents)
  const old = marketContract(session, playerId)
  const date = session.game.calendar.currentDate
  const contract = createContract({ id: `renewal-contract-${session.market.contracts.length + 1}` as ContractId, playerId, clubId: seller.club.id, startDate: date, endDate: contractEndDate(date, terms.years), salary: createMoneyFromCents(terms.salaryCents), squadRole: terms.squadRole, status: 'ACTIVE' })
  return update(session, { ...session.market, contracts: [...session.market.contracts.map(item => item.id === old?.id ? createContract({ ...item, status: 'TERMINATED' }) : item), contract] })
}
export function signFreeAgent(session: PrototypeSession, playerId: PlayerId, terms: ContractTerms): PrototypeSession {
  if (session.liveMatch || session.pendingMatch) throw new Error('Conclua a partida antes de assinar o contrato.')
  const player = session.freeAgents.find(player => player.id === playerId)
  if (!player || player.clubId !== null || session.teams.some(team => team.players.some(item => item.id === playerId) || team.club.playerIds.includes(playerId))) throw new Error('Jogador não é agente livre disponível.')
  if (session.market.contracts.some(contract => contract.playerId === playerId && contract.status === 'ACTIVE')) throw new Error('Jogador possui vínculo ativo.')
  const buyer = humanTeam(session)
  if (previewPlayerContract(session, playerId, buyer.club.id, terms).status !== 'ACCEPTED') throw new Error('O jogador ainda não aceitou os termos.')
  const date = session.game.calendar.currentDate
  const contract = createContract({ id: `free-contract-${session.market.contracts.length + 1}` as ContractId, playerId, clubId: buyer.club.id, startDate: date, endDate: contractEndDate(date, terms.years), salary: createMoneyFromCents(terms.salaryCents), squadRole: terms.squadRole, status: 'ACTIVE' })
  const moved = createPlayer({ ...player, clubId: buyer.club.id })
  const teams = session.teams.map(team => team.club.id === buyer.club.id ? Object.freeze({ ...team, players: Object.freeze([...team.players, moved]), club: createClub({ ...team.club, playerIds: [...team.club.playerIds, playerId] }), lineup: Object.freeze({ ...team.lineup, bench: Object.freeze([...team.lineup.bench, playerId]) }) }) : team)
  return update(Object.freeze({ ...session, teams: Object.freeze(teams), freeAgents: Object.freeze(session.freeAgents.filter(player => player.id !== playerId)) }), { ...session.market, contracts: [...session.market.contracts, contract] })
}
export function marketAskingFee(session: PrototypeSession, playerId: PlayerId) {
  const { player, seller } = lookup(session, playerId)
  return askingFee(player, playerAge(player, session.game.calendar.currentDate), seller.lineup.startingPlayers.includes(playerId), session.game.calendar.currentDate, marketContract(session, playerId))
}
export function sendTransferOffer(session: PrototypeSession, playerId: PlayerId, cents: number, existingId?: string): PrototypeSession {
  const { seller } = lookup(session, playerId)
  const buyer = humanTeam(session).club.id
  if (buyer === seller.club.id) throw new Error('Clube não pode comprar seu próprio jogador.')
  const offeredFee = budget(session, buyer, cents)
  const existing = existingId ? negotiation(session, existingId) : undefined
  if (existing && (existing.buyingClubId !== buyer || existing.playerId !== playerId || existing.sellingClubId !== seller.club.id || !['COUNTERED', 'REJECTED'].includes(existing.status))) throw new Error('Esta negociação não permite nova proposta.')
  if (!existing && session.market.negotiations.some(item => item.playerId === playerId && item.buyingClubId === buyer && ['PENDING', 'CLUB_ACCEPTED', 'COUNTERED'].includes(item.status))) throw new Error('Já existe uma negociação ativa para este jogador.')
  const asking = marketAskingFee(session, playerId)
  const assessment = evaluateOffer(cents, asking.cents)
  const status = assessment === 'ACCEPTED' ? 'CLUB_ACCEPTED' : assessment
  const value: TransferNegotiation = Object.freeze({ negotiationId: existing?.negotiationId ?? `negotiation-${session.market.negotiations.length + 1}`, playerId, buyingClubId: buyer, sellingClubId: seller.club.id, offeredFee, status, counterFee: status === 'COUNTERED' ? asking : undefined })
  return existing ? replace(session, value) : update(session, { ...session.market, negotiations: [...session.market.negotiations, value] })
}
export function respondTransfer(session: PrototypeSession, id: string, action: 'accept' | 'reject' | 'cancel' | 'counter', cents?: number): PrototypeSession {
  const value = negotiation(session, id)
  const human = humanTeam(session).club.id
  if (![value.buyingClubId, value.sellingClubId].includes(human)) throw new Error('Negociação não pertence ao seu clube.')
  const { seller } = lookup(session, value.playerId)
  if (seller.club.id !== value.sellingClubId) throw new Error('Jogador já mudou de clube.')
  if (action === 'cancel') return replace(session, { ...value, status: 'CANCELLED' })
  if (value.status === 'REJECTED' || value.status === 'CLUB_ACCEPTED') throw new Error('Resposta incompatível com o estado da negociação.')
  if (action === 'reject') return replace(session, { ...value, status: 'REJECTED' })
  if (action === 'counter') {
    if (human !== value.sellingClubId || cents === undefined) throw new Error('Somente o vendedor pode contrapropor aqui.')
    const counterFee = createMoneyFromCents(cents)
    assertNonNegativeMoney(counterFee, 'Contraproposta')
    const buyer = session.teams.find(team => team.club.id === value.buyingClubId)
    if (!buyer) throw new Error('Clube comprador inexistente.')
    const accepts = cents <= financialHealth(session, buyer.club.id).availableTransferBudget && cents <= Math.round(marketAskingFee(session, value.playerId).cents * TRANSFER_CONFIG.cpuCounterLimitBasisPoints / 10000)
    return replace(session, { ...value, counterFee, offeredFee: accepts ? counterFee : value.offeredFee, status: accepts ? 'CLUB_ACCEPTED' : 'REJECTED', contractOffer: accepts ? evaluateContract(playerContractExpectations(session, value.playerId, value.buyingClubId), playerContractExpectations(session, value.playerId, value.buyingClubId)) : undefined })
  }
  if (human === value.buyingClubId && (value.status !== 'COUNTERED' || !value.counterFee)) throw new Error('Nenhuma contraproposta disponível.')
  const fee = human === value.buyingClubId ? value.counterFee! : value.offeredFee
  budget(session, value.buyingClubId, fee.cents)
  return replace(session, { ...value, offeredFee: fee, status: 'CLUB_ACCEPTED', contractOffer: human === value.sellingClubId ? evaluateContract(playerContractExpectations(session, value.playerId, value.buyingClubId), playerContractExpectations(session, value.playerId, value.buyingClubId)) : undefined })
}
export function listTransferPlayer(session: PrototypeSession, playerId: PlayerId): PrototypeSession {
  const { seller } = lookup(session, playerId)
  if (seller.club.id !== session.game.humanClubId) throw new Error('Só é possível listar jogador do próprio clube.')
  const listed = session.market.listedPlayerIds.includes(playerId)
  return update(session, { ...session.market, listedPlayerIds: listed ? session.market.listedPlayerIds.filter(id => id !== playerId) : [...session.market.listedPlayerIds, playerId] })
}
export function refreshTransferMarket(session: PrototypeSession): PrototypeSession {
  let next = session
  for (const playerId of session.market.listedPlayerIds) {
    const { seller } = lookup(next, playerId)
    if (next.market.negotiations.some(item => item.playerId === playerId && ['PENDING', 'COUNTERED', 'CLUB_ACCEPTED'].includes(item.status))) continue
    const cents = Math.round(marketAskingFee(next, playerId).cents * TRANSFER_CONFIG.cpuOfferBasisPoints / 10000)
    const buyer = next.teams.filter(team => team.club.id !== seller.club.id && financialHealth(next, team.club.id).availableTransferBudget >= cents).sort((a, b) => b.club.reputation - a.club.reputation || a.club.id.localeCompare(b.club.id))[0]
    if (!buyer) continue
    const value: TransferNegotiation = Object.freeze({ negotiationId: `negotiation-${next.market.negotiations.length + 1}`, playerId, buyingClubId: buyer.club.id, sellingClubId: seller.club.id, offeredFee: budget(next, buyer.club.id, cents), status: 'PENDING' })
    next = update(next, { ...next.market, negotiations: [...next.market.negotiations, value] })
  }
  return next
}
function removeFromLineup(team: SimulationTeam, playerId: PlayerId) {
  const positions = team.lineup.positions.map(slot => {
    if (slot.playerId !== playerId) return slot
    const candidates = team.players.filter(player => player.id !== playerId && !team.lineup.startingPlayers.includes(player.id) && player.status === 'AVAILABLE')
    const replacement = candidates.find(player => player.primaryPosition === slot.position) ?? candidates.find(player => player.secondaryPositions.includes(slot.position)) ?? (slot.position === 'GK' ? undefined : candidates.find(player => player.primaryPosition !== 'GK'))
    if (!replacement) throw new Error('Venda deixaria a escalação sem substituto disponível. Reorganize o elenco antes de vender.')
    return { ...slot, playerId: replacement.id }
  })
  const starters = positions.map(slot => slot.playerId)
  return createLineup({ positions, startingPlayers: starters, bench: team.lineup.bench.filter(id => id !== playerId && !starters.includes(id)) })
}
export function completeTransfer(session: PrototypeSession, id: string): PrototypeSession {
  if (session.liveMatch || session.pendingMatch) throw new Error('Conclua e confirme a partida antes de concluir uma transferência.')
  const value = negotiation(session, id)
  if (value.status !== 'CLUB_ACCEPTED' || value.contractOffer?.status !== 'ACCEPTED') throw new Error('O clube e o jogador devem aceitar antes da assinatura.')
  const terms = value.contractOffer.terms
  const expected = playerContractExpectations(session, value.playerId, value.buyingClubId)
  if (evaluateContract(terms, expected).status !== 'ACCEPTED') throw new Error('Os termos precisam ser renegociados.')
  validateContractPayroll(session, value.playerId, value.buyingClubId, terms.salaryCents)
  const { seller, player } = lookup(session, value.playerId)
  if (seller.club.id !== value.sellingClubId || value.buyingClubId === value.sellingClubId) throw new Error('Clubes da transferência inconsistentes.')
  const fee = budget(session, value.buyingClubId, value.offeredFee.cents, contractPayroll(session, value.playerId, value.buyingClubId, terms.salaryCents).total)
  const buyer = session.teams.find(team => team.club.id === value.buyingClubId)!
  if (buyer.players.some(item => item.id === player.id) || buyer.club.playerIds.includes(player.id)) throw new Error('Jogador duplicado no comprador.')
  const sellerLineup = removeFromLineup(seller, player.id)
  const moved = createPlayer({ ...player, clubId: buyer.club.id })
  const teams = session.teams.map(team => {
    if (team.club.id === seller.club.id) return Object.freeze({ ...team, players: Object.freeze(team.players.filter(item => item.id !== player.id)), lineup: sellerLineup,
      club: createClub({ ...team.club, playerIds: team.club.playerIds.filter(id => id !== player.id), finances: { ...team.club.finances, cashBalance: addMoney(team.club.finances.cashBalance, fee), transferBudget: addMoney(team.club.finances.transferBudget, fee) } }) })
    if (team.club.id === buyer.club.id) return Object.freeze({ ...team, players: Object.freeze([...team.players, moved]), lineup: createLineup({ ...team.lineup, bench: [...team.lineup.bench, player.id] }),
      club: createClub({ ...team.club, playerIds: [...team.club.playerIds, player.id], finances: { ...team.club.finances, cashBalance: subtractMoney(team.club.finances.cashBalance, fee), transferBudget: subtractMoney(team.club.finances.transferBudget, fee) } }) })
    return team
  })
  for (const team of teams.filter(team => [seller.club.id, buyer.club.id].includes(team.club.id))) {
    const validation = validateTeamSelection(team.lineup, team.tactics, team)
    if (!validation.valid) throw new Error('Transferência produziria uma escalação inválida.')
  }
  const date = session.game.calendar.currentDate
  const oldContract = marketContract(session, player.id)
  const contract = createContract({ id: `transfer-contract-${id}` as ContractId, playerId: player.id, clubId: buyer.club.id, startDate: date, endDate: contractEndDate(date, terms.years), salary: createMoneyFromCents(terms.salaryCents), squadRole: terms.squadRole, status: 'ACTIVE' })
  const market: TransferMarket = { ...session.market, listedPlayerIds: session.market.listedPlayerIds.filter(id => id !== player.id), negotiations: session.market.negotiations.map(item => Object.freeze({ ...item, status: item.negotiationId === id ? 'COMPLETED' as const : item.playerId === player.id && ['PENDING', 'COUNTERED', 'CLUB_ACCEPTED'].includes(item.status) ? 'CANCELLED' as const : item.status })),
    history: [...session.market.history, Object.freeze({ negotiationId: id, playerId: player.id, fromClubId: seller.club.id, toClubId: buyer.club.id, fee, date })], contracts: [...session.market.contracts.map(item => item.id === oldContract?.id ? createContract({ ...item, status: 'TERMINATED' }) : item), contract] }
  const financialTransactions = Object.freeze([...session.financialTransactions,
    Object.freeze({ id: `purchase-${id}`, type: 'PLAYER_PURCHASE' as const, clubId: buyer.club.id, date, amount: fee, playerId: player.id, transferId: id, description: `Contratação de ${player.displayName} · ${seller.club.name}` }),
    Object.freeze({ id: `sale-${id}`, type: 'PLAYER_SALE' as const, clubId: seller.club.id, date, amount: fee, playerId: player.id, transferId: id, description: `Venda de ${player.displayName} · ${buyer.club.name}` }),
  ])
  return update(Object.freeze({ ...session, teams: Object.freeze(teams), starterSlots: undefined, financialTransactions }), market)
}

export interface MarketFilters { name: string; position: string; club: string; minAge?: number; maxAge?: number; minOverall?: number; maxValueCents?: number; order: 'name' | 'age' | 'overall' | 'value' }
export function queryTransferMarket(session: PrototypeSession, filters: MarketFilters) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
  const owned = session.teams.flatMap(team => team.players.map(player => ({ player, club: team.club, age: playerAge(player, session.game.calendar.currentDate), overall: playerOverall(player), contract: marketContract(session, player.id), listed: session.market.listedPlayerIds.includes(player.id) })))
  const free = session.freeAgents.map(player => ({ player, club: undefined, age: playerAge(player, session.game.calendar.currentDate), overall: playerOverall(player), contract: undefined, listed: false }))
  return [...owned, ...free]
    .filter(row => normalize(row.player.displayName).includes(normalize(filters.name.trim())) && (filters.position === 'ALL' || row.player.primaryPosition === filters.position || row.player.secondaryPositions.some(position => position === filters.position)) && (filters.club === 'ALL' || (filters.club === 'FREE_AGENT' ? !row.club : row.club?.id === filters.club)) && row.age >= (filters.minAge ?? 0) && row.age <= (filters.maxAge ?? Infinity) && row.overall >= (filters.minOverall ?? 0) && row.player.marketValue.cents <= (filters.maxValueCents ?? Infinity))
    .sort((a, b) => (filters.order === 'overall' ? b.overall - a.overall : filters.order === 'age' ? a.age - b.age : filters.order === 'value' ? a.player.marketValue.cents - b.player.marketValue.cents : 0) || a.player.displayName.localeCompare(b.player.displayName, 'pt-BR'))
}

