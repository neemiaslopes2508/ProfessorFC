import { describe, expect, it } from 'vitest'
import { createId } from '../core/ids'
import { createDevelopmentFixture } from '../data/fixtures/development'
import type { LeagueFixture, LeagueMatchResult, StandingStats } from './types'
import { createLeagueSeason, recordLeagueMatch } from './league'
import { generateLeagueFixtures } from './fixtures'
import { DEFAULT_LEAGUE_RULES, getLeagueStandings, rankLeagueStandings } from './standings'
import { simulateDevelopmentLeague } from '../../scripts/developmentLeague'

const data = createDevelopmentFixture()
const definition = data.competitions[0]
const edition = data.competitionSeasons[0]
const initial = () => createLeagueSeason(definition, edition)

function result(fixture: LeagueFixture, home = 0, away = 0): LeagueMatchResult {
  const goals = [{ clubId: fixture.homeClubId, goals: home }, { clubId: fixture.awayClubId, goals: away }]
  return {
    score: { homeGoals: home, awayGoals: away },
    events: goals.flatMap(team => Array.from({ length: team.goals }, (_, index) => ({ minute: 1 + index,
      clubId: team.clubId, type: 'GOAL' as const }))).sort((a, b) => a.minute - b.minute),
    statistics: { possession: { home: 50, away: 50 }, shots: { home, away }, shotsOnTarget: { home, away },
      corners: { home: 0, away: 0 }, fouls: { home: 0, away: 0 }, yellowCards: { home: 0, away: 0 }, redCards: { home: 0, away: 0 } },
  }
}

