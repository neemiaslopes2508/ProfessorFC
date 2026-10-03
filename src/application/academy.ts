import type { ClubId, PlayerId } from '../core/ids'
import { createId } from '../core/ids'
import { deriveSeed, createSeededRandomSource } from '../core/random'
import { createMoneyFromCents } from '../core/money'
import { createPlayer } from '../domain/players'
import { createPlayerAttributes } from '../domain/players/attributes'
import { POSITIONS } from '../domain/players/position'
import type { Player, Position } from '../domain/players'
import { calculatePlayerStrength } from '../simulation/strength'
import { humanTeam, playerAge } from './prototypeSession'
import type { PrototypeSession } from './prototypeSession'

export type AcademyStatus = 'ACADEMY' | 'PROMOTED' | 'RELEASED'
export interface AcademyRecord {
  readonly player: Player
  readonly academyClubId: ClubId
  readonly status: AcademyStatus
  readonly joinedAt: string
  readonly promotedAt?: string
  readonly releasedAt?: string
}
export interface AcademyWindow { readonly key: string; readonly date: string }

const WINDOWS = ['04-01', '09-01'] as const
const FIRST_NAMES = ['Alex', 'Breno', 'Caíque', 'Davi', 'Erick', 'Felipe', 'Gael', 'Heitor', 'Igor', 'João', 'Kaique', 'Lucas', 'Murilo', 'Nicolas', 'Otávio', 'Pedro', 'Ravi', 'Samuel', 'Tiago', 'Vitor'] as const
const LAST_NAMES = ['Alvorada', 'Brisa', 'Cedro', 'Dourado', 'Estrela', 'Falcão', 'Garoa', 'Horizonte', 'Ipê', 'Jatobá', 'Luar', 'Mirante', 'Nascente', 'Oliveira', 'Pereira', 'Queiroz', 'Ribeiro', 'Sabiá', 'Ventura', 'Vale'] as const
const SECONDARY: Readonly<Partial<Record<Position, readonly Position[]>>> = Object.freeze({
  GK: ['GK'], RB: ['LB', 'CB'], LB: ['RB', 'CB'], CB: ['DM', 'RB'], DM: ['CM', 'CB'], CM: ['DM', 'AM'], AM: ['CM', 'RW'], RW: ['LW', 'ST'], LW: ['RW', 'ST'], ST: ['AM', 'RW'],
})

export function academyWindows(year: number): readonly AcademyWindow[] {
  return Object.freeze(WINDOWS.map((monthDay, index) => Object.freeze({ key: `${year}-${index + 1}`, date: `${year}-${monthDay}` })))
}
export function nextAcademyDate(session: PrototypeSession): string | undefined {
  const year = Number(session.game.calendar.currentDate.slice(0, 4))
  return [...academyWindows(year), ...academyWindows(year + 1)]
    .map(window => window.date).filter(date => date > session.game.calendar.currentDate).sort()[0]
}
function integer(random: ReturnType<typeof createSeededRandomSource>, min: number, max: number) { return min + Math.floor(random.next() * (max - min + 1)) }
function potential(random: ReturnType<typeof createSeededRandomSource>, level: number): number {
  const talentChance = 0.025 + (level - 1) * 0.012
  const goodChance = 0.18 + (level - 1) * 0.025
  const roll = random.next()
  if (roll < talentChance) return integer(random, 78, 86)
  if (roll < talentChance + goodChance) return integer(random, 66, 77)
  return integer(random, 52, 65)
}
function createAcademyPlayer(clubId: ClubId, seed: number, season: number, window: number, index: number, level: number, date: string): Player {
  const windowSeed = deriveSeed(seed, `academy:${clubId}:${season}:${window}`)
  const random = createSeededRandomSource(deriveSeed(windowSeed, `prospect:${index}`))
  const age = integer(random, 15, 18)
  const position = POSITIONS[integer(random, 0, POSITIONS.length - 1)]
  const pot = potential(random, level)
  const core = integer(random, 34 + (age - 15) * 2, 48 + (age - 15) * 2) + Math.max(0, Math.floor((pot - 65) / 10))
  const attributes = {
    finishing: core - (position === 'ST' || position === 'RW' || position === 'LW' ? 0 : 5),
    passing: core + (['CM', 'AM', 'DM'].includes(position) ? 3 : 0),
    technique: core + (['RW', 'LW', 'AM', 'CM'].includes(position) ? 3 : 0),
    defending: core + (['CB', 'RB', 'LB', 'DM'].includes(position) ? 5 : -4),
    pace: core + (['RW', 'LW', 'RB', 'LB'].includes(position) ? 5 : 0),
    physical: core + (['CB', 'ST', 'DM'].includes(position) ? 4 : 0),
    stamina: core + (['CM', 'RB', 'LB', 'RW', 'LW'].includes(position) ? 3 : 0),
    decision: core + (['CM', 'DM', 'AM', 'CB', 'GK'].includes(position) ? 2 : -2),
  }
  const firstName = FIRST_NAMES[integer(random, 0, FIRST_NAMES.length - 1)]
  const lastName = LAST_NAMES[integer(random, 0, LAST_NAMES.length - 1)]
  const id = createId('Player', `academy-${clubId}-${season}-${window}-${index}`) as PlayerId
  const birthMonth = integer(random, 1, Math.max(1, Number(date.slice(5, 7)) - 1))
  let player = createPlayer({
    id, firstName, lastName, displayName: `${firstName} ${lastName}`,
    birthDate: `${season - age}-${String(birthMonth).padStart(2, '0')}-${String(integer(random, 1, 28)).padStart(2, '0')}`,
    nationality: 'Brasileiro', preferredFoot: (['LEFT', 'RIGHT', 'BOTH'] as const)[integer(random, 0, 2)],
    primaryPosition: position, secondaryPositions: Object.freeze([...(SECONDARY[position] ?? [])].filter(item => item !== position).slice(0, 1)),
    attributes: createPlayerAttributes(Object.fromEntries(Object.entries(attributes).map(([key, value]) => [key, Math.max(1, Math.min(65, value))])) as typeof attributes),
    potential: pot, form: 65, fitness: 100, clubId: null, marketValue: createMoneyFromCents(0), status: 'AVAILABLE',
    metadata: Object.freeze({ source: 'fictional-academy', fictional: true, academyClubId: clubId, academyJoinedAt: date }),
  })
  while (Math.round(calculatePlayerStrength(player, position).attributeStrength) > pot) {
    const lowered = Object.fromEntries(Object.entries(player.attributes).map(([key, value]) => [key, Math.max(1, value - 1)])) as typeof attributes
    player = createPlayer({ ...player, attributes: createPlayerAttributes(lowered) })
  }
  return player
}

