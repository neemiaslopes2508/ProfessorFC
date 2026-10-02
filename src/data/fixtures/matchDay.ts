import { createSeededRandomSource } from '../../core/random'
import type { Club } from '../../domain/clubs'

/** Ambientação fictícia de desenvolvimento. Não representa bilheteria, receita ou dado oficial. */
const SETTINGS = Object.freeze({ capacity: 25000, baseOccupancy: 0.42, reputationWeight: 0.35, importanceWeight: 0.12, seedVariation: 0.12, minOccupancy: 0.35, maxOccupancy: 0.98 })

export function developmentMatchAtmosphere(home: Club, away: Club, round: number, totalRounds: number, matchId: string) {
  let seed = 2166136261
  for (const character of matchId) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0
  // Fonte exclusiva da apresentação: nunca consome a aleatoriedade do MatchEngine.
  const random = createSeededRandomSource(seed)
  const reputation = (home.reputation + away.reputation) / 200
  const importance = Math.min(1, round / Math.max(1, totalRounds))
  const occupancy = Math.max(SETTINGS.minOccupancy, Math.min(SETTINGS.maxOccupancy,
    SETTINGS.baseOccupancy + reputation * SETTINGS.reputationWeight + importance * SETTINGS.importanceWeight + (random.next() - 0.5) * SETTINGS.seedVariation))
  return { stadiumName: `Arena ${home.name}`, capacity: SETTINGS.capacity, attendance: Math.round(SETTINGS.capacity * occupancy), fictional: true as const }
}
