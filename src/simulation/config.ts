import type { PlayerAttributes, Position } from '../domain/players'
import type { Formation, Mentality, Style } from '../domain/tactics'

export interface MatchEngineConfig {
  readonly minutes: number
  readonly homeAdvantage: number
  readonly baseChanceRate: number
  readonly foulRate: number
  readonly cardRate: number
  readonly cornerRate: number
  readonly baseOnTargetRate: number
  readonly baseConversionRate: number
}

export const DEFAULT_MATCH_ENGINE_CONFIG: MatchEngineConfig = Object.freeze({
  minutes: 90, homeAdvantage: 0.03, baseChanceRate: 0.28,
  foulRate: 0.28, cardRate: 0.18, cornerRate: 0.25,
  baseOnTargetRate: 0.44, baseConversionRate: 0.24,
})

/** Regras da sessão, separadas dos parâmetros probabilísticos do motor. */
export interface MatchSessionRules { readonly maxSubstitutions: number }
export const DEFAULT_MATCH_SESSION_RULES: MatchSessionRules = Object.freeze({ maxSubstitutions: 5 })
export function resolveMatchSessionRules(input: Partial<MatchSessionRules> = {}): MatchSessionRules {
  const rules = { ...DEFAULT_MATCH_SESSION_RULES, ...input }
  if (!Number.isSafeInteger(rules.maxSubstitutions) || rules.maxSubstitutions < 0 || rules.maxSubstitutions > 11) {
    throw new Error('Limite de substituições deve ser inteiro entre 0 e 11.')
  }
  return Object.freeze(rules)
}

export interface TacticalModifiers {
  readonly defense: number
  readonly midfield: number
  readonly attack: number
  readonly foulRisk: number
}

const modifiers = (defense: number, midfield: number, attack: number, foulRisk = 1): TacticalModifiers =>
  Object.freeze({ defense, midfield, attack, foulRisk })

export const FORMATION_MODIFIERS: Readonly<Record<Formation, TacticalModifiers>> = Object.freeze({
  '4-4-2': modifiers(1, 1, 1), '4-3-3': modifiers(0.98, 1, 1.03),
  '4-2-3-1': modifiers(1, 1.03, 0.98), '3-5-2': modifiers(0.97, 1.03, 1),
  '5-3-2': modifiers(1.04, 1, 0.96),
  // Catálogo 9.2: sem bônus adicional até avaliação própria; posições já influenciam os setores.
  '4-1-4-1': modifiers(1, 1, 1), '4-3-2-1': modifiers(1, 1, 1),
  '4-2-2-2': modifiers(1, 1, 1), '4-1-2-1-2': modifiers(1, 1, 1),
  '3-4-3': modifiers(1, 1, 1), '3-4-2-1': modifiers(1, 1, 1),
  '5-2-3': modifiers(1, 1, 1), '5-4-1': modifiers(1, 1, 1),
  '4-3-1-2': modifiers(1, 1, 1), '4-5-1': modifiers(1, 1, 1),
})
export const MENTALITY_MODIFIERS: Readonly<Record<Mentality, TacticalModifiers>> = Object.freeze({
  DEFENSIVE: modifiers(1.05, 1, 0.94), BALANCED: modifiers(1, 1, 1), ATTACKING: modifiers(0.94, 1, 1.05),
})
export const STYLE_MODIFIERS: Readonly<Record<Style, TacticalModifiers>> = Object.freeze({
  POSSESSION: modifiers(1, 1.05, 0.97, 0.95), BALANCED: modifiers(1, 1, 1),
  COUNTER_ATTACK: modifiers(1, 0.94, 1.05), PRESSING: modifiers(1.02, 1.04, 0.99, 1.15),
})

