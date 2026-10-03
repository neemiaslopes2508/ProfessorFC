import type { ClubId, MatchId } from '../core/ids'
import { assertIntegerRange, assertUnique, assertNonEmptyString } from '../core/validation'
import { createMoneyFromCents, assertNonNegativeMoney } from '../core/money'
import { createSeededRandomSource } from '../core/random'

export interface StadiumSector { readonly id: string; readonly name: string; readonly capacity: number; readonly priceCents: number; readonly referencePriceCents: number; readonly expansionLevel?: number; readonly maintenanceCents?: number; readonly construction?: StadiumSectorConstruction }
export interface StadiumSectorConstruction { readonly startedAt: string; readonly completionDate: string; readonly targetCapacity: number; readonly targetExpansionLevel: number; readonly maintenanceCents: number }
export interface Stadium { readonly clubId: ClubId; readonly name: string; readonly capacity: number; readonly sectors: readonly StadiumSector[] }
export interface StadiumSectorExpansionRule { readonly baseCapacity: number; readonly increment: number; readonly baseCostCents: number; readonly days: number; readonly maintenancePerStepCents: number }
export const STADIUM_EXPANSION_CONFIG: Readonly<Record<string, StadiumSectorExpansionRule>> = Object.freeze({
  popular: Object.freeze({ baseCapacity: 10000, increment: 2000, baseCostCents: 200000000, days: 90, maintenancePerStepCents: 1000000 }),
  stands: Object.freeze({ baseCapacity: 9000, increment: 2000, baseCostCents: 300000000, days: 120, maintenancePerStepCents: 1500000 }),
  central: Object.freeze({ baseCapacity: 4000, increment: 1000, baseCostCents: 500000000, days: 150, maintenancePerStepCents: 2500000 }),
  vip: Object.freeze({ baseCapacity: 2000, increment: 500, baseCostCents: 800000000, days: 180, maintenancePerStepCents: 4000000 }),
})
export type StadiumExpansionConfig = Readonly<Record<string, StadiumSectorExpansionRule>>
export const STADIUM_EXPANSION_MAX_LEVEL = 5
export interface StadiumDemandContext { readonly homeReputation: number; readonly awayReputation: number; readonly importance: number; readonly standingStrength: number }
export const STADIUM_DEMAND_CONFIG = Object.freeze({ baseOccupancy: .42, reputationWeight: .3, importanceWeight: .12, standingWeight: .1, priceSensitivity: .55, minimumOccupancy: .08, maximumOccupancy: .98, finalVariation: .04, highPriceRatio: 1.5 })
export function validateStadium(stadium: Stadium) {
  assertNonEmptyString(stadium.name, 'Nome do estádio')
  assertIntegerRange(stadium.capacity, 1, Number.MAX_SAFE_INTEGER, 'Capacidade do estádio')
  if (!stadium.sectors.length) throw new Error('Estádio precisa de setores.')
  assertUnique(stadium.sectors.map(sector => sector.id), 'IDs dos setores')
  for (const sector of stadium.sectors) {
    assertNonEmptyString(sector.id, 'ID do setor'); assertNonEmptyString(sector.name, 'Nome do setor')
    assertIntegerRange(sector.capacity, 1, Number.MAX_SAFE_INTEGER, 'Capacidade do setor')
    assertIntegerRange(sector.expansionLevel ?? 0, 0, STADIUM_EXPANSION_MAX_LEVEL, 'Nível de expansão do setor')
    assertIntegerRange(sector.maintenanceCents ?? 0, 0, Number.MAX_SAFE_INTEGER, 'Manutenção do setor')
    const expansion = STADIUM_EXPANSION_CONFIG[sector.id]
    if (expansion && sector.capacity > expansion.baseCapacity + (sector.expansionLevel ?? 0) * expansion.increment) throw new Error('Capacidade do setor ultrapassa seu nível de expansão.')
    if (sector.construction) {
      assertIntegerRange(sector.construction.targetCapacity, sector.capacity + 1, Number.MAX_SAFE_INTEGER, 'Capacidade após a obra')
      assertIntegerRange(sector.construction.targetExpansionLevel, (sector.expansionLevel ?? 0) + 1, STADIUM_EXPANSION_MAX_LEVEL, 'Nível após a obra')
      assertIntegerRange(sector.construction.maintenanceCents, 0, Number.MAX_SAFE_INTEGER, 'Manutenção adicional')
      if (expansion && sector.construction.targetCapacity > expansion.baseCapacity + sector.construction.targetExpansionLevel * expansion.increment) throw new Error('Capacidade da obra ultrapassa o limite do setor.')
    }
    assertNonNegativeMoney(createMoneyFromCents(sector.priceCents), 'Preço do ingresso')
    assertIntegerRange(sector.referencePriceCents, 1, Number.MAX_SAFE_INTEGER, 'Preço de referência')
  }
  if (stadium.sectors.reduce((sum, sector) => sum + sector.capacity, 0) !== stadium.capacity) throw new Error('Soma dos setores deve corresponder à capacidade do estádio.')
}
export function stadiumAttendance(stadium: Stadium, context: StadiumDemandContext, matchId: MatchId, final = false) {
  validateStadium(stadium)
  for (const [key, value] of Object.entries(context)) if (!Number.isFinite(value) || value < 0 || value > (key.includes('Reputation') ? 100 : 1)) throw new Error('Contexto de demanda inválido.')
  let seed = 2166136261
  for (const character of `stadium-${matchId}`) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0
  const random = createSeededRandomSource(seed)
  const config = STADIUM_DEMAND_CONFIG
  const base = config.baseOccupancy + (context.homeReputation + context.awayReputation) / 200 * config.reputationWeight + context.importance * config.importanceWeight + context.standingStrength * config.standingWeight
  const sectors = stadium.sectors.map(sector => {
    const priceRatio = sector.priceCents / sector.referencePriceCents
    // Dobrar o preço reduz a demanda gradualmente; ingresso gratuito pode lotar o setor.
    const demand = base / (1 + config.priceSensitivity * (priceRatio - 1)) + (final ? (random.next() - .5) * 2 * config.finalVariation : 0)
    const attendance = Math.min(sector.capacity, Math.round(sector.capacity * Math.max(config.minimumOccupancy, Math.min(config.maximumOccupancy, demand))))
    return Object.freeze({ ...sector, attendance, occupancy: attendance / sector.capacity, revenueCents: createMoneyFromCents(attendance * sector.priceCents).cents, highPrice: priceRatio > config.highPriceRatio })
  })
  const attendance = sectors.reduce((sum, sector) => sum + sector.attendance, 0)
  return Object.freeze({ matchId, clubId: stadium.clubId, stadiumName: stadium.name, capacity: stadium.capacity, attendance, occupancy: attendance / stadium.capacity, revenueCents: createMoneyFromCents(sectors.reduce((sum, sector) => sum + sector.revenueCents, 0)).cents, sectors: Object.freeze(sectors), final, fictional: true as const })
}
export type StadiumAttendance = ReturnType<typeof stadiumAttendance>
