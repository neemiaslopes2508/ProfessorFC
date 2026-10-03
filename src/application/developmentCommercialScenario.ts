import { addGameDays } from '../core/date'
import type { PrototypeSession } from './prototypeSession'

/** Cenário local curto para validar pagamento e meta financeira sem percorrer temporada. */
export function developmentCommercialScenario(session: PrototypeSession, scenario: string | null): PrototypeSession {
  if (scenario !== 'short') return session
  const startDate = addGameDays(session.game.calendar.currentDate, 1)
  const endDate = addGameDays(startDate, 1)
  const offers = session.commercial.offers.map((offer, index) => index !== 0 ? offer : Object.freeze({ ...offer,
    startDate, endDate, durationSeasons: 1 as const, signingBonusCents: Math.max(offer.signingBonusCents, 1_000_000),
    objective: Object.freeze({ type: 'FINANCIAL_HEALTH' as const, bonusCents: 2_000_000 }),
  }))
  return Object.freeze({ ...session, commercial: Object.freeze({ ...session.commercial, offers: Object.freeze(offers) }) })
}