type AttributeWeights = Partial<PlayerAttributes>
export const POSITION_ATTRIBUTE_WEIGHTS: Readonly<Record<Position, AttributeWeights>> = Object.freeze({
  GK: { defending: 0.45, decision: 0.3, physical: 0.15, stamina: 0.1 },
  RB: { defending: 0.3, pace: 0.25, stamina: 0.2, passing: 0.15, decision: 0.1 },
  LB: { defending: 0.3, pace: 0.25, stamina: 0.2, passing: 0.15, decision: 0.1 },
  CB: { defending: 0.5, physical: 0.25, decision: 0.15, pace: 0.1 },
  DM: { defending: 0.3, passing: 0.3, decision: 0.25, stamina: 0.15 },
  CM: { passing: 0.4, technique: 0.25, decision: 0.2, stamina: 0.15 },
  AM: { passing: 0.3, technique: 0.3, finishing: 0.2, decision: 0.2 },
  RW: { pace: 0.3, technique: 0.3, finishing: 0.25, passing: 0.15 },
  LW: { pace: 0.3, technique: 0.3, finishing: 0.25, passing: 0.15 },
  ST: { finishing: 0.5, decision: 0.2, technique: 0.2, physical: 0.1 },
})

export interface PositionContribution {
  readonly defense: number
  readonly midfield: number
  readonly attack: number
  readonly offensiveParticipation: number
  readonly foulParticipation: number
}
export const POSITION_CONTRIBUTIONS: Readonly<Record<Position, PositionContribution>> = Object.freeze({
  GK: { defense: 1, midfield: 0.1, attack: 0, offensiveParticipation: 0, foulParticipation: 0.05 },
  RB: { defense: 0.7, midfield: 0.3, attack: 0.1, offensiveParticipation: 0.3, foulParticipation: 1 },
  LB: { defense: 0.7, midfield: 0.3, attack: 0.1, offensiveParticipation: 0.3, foulParticipation: 1 },
  CB: { defense: 1, midfield: 0.1, attack: 0, offensiveParticipation: 0.15, foulParticipation: 1.3 },
  DM: { defense: 0.6, midfield: 1, attack: 0.2, offensiveParticipation: 0.5, foulParticipation: 1.3 },
  CM: { defense: 0.2, midfield: 1, attack: 0.4, offensiveParticipation: 0.8, foulParticipation: 1 },
  AM: { defense: 0.1, midfield: 0.7, attack: 1, offensiveParticipation: 1.1, foulParticipation: 0.6 },
  RW: { defense: 0.1, midfield: 0.4, attack: 1, offensiveParticipation: 1.3, foulParticipation: 0.5 },
  LW: { defense: 0.1, midfield: 0.4, attack: 1, offensiveParticipation: 1.3, foulParticipation: 0.5 },
  ST: { defense: 0, midfield: 0.2, attack: 1, offensiveParticipation: 1.6, foulParticipation: 0.4 },
})

/** Limites e normalizações internos centralizados, sem parâmetros dispersos nas fórmulas. */
export const ENGINE_FACTORS = Object.freeze({
  attributeScale: 100, referenceStrength: 50, emergencyGoalkeeperFactor: 0.4,
  fitnessFloor: 0.65, fitnessInfluence: 0.35, formFloor: 0.8, formInfluence: 0.2,
  outOfPosition: 0.9, minPossession: 0.25, maxPossession: 0.75,
  strengthRatioExponent: 0.5,
  minChance: 0.02, maxChance: 0.6, minOnTarget: 0.15, maxOnTarget: 0.8,
  minConversion: 0.05, maxConversion: 0.65, possessionPrecision: 10,
})

export function resolveMatchEngineConfig(overrides: Partial<MatchEngineConfig> = {}): MatchEngineConfig {
  const config = { ...DEFAULT_MATCH_ENGINE_CONFIG, ...overrides }
  if (!Number.isSafeInteger(config.minutes) || config.minutes < 1 || config.minutes > 180) {
    throw new Error('Duração deve ser um inteiro de 1 a 180 minutos.')
  }
  for (const [field, value] of Object.entries(config)) {
    if (field === 'minutes') continue
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(`${field} deve ser finito entre 0 e 1.`)
    }
  }
  if (config.homeAdvantage > 0.1) throw new Error('Vantagem de mando deve ser pequena: máximo 0.1.')
  return Object.freeze(config)
}
