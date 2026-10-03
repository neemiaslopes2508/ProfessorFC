import type { Club } from '../../domain/clubs'
import type { Stadium } from '../../finance/stadium'

export const DEVELOPMENT_STADIUM_SECTORS = Object.freeze([
  Object.freeze({ id: 'popular', name: 'Popular', capacity: 10000, priceCents: 3500, referencePriceCents: 3500 }),
  Object.freeze({ id: 'stands', name: 'Arquibancada', capacity: 9000, priceCents: 6000, referencePriceCents: 6000 }),
  Object.freeze({ id: 'central', name: 'Central', capacity: 4000, priceCents: 10000, referencePriceCents: 10000 }),
  Object.freeze({ id: 'vip', name: 'VIP', capacity: 2000, priceCents: 25000, referencePriceCents: 25000 }),
])
/** Estádios fictícios exclusivos do protótipo; preços são estado da sessão, não GameData. */
export function createDevelopmentStadiums(clubs: readonly Club[]): readonly Stadium[] {
  return Object.freeze(clubs.map(club => Object.freeze({ clubId: club.id, name: `Arena ${club.name}`, capacity: DEVELOPMENT_STADIUM_SECTORS.reduce((sum, sector) => sum + sector.capacity, 0), sectors: DEVELOPMENT_STADIUM_SECTORS })))
}
