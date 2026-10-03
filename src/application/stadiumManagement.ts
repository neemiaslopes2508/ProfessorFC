import type { MatchId } from '../core/ids'
import { addGameDays } from '../core/date'
import { createMoneyFromCents, subtractMoney } from '../core/money'
import { createClub } from '../domain/clubs'
import type { PrototypeSession } from './prototypeSession'
import { getLeagueStandings } from '../competitions'
import { STADIUM_EXPANSION_CONFIG, STADIUM_EXPANSION_MAX_LEVEL, stadiumAttendance, validateStadium } from '../finance/stadium'
import type { Stadium } from '../finance/stadium'

export function matchStadiumAttendance(session: PrototypeSession, matchId: MatchId, final = false, override?: Stadium) {
  const recorded = session.financialTransactions.find(item => item.type === 'MATCH_TICKETS' && item.matchId === matchId)?.stadiumAttendance
  const fixed = session.matchAdmissions.find(item => item.matchId === matchId)
  if (!override && (recorded || fixed)) return recorded ?? fixed!
  const entry = session.game.competitions.find(item => item.league.fixtures.some(fixture => fixture.id === matchId))
  const fixture = entry?.league.fixtures.find(item => item.id === matchId)
  if (!entry || !fixture) throw new Error('Partida desconhecida para bilheteria.')
  const home = session.teams.find(team => team.club.id === fixture.homeClubId)!.club
  const away = session.teams.find(team => team.club.id === fixture.awayClubId)!.club
  const stadium = override ?? session.stadiums.find(item => item.clubId === home.id)
  if (!stadium || stadium.clubId !== home.id) throw new Error('Estádio do mandante inexistente.')
  // Somente rodadas anteriores: posição não muda entre prévia e liquidação da mesma rodada.
  const earlier = entry.league.results.filter(result => entry.league.fixtures.find(item => item.id === result.matchId)!.round < fixture.round)
  const standings = getLeagueStandings({ ...entry.league, results: earlier })
  const position = standings.find(row => row.clubId === home.id)!.position
  return stadiumAttendance(stadium, { homeReputation: home.reputation, awayReputation: away.reputation, importance: fixture.round / Math.max(...entry.league.fixtures.map(item => item.round)), standingStrength: earlier.length ? (standings.length - position) / Math.max(1, standings.length - 1) : .5 }, matchId, final)
}
export function lockMatchAdmission(session: PrototypeSession, matchId: MatchId): PrototypeSession {
  if (session.matchAdmissions.some(item => item.matchId === matchId)) return session
  return Object.freeze({ ...session, matchAdmissions: Object.freeze([...session.matchAdmissions, matchStadiumAttendance(session, matchId, true)]) })
}
export function saveStadiumPrices(session: PrototypeSession, prices: readonly { id: string; priceCents: number }[]): PrototypeSession {
  if (session.liveMatch || session.pendingMatch) throw new Error('Conclua e confirme a partida antes de alterar os preços.')
  const stadium = session.stadiums.find(item => item.clubId === session.game.humanClubId)!
  if (prices.length !== stadium.sectors.length || new Set(prices.map(item => item.id)).size !== prices.length || prices.some(item => !stadium.sectors.some(sector => sector.id === item.id))) throw new Error('Preços devem corresponder aos setores do estádio.')
  const updated = Object.freeze({ ...stadium, sectors: Object.freeze(stadium.sectors.map(sector => Object.freeze({ ...sector, priceCents: prices.find(item => item.id === sector.id)!.priceCents }))) })
  validateStadium(updated)
  return Object.freeze({ ...session, stadiums: Object.freeze(session.stadiums.map(item => item.clubId === stadium.clubId ? updated : item)) })
}
export function stadiumExpansionOptions(session: PrototypeSession, sectorId: string) {
  const stadium = session.stadiums.find(item => item.clubId === session.game.humanClubId)
  const sector = stadium?.sectors.find(item => item.id === sectorId)
  if (!stadium || !sector) throw new Error('Setor inexistente no estádio do clube.')
  const stadiumLevel = session.facilities.find(item => item.clubId === stadium.clubId && item.type === 'STADIUM')?.level ?? 1
  const expansionLevel = sector.expansionLevel ?? 0
  const rule = session.stadiumExpansionConfig[sector.id] ?? STADIUM_EXPANSION_CONFIG[sector.id]
  if (!rule) throw new Error('Setor sem configuração de expansão.')
  const canExpand = !sector.construction && expansionLevel < stadiumLevel && expansionLevel < STADIUM_EXPANSION_MAX_LEVEL
  const step = expansionLevel + 1
  return Object.freeze({
    sector, stadiumLevel, maximumCapacity: sector.capacity + Math.max(0, stadiumLevel - expansionLevel) * rule.increment,
    targetCapacity: canExpand ? sector.capacity + rule.increment : undefined,
    costCents: canExpand ? rule.baseCostCents * step : undefined,
    days: canExpand ? rule.days + (step - 1) * 30 : undefined,
    maintenanceCents: canExpand ? rule.maintenancePerStepCents * step : undefined,
    inConstruction: !!sector.construction,
  })
}
export function startStadiumSectorExpansion(session: PrototypeSession, sectorId: string): PrototypeSession {
  if (session.liveMatch || session.pendingMatch) throw new Error('Conclua e confirme a partida antes de iniciar uma expansão.')
  const option = stadiumExpansionOptions(session, sectorId)
  if (option.inConstruction) throw new Error('Este setor já está em obras.')
  if (!option.targetCapacity || option.costCents === undefined || option.days === undefined || option.maintenanceCents === undefined) throw new Error('O setor atingiu o limite permitido pelo nível estrutural do estádio.')
  const team = session.teams.find(item => item.club.id === session.game.humanClubId)!
  if (team.club.finances.cashBalance.cents < option.costCents) throw new Error('Caixa insuficiente para expandir este setor.')
  const date = session.game.calendar.currentDate
  const construction = Object.freeze({ startedAt: date, completionDate: addGameDays(date, option.days), targetCapacity: option.targetCapacity, targetExpansionLevel: (option.sector.expansionLevel ?? 0) + 1, maintenanceCents: option.maintenanceCents })
  const next = Object.freeze({ ...session,
    teams: Object.freeze(session.teams.map(item => item.club.id === team.club.id ? Object.freeze({ ...item, club: createClub({ ...item.club, finances: { ...item.club.finances, cashBalance: subtractMoney(item.club.finances.cashBalance, createMoneyFromCents(option.costCents!)) } }) }) : item)),
    stadiums: Object.freeze(session.stadiums.map(stadium => stadium.clubId !== team.club.id ? stadium : Object.freeze({ ...stadium, sectors: Object.freeze(stadium.sectors.map(sector => sector.id === sectorId ? Object.freeze({ ...sector, construction }) : sector)) }))),
    financialTransactions: Object.freeze([...session.financialTransactions, Object.freeze({ id: `stadium-expansion-${team.club.id}-${sectorId}-${construction.targetExpansionLevel}`, type: 'STADIUM_EXPANSION' as const, clubId: team.club.id, date, amount: createMoneyFromCents(option.costCents), description: `Expansão do estádio — ${option.sector.name} · ${option.sector.capacity.toLocaleString('pt-BR')} → ${option.targetCapacity.toLocaleString('pt-BR')} lugares` })]),
  })
  validateStadium(next.stadiums.find(item => item.clubId === team.club.id)!)
  return next
}
export function stadiumOverview(session: PrototypeSession, override?: Stadium) {
  const stadium = override ?? session.stadiums.find(item => item.clubId === session.game.humanClubId)!
  const entry = session.game.competitions.flatMap(item => item.schedule.matches.map(match => ({ match: { ...item.league.fixtures.find(fixture => fixture.id === match.matchId)!, ...match }, league: item.league }))).filter(({ match }) => match.homeClubId === stadium.clubId && !session.game.competitions.some(item => item.league.results.some(result => result.matchId === match.matchId))) .sort((a, b) => a.match.date.localeCompare(b.match.date))[0]
  const last = session.financialTransactions.filter(item => item.type === 'MATCH_TICKETS' && item.clubId === stadium.clubId).sort((a, b) => b.date.localeCompare(a.date))[0]?.stadiumAttendance
  return { stadium, nextMatch: entry?.match, estimate: entry ? matchStadiumAttendance(session, entry.match.matchId, false, override) : undefined, last }
}
