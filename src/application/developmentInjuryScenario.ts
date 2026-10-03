import type { PrototypeSession } from './prototypeSession'
import { humanTeam } from './prototypeSession'
import { INJURY_CATALOG } from '../domain/players/injury'

/** QA local: UMA lesão muscular no primeiro jogo humano, sem sorteio nem espera. */
export function developmentInjuryScenario(session: PrototypeSession, scenario: string | null): PrototypeSession {
  if (scenario !== 'short' && scenario !== 'medical') return session
  const team = humanTeam(session)
  const playerId = team.lineup.positions.find(slot => slot.position === 'ST')!.playerId
  return Object.freeze({ ...session,
    facilities: scenario === 'medical' ? Object.freeze(session.facilities.map(item => item.type === 'MEDICAL' && item.clubId === team.club.id ? Object.freeze({ ...item, level: 5 }) : item)) : session.facilities,
    matchInjuryOptions: Object.freeze({ perPlayerMinuteRate: 0, forced: Object.freeze({ minute: 1, playerId, definition: INJURY_CATALOG[1], baseDays: 5 }) }),
  })
}
