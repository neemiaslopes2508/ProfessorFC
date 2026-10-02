import { createDevelopmentFixture } from '../src/data/fixtures/development'
import { loadGameData } from '../src/data'
import { FORMATION_POSITIONS } from '../src/domain/tactics'
import { createSeededRandomSource } from '../src/core/random'
import { createLeagueSeason, getLeagueStandings } from '../src/competitions'
import { registerLeagueMatchResult } from '../src/application/registerLeagueMatchResult'
import { simulateMatch } from '../src/simulation'
import type { SimulationTeam } from '../src/simulation'

/** Demonstração exclusivamente fictícia, escalações explícitas e sem IA/progressão. */
export function createDevelopmentLeagueSetup() {
  const loaded = loadGameData(createDevelopmentFixture(), 'development')
  if (!loaded.ok) throw new Error('Fixture inválida.')
  const { repositories } = loaded
  const clubs = repositories.clubs.getAll()
  const teams = new Map(clubs.map(club => {
    const startingPlayers = [0, 2, 6, 7, 4, 10, 12, 13, 16, 17, 18].map(index => club.playerIds[index])
    const team: SimulationTeam = {
      club, players: repositories.players.getAll().filter(player => player.clubId === club.id),
      lineup: { startingPlayers, bench: club.playerIds.filter(id => !startingPlayers.includes(id)),
        positions: FORMATION_POSITIONS['4-3-3'].map((position, index) => ({ playerId: startingPlayers[index], position })) },
      tactics: { formation: '4-3-3', mentality: 'BALANCED', style: 'BALANCED' },
    }
    return [club.id, team] as const
  }))
  const league = createLeagueSeason(repositories.competitions.getAll()[0], repositories.competitionSeasons.getAll()[0])
  return { league, teams }
}

export function simulateDevelopmentLeague(baseSeed = 2026) {
  if (!Number.isSafeInteger(baseSeed) || baseSeed < 0 || baseSeed > 0xffffffff - 29) throw new Error('Seed-base inválida para as 30 partidas.')
  const setup = createDevelopmentLeagueSetup()
  const { teams } = setup
  let league = setup.league
  for (const [index, fixture] of league.fixtures.entries()) {
    const result = simulateMatch({ home: teams.get(fixture.homeClubId)!, away: teams.get(fixture.awayClubId)!,
      random: createSeededRandomSource((Math.imul(baseSeed + index, 2654435761)) >>> 0), context: { neutralVenue: false } })
    league = registerLeagueMatchResult(league, fixture.id, result).league
  }
  const standings = getLeagueStandings(league).map(row => ({ ...row, club: teams.get(row.clubId)!.club.name }))
  return { baseSeed, seedRecipe: 'uint32(imul(baseSeed + matchIndex, 2654435761))',
    season: league.season, rounds: Math.max(...league.fixtures.map(fixture => fixture.round)), matches: league.results.length,
    standings, champion: teams.get(league.season.championId!)!.club.name,
    results: league.results.map(result => ({ fixture: league.fixtures.find(fixture => fixture.id === result.matchId), score: result.score })),
  }
}