export function activeAcademyPlayers(session: PrototypeSession): readonly AcademyRecord[] {
  return Object.freeze(session.academy.filter(record => record.status === 'ACADEMY' && record.academyClubId === session.game.humanClubId))
}
export function academyPotentialLabel(value: number): string {
  if (value < 55) return 'Baixo'
  if (value < 66) return 'Regular'
  if (value < 74) return 'Bom'
  if (value < 81) return 'Muito bom'
  return 'Excelente'
}
export function generateAcademyIntake(session: PrototypeSession, date = session.game.calendar.currentDate): PrototypeSession {
  const year = Number(date.slice(0, 4))
  const window = academyWindows(year).find(item => item.date === date)
  if (!window || session.academyWindows.includes(window.key)) return session
  const club = humanTeam(session).club
  const level = session.facilities.find(facility => facility.clubId === club.id && facility.type === 'YOUTH')?.level ?? 1
  const count = 1 + Math.floor((level + 1) / 2)
  const windowIndex = Number(window.key.slice(-1))
  const records = Array.from({ length: count }, (_, index) => Object.freeze({
    player: createAcademyPlayer(club.id, session.careerSeed, year, windowIndex, index, level, date),
    academyClubId: club.id, status: 'ACADEMY' as const, joinedAt: date,
  }))
  return Object.freeze({ ...session, academy: Object.freeze([...session.academy, ...records]), academyWindows: Object.freeze([...session.academyWindows, window.key]) })
}
export function promoteAcademyPlayer(session: PrototypeSession, playerId: PlayerId): PrototypeSession {
  if (session.liveMatch || session.pendingMatch) throw new Error('Conclua a partida antes de promover um atleta.')
  const record = session.academy.find(item => item.player.id === playerId && item.status === 'ACADEMY' && item.academyClubId === session.game.humanClubId)
  if (!record) throw new Error('Atleta ativo da base não encontrado.')
  const clubId = record.academyClubId
  const player = createPlayer({ ...record.player, clubId })
  const teams = session.teams.map(team => team.club.id !== clubId ? team : Object.freeze({ ...team, club: Object.freeze({ ...team.club, playerIds: Object.freeze([...team.club.playerIds, playerId]) }), players: Object.freeze([...team.players, player]) }))
  return Object.freeze({ ...session, teams: Object.freeze(teams), academy: Object.freeze(session.academy.map(item => item === record ? Object.freeze({ ...item, player, status: 'PROMOTED' as const, promotedAt: session.game.calendar.currentDate }) : item)) })
}
export function releaseAcademyPlayer(session: PrototypeSession, playerId: PlayerId): PrototypeSession {
  const record = session.academy.find(item => item.player.id === playerId && item.status === 'ACADEMY' && item.academyClubId === session.game.humanClubId)
  if (!record) throw new Error('Atleta ativo da base não encontrado.')
  return Object.freeze({ ...session, academy: Object.freeze(session.academy.map(item => item === record ? Object.freeze({ ...item, status: 'RELEASED' as const, releasedAt: session.game.calendar.currentDate }) : item)) })
}
export function academyAge(record: AcademyRecord, date: string) { return playerAge(record.player, date) }
