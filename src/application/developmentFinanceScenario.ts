import { createClub } from '../domain/clubs'
import { createMoneyFromCents } from '../core/money'
import type { PrototypeSession } from './prototypeSession'
import { STADIUM_EXPANSION_CONFIG } from '../finance/stadium'

/** Apenas estado inicial fictício para QA local; ativação da UI restrita a import.meta.env.DEV. */
export function developmentFinanceScenario(session: PrototypeSession, scenario: string | null): PrototypeSession {
  if (scenario === 'facilities-short') return Object.freeze({ ...session, facilityConfig: Object.freeze({ ...session.facilityConfig, definitions: Object.freeze(session.facilityConfig.definitions.map(item => Object.freeze({ ...item, levels: Object.freeze(item.levels.map(level => Object.freeze({ ...level, upgradeDays: level.upgradeDays ? 1 : 0 }))) }))) }) })
  if (scenario === 'stadium-expansion-short') return Object.freeze({ ...session, stadiumExpansionConfig: Object.freeze(Object.fromEntries(Object.entries(STADIUM_EXPANSION_CONFIG).map(([id, rule]) => [id, Object.freeze({ ...rule, days: 1 })]))) })
  if (scenario !== 'critical' && scenario !== 'payroll') return session
  return Object.freeze({ ...session, teams: Object.freeze(session.teams.map(team => team.club.id === session.game.humanClubId ? Object.freeze({ ...team, club: createClub({ ...team.club, finances: { ...team.club.finances, ...(scenario === 'critical' ? { cashBalance: createMoneyFromCents(50000) } : { wageBudget: createMoneyFromCents(1000000) }) } }) }) : team)) })
}
