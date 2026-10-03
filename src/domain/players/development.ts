import type { PlayerAttributes } from './attributes'

export const TRAINING_FOCUSES = ['BALANCED', 'PHYSICAL', 'TECHNICAL', 'OFFENSIVE', 'DEFENSIVE', 'YOUTH'] as const
export type TrainingFocus = typeof TRAINING_FOCUSES[number]
export type TrainableAttribute = keyof PlayerAttributes

export const TRAINING_CONFIG = Object.freeze({
  processingDay: 1, baseGrowthChance: 0.12, maxGrowthChance: 0.4,
  ageGrowth: Object.freeze([{ through: 21, bonus: 0.16 }, { through: 25, bonus: 0.08 }, { through: 30, bonus: 0 }, { through: 34, bonus: -0.06 }]),
  declineStartAge: 35, declineBaseChance: 0.08, declinePerYear: 0.025, maxDeclineChance: 0.35,
  potentialGapScale: 0.004, formScale: 0.001, fitnessFloor: 0.5,
  trainingCenterChancePerLevel: 0.04, injuredActivity: 0.1, recoveringActivity: 0.5,
  youthFacilityChancePerLevel: 0.055,
})

export const TRAINING_ATTRIBUTES: Readonly<Record<TrainingFocus, readonly TrainableAttribute[]>> = Object.freeze({
  BALANCED: Object.freeze(['finishing', 'passing', 'technique', 'defending', 'pace', 'physical', 'stamina', 'decision'] as TrainableAttribute[]),
  PHYSICAL: Object.freeze(['pace', 'physical', 'stamina'] as TrainableAttribute[]),
  TECHNICAL: Object.freeze(['passing', 'technique', 'decision'] as TrainableAttribute[]),
  OFFENSIVE: Object.freeze(['finishing', 'passing', 'technique'] as TrainableAttribute[]),
  DEFENSIVE: Object.freeze(['defending', 'physical', 'decision'] as TrainableAttribute[]),
  YOUTH: Object.freeze(['finishing', 'passing', 'technique', 'defending', 'pace', 'physical', 'stamina', 'decision'] as TrainableAttribute[]),
})