describe('liga genérica', () => {
  it('gera 30 jogos em dez rodadas com pares e mandos completos, sem conflitos', () => {
    const league = initial()
    expect(league.fixtures).toEqual(generateLeagueFixtures(edition.id, [...edition.participantClubIds].reverse(), 2))
    expect(league.fixtures).toHaveLength(30)
    expect(new Set(league.fixtures.map(match => match.id)).size).toBe(30)
    for (let round = 1; round <= 10; round++) {
      const matches = league.fixtures.filter(match => match.round === round)
      expect(matches).toHaveLength(3)
      expect(new Set(matches.flatMap(match => [match.homeClubId, match.awayClubId])).size).toBe(6)
    }
    for (const clubId of edition.participantClubIds) {
      const matches = league.fixtures.filter(match => match.homeClubId === clubId || match.awayClubId === clubId)
      expect(matches).toHaveLength(10)
      expect(matches.filter(match => match.homeClubId === clubId)).toHaveLength(5)
      expect(new Set(matches.map(match => match.homeClubId === clubId ? match.awayClubId : match.homeClubId)).size).toBe(5)
    }
    for (const match of league.fixtures.filter(match => match.leg === 1)) {
      expect(match.homeClubId).not.toBe(match.awayClubId)
      expect(league.fixtures.filter(other => other.homeClubId === match.homeClubId && other.awayClubId === match.awayClubId)).toHaveLength(1)
      expect(league.fixtures.find(other => other.leg === 2 && other.round === match.round + 5 && other.homeClubId === match.awayClubId && other.awayClubId === match.homeClubId)).toBeDefined()
    }
  })

  it('suporta turno único e participantes ímpares com folgas, rejeitando entradas inválidas', () => {
    const clubs = edition.participantClubIds.slice(0, 5)
    const matches = generateLeagueFixtures(edition.id, clubs, 1)
    expect(matches).toHaveLength(10)
    for (const clubId of clubs) expect(matches.filter(match => match.homeClubId === clubId || match.awayClubId === clubId)).toHaveLength(4)
    for (let round = 1; round <= 5; round++) {
      const roundMatches = matches.filter(match => match.round === round)
      expect(roundMatches).toHaveLength(2)
      expect(new Set(roundMatches.flatMap(match => [match.homeClubId, match.awayClubId])).size).toBe(4)
    }
    expect(new Set(matches.map(match => [match.homeClubId, match.awayClubId].sort().join('|'))).size).toBe(10)
    expect(() => generateLeagueFixtures(edition.id, [clubs[0], clubs[0]])).toThrow()
    expect(() => generateLeagueFixtures(edition.id, [clubs[0]])).toThrow()
  })

  it('aceita somente edição inicial de liga única e regras válidas', () => {
    expect(() => createLeagueSeason({ ...definition, type: 'KNOCKOUT' }, edition)).toThrow()
    expect(() => createLeagueSeason({ ...definition, format: { legs: 2, groupCount: 2 } }, edition)).toThrow()
    expect(() => createLeagueSeason(definition, { ...edition, competitionId: createId('Competition', 'other') })).toThrow()
    expect(() => createLeagueSeason(definition, { ...edition, status: 'FINISHED' })).toThrow()
    expect(() => createLeagueSeason(definition, edition, { tieBreakers: [], positionOutcomes: [] })).toThrow()
    expect(() => createLeagueSeason(definition, edition, { ...DEFAULT_LEAGUE_RULES, positionOutcomes: [{ position: 7, outcomes: ['promotion'] }] })).toThrow()
  })

  it('atualiza J/V/E/D, gols, saldo e pontuação 3/1/0 sem alterar o estado anterior', () => {
    const original = initial()
    const first = original.fixtures[0]
    const second = original.fixtures.find(match => match.id !== first.id && match.homeClubId === first.homeClubId)!
    const once = recordLeagueMatch(original, first.id, result(first, 2, 1))
    const twice = recordLeagueMatch(once, second.id, result(second, 1, 1))
    const row = getLeagueStandings(twice).find(row => row.clubId === first.homeClubId)!
    expect(row).toMatchObject({ played: 2, wins: 1, draws: 1, losses: 0, goalsFor: 3, goalsAgainst: 2, goalDifference: 1, points: 4 })
    expect(getLeagueStandings(twice).find(row => row.clubId === first.awayClubId)).toMatchObject({ losses: 1, goalsFor: 1, goalsAgainst: 2, points: 0 })
    expect(getLeagueStandings(original).every(row => row.played === 0)).toBe(true)
    expect(original.season.status).toBe('SCHEDULED')
    expect(twice.season.status).toBe('IN_PROGRESS')
    expect(twice.season.championId).toBeUndefined()
  })

  it('aplica hierarquia completa de desempates, fallback estável e critérios configurados', () => {
    const base: StandingStats = { played: 5, wins: 2, draws: 2, losses: 1, goalsFor: 6, goalsAgainst: 4, goalDifference: 2, points: 8 }
    const row = (id: string, patch: Partial<StandingStats> = {}) => ({ ...base, ...patch, clubId: createId('Club', id) })
    const rows = [row('z'), row('a'), row('goals', { goalsFor: 7 }), row('difference', { goalDifference: 3 }), row('wins', { wins: 3 }), row('points', { points: 9 })]
    expect(rankLeagueStandings(rows, DEFAULT_LEAGUE_RULES).map(row => row.clubId)).toEqual(['points', 'wins', 'difference', 'goals', 'a', 'z'])
    const rules = { tieBreakers: [{ field: 'goalsFor', direction: 'desc' }], positionOutcomes: [] } as const
    expect(rankLeagueStandings(rows, rules)[0].clubId).toBe('goals')
  })

  it('bloqueia duplicação, partida externa e resultados inconsistentes sem contaminar a tabela', () => {
    const original = initial()
    const fixture = original.fixtures[0]
    const played = recordLeagueMatch(original, fixture.id, result(fixture, 1, 0))
    expect(() => recordLeagueMatch(played, fixture.id, result(fixture))).toThrow(/já contabilizada/)
    expect(() => recordLeagueMatch(original, createId('Match', 'foreign'), result(fixture))).toThrow(/não pertence/)
    expect(() => recordLeagueMatch(original, fixture.id, { ...result(fixture, 1), events: [] })).toThrow(/inconsistente/)
    const external = { ...result(fixture, 1), events: [{ type: 'GOAL' as const, minute: 1, clubId: createId('Club', 'external') }] }
    expect(() => recordLeagueMatch(original, fixture.id, external)).toThrow(/externo/)
    const reversed = { ...result(fixture, 2), events: [...result(fixture, 2).events].reverse() }
    expect(() => recordLeagueMatch(original, fixture.id, reversed)).toThrow(/cronológica/)
    expect(original.results).toHaveLength(0)
    expect(played.results).toHaveLength(1)
  })

  it('copia resultados e regras e prepara destinos posicionais sem movimentar clubes', () => {
    const positions = [{ position: 1, outcomes: ['champion', 'qualification'] as ('champion' | 'qualification')[] },
      { position: 2, outcomes: ['promotion'] as ('promotion')[] }, { position: 6, outcomes: ['relegation'] as ('relegation')[] }]
    const original = createLeagueSeason(definition, edition, { ...DEFAULT_LEAGUE_RULES, positionOutcomes: positions })
    const fixture = original.fixtures[0]
    const input = result(fixture, 1)
    const mutableScore = { ...input.score }
    const played = recordLeagueMatch(original, fixture.id, { ...input, score: mutableScore })
    mutableScore.homeGoals = 99
    positions[0].outcomes.length = 0
    expect(played.results[0].score.homeGoals).toBe(1)
    const rows = getLeagueStandings(played)
    expect(rows[0].outcomes).toEqual(['champion', 'qualification'])
    expect(rows[1].outcomes).toEqual(['promotion'])
    expect(rows[5].outcomes).toEqual(['relegation'])
    expect(edition.status).toBe('SCHEDULED')
    expect(data.clubs.map(club => club.id)).toEqual(edition.participantClubIds)
  })

  it('executa e reproduz temporada completa com o motor, encerrando com campeão e totais íntegros', () => {
    const report = simulateDevelopmentLeague(2026)
    expect(report).toEqual(simulateDevelopmentLeague(2026))
    expect(report).toMatchObject({ matches: 30, rounds: 10, season: { status: 'FINISHED', championId: report.standings[0].clubId } })
    for (const row of report.standings) {
      expect(row.played).toBe(10)
      expect(row.wins + row.draws + row.losses).toBe(10)
      expect(row.points).toBe(row.wins * 3 + row.draws)
      expect(row.goalDifference).toBe(row.goalsFor - row.goalsAgainst)
    }
    const sum = (field: keyof StandingStats) => report.standings.reduce((total, row) => total + row[field], 0)
    expect(sum('wins')).toBe(sum('losses'))
    expect(sum('goalsFor')).toBe(sum('goalsAgainst'))
    expect(sum('goalDifference')).toBe(0)
    expect(sum('points')).toBe(90 - sum('draws') / 2)
    let league = initial()
    for (const fixture of league.fixtures) league = recordLeagueMatch(league, fixture.id, result(fixture))
    expect(league.season.championId).toBe([...edition.participantClubIds].sort()[0])
    expect(() => recordLeagueMatch(league, league.fixtures[0].id, result(league.fixtures[0]))).toThrow(/já contabilizada/)
  })
})
