import { assertIntegerRange, assertOneOf, assertUnique } from '../core/validation'
import type { ClubId } from '../core/ids'
import type { LeagueRules, LeagueSeason, LeagueStanding, StandingStats } from './types'

export const DEFAULT_LEAGUE_RULES: LeagueRules = Object.freeze({
  tieBreakers: Object.freeze(['points', 'wins', 'goalDifference', 'goalsFor'].map(field =>
    Object.freeze({ field: field as keyof StandingStats, direction: 'desc' as const }))),
  positionOutcomes: Object.freeze([Object.freeze({ position: 1, outcomes: Object.freeze(['champion' as const]) })]),
})
export const LEAGUE_POINTS = Object.freeze({ win: 3, draw: 1, loss: 0 })

export function createLeagueRules(rules: LeagueRules, clubs: number): LeagueRules {
  if (!rules.tieBreakers.length) throw new Error('Informe pelo menos um critério de classificação.')
  assertUnique(rules.tieBreakers.map(criterion => criterion.field), 'Critérios de classificação')
  for (const criterion of rules.tieBreakers) {
    assertOneOf(criterion.field, ['points', 'wins', 'draws', 'losses', 'played', 'goalsFor', 'goalsAgainst', 'goalDifference'], 'Critério')
    assertOneOf(criterion.direction, ['asc', 'desc'], 'Direção do critério')
  }
  assertUnique(rules.positionOutcomes.map(rule => String(rule.position)), 'Posições com destinos')
  for (const rule of rules.positionOutcomes) {
    assertIntegerRange(rule.position, 1, clubs, 'Posição com destino')
    assertUnique(rule.outcomes, 'Destinos da posição')
    rule.outcomes.forEach(outcome => assertOneOf(outcome, ['champion', 'promotion', 'relegation', 'qualification'], 'Destino'))
    if (rule.outcomes.includes('champion') && rule.position !== 1) throw new Error('Campeão deve ser o primeiro colocado.')
  }
  return Object.freeze({
    tieBreakers: Object.freeze(rules.tieBreakers.map(criterion => Object.freeze({ ...criterion }))),
    positionOutcomes: Object.freeze(rules.positionOutcomes.map(rule => Object.freeze({ ...rule, outcomes: Object.freeze([...rule.outcomes]) }))),
  })
}

/** Retorna cópia ordenada; ID é fallback estável quando todos os critérios empatam. */
export function rankLeagueStandings(rows: readonly (StandingStats & { readonly clubId: ClubId })[], rules: LeagueRules): readonly LeagueStanding[] {
  return Object.freeze([...rows].sort((a, b) => {
    for (const criterion of rules.tieBreakers) {
      const difference = a[criterion.field] - b[criterion.field]
      if (difference) return criterion.direction === 'asc' ? difference : -difference
    }
    return a.clubId < b.clubId ? -1 : a.clubId > b.clubId ? 1 : 0
  }).map((row, index) => Object.freeze({
    ...row, position: index + 1,
    outcomes: Object.freeze([...(rules.positionOutcomes.find(rule => rule.position === index + 1)?.outcomes ?? [])]),
  })))
}

export function getLeagueStandings(league: LeagueSeason): readonly LeagueStanding[] {
  const rows = new Map(league.season.participantClubIds.map(clubId => [clubId, {
    clubId, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
  }]))
  const fixtures = new Map(league.fixtures.map(fixture => [fixture.id, fixture]))
  for (const result of league.results) {
    const fixture = fixtures.get(result.matchId)!
    for (const [clubId, goalsFor, goalsAgainst] of [
      [fixture.homeClubId, result.score.homeGoals, result.score.awayGoals],
      [fixture.awayClubId, result.score.awayGoals, result.score.homeGoals],
    ] as const) {
      const row = rows.get(clubId)!
      row.played++
      row.goalsFor += goalsFor
      row.goalsAgainst += goalsAgainst
      row.goalDifference = row.goalsFor - row.goalsAgainst
      if (goalsFor > goalsAgainst) { row.wins++; row.points += LEAGUE_POINTS.win }
      else if (goalsFor === goalsAgainst) { row.draws++; row.points += LEAGUE_POINTS.draw }
      else { row.losses++; row.points += LEAGUE_POINTS.loss }
      for (const value of [row.played, row.goalsFor, row.goalsAgainst, row.goalDifference, row.points]) {
        if (!Number.isSafeInteger(value)) throw new Error('Estatística da liga excedeu um inteiro seguro.')
      }
    }
  }
  return rankLeagueStandings([...rows.values()], league.rules)
}
