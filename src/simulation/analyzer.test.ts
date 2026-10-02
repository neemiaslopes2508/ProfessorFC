import { describe, expect, it } from 'vitest'
import { analyzeScenario, createAnalyzerScenarios } from '../../scripts/simulationAnalyzer'

describe('avaliação estatística de desenvolvimento', () => {
  const scenarios = createAnalyzerScenarios()

  it('reproduz agregados e conserva a amostra nas distribuições', () => {
    const first = analyzeScenario(scenarios[0], 120)
    const second = analyzeScenario(scenarios[0], 120)
    expect({ ...first, elapsedMs: 0 }).toEqual({ ...second, elapsedMs: 0 })
    for (const distribution of [first.goalBuckets, first.exactGoals, first.scorelines, first.outcomes]) {
      expect(Object.values(distribution).reduce((sum, count) => sum + count, 0)).toBe(120)
    }
    expect(first.invariantViolations).toBe(0)
    expect(first.means.possession.total).toBeCloseTo(100)
    expect(() => analyzeScenario(scenarios[0], 0)).toThrow()
    expect(() => analyzeScenario(scenarios[0], 2, 0xffffffff)).toThrow()
  })

  it('preserva vantagem do forte nos dois mandos, empates e zebras', () => {
    const home = analyzeScenario(scenarios[1], 1000)
    const away = analyzeScenario(scenarios[2], 1000)
    expect(home.outcomePercent.homeWins).toBeGreaterThan(50)
    expect(away.outcomePercent.awayWins).toBeGreaterThan(50)
    for (const report of [home, away]) {
      expect(report.outcomes.draws).toBeGreaterThan(0)
      expect(report.upsets.wins).toBeGreaterThan(0)
      expect(report.invariantViolations).toBe(0)
      expect(report.goalBuckets['6+']).toBeLessThan(report.matches / 2)
    }
  })

  it('mantém simetria por identidade e vantagem de mando limitada entre iguais', () => {
    const home = analyzeScenario(scenarios[4], 1000)
    const reversed = analyzeScenario(scenarios[5], 1000)
    const neutral = analyzeScenario(scenarios[6], 1000)
    expect(home.outcomes).toEqual(reversed.outcomes)
    expect(Math.abs(neutral.outcomePercent.homeWins - neutral.outcomePercent.awayWins)).toBeLessThan(15)
    const effect = home.outcomePercent.homeWins - neutral.outcomePercent.homeWins
    expect(effect).toBeGreaterThan(0)
    expect(effect).toBeLessThan(15)
  })
})
